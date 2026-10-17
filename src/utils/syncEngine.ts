/**
 * ============================================================================
 *  EduSmart SyncEngine — hybrid localStorage ⇄ Supabase persistence
 * ============================================================================
 *
 *  WHY: The app has ~770 synchronous `Storage.*` call sites that must keep
 *  returning data instantly. Supabase is async, so instead of rewriting the
 *  whole UI we keep localStorage as the synchronous read/write layer and add
 *  Supabase as a background synchronisation layer.
 *
 *  READ  : components keep calling Storage.getX()  → served from localStorage.
 *  WRITE : Storage.setX() → localStorage (instant) → markDirty(key) →
 *          debounced push to Supabase (`app_records` table, one row per record).
 *  BOOT  : main.tsx awaits hydrate() BEFORE React renders, so the first paint
 *          already contains the latest cloud data.
 *  OFFLINE: pushes stay queued (dirty set is persisted); they flush on 'online'
 *          and on a retry timer.
 *
 *  TABLE: public.app_records (collection, record_id, payload jsonb, ...)
 *         → see supabase/migrations/0001_app_records.sql
 *
 *  CONFLICT POLICY (3-way merge using the local "mirror" of last-synced state):
 *    - remote changed, local untouched      → remote wins (applied locally)
 *    - local changed, remote untouched      → local wins (pushed)
 *    - both changed, or local vs remote del → local wins, pushed, remote updated
 *    - first ever sync of a key (no mirror):
 *        • cloud has data → cloud wins (fresh device must not overwrite it)
 *        • cloud empty    → local seeds are uploaded
 *
 *  Known limitation: on the very first sync of a brand-new collection, local
 *  edits made while completely offline are overwritten by the cloud copy.
 * ============================================================================
 */
import { supabase } from '../lib/supabase';

export type SyncStatus = 'disabled' | 'idle' | 'hydrating' | 'syncing' | 'offline' | 'error';

const TABLE = 'app_records';
const MIRROR_KEY = 'edusmart_sync_mirror_v1'; // { [collection]: { [recordId]: hash } }
const CURSOR_KEY = 'edusmart_sync_cursors_v1'; // { [collection]: latest seen updated_at }
const DIRTY_KEY = 'edusmart_sync_dirty_v1'; // [collection, ...] awaiting push
const IDENTITY_KEY = 'edusmart_sync_identity_v1';

const CHUNK = 500; // rows per upsert
const PAGE = 1000; // rows per pull page
const CONCURRENCY = 6; // parallel collections during hydrate
const FLUSH_DEBOUNCE_MS = 700;
const RETRY_MS = 30000;
const SINGLETON = 'singleton';

/** Per-device keys — never uploaded (session, UI prefs, offline content cache). */
const EXCLUDED_KEYS = new Set([
  'edusmart_current_user_v1',
  'edusmart_active_tenant_id',
  'edusmart_cbc_offline_cache_v2',
  'edusmart_cbc_last_sync_timestamp',
  'edusmart_accessibility_preferences_v1',
  'edusmart_mobile_overlap_protection_v1',
  'edusmart_quickactions_docked_mobile_v1',
  'edusmart_grade_passwords_v1',
]);

/** Keys written outside storage.ts / operationsStorage.ts that still need syncing. */
const EXTRA_COLLECTIONS = [
  'edusmart_all_tenants_registry',
  'edusmart_platform_customization_v5',
  'edusmart_virtual_lab_reports',
  'edusmart_assignment_submissions',
  'edusmart_vlab_ticket_passes',
];

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const registered = new Set<string>(EXTRA_COLLECTIONS);
let mirror: Record<string, Record<string, string>> = loadJSON(MIRROR_KEY, {});
let cursors: Record<string, string> = loadJSON(CURSOR_KEY, {});
let dirty = new Set<string>(loadJSON(DIRTY_KEY, [] as string[]));
let activeIdentity: string | null = loadJSON(IDENTITY_KEY, null);
let activeTenantId: string | null = (() => {
  try {
    return localStorage.getItem('edusmart_active_tenant_id');
  } catch {
    return null;
  }
})();

let status: SyncStatus = 'disabled';
let hydrated = false;
let flushing = false;
let missingTable = false;
let lastError: string | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let retryTimer: ReturnType<typeof setInterval> | null = null;
let realtimeChannel: any = null;

