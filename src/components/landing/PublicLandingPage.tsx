import React, { useState } from 'react';
import { 
  School, 
  GraduationCap, 
  BookOpen, 
  Users, 
  Calendar, 
  BarChart3, 
  Laptop, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Phone, 
  Mail, 
  MapPin, 
  Building2, 
  Lock, 
  Send,
  HelpCircle,
  Clock,
  Award,
  ChevronRight,
  Menu,
  X,
  Shield,
  Layers,
  Sliders,
  Globe,
  Megaphone,
  Edit3,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Star,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Check,
  MessageSquare
} from 'lucide-react';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { useTenant } from '../../context/TenantContext';
import { usePlatformCustomization } from '../../context/PlatformCustomizationContext';
import { 
  LandingFeatureItem, 
  LandingStatItem, 
  LandingTestimonialItem, 
  LandingPricingTier, 
  LandingFaqItem,
  LandingSectionsVisibility
} from '../../types/customization';

interface PublicLandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToPlatformAdmin: () => void;
  onOpenRegisterSchool?: () => void;
}

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

// Helper to render dynamic Lucide icon
const renderIcon = (iconName: string, className = "w-6 h-6") => {
  switch (iconName) {
    case 'School': return <School className={className} />;
    case 'GraduationCap': return <GraduationCap className={className} />;
    case 'BookOpen': return <BookOpen className={className} />;
    case 'Users': return <Users className={className} />;
    case 'Calendar': return <Calendar className={className} />;
    case 'BarChart3': return <BarChart3 className={className} />;
    case 'Laptop': return <Laptop className={className} />;
    case 'ShieldCheck': return <ShieldCheck className={className} />;
    case 'Shield': return <Shield className={className} />;
    case 'Award': return <Award className={className} />;
    case 'Building2': return <Building2 className={className} />;
    case 'Layers': return <Layers className={className} />;
    case 'Sliders': return <Sliders className={className} />;
    case 'Sparkles': return <Sparkles className={className} />;
    case 'Globe': return <Globe className={className} />;
    default: return <BookOpen className={className} />;
  }
};

