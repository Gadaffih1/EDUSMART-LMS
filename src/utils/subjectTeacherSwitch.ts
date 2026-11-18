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

export function canSwitchToSubjectTeacher(user: User | null | undefined): boolean {
  if (!user) return false;
  return ELIGIBLE_ROLE_SET.has(user.role);
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
    default:
      return getAdministrativeRoleDisplayName(role);
  }
}

/**
 * Creates a proxy User object with `role: 'teacher'` while preserving all of the
 * real user's identity, tenant membership, teaching allocations, and metadata.
 */
export function createSubjectTeacherProxyUser(user: User): User {
  return {
    ...user,
    role: 'teacher',
  };
}
