import React, { createContext, useContext, useState, useEffect } from 'react';
import { Tenant, TenantContextType } from '../types/tenant';
import { INITIAL_TENANTS } from '../data/tenantsData';

const TENANT_STORAGE_KEY = 'edusmart_active_tenant_id';
const ALL_TENANTS_STORAGE_KEY = 'edusmart_all_tenants_registry';

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allTenants, setAllTenants] = useState<Tenant[]>(() => {
    try {
      const stored = localStorage.getItem(ALL_TENANTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return INITIAL_TENANTS;
  });

  const [currentTenantId, setCurrentTenantId] = useState<string>(() => {
    try {
      const storedId = localStorage.getItem(TENANT_STORAGE_KEY);
      if (storedId && allTenants.some(t => t.id === storedId)) {
        return storedId;
      }
    } catch {
      // Fallback
    }
    return allTenants[0]?.id || 'tenant-staustins';
  });

  const currentTenant = allTenants.find(t => t.id === currentTenantId) || allTenants[0] || INITIAL_TENANTS[0];

  const switchTenant = (tenantId: string) => {
    const target = allTenants.find(t => t.id === tenantId);
    if (target) {
      setCurrentTenantId(tenantId);
      try {
        localStorage.setItem(TENANT_STORAGE_KEY, tenantId);
        window.dispatchEvent(new CustomEvent('tenant-changed', { detail: target }));
      } catch (err) {
        console.error('Failed to persist tenant selection:', err);
      }
    }
  };

  const updateTenantBranding = (updates: Partial<Tenant>, tenantId?: string) => {
    const targetId = tenantId || currentTenant.id;
    setAllTenants(prev => {
      const updated = prev.map(t => (t.id === targetId ? { ...t, ...updates } : t));
      try {
        localStorage.setItem(ALL_TENANTS_STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('tenant-branding-updated', { detail: { tenantId: targetId, updates } }));
      } catch (err) {
        console.error('Failed to save updated tenant branding:', err);
      }
      return updated;
    });
  };

  const registerTenant = (newTenant: Tenant) => {
    setAllTenants(prev => {
      // Check if already exists
      const exists = prev.some(t => t.id === newTenant.id || t.code === newTenant.code);
      const updated = exists 
        ? prev.map(t => (t.id === newTenant.id ? { ...t, ...newTenant } : t))
        : [...prev, newTenant];
      try {
        localStorage.setItem(ALL_TENANTS_STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('tenant-registered', { detail: newTenant }));
      } catch (err) {
        console.error('Failed to save registered tenant:', err);
      }
      return updated;
    });
  };

  const updateTenant = (tenantId: string, updates: Partial<Tenant>) => {
    setAllTenants(prev => {
      const updated = prev.map(t => (t.id === tenantId ? { ...t, ...updates } : t));
      try {
        localStorage.setItem(ALL_TENANTS_STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('tenant-updated', { detail: { tenantId, updates } }));
      } catch (err) {
        console.error('Failed to update tenant:', err);
      }
      return updated;
    });
  };

  const deleteTenant = (tenantId: string) => {
    setAllTenants(prev => {
      if (prev.length <= 1) {
        alert('Cannot remove the only registered school tenant.');
        return prev;
      }
      const updated = prev.filter(t => t.id !== tenantId);
      try {
        localStorage.setItem(ALL_TENANTS_STORAGE_KEY, JSON.stringify(updated));
        if (currentTenantId === tenantId) {
          const nextId = updated[0]?.id || 'tenant-staustins';
          setCurrentTenantId(nextId);
          localStorage.setItem(TENANT_STORAGE_KEY, nextId);
        }
        window.dispatchEvent(new CustomEvent('tenant-deleted', { detail: { tenantId } }));
      } catch (err) {
        console.error('Failed to delete tenant:', err);
      }
      return updated;
    });
  };

  useEffect(() => {
    try {
      localStorage.setItem(TENANT_STORAGE_KEY, currentTenant.id);
    } catch {
      // Ignore
    }
  }, [currentTenant.id]);

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
        isMultiTenancyEnabled: true
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