/** PostgREST code returned when public.app_records has not been created yet. */
function isMissingTable(err: any): boolean {
  const code = err?.code || err?.error?.code;
  const msg = String(err?.message || err?.error?.message || '');
  return code === 'PGRST205' || /could not find the table|does not exist/i.test(msg);
}

const MIGRATION_HINT =
  'Supabase table "app_records" is missing — open the Supabase SQL Editor and run supabase/migrations/0001_app_records.sql';

const statusListeners = new Set<(s: SyncStatus) => void>();

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, value: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[sync] failed to persist', key, e);
  }
}

function identityStorageKey(key: string, userId: string, tenantId: string | null): string {
  return `${key}:tenant:${encodeURIComponent(tenantId || 'global')}:user:${encodeURIComponent(userId)}`;
}

function storeIdentityCache(userId: string, tenantId: string | null): void {
  try {
    for (const key of registered) {
      const value = localStorage.getItem(key);
      const storageKey = identityStorageKey(key, userId, tenantId);
      if (value === null) localStorage.removeItem(storageKey);
      else localStorage.setItem(storageKey, value);
    }
    localStorage.setItem(identityStorageKey(MIRROR_KEY, userId, tenantId), JSON.stringify(mirror));
    localStorage.setItem(identityStorageKey(CURSOR_KEY, userId, tenantId), JSON.stringify(cursors));
    localStorage.setItem(identityStorageKey(DIRTY_KEY, userId, tenantId), JSON.stringify([...dirty]));
  } catch (error) {
    console.error('[sync] failed to save the signed-in user cache', error);
  }
}

function clearRegisteredLocalData(): void {
  for (const key of registered) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('[sync] failed to clear cached collection', key, error);
    }
  }
}

function activateIdentity(userId: string | null, tenantId?: string | null): void {
  const nextTenantId = userId ? tenantId || null : null;
  if (activeIdentity === userId && activeTenantId === nextTenantId) return;
  if (activeIdentity) storeIdentityCache(activeIdentity, activeTenantId);

  clearRegisteredLocalData();
  mirror = userId ? loadJSON(identityStorageKey(MIRROR_KEY, userId, nextTenantId), {}) : {};
  cursors = userId ? loadJSON(identityStorageKey(CURSOR_KEY, userId, nextTenantId), {}) : {};
  dirty = new Set(userId ? loadJSON(identityStorageKey(DIRTY_KEY, userId, nextTenantId), [] as string[]) : []);

  if (userId) {
    for (const key of registered) {
      try {
        const cached = localStorage.getItem(identityStorageKey(key, userId, nextTenantId));
        if (cached !== null) localStorage.setItem(key, cached);
      } catch (error) {
        console.error('[sync] failed to restore cached collection', key, error);
      }
    }
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(userId));
    if (nextTenantId) localStorage.setItem('edusmart_active_tenant_id', nextTenantId);
  } else {
    localStorage.removeItem(IDENTITY_KEY);
    localStorage.removeItem('edusmart_active_tenant_id');
  }

  saveJSON(MIRROR_KEY, mirror);
  saveJSON(CURSOR_KEY, cursors);
  saveJSON(DIRTY_KEY, [...dirty]);
  activeIdentity = userId;
  activeTenantId = nextTenantId;
  hydrated = false;
  missingTable = false;
  lastError = null;
  if (realtimeChannel && supabase) {
    void supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
  setStatus('disabled');
}

