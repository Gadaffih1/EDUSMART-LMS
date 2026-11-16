/**
 * ============================================================================
 * EduSmart ClientDataStore — Database-First Authoritative In-Memory Store
 * ============================================================================
 * Replaces all localStorage / sessionStorage / IndexedDB persistence with:
 *   1. Initial hydration from GET /api/bootstrap (authenticated via HttpOnly cookie)
 *   2. Instant write-through persistence to POST /api/sync/push & PUT /api/preferences
 *   3. Real-time Server-Sent Events (/api/realtime/events) for live cross-browser sync
 * ============================================================================
 */

import type { User } from '../types';

type ChangeListener = (key: string) => void;

const collections = new Map<string, any>();
const preferences = new Map<string, any>();
const listeners = new Set<ChangeListener>();

let sessionUser: User | null = null;
let inMemorySessionToken: string | null = null;
let activeTenantId: string = 'tenant-riara';
let isSuperAdminSession = false;
let activeVlabPass: any | null = null;
let hydrated = false;
let hydratingPromise: Promise<void> | null = null;
let sseSource: EventSource | null = null;

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return inMemorySessionToken
    ? { ...extra, Authorization: `Bearer ${inMemorySessionToken}` }
    : extra;
}

// Track pending per-key pushes so rapid mutations debounce minimally while still flushing immediately
const pushTimers = new Map<string, ReturnType<typeof setTimeout>>();

function emitWindowEvents(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent('edusmart:data-changed', { detail: { key } }));
    if (key === 'edusmart_users_v1' || key === 'edusmart_students_v1' || key === 'edusmart_student_parents_v1') {
      window.dispatchEvent(new CustomEvent('users-updated'));
    } else if (key === 'edusmart_role_permissions_v1') {
      window.dispatchEvent(new CustomEvent('role-permissions-updated'));
    } else if (key === 'edusmart_all_tenants_registry' || key === 'tenants') {
      window.dispatchEvent(new CustomEvent('tenants-synced'));
    } else if (key.startsWith('edusmart_ops_')) {
      window.dispatchEvent(new CustomEvent('finance-updated'));
      window.dispatchEvent(new CustomEvent('procurement-updated'));
      window.dispatchEvent(new CustomEvent('stores-updated'));
      window.dispatchEvent(new CustomEvent('hr-updated'));
    }
  } catch {
    // SSR / non-window guard
  }
  listeners.forEach((cb) => {
    try {
      cb(key);
    } catch {
      // ignore
    }
  });
}

async function pullSingleCollection(key: string): Promise<void> {
  try {
    const res = await fetch(`/api/sync/pull?collection=${encodeURIComponent(key)}`, {
      credentials: 'include',
      headers: authHeaders(),
    });
    if (!res.ok) return;
    const body = await res.json();
    if (body && body.data !== undefined && body.data !== null) {
      collections.set(key, body.data);
      emitWindowEvents(key);
    }
  } catch (err) {
    console.warn('[ClientDataStore] failed pulling collection', key, err);
  }
}

function connectRealtimeStream(): void {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;
  if (sseSource) {
    try {
      sseSource.close();
    } catch {
      // ignore
    }
    sseSource = null;
  }

  try {
    const es = new EventSource('/api/realtime/events', { withCredentials: true });
    es.addEventListener('data-change', (evt: MessageEvent) => {
      try {
        const payload = JSON.parse(evt.data);
        const col = payload?.collection;
        if (!col) return;
        if (col === 'user_preferences') {
          void refreshPreferences();
          return;
        }
        // Pull authoritative updated collection state from central database
        void pullSingleCollection(col);
      } catch {
        // ignore parse error
      }
    });
    sseSource = es;
  } catch (err) {
    console.warn('[ClientDataStore] SSE unavailable:', err);
  }
}

async function refreshPreferences(): Promise<void> {
  if (!sessionUser) return;
  try {
    const res = await fetch('/api/preferences', {
      credentials: 'include',
      headers: authHeaders(),
    });
    if (!res.ok) return;
    const body = await res.json();
    if (body?.preferences && typeof body.preferences === 'object') {
      preferences.clear();
      for (const [k, v] of Object.entries(body.preferences)) {
        preferences.set(k, v);
      }
      emitWindowEvents('user_preferences');
    }
  } catch {
    // ignore
  }
}

