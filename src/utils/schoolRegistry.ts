import { Tenant } from '../types/tenant';
import { ClientDataStore } from './clientDataStore';

const STORAGE_KEY = 'edusmart_school_registry_v1';

function readAll(): Tenant[] {
  const data = ClientDataStore.getCollection<Tenant[]>(STORAGE_KEY, []);
  return Array.isArray(data) ? data : [];
}

function writeAll(schools: Tenant[]): void {
  ClientDataStore.setCollection(STORAGE_KEY, schools);
}

export function listDurableSchools(): Tenant[] {
  return readAll();
}

function mergePreservingLogo(base: Tenant, incoming: Tenant): Tenant {
  const merged: Tenant = { ...base, ...incoming };
  const incomingLogoUrl = typeof incoming.logoUrl === 'string' ? incoming.logoUrl.trim() : '';
  const baseLogoUrl = typeof base.logoUrl === 'string' ? base.logoUrl.trim() : '';
  const incomingCustom = typeof incoming.customLogoBase64 === 'string' ? incoming.customLogoBase64.trim() : '';
  const baseCustom = typeof base.customLogoBase64 === 'string' ? base.customLogoBase64.trim() : '';

  if (!incomingLogoUrl && baseLogoUrl) {
    merged.logoUrl = baseLogoUrl;
  }
  if (!incomingCustom && baseCustom && !('customLogoBase64' in incoming && incoming.customLogoBase64 === undefined)) {
    merged.customLogoBase64 = baseCustom;
  }
  return merged;
}

export function saveDurableSchool(school: Tenant): void {
  const all = readAll();
  const index = all.findIndex((item) => item.id === school.id);
  if (index >= 0) all[index] = mergePreservingLogo(all[index], school);
  else all.push(school);
  writeAll(all);
}

export function removeDurableSchool(schoolId: string): void {
  writeAll(readAll().filter((school) => school.id !== schoolId));
}

export function mergeDurableSchools(tenants: Tenant[]): Tenant[] {
  const byId = new Map(tenants.map((tenant) => [tenant.id, tenant]));
  for (const school of readAll()) {
    const current = byId.get(school.id);
    byId.set(school.id, current ? mergePreservingLogo(current, school) : school);
  }
  return [...byId.values()];
}
