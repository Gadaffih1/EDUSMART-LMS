import { RegistryNumberKind } from './systemRoles';

export function nameToken(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/** First word and last word of a legal name, split on spaces. */
export function splitLegalName(legalName: string): { first: string; last: string } {
  const parts = legalName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: '', last: '' };
  if (parts.length === 1) return { first: nameToken(parts[0]), last: '' };
  return { first: nameToken(parts[0]), last: nameToken(parts[parts.length - 1]) };
}

export function buildUsername(legalName: string, domain: string): string {
  const { first, last } = splitLegalName(legalName);
  const local = last ? `${first}.${last}` : first;
  const host = domain.trim().toLowerCase().replace(/^@/, '').replace(/\s/g, '');
  if (!local || !host) return '';
  return `${local}@${host}`;
}

export function uniqueUsername(base: string, taken: string[]): string {
  if (!base || !base.includes('@')) return base;
  const used = new Set(taken.map((email) => email.toLowerCase()));
  if (!used.has(base.toLowerCase())) return base;
  const at = base.lastIndexOf('@');
  const local = base.slice(0, at);
  const host = base.slice(at + 1);
  let n = 2;
  while (used.has(`${local}${n}@${host}`)) n += 1;
  return `${local}${n}@${host}`;
}

export function rolePassword(prefix: string, year = new Date().getFullYear()): string {
  return `${prefix.trim().toLowerCase()}@${year}`;
}

export function schoolLoginSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function suggestSchoolEmail(name: string, shortName: string, domain: string): string {
  const source = shortName.trim() || name.trim().split(/\s+/)[0] || '';
  const local = schoolLoginSlug(source);
  const host = domain.trim().toLowerCase().replace(/^@/, '').replace(/\s/g, '');
  if (!local || !host) return '';
  return `${local}@${host}`;
}

/** School login password. Sequence keeps each campus distinct: sc@2026001, sc@2026002. */
export function generateSchoolPassword(sequence: number, year = new Date().getFullYear()): string {
  return `sc@${year}${String(sequence).padStart(3, '0')}`;
}

export function nextRegistryNumber(kind: 'ADM' | 'STF', year: number, existing: string[]): string {
  const head = `${kind}/${year}/`;
  let max = 0;
  for (const value of existing) {
    if (!value?.startsWith(head)) continue;
    const n = Number(value.slice(head.length));
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `${head}${String(max + 1).padStart(3, '0')}`;
}

export function registryKindCode(kind: RegistryNumberKind): 'ADM' | 'STF' | null {
  if (kind === 'admission') return 'ADM';
  if (kind === 'staff') return 'STF';
  return null;
}
