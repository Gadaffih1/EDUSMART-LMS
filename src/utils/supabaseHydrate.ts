import { ClientDataStore } from './clientDataStore';

export const REMOTE_DATA_FLAG = 'edusmart_remote_data_v1';

export function isRemoteDataActive(): boolean {
  return ClientDataStore.isHydrated();
}

export async function hydrateFromSupabase(): Promise<boolean> {
  await ClientDataStore.hydrateFromBackend(true);
  return ClientDataStore.isHydrated();
}
