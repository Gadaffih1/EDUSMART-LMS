import { UserRole } from './index';

export interface LandingNavLink {
  id: string;
  label: string;
  sectionId: string;
  enabled: boolean;
}

export interface LandingHeaderConfig {
  brandName: string;
  brandSubtitle: string;
  navLinks: LandingNavLink[];
  showLoginButton: boolean;
  loginButtonLabel: string;
  showRegisterButton: boolean;
  registerButtonLabel: string;
}

export type HeroMediaType = 'image' | 'video';

export interface LandingHeroConfig {
  pillTag: string;
  headlineStart: string;
  headlineMid: string;
  headlineHighlight: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
  // Hero Media configuration (Image or short video max 30s)
  mediaType?: HeroMediaType; // 'image' | 'video'
  heroImageUrl: string;
  heroVideoUrl?: string; // MP4/WebM video URL or uploaded blob/data
  heroVideoPoster?: string; // Poster thumbnail image while loading or fallback
  videoAutoplay?: boolean; // Autoplay (default: true)
  videoMuted?: boolean; // Default true so browser allows autoplay
  videoLoop?: boolean; // Loop video (default: true)
  videoShowControls?: boolean; // Show play/pause/sound control buttons on banner
  videoMaxDuration?: number; // In seconds (default: 30)
  videoBadgeLabel?: string; // e.g. "30s Campus Spotlight" or "CBC Video Tour"
  bannerAspect?: 'cinematic' | 'standard' | 'tall'; // Aspect ratio mode
  floatingCardTitle: string;
  floatingCardSubtitle: string;
  showFloatingCard: boolean;
  trustBadges: string[];
}

export interface LandingStatItem {
  id: string;
  label: string;
  value: string;
  subtext: string;
  icon: string;
}

export interface LandingFeatureItem {
  id: string;
  title: string;
  description: string;
  tag: string;
  icon: string;
  category: string;
  enabled: boolean;
}

export interface LandingAboutConfig {
  title: string;
  subtitle: string;
  badge: string;
  paragraphs: string[];
  points: string[];
  milestone1Value: string;
  milestone1Title: string;
  milestone1Subtext: string;
  milestone2Value: string;
  milestone2Title: string;
  milestone2Subtext: string;
}

export interface LandingTestimonialItem {
  id: string;
  quote: string;
  author: string;
  role: string;
  school: string;
  rating: number;
}

export interface LandingFaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface LandingPricingTier {
  id: string;
  name: string;
  price: string;
  period: string;
  capacity?: string;
  perStudent?: string;
  badge?: string;
  description: string;
  features: string[];
  popular?: boolean;
  buttonLabel?: string;
  color?: string;
  accentClass?: string;
}

export interface LandingContactConfig {
  sectionBadge: string;
  sectionTitle: string;
  sectionSubtitle: string;
  phone: string;
  email: string;
  address: string;
  supportHours: string;
}

export interface LandingFooterConfig {
  brandName: string;
  tagline: string;
  copyrightText: string;
  developerCredit: string;
}

export interface LandingSectionsVisibility {
  header: boolean;
  broadcast: boolean;
  hero: boolean;
  stats: boolean;
  features: boolean;
  showcase: boolean;
  about: boolean;
  testimonials: boolean;
  pricing: boolean;
  faq: boolean;
  contact: boolean;
  footer: boolean;
}

export interface LandingPageConfig {
  visibility: LandingSectionsVisibility;
  header: LandingHeaderConfig;
  hero: LandingHeroConfig;
  stats: LandingStatItem[];
  features: LandingFeatureItem[];
  about: LandingAboutConfig;
  testimonials: LandingTestimonialItem[];
  pricing: LandingPricingTier[];
  faqs: LandingFaqItem[];
  contact: LandingContactConfig;
  footer: LandingFooterConfig;
}

export interface WorkspaceModuleConfig {
  id: string;
  name: string;
  shortName: string;
  description: string;
  category: 'Learner' | 'Academics' | 'Leadership' | 'Specialized Operations' | 'Administration' | 'Custom' | 'Finance & Operations';
  icon: string;
  enabled: boolean;
  badgeText: string;
  accentColor: string;
  customNotice: string;
  allowedRoles: string[];
  isCustomModule?: boolean;
  customPortalTitle?: string;
  actionButtons?: Array<{
    label: string;
    description: string;
    icon: string;
  }>;
}

export interface BroadcastNotice {
  active: boolean;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  targetAudience: 'all' | 'landing_only' | 'portals_only';
}

export interface GlobalPlatformSettings {
  platformName: string;
  platformTagline: string;
  broadcastNotice: BroadcastNotice;
  maintenanceMode: boolean;
  allowPublicRegistration: boolean;
  primaryBrandColor: string;
}

export interface ClassTeacherModulePolicy {
  allowRemarksEditing: boolean;
  allowGatePassAuth: boolean;
  allowLunchRegister: boolean;
  allowParentBroadcast: boolean;
  morningRollCallDeadline: string;
  isRegisterLocked: boolean;
}

export interface OperationsGovernancePolicy {
  enableMpesaAutoReconciliation: boolean;
  procurementApprovalThreshold: number; // KES threshold requiring Head Teacher clearance
  strictBudgetEnforcement: boolean;
  requireThreeWayMatchingForPayment: boolean;
  lockDisbursedPayrollRuns: boolean;
  autoReorderAlertsEnabled: boolean;
  allowDepartmentalRequisitions: boolean;
}

export interface PlatformCustomizationState {
  landingPage: LandingPageConfig;
  workspaces: WorkspaceModuleConfig[];
  globalSettings: GlobalPlatformSettings;
  classTeacherPolicy?: ClassTeacherModulePolicy;
  operationsPolicy?: OperationsGovernancePolicy;
  schoolOverrides: Record<string, {
    disabledWorkspaceIds?: string[];
    customNotice?: string;
  }>;
}
