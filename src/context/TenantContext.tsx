import React, { createContext, useContext, useState, useEffect } from 'react';
import { Tenant, TenantContextType } from '../types/tenant';
import { ClientDataStore } from '../utils/clientDataStore';
import { mergeDurableSchools, removeDurableSchool, saveDurableSchool } from '../utils/schoolRegistry';
import { INITIAL_TENANTS } from '../data/tenantsData';

const ALL_TENANTS_STORAGE_KEY = 'edusmart_all_tenants_registry';

const TenantContext = createContext<TenantContextType | undefined>(undefined);

function loadTenantsFromStore(): Tenant[] {
  const stored = ClientDataStore.getCollection<Tenant[]>(ALL_TENANTS_STORAGE_KEY, []);
  if (Array.isArray(stored) && stored.length > 0) {
    return mergeDurableSchools(stored);
  }
  const fallbackTenants = ClientDataStore.getCollection<Tenant[]>('tenants', []);
  if (Array.isArray(fallbackTenants) && fallbackTenants.length > 0) {
    return mergeDurableSchools(fallbackTenants);
  }
  return mergeDurableSchools(INITIAL_TENANTS);
}

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allTenants, setAllTenants] = useState<Tenant[]>(loadTenantsFromStore);

  const [currentTenantId, setCurrentTenantId] = useState<string>(() => {
    const sessionTenant = ClientDataStore.getSessionUser()?.schoolId || ClientDataStore.getActiveTenantId();
    const loaded = loadTenantsFromStore();
    if (sessionTenant && loaded.some((t) => t.id === sessionTenant)) {
      return sessionTenant;
    }
    return loaded[0]?.id || 'tenant-riara';
  });

  // React to backend hydration and real-time SSE tenant updates
  useEffect(() => {
    const syncTenants = () => {
      const next = loadTenantsFromStore();
      setAllTenants(next);
      const activeId = ClientDataStore.getActiveTenantId() || ClientDataStore.getSessionUser()?.schoolId;
      if (activeId && next.some((t) => t.id === activeId)) {
        setCurrentTenantId(activeId);
      }
    };
    const onDataChanged = (evt: Event) => {
      const key = (evt as CustomEvent)?.detail?.key;
      if (key === '*' || key === ALL_TENANTS_STORAGE_KEY || key === 'tenants' || key === 'edusmart_school_registry_v1') {
        syncTenants();
      }
    };
    window.addEventListener('tenants-synced', syncTenants);
    window.addEventListener('edusmart:data-changed', onDataChanged);
    return () => {
      window.removeEventListener('tenants-synced', syncTenants);
      window.removeEventListener('edusmart:data-changed', onDataChanged);
    };
  }, []);

  const currentTenant = allTenants.find((t) => t.id === currentTenantId) || allTenants[0] || {
    id: '',
    name: '',
    shortName: '',
    motto: '',
    code: '',
    crestIcon: 'school' as const,
    themeColor: 'blue',
    badgeColorClass: '',
    headerBgClass: '',
    domain: '',
    address: '',
    city: '',
    county: '',
    phone: '',
    email: '',
    principalName: '',
    principalTitle: '',
    registrationNumber: '',
    curriculum: '',
    establishedYear: new Date().getFullYear(),
    gradeLevels: '',
    term: '',
    academicYear: '',
    totalStudents: 0,
    totalFaculty: 0,
  };

  const switchTenant = async (tenantId: string): Promise<void> => {
    const target = allTenants.find((t) => t.id === tenantId);
    if (!target) return;

    setCurrentTenantId(tenantId);
    ClientDataStore.setActiveTenantId(tenantId);

    const existingUser = ClientDataStore.getSessionUser();
    if (existingUser && ClientDataStore.isSuperAdmin()) {
      ClientDataStore.setSessionUser({ ...existingUser, schoolId: tenantId });
    }

    window.dispatchEvent(new CustomEvent('tenant-changed', { detail: target }));

    // If super admin session is active, persist active tenant context server-side
    if (ClientDataStore.isSuperAdmin()) {
      try {
        await fetch('/api/auth/switch-tenant', {
          method: 'POST',
          credentials: 'include',
          headers: ClientDataStore.getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ schoolId: tenantId, tenantId }),
        });
        await ClientDataStore.hydrateFromBackend(true);
      } catch {
        // Ignore network errors while switching tenant view
      }
    }
  };

  const updateTenantBranding = (updates: Partial<Tenant>, tenantId?: string) => {
    const targetId = tenantId || currentTenant.id;
    setAllTenants((prev) => {
      const updated = prev.map((t) => (t.id === targetId ? { ...t, ...updates } : t));
      ClientDataStore.setCollection(ALL_TENANTS_STORAGE_KEY, updated);
      const savedTenant = updated.find((tenant) => tenant.id === targetId);
      if (savedTenant) saveDurableSchool(savedTenant);
      window.dispatchEvent(new CustomEvent('tenant-branding-updated', { detail: { tenantId: targetId, updates } }));
      return updated;
    });
  };

  const registerTenant = (newTenant: Tenant) => {
    setAllTenants((prev) => {
      const exists = prev.some((t) => t.id === newTenant.id || t.code === newTenant.code);
      const updated = exists
        ? prev.map((t) => (t.id === newTenant.id ? { ...t, ...newTenant } : t))
        : [...prev, newTenant];
      ClientDataStore.setCollection(ALL_TENANTS_STORAGE_KEY, updated);
      saveDurableSchool(newTenant);
      window.dispatchEvent(new CustomEvent('tenant-registered', { detail: newTenant }));
      return updated;
    });
  };

  const updateTenant = (tenantId: string, updates: Partial<Tenant>) => {
    setAllTenants((prev) => {
      const updated = prev.map((t) => (t.id === tenantId ? { ...t, ...updates } : t));
      ClientDataStore.setCollection(ALL_TENANTS_STORAGE_KEY, updated);
      const saved = updated.find((tenant) => tenant.id === tenantId);
      if (saved) saveDurableSchool(saved);
      window.dispatchEvent(new CustomEvent('tenant-updated', { detail: { tenantId, updates } }));
      return updated;
    });
  };

  const deleteTenant = (tenantId: string) => {
    setAllTenants((prev) => {
      if (prev.length <= 1) {
        console.warn('Cannot remove the only registered school tenant.');
        return prev;
      }
      const updated = prev.filter((t) => t.id !== tenantId);
      ClientDataStore.setCollection(ALL_TENANTS_STORAGE_KEY, updated);
      removeDurableSchool(tenantId);
      if (currentTenantId === tenantId) {
        const nextId = updated[0]?.id || 'tenant-riara';
        setCurrentTenantId(nextId);
        ClientDataStore.setActiveTenantId(nextId);
      }
      window.dispatchEvent(new CustomEvent('tenant-deleted', { detail: { tenantId } }));
      return updated;
    });
  };

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        allTenants,
        switchTenant,
        updateTenantBranding,
        registerTenant,
        updateTenant,
        deleteTenant,
        isMultiTenancyEnabled: true,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
