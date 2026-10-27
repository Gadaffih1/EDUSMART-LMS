import { STARTER_DOCS_DATA } from '../data/starterDocsData';

export interface StarterDocFile {
  id: string;
  name: string;
  title: string;
  language: 'sql' | 'markdown';
  badge: string;
  description: string;
  content: string;
}

export function listStarterDocs(): Record<string, StarterDocFile> {
  try {
    const raw = localStorage.getItem('edusmart_starter_package_docs_v1');
    if (!raw) return STARTER_DOCS_DATA;
    const parsed = JSON.parse(raw);
    const rows = Array.isArray(parsed) ? parsed : Object.values(parsed || {});
    if (!rows || rows.length === 0) return STARTER_DOCS_DATA;
    const record: Record<string, StarterDocFile> = {};
    for (const row of rows as StarterDocFile[]) {
      if (row?.id) record[row.id] = row;
    }
    return Object.keys(record).length > 0 ? record : STARTER_DOCS_DATA;
  } catch {
    return STARTER_DOCS_DATA;
  }
}

