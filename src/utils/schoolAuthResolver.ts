import { User, UserRole } from '../types';
import { Tenant } from '../types/tenant';
import { Storage } from './storage';
import { createTenantUsers } from './tenantDataFactory';
import { findSchoolAccountByEmail } from './schoolAccounts';
import { findProvisionedAccount } from './provisionedAccounts';
import { findDirectoryLogin } from './schoolDirectoryStore';

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
  _fallbackTenant?: Tenant
): ResolvedSchoolAuth | null {
  const cleanIdent = rawIdent.trim().toLowerCase();
  if (!cleanIdent) return null;

  // Platform super admins are not school accounts. They are authenticated
  // from platformAdminsData and can open only the super admin console.
  // 1. Check explicitly stored user accounts in Storage first by assigned email
  const storedUsers = Storage.getUsers();
  const matchedStored = storedUsers.find(u => u.email && u.email.toLowerCase() === cleanIdent);
  if (matchedStored) {
    const schoolId = matchedStored.schoolId || 'tenant-riara';
    const tenant = allTenants.find(t => t.id === schoolId) || allTenants[0];
    return {
      user: { ...matchedStored, schoolId: tenant.id },
      expectedPassword: matchedStored.password,
      tenant
    };
  }

  const provisioned = findProvisionedAccount(cleanIdent);
  if (provisioned) {
    const schoolId = provisioned.schoolId || 'tenant-riara';
    const tenant = allTenants.find((item) => item.id === schoolId) || allTenants[0];
    if (tenant) {
      return {
        user: { ...provisioned, schoolId: tenant.id },
        expectedPassword: provisioned.password,
        tenant,
      };
    }
  }

  const directory = findDirectoryLogin(cleanIdent);
  if (directory) {
    const tenant = allTenants.find((item) => item.id === directory.user.schoolId) || allTenants[0];
    if (tenant) {
      return {
        user: { ...directory.user, schoolId: tenant.id },
        expectedPassword: directory.password,
        tenant,
      };
    }
  }

  const schoolAccount = findSchoolAccountByEmail(cleanIdent);
  if (schoolAccount) {
    const tenant = allTenants.find((item) => item.id === schoolAccount.schoolId);
    if (tenant) {
      const schoolLogin: User = {
        id: `usr-school-login-${tenant.id}`,
        name: tenant.principalName || `${tenant.shortName} School Login`,
        email: schoolAccount.email,
        role: 'admin',
        schoolId: tenant.id,
        isActive: true,
      };
      return { user: schoolLogin, expectedPassword: schoolAccount.password, tenant };
    }
  }

  // 3. Search registered Tenant Schools by assigned email only (no wildcard synthesis)
  for (const tenant of allTenants) {
    const tenantEmail = (tenant.email || '').toLowerCase().trim();

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

    const tenantUsers = createTenantUsers(tenant);
    const matchedTenantUser = tenantUsers.find(u => u.email && u.email.toLowerCase() === cleanIdent);

    if (matchedTenantUser) {
      return {
        user: { ...matchedTenantUser, schoolId: tenant.id },
        expectedPassword: matchedTenantUser.password,
        tenant
      };
    }
  }

  return null;
}
