import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface LMSWorkspaceA11yInfo {
  id: string;
  name: string;
  shortName: string;
  category: 'Learner' | 'Academics' | 'Leadership' | 'Specialized Operations' | 'Administration' | 'Finance & Operations';
  role: string;
  screenReaderLabel: string;
  ariaDescription: string;
  shortcutKey: string;
}

export const LMS_WORKSPACES_A11Y: LMSWorkspaceA11yInfo[] = [
  {
    id: 'student',
    name: 'Learner / Student CBC Workspace',
    shortName: 'Student Portal',
    category: 'Learner',
    role: 'student',
    screenReaderLabel: 'Learner Workspace: Access CBC curriculum strands, digital textbooks, homework submissions, and formative performance rubrics.',
    ariaDescription: 'Primary workspace for pupils to view daily timetable, complete assignments, and track termly competency badges.',
    shortcutKey: 'Alt + 1'
  },
  {
    id: 'parent',
    name: 'Parent & Guardian Portal',
    shortName: 'Parent Portal',
    category: 'Learner',
    role: 'parent',
    screenReaderLabel: 'Parent Portal: Monitor learner academic attendance, termly CBC assessment report cards, fee statements, and teacher communications.',
    ariaDescription: 'Guardian dashboard for multiple enrolled children, real-time bus notifications, and school circulars.',
    shortcutKey: 'Alt + 2'
  },
  {
    id: 'teacher',
    name: 'Subject Teacher & Faculty Workspace',
    shortName: 'Teacher Workspace',
    category: 'Academics',
    role: 'teacher',
    screenReaderLabel: 'Teacher Workspace: Design CBC schemes of work, lesson plans, rubric grading, assignments, and curriculum strand assessments.',
    ariaDescription: 'Classroom teaching module with digital gradebook, lesson planning, and attendance logging.',
    shortcutKey: 'Alt + 3'
  },
  {
    id: 'class_teacher',
    name: 'Class Teacher Command Centre',
    shortName: 'Class Teacher Portal',
    category: 'Academics',
    role: 'class_teacher',
    screenReaderLabel: 'Class Teacher Command Centre: Daily morning & afternoon roll-call registers, termly CBC report card remarks, learner discipline records, and lunch dining logs.',
    ariaDescription: 'Homeroom class management hub overseeing stream roll-call, learner dossiers, and parent correspondence.',
    shortcutKey: 'Alt + 4'
  },
  {
    id: 'hod',
    name: 'Head of Department (HOD) Workspace',
    shortName: 'HOD Workspace',
    category: 'Academics',
    role: 'hod',
    screenReaderLabel: 'Head of Department Workspace: Departmental syllabus coverage tracking, faculty workload allocation, and exam moderation.',
    ariaDescription: 'Departmental leadership for approving schemes of work and coordinating subject performance metrics.',
    shortcutKey: 'Alt + 5'
  },
  {
    id: 'senior_teacher',
    name: 'Senior Teacher Academic Supervision',
    shortName: 'Senior Teacher',
    category: 'Academics',
    role: 'senior_teacher',
    screenReaderLabel: 'Senior Teacher Supervision: Instructional quality assurance, teacher mentorship, roll-call audit, and learner pastoral care.',
    ariaDescription: 'Pedagogical supervision, classroom observation walks, and daily routine compliance monitoring.',
    shortcutKey: 'Alt + 6'
  },
  {
    id: 'deputy_head',
    name: 'Deputy Head Operations & Discipline',
    shortName: 'Deputy Head',
    category: 'Leadership',
    role: 'deputy_head',
    screenReaderLabel: 'Deputy Head Operations: Campus disciplinary records, faculty duty rosta, relief teacher allocations, and operational logistics.',
    ariaDescription: 'Executive deputy suite managing school discipline, teacher attendance, and day-to-day campus operations.',
    shortcutKey: 'Alt + 7'
  },
  {
    id: 'dean_of_studies',
    name: 'Dean of Studies Academic Hub',
    shortName: 'Dean of Studies',
    category: 'Academics',
    role: 'dean_of_studies',
    screenReaderLabel: 'Dean of Studies Hub: KNEC CBA registration portal, termly exam timetables, assessment standardization, and academic analytics.',
    ariaDescription: 'Academic registrar hub generating school-wide CBC report cards and standardized test performance.',
    shortcutKey: 'Alt + 8'
  },
  {
    id: 'curriculum_coordinator',
    name: 'Curriculum Coordinator Workspace',
    shortName: 'Curriculum Coordinator',
    category: 'Leadership',
    role: 'curriculum_coordinator',
    screenReaderLabel: 'Curriculum Coordinator Workspace: CBC curriculum compliance audit, interdisciplinary project oversight, and teacher pedagogical support.',
    ariaDescription: 'National curriculum alignment, strand verification, and institutional learning resources coordination.',
    shortcutKey: 'Alt + 9'
  },
  {
    id: 'librarian',
    name: 'Library & Resource Centre',
    shortName: 'Library Portal',
    category: 'Specialized Operations',
    role: 'librarian',
    screenReaderLabel: 'Library Portal: KICD approved textbook inventory, circulation lending desks, digital e-book repositories, and overdue notices.',
    ariaDescription: 'School cataloging, barcode book checkout, learner reading records, and inventory auditing.',
    shortcutKey: 'Alt + L'
  },
  {
    id: 'head_teacher',
    name: 'Head Teacher Executive Suite',
    shortName: 'Head Teacher',
    category: 'Leadership',
    role: 'head_teacher',
    screenReaderLabel: 'Head Teacher Executive Suite: Institutional governance, board reports, enrollment statistics, academic KPIs, and staff appraisal.',
    ariaDescription: 'Principal management dashboard with school-wide financial, academic, and administrative analytics.',
    shortcutKey: 'Alt + H'
  },
  {
    id: 'school_admin_staff',
    name: 'School Registrar & Secretariat',
    shortName: 'Admin Staff',
    category: 'Specialized Operations',
    role: 'school_admin_staff',
    screenReaderLabel: 'Registrar & Secretariat Workspace: Pupil admissions, NEMIS/UPI management, fee invoice receipts, and certified school certificates.',
    ariaDescription: 'Administrative office for student enrolment records, fee collection reconciliation, and official transcripts.',
    shortcutKey: 'Alt + R'
  },
  {
    id: 'transport_team',
    name: 'School Transport & Fleet Command',
    shortName: 'Transport Hub',
    category: 'Specialized Operations',
    role: 'transport_team',
    screenReaderLabel: 'Transport Logistics Hub: Fleet GPS routing, morning and evening bus manifests, pickup geofencing, and vehicle maintenance logs.',
    ariaDescription: 'Real-time school bus operations, student transit status, and driver dispatch coordination.',
    shortcutKey: 'Alt + T'
  },
  {
    id: 'cocurricular_team',
    name: 'Co-Curricular & Sports Academy',
    shortName: 'Co-Curricular Hub',
    category: 'Specialized Operations',
    role: 'cocurricular_team',
    screenReaderLabel: 'Co-Curricular Academy: Sports clubs, music & drama festivals, Scouting, President Award, fixture schedules, and talent records.',
    ariaDescription: 'Clubs and societies scheduling, tournament registration, and learner talent portfolio logs.',
    shortcutKey: 'Alt + C'
  },
  {
    id: 'admin',
    name: 'System Administrator Console',
    shortName: 'System Admin',
    category: 'Administration',
    role: 'admin',
    screenReaderLabel: 'System Administrator Console: User access control, bulk CSV onboarding, role permission policies, security audits, and institutional branding.',
    ariaDescription: 'Full system control panel for tenant configuration, database backups, and custom workspace policies.',
    shortcutKey: 'Alt + S'
  },
  {
    id: 'finance_officer',
    name: 'Finance & Bursary Portal',
    shortName: 'Finance Portal',
    category: 'Finance & Operations',
    role: 'finance_officer',
    screenReaderLabel: 'Finance & Bursary Portal: Student fee invoicing, M-Pesa automated reconciliation, fee collection ledger, departmental budgets, and cash flow reports.',
    ariaDescription: 'Campus financial management and bursary operations with multi-tenant accounting and receipt issuance.',
    shortcutKey: 'Alt + F'
  },
  {
    id: 'procurement_officer',
    name: 'Procurement & Purchasing Portal',
    shortName: 'Procurement Lead',
    category: 'Finance & Operations',
    role: 'procurement_officer',
    screenReaderLabel: 'Procurement Portal: Purchase requisitions, departmental approvals, registered supplier directory, quotation analysis, and LPO issuance.',
    ariaDescription: 'Supply chain management and 3-way matching purchase authorization gateway.',
    shortcutKey: 'Alt + P'
  },
  {
    id: 'storekeeper',
    name: 'Central Stores & Inventory Hub',
    shortName: 'Central Stores',
    category: 'Finance & Operations',
    role: 'storekeeper',
    screenReaderLabel: 'Central Stores & Inventory Hub: Stock cataloging, Goods Received Notes (GRN), Store Issue Vouchers (SIV), and stocktake audit reconciliations.',
    ariaDescription: 'Campus warehouse inventory management, bin cards, and stock distribution tracking.',
    shortcutKey: 'Alt + I'
  },
  {
    id: 'hr_manager',
    name: 'HR & Kenyan CBC Payroll Engine',
    shortName: 'HR & Payroll',
    category: 'Finance & Operations',
    role: 'hr_manager',
    screenReaderLabel: 'HR & Payroll Engine: Staff dossiers, statutory deductions (PAYE, NSSF, NHIF/SHIF, Housing Levy), monthly payroll runs, and digital payslips.',
    ariaDescription: 'Human resources management and payroll execution compliant with Kenyan tax and labour laws.',
    shortcutKey: 'Alt + E'
  }
];

