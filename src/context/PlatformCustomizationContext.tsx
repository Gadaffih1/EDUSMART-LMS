import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  PlatformCustomizationState,
  LandingHeaderConfig,
  LandingNavLink,
  LandingHeroConfig,
  LandingFeatureItem,
  LandingStatItem,
  LandingAboutConfig,
  LandingTestimonialItem,
  LandingPricingTier,
  LandingFaqItem,
  LandingContactConfig,
  LandingFooterConfig,
  LandingSectionsVisibility,
  WorkspaceModuleConfig,
  GlobalPlatformSettings,
  ClassTeacherModulePolicy,
  OperationsGovernancePolicy
} from '../types/customization';
import { ClientDataStore } from '../utils/clientDataStore';
import { DEFAULT_PLATFORM_CUSTOMIZATION } from '../data/defaultCustomization';

const STORAGE_KEY = 'edusmart_platform_customization_v6';
const PACK_KEY = 'edusmart_platform_customization_pack_v1';

function customizationDefaults(): PlatformCustomizationState {
  const parsed = ClientDataStore.getCollection<Partial<PlatformCustomizationState> | null>(PACK_KEY, null);
  if (parsed && parsed.landingPage && Object.keys(parsed.landingPage).length > 0) {
    return {
      ...DEFAULT_PLATFORM_CUSTOMIZATION,
      ...parsed,
      landingPage: {
        ...DEFAULT_PLATFORM_CUSTOMIZATION.landingPage,
        ...parsed.landingPage,
        visibility: {
          ...DEFAULT_PLATFORM_CUSTOMIZATION.landingPage.visibility,
          ...(parsed.landingPage.visibility || {}),
        },
        header: {
          ...DEFAULT_PLATFORM_CUSTOMIZATION.landingPage.header,
          ...(parsed.landingPage.header || {}),
        },
        hero: {
          ...DEFAULT_PLATFORM_CUSTOMIZATION.landingPage.hero,
          ...(parsed.landingPage.hero || {}),
        },
        about: {
          ...DEFAULT_PLATFORM_CUSTOMIZATION.landingPage.about,
          ...(parsed.landingPage.about || {}),
        },
        contact: {
          ...DEFAULT_PLATFORM_CUSTOMIZATION.landingPage.contact,
          ...(parsed.landingPage.contact || {}),
        },
        footer: {
          ...DEFAULT_PLATFORM_CUSTOMIZATION.landingPage.footer,
          ...(parsed.landingPage.footer || {}),
        },
      },
    };
  }
  return DEFAULT_PLATFORM_CUSTOMIZATION;
}

