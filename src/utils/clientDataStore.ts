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

import type {
  User,
  ExecutiveReport,
  ExecutiveReportCategory,
  ExecutiveReportGroup,
  ExecutiveReportSection,
  ExecutiveReportShareTargetType,
} from '../types';

type ChangeListener = (key: string) => void;

const collections = new Map<string, any>();
const preferences = new Map<string, any>();
const schoolSettingsByTenant = new Map<string, Record<string, any>>();
const listeners = new Set<ChangeListener>();

let sessionUser: User | null = null;
let inMemorySessionToken: string | null = null;
let activeTenantId: string = 'tenant-riara';
let isSuperAdminSession = false;
let activeVlabPass: any | null = null;
let hydrated = false;
let hydratingPromise: Promise<void> | null = null;
let sseSource: EventSource | null = null;

export const ACTIVE_SWITCHED_ROLE_PREF_KEY = 'edusmart_active_switched_role_v1';
const SWITCHED_ROLE_SESSION_PREFIX = 'edusmart_active_switched_role_user_';

function readSessionSwitchedRole(userId?: string | null): string | null {
  if (!userId || typeof window === 'undefined') return null;
  try {
    const val = window.sessionStorage.getItem(`${SWITCHED_ROLE_SESSION_PREFIX}${userId}`);
    return val && val.trim() ? val.trim() : null;
  } catch {
    return null;
  }
}

function writeSessionSwitchedRole(userId: string | null | undefined, role: string | null): void {
  if (!userId || typeof window === 'undefined') return;
  try {
    const storageKey = `${SWITCHED_ROLE_SESSION_PREFIX}${userId}`;
    if (role && role.trim()) {
      window.sessionStorage.setItem(storageKey, role.trim());
    } else {
      window.sessionStorage.removeItem(storageKey);
    }
  } catch {
    // ignore storage quota or private mode errors
  }
}

function clearAllSessionSwitchedRoles(): void {
  if (typeof window === 'undefined') return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const k = window.sessionStorage.key(i);
      if (k && k.startsWith(SWITCHED_ROLE_SESSION_PREFIX)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => window.sessionStorage.removeItem(k));
  } catch {
    // ignore
  }
}

export interface PrintableCredentialUser {
  id: string;
  name: string;
  email: string;
  password: string | null;
  passwordStatus: 'verified' | 'reset_required';
  role: string;
  roleLabel: string;
  identifier: string;
  admissionNumber: string;
  staffNumber: string;
  tscNumber: string;
  phone: string;
  grade: string | number;
  stream: string;
  designation: string;
  department: string;
  isActive: boolean;
}

export interface PrintableCredentialSchool {
  schoolId: string;
  schoolName: string;
  shortName: string;
  code: string;
  domain: string;
  email: string;
  motto: string;
  location: string;
  primaryColor: string;
  logoUrl: string;
  schoolAccount: {
    id: string;
    email: string;
    domain: string;
    password: string | null;
    passwordStatus: 'verified' | 'reset_required';
  } | null;
  totalUsers: number;
  users: PrintableCredentialUser[];
}