interface AccessibilityPreferences {
  highContrast: boolean;
  fontSize: number; // 100, 110, 125, 140
  screenReaderMode: boolean;
  reducedMotion: boolean;
  enhancedFocus: boolean;
}

const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  highContrast: false,
  fontSize: 100,
  screenReaderMode: false,
  reducedMotion: false,
  enhancedFocus: false
};

const STORAGE_KEY = 'edusmart_accessibility_preferences_v1';

interface AccessibilityContextType {
  highContrast: boolean;
  fontSize: number;
  screenReaderMode: boolean;
  reducedMotion: boolean;
  enhancedFocus: boolean;
  isCustomized: boolean;
  toggleHighContrast: () => void;
  setHighContrast: (value: boolean) => void;
  setFontSize: (size: number) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  toggleScreenReaderMode: () => void;
  setScreenReaderMode: (value: boolean) => void;
  toggleReducedMotion: () => void;
  toggleEnhancedFocus: () => void;
  resetToDefaults: () => void;
  announce: (message: string, politeness?: 'polite' | 'assertive') => void;
  workspaces: LMSWorkspaceA11yInfo[];
  getWorkspaceAriaLabel: (workspaceId: string, fallback?: string) => string;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_PREFERENCES, ...parsed };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_PREFERENCES;
  });

  const [announcement, setAnnouncement] = useState<{ message: string; politeness: 'polite' | 'assertive' }>({
    message: '',
    politeness: 'polite'
  });

  const announce = useCallback((message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement({ message, politeness });
  }, []);

  // Sync DOM classes and CSS variables whenever preferences change
  useEffect(() => {
    const root = document.documentElement;

    // 1. High-Contrast Mode
    if (preferences.highContrast) {
      root.classList.add('high-contrast');
      root.setAttribute('data-contrast', 'high');
    } else {
      root.classList.remove('high-contrast');
      root.removeAttribute('data-contrast');
    }

    // 2. Scalable Font Size
    if (preferences.fontSize === 100) {
      root.style.fontSize = '';
    } else {
      root.style.fontSize = `${preferences.fontSize}%`;
    }

    // 3. Screen Reader Optimization
    if (preferences.screenReaderMode) {
      root.setAttribute('data-screen-reader-friendly', 'true');
    } else {
      root.removeAttribute('data-screen-reader-friendly');
    }

    // 4. Reduced Motion
    if (preferences.reducedMotion) {
      root.classList.add('reduce-motion');
      root.setAttribute('data-reduced-motion', 'true');
    } else {
      root.classList.remove('reduce-motion');
      root.removeAttribute('data-reduced-motion');
    }

    // 5. Enhanced Focus Ring
    if (preferences.enhancedFocus) {
      root.classList.add('enhanced-focus');
    } else {
      root.classList.remove('enhanced-focus');
    }

    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Ignore
    }
  }, [preferences]);

  const toggleHighContrast = useCallback(() => {
    setPreferences(prev => {
      const next = !prev.highContrast;
      announce(next ? 'High Contrast Mode activated' : 'High Contrast Mode deactivated');
      return { ...prev, highContrast: next };
    });
  }, [announce]);

  const setHighContrast = useCallback((value: boolean) => {
    setPreferences(prev => {
      announce(value ? 'High Contrast Mode enabled' : 'High Contrast Mode disabled');
      return { ...prev, highContrast: value };
    });
  }, [announce]);

  const setFontSize = useCallback((size: number) => {
    setPreferences(prev => {
      announce(`Font size adjusted to ${size} percent`);
      return { ...prev, fontSize: size };
    });
  }, [announce]);

  const increaseFontSize = useCallback(() => {
    setPreferences(prev => {
      const steps = [100, 110, 125, 140];
      const currentIndex = steps.indexOf(prev.fontSize);
      const nextIndex = currentIndex === -1 ? 0 : Math.min(steps.length - 1, currentIndex + 1);
      const nextSize = steps[nextIndex];
      announce(`Font size increased to ${nextSize} percent`);
      return { ...prev, fontSize: nextSize };
    });
  }, [announce]);

  const decreaseFontSize = useCallback(() => {
    setPreferences(prev => {
      const steps = [100, 110, 125, 140];
      const currentIndex = steps.indexOf(prev.fontSize);
      const nextIndex = currentIndex === -1 ? 0 : Math.max(0, currentIndex - 1);
      const nextSize = steps[nextIndex];
      announce(`Font size decreased to ${nextSize} percent`);
      return { ...prev, fontSize: nextSize };
    });
  }, [announce]);

  const toggleScreenReaderMode = useCallback(() => {
    setPreferences(prev => {
      const next = !prev.screenReaderMode;
      announce(next ? 'Screen-reader friendly navigation labels enabled across all LMS workspaces' : 'Standard navigation labels restored');
      return { ...prev, screenReaderMode: next };
    });
  }, [announce]);

  const setScreenReaderMode = useCallback((value: boolean) => {
    setPreferences(prev => {
      announce(value ? 'Screen reader labels activated' : 'Screen reader labels deactivated');
      return { ...prev, screenReaderMode: value };
    });
  }, [announce]);

  const toggleReducedMotion = useCallback(() => {
    setPreferences(prev => {
      const next = !prev.reducedMotion;
      announce(next ? 'Reduced motion enabled' : 'Animation effects restored');
      return { ...prev, reducedMotion: next };
    });
  }, [announce]);

  const toggleEnhancedFocus = useCallback(() => {
    setPreferences(prev => {
      const next = !prev.enhancedFocus;
      announce(next ? 'Enhanced focus outlines enabled' : 'Standard focus outlines restored');
      return { ...prev, enhancedFocus: next };
    });
  }, [announce]);

  const resetToDefaults = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    announce('All accessibility settings have been reset to default values.');
  }, [announce]);

  const isCustomized = 
    preferences.highContrast || 
    preferences.fontSize !== 100 || 
    preferences.screenReaderMode || 
    preferences.reducedMotion || 
    preferences.enhancedFocus;

  const getWorkspaceAriaLabel = useCallback((workspaceId: string, fallback?: string): string => {
    const item = LMS_WORKSPACES_A11Y.find(w => w.id === workspaceId);
    if (!item) return fallback || workspaceId;
    return preferences.screenReaderMode 
      ? `${item.name}: ${item.screenReaderLabel} Keyboard shortcut: ${item.shortcutKey}` 
      : item.name;
  }, [preferences.screenReaderMode]);

  return (
    <AccessibilityContext.Provider
      value={{
        highContrast: preferences.highContrast,
        fontSize: preferences.fontSize,
        screenReaderMode: preferences.screenReaderMode,
        reducedMotion: preferences.reducedMotion,
        enhancedFocus: preferences.enhancedFocus,
        isCustomized,
        toggleHighContrast,
        setHighContrast,
        setFontSize,
        increaseFontSize,
        decreaseFontSize,
        toggleScreenReaderMode,
        setScreenReaderMode,
        toggleReducedMotion,
        toggleEnhancedFocus,
        resetToDefaults,
        announce,
        workspaces: LMS_WORKSPACES_A11Y,
        getWorkspaceAriaLabel
      }}
    >
      {/* Live ARIA announcement region for screen readers */}
      <div 
        id="a11y-live-region"
        aria-live={announcement.politeness}
        aria-atomic="true"
        className="sr-only"
        data-testid="a11y-live-region"
      >
        {announcement.message}
      </div>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