function readLocal(key: string): any {
  try {
    const raw = localStorage.getItem(key);
    if (!raw || raw === 'undefined' || raw === 'null') return undefined;
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function writeLocal(key: string, value: any): void {
  try {
    if (value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[sync] failed to write', key, e);
  }
}

/** JSONB reorders object keys — hash a canonical form so comparisons stay stable. */
function stableStringify(v: any): string {
  if (v === null || v === undefined) return 'null';
  const t = typeof v;
  if (t === 'number' || t === 'boolean') return JSON.stringify(v);
  if (t === 'string') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(stableStringify).join(',') + ']';
  if (t === 'object') {
    const keys = Object.keys(v).sort();
    const parts: string[] = [];
    for (const k of keys) {
      if (v[k] === undefined) continue;
      parts.push(JSON.stringify(k) + ':' + stableStringify(v[k]));
    }
    return '{' + parts.join(',') + '}';
  }
  return 'null';
}

function djb2(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

const hashOf = (payload: any): string => djb2(stableStringify(payload));

type Rec = { id: string; payload: any };

function recIdOf(item: any, index: number): string {
  if (item && typeof item === 'object' && item.id !== undefined && item.id !== null) return String(item.id);
  return `idx:${index}`;
}

function sanitizePayload(key: string, payload: any): any {
  if (key !== 'edusmart_users_v1' || !payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload;
  }
  const { password: _password, ...safeUser } = payload;
  return safeUser;
}

/** Convert a stored collection value into comparable records. */
function toRecords(value: any): Rec[] {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value.map((item, i) => ({ id: recIdOf(item, i), payload: item }));
  if (typeof value === 'object') return [{ id: SINGLETON, payload: value }];
  return [{ id: SINGLETON, payload: value }];
}

/** Rebuild the stored collection value from records, preserving its shape. */
function fromRecords(recs: Rec[], original: any): any {
  const singleton = recs.find(r => r.id === SINGLETON);
  if (singleton && recs.length === 1 && (!original || typeof original !== 'object' || Array.isArray(original) === false)) {
    return singleton.payload;
  }
  if (original !== undefined && original !== null && typeof original === 'object' && !Array.isArray(original)) {
    return singleton ? singleton.payload : undefined;
  }
  if (singleton && recs.length === 1) return singleton.payload;
  return recs.map(r => r.payload);
}

function tenantId(): string {
  try {
    return localStorage.getItem('edusmart_active_tenant_id') || 'global';
  } catch {
    return 'global';
  }
}

function setStatus(next: SyncStatus): void {
  if (status === next) return;
  status = next;
  try {
    window.dispatchEvent(new CustomEvent('edusmart:sync-status', { detail: { status: next } }));
  } catch {
    /* no window (SSR guard) */
  }
  statusListeners.forEach(cb => {
    try {
      cb(next);
    } catch {
      /* ignore listener errors */
    }
  });
}

function dispatchDataChange(key: string): void {
  try {
    window.dispatchEvent(new CustomEvent('edusmart:data-changed', { detail: { key } }));
  } catch {
    /* no window */
  }
}

function chunks<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function runPool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>): Promise<void> {
  let cursor = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    while (cursor < items.length) {
      const idx = cursor++;
      await fn(items[idx]);
    }
  });
  await Promise.all(workers);
}

// ---------------------------------------------------------------------------
// Registration & write hooks (called from storage.ts / operationsStorage.ts)
// ---------------------------------------------------------------------------
function register(keys: string[]): void {
  for (const k of keys) {
    if (!k || EXCLUDED_KEYS.has(k) || k.startsWith('edusmart_sync_')) continue;
    registered.add(k);
  }
}

/** Called by setToStorage()/setStorage() after every successful localStorage write. */
function markDirty(key: string): void {
  if (!registered.has(key)) return;
  dirty.add(key);
  saveJSON(DIRTY_KEY, [...dirty]);
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushDirty();
  }, FLUSH_DEBOUNCE_MS);
}

// ---------------------------------------------------------------------------
// Serialisation → Supabase rows
// ---------------------------------------------------------------------------
async function pushRows(rows: any[]): Promise<string> {
  let maxTs = '';
  for (const part of chunks(rows, CHUNK)) {
    const { data, error } = await supabase!
      .from(TABLE)
      .upsert(part, { onConflict: 'tenant_id,collection,record_id' })
      .select('record_id,updated_at');
    if (error) throw error;
    for (const row of data || []) {
      if (row.updated_at && row.updated_at > maxTs) maxTs = row.updated_at;
    }
  }
  return maxTs;
}

/** Diff localStorage vs mirror and push the changes for one collection. */
async function flushKey(key: string): Promise<void> {
  if (!supabase) return;
  const value = readLocal(key);
  const recs = toRecords(value);
  const base = mirror[key] || {};
  const next: Record<string, string> = {};
  const ops: any[] = [];

  if (value === undefined && Object.keys(base).length === 0) {
    return;
  }

  for (const r of recs) {
    const payload = sanitizePayload(key, r.payload);
    const h = hashOf(payload);
    next[r.id] = h;
    if (base[r.id] !== h) {
      ops.push({ collection: key, record_id: r.id, payload, deleted: false, tenant_id: tenantId() });
    }
  }
  for (const id of Object.keys(base)) {
    if (!(id in next)) {
      ops.push({ collection: key, record_id: id, payload: null, deleted: true, tenant_id: tenantId() });
    }
  }

  if (ops.length) {
    const maxTs = await pushRows(ops);
    if (maxTs && (!cursors[key] || maxTs > cursors[key])) {
      cursors[key] = maxTs;
      saveJSON(CURSOR_KEY, cursors);
    }
  }

  mirror[key] = next;
  saveJSON(MIRROR_KEY, mirror);
  dirty.delete(key);
  saveJSON(DIRTY_KEY, [...dirty]);
}

