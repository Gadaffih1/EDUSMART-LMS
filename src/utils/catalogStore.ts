import { SubjectName } from '../types';
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

function read<T>(key: string): T[] {
  const data = ClientDataStore.getCollection<T[]>(key, []);
  return Array.isArray(data) ? data : [];
}

export function listSubjects(): CatalogSubject[] {
  return read<CatalogSubject>(SUBJECTS_KEY);
}

export function listActivities(): CatalogActivity[] {
  return read<CatalogActivity>(ACTIVITIES_KEY);
}
