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
    const parsed = raw ? JSON.parse(raw) : [];
    const rows = Array.isArray(parsed) ? parsed : Object.values(parsed || {});
    const record: Record<string, StarterDocFile> = {};
    for (const row of rows as StarterDocFile[]) {
      if (row?.id) record[row.id] = row;
    }
    return record;
  } catch {
    return {};
  }
}