// ---------------------------------------------------------------------------
// Supabase → localStorage (pull + 3-way merge)
// ---------------------------------------------------------------------------
async function pullKey(key: string): Promise<void> {
  if (!supabase) return;
  const cursor = cursors[key];
  const rows: any[] = [];
  let from = 0;

  for (;;) {
    let q = supabase
      .from(TABLE)
      .select('record_id,payload,deleted,updated_at')
      .eq('collection', key)
      .eq('tenant_id', tenantId())
      .order('updated_at', { ascending: true })
      .order('record_id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (cursor) q = q.gte('updated_at', cursor); // gte = safe, merge is idempotent
    const { data, error } = await q;
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < PAGE) break;
    from += PAGE;
  }

  if (!rows.length) return;
  mergeKey(key, rows);

  let maxTs = cursor || '';
  for (const r of rows) if (r.updated_at && r.updated_at > maxTs) maxTs = r.updated_at;
  if (maxTs !== cursor) {
    cursors[key] = maxTs;
    saveJSON(CURSOR_KEY, cursors);
  }
}

function mergeKey(key: string, rows: any[]): void {
  const local = readLocal(key);
  const recs = toRecords(local);
  const hadMirror = mirror[key] !== undefined;
  const base: Record<string, string> = mirror[key] || {};

  // ---- First ever sync of this collection --------------------------------
  if (!hadMirror) {
    const live = rows.filter(r => !r.deleted);
    if (live.length === 0) {
      // Cloud empty (or only tombstones) → keep local; push phase will upload it.
      return;
    }
    // Cloud already has data → cloud wins wholesale (protects the primary copy).
    const nextRecs: Rec[] = live.map(r => ({ id: r.record_id, payload: r.payload }));
    const nextBase: Record<string, string> = {};
    for (const r of nextRecs) nextBase[r.id] = hashOf(r.payload);
    mirror[key] = nextBase;
    saveJSON(MIRROR_KEY, mirror);
    if (stableStringify(nextRecs) !== stableStringify(recs)) {
      writeLocal(key, fromRecords(nextRecs, local));
      dispatchDataChange(key);
    }
    dirty.delete(key);
    saveJSON(DIRTY_KEY, [...dirty]);
    return;
  }

  // ---- Ongoing 3-way merge ------------------------------------------------
  const byId = new Map<string, Rec>(recs.map(r => [r.id, r]));
  const nextRecs = [...recs];
  let changed = false;

  const removeLocal = (id: string): void => {
    const i = nextRecs.findIndex(r => r.id === id);
    if (i >= 0) {
      nextRecs.splice(i, 1);
      changed = true;
    }
    delete base[id];
  };

  for (const row of rows) {
    const id = row.record_id;
    const localRec = byId.get(id);
    const localHash = localRec ? hashOf(localRec.payload) : undefined;
    const baseHash = base[id];

    if (row.deleted) {
      if (baseHash === undefined || localHash === undefined) continue;
      if (localHash === baseHash) removeLocal(id); // remote deleted, local untouched
      else markDirty(key); // local edited after base → local wins (undelete on push)
      continue;
    }

    const remoteHash = hashOf(row.payload);

    if (localHash === undefined) {
      if (baseHash === undefined) {
        // New remote record
        nextRecs.push({ id, payload: row.payload });
        byId.set(id, { id, payload: row.payload });
        base[id] = remoteHash;
        changed = true;
      } else {
        // We deleted it locally but it still exists remotely → local delete wins
        markDirty(key);
      }
      continue;
    }

    if (localHash === baseHash) {
      if (remoteHash !== baseHash) {
        // Remote changed, local untouched → apply remote
        const i = nextRecs.findIndex(r => r.id === id);
        if (i >= 0) nextRecs[i] = { id, payload: row.payload };
        base[id] = remoteHash;
        changed = true;
      }
    } else if (baseHash === undefined) {
      // Local record was never synced (factory seed or provisional) → cloud wins if it differs
      if (remoteHash !== localHash) {
        const i = nextRecs.findIndex(r => r.id === id);
        if (i >= 0) nextRecs[i] = { id, payload: row.payload };
        base[id] = remoteHash;
        changed = true;
      } else {
        base[id] = remoteHash;
      }
    } else if (remoteHash !== localHash) {
      if (remoteHash !== baseHash) {
        // True conflict → keep local, push it over the remote copy
        markDirty(key);
      } else {
        base[id] = localHash; // remote is at base, local has the new truth
      }
    } else {
      base[id] = remoteHash; // identical content, just converge the mirror
    }
  }

  mirror[key] = base;
  saveJSON(MIRROR_KEY, mirror);

  if (changed) {
    writeLocal(key, fromRecords(nextRecs, local));
    dispatchDataChange(key);
  }
}

