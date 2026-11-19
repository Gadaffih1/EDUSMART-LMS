import { User } from '../types';

export interface DeletableEResource {
  uploadedById?: string;
  teacherId?: string;
  authorId?: string;
  addedById?: string;
  author?: string;
  teacherName?: string;
  addedBy?: string;
}

function normalizeName(value?: string | null): string {
  if (!value) return '';
  return value
    .replace(/\s*\([^)]*\)\s*$/g, '')
    .trim()
    .toLowerCase();
}

/**
 * True strictly for System Administrators (tenant admin or platform super_admin).
 * No other administrative or leadership role (Head Teacher, Deputy Head, HOD,
 * Senior Teacher, Librarian, Dean, etc.) is considered a System Administrator here.
 */
export function isSystemAdministrator(user?: User | null): boolean {
  if (!user) return false;
  const role = String(user.role || '').toLowerCase();
  const extraBaseRole = String((user as User & { baseRole?: string }).baseRole || '').toLowerCase();
  const isSuper = Boolean((user as User & { isSuperAdmin?: boolean }).isSuperAdmin);
  return (
    role === 'admin' ||
    role === 'super_admin' ||
    extraBaseRole === 'admin' ||
    extraBaseRole === 'super_admin' ||
    isSuper
  );
}

/**
 * Strict E-Resource Deletion Policy:
 * Deleting an E-resource can ONLY be done by:
 *   1. The exact user who uploaded it, OR
 *   2. The System Administrator (`admin` / `super_admin`).
 * No one else (including other teachers, HODs, librarians, senior teachers,
 * head teachers, students, or parents) may delete it.
 */
export function canDeleteEResource(
  user?: User | null,
  resource?: DeletableEResource | null
): boolean {
  if (!user || !resource) return false;
  if (isSystemAdministrator(user)) return true;

  const ownerId =
    resource.uploadedById ||
    resource.teacherId ||
    resource.authorId ||
    resource.addedById;

  if (ownerId && ownerId.trim().length > 0) {
    return ownerId.trim() === String(user.id || '').trim();
  }

  // Legacy fallback ONLY when older seed records lack an explicit uploader ID
  const userName = normalizeName(user.name);
  if (!userName) return false;

  const ownerName = normalizeName(
    resource.author || resource.teacherName || resource.addedBy
  );
  return ownerName.length > 0 && ownerName === userName;
}