export const PublicLandingPage: React.FC<PublicLandingPageProps> = ({
  onNavigateToLogin,
  onNavigateToPlatformAdmin,
  onOpenRegisterSchool
}) => {
  const { allTenants } = useTenant();
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
    resetToDefaults
  } = usePlatformCustomization();

  const { landingPage, globalSettings } = customization;
  const { 
    visibility, 
    header, 
    hero, 
    stats, 
    features, 
    about, 
    testimonials, 
    pricing, 
    faqs, 
    contact, 
    footer 
  } = landingPage;

  // Visual Editor State
  const [isSuperAdminEditMode, setIsSuperAdminEditMode] = useState<boolean>(false);
  const [activeEditorSection, setActiveEditorSection] = useState<string | null>(null);
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(faqs[0]?.id || null);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Registration modal state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regForm, setRegForm] = useState({
    schoolName: '',
    county: 'Nairobi County',
    curriculum: 'Kenyan CBC Curriculum',
    adminEmail: '',
    phone: '',
    estimatedStudents: '800'
  });
  const [regSuccess, setRegSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  // Quick Inline Add Modals
  const [newTrustBadgeInput, setNewTrustBadgeInput] = useState('');
  const [editingItemType, setEditingItemType] = useState<'feature' | 'stat' | 'testimonial' | 'faq' | 'pricing' | null>(null);
  const [editingItemData, setEditingItemData] = useState<any>(null);

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegSuccess(true);
    setTimeout(() => {
      setRegSuccess(false);
      setShowRegisterModal(false);
      setToastMessage(`Registration request for "${regForm.schoolName}" submitted successfully! Our onboarding team will contact ${regForm.adminEmail} within 2 hours.`);
      setTimeout(() => setToastMessage(null), 5000);
    }, 1000);
  };

  const scrollToSection = (id: string, tabName: string) => {
    setActiveTab(tabName);
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const activeFeatures = features.filter(f => f.enabled);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white relative">
      
      {/* ========================================================
          SUPER ADMIN LIVE IN-CONTEXT CUSTOMIZER TOOLBAR
          Full control for Super Admin to edit, add, remove, customize every part
          ======================================================== */}
      <div className="sticky top-0 z-50 bg-slate-950 text-slate-100 border-b border-amber-400/40 px-4 py-2.5 shadow-2xl backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isSuperAdminEditMode ? 'bg-amber-400' : 'bg-slate-500'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isSuperAdminEditMode ? 'bg-amber-400' : 'bg-slate-400'}`}></span>
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Super Admin Visual Control:</span>
              </span>
              <span className="hidden sm:inline text-slate-300">
                {isSuperAdminEditMode 
                  ? 'Live In-Context Edit Mode is ACTIVE. Click any section toolbar to edit, add, or remove.'
                  : 'Full landing page customization enabled. Toggle live editing to customize any element.'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            
            {/* Toggle Live Edit Mode */}
            <button
              onClick={() => setIsSuperAdminEditMode(!isSuperAdminEditMode)}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                isSuperAdminEditMode
                  ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 ring-2 ring-amber-300'
                  : 'bg-slate-800 text-amber-300 hover:bg-slate-700 border border-amber-400/50'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isSuperAdminEditMode ? 'Live Edit: ON' : 'Turn On Live Edit'}</span>
            </button>

            {/* Quick Section Selector Drawer */}
            <select
              value={activeEditorSection || ''}
              onChange={(e) => setActiveEditorSection(e.target.value || null)}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
            >
              <option value="">Quick Customize Section...</option>
              <option value="header">Header & Navbar</option>
              <option value="hero">Hero Section</option>
              <option value="stats">Impact & Metrics</option>
              <option value="features">Core Features</option>
              <option value="about">About & Mission</option>
              <option value="testimonials">Testimonials & Reviews</option>
              <option value="pricing">Pricing Tiers</option>
              <option value="faqs">FAQ Accordion</option>
              <option value="contact">Contact & Support</option>
              <option value="footer">Footer & Copyright</option>
              <option value="visibility">Section Visibility Manager</option>
            </select>

            {/* Platform Admin Console Link */}
            <button
              onClick={onNavigateToPlatformAdmin}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Open full Super Admin Management Console"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Admin Console</span>
            </button>

            {/* Reset to Defaults */}
            <div className="relative">
              <button
                onClick={() => setShowResetConfirm(true)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Reset Landing Page Defaults"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {showResetConfirm && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700 text-white rounded-2xl p-4 shadow-2xl z-50 text-left space-y-3">
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Landing Page Defaults?</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    This will restore the original default headlines, copy, trust badges, and features.
                  </p>
                  <div className="flex items-center justify-end gap-2 text-xs">
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="px-2.5 py-1 text-slate-400 hover:text-white font-semibold rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        resetToDefaults();
                        setShowResetConfirm(false);
                        setToastMessage('Landing page reset to original system defaults!');
                        setTimeout(() => setToastMessage(null), 4000);
                      }}
                      className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg"
                    >
                      Yes, Reset
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* Persistent Toast Feedback Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 text-white px-4 py-3 rounded-2xl shadow-2xl border border-amber-400/50 flex items-center gap-3 animate-fade-in max-w-md">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-xs font-bold text-slate-200 leading-snug flex-1">{toastMessage}</p>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================
          GLOBAL BROADCAST ANNOUNCEMENT BANNER
          ======================================================== */}
      {visibility.broadcast && globalSettings.broadcastNotice.active && (globalSettings.broadcastNotice.targetAudience === 'all' || globalSettings.broadcastNotice.targetAudience === 'landing_only') && (
        <div className={`py-2 px-4 text-xs font-bold flex items-center justify-center gap-2 border-b relative group ${
          globalSettings.broadcastNotice.type === 'alert'
            ? 'bg-red-600 text-white border-red-700'
            : globalSettings.broadcastNotice.type === 'warning'
            ? 'bg-amber-400 text-slate-950 border-amber-500'
            : globalSettings.broadcastNotice.type === 'success'
            ? 'bg-emerald-600 text-white border-emerald-700'
            : 'bg-blue-600 text-white border-blue-700'
        }`}>
          <Megaphone className="w-3.5 h-3.5 shrink-0" />
          <span>{globalSettings.broadcastNotice.message}</span>
          
          {isSuperAdminEditMode && (
            <button
              onClick={() => toggleSectionVisibility('broadcast')}
              className="ml-2 px-2 py-0.5 rounded bg-black/30 hover:bg-black/50 text-[10px] font-mono text-white flex items-center gap-1 cursor-pointer"
              title="Hide Broadcast Banner"
            >
              <EyeOff className="w-3 h-3" />
              <span>Hide</span>
            </button>
          )}
        </div>
      )}

      {/* ========================================================
          1. HEADER NAVBAR (FULLY CUSTOMIZABLE)
          ======================================================== */}
      {visibility.header && (
        <header className="sticky top-11 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs relative group">
          
          {/* In-Context Section Edit Bar when Edit Mode is active */}
          {isSuperAdminEditMode && (
            <div className="bg-amber-400/90 text-slate-950 px-4 py-1 text-[11px] font-black flex items-center justify-between border-b border-amber-500">
              <span className="flex items-center gap-1">
                <Sliders className="w-3 h-3" />
                <span>Header & Navbar Controls</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveEditorSection('header')}
                  className="px-2 py-0.5 bg-slate-950 text-amber-300 rounded text-[10px] hover:bg-slate-900 cursor-pointer"
                >
                  Edit Header Text & Links
                </button>
                <button
                  onClick={() => toggleSectionVisibility('header')}
                  className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] hover:bg-red-700 cursor-pointer"
                >
                  Hide Header
                </button>
              </div>
            </div>
          )}

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-2xl border border-blue-100 flex items-center justify-center">
                <EduSmartGadsaLogo variant="emblem" size="md" />
              </div>
              <div>
                <span className="font-serif font-black text-xl tracking-tight text-slate-950 block leading-tight">
                  {header.brandName || 'EduSmart LMS'}
                </span>
                <span className="text-[10px] font-mono font-bold tracking-wider text-blue-700 uppercase block">
                  {header.brandSubtitle || 'Multi-Tenant School Platform'}
                </span>
              </div>
            </div>

            {/* Desktop Nav Links (Dynamic from config) */}
            <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
              {header.navLinks.filter(link => link.enabled).map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.sectionId, link.id)}
                  className={`hover:text-blue-700 transition-colors cursor-pointer ${
                    activeTab === link.id ? 'text-blue-700 font-bold' : ''
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </nav>

            {/* Header Action Button: [ School Login ] */}
            <div className="hidden sm:flex items-center gap-3">
              {header.showRegisterButton && (
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {header.registerButtonLabel}
                </button>
              )}

              {header.showLoginButton && (
                <button
                  onClick={onNavigateToLogin}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>{header.loginButtonLabel}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <div className="flex sm:hidden items-center gap-2">
              <button
                onClick={onNavigateToLogin}
                className="px-3 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-lg shadow-sm"
              >
                Login
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>

          {/* Mobile Navigation Drawer */}
          {mobileMenuOpen && (
            <div className="sm:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-3 shadow-lg">
              {header.navLinks.filter(l => l.enabled).map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.sectionId, link.id)}
                  className="block w-full text-left py-2 text-sm font-semibold text-slate-700 hover:text-blue-700"
                >
                  {link.label}
                </button>
              ))}
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                <button
                  onClick={onNavigateToLogin}
                  className="w-full py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl text-center"
                >
                  {header.loginButtonLabel}
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowRegisterModal(true);
                  }}
                  className="w-full py-2.5 bg-slate-100 text-slate-800 font-bold text-sm rounded-xl text-center"
                >
                  {header.registerButtonLabel}
                </button>
              </div>
            </div>
          )}
        </header>
      )}

      {/* ========================================================
          2. HERO SECTION (FULLY CUSTOMIZABLE)
          ======================================================== */}
      {visibility.hero && (
        <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/50 via-white to-slate-50 pt-12 pb-20 sm:pt-16 sm:pb-28 border-b border-slate-100 relative group">
          
          {/* In-Context Hero Toolbar */}
          {isSuperAdminEditMode && (
            <div className="absolute top-2 right-4 z-20 flex items-center gap-2 bg-slate-950 text-white px-3 py-1.5 rounded-xl border border-amber-400 shadow-xl text-xs font-bold">
              <span className="text-amber-400 flex items-center gap-1">
                <Edit3 className="w-3.5 h-3.5" />
                <span>Hero Section:</span>
              </span>
              <button
                onClick={() => setActiveEditorSection('hero')}
                className="px-2 py-0.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded text-[11px] font-black cursor-pointer"
              >
                Edit Copy, Image & Buttons
              </button>
              <button
                onClick={() => toggleSectionVisibility('hero')}
                className="px-2 py-0.5 bg-slate-800 hover:bg-red-900 text-slate-300 hover:text-white rounded text-[11px] cursor-pointer"
              >
                Hide Section
              </button>
            </div>
          )}

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left Hero Content */}
              <div className="lg:col-span-7 space-y-6 text-left">
                
                {/* Category Pill Tag */}
                {hero.pillTag && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-100/80 border border-blue-200 text-blue-800 text-xs font-black tracking-widest uppercase">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>{hero.pillTag}</span>
                  </div>
                )}

                {/* Main Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-950 font-serif tracking-tight leading-[1.12]">
                  {hero.headlineStart}<br />
                  {hero.headlineMid}<br />
                  <span className="text-blue-700">{hero.headlineHighlight}</span>
                </h1>

                {/* Subtitle */}
                <p className="text-base sm:text-lg text-slate-600 max-w-xl font-medium leading-relaxed">
                  {hero.subtitle}
                </p>

                {/* CTA Action Buttons */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    onClick={onNavigateToLogin}
                    className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2.5 cursor-pointer transform hover:-translate-y-0.5"
                  >
                    <Users className="w-4 h-4" />
                    <span>{hero.primaryCta}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setShowRegisterModal(true)}
                    className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm rounded-xl border border-slate-300 hover:border-slate-400 shadow-2xs hover:shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>{hero.secondaryCta}</span>
                  </button>
                </div>

                {/* Trust Indicators / Badges (Add / Remove supported) */}
                <div className="pt-6 border-t border-slate-200/80 flex flex-wrap items-center gap-4 text-xs text-slate-600 font-semibold">
                  {hero.trustBadges?.map((badge, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-slate-100/70 px-2.5 py-1 rounded-lg border border-slate-200 relative group/badge">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{badge}</span>
                      {isSuperAdminEditMode && (
                        <button
                          onClick={() => removeTrustBadge(idx)}
                          className="ml-1 text-red-500 hover:text-red-700"
                          title="Remove badge"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {isSuperAdminEditMode && (
                    <button
                      onClick={() => {
                        const val = prompt('Enter new trust indicator label (e.g. ISO 27001 Certified):');
                        if (val?.trim()) addTrustBadge(val.trim());
                      }}
                      className="px-2 py-1 rounded-lg border border-dashed border-amber-500 text-amber-700 font-bold text-xs flex items-center gap-1 hover:bg-amber-50 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Badge</span>
                    </button>
                  )}
                </div>

              </div>

              {/* Right Hero Visual: School Campus Banner / Student Photograph */}
              <div className="lg:col-span-5 relative">
                <div className="relative mx-auto max-w-md lg:max-w-none">
                  
                  {/* Decorative glow backing */}
                  <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 to-teal-400 rounded-3xl blur-xl opacity-20 transform -rotate-1" />

                  {/* Main Image Frame */}
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900 group/heroimg">
                    <img
                      src={hero.heroImageUrl || "/src/assets/images/edusmart_campus_banner_1790859700873.jpg"}
                      alt="EduSmart Learners & School Campus"
                      className="w-full h-80 sm:h-96 object-cover object-center transform hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/src/assets/images/edusmart_campus_banner_1790859700873.jpg';
                      }}
                    />

                    {isSuperAdminEditMode && (
                      <button
                        onClick={() => setActiveEditorSection('hero')}
                        className="absolute top-3 right-3 bg-slate-950/90 text-amber-300 border border-amber-400 text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer hover:bg-slate-900"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Change Hero Photo</span>
                      </button>
                    )}
                    
                    {/* Floating Overlay Card */}
                    {hero.showFloatingCard && (
                      <div className="absolute bottom-4 left-4 right-4 bg-slate-950/85 backdrop-blur-md rounded-2xl p-3.5 text-white border border-white/10 shadow-lg flex items-center justify-between">
                        <div>
                          <div className="text-xs font-black text-amber-400 font-serif">{hero.floatingCardTitle}</div>
                          <div className="text-[10px] text-slate-300">{hero.floatingCardSubtitle}</div>
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full">
                          ● Active
                        </span>
                      </div>
                    )}
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          3. SOCIAL PROOF / IMPACT & STATS SECTION
          ======================================================== */}
      {visibility.stats && stats.length > 0 && (
        <section id="stats-section" className="py-10 bg-slate-900 text-white border-b border-slate-800 relative group">
          
          {isSuperAdminEditMode && (
            <div className="absolute top-2 right-4 z-20 flex items-center gap-2 bg-slate-950 text-white px-3 py-1 rounded-xl border border-amber-400 text-xs font-bold">
              <span className="text-amber-400">Stats Section:</span>
              <button
                onClick={() => {
                  setEditingItemType('stat');
                  setEditingItemData({ id: `stat-${Date.now()}`, label: 'New Metric', value: '100+', subtext: 'Supporting details', icon: 'School' });
                }}
                className="px-2 py-0.5 bg-amber-400 text-slate-950 rounded text-[10px] font-bold cursor-pointer"
              >
                + Add Metric
              </button>
              <button
                onClick={() => toggleSectionVisibility('stats')}
                className="px-2 py-0.5 bg-slate-800 hover:bg-red-900 text-slate-300 rounded text-[10px] cursor-pointer"
              >
                Hide
              </button>
            </div>
          )}

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((st) => (
                <div key={st.id} className="text-left space-y-1 p-3 bg-slate-950/40 rounded-xl border border-slate-800 relative group/stat">
                  {isSuperAdminEditMode && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-80 group-hover/stat:opacity-100">
                      <button
                        onClick={() => {
                          setEditingItemType('stat');
                          setEditingItemData(st);
                        }}
                        className="p-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded"
                        title="Edit stat"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeStat(st.id)}
                        className="p-1 bg-slate-800 hover:bg-red-800 text-red-400 rounded"
                        title="Delete stat"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <div className="text-blue-400 mb-1">{renderIcon(st.icon, "w-5 h-5")}</div>
                  <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">{st.value}</div>
                  <div className="text-xs font-bold text-slate-200">{st.label}</div>
                  <div className="text-[10px] text-slate-400">{st.subtext}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          4. CORE FEATURE CARDS SECTION
          ======================================================== */}
      {visibility.features && (
        <section id="features-section" className="py-16 sm:py-24 bg-white border-b border-slate-100 relative group">
          
          {isSuperAdminEditMode && (
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-slate-950 text-white px-3 py-1.5 rounded-xl border border-amber-400 text-xs font-bold">
              <span className="text-amber-400">Features Section:</span>
              <button
                onClick={() => {
                  setEditingItemType('feature');
                  setEditingItemData({
                    id: `feat-${Date.now()}`,
                    title: 'New Institutional Feature',
                    description: 'Description of the school capability or module.',
                    tag: 'Academics',
                    icon: 'BookOpen',
                    category: 'Academics',
                    enabled: true
                  });
                }}
                className="px-2.5 py-1 bg-amber-400 text-slate-950 rounded text-[11px] font-black cursor-pointer"
              >
                + Add Feature Card
              </button>
              <button
                onClick={() => toggleSectionVisibility('features')}
                className="px-2 py-0.5 bg-slate-800 hover:bg-red-900 text-slate-300 rounded text-[11px] cursor-pointer"
              >
                Hide
              </button>
            </div>
          )}

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-black tracking-widest text-blue-700 uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Institutional Capabilities
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 font-serif tracking-tight">
                Core Pillars Designed for Institutional Excellence
              </h2>
              <p className="text-sm sm:text-base text-slate-600">
                Everything required to operate modern CBC learning environments, track mastery, communicate with parents, and manage campus operations.
              </p>
            </div>

            {/* Dynamic Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeFeatures.map((feat) => (
                <div 
                  key={feat.id} 
                  className="bg-slate-50 hover:bg-white rounded-2xl p-6 border border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all space-y-4 group text-left relative"
                >
                  {isSuperAdminEditMode && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                      <button
                        onClick={() => {
                          setEditingItemType('feature');
                          setEditingItemData(feat);
                        }}
                        className="p-1.5 bg-white text-slate-700 hover:text-blue-600 rounded-lg border border-slate-200 shadow-xs"
                        title="Edit feature"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeFeature(feat.id)}
                        className="p-1.5 bg-white text-slate-700 hover:text-red-600 rounded-lg border border-slate-200 shadow-xs"
                        title="Delete feature"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                      {renderIcon(feat.icon, "w-6 h-6")}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-slate-200">
                      {feat.tag}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 font-serif">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {feat.description}
                  </p>
                  <div className="pt-2 text-xs font-bold text-blue-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Explore Suite</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>
      )}

      {/* ========================================================
          5. ABOUT & REGISTERED INSTITUTIONAL NETWORK
          ======================================================== */}
      {visibility.about && (
        <section id="about-section" className="py-16 sm:py-20 bg-slate-50 border-b border-slate-100 relative group">
          
          {isSuperAdminEditMode && (
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-slate-950 text-white px-3 py-1.5 rounded-xl border border-amber-400 text-xs font-bold">
              <span className="text-amber-400">About Section:</span>
              <button
                onClick={() => setActiveEditorSection('about')}
                className="px-2.5 py-1 bg-amber-400 text-slate-950 rounded text-[11px] font-black cursor-pointer"
              >
                Edit About Copy & Points
              </button>
              <button
                onClick={() => toggleSectionVisibility('about')}
                className="px-2 py-0.5 bg-slate-800 hover:bg-red-900 text-slate-300 rounded text-[11px] cursor-pointer"
              >
                Hide
              </button>
            </div>
          )}

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              <div className="space-y-4 text-left">
                <span className="text-xs font-black tracking-widest text-blue-700 uppercase bg-blue-100/70 px-3 py-1 rounded-full border border-blue-200">
                  {about.badge || 'ABOUT EDUSMART'}
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 font-serif tracking-tight">
                  {about.title}
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  {about.subtitle}
                </p>

                {about.paragraphs?.map((p, idx) => (
                  <p key={idx} className="text-xs text-slate-600 leading-relaxed">
                    {p}
                  </p>
                ))}

                <div className="space-y-2 pt-2">
                  {about.points?.map((pt, pidx) => (
                    <div key={pidx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>

                {/* Milestones */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                    <div className="text-2xl font-black text-blue-700 font-serif">{about.milestone1Value}</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">{about.milestone1Title}</div>
                    <div className="text-[11px] text-slate-500 mt-1">{about.milestone1Subtext}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                    <div className="text-2xl font-black text-emerald-700 font-serif">{about.milestone2Value}</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">{about.milestone2Title}</div>
                    <div className="text-[11px] text-slate-500 mt-1">{about.milestone2Subtext}</div>
                  </div>
                </div>
              </div>

              {/* School Campus Trust Showcase */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-5 text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 font-serif">
                      Registered Institutional Network
                    </h3>
                    <p className="text-xs text-slate-500">
                      Schools currently operating on EduSmart LMS multi-tenant infrastructure:
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200">
                    {allTenants.length} Campuses Active
                  </span>
                </div>

                <div className="space-y-3">
                  {allTenants.slice(0, 5).map((school) => (
                    <div key={school.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-lg shrink-0 border border-slate-300 flex items-center justify-center p-0.5 bg-white"
                        >
                          {school.logoUrl ? (
                            <img src={school.logoUrl} alt={school.name} className="w-full h-full object-contain" />
                          ) : (
                            <School className="w-4 h-4 text-slate-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">{school.name}</div>
                          <div className="text-[10px] text-slate-500">{school.city} · {school.motto || 'Excellence in Learning'}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        {school.code}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          6. TESTIMONIALS & REVIEWS SECTION
          ======================================================== */}
      {visibility.testimonials && (
        <section id="testimonials-section" className="py-16 sm:py-24 bg-white border-b border-slate-100 relative group">
          
          {isSuperAdminEditMode && (
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-slate-950 text-white px-3 py-1.5 rounded-xl border border-amber-400 text-xs font-bold">
              <span className="text-amber-400">Reviews:</span>
              <button
                onClick={() => {
                  setEditingItemType('testimonial');
                  setEditingItemData({
                    id: `test-${Date.now()}`,
                    quote: 'EduSmart has dramatically improved our institutional efficiency.',
                    author: 'Educator Name',
                    role: 'Principal / HOD',
                    school: 'School Name',
                    rating: 5
                  });
                }}
                className="px-2.5 py-1 bg-amber-400 text-slate-950 rounded text-[11px] font-black cursor-pointer"
              >
                + Add Review
              </button>
              <button
                onClick={() => toggleSectionVisibility('testimonials')}
                className="px-2 py-0.5 bg-slate-800 hover:bg-red-900 text-slate-300 rounded text-[11px] cursor-pointer"
              >
                Hide
              </button>
            </div>
          )}

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-black tracking-widest text-blue-700 uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                School Leadership Feedback
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 font-serif tracking-tight">
                Trusted by Leading Academies
              </h2>
              <p className="text-sm text-slate-600">
                Real feedback from administrators, teachers, and parents using EduSmart LMS daily.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((test) => (
                <div key={test.id} className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all text-left space-y-4 relative group/test">
                  {isSuperAdminEditMode && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
                      <button
                        onClick={() => {
                          setEditingItemType('testimonial');
                          setEditingItemData(test);
                        }}
                        className="p-1 bg-white text-slate-700 hover:text-blue-600 rounded border border-slate-200"
                        title="Edit testimonial"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeTestimonial(test.id)}
                        className="p-1 bg-white text-slate-700 hover:text-red-600 rounded border border-slate-200"
                        title="Delete testimonial"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* 5 Stars */}
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: test.rating || 5 }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>

                  <p className="text-xs text-slate-700 italic leading-relaxed">
                    "{test.quote}"
                  </p>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {test.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">{test.author}</div>
                      <div className="text-[10px] text-slate-500">{test.role} · {test.school}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>
      )}

      {/* ========================================================
          7. PRICING SECTION
          ======================================================== */}
      {visibility.pricing && (
        <section id="pricing-section" className="py-16 sm:py-24 bg-slate-50 border-b border-slate-100 relative group">
          
          {isSuperAdminEditMode && (
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-slate-950 text-white px-3 py-1.5 rounded-xl border border-amber-400 text-xs font-bold">
              <span className="text-amber-400">Pricing Section:</span>
              <button
                onClick={() => {
                  setEditingItemType('pricing');
                  setEditingItemData({
                    id: `plan-${Date.now()}`,
                    name: 'New Custom Tier',
                    price: 'KSh 45,000',
                    period: 'per term',
                    description: 'Description of the tier',
                    features: ['Attendance roll call', 'CBC gradebook', 'Parent portal'],
                    popular: false,
                    buttonLabel: 'Select Plan'
                  });
                }}
                className="px-2.5 py-1 bg-amber-400 text-slate-950 rounded text-[11px] font-black cursor-pointer"
              >
                + Add Plan Tier
              </button>
              <button
                onClick={() => toggleSectionVisibility('pricing')}
                className="px-2 py-0.5 bg-slate-800 hover:bg-red-900 text-slate-300 rounded text-[11px] cursor-pointer"
              >
                Hide
              </button>
            </div>
          )}

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-black tracking-widest text-blue-700 uppercase bg-blue-100/70 px-3 py-1 rounded-full border border-blue-200">
                Institutional Plans
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 font-serif tracking-tight">
                Transparent, Scalable Pricing
              </h2>
              <p className="text-sm text-slate-600">
                Tailored subscription tiers designed for single campuses and multi-branch educational groups.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {pricing.map((tier) => (
                <div 
                  key={tier.id}
                  className={`rounded-2xl p-6 sm:p-8 space-y-6 transition-all text-left relative ${
                    tier.popular
                      ? 'border-2 border-blue-600 shadow-xl bg-white'
                      : 'border border-slate-200 bg-white hover:shadow-lg'
                  }`}
                >
                  {isSuperAdminEditMode && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
                      <button
                        onClick={() => {
                          setEditingItemType('pricing');
                          setEditingItemData(tier);
                        }}
                        className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                        title="Edit plan"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removePricingTier(tier.id)}
                        className="p-1 bg-slate-100 hover:bg-red-100 text-red-600 rounded"
                        title="Delete plan"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {tier.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm">
                      {tier.badge}
                    </span>
                  )}
                  <div>
                    <h3 className="text-xl font-black text-slate-900 font-serif">{tier.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{tier.description}</p>
                  </div>
                  <div className="text-3xl font-black text-slate-900 font-serif">
                    {tier.price}<span className="text-xs font-normal text-slate-500"> / {tier.period}</span>
                  </div>
                  <ul className="space-y-2.5 text-xs text-slate-600">
                    {tier.features.map((feat, fidx) => (
                      <li key={fidx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => setShowRegisterModal(true)}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                      tier.popular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                        : 'border border-slate-300 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    {tier.buttonLabel || `Select ${tier.name}`}
                  </button>
                </div>
              ))}
            </div>

          </div>
        </section>
      )}

      {/* ========================================================
          8. FAQ ACCORDION SECTION
          ======================================================== */}
      {visibility.faq && (
        <section id="faq-section" className="py-16 sm:py-20 bg-white border-b border-slate-100 relative group">
          
          {isSuperAdminEditMode && (
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-slate-950 text-white px-3 py-1.5 rounded-xl border border-amber-400 text-xs font-bold">
              <span className="text-amber-400">FAQs:</span>
              <button
                onClick={() => {
                  setEditingItemType('faq');
                  setEditingItemData({
                    id: `faq-${Date.now()}`,
                    question: 'New Frequently Asked Question',
                    answer: 'Detailed helpful explanation for school clients and administrators.',
                    category: 'General'
                  });
                }}
                className="px-2.5 py-1 bg-amber-400 text-slate-950 rounded text-[11px] font-black cursor-pointer"
              >
                + Add FAQ Item
              </button>
              <button
                onClick={() => toggleSectionVisibility('faq')}
                className="px-2 py-0.5 bg-slate-800 hover:bg-red-900 text-slate-300 rounded text-[11px] cursor-pointer"
              >
                Hide
              </button>
            </div>
          )}

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-black tracking-widest text-blue-700 uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Common Inquiries
              </span>
              <h2 className="text-3xl font-black text-slate-900 font-serif">Frequently Asked Questions</h2>
              <p className="text-xs text-slate-500">Everything you need to know about our Kenyan CBC platform and institutional security.</p>
            </div>

            <div className="space-y-3 text-left">
              {faqs.map((faq) => {
                const isOpen = expandedFaqId === faq.id;
                return (
                  <div key={faq.id} className="border border-slate-200 rounded-2xl overflow-hidden transition-all bg-slate-50/50">
                    <div className="flex items-center justify-between p-4 bg-white cursor-pointer select-none" onClick={() => setExpandedFaqId(isOpen ? null : faq.id)}>
                      <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                        <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{faq.question}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSuperAdminEditMode && (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                setEditingItemType('faq');
                                setEditingItemData(faq);
                              }}
                              className="p-1 text-slate-400 hover:text-blue-600"
                              title="Edit FAQ"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => removeFaq(faq.id)}
                              className="p-1 text-slate-400 hover:text-red-600"
                              title="Delete FAQ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                      </div>
                    </div>
                    {isOpen && (
                      <div className="p-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          9. CONTACT SECTION
          ======================================================== */}
      {visibility.contact && (
        <section id="contact-section" className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200 relative group">
          
          {isSuperAdminEditMode && (
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-slate-950 text-white px-3 py-1.5 rounded-xl border border-amber-400 text-xs font-bold">
              <span className="text-amber-400">Contact Section:</span>
              <button
                onClick={() => setActiveEditorSection('contact')}
                className="px-2.5 py-1 bg-amber-400 text-slate-950 rounded text-[11px] font-black cursor-pointer"
              >
                Edit Contact Details
              </button>
              <button
                onClick={() => toggleSectionVisibility('contact')}
                className="px-2 py-0.5 bg-slate-800 hover:bg-red-900 text-slate-300 rounded text-[11px] cursor-pointer"
              >
                Hide
              </button>
            </div>
          )}

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200 text-left space-y-6">
              <div className="text-center space-y-2">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">{contact.sectionBadge}</span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-serif">{contact.sectionTitle}</h2>
                <p className="text-xs text-slate-500">{contact.sectionSubtitle}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <Phone className="w-5 h-5 text-blue-600 mx-auto mb-1.5" />
                  <div className="text-xs font-bold text-slate-900">Phone Hotline</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{contact.phone}</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <Mail className="w-5 h-5 text-blue-600 mx-auto mb-1.5" />
                  <div className="text-xs font-bold text-slate-900">Email Support</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{contact.email}</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <MapPin className="w-5 h-5 text-blue-600 mx-auto mb-1.5" />
                  <div className="text-xs font-bold text-slate-900">Headquarters</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{contact.address}</div>
                </div>
              </div>

              {contact.supportHours && (
                <div className="p-3 bg-blue-50 rounded-xl text-center text-xs text-blue-800 font-semibold border border-blue-100">
                  Hours: {contact.supportHours}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          10. FOOTER (WITH DISCREET PLATFORM ADMIN ACCESS)
          ======================================================== */}
      {visibility.footer && (
        <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs relative group">
          
          {isSuperAdminEditMode && (
            <div className="absolute top-2 right-4 z-20 flex items-center gap-2 bg-slate-950 text-white px-3 py-1 rounded-xl border border-amber-400 text-xs font-bold">
              <span className="text-amber-400">Footer:</span>
              <button
                onClick={() => setActiveEditorSection('footer')}
                className="px-2 py-0.5 bg-amber-400 text-slate-950 rounded text-[10px] font-bold cursor-pointer"
              >
                Edit Footer
              </button>
            </div>
          )}

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              
              <div className="flex items-center gap-3">
                <div className="bg-slate-800 p-2 rounded-xl border border-slate-700">
                  <EduSmartGadsaLogo variant="emblem" size="sm" />
                </div>
                <div className="text-left">
                  <span className="font-serif font-black text-white text-base block">
                    {footer.brandName || 'EduSmart LMS'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {footer.tagline}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 font-medium">
                {header.navLinks.filter(l => l.enabled).slice(0, 5).map(link => (
                  <button key={link.id} onClick={() => scrollToSection(link.sectionId, link.id)} className="hover:text-white transition-colors cursor-pointer">
                    {link.label}
                  </button>
                ))}
                <button onClick={onNavigateToLogin} className="hover:text-white font-bold text-blue-400 transition-colors cursor-pointer">
                  {header.loginButtonLabel}
                </button>
              </div>

            </div>

            <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
              <div>
                {footer.copyrightText} · {footer.developerCredit}
              </div>

              {/* Discrete Private Platform Login access as per the Navigation diagram */}
              <div className="flex items-center gap-4">
                <button
                  onClick={onNavigateToPlatformAdmin}
                  className="text-slate-500 hover:text-amber-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Private Platform Login (Platform Administrators Only)"
                >
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span>Platform Admin</span>
                </button>
                <span>·</span>
                <span className="text-slate-500">Secure · Reliable · Multi-Tenant</span>
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* ========================================================
          SLIDE-OVER / MODAL: SECTION QUICK CUSTOMIZER
          Enables Super Admin to edit, add, remove and customize every part
          ======================================================== */}
      {activeEditorSection && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl text-left max-h-[90vh] overflow-y-auto text-white">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/30">
                  <Edit3 className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-black text-white font-serif capitalize">
                    Customize {activeEditorSection.replace('-', ' ')}
                  </h3>
                  <p className="text-[11px] text-slate-400">Live adjustments update instantly on the landing page</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveEditorSection(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Section 1: HEADER & NAVBAR */}
            {activeEditorSection === 'header' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Brand Display Name</label>
                  <input
                    type="text"
                    value={header.brandName}
                    onChange={(e) => updateLandingHeader({ brandName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Subtitle / Badge</label>
                  <input
                    type="text"
                    value={header.brandSubtitle}
                    onChange={(e) => updateLandingHeader({ brandSubtitle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Login Button Label</label>
                    <input
                      type="text"
                      value={header.loginButtonLabel}
                      onChange={(e) => updateLandingHeader({ loginButtonLabel: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Register Button Label</label>
                    <input
                      type="text"
                      value={header.registerButtonLabel}
                      onChange={(e) => updateLandingHeader({ registerButtonLabel: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300">Navigation Bar Links</span>
                    <button
                      onClick={() => {
                        const lbl = prompt('Enter link label (e.g. Virtual Lab):');
                        if (lbl?.trim()) {
                          addNavLink({
                            id: `nav-${Date.now()}`,
                            label: lbl.trim(),
                            sectionId: 'features-section',
                            enabled: true
                          });
                        }
                      }}
                      className="text-amber-400 font-bold hover:underline text-[11px] flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Nav Link</span>
                    </button>
                  </div>

                  {header.navLinks.map((link) => (
                    <div key={link.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <input
                        type="checkbox"
                        checked={link.enabled}
                        onChange={(e) => updateNavLink(link.id, { enabled: e.target.checked })}
                        className="w-3.5 h-3.5 accent-amber-400"
                      />
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => updateNavLink(link.id, { label: e.target.value })}
                        className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white flex-1"
                      />
                      <input
                        type="text"
                        value={link.sectionId}
                        onChange={(e) => updateNavLink(link.id, { sectionId: e.target.value })}
                        className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-400 font-mono w-36"
                      />
                      <button
                        onClick={() => removeNavLink(link.id)}
                        className="p-1 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 2: HERO SECTION */}
            {activeEditorSection === 'hero' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Top Pill Tag Text</label>
                  <input
                    type="text"
                    value={hero.pillTag}
                    onChange={(e) => updateLandingHero({ pillTag: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Headline Part 1</label>
                    <input
                      type="text"
                      value={hero.headlineStart}
                      onChange={(e) => updateLandingHero({ headlineStart: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Headline Part 2</label>
                    <input
                      type="text"
                      value={hero.headlineMid}
                      onChange={(e) => updateLandingHero({ headlineMid: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-amber-400 mb-1">Highlight Text</label>
                    <input
                      type="text"
                      value={hero.headlineHighlight}
                      onChange={(e) => updateLandingHero({ headlineHighlight: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-amber-400/50 text-amber-300 font-bold rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Hero Subtitle</label>
                  <textarea
                    rows={3}
                    value={hero.subtitle}
                    onChange={(e) => updateLandingHero({ subtitle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Primary CTA Label</label>
                    <input
                      type="text"
                      value={hero.primaryCta}
                      onChange={(e) => updateLandingHero({ primaryCta: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Secondary CTA Label</label>
                    <input
                      type="text"
                      value={hero.secondaryCta}
                      onChange={(e) => updateLandingHero({ secondaryCta: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <label className="block font-bold text-slate-300">Hero Banner Photo URL</label>
                  <input
                    type="text"
                    value={hero.heroImageUrl}
                    onChange={(e) => updateLandingHero({ heroImageUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-300 font-mono"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 self-center">Presets:</span>
                    {HERO_IMAGE_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => updateLandingHero({ heroImageUrl: preset.url })}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          hero.heroImageUrl === preset.url
                            ? 'bg-amber-400 text-slate-950 border-amber-300'
                            : 'bg-slate-900 text-slate-300 border-slate-700'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-300">Floating Highlight Overlay Card</span>
                    <input
                      type="checkbox"
                      checked={hero.showFloatingCard}
                      onChange={(e) => updateLandingHero({ showFloatingCard: e.target.checked })}
                      className="w-4 h-4 accent-amber-400"
                    />
                  </div>
                  {hero.showFloatingCard && (
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={hero.floatingCardTitle}
                        onChange={(e) => updateLandingHero({ floatingCardTitle: e.target.value })}
                        className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                        placeholder="Card Title"
                      />
                      <input
                        type="text"
                        value={hero.floatingCardSubtitle}
                        onChange={(e) => updateLandingHero({ floatingCardSubtitle: e.target.value })}
                        className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                        placeholder="Card Subtitle"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Section 3: ABOUT US */}
            {activeEditorSection === 'about' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Badge Tag</label>
                    <input
                      type="text"
                      value={about.badge}
                      onChange={(e) => updateAbout({ badge: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Section Title</label>
                    <input
                      type="text"
                      value={about.title}
                      onChange={(e) => updateAbout({ title: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Subtitle / Mission</label>
                  <textarea
                    rows={2}
                    value={about.subtitle}
                    onChange={(e) => updateAbout({ subtitle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300">Pillar Bullet Points</span>
                    <button
                      onClick={() => updateAbout({ points: [...about.points, 'New key institutional milestone'] })}
                      className="text-amber-400 font-bold hover:underline text-[11px] flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Point</span>
                    </button>
                  </div>
                  {about.points.map((pt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={pt}
                        onChange={(e) => {
                          const updated = [...about.points];
                          updated[idx] = e.target.value;
                          updateAbout({ points: updated });
                        }}
                        className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                      />
                      <button
                        onClick={() => updateAbout({ points: about.points.filter((_, i) => i !== idx) })}
                        className="p-1 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-300">Milestone 1</label>
                    <input
                      type="text"
                      value={about.milestone1Value}
                      onChange={(e) => updateAbout({ milestone1Value: e.target.value })}
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-blue-400 font-mono font-bold"
                    />
                    <input
                      type="text"
                      value={about.milestone1Title}
                      onChange={(e) => updateAbout({ milestone1Title: e.target.value })}
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-300">Milestone 2</label>
                    <input
                      type="text"
                      value={about.milestone2Value}
                      onChange={(e) => updateAbout({ milestone2Value: e.target.value })}
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-emerald-400 font-mono font-bold"
                    />
                    <input
                      type="text"
                      value={about.milestone2Title}
                      onChange={(e) => updateAbout({ milestone2Title: e.target.value })}
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Section 4: CONTACT & SUPPORT */}
            {activeEditorSection === 'contact' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Section Title</label>
                  <input
                    type="text"
                    value={contact.sectionTitle}
                    onChange={(e) => updateContact({ sectionTitle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Phone Hotline</label>
                  <input
                    type="text"
                    value={contact.phone}
                    onChange={(e) => updateContact({ phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Email Support</label>
                  <input
                    type="text"
                    value={contact.email}
                    onChange={(e) => updateContact({ email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Headquarters Physical Address</label>
                  <input
                    type="text"
                    value={contact.address}
                    onChange={(e) => updateContact({ address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Operating Hours</label>
                  <input
                    type="text"
                    value={contact.supportHours}
                    onChange={(e) => updateContact({ supportHours: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>
            )}

            {/* Section 5: FOOTER */}
            {activeEditorSection === 'footer' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={footer.brandName}
                    onChange={(e) => updateFooter({ brandName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Tagline</label>
                  <input
                    type="text"
                    value={footer.tagline}
                    onChange={(e) => updateFooter({ tagline: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Copyright Line</label>
                  <input
                    type="text"
                    value={footer.copyrightText}
                    onChange={(e) => updateFooter({ copyrightText: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Developer / Engineering Credit</label>
                  <input
                    type="text"
                    value={footer.developerCredit}
                    onChange={(e) => updateFooter({ developerCredit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>
            )}

            {/* Section 6: VISIBILITY MANAGER */}
            {activeEditorSection === 'visibility' && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-400">Toggle any section on or off on the Public Landing Page:</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {(Object.keys(visibility) as Array<keyof LandingSectionsVisibility>).map((secKey) => (
                    <label key={secKey} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700">
                      <span className="font-bold capitalize text-slate-200">{secKey} Section</span>
                      <input
                        type="checkbox"
                        checked={visibility[secKey]}
                        onChange={() => toggleSectionVisibility(secKey)}
                        className="w-4 h-4 accent-amber-400"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setActiveEditorSection(null)}
                className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-md"
              >
                Done Customizing
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: EDIT OR ADD SPECIFIC ITEM (Feature, Stat, Testimonial, FAQ, Plan)
          ======================================================== */}
      {editingItemType && editingItemData && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-left text-white text-xs">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider font-mono">
                {editingItemType.toUpperCase()} Item Editor
              </h3>
              <button onClick={() => { setEditingItemType(null); setEditingItemData(null); }} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Editing Feature */}
            {editingItemType === 'feature' && (
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Feature Title</label>
                  <input
                    type="text"
                    value={editingItemData.title}
                    onChange={(e) => setEditingItemData({ ...editingItemData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={editingItemData.tag}
                    onChange={(e) => setEditingItemData({ ...editingItemData, tag: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={editingItemData.description}
                    onChange={(e) => setEditingItemData({ ...editingItemData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Category</label>
                    <input
                      type="text"
                      value={editingItemData.category}
                      onChange={(e) => setEditingItemData({ ...editingItemData, category: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Icon</label>
                    <select
                      value={editingItemData.icon}
                      onChange={(e) => setEditingItemData({ ...editingItemData, icon: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    >
                      {AVAILABLE_ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Editing Stat */}
            {editingItemType === 'stat' && (
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Metric Number / Value</label>
                  <input
                    type="text"
                    value={editingItemData.value}
                    onChange={(e) => setEditingItemData({ ...editingItemData, value: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Metric Label</label>
                  <input
                    type="text"
                    value={editingItemData.label}
                    onChange={(e) => setEditingItemData({ ...editingItemData, label: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Subtext</label>
                  <input
                    type="text"
                    value={editingItemData.subtext}
                    onChange={(e) => setEditingItemData({ ...editingItemData, subtext: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Icon</label>
                  <select
                    value={editingItemData.icon}
                    onChange={(e) => setEditingItemData({ ...editingItemData, icon: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    {AVAILABLE_ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Editing Testimonial */}
            {editingItemType === 'testimonial' && (
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Quote</label>
                  <textarea
                    rows={3}
                    value={editingItemData.quote}
                    onChange={(e) => setEditingItemData({ ...editingItemData, quote: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Author Name</label>
                    <input
                      type="text"
                      value={editingItemData.author}
                      onChange={(e) => setEditingItemData({ ...editingItemData, author: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Role / Designation</label>
                    <input
                      type="text"
                      value={editingItemData.role}
                      onChange={(e) => setEditingItemData({ ...editingItemData, role: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">School Campus</label>
                  <input
                    type="text"
                    value={editingItemData.school}
                    onChange={(e) => setEditingItemData({ ...editingItemData, school: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>
            )}

            {/* Editing FAQ */}
            {editingItemType === 'faq' && (
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Question</label>
                  <input
                    type="text"
                    value={editingItemData.question}
                    onChange={(e) => setEditingItemData({ ...editingItemData, question: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Answer</label>
                  <textarea
                    rows={4}
                    value={editingItemData.answer}
                    onChange={(e) => setEditingItemData({ ...editingItemData, answer: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>
            )}

            {/* Editing Pricing */}
            {editingItemType === 'pricing' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Plan Name</label>
                    <input
                      type="text"
                      value={editingItemData.name}
                      onChange={(e) => setEditingItemData({ ...editingItemData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Badge (Optional)</label>
                    <input
                      type="text"
                      value={editingItemData.badge || ''}
                      onChange={(e) => setEditingItemData({ ...editingItemData, badge: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Price</label>
                    <input
                      type="text"
                      value={editingItemData.price}
                      onChange={(e) => setEditingItemData({ ...editingItemData, price: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Period</label>
                    <input
                      type="text"
                      value={editingItemData.period}
                      onChange={(e) => setEditingItemData({ ...editingItemData, period: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Description</label>
                  <input
                    type="text"
                    value={editingItemData.description}
                    onChange={(e) => setEditingItemData({ ...editingItemData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => { setEditingItemType(null); setEditingItemData(null); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (editingItemType === 'feature') {
                    if (features.some(f => f.id === editingItemData.id)) {
                      updateFeature(editingItemData.id, editingItemData);
                    } else {
                      addFeature(editingItemData);
                    }
                  } else if (editingItemType === 'stat') {
                    if (stats.some(s => s.id === editingItemData.id)) {
                      updateStat(editingItemData.id, editingItemData);
                    } else {
                      addStat(editingItemData);
                    }
                  } else if (editingItemType === 'testimonial') {
                    if (testimonials.some(t => t.id === editingItemData.id)) {
                      updateTestimonial(editingItemData.id, editingItemData);
                    } else {
                      addTestimonial(editingItemData);
                    }
                  } else if (editingItemType === 'faq') {
                    if (faqs.some(f => f.id === editingItemData.id)) {
                      updateFaq(editingItemData.id, editingItemData);
                    } else {
                      addFaq(editingItemData);
                    }
                  } else if (editingItemType === 'pricing') {
                    if (pricing.some(p => p.id === editingItemData.id)) {
                      updatePricingTier(editingItemData.id, editingItemData);
                    } else {
                      addPricingTier(editingItemData);
                    }
                  }
                  setEditingItemType(null);
                  setEditingItemData(null);
                }}
                className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl cursor-pointer"
              >
                Save Changes
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          REGISTER A SCHOOL MODAL
          ======================================================== */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 font-serif">Register a New School</h3>
                <p className="text-xs text-slate-500">Deploy a dedicated tenant instance for your institution</p>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-left text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">School Official Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. St. Jude Academy"
                  value={regForm.schoolName}
                  onChange={(e) => setRegForm({ ...regForm, schoolName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">County</label>
                  <input
                    type="text"
                    required
                    value={regForm.county}
                    onChange={(e) => setRegForm({ ...regForm, county: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Learner Population</label>
                  <input
                    type="number"
                    required
                    value={regForm.estimatedStudents}
                    onChange={(e) => setRegForm({ ...regForm, estimatedStudents: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Administrator Official Email</label>
                <input
                  type="email"
                  required
                  placeholder="admin@yourschool.ac.ke"
                  value={regForm.adminEmail}
                  onChange={(e) => setRegForm({ ...regForm, adminEmail: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Contact Phone</label>
                <input
                  type="tel"
                  required
                  placeholder="+254 700 000 000"
                  value={regForm.phone}
                  onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={regSuccess}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm cursor-pointer"
                >
                  {regSuccess ? 'Submitting Application...' : 'Submit School Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
