import type { User } from '../types';
import { supabase } from '../lib/supabase';

const PLATFORM_ADMINS_KEY = 'edusmart_platform_admins_v1';

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
    const raw = localStorage.getItem(PLATFORM_ADMINS_KEY);
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

export async function updatePlatformAdminCredentials(
  adminId: string,
  input: { currentPassword: string; email?: string; newPassword?: string },
): Promise<{ ok: true; admin: PlatformAdmin } | { ok: false; message: string }> {
  const admins = platformAdmins();
  const admin = admins.find((item) => item.id === adminId);
  if (!admin) return { ok: false, message: 'This platform admin account was not found.' };
  if (admin.password !== input.currentPassword) {
    return { ok: false, message: 'Current password is incorrect.' };
  }

  const patch: { email?: string; password?: string } = {};

  if (input.email !== undefined) {
    const email = normalizeEmail(input.email);
    if (!email.includes('@') || !email.split('@')[1]?.includes('.')) {
      return { ok: false, message: 'Enter the email address you want to use for sign-in.' };
    }
    const emailTaken = admins.some((item) => item.id !== adminId && normalizeEmail(item.email) === email);
    if (emailTaken) return { ok: false, message: 'Another platform admin already uses that email.' };
    if (email !== normalizeEmail(admin.email)) patch.email = email;
  }

  if (input.newPassword !== undefined && input.newPassword.length > 0) {
    if (input.newPassword.length < 4) {
      return { ok: false, message: 'New password must be at least 4 characters.' };
    }
    patch.password = input.newPassword;
  }

  if (!patch.email && !patch.password) {
    return { ok: false, message: 'Change the email or enter a new password before saving.' };
  }

  const updated: PlatformAdmin = { ...admin, ...patch };

  if (supabase) {
    const { error } = await supabase
      .schema('edusmart')
      .from('platform_admins')
      .update(patch)
      .eq('id', adminId);
    if (error) return { ok: false, message: `The account could not be saved. ${error.message}` };
  }

  localStorage.setItem(
    PLATFORM_ADMINS_KEY,
    JSON.stringify(admins.map((item) => (item.id === adminId ? updated : item))),
  );
  return { ok: true, admin: updated };
}

export function isPlatformSuperAdmin(user: Pick<User, 'email' | 'accessScope'> | null | undefined): boolean {
  if (!user?.email || user.accessScope !== 'super_admin_only') return false;
  return Boolean(findActivePlatformAdmin(user.email));
}