function hydrateCustomizationState(): PlatformCustomizationState {
  const def = customizationDefaults();
  const parsed = ClientDataStore.getCollection<Partial<PlatformCustomizationState> | null>(STORAGE_KEY, null);
  if (!parsed || typeof parsed !== 'object') {
    return def;
  }

  return {
    ...def,
    ...parsed,
    landingPage: {
      ...def.landingPage,
      ...(parsed.landingPage || {}),
      visibility: {
        ...def.landingPage.visibility,
        ...(parsed.landingPage?.visibility || {}),
      },
      header: {
        ...def.landingPage.header,
        ...(parsed.landingPage?.header || {}),
        loginButtonLabel:
          parsed.landingPage?.header?.loginButtonLabel && parsed.landingPage.header.loginButtonLabel !== 'School Login'
            ? parsed.landingPage.header.loginButtonLabel
            : 'Login',
      },
      hero: {
        ...def.landingPage.hero,
        ...(parsed.landingPage?.hero || {}),
        mediaType: parsed.landingPage?.hero?.mediaType === 'video' ? 'video' : 'image',
        primaryCta:
          parsed.landingPage?.hero?.primaryCta && parsed.landingPage.hero.primaryCta !== 'School Login'
            ? parsed.landingPage.hero.primaryCta
            : 'Login',
        heroImageUrl:
          !parsed.landingPage?.hero?.heroImageUrl ||
          parsed.landingPage?.hero?.heroImageUrl === '/src/assets/images/edusmart_campus_banner_1790859700873.jpg' ||
          parsed.landingPage?.hero?.heroImageUrl === '/gad@edusmart.jpeg'
            ? '/assets/aistudio/WhatsApp_Image_2026-10-22_at_13.45.08_2f8393b6.jpeg'
            : parsed.landingPage.hero.heroImageUrl,
        heroVideoPoster:
          !parsed.landingPage?.hero?.heroVideoPoster ||
          parsed.landingPage?.hero?.heroVideoPoster === '/src/assets/images/edusmart_campus_banner_1790859700873.jpg'
            ? '/assets/aistudio/WhatsApp_Image_2026-10-22_at_13.45.08_2f8393b6.jpeg'
            : parsed.landingPage.hero.heroVideoPoster,
      },
      stats:
        Array.isArray(parsed.landingPage?.stats) && parsed.landingPage.stats.length > 0
          ? parsed.landingPage.stats
          : def.landingPage.stats,
      features:
        Array.isArray(parsed.landingPage?.features) && parsed.landingPage.features.length > 0
          ? parsed.landingPage.features
          : def.landingPage.features,
      testimonials:
        Array.isArray(parsed.landingPage?.testimonials) && parsed.landingPage.testimonials.length > 0
          ? parsed.landingPage.testimonials
          : def.landingPage.testimonials,
      pricing:
        Array.isArray(parsed.landingPage?.pricing) && parsed.landingPage.pricing.length > 0
          ? parsed.landingPage.pricing
          : def.landingPage.pricing,
      faqs:
        Array.isArray(parsed.landingPage?.faqs) && parsed.landingPage.faqs.length > 0
          ? parsed.landingPage.faqs
          : def.landingPage.faqs,
      about: {
        ...def.landingPage.about,
        ...(parsed.landingPage?.about || {}),
      },
      contact: {
        ...def.landingPage.contact,
        ...(parsed.landingPage?.contact || {}),
      },
      footer: {
        ...def.landingPage.footer,
        ...(parsed.landingPage?.footer || {}),
      },
    },
    workspaces: (() => {
      if (!parsed.workspaces || parsed.workspaces.length === 0) {
        return def.workspaces;
      }
      const existingIds = new Set(parsed.workspaces.map((w: any) => w.id));
      const merged = [...parsed.workspaces];
      for (const defWs of def.workspaces) {
        if (!existingIds.has(defWs.id)) {
          merged.push(defWs);
          existingIds.add(defWs.id);
        }
      }
      return merged;
    })(),
    globalSettings: {
      ...def.globalSettings,
      ...(parsed.globalSettings || {}),
      virtualLabPolicy: {
        publicAccessMode: 'subscription_required',
        requirePaidSubscriptionOnPublicPage: true,
        allowFreePublicDemo: false,
        freeForMemberSchools: true,
        ...(def.globalSettings?.virtualLabPolicy || {}),
        ...(parsed.globalSettings?.virtualLabPolicy || {}),
      },
    },
    classTeacherPolicy: {
      ...(DEFAULT_PLATFORM_CUSTOMIZATION.classTeacherPolicy as ClassTeacherModulePolicy),
      ...(def.classTeacherPolicy || {}),
      ...(parsed.classTeacherPolicy || {}),
    },
    operationsPolicy: {
      ...(DEFAULT_PLATFORM_CUSTOMIZATION.operationsPolicy as OperationsGovernancePolicy),
      ...(def.operationsPolicy || {}),
      ...(parsed.operationsPolicy || {}),
    },
  };
}

