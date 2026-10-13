import React, { createContext, useContext, useState, useEffect } from 'react';

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
  // Overlap protection is enabled by default to prevent screen collisions on mobile phones
  const [isMobileOverlapProtectionEnabled, setIsMobileOverlapProtectionEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_OVERLAP);
      if (stored !== null) return stored === 'true';
    } catch {
      // Fallback
    }
    return true; // Enabled by default
  });

  const [isQuickActionsDocked, setIsQuickActionsDocked] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DOCKED);
      if (stored !== null) return stored === 'true';
    } catch {
      // Fallback
    }
    return false;
  });

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

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const setMobileOverlapProtection = (enabled: boolean) => {
    setIsMobileOverlapProtectionEnabled(enabled);
    try {
      localStorage.setItem(STORAGE_KEY_OVERLAP, String(enabled));
    } catch {
      // Ignore
    }
  };

  const toggleMobileOverlapProtection = () => {
    setMobileOverlapProtection(!isMobileOverlapProtectionEnabled);
  };

  const toggleQuickActionsDocked = () => {
    setIsQuickActionsDocked(prev => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY_DOCKED, String(next));
      } catch {
        // Ignore
      }
      return next;
    });
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