// ---------------------------------------------------------------------------
// Push / pull orchestration
// ---------------------------------------------------------------------------
async function flushDirty(): Promise<void> {
  if (!hydrated || !supabase || flushing || missingTable) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    setStatus('offline');
    return;
  }
  const pending = [...dirty];
  if (!pending.length) return;

  flushing = true;
  setStatus('syncing');
  let failed = false;
  try {
    for (const key of pending) {
      if (!dirty.has(key)) continue; // newer edit re-queued it
      try {
        await flushKey(key);
      } catch (e) {
        failed = true;
        console.warn('[sync] push failed for', key, e);
      }
    }
    setStatus(failed ? 'error' : 'idle');
  } finally {
    flushing = false;
  }
}

/**
 * The migration is usually run while the app is open — poll until the table
 * exists, then resume syncing without a page reload.
 */
async function recoverFromMissingTable(): Promise<void> {
  if (!supabase || !missingTable) return;
  const probe = [...registered][0];
  if (!probe) return;
  try {
    await pullKey(probe);
  } catch (e) {
    if (isMissingTable(e)) return; // still not migrated
  }
  missingTable = false;
  lastError = null;
  console.info('[sync] app_records detected — resuming synchronisation');
  const keys = [...registered];
  await runPool(keys, CONCURRENCY, async key => {
    try {
      await pullKey(key);
    } catch {
      /* individual collection failures retry later */
    }
  });
  await flushDirty();
  setStatus('idle');
}

function subscribeRealtime(): void {
  if (!supabase || realtimeChannel) return;
  try {
    const channel = supabase.channel('edusmart-sync-records');
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, (msg: any) => {
        const row = msg.new || msg.old;
        if (!row || !row.collection || !registered.has(row.collection)) return;
        if (dirty.has(row.collection)) return; // this device has pending edits for it
        applyRemoteRow(row.collection, row);
      })
      .subscribe((state: string) => {
        if (state === 'CHANNEL_ERROR' || state === 'TIMED_OUT') console.warn('[sync] realtime channel issue');
      });
    realtimeChannel = channel;
  } catch (e) {
    console.warn('[sync] realtime unavailable', e);
  }
}