interface PlatformCustomizationContextType {
  customization: PlatformCustomizationState;
  updateLandingVisibility: (visibility: Partial<LandingSectionsVisibility>) => void;
  toggleSectionVisibility: (section: keyof LandingSectionsVisibility) => void;
  updateLandingHeader: (header: Partial<LandingHeaderConfig>) => void;
  addNavLink: (link: LandingNavLink) => void;
  updateNavLink: (id: string, link: Partial<LandingNavLink>) => void;
  removeNavLink: (id: string) => void;
  updateLandingHero: (hero: Partial<LandingHeroConfig>) => void;
  addTrustBadge: (badge: string) => void;
  removeTrustBadge: (index: number) => void;
  addFeature: (feature: LandingFeatureItem) => void;
  updateFeature: (id: string, feature: Partial<LandingFeatureItem>) => void;
  removeFeature: (id: string) => void;
  addStat: (stat: LandingStatItem) => void;
  updateStat: (id: string, stat: Partial<LandingStatItem>) => void;
  removeStat: (id: string) => void;
  updateAbout: (about: Partial<LandingAboutConfig>) => void;
  addTestimonial: (test: LandingTestimonialItem) => void;
  updateTestimonial: (id: string, test: Partial<LandingTestimonialItem>) => void;
  removeTestimonial: (id: string) => void;
  addPricingTier: (tier: LandingPricingTier) => void;
  updatePricingTier: (id: string, tier: Partial<LandingPricingTier>) => void;
  removePricingTier: (id: string) => void;
  addFaq: (faq: LandingFaqItem) => void;
  updateFaq: (id: string, faq: Partial<LandingFaqItem>) => void;
  removeFaq: (id: string) => void;
  updateContact: (contact: Partial<LandingContactConfig>) => void;
  updateFooter: (footer: Partial<LandingFooterConfig>) => void;
  updateWorkspace: (id: string, update: Partial<WorkspaceModuleConfig>) => void;
  toggleWorkspace: (id: string) => void;
  addCustomWorkspace: (workspace: WorkspaceModuleConfig) => void;
  removeCustomWorkspace: (id: string) => void;
  updateGlobalSettings: (settings: Partial<GlobalPlatformSettings>) => void;
  updateClassTeacherPolicy: (policy: Partial<ClassTeacherModulePolicy>) => void;
  updateOperationsPolicy: (policy: Partial<OperationsGovernancePolicy>) => void;
  updateSchoolOverride: (schoolId: string, override: { disabledWorkspaceIds?: string[]; customNotice?: string }) => void;
  resetToDefaults: () => void;
  exportConfiguration: () => string;
  importConfiguration: (jsonStr: string) => boolean;
  isWorkspaceEnabled: (workspaceId: string, schoolId?: string) => boolean;
}

const PlatformCustomizationContext = createContext<PlatformCustomizationContextType | undefined>(undefined);

