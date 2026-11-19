import { JUNIOR_SUBJECTS, PRIMARY_SUBJECTS, SubjectName } from '../types';
import { ClientDataStore } from './clientDataStore';

export interface CatalogSubject {
  id: string;
  name: SubjectName | string;
}

export interface CatalogActivity {
  id: string;
  name: string;
}

const SUBJECTS_KEY = 'edusmart_subjects_v1';
const ACTIVITIES_KEY = 'edusmart_activities_v1';

const REQUIRED_CURRICULUM_SUBJECTS: string[] = Array.from(
  new Set<string>([...PRIMARY_SUBJECTS, ...JUNIOR_SUBJECTS])
);

function read<T>(key: string): T[] {
  const data = ClientDataStore.getCollection<T[]>(key, []);
  return Array.isArray(data) ? data : [];
}

function write<T>(key: string, rows: T[]): void {
  ClientDataStore.setCollection(key, rows);
}

export function listSubjects(): CatalogSubject[] {
  const stored = read<CatalogSubject>(SUBJECTS_KEY);
  const byLower = new Map<string, CatalogSubject>();
  for (const item of stored) {
    if (item && item.name) {
      byLower.set(String(item.name).trim().toLowerCase(), item);
    }
  }
  for (const name of REQUIRED_CURRICULUM_SUBJECTS) {
    const key = name.trim().toLowerCase();
    if (!byLower.has(key)) {
      byLower.set(key, {
        id: `sub-${key.replace(/[^a-z0-9]+/g, '-')}`,
        name,
      });
    }
  }
  return Array.from(byLower.values()).sort((a, b) =>
    String(a.name).localeCompare(String(b.name))
  );
}

export function addCatalogSubject(name: string): CatalogSubject {
  const clean = name.trim();
  const current = listSubjects();
  const existing = current.find(
    (s) => String(s.name).trim().toLowerCase() === clean.toLowerCase()
  );
  if (existing) return existing;
  const created: CatalogSubject = {
    id: `sub-${Date.now()}-${clean.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 16)}`,
    name: clean,
  };
  write(SUBJECTS_KEY, [...current, created]);
  window.dispatchEvent(new CustomEvent('subjects-catalog-updated'));
  return created;
}

export function updateCatalogSubject(previousName: string, nextName: string): void {
  const cleanNext = nextName.trim();
  if (!cleanNext) return;
  const current = listSubjects();
  const prevLower = previousName.trim().toLowerCase();
  const updated = current.map((s) =>
    String(s.name).trim().toLowerCase() === prevLower ? { ...s, name: cleanNext } : s
  );
  write(SUBJECTS_KEY, updated);
  window.dispatchEvent(new CustomEvent('subjects-catalog-updated'));
}

export function deleteCatalogSubject(name: string): void {
  const targetLower = name.trim().toLowerCase();
  const stored = read<CatalogSubject>(SUBJECTS_KEY);
  const filtered = stored.filter(
    (s) => String(s.name).trim().toLowerCase() !== targetLower
  );
  write(SUBJECTS_KEY, filtered);
  window.dispatchEvent(new CustomEvent('subjects-catalog-updated'));
}

export function listActivities(): CatalogActivity[] {
  return read<CatalogActivity>(ACTIVITIES_KEY);
}