async function flushCollectionPush(key: string): Promise<boolean> {
  if (!collections.has(key)) return false;
  const payload = collections.get(key);
  try {
    const res = await fetch('/api/sync/push', {
      method: 'POST',
      credentials: 'include',
      keepalive: true,
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        collection: key,
        records: payload,
        tenantId: activeTenantId,
      }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[ClientDataStore] push failed for', key, err);
    return false;
  }
}

export const ClientDataStore = {
  setSessionToken(token: string | null): void {
    inMemorySessionToken = token || null;
  },

  getSessionToken(): string | null {
    return inMemorySessionToken;
  },

  getAuthHeaders(extra: Record<string, string> = {}): Record<string, string> {
    return authHeaders(extra);
  },

  async hydrateFromBackend(force = false): Promise<void> {
    if (hydrated && !force) return;
    if (hydratingPromise && !force) return hydratingPromise;

    hydratingPromise = (async () => {
      try {
        const res = await fetch('/api/bootstrap', {
          credentials: 'include',
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error(`Bootstrap failed (${res.status})`);
        const body = await res.json();

        collections.clear();
        if (body.collections && typeof body.collections === 'object') {
          for (const [k, v] of Object.entries(body.collections)) {
            collections.set(k, v);
          }
        }

        preferences.clear();
        if (body.preferences && typeof body.preferences === 'object') {
          for (const [k, v] of Object.entries(body.preferences)) {
            preferences.set(k, v);
          }
        }

        sessionUser = body.user || null;
        isSuperAdminSession = Boolean(body.isSuperAdmin);
        activeVlabPass = body.activeVlabPass || null;
        if (body.activeTenantId) {
          activeTenantId = String(body.activeTenantId);
        } else if (sessionUser?.schoolId) {
          activeTenantId = sessionUser.schoolId;
        }

        hydrated = true;
        connectRealtimeStream();
        emitWindowEvents('*');
      } catch (err) {
        console.warn('[ClientDataStore] hydrateFromBackend error:', err);
      } finally {
        hydratingPromise = null;
      }
    })();

    return hydratingPromise;
  },

  isHydrated(): boolean {
    return hydrated;
  },

  getSessionUser(): User | null {
    return sessionUser;
  },

  setSessionUser(user: User | null): void {
    sessionUser = user;
    if (user?.schoolId) {
      activeTenantId = user.schoolId;
    }
    isSuperAdminSession = user?.accessScope === 'super_admin_only';
    connectRealtimeStream();
  },

  getActiveTenantId(): string {
    return activeTenantId;
  },

  setActiveTenantId(tenantId: string): void {
    if (tenantId) activeTenantId = tenantId;
  },

  isSuperAdmin(): boolean {
    return isSuperAdminSession;
  },

  getActiveVlabPass(): any | null {
    return activeVlabPass;
  },

  setActiveVlabPass(pass: any | null): void {
    activeVlabPass = pass;
    emitWindowEvents('vlab_pass');
  },

  async clearActiveVlabPass(): Promise<void> {
    activeVlabPass = null;
    emitWindowEvents('vlab_pass');
    try {
      await fetch('/api/vlab/tickets/clear', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // ignore network errors during clear
    }
  },

  hasCollection(key: string): boolean {
    return collections.has(key);
  },

  getCollection<T>(key: string, fallback: T): T {
    if (collections.has(key)) {
      const val = collections.get(key);
      if (val !== undefined && val !== null) {
        return val as T;
      }
    }
    return fallback;
  },

  /** Update in-memory collection immediately and persist to central backend database */
  setCollection<T>(key: string, value: T, opts: { persist?: boolean } = {}): void {
    collections.set(key, value);
    emitWindowEvents(key);

    if (opts.persist === false) return;

    const existingTimer = pushTimers.get(key);
    if (existingTimer) clearTimeout(existingTimer);

    // Near-immediate flush (15ms) coalesces bursts inside a single synchronous loop
    const timer = setTimeout(() => {
      pushTimers.delete(key);
      void flushCollectionPush(key);
    }, 15);
    pushTimers.set(key, timer);
  },

  async pushNow(key: string): Promise<boolean> {
    const existingTimer = pushTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
      pushTimers.delete(key);
    }
    return flushCollectionPush(key);
  },

  getPreference<T>(key: string, fallback: T): T {
    if (preferences.has(key)) {
      const val = preferences.get(key);
      if (val !== undefined && val !== null) return val as T;
    }
    return fallback;
  },

  setPreference<T>(key: string, value: T): void {
    preferences.set(key, value);
    if (!sessionUser) return; // Unauthenticated visitors keep transient session prefs in memory only
    void fetch('/api/preferences', {
      method: 'PUT',
      credentials: 'include',
      keepalive: true,
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ key, value }),
    }).catch((err) => {
      console.warn('[ClientDataStore] failed saving preference', key, err);
    });
  },

  subscribe(listener: ChangeListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  async uploadFile(
    file: File,
    category: string = 'general'
  ): Promise<{ id: string; url: string; originalName: string; mimeType: string; sizeBytes: number }> {
    const dataBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed reading file bytes'));
      reader.readAsDataURL(file);
    });

    const res = await fetch('/api/files/upload', {
      method: 'POST',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        dataBase64,
        category,
        tenantId: activeTenantId,
      }),
    });

    const body = await res.json();
    if (!res.ok || !body?.file?.url) {
      throw new Error(body?.error || 'Failed to upload file to server');
    }
    return body.file;
  },

  async getMySqlExportSummary(): Promise<{
    tables: Array<{ name: string; rows: number }>;
    totalTables: number;
    totalRows: number;
    dbSizeBytes: number;
    mysql?: {
      configured: boolean;
      connected: boolean;
      driver: 'mysql2' | 'sqlite-fallback';
      host: string | null;
      port: number | null;
      database: string | null;
      lastSyncedAt: string | null;
      lastError: string | null;
      syncSourceOfTruth: 'mysql' | 'local-sqlite';
    };
  }> {
    const res = await fetch('/api/admin/export-mysql/summary', {
      credentials: 'include',
      headers: authHeaders(),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body?.error || 'Failed to inspect database tables');
    }
    return body;
  },

  async syncMySqlNow(): Promise<{
    success: boolean;
    mysql?: {
      configured: boolean;
      connected: boolean;
      driver: string;
      host: string | null;
      port: number | null;
      database: string | null;
      lastSyncedAt: string | null;
      lastError: string | null;
    };
    error?: string;
  }> {
    const res = await fetch('/api/admin/mysql/sync', {
      method: 'POST',
      credentials: 'include',
      headers: authHeaders(),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body?.error || 'MySQL sync failed');
    }
    return body;
  },

  async downloadMySqlDump(): Promise<{ filename: string; tableCount: number; totalRows: number; sizeBytes: number }> {
    const res = await fetch('/api/admin/export-mysql', {
      method: 'GET',
      credentials: 'include',
      headers: authHeaders(),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody?.error || `Failed exporting MySQL dump (HTTP ${res.status})`);
    }
    const blob = await res.blob();
    const disposition = res.headers.get('Content-Disposition') || '';
    const filenameMatch = disposition.match(/filename="?([^"]+)"?/i);
    const filename =
      res.headers.get('X-EduSmart-Dump-Filename') ||
      (filenameMatch ? filenameMatch[1] : `edusmart_mysql_dump_${new Date().toISOString().slice(0, 10)}.sql`);
    const tableCount = Number(res.headers.get('X-EduSmart-Dump-Tables') || 0);
    const totalRows = Number(res.headers.get('X-EduSmart-Dump-Rows') || 0);

    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    }

    return { filename, tableCount, totalRows, sizeBytes: blob.size };
  },

  clearSessionOnly(): void {
    sessionUser = null;
    inMemorySessionToken = null;
    isSuperAdminSession = false;
    preferences.clear();
  },
};

export default ClientDataStore;
