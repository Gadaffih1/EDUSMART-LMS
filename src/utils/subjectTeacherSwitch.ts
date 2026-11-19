import { User, UserRole } from '../types';

/**
 * Administrative & Academic Leadership roles that are authorized to switch
 * into a full Subject Teacher workspace with full Subject Teacher rights.
 */
export const SUBJECT_TEACHER_ELIGIBLE_ROLES: readonly UserRole[] = [
  'deputy_head',
  'dean_of_studies',
  'curriculum_coordinator',
  'hod',
  'senior_teacher',
  'class_teacher',
];

const ELIGIBLE_ROLE_SET = new Set<UserRole>(SUBJECT_TEACHER_ELIGIBLE_ROLES);

export function normalizeAssignedRoleList(
  primaryRole: UserRole | string,
  additionalRoles?: readonly (UserRole | string)[] | null,
  doubleAccessConfig?: User['doubleAccessConfig']
): UserRole[] {
  const seen = new Set<UserRole>();
  if (primaryRole) {
    seen.add(String(primaryRole).trim().toLowerCase() as UserRole);
  }
  if (Array.isArray(additionalRoles)) {
    for (const r of additionalRoles) {
      const clean = String(r || '').trim().toLowerCase() as UserRole;
      if (clean) seen.add(clean);
    }
  }
  if (doubleAccessConfig?.enabled && doubleAccessConfig.secondaryRole) {
    seen.add(String(doubleAccessConfig.secondaryRole).trim().toLowerCase() as UserRole);
  }
  return Array.from(seen);
}

export function getUserRoles(user: User | null | undefined): UserRole[] {
  if (!user) return [];
  return normalizeAssignedRoleList(user.role, user.assignedRoles, user.doubleAccessConfig);
}

export function userHasRole(user: User | null | undefined, targetRole: UserRole): boolean {
  if (!user) return false;
  return getUserRoles(user).includes(targetRole);
}

/**
 * Strict Student Stream Allocation policy:
 * ONLY System Administrators (`admin`), Grade Senior Teachers (`senior_teacher`),
 * or staff explicitly granted the `student_stream_allocator` extra role may view
 * the Student Stream Allocation button/hub or allocate/transfer students across streams.
 * No other role (regular subject teachers, class teachers, HODs, Head Teacher, Deputy Head,
 * Dean of Studies, Curriculum Coordinator, students, parents, etc.) is permitted.
 */
export function canAccessStudentStreamAllocation(user: User | null | undefined): boolean {
  if (!user) return false;
  if (userHasRole(user, 'admin')) return true;
  if (userHasRole(user, 'senior_teacher')) return true;
  if (Array.isArray(user.extraRoles) && user.extraRoles.includes('student_stream_allocator')) {
    return true;
  }
  return false;
}

/**
 * Returns true if the user can allocate student streams across all grades (Grades 1-9),
 * as opposed to a Grade Senior Teacher who is scoped to their assigned grade(s).
 */
export function hasFullSchoolStreamAllocationAccess(user: User | null | undefined): boolean {
  if (!user) return false;
  if (userHasRole(user, 'admin')) return true;
  if (Array.isArray(user.extraRoles) && user.extraRoles.includes('student_stream_allocator')) {
    return true;
  }
  return false;
}

export function canSwitchToSubjectTeacher(user: User | null | undefined): boolean {
  if (!user) return false;
  return getUserRoles(user).some((r) => ELIGIBLE_ROLE_SET.has(r));
}

/**
 * All Heads of Department (HOD) must be able to switch to the Class Teacher role
 * with full Class Teacher rights for their assigned class, plus any multi-role
 * user holding `class_teacher` alongside another primary role.
 */
export function canSwitchToClassTeacher(user: User | null | undefined): boolean {
  if (!user) return false;
  if (userHasRole(user, 'hod')) return true;
  return user.role !== 'class_teacher' && userHasRole(user, 'class_teacher');
}

/**
 * Returns additional workspace roles this user can switch to (excluding primary role).
 * Dedicated quick-buttons exist for `teacher` (Subject Teacher) and `class_teacher` (Class Teacher).
 */
export function getSwitchableWorkspaceRoles(user: User | null | undefined): UserRole[] {
  if (!user) return [];
  const roles = getUserRoles(user).filter((r) => r !== user.role);
  if (userHasRole(user, 'hod') && user.role !== 'class_teacher' && !roles.includes('class_teacher')) {
    roles.push('class_teacher');
  }
  if (canSwitchToSubjectTeacher(user) && user.role !== 'teacher' && !roles.includes('teacher')) {
    roles.push('teacher');
  }
  return roles;
}

export function getAdministrativeRoleDisplayName(role: UserRole | string): string {
  switch (role) {
    case 'deputy_head':
      return 'Deputy Head Teacher';
    case 'dean_of_studies':
      return 'Dean of Studies';
    case 'curriculum_coordinator':
      return 'Curriculum Coordinator';
    case 'hod':
      return 'Head of Department (HOD)';
    case 'senior_teacher':
      return 'Senior Teacher';
    case 'class_teacher':
      return 'Class Teacher';
    case 'teacher':
      return 'Subject Teacher';
    case 'head_teacher':
      return 'Head Teacher';
    case 'admin':
      return 'System Administrator';
    case 'school_admin_staff':
      return 'School Admin Staff';
    case 'librarian':
      return 'School Librarian';
    case 'nurse':
      return 'School Nurse';
    case 'transport_team':
      return 'Transport Team';
    case 'cocurricular_team':
      return 'Co-Curricular Team';
    case 'finance_officer':
      return 'Finance Officer';
    case 'procurement_officer':
      return 'Procurement Officer';
    case 'storekeeper':
      return 'Storekeeper';
    case 'hr_manager':
      return 'HR Manager';
    default:
      return String(role || '').replace(/_/g, ' ');
  }
}

export function getAdministrativeRoleShortName(role: UserRole | string): string {
  switch (role) {
    case 'deputy_head':
      return 'Deputy Head';
    case 'dean_of_studies':
      return 'Dean of Studies';
    case 'curriculum_coordinator':
      return 'Curriculum Coord.';
    case 'hod':
      return 'HOD';
    case 'senior_teacher':
      return 'Senior Teacher';
    case 'class_teacher':
      return 'Class Teacher';
    case 'head_teacher':
      return 'Head Teacher';
    case 'admin':
      return 'Admin';
    default:
      return getAdministrativeRoleDisplayName(role);
  }
}

export function createRoleProxyUser(user: User, targetRole: UserRole): User {
  return {
    ...user,
    role: targetRole,
    assignedRoles: getUserRoles(user),
  };
}

/**
 * Creates a proxy User object with `role: 'teacher'` while preserving all of the
 * real user's identity, tenant membership, teaching allocations, and metadata.
 */
export function createSubjectTeacherProxyUser(user: User): User {
  return createRoleProxyUser(user, 'teacher');
}

/**
 * Creates a proxy User object with `role: 'class_teacher'` while preserving all of the
 * real user's identity, tenant membership, assigned stream/grade metadata, and permissions.
 */
export function createClassTeacherProxyUser(user: User): User {
  return createRoleProxyUser(user, 'class_teacher');
}

