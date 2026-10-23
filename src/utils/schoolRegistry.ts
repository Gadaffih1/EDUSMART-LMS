import { Tenant } from '../types/tenant';

const STORAGE_KEY = 'edusmart_school_registry_v1';

function readAll(): Tenant[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(schools: Tenant[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(schools));
}

export function listDurableSchools(): Tenant[] {
  return readAll();
}

export function saveDurableSchool(school: Tenant): void {
  const all = readAll();
  const index = all.findIndex((item) => item.id === school.id);
  if (index >= 0) all[index] = { ...all[index], ...school };
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
    byId.set(school.id, current ? { ...current, ...school } : school);
  }
  return [...byId.values()];
}
