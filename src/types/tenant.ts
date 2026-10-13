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
}

export interface TenantContextType {
  currentTenant: Tenant;
  allTenants: Tenant[];
  switchTenant: (tenantId: string) => void;
  updateTenantBranding: (updates: Partial<Tenant>) => void;
  isMultiTenancyEnabled: boolean;
}
