import React, { useState } from 'react';
import { 
  Sparkles, 
  Edit3, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  X, 
  Save, 
  RotateCcw, 
  Download, 
  Upload, 
  Eye, 
  EyeOff,
  Star,
  Layers, 
  Globe, 
  School, 
  Users, 
  BookOpen, 
  GraduationCap, 
  ShieldCheck, 
  Settings, 
  Palette, 
  AlertTriangle, 
  Megaphone, 
  Sliders, 
  Check, 
  Clock, 
  BarChart3, 
  Calendar, 
  Laptop, 
  Building2, 
  Shield, 
  Award,
  ChevronRight,
  ExternalLink,
  UserCheck,
  Wallet,
  ShoppingCart,
  Package,
  Video,
  Film,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  Info
} from 'lucide-react';
import { usePlatformCustomization } from '../../context/PlatformCustomizationContext';
import { useTenant } from '../../context/TenantContext';
import { 
  LandingFeatureItem, 
  LandingStatItem, 
  LandingPricingTier, 
  LandingSectionsVisibility,
  WorkspaceModuleConfig 
} from '../../types/customization';
import { listHeroVideoPresets, listHeroImagePresets } from '../../utils/heroPresets';
import { HeroBannerMedia } from '../common/HeroBannerMedia';


const AVAILABLE_ICONS = [
  'School', 'GraduationCap', 'BookOpen', 'Users', 'Calendar', 
  'BarChart3', 'Laptop', 'ShieldCheck', 'Shield', 'Award', 
  'Building2', 'Layers', 'Sliders', 'Sparkles', 'Globe',
  'Wallet', 'ShoppingCart', 'Package'
];

