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
  UserCheck
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

// Preset educational images for hero section
const HERO_IMAGE_PRESETS = [
  { label: 'Campus Aerial & Grounds', url: '/src/assets/images/edusmart_campus_banner_1790859700873.jpg' },
  { label: 'Science & Ecosystem Lab', url: '/src/assets/images/diagram_science_ecosystem_1790859717590.jpg' },
  { label: 'Mathematics & Geometry', url: '/src/assets/images/diagram_math_geometry_1790859731617.jpg' },
  { label: 'African Classroom Uniforms (Unsplash)', url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Modern Digital Classroom (Unsplash)', url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80' }
];

const AVAILABLE_ICONS = [
  'School', 'GraduationCap', 'BookOpen', 'Users', 'Calendar', 
  'BarChart3', 'Laptop', 'ShieldCheck', 'Shield', 'Award', 
  'Building2', 'Layers', 'Sliders', 'Sparkles', 'Globe'
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
    updateSchoolOverride,
    resetToDefaults,
    exportConfiguration,
    importConfiguration
  } = usePlatformCustomization();

  const { allTenants } = useTenant();

  const [activeTab, setActiveTab] = useState<'landing' | 'workspaces' | 'tenants' | 'broadcast' | 'json'>('landing');
  const [landingSubTab, setLandingSubTab] = useState<'visibility' | 'header' | 'hero' | 'stats' | 'features' | 'about' | 'testimonials' | 'pricing' | 'faqs' | 'contact' | 'footer'>('visibility');
  
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
                  <label className="block text-xs font-bold text-slate-300 mb-1">School Login Button Text</label>
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
                  <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Hero Section Copy & Calls To Action</span>
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Top Pill Tag Text</label>
                    <input
                      type="text"
                      value={customization.landingPage.hero.pillTag}
                      onChange={(e) => updateLandingHero({ pillTag: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Headline Part 1</label>
                      <input
                        type="text"
                        value={customization.landingPage.hero.headlineStart}
                        onChange={(e) => updateLandingHero({ headlineStart: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Headline Part 2</label>
                      <input
                        type="text"
                        value={customization.landingPage.hero.headlineMid}
                        onChange={(e) => updateLandingHero({ headlineMid: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-amber-400 mb-1">Highlight Part</label>
                      <input
                        type="text"
                        value={customization.landingPage.hero.headlineHighlight}
                        onChange={(e) => updateLandingHero({ headlineHighlight: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-amber-500/50 rounded-lg text-xs text-amber-300 font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Subtitle / Mission Statement</label>
                    <textarea
                      rows={3}
                      value={customization.landingPage.hero.subtitle}
                      onChange={(e) => updateLandingHero({ subtitle: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Primary CTA Button Label</label>
                      <input
                        type="text"
                        value={customization.landingPage.hero.primaryCta}
                        onChange={(e) => updateLandingHero({ primaryCta: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Secondary CTA Button Label</label>
                      <input
                        type="text"
                        value={customization.landingPage.hero.secondaryCta}
                        onChange={(e) => updateLandingHero({ secondaryCta: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Hero Image Selection */}
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <label className="block text-xs font-bold text-slate-300">Hero Banner Image URL</label>
                    <input
                      type="text"
                      value={customization.landingPage.hero.heroImageUrl}
                      onChange={(e) => updateLandingHero({ heroImageUrl: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 font-mono"
                      placeholder="Paste image URL or choose preset below"
                    />

                    {/* Presets */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-500 self-center mr-1">Presets:</span>
                      {HERO_IMAGE_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => updateLandingHero({ heroImageUrl: preset.url })}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                            customization.landingPage.hero.heroImageUrl === preset.url
                              ? 'bg-amber-400 text-slate-950 border-amber-300'
                              : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Floating Metric Card Overlay */}
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300">Show Floating Highlight Card</label>
                      <input
                        type="checkbox"
                        checked={customization.landingPage.hero.showFloatingCard}
                        onChange={(e) => updateLandingHero({ showFloatingCard: e.target.checked })}
                        className="w-4 h-4 accent-amber-400"
                      />
                    </div>
                    {customization.landingPage.hero.showFloatingCard && (
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <input
                          type="text"
                          value={customization.landingPage.hero.floatingCardTitle}
                          onChange={(e) => updateLandingHero({ floatingCardTitle: e.target.value })}
                          className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                          placeholder="Card Title"
                        />
                        <input
                          type="text"
                          value={customization.landingPage.hero.floatingCardSubtitle}
                          onChange={(e) => updateLandingHero({ floatingCardSubtitle: e.target.value })}
                          className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                          placeholder="Card Subtitle"
                        />
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Live Preview Right 5 Cols */}
              <div className="lg:col-span-5 space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Live Hero Preview</span>
                  <span className="text-[10px] text-emerald-400 font-mono">● Active synced</span>
                </div>

                <div className="bg-white rounded-2xl p-6 text-slate-900 shadow-xl border border-slate-200 space-y-4">
                  <div className="inline-block px-3 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black tracking-widest uppercase">
                    {customization.landingPage.hero.pillTag}
                  </div>

                  <h3 className="text-2xl font-black font-serif leading-tight text-slate-950">
                    {customization.landingPage.hero.headlineStart}<br />
                    {customization.landingPage.hero.headlineMid}<br />
                    <span className="text-blue-700">{customization.landingPage.hero.headlineHighlight}</span>
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-3">
                    {customization.landingPage.hero.subtitle}
                  </p>

                  <div className="flex gap-2 pt-2">
                    <span className="px-3 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-lg shadow-sm">
                      {customization.landingPage.hero.primaryCta}
                    </span>
                    <span className="px-3 py-1.5 bg-slate-100 text-slate-800 font-bold text-xs rounded-lg border border-slate-200">
                      {customization.landingPage.hero.secondaryCta}
                    </span>
                  </div>

                  {/* Thumbnail of Image */}
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 h-36 bg-slate-100">
                    <img 
                      src={customization.landingPage.hero.heroImageUrl} 
                      alt="Hero preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/src/assets/images/edusmart_campus_banner_1790859700873.jpg';
                      }}
                    />
                    {customization.landingPage.hero.showFloatingCard && (
                      <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-md p-2 rounded-lg shadow-md border border-slate-200">
                        <div className="text-xs font-black text-slate-900">{customization.landingPage.hero.floatingCardTitle}</div>
                        <div className="text-[10px] text-slate-500">{customization.landingPage.hero.floatingCardSubtitle}</div>
                      </div>
                    )}
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