export const PlatformCustomizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customization, setCustomization] = useState<PlatformCustomizationState>(hydrateCustomizationState);

  // Sync live updates from backend SSE stream / hydration without overwriting server on mount
  useEffect(() => {
    const handleSync = (evt: Event) => {
      const key = (evt as CustomEvent)?.detail?.key;
      if (key === '*' || key === STORAGE_KEY || key === PACK_KEY) {
        setCustomization(hydrateCustomizationState());
      }
    };
    window.addEventListener('edusmart:data-changed', handleSync);
    return () => window.removeEventListener('edusmart:data-changed', handleSync);
  }, []);

  const commitCustomization = useCallback((updater: (prev: PlatformCustomizationState) => PlatformCustomizationState) => {
    setCustomization((prev) => {
      const next = updater(prev);
      void ClientDataStore.savePlatformSettings(next);
      return next;
    });
  }, []);

  const updateLandingVisibility = (visibility: Partial<LandingSectionsVisibility>) => {
    commitCustomization((prev) => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        visibility: {
          ...prev.landingPage.visibility,
          ...visibility,
        },
      },
    }));
  };

  const toggleSectionVisibility = (section: keyof LandingSectionsVisibility) => {
    commitCustomization((prev) => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        visibility: {
          ...prev.landingPage.visibility,
          [section]: !prev.landingPage.visibility[section],
        },
      },
    }));
  };

  const updateLandingHeader = (header: Partial<LandingHeaderConfig>) => {
    commitCustomization((prev) => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        header: {
          ...prev.landingPage.header,
          ...header,
        },
      },
    }));
  };

  const addNavLink = (link: LandingNavLink) => {
    commitCustomization((prev) => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        header: {
          ...prev.landingPage.header,
          navLinks: [...prev.landingPage.header.navLinks, link],
        },
      },
    }));
  };

  const updateNavLink = (id: string, link: Partial<LandingNavLink>) => {
    commitCustomization((prev) => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        header: {
          ...prev.landingPage.header,
          navLinks: prev.landingPage.header.navLinks.map((l) => (l.id === id ? { ...l, ...link } : l)),
        },
      },
    }));
  };

  const removeNavLink = (id: string) => {
    commitCustomization((prev) => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        header: {
          ...prev.landingPage.header,
          navLinks: prev.landingPage.header.navLinks.filter((l) => l.id !== id),
        },
      },
    }));
  };

  const updateLandingHero = (hero: Partial<LandingHeroConfig>) => {
    commitCustomization((prev) => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        hero: {
          ...prev.landingPage.hero,
          ...hero,
        },
      },
    }));
  };

  const addTrustBadge = (badge: string) => {
    commitCustomization((prev) => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        hero: {
          ...prev.landingPage.hero,
          trustBadges: [...(prev.landingPage.hero.trustBadges || []), badge],
        },
      },
    }));
  };

  const removeTrustBadge = (index: number) => {
    commitCustomization((prev) => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        hero: {
          ...prev.landingPage.hero,
          trustBadges: prev.landingPage.hero.trustBadges.filter((_, i) => i !== index),
        },
      },
    }));
  };

  const addFeature = (feature: LandingFeatureItem) => {
    commitCustomization((prev) => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        features: [...prev.landingPage.features, feature],
      },
    }));
  };

  const updateFeature = (id: string, feature: Partial<LandingFeatureItem>) => {
    commitCustomization((prev) => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        features: prev.landingPage.features.map((f) => (f.id === id ? { ...f, ...feature } : f)),
      },
    }));
  };

  const removeFeature = (id: string) => {
    commitCustomization((prev) => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        features: prev.landingPage.features.filter((f) => f.id !== id),
      },
    }));
  };

  const addStat = (stat: LandingStatItem) => {
    commitCustomization((prev) => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        stats: [...prev.landingPage.stats, stat],
      },
    }));
  };

  const updateStat = (id: string, stat: Partial<LandingStatItem>) => {
    commitCustomization((prev) => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        stats: prev.landingPage.stats.map((s) => (s.id === id ? { ...s, ...stat } : s)),
      },
    }));
  };

  const removeStat = (id: string) => {
    commitCustomization((prev) => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        stats: prev.landingPage.stats.filter((s) => s.id !== id),
      },
    }));
  };

  const updateAbout = (about: Partial<LandingAboutConfig>) => {
    commitCustomization((prev) => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        about: {
          ...prev.landingPage.about,
          ...about,
        },
      },
    }));
  };

  const addTestimonial = (test: LandingTestimonialItem) => {
    commitCustomization((prev) => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        testimonials: [...(prev.landingPage.testimonials || []), test],
      },
    }));
  };

  const updateTestimonial = (id: string, test: Partial<LandingTestimonialItem>) => {
    commitCustomization((prev) => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        testimonials: (prev.landingPage.testimonials || []).map((t) => (t.id === id ? { ...t, ...test } : t)),
      },
    }));
  };

  const removeTestimonial = (id: string) => {
    commitCustomization((prev) => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        testimonials: (prev.landingPage.testimonials || []).filter((t) => t.id !== id),
      },
    }));
  };

  const addPricingTier = (tier: LandingPricingTier) => {
    commitCustomization((prev) => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        pricing: [...prev.landingPage.pricing, tier],
      },
    }));
  };

  const updatePricingTier = (id: string, tier: Partial<LandingPricingTier>) => {
    commitCustomization((prev) => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        pricing: prev.landingPage.pricing.map((p) => (p.id === id ? { ...p, ...tier } : p)),
      },
    }));
  };

  const removePricingTier = (id: string) => {
    commitCustomization((prev) => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        pricing: prev.landingPage.pricing.filter((p) => p.id !== id),
      },
    }));
  };

  const addFaq = (faq: LandingFaqItem) => {
    commitCustomization((prev) => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        faqs: [...(prev.landingPage.faqs || []), faq],
      },
    }));
  };

  const updateFaq = (id: string, faq: Partial<LandingFaqItem>) => {
    commitCustomization((prev) => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        faqs: (prev.landingPage.faqs || []).map((f) => (f.id === id ? { ...f, ...faq } : f)),
      },
    }));
  };

  const removeFaq = (id: string) => {
    commitCustomization((prev) => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        faqs: (prev.landingPage.faqs || []).filter((f) => f.id !== id),
      },
    }));
  };

  const updateContact = (contact: Partial<LandingContactConfig>) => {
    commitCustomization((prev) => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        contact: {
          ...prev.landingPage.contact,
          ...contact,
        },
      },
    }));
  };

  const updateFooter = (footer: Partial<LandingFooterConfig>) => {
    commitCustomization((prev) => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        footer: {
          ...prev.landingPage.footer,
          ...footer,
        },
      },
    }));
  };

  const updateWorkspace = (id: string, update: Partial<WorkspaceModuleConfig>) => {
    commitCustomization((prev) => ({
      ...prev,
      workspaces: prev.workspaces.map((w) => (w.id === id ? { ...w, ...update } : w)),
    }));
  };

  const toggleWorkspace = (id: string) => {
    commitCustomization((prev) => ({
      ...prev,
      workspaces: prev.workspaces.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w)),
    }));
  };

  const addCustomWorkspace = (workspace: WorkspaceModuleConfig) => {
    commitCustomization((prev) => ({
      ...prev,
      workspaces: [...prev.workspaces, { ...workspace, isCustomModule: true }],
    }));
  };

  const removeCustomWorkspace = (id: string) => {
    commitCustomization((prev) => ({
      ...prev,
      workspaces: prev.workspaces.filter((w) => w.id !== id),
    }));
  };

  const updateGlobalSettings = (settings: Partial<GlobalPlatformSettings>) => {
    commitCustomization((prev) => ({
      ...prev,
      globalSettings: {
        ...prev.globalSettings,
        ...settings,
      },
    }));
  };

  const updateClassTeacherPolicy = (policy: Partial<ClassTeacherModulePolicy>) => {
    commitCustomization((prev) => ({
      ...prev,
      classTeacherPolicy: {
        ...(prev.classTeacherPolicy || customizationDefaults().classTeacherPolicy!),
        ...policy,
      },
    }));
  };

  const updateOperationsPolicy = (policy: Partial<OperationsGovernancePolicy>) => {
    commitCustomization((prev) => ({
      ...prev,
      operationsPolicy: {
        ...(prev.operationsPolicy || customizationDefaults().operationsPolicy!),
        ...policy,
      },
    }));
  };

  const updateSchoolOverride = (
    schoolId: string,
    override: { disabledWorkspaceIds?: string[]; customNotice?: string }
  ) => {
    commitCustomization((prev) => ({
      ...prev,
      schoolOverrides: {
        ...prev.schoolOverrides,
        [schoolId]: {
          ...(prev.schoolOverrides[schoolId] || {}),
          ...override,
        },
      },
    }));
  };

  const resetToDefaults = () => {
    commitCustomization(() => DEFAULT_PLATFORM_CUSTOMIZATION);
  };

  const exportConfiguration = () => {
    return JSON.stringify(customization, null, 2);
  };

  const importConfiguration = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.landingPage && parsed.workspaces) {
        commitCustomization(() => parsed);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to import configuration', e);
      return false;
    }
  };

  const isWorkspaceEnabled = (workspaceId: string, schoolId?: string): boolean => {
    const ws = customization.workspaces.find((w) => w.id === workspaceId);
    if (!ws || !ws.enabled) return false;
    if (schoolId && customization.schoolOverrides[schoolId]?.disabledWorkspaceIds?.includes(workspaceId)) {
      return false;
    }
    return true;
  };

  return (
    <PlatformCustomizationContext.Provider
      value={{
        customization,
        updateLandingVisibility,
        toggleSectionVisibility,
        updateLandingHeader,
        addNavLink,
        updateNavLink,
        removeNavLink,
        updateLandingHero,
        addTrustBadge,
        removeTrustBadge,
        addFeature,
        updateFeature,
        removeFeature,
        addStat,
        updateStat,
        removeStat,
        updateAbout,
        addTestimonial,
        updateTestimonial,
        removeTestimonial,
        addPricingTier,
        updatePricingTier,
        removePricingTier,
        addFaq,
        updateFaq,
        removeFaq,
        updateContact,
        updateFooter,
        updateWorkspace,
        toggleWorkspace,
        addCustomWorkspace,
        removeCustomWorkspace,
        updateGlobalSettings,
        updateClassTeacherPolicy,
        updateOperationsPolicy,
        updateSchoolOverride,
        resetToDefaults,
        exportConfiguration,
        importConfiguration,
        isWorkspaceEnabled,
      }}
    >
      {children}
    </PlatformCustomizationContext.Provider>
  );
};

export const usePlatformCustomization = (): PlatformCustomizationContextType => {
  const context = useContext(PlatformCustomizationContext);
  if (!context) {
    throw new Error('usePlatformCustomization must be used within a PlatformCustomizationProvider');
  }
  return context;
};