/** Apply a single row pushed by another device. */
function applyRemoteRow(key: string, row: any): void {
  const local = readLocal(key);
  const recs = toRecords(local);
  const base = mirror[key] || (mirror[key] = {});
  const i = recs.findIndex(r => r.id === row.record_id);

  if (row.deleted) {
    if (i < 0) return;
    const localHash = hashOf(recs[i].payload);
    if (base[row.record_id] !== localHash) return; // local edit pending → keep it
    recs.splice(i, 1);
    delete base[row.record_id];
    writeLocal(key, fromRecords(recs, local));
    saveJSON(MIRROR_KEY, mirror);
    dispatchDataChange(key);
    return;
  }

  const remoteHash = hashOf(row.payload);
  if (i < 0) {
    recs.push({ id: row.record_id, payload: row.payload });
    base[row.record_id] = remoteHash;
    writeLocal(key, fromRecords(recs, local));
    saveJSON(MIRROR_KEY, mirror);
    dispatchDataChange(key);
    return;
  }

  const localHash = hashOf(recs[i].payload);
  const baseHash = base[row.record_id];
  if (baseHash === undefined || localHash === baseHash) {
    if (localHash === remoteHash) {
      base[row.record_id] = remoteHash;
      saveJSON(MIRROR_KEY, mirror);
      return;
    }
    recs[i] = { id: row.record_id, payload: row.payload };
    base[row.record_id] = remoteHash;
    writeLocal(key, fromRecords(recs, local));
    saveJSON(MIRROR_KEY, mirror);
    dispatchDataChange(key);
  } else if (localHash !== remoteHash) {
    markDirty(key); // conflict → local wins, will be pushed
  } else {
    base[row.record_id] = remoteHash;
    saveJSON(MIRROR_KEY, mirror);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export const SyncEngine = {
  register,

  activateIdentity,

  markDirty,

  /** Store local defaults and queue them after an authenticated cloud hydrate. */
  persistSeed(key: string, serialized: string): void {
    if (!registered.has(key)) return;
    try {
      localStorage.setItem(key, serialized);
      if (hydrated) markDirty(key);
    } catch {
      console.error('[sync] failed to persist initial data for', key);
    }
  },

  /** localStorage.setItem that also queues a Supabase push for registered keys. */
  persistItem(key: string, serialized: string): void {
    try {
      localStorage.setItem(key, serialized);
    } catch (e) {
      console.warn('[sync] failed to write', key, e);
      return;
    }
    SyncEngine.markDirty(key);
  },

  /** Pull remote data, merge, then push local changes. Awaited before first render. */
  async hydrate(): Promise<void> {
    if (hydrated) return;
    if (!supabase) {
      setStatus('disabled');
      return;
    }
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    const metadata = sessionData.session?.user.app_metadata as Record<string, unknown> | undefined;
    if (
      !sessionData.session ||
      typeof metadata?.app_user_id !== 'string' ||
      metadata.app_user_id !== activeIdentity ||
      typeof metadata.tenant_id !== 'string' ||
      metadata.tenant_id !== activeTenantId
    ) {
      setStatus('disabled');
      return;
    }
    setStatus(typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'hydrating');

    const keys = [...registered];
    const failures = new Set<string>();

    const recordFailure = (key: string, err: any, phase: string): void => {
      failures.add(key);
      if (isMissingTable(err)) {
        if (!missingTable) {
          missingTable = true;
          lastError = MIGRATION_HINT;
          console.error('[sync] ' + MIGRATION_HINT);
        }
        return;
      }
      console.warn(`[sync] ${phase} failed for`, key, err);
    };

    // Phase 1 — pull (remote must land before we push anything)
    await runPool(keys, CONCURRENCY, async key => {
      if (missingTable || !registered.has(key)) return;
      try {
        await pullKey(key);
      } catch (e) {
        recordFailure(key, e, 'pull');
      }
    });

    // Phase 2 — push queued edits + first-time local seeds
    const toPush = [...dirty, ...keys.filter(k => mirror[k] === undefined && readLocal(k) !== undefined)];
    await runPool([...new Set(toPush)], CONCURRENCY, async key => {
      if (missingTable || !registered.has(key)) return;
      try {
        await flushKey(key);
      } catch (e) {
        recordFailure(key, e, 'initial push');
      }
    });

    hydrated = true;
    subscribeRealtime();

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => void flushDirty());
      window.addEventListener('offline', () => setStatus('offline'));
    }
    if (retryTimer) clearInterval(retryTimer);
    retryTimer = setInterval(() => {
      if (missingTable) void recoverFromMissingTable();
      else if (dirty.size) void flushDirty();
    }, RETRY_MS);

    if (failures.size && typeof navigator !== 'undefined' && navigator.onLine !== false) {
      setStatus('error');
    } else {
      setStatus(typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'idle');
    }
    console.info(
      missingTable
        ? `[sync] ${keys.length} collections registered — waiting for the Supabase migration`
        : `[sync] hydrated ${keys.length} collections (${failures.size} failed)`
    );
  },

  /** Force an immediate push of everything queued (or re-probe a missing table). */
  syncNow(): Promise<void> {
    if (missingTable) return recoverFromMissingTable();
    return flushDirty();
  },

  getStatus(): SyncStatus {
    return status;
  },

  /** Human-readable last sync problem (e.g. the migration hint). */
  getLastError(): string | null {
    return lastError;
  },

  isHydrated(): boolean {
    return hydrated;
  },

  pendingCount(): number {
    return dirty.size;
  },

  onStatusChange(cb: (s: SyncStatus) => void): () => void {
    statusListeners.add(cb);
    return () => statusListeners.delete(cb);
  },
};

export default SyncEngine;