export const PlatformStudioCustomizer: React.FC<{ onPreviewLanding?: () => void }> = ({ onPreviewLanding }) => {
  const {
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
    importConfiguration
  } = usePlatformCustomization();

  const { allTenants, updateTenant } = useTenant();

  const [activeTab, setActiveTab] = useState<'landing' | 'workspaces' | 'tenants' | 'broadcast' | 'json'>('landing');
  const [landingSubTab, setLandingSubTab] = useState<'visibility' | 'header' | 'hero' | 'stats' | 'features' | 'about' | 'testimonials' | 'pricing' | 'faqs' | 'contact' | 'footer'>('visibility');
  
  // Hero retention state & presets
  const [heroLastSavedAt, setHeroLastSavedAt] = useState<string>('Persistent & Active');
  const [heroSaveSuccess, setHeroSaveSuccess] = useState<boolean>(false);

  // Modals state
  const [editingFeature, setEditingFeature] = useState<LandingFeatureItem | null>(null);
  const [isNewFeatureModalOpen, setIsNewFeatureModalOpen] = useState(false);
  const [newFeature, setNewFeature] = useState<Partial<LandingFeatureItem>>({
    title: '',
    description: '',
    tag: 'Academics',
    icon: 'BookOpen',
    category: 'Academics',
    enabled: true
  });

  const [editingStat, setEditingStat] = useState<LandingStatItem | null>(null);
  const [isNewStatModalOpen, setIsNewStatModalOpen] = useState(false);
  const [newStat, setNewStat] = useState<Partial<LandingStatItem>>({
    label: '',
    value: '',
    subtext: '',
    icon: 'School'
  });

  const [editingWorkspace, setEditingWorkspace] = useState<WorkspaceModuleConfig | null>(null);
  const [isNewWorkspaceModalOpen, setIsNewWorkspaceModalOpen] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState<Partial<WorkspaceModuleConfig>>({
    id: `custom_ws_${Date.now()}`,
    name: '',
    shortName: '',
    description: '',
    category: 'Custom',
    icon: 'Sparkles',
    enabled: true,
    badgeText: 'Custom Module',
    accentColor: '#3b82f6',
    customNotice: 'Welcome to this specialized module.',
    allowedRoles: ['admin', 'teacher']
  });

  const [selectedSchoolForOverride, setSelectedSchoolForOverride] = useState<string>(allTenants[0]?.id || 'tenant-riara');
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [jsonInput, setJsonInput] = useState<string>('');

  const triggerToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 2500);
  };

  const handleSaveHeroSettings = () => {
    try {
      localStorage.setItem('edusmart_platform_customization', JSON.stringify(customization));
      localStorage.setItem('edusmart_platform_customization_v2', JSON.stringify(customization));
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setHeroLastSavedAt(`Saved at ${timeStr}`);
      setHeroSaveSuccess(true);
      triggerToast('Hero Section Copy & Calls To Action successfully saved and retained in persistent storage!');
      setTimeout(() => setHeroSaveSuccess(false), 3500);
    } catch (e) {
      console.error('Failed to persist hero customization:', e);
      triggerToast('Hero settings active in session memory.');
    }
  };

  const HERO_COPY_PRESETS = [
    {
      name: 'Kenyan CBC & National Excellence',
      pillTag: 'ONE PLATFORM. EVERY KENYAN SCHOOL.',
      headlineStart: 'Smarter School',
      headlineMid: 'Management.',
      headlineHighlight: 'Better CBC Learning.',
      subtitle: 'A complete digital platform for school administration, teaching, assessment and communication. Built specifically for Kenyan CBC and modern global curricula.',
      primaryCta: 'Login',
      primaryCtaAction: 'login' as const,
      secondaryCta: 'Register a School',
      secondaryCtaAction: 'register' as const
    },
    {
      name: 'STEM & Digital Campus',
      pillTag: 'FUTURE-READY STEM & CBC ECOSYSTEM',
      headlineStart: 'Empowering Next-Gen',
      headlineMid: 'Learners & Teachers.',
      headlineHighlight: 'Interactive Discovery.',
      subtitle: 'Comprehensive educational governance connecting roll call attendance, automated CBA assessment sheets, smart timetable coordination, and parent communications.',
      primaryCta: 'Explore Digital Portals',
      primaryCtaAction: 'portals' as const,
      secondaryCta: 'Request Executive Demo',
      secondaryCtaAction: 'demo' as const
    },
    {
      name: 'Holistic Academy & Moral Integrity',
      pillTag: 'LEARN · GROW · SUCCEED TOGETHER',
      headlineStart: 'Nurturing Academic Rigor,',
      headlineMid: 'Talent & Character.',
      headlineHighlight: 'Shining Bright.',
      subtitle: 'A high-trust digital sanctuary providing transparent grade tracking, biometric attendance, and seamless communication across school leadership and families.',
      primaryCta: 'Institutional Login',
      primaryCtaAction: 'login' as const,
      secondaryCta: 'Admissions & Inquiries',
      secondaryCtaAction: 'contact' as const
    }
  ];

  const [videoUploadError, setVideoUploadError] = useState<string | null>(null);
  const [isVideoUploading, setIsVideoUploading] = useState<boolean>(false);

  const handleHeroVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoUploadError(null);
    setIsVideoUploading(true);

    const objectUrl = URL.createObjectURL(file);
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = objectUrl;

    tempVideo.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      const videoDuration = tempVideo.duration;

      if (videoDuration > 30) {
        setVideoUploadError(
          `Video is ${Math.round(videoDuration)} seconds long. Maximum permitted hero showcase length is 30 seconds.`
        );
        setIsVideoUploading(false);
        return;
      }

      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const base64 = loadEvt.target?.result as string;
        updateLandingHero({
          mediaType: 'video',
          heroVideoUrl: base64,
          videoMaxDuration: Math.min(30, Math.ceil(videoDuration)),
          videoBadgeLabel: '30s Custom Showcase'
        });
        setIsVideoUploading(false);
        triggerToast(`30s Video uploaded successfully (${Math.round(videoDuration)}s)`);
      };
      reader.onerror = () => {
        setVideoUploadError('Failed to read video file.');
        setIsVideoUploading(false);
      };
      reader.readAsDataURL(file);
    };

    tempVideo.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setVideoUploadError('Could not process video format. Please select an MP4 or WebM video file.');
      setIsVideoUploading(false);
    };
  };

  const handleHeroImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      triggerToast('Please upload an image smaller than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const base64 = loadEvt.target?.result as string;
      updateLandingHero({
        mediaType: 'image',
        heroImageUrl: base64
      });
      triggerToast('Hero banner image updated successfully!');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveFeature = () => {
    if (editingFeature) {
      updateFeature(editingFeature.id, editingFeature);
      setEditingFeature(null);
      triggerToast('Feature card updated successfully!');
    }
  };

  const handleCreateFeature = () => {
    if (!newFeature.title || !newFeature.description) {
      triggerToast('Please provide a feature title and description.');
      return;
    }
    const item: LandingFeatureItem = {
      id: `feat-${Date.now()}`,
      title: newFeature.title,
      description: newFeature.description,
      tag: newFeature.tag || 'General',
      icon: newFeature.icon || 'BookOpen',
      category: newFeature.category || 'General',
      enabled: true
    };
    addFeature(item);
    setIsNewFeatureModalOpen(false);
    setNewFeature({
      title: '',
      description: '',
      tag: 'Academics',
      icon: 'BookOpen',
      category: 'Academics',
      enabled: true
    });
    triggerToast('New feature card added to landing page!');
  };

  const handleSaveStat = () => {
    if (editingStat) {
      updateStat(editingStat.id, editingStat);
      setEditingStat(null);
      triggerToast('Statistic metric updated!');
    }
  };

  const handleCreateStat = () => {
    if (!newStat.label || !newStat.value) {
      triggerToast('Please provide a label and metric value.');
      return;
    }
    const item: LandingStatItem = {
      id: `stat-${Date.now()}`,
      label: newStat.label,
      value: newStat.value,
      subtext: newStat.subtext || '',
      icon: newStat.icon || 'School'
    };
    addStat(item);
    setIsNewStatModalOpen(false);
    setNewStat({ label: '', value: '', subtext: '', icon: 'School' });
    triggerToast('New metric added to landing page!');
  };

  const handleSaveWorkspace = () => {
    if (editingWorkspace) {
      updateWorkspace(editingWorkspace.id, editingWorkspace);
      setEditingWorkspace(null);
      triggerToast(`${editingWorkspace.name} settings updated!`);
    }
  };

  const handleCreateCustomWorkspace = () => {
    if (!newWorkspace.name || !newWorkspace.description) {
      triggerToast('Please provide workspace name and description.');
      return;
    }
    const ws: WorkspaceModuleConfig = {
      id: `custom_ws_${Date.now()}`,
      name: newWorkspace.name,
      shortName: newWorkspace.shortName || newWorkspace.name,
      description: newWorkspace.description,
      category: newWorkspace.category || 'Custom',
      icon: newWorkspace.icon || 'Sparkles',
      enabled: true,
      badgeText: newWorkspace.badgeText || 'Custom',
      accentColor: newWorkspace.accentColor || '#6366f1',
      customNotice: newWorkspace.customNotice || 'Custom workspace active.',
      allowedRoles: newWorkspace.allowedRoles || ['admin'],
      isCustomModule: true
    };
    addCustomWorkspace(ws);
    setIsNewWorkspaceModalOpen(false);
    setNewWorkspace({
      id: `custom_ws_${Date.now()}`,
      name: '',
      shortName: '',
      description: '',
      category: 'Custom',
      icon: 'Sparkles',
      enabled: true,
      badgeText: 'Custom Module',
      accentColor: '#3b82f6',
      customNotice: 'Welcome to this specialized module.',
      allowedRoles: ['admin', 'teacher']
    });
    triggerToast('Brand new workspace module created!');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-left">
      
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-slate-950 font-black px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-emerald-300 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-slate-950" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="p-5 sm:p-6 bg-slate-950/80 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/10 text-amber-400 border border-amber-400/30 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Super Admin Full Control & Customization Engine</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-serif tracking-tight">
            Platform Customizer & Workspace Studio
          </h2>
          <p className="text-xs text-slate-400">
            Edit, add, remove, and customize every section of the Public Landing Page, all 15+ Portals, and Tenant Workspaces in real time.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {onPreviewLanding && (
            <button
              onClick={onPreviewLanding}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Preview Live Landing Page</span>
            </button>
          )}

          <button
            onClick={() => {
              if (confirm('Are you sure you want to reset all customizations to system defaults?')) {
                resetToDefaults();
                triggerToast('All platform configurations reset to default!');
              }
            }}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Reset to initial factory defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Main Studio Navigation Tabs */}
      <div className="flex overflow-x-auto bg-slate-950 border-b border-slate-800 px-4 sm:px-6 gap-2">
        <button
          onClick={() => setActiveTab('landing')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'landing'
              ? 'border-amber-400 text-amber-300 bg-amber-400/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Landing Page Customizer</span>
        </button>

        <button
          onClick={() => setActiveTab('workspaces')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'workspaces'
              ? 'border-amber-400 text-amber-300 bg-amber-400/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>All Portals & Workspaces ({customization.workspaces.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tenants')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'tenants'
              ? 'border-amber-400 text-amber-300 bg-amber-400/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <School className="w-4 h-4" />
          <span>Tenant School Overrides</span>
        </button>

        <button
          onClick={() => setActiveTab('broadcast')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'broadcast'
              ? 'border-amber-400 text-amber-300 bg-amber-400/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Global Broadcast & Banners</span>
        </button>

        <button
          onClick={() => setActiveTab('json')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'json'
              ? 'border-amber-400 text-amber-300 bg-amber-400/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Backup & JSON Sync</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: LANDING PAGE CUSTOMIZER
          ========================================================================= */}
      {activeTab === 'landing' && (
        <div className="p-5 sm:p-6 space-y-6">
          
          {/* Landing sub-navigation */}
          <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
            {[
              { key: 'visibility', label: 'Section Visibility' },
              { key: 'header', label: 'Header & Nav' },
              { key: 'hero', label: 'Hero & Badges' },
              { key: 'stats', label: `Impact & Stats (${customization.landingPage.stats.length})` },
              { key: 'features', label: `Features (${customization.landingPage.features.length})` },
              { key: 'about', label: 'About & Milestones' },
              { key: 'testimonials', label: `Reviews (${customization.landingPage.testimonials?.length || 0})` },
              { key: 'pricing', label: `Pricing (${customization.landingPage.pricing.length})` },
              { key: 'faqs', label: `FAQs (${customization.landingPage.faqs?.length || 0})` },
              { key: 'contact', label: 'Contact & Support' },
              { key: 'footer', label: 'Footer & Legal' }
            ].map((sub) => (
              <button
                key={sub.key}
                onClick={() => setLandingSubTab(sub.key as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  landingSubTab === sub.key
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {/* Sub-Tab 0: SECTION VISIBILITY */}
          {landingSubTab === 'visibility' && (
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Public Landing Page Section Visibility</h3>
                  <p className="text-xs text-slate-400">Toggle individual sections on or off on the live public website</p>
                </div>
                <button
                  onClick={() => {
                    const allOn = Object.keys(customization.landingPage.visibility).reduce((acc, k) => ({ ...acc, [k]: true }), {});
                    updateLandingVisibility(allOn);
                    triggerToast('All sections enabled');
                  }}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg"
                >
                  Enable All Sections
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {(Object.keys(customization.landingPage.visibility) as Array<keyof LandingSectionsVisibility>).map((key) => {
                  const isVisible = customization.landingPage.visibility[key];
                  return (
                    <div 
                      key={key}
                      onClick={() => toggleSectionVisibility(key)}
                      className={`p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        isVisible
                          ? 'bg-slate-900 border-slate-700 hover:border-amber-400/50'
                          : 'bg-slate-950/50 border-slate-800/80 opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isVisible ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-slate-500" />}
                        <span className="font-bold text-xs capitalize text-white">{key} Section</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isVisible ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {isVisible ? 'Visible' : 'Hidden'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sub-Tab 0.5: HEADER & NAVBAR */}
          {landingSubTab === 'header' && (
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-5">
              <h3 className="text-sm font-bold text-white">Header Branding & Navigation Links</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={customization.landingPage.header.brandName}
                    onChange={(e) => updateLandingHeader({ brandName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Brand Subtitle</label>
                  <input
                    type="text"
                    value={customization.landingPage.header.brandSubtitle}
                    onChange={(e) => updateLandingHeader({ brandSubtitle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Login Button Text</label>
                  <input
                    type="text"
                    value={customization.landingPage.header.loginButtonLabel}
                    onChange={(e) => updateLandingHeader({ loginButtonLabel: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Register Button Text</label>
                  <input
                    type="text"
                    value={customization.landingPage.header.registerButtonLabel}
                    onChange={(e) => updateLandingHeader({ registerButtonLabel: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Navigation Menu Items</span>
                  <button
                    onClick={() => {
                      const lbl = prompt('Enter new navigation link label (e.g. CBC Rubrics):');
                      if (lbl?.trim()) {
                        addNavLink({
                          id: `nav-${Date.now()}`,
                          label: lbl.trim(),
                          sectionId: 'features-section',
                          enabled: true
                        });
                        triggerToast('Nav link added');
                      }
                    }}
                    className="text-amber-400 font-bold hover:underline text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Nav Link</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {customization.landingPage.header.navLinks.map((link) => (
                    <div key={link.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <input
                        type="checkbox"
                        checked={link.enabled}
                        onChange={(e) => updateNavLink(link.id, { enabled: e.target.checked })}
                        className="w-4 h-4 accent-amber-400 cursor-pointer"
                        title="Toggle visibility"
                      />
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => updateNavLink(link.id, { label: e.target.value })}
                        className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white flex-1"
                      />
                      <input
                        type="text"
                        value={link.sectionId}
                        onChange={(e) => updateNavLink(link.id, { sectionId: e.target.value })}
                        className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-400 font-mono w-44"
                      />
                      <button
                        onClick={() => {
                          removeNavLink(link.id);
                          triggerToast('Nav link removed');
                        }}
                        className="p-1.5 text-red-400 hover:text-red-300"
                        title="Delete link"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sub-Tab 1: HERO SECTION */}
          {landingSubTab === 'hero' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Form Left 7 Cols */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                    <div>
                      <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Hero Section Copy & Calls To Action</span>
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Customize top banner copy, headlines, and call-to-action behaviors. All changes are saved and retained in persistent storage.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        heroSaveSuccess 
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500 animate-pulse' 
                          : 'bg-slate-900 text-slate-400 border-slate-700'
                      }`}>
                        {heroSaveSuccess ? '✓ Saved & Retained' : heroLastSavedAt}
                      </span>
                    </div>
                  </div>

                  {/* Quick Copy Presets */}
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-amber-400" />
                      <span>Curated Institutional Copy Presets:</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {HERO_COPY_PRESETS.map((preset, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => {
                            updateLandingHero({
                              pillTag: preset.pillTag,
                              headlineStart: preset.headlineStart,
                              headlineMid: preset.headlineMid,
                              headlineHighlight: preset.headlineHighlight,
                              subtitle: preset.subtitle,
                              primaryCta: preset.primaryCta,
                              primaryCtaAction: preset.primaryCtaAction,
                              secondaryCta: preset.secondaryCta,
                              secondaryCtaAction: preset.secondaryCtaAction
                            });
                            triggerToast(`Applied "${preset.name}" copy preset!`);
                          }}
                          className="text-left p-2 rounded-lg bg-slate-950 hover:bg-amber-400/10 border border-slate-800 hover:border-amber-400/40 transition-all text-slate-300 hover:text-white cursor-pointer group"
                        >
                          <div className="text-[11px] font-extrabold text-amber-400 group-hover:text-amber-300 truncate">
                            {preset.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            "{preset.primaryCta}" & "{preset.secondaryCta}"
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 1. Pill Tag */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-300">Top Pill Tag / Category Badge</label>
                      <span className="text-[10px] text-slate-500 font-mono">Upper badge text</span>
                    </div>
                    <input
                      type="text"
                      value={customization.landingPage.hero.pillTag}
                      onChange={(e) => updateLandingHero({ pillTag: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                      placeholder="e.g. ONE PLATFORM. EVERY KENYAN SCHOOL."
                    />
                  </div>

                  {/* 2. 3-Part Modular Headline */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 block">
                      3-Part Dynamic Headline (Start, Middle, and Colored Accent)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="block text-[10px] text-slate-400 mb-1">Headline Part 1</span>
                        <input
                          type="text"
                          value={customization.landingPage.hero.headlineStart}
                          onChange={(e) => updateLandingHero({ headlineStart: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                          placeholder="Smarter School"
                        />
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 mb-1">Headline Part 2</span>
                        <input
                          type="text"
                          value={customization.landingPage.hero.headlineMid}
                          onChange={(e) => updateLandingHero({ headlineMid: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                          placeholder="Management."
                        />
                      </div>
                      <div>
                        <span className="block text-[10px] text-amber-400 font-bold mb-1">Highlight Word / Accent</span>
                        <input
                          type="text"
                          value={customization.landingPage.hero.headlineHighlight}
                          onChange={(e) => updateLandingHero({ headlineHighlight: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-900 border border-amber-500/50 rounded-lg text-xs text-amber-300 font-bold"
                          placeholder="Better Learning."
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. Subtitle / Mission Statement */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Hero Subtitle & Institutional Value Proposition
                    </label>
                    <textarea
                      rows={3}
                      value={customization.landingPage.hero.subtitle}
                      onChange={(e) => updateLandingHero({ subtitle: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white resize-none"
                      placeholder="Comprehensive CBC management..."
                    />
                  </div>

                  {/* 4. Modular Calls To Action (Primary & Secondary) */}
                  <div className="pt-2 border-t border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-amber-400" />
                        <span>Calls To Action (CTA) Buttons & Actions</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">2 Configurable Buttons</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* PRIMARY CTA CONFIG */}
                      <div className="bg-slate-900/90 p-3.5 rounded-xl border border-blue-900/40 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black text-blue-400 uppercase tracking-wider">
                            Primary CTA Button
                          </span>
                          <span className="text-[9px] bg-blue-950 text-blue-300 border border-blue-800 px-1.5 py-0.5 rounded font-mono">
                            High-Priority Action
                          </span>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1">Button Label</label>
                          <input
                            type="text"
                            value={customization.landingPage.hero.primaryCta}
                            onChange={(e) => updateLandingHero({ primaryCta: e.target.value })}
                            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-bold"
                            placeholder="e.g. Login"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1">Click Behavior / Action</label>
                          <select
                            value={customization.landingPage.hero.primaryCtaAction || 'login'}
                            onChange={(e) => updateLandingHero({ primaryCtaAction: e.target.value as any })}
                            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                          >
                            <option value="login">Navigate to Login</option>
                            <option value="portals">📱 Scroll to Interactive Portals Grid</option>
                            <option value="register">🏫 Open School Registration Modal</option>
                            <option value="demo">📅 Request Platform Interactive Demo</option>
                            <option value="custom">🔗 Custom Web Link or Anchor (#)</option>
                          </select>
                        </div>

                        {(customization.landingPage.hero.primaryCtaAction === 'custom') && (
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">Target URL or Section ID</label>
                            <input
                              type="text"
                              value={customization.landingPage.hero.primaryCtaUrl || ''}
                              onChange={(e) => updateLandingHero({ primaryCtaUrl: e.target.value })}
                              placeholder="https://... or #features"
                              className="w-full px-3 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono"
                            />
                          </div>
                        )}
                      </div>

                      {/* SECONDARY CTA CONFIG */}
                      <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black text-slate-300 uppercase tracking-wider">
                            Secondary CTA Button
                          </span>
                          <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                            Secondary Action
                          </span>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1">Button Label</label>
                          <input
                            type="text"
                            value={customization.landingPage.hero.secondaryCta}
                            onChange={(e) => updateLandingHero({ secondaryCta: e.target.value })}
                            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-bold"
                            placeholder="e.g. Register a School"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1">Click Behavior / Action</label>
                          <select
                            value={customization.landingPage.hero.secondaryCtaAction || 'register'}
                            onChange={(e) => updateLandingHero({ secondaryCtaAction: e.target.value as any })}
                            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                          >
                            <option value="register">🏫 Open School Registration Modal</option>
                            <option value="login">Navigate to Login</option>
                            <option value="portals">📱 Scroll to Interactive Portals Grid</option>
                            <option value="contact">📞 Scroll to Contact & Inquiries</option>
                            <option value="demo">📅 Request Platform Interactive Demo</option>
                            <option value="custom">🔗 Custom Web Link or Anchor (#)</option>
                          </select>
                        </div>

                        {(customization.landingPage.hero.secondaryCtaAction === 'custom') && (
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">Target URL or Section ID</label>
                            <input
                              type="text"
                              value={customization.landingPage.hero.secondaryCtaUrl || ''}
                              onChange={(e) => updateLandingHero({ secondaryCtaUrl: e.target.value })}
                              placeholder="https://... or #pricing"
                              className="w-full px-3 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono"
                            />
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* 5. DEDICATED PERSISTENT RETENTION & SAVE ACTION BAR */}
                  <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <div className="text-left">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Settings Retention Engine</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Changes are saved into persistent browser storage and retained across reloads & sessions.
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveHeroSettings}
                      className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105 active:scale-95 shrink-0"
                    >
                      <Save className="w-4 h-4 text-slate-950" />
                      <span>Save & Retain Hero Settings</span>
                    </button>
                  </div>

                  {/* HERO BANNER MEDIA CUSTOMIZATION: IMAGE OR SHORT VIDEO (30s) */}
                  <div className="pt-3 border-t border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Film className="w-4 h-4 text-amber-400" />
                        <span>Hero Banner Media Type</span>
                      </label>
                      <span className="text-[10px] text-cyan-400 font-mono font-bold bg-cyan-950/60 border border-cyan-800/80 px-2 py-0.5 rounded-full">
                        Image or Short Video (30s)
                      </span>
                    </div>

                    {/* Segmented Media Type Toggle */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl">
                      <button
                        type="button"
                        onClick={() => updateLandingHero({ mediaType: 'image' })}
                        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          (customization.landingPage.hero.mediaType || 'image') === 'image'
                            ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <ImageIcon className="w-4 h-4" />
                        <span>High-Res Photo / Image</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateLandingHero({ mediaType: 'video' })}
                        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          customization.landingPage.hero.mediaType === 'video'
                            ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Video className="w-4 h-4" />
                        <span>Short Video Showcase (30s)</span>
                      </button>
                    </div>

                    {/* 1. SHORT VIDEO (30s) CONFIGURATION */}
                    {customization.landingPage.hero.mediaType === 'video' && (
                      <div className="p-3.5 bg-slate-900/90 border border-cyan-900/60 rounded-xl space-y-3.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Short Video Source (Max 30 Seconds)</span>
                          </span>
                          <span className="text-[10px] text-slate-400">MP4 or WebM</span>
                        </div>

                        {/* Direct Video URL Input */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">Direct Video URL</label>
                          <input
                            type="text"
                            value={customization.landingPage.hero.heroVideoUrl || ''}
                            onChange={(e) => updateLandingHero({ heroVideoUrl: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-cyan-200 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400"
                            placeholder="https://.../video.mp4"
                          />
                        </div>

                        {/* Upload Local Short Video File (30s max check) */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            Upload Video File (Max 30s)
                          </label>
                          <div className="flex items-center gap-2">
                            <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold border border-slate-600 flex items-center gap-1.5 cursor-pointer">
                              <Upload className="w-3.5 h-3.5 text-cyan-400" />
                              <span>{isVideoUploading ? 'Validating (30s max)...' : 'Choose Video File'}</span>
                              <input
                                type="file"
                                accept="video/mp4,video/webm"
                                onChange={handleHeroVideoUpload}
                                className="hidden"
                                disabled={isVideoUploading}
                              />
                            </label>
                            <span className="text-[11px] text-slate-400">Validated with client-side 30s limit</span>
                          </div>
                          {videoUploadError && (
                            <div className="mt-1.5 p-2 bg-red-950/80 border border-red-700 rounded-lg text-red-300 text-xs flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                              <span>{videoUploadError}</span>
                            </div>
                          )}
                        </div>

                        {/* Presets for 30s Educational Videos */}
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>Or Choose Curated 30-Second Showcase Video:</span>
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {listHeroVideoPresets().map((preset) => {
                              const isSelected = customization.landingPage.hero.heroVideoUrl === preset.url;
                              return (
                                <button
                                  key={preset.id}
                                  type="button"
                                  onClick={() => updateLandingHero({
                                    mediaType: 'video',
                                    heroVideoUrl: preset.url,
                                    heroVideoPoster: preset.poster,
                                    videoBadgeLabel: `${preset.durationLabel} Campus Tour`,
                                    videoMaxDuration: preset.durationSeconds
                                  })}
                                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-cyan-950 border-cyan-400 text-white ring-1 ring-cyan-400'
                                      : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-600'
                                  }`}
                                >
                                  <div className="flex items-center justify-between text-xs font-bold">
                                    <span className="truncate">{preset.label}</span>
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-900/60 text-cyan-300 shrink-0 ml-1">
                                      {preset.durationLabel}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{preset.description}</p>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Video Controls & Playback Preferences */}
                        <div className="pt-2 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={customization.landingPage.hero.videoAutoplay !== false}
                              onChange={(e) => updateLandingHero({ videoAutoplay: e.target.checked })}
                              className="accent-amber-400 rounded"
                            />
                            <span>Autoplay</span>
                          </label>

                          <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer" title="Browsers require muted for autoplay">
                            <input
                              type="checkbox"
                              checked={customization.landingPage.hero.videoMuted !== false}
                              onChange={(e) => updateLandingHero({ videoMuted: e.target.checked })}
                              className="accent-amber-400 rounded"
                            />
                            <span>Muted (Mute/Unmute btn)</span>
                          </label>

                          <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={customization.landingPage.hero.videoLoop !== false}
                              onChange={(e) => updateLandingHero({ videoLoop: e.target.checked })}
                              className="accent-amber-400 rounded"
                            />
                            <span>30s Loop</span>
                          </label>

                          <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={customization.landingPage.hero.videoShowControls !== false}
                              onChange={(e) => updateLandingHero({ videoShowControls: e.target.checked })}
                              className="accent-amber-400 rounded"
                            />
                            <span>Show Controls</span>
                          </label>
                        </div>

                        {/* Video Badge Label & Poster Fallback */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                              Video Badge Label
                            </label>
                            <input
                              type="text"
                              value={customization.landingPage.hero.videoBadgeLabel || '30s Campus Spotlight'}
                              onChange={(e) => updateLandingHero({ videoBadgeLabel: e.target.value })}
                              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                              placeholder="e.g. 30s Campus Spotlight"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                              Poster Fallback Image URL
                            </label>
                            <input
                              type="text"
                              value={customization.landingPage.hero.heroVideoPoster || ''}
                              onChange={(e) => updateLandingHero({ heroVideoPoster: e.target.value })}
                              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-300 font-mono"
                              placeholder="Fallback / preview photo"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2. IMAGE CONFIGURATION */}
                    {customization.landingPage.hero.mediaType !== 'video' && (
                      <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-slate-300">Hero Banner Image Source</label>
                          <label className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-bold border border-slate-600 flex items-center gap-1 cursor-pointer">
                            <Upload className="w-3 h-3 text-amber-400" />
                            <span>Upload Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleHeroImageUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <input
                          type="text"
                          value={customization.landingPage.hero.heroImageUrl}
                          onChange={(e) => updateLandingHero({ heroImageUrl: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 font-mono"
                          placeholder="Paste image URL or choose preset below"
                        />

                        {/* Presets */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className="text-[10px] text-slate-500 self-center mr-1">Presets:</span>
                          {listHeroImagePresets().map((preset) => (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => updateLandingHero({ heroImageUrl: preset.url, mediaType: 'image' })}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                                customization.landingPage.hero.heroImageUrl === preset.url && customization.landingPage.hero.mediaType !== 'video'
                                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                                  : 'bg-slate-950 text-slate-300 border-slate-700 hover:border-slate-500'
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Floating Highlight Overlay Card (Banner KPI Card - Matching User Request) */}
                  <div className="pt-3 border-t border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span>Floating Highlight Card Overlay (Banner KPI Card)</span>
                        </label>
                        <p className="text-[10px] text-slate-400">
                          Configure the bottom highlight card (KPI title, subtext & status pill badge) displayed over the hero banner.
                        </p>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700">
                        <span className="text-[11px] font-bold text-slate-300">Show Card</span>
                        <input
                          type="checkbox"
                          checked={customization.landingPage.hero.showFloatingCard}
                          onChange={(e) => updateLandingHero({ showFloatingCard: e.target.checked })}
                          className="w-4 h-4 accent-amber-400"
                        />
                      </label>
                    </div>

                    {customization.landingPage.hero.showFloatingCard && (
                      <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-3">
                        
                        {/* Quick Presets for Floating Card */}
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span>Quick Metric Presets:</span>
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {[
                              {
                                title: '99.4% Term Attendance',
                                subtitle: 'Real-time biometrics & roll call monitoring',
                                badge: 'ACTIVE',
                                color: 'emerald' as const
                              },
                              {
                                title: '100% MoE CBC Compliance',
                                subtitle: 'Automated continuous assessment rubrics',
                                badge: 'VERIFIED',
                                color: 'blue' as const
                              },
                              {
                                title: 'Top Academic Transition',
                                subtitle: '98.7% transition to national universities',
                                badge: 'EXCELLENCE',
                                color: 'amber' as const
                              },
                              {
                                title: '24/7 Gate Surveillance',
                                subtitle: 'Biometric gate passes & parent alerts',
                                badge: 'SECURE',
                                color: 'purple' as const
                              }
                            ].map((preset, prIdx) => (
                              <button
                                key={prIdx}
                                type="button"
                                onClick={() => {
                                  updateLandingHero({
                                    floatingCardTitle: preset.title,
                                    floatingCardSubtitle: preset.subtitle,
                                    floatingCardBadgeText: preset.badge,
                                    floatingCardBadgeColor: preset.color
                                  });
                                  triggerToast(`Applied "${preset.title}" floating card preset!`);
                                }}
                                className="text-left p-2 rounded-lg bg-slate-950 hover:bg-amber-400/10 border border-slate-800 hover:border-amber-400/40 transition-all text-xs cursor-pointer group"
                              >
                                <div className="font-extrabold text-amber-300 group-hover:text-amber-200 truncate flex items-center justify-between">
                                  <span>{preset.title}</span>
                                  <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded font-mono text-slate-300">
                                    {preset.badge}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                  {preset.subtitle}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Title and Subtitle inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-300 mb-1">
                              Card Headline / KPI Title
                            </label>
                            <input
                              type="text"
                              value={customization.landingPage.hero.floatingCardTitle}
                              onChange={(e) => updateLandingHero({ floatingCardTitle: e.target.value })}
                              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-black"
                              placeholder="e.g. 99.4% Term Attendance"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-300 mb-1">
                              Card Subtitle / Description
                            </label>
                            <input
                              type="text"
                              value={customization.landingPage.hero.floatingCardSubtitle}
                              onChange={(e) => updateLandingHero({ floatingCardSubtitle: e.target.value })}
                              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                              placeholder="e.g. Real-time biometrics & roll call monitoring"
                            />
                          </div>
                        </div>

                        {/* Badge Text and Badge Color */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-300 mb-1">
                              Status Pill Badge Label
                            </label>
                            <input
                              type="text"
                              value={customization.landingPage.hero.floatingCardBadgeText || 'ACTIVE'}
                              onChange={(e) => updateLandingHero({ floatingCardBadgeText: e.target.value.toUpperCase() })}
                              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono font-bold uppercase tracking-wider"
                              placeholder="e.g. ACTIVE"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-300 mb-1">
                              Badge Pill Color Theme
                            </label>
                            <select
                              value={customization.landingPage.hero.floatingCardBadgeColor || 'emerald'}
                              onChange={(e) => updateLandingHero({ floatingCardBadgeColor: e.target.value as any })}
                              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-semibold"
                            >
                              <option value="emerald">🟢 Emerald Green (e.g. ACTIVE / ONLINE)</option>
                              <option value="blue">🔵 Royal Blue (e.g. VERIFIED / CERTIFIED)</option>
                              <option value="amber">🟡 Amber Gold (e.g. SPOTLIGHT / PENDING)</option>
                              <option value="purple">🟣 Indigo Purple (e.g. AI-POWERED)</option>
                              <option value="slate">⚪ Classic Slate (e.g. OFFICIAL)</option>
                            </select>
                          </div>
                        </div>

                        {/* Save & Retain Floating Card button */}
                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                          <div className="text-[10px] text-slate-400">
                            Saved values update the live banner overlay and are retained across sessions.
                          </div>

                          <button
                            type="button"
                            onClick={handleSaveHeroSettings}
                            className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
                          >
                            <Save className="w-3.5 h-3.5 text-slate-950" />
                            <span>Save Floating Card</span>
                          </button>
                        </div>

                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Live Preview Right 5 Cols */}
              <div className="lg:col-span-5 space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    {customization.landingPage.hero.mediaType === 'video' ? (
                      <Video className="w-3.5 h-3.5 text-cyan-400" />
                    ) : (
                      <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>Live Hero {customization.landingPage.hero.mediaType === 'video' ? 'Video (30s)' : 'Image'} Preview</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">● Real-Time Synced</span>
                </div>

                <div className="bg-white rounded-2xl p-5 text-slate-900 shadow-xl border border-slate-200 space-y-3">
                  <div className="inline-block px-3 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black tracking-widest uppercase">
                    {customization.landingPage.hero.pillTag}
                  </div>

                  <h3 className="text-xl font-black font-serif leading-tight text-slate-950">
                    {customization.landingPage.hero.headlineStart}<br />
                    {customization.landingPage.hero.headlineMid}<br />
                    <span className="text-blue-700">{customization.landingPage.hero.headlineHighlight}</span>
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2">
                    {customization.landingPage.hero.subtitle}
                  </p>

                  <div className="flex gap-2 pt-1">
                    <span className="px-3 py-1 bg-blue-600 text-white font-bold text-xs rounded-lg shadow-sm">
                      {customization.landingPage.hero.primaryCta}
                    </span>
                    <span className="px-3 py-1 bg-slate-100 text-slate-800 font-bold text-xs rounded-lg border border-slate-200">
                      {customization.landingPage.hero.secondaryCta}
                    </span>
                  </div>

                  {/* Interactive Live HeroBannerMedia inside preview! */}
                  <div className="pt-2">
                    <HeroBannerMedia
                      mediaType={customization.landingPage.hero.mediaType || 'image'}
                      imageUrl={customization.landingPage.hero.heroImageUrl}
                      videoUrl={customization.landingPage.hero.heroVideoUrl}
                      posterUrl={customization.landingPage.hero.heroVideoPoster || customization.landingPage.hero.heroImageUrl}
                      videoBadgeLabel={customization.landingPage.hero.videoBadgeLabel}
                      videoAutoplay={customization.landingPage.hero.videoAutoplay}
                      videoMuted={customization.landingPage.hero.videoMuted}
                      videoLoop={customization.landingPage.hero.videoLoop}
                      videoShowControls={customization.landingPage.hero.videoShowControls}
                      floatingCardTitle={customization.landingPage.hero.floatingCardTitle}
                      floatingCardSubtitle={customization.landingPage.hero.floatingCardSubtitle}
                      floatingCardBadgeText={customization.landingPage.hero.floatingCardBadgeText || 'ACTIVE'}
                      floatingCardBadgeColor={customization.landingPage.hero.floatingCardBadgeColor || 'emerald'}
                      showFloatingCard={customization.landingPage.hero.showFloatingCard}
                      className="!h-64 !border-2 !border-slate-200"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Sub-Tab 2: METRICS & STATS */}
          {landingSubTab === 'stats' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Platform Social Proof & Metric Cards</h3>
                  <p className="text-xs text-slate-400">Add, edit, or remove statistical numbers displayed on the landing page</p>
                </div>
                <button
                  onClick={() => setIsNewStatModalOpen(true)}
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Metric</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {customization.landingPage.stats.map((stat) => (
                  <div key={stat.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 relative group">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">{stat.icon}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingStat(stat)}
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete stat "${stat.label}"?`)) {
                              removeStat(stat.id);
                              triggerToast('Metric deleted');
                            }
                          }}
                          className="p-1 text-red-400 hover:text-red-300 rounded hover:bg-slate-800"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-2xl font-black text-white font-mono">{stat.value}</div>
                    <div className="text-xs font-bold text-slate-200">{stat.label}</div>
                    <div className="text-[10px] text-slate-400">{stat.subtext}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-Tab 3: FEATURES MANAGEMENT */}
          {landingSubTab === 'features' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Feature & Value Proposition Cards</h3>
                  <p className="text-xs text-slate-400">Control the capabilities and module highlights shown on the landing page</p>
                </div>
                <button
                  onClick={() => setIsNewFeatureModalOpen(true)}
                  className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Feature Card</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customization.landingPage.features.map((feat) => (
                  <div 
                    key={feat.id} 
                    className={`bg-slate-950 p-5 rounded-2xl border transition-all space-y-3 ${
                      feat.enabled ? 'border-slate-800' : 'border-red-900/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {feat.tag}
                      </span>
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] text-slate-400 flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={feat.enabled}
                            onChange={(e) => updateFeature(feat.id, { enabled: e.target.checked })}
                            className="w-3.5 h-3.5 accent-amber-400"
                          />
                          <span>{feat.enabled ? 'Active' : 'Hidden'}</span>
                        </label>
                        <button
                          onClick={() => setEditingFeature(feat)}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                          title="Edit Card"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete feature "${feat.title}"?`)) {
                              removeFeature(feat.id);
                              triggerToast('Feature card deleted');
                            }
                          }}
                          className="p-1.5 text-red-400 hover:text-red-300 rounded-lg hover:bg-slate-800"
                          title="Delete Card"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="text-base font-bold text-white font-serif">{feat.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-3">{feat.description}</p>
                    
                    <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-900">
                      <span>Category: {feat.category}</span>
                      <span>Icon: {feat.icon}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-Tab 4: ABOUT & MISSION */}
          {landingSubTab === 'about' && (
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white">About EduSmart & Mission Section</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={customization.landingPage.about.badge}
                    onChange={(e) => updateAbout({ badge: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Section Title</label>
                  <input
                    type="text"
                    value={customization.landingPage.about.title}
                    onChange={(e) => updateAbout({ title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Subtitle / Leading Paragraph</label>
                <textarea
                  rows={2}
                  value={customization.landingPage.about.subtitle}
                  onChange={(e) => updateAbout({ subtitle: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">Key Pillars / Bullet Points</label>
                {customization.landingPage.about.points.map((pt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={pt}
                      onChange={(e) => {
                        const newPts = [...customization.landingPage.about.points];
                        newPts[idx] = e.target.value;
                        updateAbout({ points: newPts });
                      }}
                      className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    />
                    <button
                      onClick={() => {
                        const newPts = customization.landingPage.about.points.filter((_, i) => i !== idx);
                        updateAbout({ points: newPts });
                      }}
                      className="p-1.5 text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    updateAbout({ points: [...customization.landingPage.about.points, 'New key institutional milestone'] });
                  }}
                  className="text-xs text-amber-400 font-bold hover:underline flex items-center gap-1 pt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add another bullet point</span>
                </button>
              </div>
            </div>
          )}

          {/* Sub-Tab 5: PRICING PLANS */}
          {landingSubTab === 'pricing' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Our Packages (Synced with Marketing Brochure)</h3>
                  <p className="text-xs text-slate-400">Edit package pricing, student capacities, per-student costs and target descriptions</p>
                </div>
                <button
                  onClick={() => {
                    const newTier: LandingPricingTier = {
                      id: `plan-${Date.now()}`,
                      name: 'CUSTOM TIER',
                      capacity: 'Up to 1,000 Students',
                      price: 'KSh 150,000',
                      period: 'per year',
                      perStudent: '≈ KSh 150 per student',
                      description: 'Custom tailored plan for specialized institutions.',
                      color: '#2563eb',
                      features: ['All Powerful Portals', 'CBC Continuous Assessment', 'Parent Portal & SMS'],
                      popular: false,
                      buttonLabel: 'Select Plan'
                    };
                    addPricingTier(newTier);
                    triggerToast('New package tier added!');
                  }}
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Package</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                {customization.landingPage.pricing.map((tier) => (
                  <div key={tier.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5 relative flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-1">
                      <input
                        type="text"
                        value={tier.name}
                        onChange={(e) => updatePricingTier(tier.id, { name: e.target.value })}
                        className="bg-transparent font-black text-white text-xs border-b border-slate-700 pb-0.5 focus:outline-none uppercase w-full"
                      />
                      <button
                        onClick={() => {
                          removePricingTier(tier.id);
                          triggerToast(`Deleted ${tier.name} tier`);
                        }}
                        className="text-slate-500 hover:text-red-400 p-0.5"
                        title="Delete Package"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Color & Badge */}
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={tier.color || '#2563eb'}
                        onChange={(e) => updatePricingTier(tier.id, { color: e.target.value })}
                        className="w-6 h-6 rounded cursor-pointer border border-slate-700 bg-transparent"
                        title="Package Theme Color"
                      />
                      <input
                        type="text"
                        placeholder="Badge (optional)"
                        value={tier.badge || ''}
                        onChange={(e) => updatePricingTier(tier.id, { badge: e.target.value })}
                        className="bg-slate-900 px-2 py-0.5 rounded text-[10px] text-amber-300 font-mono w-full border border-slate-800"
                      />
                    </div>

                    {/* Capacity */}
                    <div>
                      <label className="text-[9px] text-slate-400 uppercase font-mono block">Student Capacity</label>
                      <input
                        type="text"
                        value={tier.capacity || ''}
                        placeholder="e.g. Up to 300 Students"
                        onChange={(e) => updatePricingTier(tier.id, { capacity: e.target.value })}
                        className="w-full bg-slate-900 px-2 py-1 rounded text-xs text-slate-200 border border-slate-800 font-bold"
                      />
                    </div>

                    {/* Price & Period */}
                    <div>
                      <label className="text-[9px] text-slate-400 uppercase font-mono block">Price & Period</label>
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={tier.price}
                          onChange={(e) => updatePricingTier(tier.id, { price: e.target.value })}
                          className="bg-slate-900 px-2 py-1 rounded text-xs font-black text-white font-mono w-full border border-slate-800"
                        />
                        <input
                          type="text"
                          value={tier.period}
                          onChange={(e) => updatePricingTier(tier.id, { period: e.target.value })}
                          className="bg-slate-900 px-2 py-0.5 rounded text-[10px] text-slate-400 w-full border border-slate-800"
                        />
                      </div>
                    </div>

                    {/* Per Student */}
                    <div>
                      <label className="text-[9px] text-slate-400 uppercase font-mono block">Per Student Cost</label>
                      <input
                        type="text"
                        value={tier.perStudent || ''}
                        placeholder="e.g. ≈ KSh 250 per student"
                        onChange={(e) => updatePricingTier(tier.id, { perStudent: e.target.value })}
                        className="w-full bg-slate-900 px-2 py-1 rounded text-[10px] text-slate-300 border border-slate-800 font-medium"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="text-[9px] text-slate-400 uppercase font-mono block">Target Audience</label>
                      <textarea
                        rows={2}
                        value={tier.description}
                        onChange={(e) => updatePricingTier(tier.id, { description: e.target.value })}
                        className="w-full bg-slate-900 p-1.5 rounded text-[10px] text-slate-300 border border-slate-800 leading-tight"
                      />
                    </div>

                    {/* Popular toggle */}
                    <label className="flex items-center gap-1.5 text-[10px] text-slate-300 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={tier.popular || false}
                        onChange={(e) => updatePricingTier(tier.id, { popular: e.target.checked })}
                        className="rounded accent-amber-400"
                      />
                      <span>Featured Popular</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-Tab 5.5: TESTIMONIALS & REVIEWS */}
          {landingSubTab === 'testimonials' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">School Leadership Reviews & Testimonials</h3>
                  <p className="text-xs text-slate-400">Add, edit, or remove client quotes displayed on the public landing page</p>
                </div>
                <button
                  onClick={() => {
                    const author = prompt('Reviewer Name (e.g. Mr. Patrick Kamau):');
                    if (author?.trim()) {
                      const quote = prompt('Review Quote:') || 'EduSmart has transformed our school management.';
                      const school = prompt('School Campus:') || 'Riara School Nairobi';
                      const role = prompt('Role / Title:') || 'School Administrator';
                      addTestimonial({
                        id: `test-${Date.now()}`,
                        author: author.trim(),
                        quote,
                        school,
                        role,
                        rating: 5
                      });
                      triggerToast('New review added to landing page!');
                    }
                  }}
                  className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Review</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(customization.landingPage.testimonials || []).map((t) => (
                  <div key={t.id} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 relative group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-amber-400">
                        {Array.from({ length: t.rating || 5 }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          removeTestimonial(t.id);
                          triggerToast('Review deleted');
                        }}
                        className="p-1 text-red-400 hover:text-red-300"
                        title="Delete review"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      value={t.quote}
                      onChange={(e) => updateTestimonial(t.id, { quote: e.target.value })}
                      className="w-full bg-slate-900 p-2 rounded-lg text-xs text-slate-200 border border-slate-700"
                    />

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-900">
                      <div>
                        <label className="text-[10px] text-slate-400 block">Author</label>
                        <input
                          type="text"
                          value={t.author}
                          onChange={(e) => updateTestimonial(t.id, { author: e.target.value })}
                          className="w-full bg-slate-900 px-2 py-1 rounded text-xs text-white border border-slate-700 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block">Role</label>
                        <input
                          type="text"
                          value={t.role}
                          onChange={(e) => updateTestimonial(t.id, { role: e.target.value })}
                          className="w-full bg-slate-900 px-2 py-1 rounded text-xs text-white border border-slate-700"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block">School Campus</label>
                      <input
                        type="text"
                        value={t.school}
                        onChange={(e) => updateTestimonial(t.id, { school: e.target.value })}
                        className="w-full bg-slate-900 px-2 py-1 rounded text-xs text-slate-300 border border-slate-700"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-Tab 5.6: FAQS */}
          {landingSubTab === 'faqs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Frequently Asked Questions (FAQ)</h3>
                  <p className="text-xs text-slate-400">Add, edit, or remove questions and answers displayed in the FAQ accordion</p>
                </div>
                <button
                  onClick={() => {
                    const q = prompt('New Question:');
                    if (q?.trim()) {
                      const a = prompt('Answer:') || 'Answer details...';
                      addFaq({
                        id: `faq-${Date.now()}`,
                        question: q.trim(),
                        answer: a,
                        category: 'General'
                      });
                      triggerToast('New FAQ added to landing page!');
                    }
                  }}
                  className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add FAQ Item</span>
                </button>
              </div>

              <div className="space-y-3">
                {(customization.landingPage.faqs || []).map((faq) => (
                  <div key={faq.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 relative group">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-amber-400 uppercase">Category: {faq.category}</span>
                      <button
                        onClick={() => {
                          removeFaq(faq.id);
                          triggerToast('FAQ deleted');
                        }}
                        className="p-1 text-red-400 hover:text-red-300"
                        title="Delete FAQ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Question</label>
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => updateFaq(faq.id, { question: e.target.value })}
                        className="w-full bg-slate-900 px-3 py-2 rounded-xl text-xs text-white font-bold border border-slate-700"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Answer</label>
                      <textarea
                        rows={2}
                        value={faq.answer}
                        onChange={(e) => updateFaq(faq.id, { answer: e.target.value })}
                        className="w-full bg-slate-900 px-3 py-2 rounded-xl text-xs text-slate-200 border border-slate-700 leading-relaxed"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-Tab 6: CONTACT & SUPPORT */}
          {landingSubTab === 'contact' && (
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 max-w-2xl">
              <h3 className="text-sm font-bold text-white">Contact & Support Details</h3>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Phone / Support Hotlines</label>
                <input
                  type="text"
                  value={customization.landingPage.contact.phone}
                  onChange={(e) => updateContact({ phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Support Email Address</label>
                <input
                  type="text"
                  value={customization.landingPage.contact.email}
                  onChange={(e) => updateContact({ email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Headquarters Physical Address</label>
                <input
                  type="text"
                  value={customization.landingPage.contact.address}
                  onChange={(e) => updateContact({ address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Support Operating Hours</label>
                <input
                  type="text"
                  value={customization.landingPage.contact.supportHours}
                  onChange={(e) => updateContact({ supportHours: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
            </div>
          )}

          {/* Sub-Tab 7: FOOTER & COPYRIGHT */}
          {landingSubTab === 'footer' && (
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 max-w-2xl">
              <h3 className="text-sm font-bold text-white">Footer Branding & Copyright</h3>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Brand Name</label>
                <input
                  type="text"
                  value={customization.landingPage.footer.brandName}
                  onChange={(e) => updateFooter({ brandName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Tagline</label>
                <input
                  type="text"
                  value={customization.landingPage.footer.tagline}
                  onChange={(e) => updateFooter({ tagline: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Copyright Line</label>
                <input
                  type="text"
                  value={customization.landingPage.footer.copyrightText}
                  onChange={(e) => updateFooter({ copyrightText: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Developer / Engineering Credit</label>
                <input
                  type="text"
                  value={customization.landingPage.footer.developerCredit}
                  onChange={(e) => updateFooter({ developerCredit: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
            </div>
          )}

        </div>
      )}

      {/* =========================================================================
          TAB 2: ALL PORTALS & WORKSPACES CONTROL (FULL CONTROL)
          ========================================================================= */}
      {activeTab === 'workspaces' && (
        <div className="p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-white font-serif">Platform Portals & Workspaces Control</h3>
              <p className="text-xs text-slate-400">
                Enable or disable portals, customize titles, change accent colors, edit role permissions, and create brand-new custom modules.
              </p>
            </div>

            <button
              onClick={() => setIsNewWorkspaceModalOpen(true)}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-sm flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Custom Portal Module</span>
            </button>
          </div>

          {/* Grid of Workspaces */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customization.workspaces.map((ws) => (
              <div
                key={ws.id}
                className={`bg-slate-950 rounded-2xl p-5 border transition-all space-y-3 ${
                  ws.enabled ? 'border-slate-800 shadow-md' : 'border-red-950/60 bg-slate-950/40 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs"
                      style={{ backgroundColor: `${ws.accentColor}25`, color: ws.accentColor }}
                    >
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">{ws.category}</span>
                      <span className="text-xs font-black text-white block">{ws.shortName}</span>
                    </div>
                  </div>

                  {/* Enable / Disable Toggle */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleWorkspace(ws.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                        ws.enabled 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}
                    >
                      {ws.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                    <button
                      onClick={() => setEditingWorkspace(ws)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                      title="Customize portal properties"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {ws.isCustomModule && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete custom module "${ws.name}"?`)) {
                            removeCustomWorkspace(ws.id);
                            triggerToast('Custom module removed');
                          }
                        }}
                        className="p-1.5 text-red-400 hover:text-red-300 rounded-lg hover:bg-slate-800"
                        title="Delete custom module"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-xs font-bold text-slate-200">{ws.name}</div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{ws.description}</p>

                {/* Custom Notice Banner */}
                {ws.customNotice && (
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-amber-300 flex items-center gap-1.5">
                    <Megaphone className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="truncate">{ws.customNotice}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="truncate">Roles: {ws.allowedRoles.join(', ')}</span>
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: ws.accentColor }}
                    title={`Theme: ${ws.accentColor}`}
                  />
                </div>
              </div>
            ))}
          </div>
          {/* =========================================================================
              CLASS TEACHER MODULE GOVERNANCE & INSTITUTIONAL POLICY (SUPER ADMIN CONTROL)
              ========================================================================= */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-emerald-950/40 rounded-2xl p-5 sm:p-6 border border-emerald-500/30 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white font-serif flex items-center gap-2">
                    <span>Class Teacher Module Global Policies</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-mono px-1.5 py-0.5 rounded border border-emerald-400/30 uppercase">
                      Super Admin Managed
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Define institutional governance rules, roll-call deadlines, and permissions for all class teachers.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Status:</span>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                  customization.workspaces.find(w => w.id === 'class_teacher')?.enabled !== false
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-red-500/10 text-red-400 border-red-500/30'
                }`}>
                  {customization.workspaces.find(w => w.id === 'class_teacher')?.enabled !== false ? 'Module Active' : 'Module Inactive'}
                </span>
              </div>
            </div>

            {/* Policy Toggles Grid */}
            {(() => {
              const policy = customization.classTeacherPolicy || {
                allowRemarksEditing: true,
                allowGatePassAuth: true,
                allowLunchRegister: true,
                allowParentBroadcast: true,
                morningRollCallDeadline: '08:30 AM',
                isRegisterLocked: false
              };

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  
                  {/* Policy 1: Report Card Remarks */}
                  <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-white">CBC Report Remarks</div>
                      <div className="text-[11px] text-slate-400">Allow Class Teachers to write & edit termly remarks</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        updateClassTeacherPolicy({ allowRemarksEditing: !policy.allowRemarksEditing });
                        triggerToast(`Report card remarks editing ${!policy.allowRemarksEditing ? 'enabled' : 'disabled'}`);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer shrink-0 ${
                        policy.allowRemarksEditing
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {policy.allowRemarksEditing ? 'Allowed' : 'Locked'}
                    </button>
                  </div>

                  {/* Policy 2: Gate Passes */}
                  <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-white">Gate Pass Authorization</div>
                      <div className="text-[11px] text-slate-400">Class Teachers can sign student exit slips</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        updateClassTeacherPolicy({ allowGatePassAuth: !policy.allowGatePassAuth });
                        triggerToast(`Gate pass authorization ${!policy.allowGatePassAuth ? 'enabled' : 'disabled'}`);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer shrink-0 ${
                        policy.allowGatePassAuth
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {policy.allowGatePassAuth ? 'Allowed' : 'Disabled'}
                    </button>
                  </div>

                  {/* Policy 3: Lunch Dining Register */}
                  <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-white">Learner Lunch Register</div>
                      <div className="text-[11px] text-slate-400">Midday dining attendance marked by form lead</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        updateClassTeacherPolicy({ allowLunchRegister: !policy.allowLunchRegister });
                        triggerToast(`Lunch register marking ${!policy.allowLunchRegister ? 'enabled' : 'disabled'}`);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer shrink-0 ${
                        policy.allowLunchRegister
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {policy.allowLunchRegister ? 'Allowed' : 'Disabled'}
                    </button>
                  </div>

                  {/* Policy 4: Parent Broadcasts */}
                  <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-white">Direct Parent SMS Notices</div>
                      <div className="text-[11px] text-slate-400">Send class-level announcements to parents</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        updateClassTeacherPolicy({ allowParentBroadcast: !policy.allowParentBroadcast });
                        triggerToast(`Parent broadcasts ${!policy.allowParentBroadcast ? 'enabled' : 'disabled'}`);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer shrink-0 ${
                        policy.allowParentBroadcast
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {policy.allowParentBroadcast ? 'Allowed' : 'Disabled'}
                    </button>
                  </div>

                  {/* Policy 5: Roll-Call Submission Deadline */}
                  <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="font-bold text-white">Morning Roll-Call Deadline</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={policy.morningRollCallDeadline}
                        onChange={(e) => updateClassTeacherPolicy({ morningRollCallDeadline: e.target.value })}
                        className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs w-28 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                        placeholder="08:30 AM"
                      />
                      <span className="text-[10px] text-slate-400">Daily cutoff</span>
                    </div>
                  </div>

                  {/* Policy 6: Lock Class Registers */}
                  <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-white">Term Register Lock</div>
                      <div className="text-[11px] text-slate-400">Prevent historical modifications for audit</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        updateClassTeacherPolicy({ isRegisterLocked: !policy.isRegisterLocked });
                        triggerToast(`Registers ${!policy.isRegisterLocked ? 'locked' : 'unlocked'}`);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer shrink-0 ${
                        policy.isRegisterLocked
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {policy.isRegisterLocked ? 'Locked' : 'Open'}
                    </button>
                  </div>

                </div>
              );
            })()}
          </div>

          {/* =========================================================================
              OPERATIONS & FINANCIAL GOVERNANCE POLICY (SUPER ADMIN FULL CONTROL)
              ========================================================================= */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-teal-950/40 rounded-2xl p-5 sm:p-6 border border-teal-500/30 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white font-serif flex items-center gap-2">
                    <span>Integrated Operations & Financial Governance Directives</span>
                    <span className="text-[9px] bg-teal-500/20 text-teal-300 font-mono px-1.5 py-0.5 rounded border border-teal-400/30 uppercase">
                      Super Admin Managed
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Define platform-level statutory compliance, M-Pesa automatic reconciliation, and 3-way matching rules for all schools.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Operations Suite:</span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold border bg-teal-500/10 text-teal-400 border-teal-500/30">
                  4 Modules Active
                </span>
              </div>
            </div>

            {/* Operations Policy Toggles Grid */}
            {(() => {
              const opsPolicy = customization.operationsPolicy || {
                enableMpesaAutoReconciliation: true,
                procurementApprovalThreshold: 50000,
                strictBudgetEnforcement: true,
                requireThreeWayMatchingForPayment: true,
                lockDisbursedPayrollRuns: true,
                autoReorderAlertsEnabled: true,
                allowDepartmentalRequisitions: true
              };

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  
                  {/* Directive 1: Automated M-Pesa Reconciliation */}
                  <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-white">M-Pesa Auto-Reconciliation</div>
                      <div className="text-[11px] text-slate-400">Match Paybill IPN callbacks with student admission numbers</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        updateOperationsPolicy({ enableMpesaAutoReconciliation: !opsPolicy.enableMpesaAutoReconciliation });
                        triggerToast(`M-Pesa Auto-Reconciliation ${!opsPolicy.enableMpesaAutoReconciliation ? 'enabled' : 'disabled'}`);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer shrink-0 ${
                        opsPolicy.enableMpesaAutoReconciliation
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {opsPolicy.enableMpesaAutoReconciliation ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>

                  {/* Directive 2: Head Teacher Clearance Threshold */}
                  <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="font-bold text-white">Head Teacher Procurement Limit</div>
                    <div className="text-[11px] text-slate-400">Requisitions exceeding this KES amount require Head Teacher sign-off</div>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="number"
                        value={opsPolicy.procurementApprovalThreshold}
                        onChange={(e) => updateOperationsPolicy({ procurementApprovalThreshold: Number(e.target.value) || 0 })}
                        className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs w-28 focus:outline-none focus:ring-1 focus:ring-teal-400"
                        placeholder="50000"
                      />
                      <span className="text-[10px] text-slate-400 font-mono">KES threshold</span>
                    </div>
                  </div>

                  {/* Directive 3: Strict Budget Ceiling */}
                  <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-white">Strict Budget Ceiling</div>
                      <div className="text-[11px] text-slate-400">Block requisitions if departmental vote head is depleted</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        updateOperationsPolicy({ strictBudgetEnforcement: !opsPolicy.strictBudgetEnforcement });
                        triggerToast(`Strict budget enforcement ${!opsPolicy.strictBudgetEnforcement ? 'enabled' : 'disabled'}`);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer shrink-0 ${
                        opsPolicy.strictBudgetEnforcement
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {opsPolicy.strictBudgetEnforcement ? 'Enforced' : 'Relaxed'}
                    </button>
                  </div>

                  {/* Directive 4: 3-Way Matching for Disbursements */}
                  <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-white">3-Way Matching Gate</div>
                      <div className="text-[11px] text-slate-400">Enforce Requisition &harr; LPO &harr; GRN check before payment</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        updateOperationsPolicy({ requireThreeWayMatchingForPayment: !opsPolicy.requireThreeWayMatchingForPayment });
                        triggerToast(`3-Way Matching ${!opsPolicy.requireThreeWayMatchingForPayment ? 'mandated' : 'optional'}`);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer shrink-0 ${
                        opsPolicy.requireThreeWayMatchingForPayment
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {opsPolicy.requireThreeWayMatchingForPayment ? 'Mandated' : 'Optional'}
                    </button>
                  </div>

                  {/* Directive 5: Lock Disbursed Payroll Runs */}
                  <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-white">Payroll Audit Freeze</div>
                      <div className="text-[11px] text-slate-400">Lock historical payroll runs to prevent unauthorized alterations</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        updateOperationsPolicy({ lockDisbursedPayrollRuns: !opsPolicy.lockDisbursedPayrollRuns });
                        triggerToast(`Payroll audit lock ${!opsPolicy.lockDisbursedPayrollRuns ? 'active' : 'unlocked'}`);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer shrink-0 ${
                        opsPolicy.lockDisbursedPayrollRuns
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {opsPolicy.lockDisbursedPayrollRuns ? 'Locked' : 'Open'}
                    </button>
                  </div>

                  {/* Directive 6: Auto-Reorder Replenishment Alerts */}
                  <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-white">Stores Minimum Alerts</div>
                      <div className="text-[11px] text-slate-400">Send alerts to storekeepers when bin levels reach reorder threshold</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        updateOperationsPolicy({ autoReorderAlertsEnabled: !opsPolicy.autoReorderAlertsEnabled });
                        triggerToast(`Stores reorder alerts ${!opsPolicy.autoReorderAlertsEnabled ? 'enabled' : 'disabled'}`);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer shrink-0 ${
                        opsPolicy.autoReorderAlertsEnabled
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {opsPolicy.autoReorderAlertsEnabled ? 'Active' : 'Muted'}
                    </button>
                  </div>

                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: TENANT SCHOOL OVERRIDES
          ========================================================================= */}
      {activeTab === 'tenants' && (
        <div className="p-5 sm:p-6 space-y-6">
          <div>
            <h3 className="text-base font-black text-white font-serif">Tenant School Specific Overrides</h3>
            <p className="text-xs text-slate-400">
              Select any school to restrict specific portals or assign campus-level banners.
            </p>
          </div>

          {/* School selector pill buttons */}
          <div className="flex flex-wrap gap-2">
            {allTenants.map((tenant) => (
              <button
                key={tenant.id}
                onClick={() => setSelectedSchoolForOverride(tenant.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
                  selectedSchoolForOverride === tenant.id
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md font-black'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <School className="w-3.5 h-3.5" />
                <span>{tenant.name}</span>
                <span className="text-[10px] font-mono opacity-80">({tenant.code})</span>
              </button>
            ))}
          </div>

          {/* Selected School Details */}
          {(() => {
            const currentSchool = allTenants.find(t => t.id === selectedSchoolForOverride) || allTenants[0];
            const override = customization.schoolOverrides[selectedSchoolForOverride] || {};
            const disabledWs = override.disabledWorkspaceIds || [];

            return (
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">{currentSchool.name} Workspaces Allocation</h4>
                    <p className="text-xs text-slate-400">Check to disable workspaces specifically for this campus</p>
                  </div>
                  <span className="text-xs font-mono text-amber-400">Status: {currentSchool.status}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {customization.workspaces.map((ws) => {
                    const isDisabledForSchool = disabledWs.includes(ws.id);
                    return (
                      <div 
                        key={ws.id}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                          isDisabledForSchool 
                            ? 'bg-red-950/20 border-red-900/40 text-red-300'
                            : 'bg-slate-900 border-slate-800 text-slate-200'
                        }`}
                      >
                        <span className="font-bold">{ws.shortName}</span>
                        <button
                          onClick={() => {
                            const newDisabled = isDisabledForSchool
                              ? disabledWs.filter(id => id !== ws.id)
                              : [...disabledWs, ws.id];
                            updateSchoolOverride(selectedSchoolForOverride, {
                              disabledWorkspaceIds: newDisabled
                            });
                            triggerToast(`${ws.shortName} ${isDisabledForSchool ? 'enabled' : 'disabled'} for ${currentSchool.name}`);
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                            isDisabledForSchool
                              ? 'bg-red-500 text-white'
                              : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                          }`}
                        >
                          {isDisabledForSchool ? 'Disabled' : 'Active'}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Campus Specific Notice */}
                <div className="pt-3 border-t border-slate-800">
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Special Campus Announcement for {currentSchool.name}
                  </label>
                  <input
                    type="text"
                    value={override.customNotice || ''}
                    onChange={(e) => {
                      updateSchoolOverride(selectedSchoolForOverride, { customNotice: e.target.value });
                    }}
                    placeholder="e.g. Annual Sports Day this Friday · Early departure for day scholars"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>

                {/* Campus-Specific Hero Headline, Subtitle & Call To Action Customizer */}
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>{currentSchool.name} · Hero Section Copy & CTAs</span>
                      </h5>
                      <p className="text-[10px] text-slate-400">
                        Customize how this specific school's landing page headline, subtitle, and CTA buttons appear.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Hero Title Headline</label>
                      <input
                        type="text"
                        value={currentSchool.heroTitle || `WELCOME TO ${currentSchool.name.toUpperCase()} PORTAL`}
                        onChange={(e) => {
                          updateTenant(currentSchool.id, { heroTitle: e.target.value });
                        }}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Curriculum Badge Text</label>
                      <input
                        type="text"
                        value={currentSchool.curriculumBadgeText || 'COMPETENCY-BASED CURRICULUM (CBC) · GRADES 1 TO 9'}
                        onChange={(e) => {
                          updateTenant(currentSchool.id, { curriculumBadgeText: e.target.value });
                        }}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Hero Subtitle Quote</label>
                    <textarea
                      rows={2}
                      value={currentSchool.heroSubtitle || `"${currentSchool.motto}" — A secure digital platform connecting learners, teachers, parents and school leadership.`}
                      onChange={(e) => {
                        updateTenant(currentSchool.id, { heroSubtitle: e.target.value });
                      }}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-2">
                      <label className="block text-[11px] font-bold text-emerald-400">Primary Hero Action Button</label>
                      <input
                        type="text"
                        value={currentSchool.heroPrimaryCtaText || 'Access Student Portal App'}
                        onChange={(e) => updateTenant(currentSchool.id, { heroPrimaryCtaText: e.target.value })}
                        className="w-full px-3 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-bold"
                        placeholder="Button Text"
                      />
                      <select
                        value={currentSchool.heroPrimaryCtaAction || 'student'}
                        onChange={(e) => updateTenant(currentSchool.id, { heroPrimaryCtaAction: e.target.value })}
                        className="w-full px-3 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                      >
                        <option value="student">👨‍🎓 Student Portal App</option>
                        <option value="parent">👨‍👩‍👧 Parent Portal App</option>
                        <option value="teacher">👩‍🏫 Teacher Workspace</option>
                        <option value="scroll_grid">📱 Scroll to All Portals Grid</option>
                      </select>
                    </div>

                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-2">
                      <label className="block text-[11px] font-bold text-blue-400">Secondary Hero Action Button</label>
                      <input
                        type="text"
                        value={currentSchool.heroSecondaryCtaText || 'Staff & Parent Portals'}
                        onChange={(e) => updateTenant(currentSchool.id, { heroSecondaryCtaText: e.target.value })}
                        className="w-full px-3 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-bold"
                        placeholder="Button Text"
                      />
                      <select
                        value={currentSchool.heroSecondaryCtaAction || 'school_admin_staff'}
                        onChange={(e) => updateTenant(currentSchool.id, { heroSecondaryCtaAction: e.target.value })}
                        className="w-full px-3 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                      >
                        <option value="school_admin_staff">🏛️ School Secretariat & Admin</option>
                        <option value="parent">👨‍👩‍👧 Parent Portal App</option>
                        <option value="teacher">👩‍🏫 Teacher Workspace</option>
                        <option value="scroll_grid">📱 Scroll to All Portals Grid</option>
                      </select>
                    </div>
                  </div>

                  {/* Campus-Specific Floating Highlight Card Overlay */}
                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Floating Highlight Card Overlay for {currentSchool.shortName || currentSchool.name}</span>
                      </span>
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentSchool.heroShowFloatingCard !== false}
                          onChange={(e) => updateTenant(currentSchool.id, { heroShowFloatingCard: e.target.checked })}
                          className="accent-amber-400 rounded"
                        />
                        <span>Show Card</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">Card Title Headline</label>
                        <input
                          type="text"
                          value={currentSchool.heroFloatingCardTitle || `${currentSchool.shortName || currentSchool.name} Digital Campus`}
                          onChange={(e) => updateTenant(currentSchool.id, { heroFloatingCardTitle: e.target.value })}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-bold"
                          placeholder="e.g. 99.4% Term Attendance"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">Card Subtitle</label>
                        <input
                          type="text"
                          value={currentSchool.heroFloatingCardSubtitle || currentSchool.motto}
                          onChange={(e) => updateTenant(currentSchool.id, { heroFloatingCardSubtitle: e.target.value })}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                          placeholder="e.g. Real-time biometrics & roll call monitoring"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">Status Badge Text</label>
                        <input
                          type="text"
                          value={currentSchool.heroFloatingCardBadgeText || 'ACTIVE'}
                          onChange={(e) => updateTenant(currentSchool.id, { heroFloatingCardBadgeText: e.target.value.toUpperCase() })}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono font-bold uppercase"
                          placeholder="e.g. ACTIVE"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">Badge Color Theme</label>
                        <select
                          value={currentSchool.heroFloatingCardBadgeColor || 'emerald'}
                          onChange={(e) => updateTenant(currentSchool.id, { heroFloatingCardBadgeColor: e.target.value as any })}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                        >
                          <option value="emerald">🟢 Emerald Green (ACTIVE)</option>
                          <option value="blue">🔵 Royal Blue (VERIFIED)</option>
                          <option value="amber">🟡 Amber Gold (SPOTLIGHT)</option>
                          <option value="purple">🟣 Indigo Purple (AI-POWERED)</option>
                          <option value="slate">⚪ Classic Slate (OFFICIAL)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        triggerToast(`Saved and retained custom Hero Copy & CTAs for ${currentSchool.name}!`);
                      }}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5 text-slate-950" />
                      <span>Save & Retain {currentSchool.shortName || currentSchool.name} Hero Settings</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* =========================================================================
          TAB 4: GLOBAL BROADCAST & BANNERS
          ========================================================================= */}
      {activeTab === 'broadcast' && (
        <div className="p-5 sm:p-6 space-y-6 max-w-3xl">
          <div>
            <h3 className="text-base font-black text-white font-serif">Platform-Wide Emergency & Announcement Broadcast</h3>
            <p className="text-xs text-slate-400">
              Transmit instant banner alerts to every logged-in user or visitor on the public landing page.
            </p>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={customization.globalSettings.broadcastNotice.active}
                  onChange={(e) => updateGlobalSettings({
                    broadcastNotice: {
                      ...customization.globalSettings.broadcastNotice,
                      active: e.target.checked
                    }
                  })}
                  className="w-4 h-4 accent-amber-400"
                />
                <span className="text-sm font-bold text-white">Broadcast Banner Active</span>
              </label>

              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                customization.globalSettings.broadcastNotice.active
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {customization.globalSettings.broadcastNotice.active ? 'ON AIR' : 'MUTED'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Broadcast Message Content</label>
              <textarea
                rows={3}
                value={customization.globalSettings.broadcastNotice.message}
                onChange={(e) => updateGlobalSettings({
                  broadcastNotice: {
                    ...customization.globalSettings.broadcastNotice,
                    message: e.target.value
                  }
                })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Banner Alert Level</label>
                <select
                  value={customization.globalSettings.broadcastNotice.type}
                  onChange={(e) => updateGlobalSettings({
                    broadcastNotice: {
                      ...customization.globalSettings.broadcastNotice,
                      type: e.target.value as any
                    }
                  })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                >
                  <option value="info">Info (Blue)</option>
                  <option value="warning">Warning (Amber)</option>
                  <option value="alert">Critical Alert (Red)</option>
                  <option value="success">Success (Emerald)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Target Audience</label>
                <select
                  value={customization.globalSettings.broadcastNotice.targetAudience}
                  onChange={(e) => updateGlobalSettings({
                    broadcastNotice: {
                      ...customization.globalSettings.broadcastNotice,
                      targetAudience: e.target.value as any
                    }
                  })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                >
                  <option value="all">Everywhere (Landing & All Portals)</option>
                  <option value="landing_only">Public Landing Page Only</option>
                  <option value="portals_only">School Workspaces & Portals Only</option>
                </select>
              </div>
            </div>

            {/* Live Banner Preview */}
            <div className="pt-3 border-t border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Live Broadcast Preview:</span>
              <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                customization.globalSettings.broadcastNotice.type === 'alert'
                  ? 'bg-red-500/20 text-red-200 border border-red-500/40'
                  : customization.globalSettings.broadcastNotice.type === 'warning'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                  : customization.globalSettings.broadcastNotice.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
                  : 'bg-blue-500/20 text-blue-200 border border-blue-500/40'
              }`}>
                <Megaphone className="w-4 h-4 shrink-0" />
                <span>{customization.globalSettings.broadcastNotice.message || 'No broadcast message configured.'}</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: BACKUP & JSON SYNC
          ========================================================================= */}
      {activeTab === 'json' && (
        <div className="p-5 sm:p-6 space-y-6 max-w-3xl">
          <div>
            <h3 className="text-base font-black text-white font-serif">Export & Import Platform Customization</h3>
            <p className="text-xs text-slate-400">
              Download complete platform settings as JSON or paste an exported configuration to restore.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                const data = exportConfiguration();
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `edusmart-platform-config-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                triggerToast('Configuration exported as JSON file!');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export Config (Download JSON)</span>
            </button>

            <button
              onClick={() => {
                navigator.clipboard.writeText(exportConfiguration());
                triggerToast('JSON copied to clipboard!');
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-2 cursor-pointer"
            >
              <span>Copy JSON to Clipboard</span>
            </button>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300">Paste JSON Configuration to Restore</label>
            <textarea
              rows={8}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste exported platform configuration JSON here..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              onClick={() => {
                if (!jsonInput.trim()) {
                  triggerToast('Please paste valid JSON configuration first.');
                  return;
                }
                const success = importConfiguration(jsonInput);
                if (success) {
                  setJsonInput('');
                  triggerToast('Configuration imported successfully!');
                } else {
                  triggerToast('Invalid configuration JSON. Please verify schema.');
                }
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Import & Apply Configuration</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT / CREATE FEATURE CARD
          ========================================================================= */}
      {(editingFeature || isNewFeatureModalOpen) && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white font-serif">
                {editingFeature ? 'Edit Feature Card' : 'Add New Feature Card'}
              </h3>
              <button 
                onClick={() => { setEditingFeature(null); setIsNewFeatureModalOpen(false); }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Feature Title</label>
              <input
                type="text"
                value={editingFeature ? editingFeature.title : newFeature.title}
                onChange={(e) => {
                  if (editingFeature) setEditingFeature({ ...editingFeature, title: e.target.value });
                  else setNewFeature({ ...newFeature, title: e.target.value });
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                placeholder="e.g. Smart Biometric Attendance"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Badge Tag</label>
              <input
                type="text"
                value={editingFeature ? editingFeature.tag : newFeature.tag}
                onChange={(e) => {
                  if (editingFeature) setEditingFeature({ ...editingFeature, tag: e.target.value });
                  else setNewFeature({ ...newFeature, tag: e.target.value });
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                placeholder="e.g. Safety & Tracking"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Description</label>
              <textarea
                rows={3}
                value={editingFeature ? editingFeature.description : newFeature.description}
                onChange={(e) => {
                  if (editingFeature) setEditingFeature({ ...editingFeature, description: e.target.value });
                  else setNewFeature({ ...newFeature, description: e.target.value });
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                placeholder="Comprehensive description of the feature..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
                <input
                  type="text"
                  value={editingFeature ? editingFeature.category : newFeature.category}
                  onChange={(e) => {
                    if (editingFeature) setEditingFeature({ ...editingFeature, category: e.target.value });
                    else setNewFeature({ ...newFeature, category: e.target.value });
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                  placeholder="e.g. Operations, Academics"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Icon Name</label>
                <select
                  value={editingFeature ? editingFeature.icon : newFeature.icon}
                  onChange={(e) => {
                    if (editingFeature) setEditingFeature({ ...editingFeature, icon: e.target.value });
                    else setNewFeature({ ...newFeature, icon: e.target.value });
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                >
                  {AVAILABLE_ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => { setEditingFeature(null); setIsNewFeatureModalOpen(false); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={editingFeature ? handleSaveFeature : handleCreateFeature}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs"
              >
                {editingFeature ? 'Save Changes' : 'Add Feature'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT / CREATE STAT METRIC
          ========================================================================= */}
      {(editingStat || isNewStatModalOpen) && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white font-serif">
                {editingStat ? 'Edit Metric' : 'Add New Metric'}
              </h3>
              <button 
                onClick={() => { setEditingStat(null); setIsNewStatModalOpen(false); }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Metric Number / Value</label>
              <input
                type="text"
                value={editingStat ? editingStat.value : newStat.value}
                onChange={(e) => {
                  if (editingStat) setEditingStat({ ...editingStat, value: e.target.value });
                  else setNewStat({ ...newStat, value: e.target.value });
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono"
                placeholder="e.g. 52+, 248,000+, 99.9%"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Metric Label</label>
              <input
                type="text"
                value={editingStat ? editingStat.label : newStat.label}
                onChange={(e) => {
                  if (editingStat) setEditingStat({ ...editingStat, label: e.target.value });
                  else setNewStat({ ...newStat, label: e.target.value });
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                placeholder="e.g. Partner Schools"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Supporting Subtext</label>
              <input
                type="text"
                value={editingStat ? editingStat.subtext : newStat.subtext}
                onChange={(e) => {
                  if (editingStat) setEditingStat({ ...editingStat, subtext: e.target.value });
                  else setNewStat({ ...newStat, subtext: e.target.value });
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                placeholder="e.g. Primary & Junior Secondary enrolled"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => { setEditingStat(null); setIsNewStatModalOpen(false); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={editingStat ? handleSaveStat : handleCreateStat}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs"
              >
                {editingStat ? 'Save Changes' : 'Add Metric'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT / CREATE WORKSPACE MODULE
          ========================================================================= */}
      {(editingWorkspace || isNewWorkspaceModalOpen) && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white font-serif">
                {editingWorkspace ? `Customize: ${editingWorkspace.name}` : 'Create Brand-New Workspace Module'}
              </h3>
              <button 
                onClick={() => { setEditingWorkspace(null); setIsNewWorkspaceModalOpen(false); }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Full Workspace Name</label>
                <input
                  type="text"
                  value={editingWorkspace ? editingWorkspace.name : newWorkspace.name}
                  onChange={(e) => {
                    if (editingWorkspace) setEditingWorkspace({ ...editingWorkspace, name: e.target.value });
                    else setNewWorkspace({ ...newWorkspace, name: e.target.value });
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                  placeholder="e.g. Alumni & Heritage Hub"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Short Display Name</label>
                <input
                  type="text"
                  value={editingWorkspace ? editingWorkspace.shortName : newWorkspace.shortName}
                  onChange={(e) => {
                    if (editingWorkspace) setEditingWorkspace({ ...editingWorkspace, shortName: e.target.value });
                    else setNewWorkspace({ ...newWorkspace, shortName: e.target.value });
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                  placeholder="e.g. Alumni Hub"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Workspace Description</label>
              <textarea
                rows={2}
                value={editingWorkspace ? editingWorkspace.description : newWorkspace.description}
                onChange={(e) => {
                  if (editingWorkspace) setEditingWorkspace({ ...editingWorkspace, description: e.target.value });
                  else setNewWorkspace({ ...newWorkspace, description: e.target.value });
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                placeholder="Purpose and key features of this workspace..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Custom Announcement / Notice</label>
              <input
                type="text"
                value={editingWorkspace ? editingWorkspace.customNotice : newWorkspace.customNotice}
                onChange={(e) => {
                  if (editingWorkspace) setEditingWorkspace({ ...editingWorkspace, customNotice: e.target.value });
                  else setNewWorkspace({ ...newWorkspace, customNotice: e.target.value });
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                placeholder="e.g. Termly submissions close this Friday 5:00 PM"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Accent Theme Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editingWorkspace ? editingWorkspace.accentColor : newWorkspace.accentColor}
                    onChange={(e) => {
                      if (editingWorkspace) setEditingWorkspace({ ...editingWorkspace, accentColor: e.target.value });
                      else setNewWorkspace({ ...newWorkspace, accentColor: e.target.value });
                    }}
                    className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={editingWorkspace ? editingWorkspace.accentColor : newWorkspace.accentColor}
                    onChange={(e) => {
                      if (editingWorkspace) setEditingWorkspace({ ...editingWorkspace, accentColor: e.target.value });
                      else setNewWorkspace({ ...newWorkspace, accentColor: e.target.value });
                    }}
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
                <select
                  value={editingWorkspace ? editingWorkspace.category : newWorkspace.category}
                  onChange={(e) => {
                    if (editingWorkspace) setEditingWorkspace({ ...editingWorkspace, category: e.target.value as any });
                    else setNewWorkspace({ ...newWorkspace, category: e.target.value as any });
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                >
                  <option value="Learner">Learner</option>
                  <option value="Academics">Academics</option>
                  <option value="Leadership">Leadership</option>
                  <option value="Specialized Operations">Specialized Operations</option>
                  <option value="Administration">Administration</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => { setEditingWorkspace(null); setIsNewWorkspaceModalOpen(false); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={editingWorkspace ? handleSaveWorkspace : handleCreateCustomWorkspace}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs"
              >
                {editingWorkspace ? 'Save Changes' : 'Create Module'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
