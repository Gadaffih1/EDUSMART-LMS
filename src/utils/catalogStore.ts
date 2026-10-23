import { SubjectName } from '../types';
import { isRemoteDataActive } from './supabaseHydrate';

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

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function listSubjects(): CatalogSubject[] {
  const rows = read<CatalogSubject>(SUBJECTS_KEY);
  if (rows.length > 0 || isRemoteDataActive()) return rows;
  return rows;
}

export function listActivities(): CatalogActivity[] {
  const rows = read<CatalogActivity>(ACTIVITIES_KEY);
  if (rows.length > 0 || isRemoteDataActive()) return rows;
  return rows;
}
