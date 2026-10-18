import { User, UserRole } from '../types';
import { Tenant } from '../types/tenant';
import { Storage } from './storage';
import { INITIAL_USERS } from '../data/initialData';
import { createTenantUsers } from './tenantDataFactory';

export interface ResolvedSchoolAuth {
  user: User;
  expectedPassword?: string;
  tenant: Tenant;
}

/**
 * Resolves the tenant school and user identity solely from the user's institutional email or identifier.
 * Campus selection is removed: the school email and its password identify the exact tenant school.
 * Enforces strict multi-tenancy isolation so no user can cross over into another school.
 */
export function resolveSchoolUserAndTenant(
  rawIdent: string,
  allTenants: Tenant[],
  fallbackTenant?: Tenant
): ResolvedSchoolAuth | null {
  const cleanIdent = rawIdent.trim().toLowerCase();
  if (!cleanIdent) return null;

  // 1. Platform Super Admin Check (Platform owner only - not bound to any single school)
  if (cleanIdent === 'admin@edusmart.ac.ke' || cleanIdent === 'superadmin@edusmart.ac.ke') {
    const defaultTenant = fallbackTenant || allTenants[0];
    const superAdmin: User = {
      id: 'usr-admin-1',
      name: 'Main Administrator (Platform Super Admin)',
      email: cleanIdent,
      role: 'admin',
      schoolId: defaultTenant.id,
      isActive: true,
    };
    return { user: superAdmin, expectedPassword: 'admin2026', tenant: defaultTenant };
  }

  // 2. Search registered Tenant Schools
  for (const tenant of allTenants) {
    const tenantEmail = (tenant.email || '').toLowerCase().trim();
    const tenantDomain = (tenant.domain || '').toLowerCase().trim();
    const tenantEmailDomain = tenantEmail.includes('@') ? tenantEmail.split('@')[1].toLowerCase().trim() : '';
    const schoolSlug = tenant.shortName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const schoolCode = (tenant.code || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    // 2a. Direct match on school's official administrative/contact email
    if (tenantEmail && tenantEmail === cleanIdent) {
      const tenantAdmin: User = {
        id: `usr-admin-${tenant.id}`,
        name: tenant.principalName || `${tenant.shortName} Administrator`,
        email: rawIdent.trim(),
        role: 'admin',
        schoolId: tenant.id,
        isActive: true,
      };
      return { user: tenantAdmin, expectedPassword: 'admin2026', tenant };
    }

    // 2b. Check tenant roster generated specifically for this school
    const tenantUsers = createTenantUsers(tenant);
    const matchedTenantUser = tenantUsers.find(u =>
      (u.email && u.email.toLowerCase() === cleanIdent) ||
      (u.name && u.name.toLowerCase() === cleanIdent) ||
      (u.admissionNumber && u.admissionNumber.toLowerCase() === cleanIdent)
    );

    if (matchedTenantUser) {
      return {
        user: { ...matchedTenantUser, schoolId: tenant.id },
        expectedPassword: matchedTenantUser.password || 'admin2026',
        tenant
      };
    }

    // 2c. Check if email domain strictly matches this school's domain
    if (cleanIdent.includes('@')) {
      const emailDomain = cleanIdent.split('@')[1].toLowerCase().trim();

      const isDomainMatch = 
        (tenantDomain && emailDomain === tenantDomain) ||
        (tenantEmailDomain && emailDomain === tenantEmailDomain) ||
        (schoolSlug && emailDomain.startsWith(schoolSlug)) ||
        (schoolCode && emailDomain.includes(schoolCode));

      if (isDomainMatch) {
        const prefix = cleanIdent.split('@')[0];
        let role: UserRole = 'teacher';
        let defaultPassword = 'teach2026';

        if (prefix.includes('admin') || prefix.includes('principal') || prefix.includes('head')) {
          role = 'admin';
          defaultPassword = 'admin2026';
        } else if (prefix.includes('student') || prefix.includes('learner')) {
          role = 'student';
          defaultPassword = 'GR4@2026';
        } else if (prefix.includes('parent') || prefix.includes('guardian')) {
          role = 'parent';
          defaultPassword = 'parent2026';
        } else if (prefix.includes('nurse')) {
          role = 'nurse';
          defaultPassword = 'nurse2026';
        } else if (prefix.includes('transport')) {
          role = 'transport_team';
          defaultPassword = 'transport2026';
        } else if (prefix.includes('cocurricular')) {
          role = 'cocurricular_team';
          defaultPassword = 'cocurricular2026';
        } else if (prefix.includes('registrar') || prefix.includes('staff')) {
          role = 'school_admin_staff';
          defaultPassword = 'staff2026';
        }

        const generatedUser: User = {
          id: `usr-${tenant.id}-${prefix.replace(/[^a-z0-9]/g, '') || Date.now()}`,
          name: role === 'admin' 
            ? (tenant.principalName || `${tenant.shortName} Admin`) 
            : `${tenant.shortName} ${role.replace(/_/g, ' ')}`,
          email: rawIdent.trim(),
          role,
          schoolId: tenant.id,
          isActive: true,
        };
        return {
          user: generatedUser,
          expectedPassword: defaultPassword,
          tenant
        };
      }
    }
  }

  // 3. Check locally stored users in Storage
  const storedUsers = Storage.getUsers();
  const matchedStored = storedUsers.find(u =>
    (u.email && u.email.toLowerCase() === cleanIdent) ||
    (u.name && u.name.toLowerCase() === cleanIdent) ||
    (u.admissionNumber && u.admissionNumber.toLowerCase() === cleanIdent)
  );
  if (matchedStored) {
    const schoolId = matchedStored.schoolId || 'tenant-riara';
    const tenant = allTenants.find(t => t.id === schoolId) || allTenants[0];
    return {
      user: { ...matchedStored, schoolId: tenant.id },
      expectedPassword: matchedStored.password || 'admin2026',
      tenant
    };
  }

  // 4. Default Seed Users from INITIAL_USERS (Assigned strictly to Riara School tenant-riara)
  const matchedSeed = INITIAL_USERS.find(u =>
    (u.email && u.email.toLowerCase() === cleanIdent) ||
    (u.name && u.name.toLowerCase() === cleanIdent) ||
    (u.admissionNumber && u.admissionNumber.toLowerCase() === cleanIdent)
  );
  if (matchedSeed) {
    const riaraTenant = allTenants.find(t => t.id === 'tenant-riara') || allTenants[0];
    return {
      user: { ...matchedSeed, schoolId: riaraTenant.id },
      expectedPassword: matchedSeed.password,
      tenant: riaraTenant
    };
  }

  return null;
}
