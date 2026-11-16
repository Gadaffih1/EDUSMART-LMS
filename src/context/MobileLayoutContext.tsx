import React, { createContext, useContext, useState, useEffect } from 'react';
import { ClientDataStore } from '../utils/clientDataStore';

interface MobileLayoutContextType {
  isMobileOverlapProtectionEnabled: boolean;
  setMobileOverlapProtection: (enabled: boolean) => void;
  toggleMobileOverlapProtection: () => void;
  isQuickActionsDocked: boolean;
  setIsQuickActionsDocked: (docked: boolean) => void;
  toggleQuickActionsDocked: () => void;
  isMobileViewport: boolean;
}

const STORAGE_KEY_OVERLAP = 'edusmart_mobile_overlap_protection_v1';
const STORAGE_KEY_DOCKED = 'edusmart_quickactions_docked_mobile_v1';

const MobileLayoutContext = createContext<MobileLayoutContextType | undefined>(undefined);

export const MobileLayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileOverlapProtectionEnabled, setIsMobileOverlapProtectionEnabled] = useState<boolean>(() =>
    ClientDataStore.getPreference<boolean>(STORAGE_KEY_OVERLAP, true)
  );

  const [isQuickActionsDocked, setIsQuickActionsDockedState] = useState<boolean>(() =>
    ClientDataStore.getPreference<boolean>(STORAGE_KEY_DOCKED, false)
  );

  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobileViewport(window.innerWidth < 768);
    };
    const handlePrefSync = (evt: Event) => {
      const key = (evt as CustomEvent)?.detail?.key;
      if (key === '*' || key === 'user_preferences') {
        setIsMobileOverlapProtectionEnabled(ClientDataStore.getPreference<boolean>(STORAGE_KEY_OVERLAP, true));
        setIsQuickActionsDockedState(ClientDataStore.getPreference<boolean>(STORAGE_KEY_DOCKED, false));
      }
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('edusmart:data-changed', handlePrefSync);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('edusmart:data-changed', handlePrefSync);
    };
  }, []);

  const setMobileOverlapProtection = (enabled: boolean) => {
    setIsMobileOverlapProtectionEnabled(enabled);
    ClientDataStore.setPreference(STORAGE_KEY_OVERLAP, enabled);
  };

  const toggleMobileOverlapProtection = () => {
    setMobileOverlapProtection(!isMobileOverlapProtectionEnabled);
  };

  const setIsQuickActionsDocked = (docked: boolean) => {
    setIsQuickActionsDockedState(docked);
    ClientDataStore.setPreference(STORAGE_KEY_DOCKED, docked);
  };

  const toggleQuickActionsDocked = () => {
    setIsQuickActionsDocked(!isQuickActionsDocked);
  };

  return (
    <MobileLayoutContext.Provider
      value={{
        isMobileOverlapProtectionEnabled,
        setMobileOverlapProtection,
        toggleMobileOverlapProtection,
        isQuickActionsDocked,
        setIsQuickActionsDocked,
        toggleQuickActionsDocked,
        isMobileViewport
      }}
    >
      {children}
    </MobileLayoutContext.Provider>
  );
};

export const useMobileLayout = (): MobileLayoutContextType => {
  const context = useContext(MobileLayoutContext);
  if (!context) {
    throw new Error('useMobileLayout must be used within a MobileLayoutProvider');
  }
  return context;
};
