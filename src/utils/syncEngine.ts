/**
 * ============================================================================
 *  EduSmart SyncEngine — Database-First API Synchronization Layer
 * ============================================================================
 *  Maintains backward compatibility with existing SyncEngine callers while
 *  operating strictly against the central backend database via ClientDataStore.
 *  Zero browser localStorage / sessionStorage / IndexedDB permanence.
 * ============================================================================
 */
import { ClientDataStore } from './clientDataStore';

export type SyncStatus = 'disabled' | 'idle' | 'hydrating' | 'syncing' | 'offline' | 'error';

const registered = new Set<string>();
const statusListeners = new Set<(s: SyncStatus) => void>();
let status: SyncStatus = 'idle';
let lastError: string | null = null;

function setStatus(next: SyncStatus): void {
  if (status === next) return;
  status = next;
  try {
    window.dispatchEvent(new CustomEvent('edusmart:sync-status', { detail: { status: next } }));
  } catch {
    // SSR guard
  }
  statusListeners.forEach((cb) => {
    try {
      cb(next);
    } catch {
      // ignore
    }
  });
}

export const SyncEngine = {
  register(keys: string[]): void {
    for (const k of keys) {
      if (k) registered.add(k);
    }
  },

  activateIdentity(_userId: string | null, tenantId?: string | null): void {
    if (tenantId) ClientDataStore.setActiveTenantId(tenantId);
  },

  markDirty(key: string): void {
    if (!key) return;
    setStatus('syncing');
    void ClientDataStore.pushNow(key).finally(() => setStatus('idle'));
  },

  persistSeed(key: string, serialized: string): void {
    // Only populate missing collection in memory; server database already owns authoritative data
    if (ClientDataStore.hasCollection(key)) return;
    try {
      const parsed = JSON.parse(serialized);
      ClientDataStore.setCollection(key, parsed, { persist: false });
    } catch {
      // ignore
    }
  },

  persistItem(key: string, serialized: string): void {
    try {
      const parsed = JSON.parse(serialized);
      ClientDataStore.setCollection(key, parsed);
    } catch {
      ClientDataStore.setCollection(key, serialized);
    }
  },

  async hydrate(force = false): Promise<void> {
    setStatus('hydrating');
    try {
      await ClientDataStore.hydrateFromBackend(force);
      lastError = null;
      setStatus('idle');
    } catch (err: any) {
      lastError = err?.message || 'Database hydration error';
      setStatus('error');
    }
  },

  async syncNow(): Promise<void> {
    await this.hydrate(true);
  },

  getStatus(): SyncStatus {
    return status;
  },

  getLastError(): string | null {
    return lastError;
  },

  isHydrated(): boolean {
    return ClientDataStore.isHydrated();
  },

  pendingCount(): number {
    return 0;
  },

  onStatusChange(cb: (s: SyncStatus) => void): () => void {
    statusListeners.add(cb);
    return () => statusListeners.delete(cb);
  },
};

export default SyncEngine;
