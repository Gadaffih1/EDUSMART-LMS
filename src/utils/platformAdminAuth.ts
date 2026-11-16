import type { User } from '../types';
import { ClientDataStore } from './clientDataStore';

const PLATFORM_ADMINS_KEY = 'edusmart_platform_admins_v1';

export interface PlatformAdmin {
  id: string;
  name: string;
  email: string;
  password?: string;
  rights: string[];
  accessScope: 'super_admin_only';
  isActive: boolean;
}

function platformAdmins(): PlatformAdmin[] {
  const rows = ClientDataStore.getCollection<PlatformAdmin[]>(PLATFORM_ADMINS_KEY, []);
  return Array.isArray(rows) ? rows : [];
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

export async function updatePlatformAdminCredentials(
  adminId: string,
  input: { currentPassword: string; email?: string; newPassword?: string },
): Promise<{ ok: true; admin: PlatformAdmin } | { ok: false; message: string }> {
  try {
    const res = await fetch('/api/auth/platform-admin/credentials', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminId,
        currentPassword: input.currentPassword,
        email: input.email,
        newPassword: input.newPassword,
      }),
    });
    const body = await res.json();
    if (!res.ok || !body.ok) {
      return { ok: false, message: body?.message || body?.error || 'Could not update platform admin account.' };
    }
    await ClientDataStore.hydrateFromBackend(true);
    return { ok: true, admin: body.admin };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Failed updating platform admin account.' };
  }
}

export function isPlatformSuperAdmin(user: Pick<User, 'email' | 'accessScope'> | null | undefined): boolean {
  if (!user?.email || user.accessScope !== 'super_admin_only') return false;
  if (ClientDataStore.isSuperAdmin()) return true;
  return Boolean(findActivePlatformAdmin(user.email));
}
