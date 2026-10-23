import { isRemoteDataActive } from './supabaseHydrate';

export type RegistryNumberKind = 'admission' | 'staff' | 'none';

export interface SystemRole {
  id: string;
  name: string;
  slug: string;
  passwordPrefix: string;
  numberKind: RegistryNumberKind;
  builtIn: boolean;
  isActive: boolean;
}

const SYSTEM_ROLES: SystemRole[] = [];

const STORAGE_KEY = 'edusmart_system_roles_v1';

function readStored(): SystemRole[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStored(roles: SystemRole[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
}

function mergedRoles(): SystemRole[] {
  const stored = readStored();
  if (isRemoteDataActive()) return stored;
  const bySlug = new Map<string, SystemRole>();
  for (const role of SYSTEM_ROLES) bySlug.set(role.slug, role);
  for (const role of stored) {
    if (!role?.slug) continue;
    const seed = bySlug.get(role.slug);
    bySlug.set(role.slug, seed ? { ...seed, ...role, builtIn: seed.builtIn } : role);
  }
  return [...bySlug.values()];
}

export function listSystemRoles(): SystemRole[] {
  return mergedRoles().filter((role) => role.isActive !== false);
}

export function findSystemRole(slug: string | undefined | null): SystemRole | undefined {
  if (!slug) return undefined;
  return mergedRoles().find((role) => role.slug === slug);
}

export function slugifyRoleName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export function addSystemRole(input: {
  name: string;
  passwordPrefix: string;
  numberKind: RegistryNumberKind;
}): SystemRole {
  const name = input.name.trim();
  const passwordPrefix = input.passwordPrefix.trim().toLowerCase();
  const slug = slugifyRoleName(name);
  if (!name || !slug) throw new Error('Enter a role name.');
  if (!/^[a-z]{2}$/.test(passwordPrefix)) throw new Error('The password prefix must be two letters.');
  const existing = mergedRoles();
  if (existing.some((role) => role.slug === slug)) throw new Error('A role with this name already exists.');
  if (existing.some((role) => role.passwordPrefix === passwordPrefix)) {
    throw new Error('That password prefix is already used by another role.');
  }
  const role: SystemRole = {
    id: `role-${slug}-${Date.now()}`,
    name,
    slug,
    passwordPrefix,
    numberKind: input.numberKind,
    builtIn: false,
    isActive: true,
  };
  writeStored([...readStored(), role]);
  return role;
}
