export interface Tenant {
  id: string;
  name: string;
  shortName: string;
  motto: string;
  code: string;
  logoUrl?: string;
  crestIcon: 'school' | 'graduation-cap' | 'book-open' | 'shield';
  themeColor: string; // Tailwind primary color class prefix (e.g. 'emerald', 'blue', 'indigo', 'amber')
  badgeColorClass: string;
  headerBgClass: string;
  domain: string;
  address: string;
  city: string;
  county: string;
  phone: string;
  email: string;
  principalName: string;
  principalTitle: string;
  registrationNumber: string; // Ministry of Education / NEMIS Code
  curriculum: string;
  establishedYear: number;
  gradeLevels: string;
  term: string;
  academicYear: string;
  totalStudents: number;
  totalFaculty: number;
  backgroundColor?: string; // Hex color for entire school background (e.g. '#0f172a', '#f8fafc')
  bgCustomHex?: string;
  customBgColor?: string;
  customLogoBase64?: string;
  accentColor?: string;     // Primary highlight/brand color
  status?: 'active' | 'deactivated' | 'provisioning' | 'pending';
  plan?: 'Pro' | 'Standard' | 'Basic';
  expiryDate?: string;
  totalClasses?: number;
  attendanceToday?: number;
  categories?: string[];    // Custom school categories (e.g. STEM, Athletics, Boarding, Music)
  registeredAt?: string;
  superAdminNotes?: string;
  // Customizable Hero and Portal Branding
  taglineNotes?: string;     // Institutional tagline notes (e.g. "Dedicated to Academic Excellence, Holistic CBC Discovery & Moral Integrity")
  heroTitle?: string;        // Custom hero headline (e.g. "WELCOME TO THE RIARA SCHOOL PORTAL")
  heroSubtitle?: string;     // Custom hero subtitle / quote note
  curriculumBadgeText?: string; // e.g. "COMPETENCY-BASED CURRICULUM (CBC) · GRADES 1 TO 9"
  portalCardBadge?: string;  // e.g. "Official Campus Portal" or "By Gadsa Systems"
  // Customizable Printable Document Letterhead & Theme
  printHeaderTheme?: 'classic' | 'modern' | 'formal' | 'executive';
  printFooterNotes?: string; // Tagline notes & accreditation for bottom of printed documents
  printWatermarkText?: string;
  stampUrl?: string;         // Official school digital seal / stamp
  signatureUrl?: string;     // Principal / Head of School digital signature
  primaryColorHex?: string;  // Hex for official brand color (e.g. #1e3a8a)
  accentColorHex?: string;   // Hex for secondary / gold / highlight (e.g. #f59e0b)
}

export interface TenantContextType {
  currentTenant: Tenant;
  allTenants: Tenant[];
  switchTenant: (tenantId: string) => void;
  updateTenantBranding: (updates: Partial<Tenant>, tenantId?: string) => void;
  registerTenant: (newTenant: Tenant) => void;
  updateTenant: (tenantId: string, updates: Partial<Tenant>) => void;
  deleteTenant: (tenantId: string) => void;
  isMultiTenancyEnabled: boolean;
}
