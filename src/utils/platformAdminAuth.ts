import type { User } from '../types';

export interface PlatformAdmin {
  id: string;
  name: string;
  email: string;
  password: string;
  rights: string[];
  accessScope: 'super_admin_only';
  isActive: boolean;
}

function platformAdmins(): PlatformAdmin[] {
  try {
    const raw = localStorage.getItem('edusmart_platform_admins_v1');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed as PlatformAdmin[] : [];
  } catch {
    return [];
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function listPlatformAdmins(): PlatformAdmin[] {
  return platformAdmins();
}

export function findActivePlatformAdmin(email: string): PlatformAdmin | undefined {
  const cleanEmail = normalizeEmail(email);
  return platformAdmins().find(
    (admin) =>
      admin.isActive &&
      admin.accessScope === 'super_admin_only' &&
      admin.rights.includes('super_admin_page') &&
      normalizeEmail(admin.email) === cleanEmail,
  );
}

export function authenticatePlatformAdmin(email: string, password: string): PlatformAdmin | null {
  const admin = findActivePlatformAdmin(email);
  if (!admin || admin.password !== password) return null;
  return admin;
}

export function toPlatformAdminSession(admin: PlatformAdmin): User {
  return {
    id: admin.id,
    name: admin.name,
    email: normalizeEmail(admin.email),
    role: 'admin',
    isActive: true,
    accessScope: 'super_admin_only',
    rights: [...admin.rights],
  };
}

export function isPlatformSuperAdmin(user: Pick<User, 'email' | 'accessScope'> | null | undefined): boolean {
  if (!user?.email || user.accessScope !== 'super_admin_only') return false;
  return Boolean(findActivePlatformAdmin(user.email));
}
