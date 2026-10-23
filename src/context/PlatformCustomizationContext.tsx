import React, { createContext, useContext, useState, useEffect } from 'react';
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
import { SyncEngine } from '../utils/syncEngine';

const STORAGE_KEY = 'edusmart_platform_customization_v6';
const PACK_KEY = 'edusmart_platform_customization_pack_v1';

function customizationDefaults(): PlatformCustomizationState {
  try {
    const raw = localStorage.getItem(PACK_KEY);
    if (raw) return JSON.parse(raw) as PlatformCustomizationState;
  } catch {
    // The pack is loaded from Supabase before the app renders.
  }
  return {
    landingPage: {
      visibility: {} as LandingSectionsVisibility,
      header: {} as LandingHeaderConfig,
      hero: {} as LandingHeroConfig,
      stats: [],
      features: [],
      about: {} as LandingAboutConfig,
      testimonials: [],
      pricing: [],
      faqs: [],
      contact: {} as LandingContactConfig,
      footer: {} as LandingFooterConfig,
    },
    workspaces: [],
    globalSettings: {} as GlobalPlatformSettings,
    classTeacherPolicy: {} as ClassTeacherModulePolicy,
    operationsPolicy: {} as OperationsGovernancePolicy,
    schoolOverrides: {},
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
  const [customization, setCustomization] = useState<PlatformCustomizationState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...customizationDefaults(),
          ...parsed,
          landingPage: {
            ...customizationDefaults().landingPage,
            ...(parsed.landingPage || {}),
            visibility: {
              ...customizationDefaults().landingPage.visibility,
              ...(parsed.landingPage?.visibility || {})
            },
            header: {
              ...customizationDefaults().landingPage.header,
              ...(parsed.landingPage?.header || {}),
              loginButtonLabel: parsed.landingPage?.header?.loginButtonLabel && parsed.landingPage.header.loginButtonLabel !== 'School Login'
                ? parsed.landingPage.header.loginButtonLabel
                : 'Login',
            },
            hero: {
              ...customizationDefaults().landingPage.hero,
              ...(parsed.landingPage?.hero || {}),
              mediaType: parsed.landingPage?.hero?.mediaType === 'video' ? 'image' : (parsed.landingPage?.hero?.mediaType || 'image'),
              primaryCta: parsed.landingPage?.hero?.primaryCta && parsed.landingPage.hero.primaryCta !== 'School Login'
                ? parsed.landingPage.hero.primaryCta
                : 'Login',
              heroImageUrl: (!parsed.landingPage?.hero?.heroImageUrl || parsed.landingPage?.hero?.heroImageUrl === '/src/assets/images/edusmart_campus_banner_1790859700873.jpg' || parsed.landingPage?.hero?.heroImageUrl === '/gad@edusmart.jpeg')
                ? '/assets/aistudio/WhatsApp_Image_2026-10-22_at_13.45.08_2f8393b6.jpeg'
                : parsed.landingPage.hero.heroImageUrl,
              heroVideoPoster: (!parsed.landingPage?.hero?.heroVideoPoster || parsed.landingPage?.hero?.heroVideoPoster === '/src/assets/images/edusmart_campus_banner_1790859700873.jpg')
                ? '/assets/aistudio/WhatsApp_Image_2026-10-22_at_13.45.08_2f8393b6.jpeg'
                : parsed.landingPage.hero.heroVideoPoster
            },
            about: {
              ...customizationDefaults().landingPage.about,
              ...(parsed.landingPage?.about || {})
            },
            contact: {
              ...customizationDefaults().landingPage.contact,
              ...(parsed.landingPage?.contact || {})
            },
            footer: {
              ...customizationDefaults().landingPage.footer,
              ...(parsed.landingPage?.footer || {})
            }
          },
          workspaces: (() => {
            if (!parsed.workspaces || parsed.workspaces.length === 0) {
              return customizationDefaults().workspaces;
            }
            const existingIds = new Set(parsed.workspaces.map((w: any) => w.id));
            const merged = [...parsed.workspaces];
            for (const defWs of customizationDefaults().workspaces) {
              if (!existingIds.has(defWs.id)) {
                merged.push(defWs);
                existingIds.add(defWs.id);
              }
            }
            return merged;
          })(),
          globalSettings: {
            ...customizationDefaults().globalSettings,
            ...(parsed.globalSettings || {})
          },
          classTeacherPolicy: {
            ...customizationDefaults().classTeacherPolicy,
            ...(parsed.classTeacherPolicy || {})
          },
          operationsPolicy: {
            ...customizationDefaults().operationsPolicy,
            ...(parsed.operationsPolicy || {})
          }
        };
      }
    } catch (e) {
      console.error('Failed to load platform customization from localStorage', e);
    }
    return customizationDefaults();
  });

  // Save to localStorage on changes
  useEffect(() => {
    try {
      SyncEngine.persistItem(STORAGE_KEY, JSON.stringify(customization));
    } catch (e) {
      console.error('Failed to save platform customization to localStorage', e);
    }
  }, [customization]);

  const updateLandingVisibility = (visibility: Partial<LandingSectionsVisibility>) => {
    setCustomization(prev => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        visibility: {
          ...prev.landingPage.visibility,
          ...visibility
        }
      }
    }));
  };

  const toggleSectionVisibility = (section: keyof LandingSectionsVisibility) => {
    setCustomization(prev => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        visibility: {
          ...prev.landingPage.visibility,
          [section]: !prev.landingPage.visibility[section]
        }
      }
    }));
  };

  const updateLandingHeader = (header: Partial<LandingHeaderConfig>) => {
    setCustomization(prev => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        header: {
          ...prev.landingPage.header,
          ...header
        }
      }
    }));
  };

  const addNavLink = (link: LandingNavLink) => {
    setCustomization(prev => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        header: {
          ...prev.landingPage.header,
          navLinks: [...prev.landingPage.header.navLinks, link]
        }
      }
    }));
  };

  const updateNavLink = (id: string, link: Partial<LandingNavLink>) => {
    setCustomization(prev => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        header: {
          ...prev.landingPage.header,
          navLinks: prev.landingPage.header.navLinks.map(l => l.id === id ? { ...l, ...link } : l)
        }
      }
    }));
  };

  const removeNavLink = (id: string) => {
    setCustomization(prev => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        header: {
          ...prev.landingPage.header,
          navLinks: prev.landingPage.header.navLinks.filter(l => l.id !== id)
        }
      }
    }));
  };

  const updateLandingHero = (hero: Partial<LandingHeroConfig>) => {
    setCustomization(prev => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        hero: {
          ...prev.landingPage.hero,
          ...hero
        }
      }
    }));
  };

  const addTrustBadge = (badge: string) => {
    setCustomization(prev => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        hero: {
          ...prev.landingPage.hero,
          trustBadges: [...(prev.landingPage.hero.trustBadges || []), badge]
        }
      }
    }));
  };

  const removeTrustBadge = (index: number) => {
    setCustomization(prev => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        hero: {
          ...prev.landingPage.hero,
          trustBadges: prev.landingPage.hero.trustBadges.filter((_, i) => i !== index)
        }
      }
    }));
  };

  const addFeature = (feature: LandingFeatureItem) => {
    setCustomization(prev => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        features: [...prev.landingPage.features, feature]
      }
    }));
  };

  const updateFeature = (id: string, feature: Partial<LandingFeatureItem>) => {
    setCustomization(prev => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        features: prev.landingPage.features.map(f => f.id === id ? { ...f, ...feature } : f)
      }
    }));
  };

  const removeFeature = (id: string) => {
    setCustomization(prev => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        features: prev.landingPage.features.filter(f => f.id !== id)
      }
    }));
  };

  const addStat = (stat: LandingStatItem) => {
    setCustomization(prev => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        stats: [...prev.landingPage.stats, stat]
      }
    }));
  };

  const updateStat = (id: string, stat: Partial<LandingStatItem>) => {
    setCustomization(prev => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        stats: prev.landingPage.stats.map(s => s.id === id ? { ...s, ...stat } : s)
      }
    }));
  };

  const removeStat = (id: string) => {
    setCustomization(prev => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        stats: prev.landingPage.stats.filter(s => s.id !== id)
      }
    }));
  };

  const updateAbout = (about: Partial<LandingAboutConfig>) => {
    setCustomization(prev => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        about: {
          ...prev.landingPage.about,
          ...about
        }
      }
    }));
  };

  const addTestimonial = (test: LandingTestimonialItem) => {
    setCustomization(prev => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        testimonials: [...(prev.landingPage.testimonials || []), test]
      }
    }));
  };

  const updateTestimonial = (id: string, test: Partial<LandingTestimonialItem>) => {
    setCustomization(prev => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        testimonials: (prev.landingPage.testimonials || []).map(t => t.id === id ? { ...t, ...test } : t)
      }
    }));
  };

  const removeTestimonial = (id: string) => {
    setCustomization(prev => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        testimonials: (prev.landingPage.testimonials || []).filter(t => t.id !== id)
      }
    }));
  };

  const addPricingTier = (tier: LandingPricingTier) => {
    setCustomization(prev => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        pricing: [...prev.landingPage.pricing, tier]
      }
    }));
  };

  const updatePricingTier = (id: string, tier: Partial<LandingPricingTier>) => {
    setCustomization(prev => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        pricing: prev.landingPage.pricing.map(p => p.id === id ? { ...p, ...tier } : p)
      }
    }));
  };

  const removePricingTier = (id: string) => {
    setCustomization(prev => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        pricing: prev.landingPage.pricing.filter(p => p.id !== id)
      }
    }));
  };

  const addFaq = (faq: LandingFaqItem) => {
    setCustomization(prev => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        faqs: [...(prev.landingPage.faqs || []), faq]
      }
    }));
  };

  const updateFaq = (id: string, faq: Partial<LandingFaqItem>) => {
    setCustomization(prev => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        faqs: (prev.landingPage.faqs || []).map(f => f.id === id ? { ...f, ...faq } : f)
      }
    }));
  };

  const removeFaq = (id: string) => {
    setCustomization(prev => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        faqs: (prev.landingPage.faqs || []).filter(f => f.id !== id)
      }
    }));
  };

  const updateContact = (contact: Partial<LandingContactConfig>) => {
    setCustomization(prev => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        contact: {
          ...prev.landingPage.contact,
          ...contact
        }
      }
    }));
  };

  const updateFooter = (footer: Partial<LandingFooterConfig>) => {
    setCustomization(prev => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        footer: {
          ...prev.landingPage.footer,
          ...footer
        }
      }
    }));
  };

  const updateWorkspace = (id: string, update: Partial<WorkspaceModuleConfig>) => {
    setCustomization(prev => ({
      ...prev,
      workspaces: prev.workspaces.map(w => w.id === id ? { ...w, ...update } : w)
    }));
  };

  const toggleWorkspace = (id: string) => {
    setCustomization(prev => ({
      ...prev,
      workspaces: prev.workspaces.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w)
    }));
  };

  const addCustomWorkspace = (workspace: WorkspaceModuleConfig) => {
    setCustomization(prev => ({
      ...prev,
      workspaces: [...prev.workspaces, { ...workspace, isCustomModule: true }]
    }));
  };

  const removeCustomWorkspace = (id: string) => {
    setCustomization(prev => ({
      ...prev,
      workspaces: prev.workspaces.filter(w => w.id !== id)
    }));
  };

  const updateGlobalSettings = (settings: Partial<GlobalPlatformSettings>) => {
    setCustomization(prev => ({
      ...prev,
      globalSettings: {
        ...prev.globalSettings,
        ...settings
      }
    }));
  };

  const updateClassTeacherPolicy = (policy: Partial<ClassTeacherModulePolicy>) => {
    setCustomization(prev => ({
      ...prev,
      classTeacherPolicy: {
        ...(prev.classTeacherPolicy || customizationDefaults().classTeacherPolicy!),
        ...policy
      }
    }));
  };

  const updateOperationsPolicy = (policy: Partial<OperationsGovernancePolicy>) => {
    setCustomization(prev => ({
      ...prev,
      operationsPolicy: {
        ...(prev.operationsPolicy || customizationDefaults().operationsPolicy!),
        ...policy
      }
    }));
  };

  const updateSchoolOverride = (schoolId: string, override: { disabledWorkspaceIds?: string[]; customNotice?: string }) => {
    setCustomization(prev => ({
      ...prev,
      schoolOverrides: {
        ...prev.schoolOverrides,
        [schoolId]: {
          ...(prev.schoolOverrides[schoolId] || {}),
          ...override
        }
      }
    }));
  };

  const resetToDefaults = () => {
    setCustomization(customizationDefaults());
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
  };

  const exportConfiguration = () => {
    return JSON.stringify(customization, null, 2);
  };

  const importConfiguration = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.landingPage && parsed.workspaces) {
        setCustomization(parsed);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to import configuration', e);
      return false;
    }
  };

  const isWorkspaceEnabled = (workspaceId: string, schoolId?: string): boolean => {
    const ws = customization.workspaces.find(w => w.id === workspaceId);
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
        isWorkspaceEnabled
      }}
    >
      {children}
    </PlatformCustomizationContext.Provider>
  );
};

export const usePlatformCustomization = () => {
  const context = useContext(PlatformCustomizationContext);
  if (!context) {
    throw new Error('usePlatformCustomization must be used within a PlatformCustomizationProvider');
  }
  return context;
};