export interface PrintableCredentialsResponse {
  success: boolean;
  generatedAt: string;
  generatedBy: string;
  schools: PrintableCredentialSchool[];
}

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
        if (payload?.type === 'settings:updated') {
          void ClientDataStore.loadSchoolSettings(payload?.tenantId && payload.tenantId !== 'global' ? payload.tenantId : activeTenantId);
        }
        if (col === 'executive_reports' || col === 'executive_report_groups') {
          window.dispatchEvent(new CustomEvent('executive-reports-updated', { detail: payload }));
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
        if (sessionUser?.id) {
          const prefRole = preferences.get(ACTIVE_SWITCHED_ROLE_PREF_KEY);
          if (typeof prefRole === 'string' && prefRole.trim()) {
            writeSessionSwitchedRole(sessionUser.id, prefRole.trim());
          } else if (prefRole === null) {
            writeSessionSwitchedRole(sessionUser.id, null);
          }
        }
        isSuperAdminSession = Boolean(body.isSuperAdmin);
        activeVlabPass = body.activeVlabPass || null;
        if (body.activeTenantId) {
          activeTenantId = String(body.activeTenantId);
        } else if (sessionUser?.schoolId) {
          activeTenantId = sessionUser.schoolId;
        }

        if (body.schoolSettings && typeof body.schoolSettings === 'object') {
          schoolSettingsByTenant.set(activeTenantId, body.schoolSettings);
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

  getActiveSwitchedRole(userId?: string | null): string | null {
    const targetUserId = userId || sessionUser?.id || null;
    if (preferences.has(ACTIVE_SWITCHED_ROLE_PREF_KEY)) {
      const prefVal = preferences.get(ACTIVE_SWITCHED_ROLE_PREF_KEY);
      if (typeof prefVal === 'string' && prefVal.trim()) {
        return prefVal.trim();
      }
      if (prefVal === null) {
        return null;
      }
    }
    return readSessionSwitchedRole(targetUserId);
  },

  setActiveSwitchedRole(role: string | null, userId?: string | null): void {
    const targetUserId = userId || sessionUser?.id || null;
    const normalized = role && role.trim() ? role.trim() : null;
    writeSessionSwitchedRole(targetUserId, normalized);
    this.setPreference(ACTIVE_SWITCHED_ROLE_PREF_KEY, normalized);
  },

  subscribe(listener: ChangeListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  async uploadFile(
    file: File,
    category: string = 'general'
  ): Promise<{ id: string; url: string; originalName: string; mimeType: string; sizeBytes: number }> {
    const MAX_BYTES = 60 * 1024 * 1024;
    if (file.size === 0) {
      throw new Error('Selected file is empty.');
    }
    if (file.size > MAX_BYTES) {
      throw new Error(`File "${file.name}" exceeds the 60 MB upload limit.`);
    }

    // Prefer raw binary upload (zero base64 overhead — ideal for videos, audio, PDFs, and high-res pictures)
    try {
      const binRes = await fetch('/api/files/upload-binary', {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders({
          'Content-Type': 'application/octet-stream',
          'X-File-Name': encodeURIComponent(file.name),
          'X-Mime-Type': file.type || 'application/octet-stream',
          'X-File-Category': category,
          'X-Tenant-Id': activeTenantId,
        }),
        body: file,
      });

      if (binRes.ok) {
        const body = await binRes.json();
        if (body?.file?.url) return body.file;
      } else if (binRes.status !== 404 && binRes.status !== 405) {
        const errBody = await binRes.json().catch(() => ({}));
        throw new Error(errBody?.error || `Failed to upload file (${binRes.status})`);
      }
    } catch (err: any) {
      if (err instanceof Error && !err.message.includes('Failed to fetch')) {
        throw err;
      }
    }

    // Fallback to base64 JSON endpoint
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

  getSchoolSettings(tenantId?: string): Record<string, any> {
    const target = tenantId || activeTenantId || 'tenant-riara';
    return schoolSettingsByTenant.get(target) || {};
  },

  getSchoolSetting<T>(key: string, fallback: T, tenantId?: string): T {
    const all = this.getSchoolSettings(tenantId);
    return all[key] !== undefined ? (all[key] as T) : fallback;
  },

  async loadSchoolSettings(tenantId?: string): Promise<Record<string, any>> {
    if (!sessionUser) return {};
    const target = tenantId || activeTenantId || 'tenant-riara';
    const res = await fetch(`/api/settings?tenantId=${encodeURIComponent(target)}`, {
      credentials: 'include',
      headers: authHeaders(),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body?.error || 'Failed loading school settings');
    }
    if (body.settings && typeof body.settings === 'object') {
      schoolSettingsByTenant.set(target, body.settings);
      emitWindowEvents('school_settings');
    }
    return body.settings || {};
  },

  async loadAllSchoolSettings(): Promise<Array<{ tenantId: string; tenant: any; settings: Record<string, any> }>> {
    const res = await fetch('/api/settings?all=1', {
      credentials: 'include',
      headers: authHeaders(),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body?.error || 'Failed loading all tenant settings');
    }
    const schools = Array.isArray(body.schools) ? body.schools : [];
    for (const s of schools) {
      if (s?.tenantId && s?.settings) {
        schoolSettingsByTenant.set(s.tenantId, s.settings);
      }
    }
    return schools;
  },

  async saveSchoolSettings(params: {
    tenantId?: string;
    settingKey?: string;
    value?: any;
    settings?: Record<string, any>;
    tenantUpdates?: Record<string, any>;
  }): Promise<Record<string, any>> {
    const target = params.tenantId || activeTenantId || 'tenant-riara';
    const res = await fetch('/api/settings/school', {
      method: 'PUT',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        tenantId: target,
        settingKey: params.settingKey,
        value: params.value,
        settings: params.settings,
        tenantUpdates: params.tenantUpdates,
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body?.error || 'Failed saving school settings');
    }
    if (body.settings && typeof body.settings === 'object') {
      schoolSettingsByTenant.set(target, body.settings);
    }
    await pullSingleCollection('edusmart_all_tenants_registry');
    emitWindowEvents('school_settings');
    return body.settings || this.getSchoolSettings(target);
  },

  async apiFetchUsers(params: {
    schoolId?: string;
    search?: string;
    role?: string;
    status?: string;
  } = {}): Promise<User[]> {
    const qs = new URLSearchParams();
    if (params.schoolId) qs.set('schoolId', params.schoolId);
    if (params.search) qs.set('search', params.search);
    if (params.role && params.role !== 'all') qs.set('role', params.role);
    if (params.status && params.status !== 'all') qs.set('status', params.status);

    const res = await fetch(`/api/users${qs.toString() ? `?${qs.toString()}` : ''}`, {
      credentials: 'include',
      headers: authHeaders(),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body?.error || 'Failed loading users from database');
    }
    const list: User[] = Array.isArray(body.users) ? body.users : [];
    // Sync full unfiltered fetch into in-memory collection cache without pushing back
    if (!params.search && (!params.role || params.role === 'all') && (!params.status || params.status === 'all')) {
      if (!params.schoolId || params.schoolId === 'all' || !isSuperAdminSession) {
        collections.set('edusmart_users_v1', list);
        emitWindowEvents('edusmart_users_v1');
      } else {
        const existing = collections.get('edusmart_users_v1');
        const others = Array.isArray(existing)
          ? existing.filter((u: any) => u.schoolId !== params.schoolId)
          : [];
        collections.set('edusmart_users_v1', [...others, ...list]);
        emitWindowEvents('edusmart_users_v1');
      }
    }
    return list;
  },

  async apiCreateUser(payload: Partial<User> & { password?: string }): Promise<User> {
    const res = await fetch('/api/users', {
      method: 'POST',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body?.user) {
      throw new Error(body?.error || 'Failed creating user account');
    }
    const created: User = body.user;
    const existing = collections.get('edusmart_users_v1');
    const next = Array.isArray(existing)
      ? [...existing.filter((u: any) => u.id !== created.id), created]
      : [created];
    collections.set('edusmart_users_v1', next);
    emitWindowEvents('edusmart_users_v1');
    return created;
  },

  async apiUpdateUser(id: string, updates: Partial<User> & { password?: string }): Promise<User> {
    const res = await fetch(`/api/users/${encodeURIComponent(id)}`, {
      method: 'PUT',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(updates),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body?.user) {
      throw new Error(body?.error || 'Failed updating user account');
    }
    const updated: User = body.user;
    const existing = collections.get('edusmart_users_v1');
    if (Array.isArray(existing)) {
      const next = existing.some((u: any) => u.id === id)
        ? existing.map((u: any) => (u.id === id ? updated : u))
        : [...existing, updated];
      collections.set('edusmart_users_v1', next);
      emitWindowEvents('edusmart_users_v1');
    }
    if (sessionUser?.id === id) {
      sessionUser = { ...sessionUser, ...updated };
    }
    return updated;
  },

  async apiResetUserPassword(
    id: string,
    newPassword: string
  ): Promise<{ success: boolean; userId: string; email: string }> {
    const res = await fetch(`/api/users/${encodeURIComponent(id)}/reset-password`, {
      method: 'POST',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ newPassword }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body?.error || 'Failed resetting user password');
    }
    return body;
  },

  async apiDeleteUser(id: string): Promise<void> {
    const res = await fetch(`/api/users/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: authHeaders(),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body?.error || 'Failed deleting user account');
    }
    const existing = collections.get('edusmart_users_v1');
    if (Array.isArray(existing)) {
      collections.set(
        'edusmart_users_v1',
        existing.filter((u: any) => u.id !== id)
      );
      emitWindowEvents('edusmart_users_v1');
    }
  },

  async apiFetchPrintableCredentials(params: {
    schoolId?: string;
    role?: string;
    status?: string;
  } = {}): Promise<PrintableCredentialsResponse> {
    const qs = new URLSearchParams();
    if (params.schoolId) qs.set('schoolId', params.schoolId);
    if (params.role && params.role !== 'all') qs.set('role', params.role);
    if (params.status && params.status !== 'all') qs.set('status', params.status);

    const res = await fetch(`/api/users/printable-credentials${qs.toString() ? `?${qs.toString()}` : ''}`, {
      credentials: 'include',
      headers: authHeaders(),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body?.error || 'Failed loading printable user credentials');
    }
    return body as PrintableCredentialsResponse;
  },

  async apiFetchExecutiveReports(schoolId?: string): Promise<{
    canManage: boolean;
    reports: ExecutiveReport[];
    groups: ExecutiveReportGroup[];
    departments: Array<{ id: string; name: string; kind: string; subjects: string[]; activities: string[] }>;
  }> {
    const qs = schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : '';
    const res = await fetch(`/api/reports/executive${qs}`, {
      credentials: 'include',
      headers: authHeaders(),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body?.error || 'Failed loading executive reports');
    }
    return {
      canManage: Boolean(body.canManage),
      reports: Array.isArray(body.reports) ? body.reports : [],
      groups: Array.isArray(body.groups) ? body.groups : [],
      departments: Array.isArray(body.departments) ? body.departments : [],
    };
  },

  async apiFetchReportAudienceOptions(schoolId?: string): Promise<{
    departments: Array<{ id: string; name: string; kind: string; subjects: string[]; activities: string[] }>;
    users: Array<User & { childrenGrades?: number[] }>;
    groups: ExecutiveReportGroup[];
  }> {
    const qs = schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : '';
    const res = await fetch(`/api/reports/executive/audience-options${qs}`, {
      credentials: 'include',
      headers: authHeaders(),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body?.error || 'Failed loading share audience options');
    }
    return {
      departments: Array.isArray(body.departments) ? body.departments : [],
      users: Array.isArray(body.users) ? body.users : [],
      groups: Array.isArray(body.groups) ? body.groups : [],
    };
  },

  async apiCreateExecutiveReport(payload: {
    schoolId?: string;
    title: string;
    category: ExecutiveReportCategory;
    classification?: string;
    reportingPeriod: string;
    term?: string;
    academicYear?: string;
    summary?: string;
    sections: ExecutiveReportSection[];
    certifiedBy?: string;
    directorateLabel?: string;
    status?: 'draft' | 'published';
    shares?: Array<{
      targetType: ExecutiveReportShareTargetType;
      targetId: string;
      targetLabel: string;
      targetMeta?: Record<string, any>;
    }>;
    sharedNote?: string;
    notifyRecipients?: boolean;
  }): Promise<ExecutiveReport> {
    const res = await fetch('/api/reports/executive', {
      method: 'POST',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body?.report) {
      throw new Error(body?.error || 'Failed creating report');
    }
    window.dispatchEvent(new CustomEvent('executive-reports-updated'));
    return body.report as ExecutiveReport;
  },

  async apiUpdateExecutiveReport(
    id: string,
    payload: {
      title?: string;
      category?: ExecutiveReportCategory;
      classification?: string;
      reportingPeriod?: string;
      term?: string;
      academicYear?: string;
      summary?: string;
      sections?: ExecutiveReportSection[];
      certifiedBy?: string;
      directorateLabel?: string;
      status?: 'draft' | 'published';
      shares?: Array<{
        targetType: ExecutiveReportShareTargetType;
        targetId: string;
        targetLabel: string;
        targetMeta?: Record<string, any>;
      }>;
      sharedNote?: string;
    }
  ): Promise<ExecutiveReport> {
    const res = await fetch(`/api/reports/executive/${encodeURIComponent(id)}`, {
      method: 'PUT',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body?.report) {
      throw new Error(body?.error || 'Failed updating report');
    }
    window.dispatchEvent(new CustomEvent('executive-reports-updated'));
    return body.report as ExecutiveReport;
  },

  async apiShareExecutiveReport(
    id: string,
    payload: {
      shares: Array<{
        targetType: ExecutiveReportShareTargetType;
        targetId: string;
        targetLabel: string;
        targetMeta?: Record<string, any>;
      }>;
      sharedNote?: string;
      publish?: boolean;
      notifyRecipients?: boolean;
    }
  ): Promise<ExecutiveReport> {
    const res = await fetch(`/api/reports/executive/${encodeURIComponent(id)}/share`, {
      method: 'POST',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body?.report) {
      throw new Error(body?.error || 'Failed sharing report');
    }
    window.dispatchEvent(new CustomEvent('executive-reports-updated'));
    return body.report as ExecutiveReport;
  },

  async apiDeleteExecutiveReport(id: string): Promise<void> {
    const res = await fetch(`/api/reports/executive/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: authHeaders(),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body?.error || 'Failed deleting report');
    }
    window.dispatchEvent(new CustomEvent('executive-reports-updated'));
  },

  async apiCreateReportGroup(payload: {
    schoolId?: string;
    name: string;
    description?: string;
    memberUserIds: string[];
    memberRoles?: string[];
  }): Promise<ExecutiveReportGroup> {
    const res = await fetch('/api/reports/executive/groups', {
      method: 'POST',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body?.group) {
      throw new Error(body?.error || 'Failed creating recipient group');
    }
    window.dispatchEvent(new CustomEvent('executive-reports-updated'));
    return body.group as ExecutiveReportGroup;
  },

  async apiUpdateReportGroup(
    id: string,
    payload: {
      name?: string;
      description?: string;
      memberUserIds?: string[];
      memberRoles?: string[];
    }
  ): Promise<ExecutiveReportGroup> {
    const res = await fetch(`/api/reports/executive/groups/${encodeURIComponent(id)}`, {
      method: 'PUT',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body?.group) {
      throw new Error(body?.error || 'Failed updating recipient group');
    }
    window.dispatchEvent(new CustomEvent('executive-reports-updated'));
    return body.group as ExecutiveReportGroup;
  },

  async apiDeleteReportGroup(id: string): Promise<void> {
    const res = await fetch(`/api/reports/executive/groups/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: authHeaders(),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body?.error || 'Failed deleting recipient group');
    }
    window.dispatchEvent(new CustomEvent('executive-reports-updated'));
  },

  clearSessionOnly(): void {
    if (sessionUser?.id) {
      writeSessionSwitchedRole(sessionUser.id, null);
    }
    clearAllSessionSwitchedRoles();
    sessionUser = null;
    inMemorySessionToken = null;
    isSuperAdminSession = false;
    preferences.clear();
    schoolSettingsByTenant.clear();
  },
};

export default ClientDataStore;
