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
  KeyRound,
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
  MessageSquare,
  Rocket,
  Handshake,
  Video,
  Film,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  Upload,
  AlertTriangle,
  Save,
  FlaskConical,
  Ticket
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
import { listHeroVideoPresets, listHeroImagePresets } from '../../utils/heroPresets';
import { HeroBannerMedia } from '../common/HeroBannerMedia';
import { PublicVirtualLabSection } from './PublicVirtualLabSection';
import { VirtualLabSubscriptionModal, SubscriptionTier } from '../virtuallab/VirtualLabSubscriptionModal';

interface PublicLandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToPlatformAdmin: () => void;
  onOpenRegisterSchool?: () => void;
}


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
  const [isSuperAdminVerified, setIsSuperAdminVerified] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('edusmart_super_admin_verified') === 'true';
    } catch {
      return false;
    }
  });
  const [showSuperAdminAuthModal, setShowSuperAdminAuthModal] = useState<boolean>(false);
  const [adminPasscode, setAdminPasscode] = useState<string>('');
  const [showPasscodeText, setShowPasscodeText] = useState<boolean>(false);
  const [adminEmailInput, setAdminEmailInput] = useState<string>('admin@edusmart.ac.ke');
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  const [pendingActionAfterAuth, setPendingActionAfterAuth] = useState<'toggle_edit' | 'hero_edit' | null>(null);

  const requestSuperAdminAccess = (action: 'toggle_edit' | 'hero_edit' = 'toggle_edit') => {
    if (isSuperAdminVerified) {
      if (action === 'toggle_edit') {
        setIsSuperAdminEditMode(prev => !prev);
      } else if (action === 'hero_edit') {
        setIsSuperAdminEditMode(true);
        setActiveEditorSection('hero');
      }
    } else {
      setPendingActionAfterAuth(action);
      setAdminAuthError(null);
      setAdminPasscode('');
      setShowSuperAdminAuthModal(true);
    }
  };

  const handleVerifySuperAdmin = (e?: React.FormEvent) => {
    e?.preventDefault();
    setAdminAuthError(null);
    const code = adminPasscode.trim();

    // Accepted Super Admin passcodes: 'admin2026', 'superadmin2026', 'gadsa2026'
    if (code === 'admin2026' || code === 'superadmin2026' || code === 'gadsa2026') {
      try {
        sessionStorage.setItem('edusmart_super_admin_verified', 'true');
      } catch {}
      setIsSuperAdminVerified(true);
      setIsSuperAdminEditMode(true);
      setShowSuperAdminAuthModal(false);
      setAdminPasscode('');

      if (pendingActionAfterAuth === 'hero_edit') {
        setActiveEditorSection('hero');
      }

      setToastMessage('🛡️ Super Admin verified! Hero banner customization is now active.');
      setTimeout(() => setToastMessage(null), 3500);
    } else {
      setAdminAuthError('Invalid passcode. Customization of the hero banner can only be done by Super Admin.');
    }
  };

  const handleLockSuperAdmin = () => {
    try {
      sessionStorage.removeItem('edusmart_super_admin_verified');
    } catch {}
    setIsSuperAdminVerified(false);
    setIsSuperAdminEditMode(false);
    setActiveEditorSection(null);
    setToastMessage('Super Admin mode locked.');
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Public Virtual Lab Modal & Ticketing State
  const [showVirtualLabModal, setShowVirtualLabModal] = useState<boolean>(false);
  const [virtualLabInitialTier, setVirtualLabInitialTier] = useState<SubscriptionTier>('term');
  const [virtualLabInitialStep, setVirtualLabInitialStep] = useState<'select' | 'checkout' | 'ticket' | 'launch_lab' | 'enter_ticket'>('select');
  const [virtualLabTicketCode, setVirtualLabTicketCode] = useState<string>('');

  // Active Public Subscription status tracking
  const [activePublicTicket, setActivePublicTicket] = useState<string>(() => {
    try {
      const active = localStorage.getItem('edusmart_public_active_ticket');
      if (active) return active;
      const raw = localStorage.getItem('edusmart_vlab_ticket_passes');
      if (raw) {
        const passes = JSON.parse(raw);
        if (Array.isArray(passes) && passes.length > 0) {
          return passes[0].ticketId || '';
        }
      }
      return '';
    } catch {
      return '';
    }
  });

  const hasActivePublicSubscription = Boolean(activePublicTicket);

  const handleOpenVirtualLabTicket = (
    tier: SubscriptionTier = 'term', 
    step: 'select' | 'checkout' | 'enter_ticket' | 'launch_lab' = 'select', 
    ticketCode: string = ''
  ) => {
    setVirtualLabInitialTier(tier);
    setVirtualLabInitialStep(step);
    setVirtualLabTicketCode(ticketCode);
    setShowVirtualLabModal(true);
  };

  const handleAccessSmartClassroom = () => {
    if (hasActivePublicSubscription && activePublicTicket) {
      handleOpenVirtualLabTicket('term', 'launch_lab', activePublicTicket);
    } else {
      handleOpenVirtualLabTicket('term', 'select');
    }
  };

  const [isControlPanelOpen, setIsControlPanelOpen] = useState(false);
  const [activeEditorSection, setActiveEditorSection] = useState<string | null>(null);
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(faqs[0]?.id || null);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Registration modal state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [studentEstimatorCount, setStudentEstimatorCount] = useState<number>(450);
  const [regForm, setRegForm] = useState({
    schoolName: '',
    county: 'Nairobi County',
    curriculum: 'Kenyan CBC Curriculum',
    adminEmail: '',
    phone: '',
    estimatedStudents: '450',
    selectedPlanId: 'plan-standard'
  });
  const [regSuccess, setRegSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  const [videoUploadError, setVideoUploadError] = useState<string | null>(null);
  const [isVideoUploading, setIsVideoUploading] = useState<boolean>(false);

  const handleHeroVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isSuperAdminVerified) {
      requestSuperAdminAccess('hero_edit');
      return;
    }
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
          `Selected video is ${Math.round(videoDuration)} seconds long. Maximum permitted showcase length is 30 seconds.`
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
        setToastMessage(`30s Hero video uploaded successfully by Super Admin (${Math.round(videoDuration)}s)`);
        setTimeout(() => setToastMessage(null), 3500);
      };
      reader.onerror = () => {
        setVideoUploadError('Failed to read video file.');
        setIsVideoUploading(false);
      };
      reader.readAsDataURL(file);
    };

    tempVideo.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setVideoUploadError('Could not process video format. Please choose an MP4 or WebM video file.');
      setIsVideoUploading(false);
    };
  };

  const handleHeroImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isSuperAdminVerified) {
      requestSuperAdminAccess('hero_edit');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setToastMessage('Please upload an image smaller than 5MB');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const base64 = loadEvt.target?.result as string;
      updateLandingHero({
        mediaType: 'image',
        heroImageUrl: base64
      });
      setToastMessage('Hero banner image updated successfully by Super Admin!');
      setTimeout(() => setToastMessage(null), 3000);
    };
    reader.readAsDataURL(file);
  };

  // Quick Inline Add Modals
  const [newTrustBadgeInput, setNewTrustBadgeInput] = useState('');
  const [editingItemType, setEditingItemType] = useState<'feature' | 'stat' | 'testimonial' | 'faq' | 'pricing' | null>(null);
  const [editingItemData, setEditingItemData] = useState<any>(null);

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegSuccess(true);
    const chosenPlan = pricing.find(p => p.id === regForm.selectedPlanId) || pricing[0];
    setTimeout(() => {
      setRegSuccess(false);
      setShowRegisterModal(false);
      setToastMessage(`Registration request for "${regForm.schoolName}" with ${chosenPlan?.name || 'Selected'} Package (${chosenPlan?.price || ''}) submitted successfully! Our onboarding team will contact ${regForm.adminEmail} within 2 hours.`);
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

  const handlePrimaryCtaClick = () => {
    const action = hero.primaryCtaAction || 'login';
    if (action === 'login') {
      onNavigateToLogin();
    } else if (action === 'portals') {
      onNavigateToLogin();
    } else if (action === 'register') {
      setShowRegisterModal(true);
    } else if (action === 'demo') {
      setShowRegisterModal(true);
    } else if (action === 'contact') {
      const el = document.getElementById('contact-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      else onNavigateToLogin();
    } else if (action === 'custom' && hero.primaryCtaUrl) {
      if (hero.primaryCtaUrl.startsWith('#')) {
        document.querySelector(hero.primaryCtaUrl)?.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.href = hero.primaryCtaUrl;
      }
    } else {
      onNavigateToLogin();
    }
  };

  const handleSecondaryCtaClick = () => {
    const action = hero.secondaryCtaAction || 'register';
    if (action === 'register') {
      setShowRegisterModal(true);
    } else if (action === 'login') {
      onNavigateToLogin();
    } else if (action === 'portals') {
      onNavigateToLogin();
    } else if (action === 'contact') {
      const el = document.getElementById('contact-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      else setShowRegisterModal(true);
    } else if (action === 'demo') {
      setShowRegisterModal(true);
    } else if (action === 'custom' && hero.secondaryCtaUrl) {
      if (hero.secondaryCtaUrl.startsWith('#')) {
        document.querySelector(hero.secondaryCtaUrl)?.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.href = hero.secondaryCtaUrl;
      }
    } else {
      setShowRegisterModal(true);
    }
  };

  const activeFeatures = features.filter(f => f.enabled);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white relative">
      
      {/* ========================================================
          LANDING PAGE ADMIN TOOLS
          Full control for Super Admin to edit, add, remove, customize every part
          ======================================================== */}
      <div className="fixed top-20 right-4 z-50">
        <button
          type="button"
          onClick={() => setIsControlPanelOpen(!isControlPanelOpen)}
          aria-expanded={isControlPanelOpen}
          aria-controls="landing-control-panel"
          aria-label={isControlPanelOpen ? 'Close platform tools' : 'Open platform tools'}
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3 py-2 text-xs font-bold text-slate-600 shadow-lg shadow-slate-900/10 backdrop-blur transition hover:border-blue-200 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Platform tools</span>
          {isControlPanelOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {isControlPanelOpen && (
          <div id="landing-control-panel" className="absolute right-0 top-full mt-3 w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-slate-700 bg-slate-950 p-4 text-slate-100 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <span className={`h-2 w-2 rounded-full ${isSuperAdminEditMode ? 'bg-amber-400' : 'bg-slate-500'}`} />
                  Landing page tools
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {isSuperAdminEditMode ? 'Live editing is active.' : 'Manage the landing page or open the admin console.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsControlPanelOpen(false)}
                aria-label="Close platform tools"
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
            
            {/* Toggle Live Edit Mode - Super Admin Access Required */}
            <div className="space-y-1.5">
              <button
                onClick={() => requestSuperAdminAccess('toggle_edit')}
                className={`w-full justify-center px-3 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                  isSuperAdminEditMode
                    ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 ring-2 ring-amber-300'
                    : 'bg-slate-800 text-amber-300 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>{isSuperAdminEditMode ? 'Super Admin Edit: ON' : 'Super Admin Live Edit'}</span>
              </button>
              {isSuperAdminVerified && (
                <button
                  type="button"
                  onClick={handleLockSuperAdmin}
                  className="w-full text-center text-[10px] text-slate-400 hover:text-red-400 cursor-pointer pt-0.5"
                >
                  Lock Super Admin Session
                </button>
              )}
            </div>

            {/* Quick Section Selector Drawer */}
            <select
              value={activeEditorSection || ''}
              onChange={(e) => {
                const target = e.target.value || null;
                if (target === 'hero' && !isSuperAdminVerified) {
                  requestSuperAdminAccess('hero_edit');
                } else {
                  setActiveEditorSection(target);
                }
              }}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="">Quick Customize Section...</option>
              <option value="header">Header & Navbar</option>
              <option value="hero">Hero Section</option>
              <option value="stats">Impact & Metrics</option>
              <option value="features">Core Features</option>
              <option value="virtuallab">Virtual Lab Portal</option>
              <option value="about">About & Mission</option>
              <option value="testimonials">Testimonials & Reviews</option>
              <option value="pricing">Pricing Tiers</option>
              <option value="faqs">FAQ Accordion</option>
              <option value="contact">Contact & Support</option>
              <option value="footer">Footer & Copyright</option>
              <option value="visibility">Section Visibility Manager</option>
            </select>

            {/* Platform Admin Console Link */}
            <div className="flex items-center gap-2">
              <button
                onClick={onNavigateToPlatformAdmin}
                className="flex-1 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Open full Super Admin Management Console"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin Console</span>
              </button>

            {/* Reset to Defaults */}
            <div className="relative">
              <button
                onClick={() => setShowResetConfirm(true)}
                className="p-2.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
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
          )}
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
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-sm relative group">
          
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

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[76px] flex items-center justify-between">
            
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="bg-white p-1 rounded-2xl border border-slate-200/90 shadow-md flex items-center justify-center shrink-0">
                <img 
                  src="/assets/aistudio/WhatsApp_Image_2026-10-22_at_12.24.43_41514bbb.jpeg" 
                  alt="Edu-Smart PORTAL By Gadsa Systems" 
                  className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/edusmart-portal-logo.jpeg';
                  }}
                />
              </div>
              <div>
                <span className="font-sans font-black text-lg sm:text-xl tracking-tight text-slate-950 block leading-tight">
                  <span className="text-[#0B3075]">Edu-</span><span className="text-[#F5A623]">Smart</span> <span className="text-[#0B3075] text-xs sm:text-sm uppercase tracking-wider font-extrabold ml-1">PORTAL</span>
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.1em] text-slate-500 uppercase block mt-0.5">
                  By Gadsa Systems · Multi-Tenant LMS
                </span>
              </div>
            </div>

            {/* Desktop Nav Links (Dynamic from config) */}
            <nav aria-label="Main navigation" className="hidden xl:flex items-center gap-6 text-[13px] font-semibold text-slate-600">
              {header.navLinks.filter(link => link.enabled).map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.sectionId, link.id)}
                  className={`relative py-2 transition-colors cursor-pointer after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:origin-left after:rounded-full after:bg-blue-600 after:transition-transform ${
                    activeTab === link.id ? 'text-blue-700 after:scale-x-100' : 'hover:text-blue-700 after:scale-x-0 hover:after:scale-x-100'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </nav>

            {/* Header Action Button: [ Virtual Lab Pass | School Login ] */}
            <div className="hidden xl:flex items-center gap-3">
              <button
                onClick={() => handleOpenVirtualLabTicket('term', 'select')}
                className="px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-900/10 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                title="Access Public Virtual STEM Laboratory via Ticketing"
              >
                <FlaskConical className="w-4 h-4 text-emerald-200" />
                <span>Virtual Lab Pass</span>
                <span className="text-[10px] bg-white/20 text-white font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">Public</span>
              </button>

              {header.showRegisterButton && (
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  {header.registerButtonLabel}
                </button>
              )}

              {header.showLoginButton && (
                <button
                  onClick={onNavigateToLogin}
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-900/15 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <span>{header.loginButtonLabel}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <div className="flex xl:hidden items-center gap-2">
              <button
                onClick={() => handleOpenVirtualLabTicket('term', 'select')}
                className="px-2.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-sm"
                title="Virtual Lab"
              >
                <FlaskConical className="w-3.5 h-3.5 text-emerald-100" />
                <span>Lab Pass</span>
              </button>
              <button
                onClick={onNavigateToLogin}
                className="px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-lg shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                {header.loginButtonLabel}
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={mobileMenuOpen}
                className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>

          {/* Mobile Navigation Drawer */}
          {mobileMenuOpen && (
            <div className="xl:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-5 space-y-3 shadow-lg">
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
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleOpenVirtualLabTicket('term', 'select');
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm rounded-xl text-center flex items-center justify-center gap-2 shadow-sm"
                >
                  <FlaskConical className="w-4 h-4 text-emerald-200" />
                  <span>Public Virtual Lab & Tickets</span>
                </button>
                <button
                  onClick={onNavigateToLogin}
                  className="w-full py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl text-center"
                >
                  {header.loginButtonLabel}
                </button>
                {header.showRegisterButton && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowRegisterModal(true);
                    }}
                    className="w-full py-2.5 bg-slate-100 text-slate-800 font-bold text-sm rounded-xl text-center"
                  >
                    {header.registerButtonLabel}
                  </button>
                )}
              </div>
            </div>
          )}
        </header>
      )}

      {/* ========================================================
          2. HERO SECTION (FULLY CUSTOMIZABLE)
          ======================================================== */}
      {visibility.hero && (
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/70 pt-14 pb-16 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-28 border-b border-slate-100 group">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 right-[-8%] h-[30rem] w-[30rem] rounded-full bg-blue-200/35 blur-3xl" />
            <div className="absolute -bottom-48 left-[20%] h-80 w-80 rounded-full bg-cyan-100/50 blur-3xl" />
          </div>
          
          {/* In-Context Hero Toolbar - Strictly Super Admin Only */}
          {isSuperAdminEditMode && (
            <div className="absolute top-2 right-4 z-20 flex items-center gap-2 bg-slate-950 text-white px-3 py-1.5 rounded-xl border border-amber-400 shadow-xl text-xs font-bold">
              <span className="text-amber-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Super Admin Hero Control:</span>
              </span>
              <button
                onClick={() => requestSuperAdminAccess('hero_edit')}
                className="px-2 py-0.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded text-[11px] font-black cursor-pointer"
              >
                Customize Hero Image & Copy
              </button>
              <button
                onClick={() => toggleSectionVisibility('hero')}
                className="px-2 py-0.5 bg-slate-800 hover:bg-red-900 text-slate-300 hover:text-white rounded text-[11px] cursor-pointer"
              >
                Hide Section
              </button>
            </div>
          )}

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              
              {/* Left Hero Content */}
              <div className="lg:col-span-7 space-y-7 text-left">
                
                {/* Category Pill Tag */}
                {hero.pillTag && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-blue-100 text-blue-800 text-[11px] font-extrabold tracking-[0.14em] uppercase shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
                    <span>{hero.pillTag}</span>
                  </div>
                )}

                {/* Main Headline */}
                <h1 className="text-[2.7rem] sm:text-6xl xl:text-7xl font-extrabold text-slate-950 tracking-[-0.055em] leading-[1.02]">
                  <span className="block">{hero.headlineStart}</span>
                  <span className="block">{hero.headlineMid}</span>
                  <span className="block bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600 bg-clip-text text-transparent">{hero.headlineHighlight}</span>
                </h1>

                {/* Subtitle */}
                <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-8">
                  {hero.subtitle}
                </p>

                {/* CTA Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    onClick={handlePrimaryCtaClick}
                    className="px-6 py-3.5 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-900/20 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  >
                    <Users className="w-4 h-4" />
                    <span>{hero.primaryCta}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleSecondaryCtaClick}
                    className="px-6 py-3.5 bg-white/90 hover:bg-white text-slate-800 font-bold text-sm rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  >
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>{hero.secondaryCta}</span>
                  </button>
                </div>

                {/* Trust Indicators / Badges (Add / Remove supported) */}
                <div className="pt-5 border-t border-slate-200/80 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-slate-600 font-semibold">
                  {hero.trustBadges?.map((badge, idx) => (
                    <div key={idx} className="flex items-center gap-2 relative group/badge">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
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
                <div className="relative mx-auto max-w-lg lg:max-w-none">
                  
                  {/* Decorative glow backing */}
                  <div className="absolute -inset-3 bg-gradient-to-br from-blue-500/35 via-cyan-400/25 to-emerald-300/30 rounded-[2rem] blur-2xl opacity-80 transform -rotate-2" />

                  {/* Main Hero Banner: High-Res Image or 30-sec Video Showcase */}
                  <HeroBannerMedia
                    mediaType={hero.mediaType || 'image'}
                    imageUrl={hero.heroImageUrl || "/assets/aistudio/WhatsApp_Image_2026-10-22_at_13.45.08_2f8393b6.jpeg"}
                    videoUrl={hero.heroVideoUrl}
                    posterUrl={hero.heroVideoPoster || hero.heroImageUrl || "/assets/aistudio/WhatsApp_Image_2026-10-22_at_13.45.08_2f8393b6.jpeg"}
                    videoBadgeLabel={hero.videoBadgeLabel}
                    videoAutoplay={hero.videoAutoplay}
                    videoMuted={hero.videoMuted}
                    videoLoop={hero.videoLoop}
                    videoShowControls={hero.videoShowControls}
                    maxDurationSeconds={hero.videoMaxDuration || 30}
                    floatingCardTitle={hero.floatingCardTitle || 'Interactive Smart Classroom'}
                    floatingCardSubtitle={hero.floatingCardSubtitle || 'Mr. Gadaffih & CBC learners connected in real time'}
                    floatingCardBadgeText={hero.floatingCardBadgeText || 'LIVE SYNC'}
                    floatingCardBadgeColor={hero.floatingCardBadgeColor || 'emerald'}
                    showFloatingCard={hero.showFloatingCard}
                    isSuperAdminEditMode={isSuperAdminEditMode}
                    onEditClick={() => requestSuperAdminAccess('hero_edit')}
                    onImageChange={(newUrl) => {
                      if (!isSuperAdminVerified) {
                        requestSuperAdminAccess('hero_edit');
                        return;
                      }
                      updateLandingHero({ heroImageUrl: newUrl, mediaType: 'image' });
                    }}
                    altText="EduSmart Learners & School Campus"
                  />

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
        <section id="stats-section" className="py-10 sm:py-12 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white border-b border-slate-800 relative group">
          
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
                <div key={st.id} className="text-left space-y-1.5 p-4 sm:p-5 bg-white/[0.04] rounded-2xl border border-white/10 relative group/stat">
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

                  <div className="text-cyan-300 mb-2">{renderIcon(st.icon, "w-5 h-5")}</div>
                  <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{st.value}</div>
                  <div className="text-sm font-bold text-slate-100">{st.label}</div>
                  <div className="text-xs leading-relaxed text-slate-400">{st.subtext}</div>
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
        <section id="features-section" className="py-16 sm:py-24 bg-slate-50/70 border-b border-slate-100 relative group">
          
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
              <span className="text-[11px] font-extrabold tracking-[0.14em] text-blue-700 uppercase bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                Institutional Capabilities
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                Core Pillars Designed for Institutional Excellence
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-7">
                Everything required to operate modern CBC learning environments, track mastery, communicate with parents, and manage campus operations.
              </p>
            </div>

            {/* Dynamic Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeFeatures.map((feat) => (
                <div 
                  key={feat.id} 
                  className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-900/5 hover:-translate-y-1 transition-all duration-200 space-y-5 group text-left relative"
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
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                      {renderIcon(feat.icon, "w-6 h-6")}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
                      {feat.tag}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-6">
                    {feat.description}
                  </p>
                  <div className="pt-1 text-xs font-bold text-blue-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
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
          4B. PUBLIC VIRTUAL LABORATORY PORTAL (ACCESSIBLE VIA TICKETING)
          ======================================================== */}
      {visibility.virtuallab !== false && (
        <PublicVirtualLabSection 
          onOpenTicketModal={handleOpenVirtualLabTicket}
          isSuperAdminEditMode={isSuperAdminEditMode}
        />
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
          7. OUR PACKAGES & PRICING SECTION (SYNCED WITH MARKETING BROCHURE)
          ======================================================== */}
      {visibility.pricing && (
        <section id="pricing-section" className="py-16 sm:py-24 bg-gradient-to-b from-slate-50 via-white to-slate-50 border-b border-slate-200 relative group">
          
          {isSuperAdminEditMode && (
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-slate-950 text-white px-3 py-1.5 rounded-xl border border-amber-400 text-xs font-bold shadow-xl">
              <span className="text-amber-400">Packages Control:</span>
              <button
                onClick={() => {
                  setEditingItemType('pricing');
                  setEditingItemData({
                    id: `plan-${Date.now()}`,
                    name: 'CUSTOM TIER',
                    capacity: 'Up to 1,000 Students',
                    price: 'KSh 150,000',
                    period: 'per year',
                    perStudent: '≈ KSh 150 per student',
                    description: 'Custom tailored plan for specialized institutions.',
                    color: '#2563eb',
                    features: ['All Powerful Portals', 'CBC Continuous Assessment', 'Parent Portal & SMS', 'Email Support'],
                    popular: false,
                    buttonLabel: 'Select Plan'
                  });
                }}
                className="px-2.5 py-1 bg-amber-400 text-slate-950 rounded text-[11px] font-black cursor-pointer"
              >
                + Add Package Tier
              </button>
              <button
                onClick={() => toggleSectionVisibility('pricing')}
                className="px-2 py-0.5 bg-slate-800 hover:bg-red-900 text-slate-300 rounded text-[11px] cursor-pointer"
              >
                Hide
              </button>
            </div>
          )}

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            
            {/* Header with distinctive 'Our Packages' Banner */}
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <div className="inline-block">
                <div className="bg-[#0284c7] text-white font-serif font-black px-7 py-2 rounded-xl shadow-md text-lg sm:text-xl tracking-wider uppercase flex items-center justify-center gap-2">
                  <Award className="w-5 h-5 text-amber-300" />
                  <span>Our Packages</span>
                </div>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 font-serif tracking-tight">
                One Platform. Every School. <span className="text-[#0284c7]">Endless Possibilities.</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
                EduSmart LMS is a complete school management system designed to simplify learning, communication and administration — all in one place.
              </p>
            </div>

            {/* ========================================================
                EASY PLAN SELECTION & CATEGORY NAVIGATOR
                ======================================================== */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-blue-950 rounded-3xl p-5 sm:p-7 border border-slate-800 shadow-2xl space-y-5 text-white">
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="space-y-1 text-left">
                  <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Instant Category Plan Selector</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black font-serif tracking-tight text-white">
                    Choose Your Ideal School Category
                  </h3>
                  <p className="text-xs text-slate-300 max-w-xl">
                    Every school tier is calibrated to pupil capacity and operational scale. Select your student bracket below for instant match.
                  </p>
                </div>

                {/* Quick Population Presets */}
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 p-2 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-1">
                    Student Size:
                  </span>
                  {[
                    { label: '≤300', count: 250, id: 'plan-starter' },
                    { label: '301–600', count: 500, id: 'plan-standard' },
                    { label: '601–1,200', count: 1000, id: 'plan-professional' },
                    { label: '1,201–2,000', count: 1800, id: 'plan-premium' },
                    { label: '2,001–3,000', count: 2800, id: 'plan-enterprise' },
                    { label: '3,001–5,000+', count: 4200, id: 'plan-enterprise-plus' }
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategoryFilter(preset.id);
                        setStudentEstimatorCount(preset.count);
                      }}
                      className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        selectedCategoryFilter === preset.id
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40 ring-1 ring-blue-400'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                  {selectedCategoryFilter !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryFilter('all')}
                      className="px-2 py-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 rounded-xl transition-colors cursor-pointer"
                    >
                      Show All 6
                    </button>
                  )}
                </div>
              </div>

              {/* 6 Category Summary Buttons for Easy 1-Tap Selection */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {pricing.map((tier, idx) => {
                  const isSelected = selectedCategoryFilter === tier.id;
                  const tierColor = tier.color || (
                    idx === 0 ? '#059669' :
                    idx === 1 ? '#2563eb' :
                    idx === 2 ? '#7c3aed' :
                    idx === 3 ? '#ea580c' :
                    idx === 4 ? '#1e3a8a' :
                    '#0f766e'
                  );
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategoryFilter(tier.id);
                        setRegForm(prev => ({
                          ...prev,
                          selectedPlanId: tier.id,
                          schoolName: prev.schoolName || `Campus for ${tier.name} Package`,
                          estimatedStudents: tier.id === 'plan-starter' ? '250' :
                                             tier.id === 'plan-standard' ? '500' :
                                             tier.id === 'plan-professional' ? '1000' :
                                             tier.id === 'plan-premium' ? '1800' :
                                             tier.id === 'plan-enterprise' ? '2800' : '4000'
                        }));
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative group/btn ${
                        isSelected
                          ? 'border-white bg-slate-800/90 ring-2 ring-sky-400 shadow-xl'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: tierColor }} />
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            Cat. 0{idx + 1}
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm font-black text-white uppercase tracking-tight font-serif truncate">
                          {tier.name}
                        </div>
                        <div className="text-[10px] text-slate-300 font-medium truncate mt-0.5">
                          {tier.capacity}
                        </div>
                      </div>
                      
                      <div className="mt-2 pt-2 border-t border-slate-800/80">
                        <div className="text-xs sm:text-sm font-black text-amber-300 font-mono">
                          {tier.price}
                        </div>
                        <div className="text-[9px] text-slate-400 font-medium">
                          {tier.perStudent || tier.period}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Recommendation & Action Bar */}
              {selectedCategoryFilter !== 'all' && (() => {
                const matched = pricing.find(p => p.id === selectedCategoryFilter);
                if (!matched) return null;
                return (
                  <div className="p-3.5 bg-blue-900/40 border border-blue-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold text-sm shrink-0">
                        <Check className="w-5 h-5 text-sky-400" />
                      </div>
                      <div>
                        <div className="text-xs text-sky-200">Selected Plan: <strong className="text-white text-sm font-serif">{matched.name}</strong> ({matched.capacity})</div>
                        <div className="text-[11px] text-slate-300">{matched.description} • <span className="font-mono font-bold text-amber-300">{matched.price}</span> ({matched.perStudent})</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setRegForm(prev => ({
                          ...prev,
                          selectedPlanId: matched.id,
                          schoolName: prev.schoolName || `Campus for ${matched.name} Package`,
                          estimatedStudents: matched.id === 'plan-starter' ? '250' :
                                             matched.id === 'plan-standard' ? '500' :
                                             matched.id === 'plan-professional' ? '1000' :
                                             matched.id === 'plan-premium' ? '1800' :
                                             matched.id === 'plan-enterprise' ? '2800' : '4000'
                        }));
                        setShowRegisterModal(true);
                      }}
                      className="w-full sm:w-auto px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer whitespace-nowrap"
                    >
                      Proceed with {matched.name}
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* 6 Category Plans Grid (Matching the Flyer 100%) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4 items-stretch">
              {pricing.map((tier, idx) => {
                const isSelected = selectedCategoryFilter === tier.id;
                // Determine styling based on index/color from brochure
                const tierColor = tier.color || (
                  idx === 0 ? '#059669' :
                  idx === 1 ? '#2563eb' :
                  idx === 2 ? '#7c3aed' :
                  idx === 3 ? '#ea580c' :
                  idx === 4 ? '#1e3a8a' :
                  '#0f766e'
                );

                const getTierIcon = (index: number) => {
                  switch (index) {
                    case 0:
                      return <School className="w-9 h-9" style={{ color: tierColor }} />;
                    case 1:
                      return <Building2 className="w-9 h-9" style={{ color: tierColor }} />;
                    case 2:
                      return <GraduationCap className="w-9 h-9" style={{ color: tierColor }} />;
                    case 3:
                      return <Award className="w-9 h-9" style={{ color: tierColor }} />;
                    case 4:
                      return <ShieldCheck className="w-9 h-9" style={{ color: tierColor }} />;
                    default:
                      return <Layers className="w-9 h-9" style={{ color: tierColor }} />;
                  }
                };

                return (
                  <div 
                    key={tier.id}
                    className={`rounded-2xl border-2 transition-all flex flex-col justify-between overflow-hidden bg-white shadow-md hover:shadow-xl relative ${
                      isSelected
                        ? 'border-sky-500 ring-4 ring-sky-400/40 shadow-2xl scale-[1.02]'
                        : tier.popular
                        ? 'border-purple-600 ring-2 ring-purple-400/40'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Super Admin In-Context Controls */}
                    {isSuperAdminEditMode && (
                      <div className="absolute top-1 right-1 flex items-center gap-1 z-20">
                        <button
                          onClick={() => {
                            setEditingItemType('pricing');
                            setEditingItemData(tier);
                          }}
                          className="p-1 bg-black/60 hover:bg-black text-white rounded text-xs"
                          title="Edit plan"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removePricingTier(tier.id)}
                          className="p-1 bg-black/60 hover:bg-red-600 text-white rounded text-xs"
                          title="Delete plan"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Popular Badge */}
                    {tier.badge && (
                      <span className="absolute top-8 left-1/2 -translate-x-1/2 z-10 bg-amber-400 text-slate-950 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md whitespace-nowrap">
                        {tier.badge}
                      </span>
                    )}

                    {/* Top Package Name Header */}
                    <div 
                      className="text-white py-2.5 px-3 text-center font-serif font-black tracking-wider uppercase text-xs sm:text-sm shadow-inner"
                      style={{ backgroundColor: tierColor }}
                    >
                      {tier.name}
                    </div>

                    {/* Body Content */}
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between text-center space-y-3.5">
                      
                      {/* School Illustration Icon */}
                      <div className="flex justify-center items-center py-1">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-inner">
                          {getTierIcon(idx)}
                        </div>
                      </div>

                      {/* Student Capacity (Bold Label) */}
                      <div className="text-xs sm:text-sm font-extrabold text-slate-800 tracking-tight">
                        {tier.capacity || 'All Students'}
                      </div>

                      {/* Price Block (Solid Matching Banner) */}
                      <div 
                        className="py-2.5 px-2 rounded-xl text-white shadow-sm"
                        style={{ backgroundColor: tierColor }}
                      >
                        <div className="text-base sm:text-lg font-black tracking-tight font-serif leading-none">
                          {tier.price}
                        </div>
                        <div className="text-[10px] font-medium opacity-90 mt-0.5 uppercase tracking-wider">
                          {tier.period}
                        </div>
                      </div>

                      {/* Per-Student Pill */}
                      {tier.perStudent && (
                        <div className="inline-block mx-auto py-1 px-2 rounded-full text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200">
                          {tier.perStudent}
                        </div>
                      )}

                      {/* Target Description */}
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed min-h-[36px] flex items-center justify-center">
                        {tier.description}
                      </p>

                      {/* Features Preview (Optional Popover/List) */}
                      {tier.features && tier.features.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 text-left space-y-1.5">
                          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase block text-center">
                            Includes
                          </span>
                          {tier.features.slice(0, 3).map((feat, fidx) => (
                            <div key={fidx} className="flex items-start gap-1.5 text-[10px] text-slate-600">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                              <span className="truncate">{feat}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Action Button */}
                      <button
                        onClick={() => {
                          setRegForm(prev => ({
                            ...prev,
                            selectedPlanId: tier.id,
                            schoolName: prev.schoolName || `Campus for ${tier.name} Package`,
                            estimatedStudents: tier.id === 'plan-starter' ? '250' :
                                               tier.id === 'plan-standard' ? '500' :
                                               tier.id === 'plan-professional' ? '1000' :
                                               tier.id === 'plan-premium' ? '1800' :
                                               tier.id === 'plan-enterprise' ? '2800' : '4000'
                          }));
                          setShowRegisterModal(true);
                        }}
                        className="w-full py-2 px-2.5 rounded-xl text-white font-bold text-xs transition-all shadow-sm hover:shadow-md active:scale-95 cursor-pointer mt-2"
                        style={{ backgroundColor: tierColor }}
                      >
                        {tier.buttonLabel || `Select ${tier.name}`}
                      </button>

                    </div>
                  </div>
                );
              })}
            </div>

            {/* ========================================================
                ONBOARDING CHARGES & PARTNERSHIP GUARANTEE CARDS
                Strictly Synced with Marketing Brochure Flyer
                ======================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-4">
              
              {/* Card 1 & 2: Onboarding Charges (2 Columns Width on LG) */}
              <div className="lg:col-span-2 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-blue-900/50 flex flex-col md:flex-row items-center justify-between gap-6">
                
                <div className="space-y-4 text-left flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center shrink-0">
                      <Rocket className="w-6 h-6 text-sky-400" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-black font-serif tracking-tight text-white">
                        Onboarding Charges
                      </h3>
                      <p className="text-xs text-sky-200">
                        Get started the right way — with full setup and dedicated institutional support.
                      </p>
                    </div>
                  </div>

                  {/* 4 Checkmarks list */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                      <span>System configuration & customization</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                      <span>Data migration (students, staff, classes, etc.)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                      <span>Staff training & user orientation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                      <span>Go-live support & 30 days post-launch assistance</span>
                    </div>
                  </div>
                </div>

                {/* Setup Fee Badge */}
                <div className="bg-blue-900/60 border border-blue-400/40 rounded-2xl p-5 text-center shrink-0 w-full md:w-56 shadow-inner">
                  <div className="text-2xl sm:text-3xl font-black text-white font-serif tracking-tight">
                    KSh 50,000
                  </div>
                  <div className="text-xs text-sky-300 font-bold uppercase tracking-wider mt-1">
                    One-time setup fee
                  </div>
                  <button
                    onClick={() => setShowRegisterModal(true)}
                    className="mt-3 w-full py-2 px-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Request Deployment
                  </button>
                </div>

              </div>

              {/* Card 3: Partnership Commitment (1 Column Width on LG) */}
              <div className="bg-sky-50 rounded-3xl p-6 sm:p-7 border border-sky-100 shadow-lg flex flex-col justify-between text-left space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Handshake className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs font-mono font-bold text-sky-800 uppercase tracking-wider">
                    Our Commitment
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                    We don't just give you a system. We partner with you for success.
                  </p>
                  <p className="text-base sm:text-lg font-serif font-black text-sky-950 italic">
                    Your School. Our Priority.
                  </p>
                </div>

                <div className="pt-2 border-t border-sky-200/60 flex items-center justify-between text-xs text-slate-600">
                  <span className="font-bold text-slate-900">Direct Hotline:</span>
                  <a 
                    href="tel:0729620384"
                    className="font-mono font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>0729620384</span>
                  </a>
                </div>
              </div>

            </div>

            {/* Direct Contact & Assurance Bar */}
            <div className="bg-slate-900 text-white rounded-2xl px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs shadow-lg border border-slate-800">
              
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <Phone className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Contact Us Today</span>
                  <a href="tel:0729620384" className="font-mono font-black text-sm text-amber-400 hover:underline">
                    0729620384
                  </a>
                </div>
              </div>

              {/* Trust Badges from Flyer */}
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[11px] font-bold text-slate-300">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                  <span>Secure</span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cloud Ready</span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Laptop className="w-3.5 h-3.5 text-purple-400" />
                  <span>Multi-Device Access</span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-orange-400" />
                  <span>Reliable Support</span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <BarChart3 className="w-3.5 h-3.5 text-teal-400" />
                  <span>Scalable Growth</span>
                </span>
              </div>

              <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest text-center md:text-right">
                SMART SCHOOLS CREATE A BRIGHTER FUTURE
              </div>

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
              
              <div className="flex items-center gap-3.5">
                <div className="bg-white p-1 rounded-2xl border border-slate-700 shadow-lg flex items-center justify-center shrink-0">
                  <img 
                    src="/assets/aistudio/WhatsApp_Image_2026-10-22_at_12.24.43_41514bbb.jpeg" 
                    alt="Edu-Smart PORTAL By Gadsa Systems" 
                    className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/edusmart-portal-logo.jpeg';
                    }}
                  />
                </div>
                <div className="text-left">
                  <span className="font-sans font-black text-white text-base sm:text-lg block tracking-tight">
                    <span className="text-white">Edu-</span><span className="text-amber-400">Smart</span> <span className="text-blue-300 text-xs sm:text-sm uppercase tracking-wider font-extrabold ml-1">PORTAL</span>
                  </span>
                  <span className="text-[11px] text-slate-400 block font-medium mt-0.5">
                    By Gadsa Systems · Multi-Tenant Platform
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

              <div className="flex items-center gap-2 text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Secure · Reliable · Multi-Tenant</span>
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

            {/* Section 2: HERO SECTION - SUPER ADMIN PROTECTED */}
            {activeEditorSection === 'hero' && (
              <div className="space-y-4 text-xs">
                {/* Super Admin Authorization Badge */}
                <div className="p-3 bg-amber-950/60 border border-amber-500/40 rounded-xl flex items-center justify-between text-amber-300">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span className="font-bold">Super Admin Hero Customizer</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full uppercase border border-amber-400/30">
                    Super Admin Only
                  </span>
                </div>
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

                {/* HERO BANNER MEDIA: IMAGE OR SHORT VIDEO (30s) */}
                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-amber-400 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                      <Film className="w-4 h-4 text-amber-400" />
                      <span>Hero Banner Media</span>
                    </label>
                    <span className="text-[10px] text-cyan-300 font-mono bg-cyan-950/80 border border-cyan-800 px-2 py-0.5 rounded-full">
                      Image or Short Video (30s)
                    </span>
                  </div>

                  {/* Media Type Toggle */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl">
                    <button
                      type="button"
                      onClick={() => updateLandingHero({ mediaType: 'image' })}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        (hero.mediaType || 'image') === 'image'
                          ? 'bg-amber-400 text-slate-950 font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>High-Res Photo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateLandingHero({ mediaType: 'video' })}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        hero.mediaType === 'video'
                          ? 'bg-amber-400 text-slate-950 font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Short Video (30s)</span>
                    </button>
                  </div>

                  {/* 1. SHORT VIDEO (30s) SETTINGS */}
                  {hero.mediaType === 'video' && (
                    <div className="p-3 bg-slate-900/90 border border-cyan-900/50 rounded-xl space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-cyan-300">Direct Video URL</label>
                          <span className="text-[10px] text-slate-400 font-mono">Max 30s MP4/WebM</span>
                        </div>
                        <input
                          type="text"
                          value={hero.heroVideoUrl || ''}
                          onChange={(e) => updateLandingHero({ heroVideoUrl: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-cyan-200 text-xs font-mono"
                          placeholder="https://.../video.mp4"
                        />
                      </div>

                      {/* Video File Upload */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Upload Short Video (Max 30s)
                        </label>
                        <div className="flex items-center gap-2">
                          <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold border border-slate-600 flex items-center gap-1.5 cursor-pointer">
                            <Upload className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{isVideoUploading ? 'Validating (30s)...' : 'Upload Video File'}</span>
                            <input
                              type="file"
                              accept="video/mp4,video/webm"
                              onChange={handleHeroVideoUpload}
                              className="hidden"
                              disabled={isVideoUploading}
                            />
                          </label>
                          <span className="text-[10px] text-slate-400">Validated with client-side 30s limit</span>
                        </div>
                        {videoUploadError && (
                          <div className="mt-1.5 p-2 bg-red-950/80 border border-red-700 rounded-lg text-red-300 text-xs flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                            <span>{videoUploadError}</span>
                          </div>
                        )}
                      </div>

                      {/* Presets */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>Choose Curated 30-Second Showcase:</span>
                        </span>
                        <div className="grid grid-cols-1 gap-1.5">
                          {listHeroVideoPresets().map((preset) => {
                            const isSelected = hero.heroVideoUrl === preset.url;
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
                                className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                                  isSelected
                                    ? 'bg-cyan-950 border-cyan-400 text-white'
                                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600'
                                }`}
                              >
                                <span className="font-bold text-xs truncate">{preset.label}</span>
                                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-900/50 px-1.5 py-0.5 rounded shrink-0 ml-1">
                                  {preset.durationLabel}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Video Settings */}
                      <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
                        <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hero.videoAutoplay !== false}
                            onChange={(e) => updateLandingHero({ videoAutoplay: e.target.checked })}
                            className="accent-amber-400 rounded"
                          />
                          <span>Autoplay</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer" title="Browsers require muted for autoplay">
                          <input
                            type="checkbox"
                            checked={hero.videoMuted !== false}
                            onChange={(e) => updateLandingHero({ videoMuted: e.target.checked })}
                            className="accent-amber-400 rounded"
                          />
                          <span>Muted (Sound btn)</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hero.videoLoop !== false}
                            onChange={(e) => updateLandingHero({ videoLoop: e.target.checked })}
                            className="accent-amber-400 rounded"
                          />
                          <span>30s Loop</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hero.videoShowControls !== false}
                            onChange={(e) => updateLandingHero({ videoShowControls: e.target.checked })}
                            className="accent-amber-400 rounded"
                          />
                          <span>Show Controls</span>
                        </label>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">Badge Text</label>
                        <input
                          type="text"
                          value={hero.videoBadgeLabel || '30s Campus Spotlight'}
                          onChange={(e) => updateLandingHero({ videoBadgeLabel: e.target.value })}
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                          placeholder="e.g. 30s Campus Spotlight"
                        />
                      </div>
                    </div>
                  )}

                  {/* 2. IMAGE SETTINGS */}
                  {hero.mediaType !== 'video' && (
                    <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block font-bold text-slate-300 text-xs">Hero Banner Photo URL</label>
                        <label className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-bold border border-slate-600 flex items-center gap-1 cursor-pointer">
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
                        value={hero.heroImageUrl}
                        onChange={(e) => updateLandingHero({ heroImageUrl: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-300 font-mono text-xs"
                      />
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="text-[10px] text-slate-400 self-center">Presets:</span>
                        {listHeroImagePresets().map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => updateLandingHero({ heroImageUrl: preset.url, mediaType: 'image' })}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              hero.heroImageUrl === preset.url && hero.mediaType !== 'video'
                                ? 'bg-amber-400 text-slate-950 border-amber-300'
                                : 'bg-slate-900 text-slate-300 border-slate-700'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-200">Floating Highlight Overlay Card</span>
                      <p className="text-[10px] text-slate-400">Bottom highlight card with status pill badge</p>
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                      <span className="text-[11px] text-slate-300">Show Card</span>
                      <input
                        type="checkbox"
                        checked={hero.showFloatingCard}
                        onChange={(e) => updateLandingHero({ showFloatingCard: e.target.checked })}
                        className="w-4 h-4 accent-amber-400"
                      />
                    </label>
                  </div>

                  {hero.showFloatingCard && (
                    <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Card Title</label>
                          <input
                            type="text"
                            value={hero.floatingCardTitle}
                            onChange={(e) => updateLandingHero({ floatingCardTitle: e.target.value })}
                            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-bold"
                            placeholder="e.g. 99.4% Term Attendance"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Card Subtitle</label>
                          <input
                            type="text"
                            value={hero.floatingCardSubtitle}
                            onChange={(e) => updateLandingHero({ floatingCardSubtitle: e.target.value })}
                            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                            placeholder="e.g. Real-time biometrics & roll call monitoring"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Badge Text</label>
                          <input
                            type="text"
                            value={hero.floatingCardBadgeText || 'ACTIVE'}
                            onChange={(e) => updateLandingHero({ floatingCardBadgeText: e.target.value.toUpperCase() })}
                            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono font-bold uppercase"
                            placeholder="e.g. ACTIVE"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Badge Color</label>
                          <select
                            value={hero.floatingCardBadgeColor || 'emerald'}
                            onChange={(e) => updateLandingHero({ floatingCardBadgeColor: e.target.value as any })}
                            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                          >
                            <option value="emerald">🟢 Emerald Green (ACTIVE)</option>
                            <option value="blue">🔵 Royal Blue (VERIFIED)</option>
                            <option value="amber">🟡 Amber Gold (SPOTLIGHT)</option>
                            <option value="purple">🟣 Indigo Purple (AI-POWERED)</option>
                            <option value="slate">⚪ Classic Slate (OFFICIAL)</option>
                          </select>
                        </div>
                      </div>

                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setToastMessage('Floating highlight card settings saved and retained!');
                            setTimeout(() => setToastMessage(null), 3000);
                          }}
                          className="px-3 py-1 bg-amber-400 text-slate-950 font-bold text-[11px] rounded-lg shadow-sm cursor-pointer hover:bg-amber-300 flex items-center gap-1"
                        >
                          <Save className="w-3 h-3 text-slate-950" />
                          <span>Save Floating Card</span>
                        </button>
                      </div>
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Student Capacity</label>
                    <input
                      type="text"
                      placeholder="e.g. Up to 300 Students"
                      value={editingItemData.capacity || ''}
                      onChange={(e) => setEditingItemData({ ...editingItemData, capacity: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Per Student Cost</label>
                    <input
                      type="text"
                      placeholder="e.g. ≈ KSh 250 per student"
                      value={editingItemData.perStudent || ''}
                      onChange={(e) => setEditingItemData({ ...editingItemData, perStudent: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-medium"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Accent Theme Color</label>
                    <input
                      type="color"
                      value={editingItemData.color || '#2563eb'}
                      onChange={(e) => setEditingItemData({ ...editingItemData, color: e.target.value })}
                      className="w-full h-9 bg-slate-950 border border-slate-700 rounded-xl p-1 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Button Label</label>
                    <input
                      type="text"
                      placeholder="Select Plan"
                      value={editingItemData.buttonLabel || ''}
                      onChange={(e) => setEditingItemData({ ...editingItemData, buttonLabel: e.target.value })}
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
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
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
              
              {/* Package Category Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold text-slate-700">
                    Selected Package Category (6 Synced Tiers)
                  </label>
                  <span className="text-[10px] text-blue-600 font-bold">
                    Official Pricing Flyer
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {pricing.map((tier, idx) => {
                    const isSelected = regForm.selectedPlanId === tier.id;
                    const tierColor = tier.color || (
                      idx === 0 ? '#059669' :
                      idx === 1 ? '#2563eb' :
                      idx === 2 ? '#7c3aed' :
                      idx === 3 ? '#ea580c' :
                      idx === 4 ? '#1e3a8a' :
                      '#0f766e'
                    );
                    return (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => {
                          setRegForm({
                            ...regForm,
                            selectedPlanId: tier.id,
                            estimatedStudents: tier.id === 'plan-starter' ? '250' :
                                               tier.id === 'plan-standard' ? '500' :
                                               tier.id === 'plan-professional' ? '1000' :
                                               tier.id === 'plan-premium' ? '1800' :
                                               tier.id === 'plan-enterprise' ? '2800' : '4000'
                          });
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/30 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tierColor }} />
                            <span className="font-serif font-black text-xs text-slate-900 uppercase">
                              {tier.name}
                            </span>
                          </div>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-blue-600 font-bold" />
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium mt-1 truncate">
                          {tier.capacity}
                        </div>
                        <div className="text-xs font-black text-blue-700 font-mono mt-0.5">
                          {tier.price}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">School Official Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. St. Jude Academy"
                  value={regForm.schoolName}
                  onChange={(e) => setRegForm({ ...regForm, schoolName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
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

      {/* ========================================================
          SUPER ADMIN VERIFICATION MODAL
          Strictly guards Hero Banner customization and platform settings
          ======================================================== */}
      {showSuperAdminAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-amber-400/50 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-400/15 border border-amber-400/30 rounded-2xl text-amber-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-white">
                    Super Admin Verification
                  </h3>
                  <p className="text-xs text-amber-300/80 font-medium mt-0.5">
                    Platform Super Admin Authentication Required
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSuperAdminAuthModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
              <p>
                Customization of the <span className="text-amber-300 font-bold">Hero Banner</span>, classroom showcase media, and school platform configurations can only be done by authorized Platform Super Administrators.
              </p>
            </div>

            {/* Verification Form */}
            <form onSubmit={handleVerifySuperAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Super Administrator Email
                </label>
                <input
                  type="email"
                  value={adminEmailInput}
                  onChange={(e) => setAdminEmailInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-400"
                  placeholder="admin@edusmart.ac.ke"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Master Security Passcode / Password
                </label>
                <div className="relative">
                  <input
                    type={showPasscodeText ? 'text' : 'password'}
                    required
                    autoFocus
                    value={adminPasscode}
                    onChange={(e) => {
                      setAdminPasscode(e.target.value);
                      if (adminAuthError) setAdminAuthError(null);
                    }}
                    placeholder="Enter Super Admin Passcode (e.g. admin2026)"
                    className="w-full px-3.5 py-2.5 pr-10 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscodeText(!showPasscodeText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPasscodeText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                  <span>Authorized for platform governance</span>
                  <span className="font-mono text-amber-400/80">Default: admin2026</span>
                </div>
              </div>

              {adminAuthError && (
                <div className="p-3 bg-red-950/80 border border-red-700 rounded-xl text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{adminAuthError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowSuperAdminAuthModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-950" />
                  <span>Verify & Unlock Hero Customizer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          PUBLIC VIRTUAL LAB TICKETING & WORKSPACE MODAL
          ======================================================== */}
      <VirtualLabSubscriptionModal
        isOpen={showVirtualLabModal}
        onClose={() => setShowVirtualLabModal(false)}
        initialTier={virtualLabInitialTier}
        initialStep={virtualLabInitialStep}
        initialTicketCode={virtualLabTicketCode}
      />

    </div>
  );
};
