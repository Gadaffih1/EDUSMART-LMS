import { PlatformCustomizationState } from '../types/customization';

export const DEFAULT_PLATFORM_CUSTOMIZATION: PlatformCustomizationState = {
  landingPage: {
    visibility: {
      header: true,
      broadcast: true,
      hero: true,
      stats: true,
      features: true,
      showcase: true,
      about: true,
      testimonials: true,
      pricing: true,
      faq: true,
      contact: true,
      footer: true
    },
    header: {
      brandName: 'EduSmart LMS',
      brandSubtitle: 'Multi-Tenant School Platform',
      showLoginButton: true,
      loginButtonLabel: 'School Login',
      showRegisterButton: true,
      registerButtonLabel: 'Register a School',
      navLinks: [
        { id: 'nav-features', label: 'Features', sectionId: 'features-section', enabled: true },
        { id: 'nav-stats', label: 'Impact & Stats', sectionId: 'stats-section', enabled: true },
        { id: 'nav-about', label: 'About', sectionId: 'about-section', enabled: true },
        { id: 'nav-reviews', label: 'Reviews', sectionId: 'testimonials-section', enabled: true },
        { id: 'nav-pricing', label: 'Pricing', sectionId: 'pricing-section', enabled: true },
        { id: 'nav-faq', label: 'FAQ', sectionId: 'faq-section', enabled: true },
        { id: 'nav-contact', label: 'Contact', sectionId: 'contact-section', enabled: true }
      ]
    },
    hero: {
      pillTag: 'ONE PLATFORM. EVERY SCHOOL.',
      headlineStart: 'Smarter School',
      headlineMid: 'Management.',
      headlineHighlight: 'Better Learning.',
      subtitle: 'A complete digital platform for school administration, teaching, assessment and communication. Built specifically for Kenyan CBC and modern global curricula.',
      primaryCta: 'School Login',
      secondaryCta: 'Register a School',
      heroImageUrl: '/src/assets/images/edusmart_campus_banner_1790859700873.jpg',
      floatingCardTitle: '99.4% Term Attendance',
      floatingCardSubtitle: 'Real-time biometrics & roll call monitoring',
      showFloatingCard: true,
      trustBadges: [
        'Ministry of Education Compliant',
        'Kenyan CBC Automated Rubrics',
        'Isolated Multi-Tenant Security'
      ]
    },
    stats: [
      {
        id: 'stat-schools',
        label: 'Partner Schools',
        value: '52+',
        subtext: 'Across Nairobi, Kiambu, Mombasa & Eldoret',
        icon: 'School'
      },
      {
        id: 'stat-students',
        label: 'Active Learners',
        value: '248,000+',
        subtext: 'Primary & Junior Secondary students enrolled',
        icon: 'GraduationCap'
      },
      {
        id: 'stat-uptime',
        label: 'Platform Reliability',
        value: '99.98%',
        subtext: 'High-availability cloud infrastructure with offline sync',
        icon: 'ShieldCheck'
      },
      {
        id: 'stat-assessments',
        label: 'CBC Assessments Logged',
        value: '1.4M+',
        subtext: 'Formative & summative KNEC CBA rubrics recorded',
        icon: 'BarChart3'
      }
    ],
    features: [
      {
        id: 'feat-attendance',
        title: 'Smart Attendance & Gate Exit',
        description: 'Biometric and digital roll-call with automated SMS alerts to parents when learners tap in or depart school premises.',
        tag: 'Safety & Tracking',
        icon: 'Calendar',
        category: 'Operations',
        enabled: true
      },
      {
        id: 'feat-cbc',
        title: 'Kenyan CBC Assessment Suite',
        description: 'Comprehensive Competency Based Curriculum tracking with formative rubrics, KNEC CBA scores, strand ratings and automated report cards.',
        tag: 'Academics',
        icon: 'BookOpen',
        category: 'Academics',
        enabled: true
      },
      {
        id: 'feat-finance',
        title: 'Fee Billing & M-Pesa Integration',
        description: 'Automated term invoicing, real-time M-Pesa Paybill reconciliations, fee statements, and instant receipt generation.',
        tag: 'Financials',
        icon: 'BarChart3',
        category: 'Finance',
        enabled: true
      },
      {
        id: 'feat-portal',
        title: 'Multi-Role Portals & Workspaces',
        description: 'Tailored workspaces for Students, Parents, Teachers, HODs, Deans, Nurses, Librarians, Transport and School Executives.',
        tag: 'Role-Based Access',
        icon: 'Users',
        category: 'Governance',
        enabled: true
      },
      {
        id: 'feat-multicampus',
        title: 'Multi-Tenancy & Campus Switcher',
        description: 'Platform owners seamlessly manage multi-campus chains, regional branches, and independent school institutions with complete isolation.',
        tag: 'Multi-Tenancy',
        icon: 'School',
        category: 'Administration',
        enabled: true
      },
      {
        id: 'feat-offline',
        title: 'Offline Sync & Real-Time Cache',
        description: 'Works seamlessly during erratic campus network connections with background synchronization as soon as connectivity resumes.',
        tag: 'Resilience',
        icon: 'Laptop',
        category: 'Technology',
        enabled: true
      }
    ],
    about: {
      title: 'Built For The Modern Educational Landscape',
      subtitle: 'EduSmart LMS bridges school administrators, teachers, learners and parents through an intuitive, reliable multi-tenant architecture.',
      badge: 'ABOUT EDUSMART',
      paragraphs: [
        'EduSmart is engineered from the ground up to address the unique operational and academic challenges of primary and secondary education across East Africa.',
        'With native alignment to the Competency Based Curriculum (CBC) guidelines and Ministry of Education standards, our platform streamlines grading, discipline, transport, boarding, and institutional governance into one cohesive cloud operating system.'
      ],
      points: [
        'Fully compliant with Kenyan CBC reporting structures and KNEC CBA portfolios.',
        'Strict role-based isolation guaranteeing school tenant privacy and data security.',
        'Integrated M-Pesa Paybill and instant parent SMS notification pipelines.',
        'Super Administrator console providing multi-campus orchestration and licensing.'
      ],
      milestone1Value: '100%',
      milestone1Title: 'CBC & CBA Compliance',
      milestone1Subtext: 'Strands, sub-strands, and formative rubrics',
      milestone2Value: '99.9%',
      milestone2Title: 'Uptime & Offline Sync',
      milestone2Subtext: 'Local caching with automatic sync when connected'
    },
    testimonials: [
      {
        id: 'test-1',
        quote: 'EduSmart transformed our CBC report cards and continuous assessment recording. What used to take our teachers two weeks now takes an afternoon.',
        author: 'Mr. Patrick Kamau',
        role: 'School Administrator',
        school: 'Riara School Nairobi',
        rating: 5
      },
      {
        id: 'test-2',
        quote: 'The multi-campus governance allows our board of governors to monitor attendance, fee collections, and curriculum progress across all branches from one screen.',
        author: 'Dr. Beatrice Ochieng',
        role: 'Executive Academic Director',
        school: 'Greenwood Educational Trust',
        rating: 5
      },
      {
        id: 'test-3',
        quote: 'Instant SMS notifications when my children board the school bus and enter the school gate give me absolute peace of mind during work hours.',
        author: 'Faith Mutua',
        role: 'Parent Representative',
        school: 'Hillcrest High Nairobi',
        rating: 5
      }
    ],
    pricing: [
      {
        id: 'plan-basic',
        name: 'Basic School Plan',
        price: 'KSh 25,000',
        period: 'per term',
        description: 'Ideal for small preparatory schools up to 400 learners.',
        features: [
          'Up to 400 Learners & 25 Teachers',
          'Attendance Roll Call & Gate Registers',
          'Standard CBC Termly Report Cards',
          'Email & Community Support'
        ],
        popular: false,
        buttonLabel: 'Select Basic Plan'
      },
      {
        id: 'plan-pro',
        name: 'Pro Institutional Plan',
        price: 'KSh 65,000',
        period: 'per term',
        badge: 'MOST POPULAR',
        description: 'The complete enterprise suite for comprehensive academies.',
        features: [
          'Up to 2,500 Learners & Unlimited Staff',
          'Kenyan CBC Assessment Engine & Rubrics',
          'M-Pesa Paybill & Automated Reconciliation',
          'Parent Portal & SMS Notification Pipeline',
          'Sanatorium Clinic & Transport Fleet Modules',
          'Priority 24/7 Dedicated Support'
        ],
        popular: true,
        buttonLabel: 'Get Started with Pro'
      },
      {
        id: 'plan-enterprise',
        name: 'Multi-Campus Enterprise',
        price: 'Custom Quote',
        period: 'annual contract',
        description: 'For school groups, multi-campus franchises and county trusts.',
        features: [
          'Unlimited Campuses & Student Population',
          'Central Super Admin Console & Campus Switcher',
          'Custom Institutional Branding & Domain Name',
          'Custom Workspaces & API Integrations',
          'Dedicated Account Director & On-Site Training'
        ],
        popular: false,
        buttonLabel: 'Contact Sales'
      }
    ],
    faqs: [
      {
        id: 'faq-1',
        question: 'How does multi-tenancy protect school data isolation?',
        answer: 'Every school campus operates within its own encrypted database partition. Student grades, staff registers, and financials are strictly separated. School administrators only access their campus, while the platform owner exercises high-level governance.',
        category: 'Security'
      },
      {
        id: 'faq-2',
        question: 'Is EduSmart compliant with Ministry of Education CBC guidelines?',
        answer: 'Yes! EduSmart natively supports Kenyan CBC strands, sub-strands, formative rubrics, and KNEC CBA termly scoring rubrics for Grades 1 to 9, outputting compliant report cards automatically.',
        category: 'Curriculum'
      },
      {
        id: 'faq-3',
        question: 'Does the system work during power or internet outages?',
        answer: 'Yes. EduSmart has an integrated offline sync engine with IndexedDB persistence. Roll-call attendance and lesson marks can be entered without internet and will automatically sync once connection is restored.',
        category: 'Technology'
      },
      {
        id: 'faq-4',
        question: 'How do M-Pesa fee payments get reconciled?',
        answer: 'We connect directly to your school M-Pesa Paybill or Till number. When parents pay using the student admission number as account reference, the platform reconciles the balance and sends an automated SMS receipt within seconds.',
        category: 'Finance'
      }
    ],
    contact: {
      sectionBadge: 'GET IN TOUCH',
      sectionTitle: 'Contact Administration & Support',
      sectionSubtitle: 'Schedule an institutional walkthrough or request a tailored pilot deployment for your school campus.',
      phone: '+254 (0) 700 889 900 / +254 (0) 20 523 4400',
      email: 'support@edusmart.ac.ke',
      address: 'EduSmart Towers, 5th Floor, Kilimani Business District, Nairobi, Kenya',
      supportHours: 'Monday – Friday: 7:00 AM – 6:00 PM EAT · Saturday: 8:00 AM – 1:00 PM EAT'
    },
    footer: {
      brandName: 'EduSmart LMS',
      tagline: 'Multi-Tenant School Operating System · Empowering Modern Education',
      copyrightText: '© 2026 EduSmart Systems Ltd. All rights reserved. Registered under Kenya Data Protection Act.',
      developerCredit: 'Designed & Engineered for African Academic Institutions'
    }
  },
  workspaces: [
    {
      id: 'student',
      name: 'Student Workspace (Learner Portal)',
      shortName: 'Learner Portal',
      description: 'Learners access their assignments, term grades, virtual labs, timetable, and study resources.',
      category: 'Learner',
      icon: 'GraduationCap',
      enabled: true,
      badgeText: 'Active',
      accentColor: '#3b82f6',
      customNotice: 'Term 2 CBC Assessment schedules and homework submissions are open.',
      allowedRoles: ['student']
    },
    {
      id: 'parent',
      name: 'Parent & Guardian Portal',
      shortName: 'Parent Portal',
      description: 'Parents monitor their children academic progress, fee balances, fee statements, attendance and teacher communications.',
      category: 'Learner',
      icon: 'Users',
      enabled: true,
      badgeText: 'Active',
      accentColor: '#10b981',
      customNotice: 'Mid-term fee balance reconciliations and parent-teacher meeting bookings are now live.',
      allowedRoles: ['parent']
    },
    {
      id: 'teacher',
      name: 'Teacher & Class Faculty Workspace',
      shortName: 'Teacher Workspace',
      description: 'Teachers record student attendance, CBC formative assessment scores, lesson plans, and learner comments.',
      category: 'Academics',
      icon: 'BookOpen',
      enabled: true,
      badgeText: 'Active',
      accentColor: '#059669',
      customNotice: 'Remember to finalize Strand & Sub-strand formative rubrics before week 9.',
      allowedRoles: ['teacher', 'class_teacher']
    },
    {
      id: 'hod',
      name: 'Head of Department (HOD) Workspace',
      shortName: 'HOD Workspace',
      description: 'Departmental curriculum coverage oversight, teacher allocation, scheme of work approvals and subject moderation.',
      category: 'Academics',
      icon: 'Layers',
      enabled: true,
      badgeText: 'Active',
      accentColor: '#6366f1',
      customNotice: 'Review department schemes of work and midterm assessment moderation rubrics.',
      allowedRoles: ['hod']
    },
    {
      id: 'senior_teacher',
      name: 'Senior Teacher Academic Supervision',
      shortName: 'Senior Teacher',
      description: 'Learner mentorship, teacher supervision, daily routine compliance and instructional leadership.',
      category: 'Academics',
      icon: 'ShieldCheck',
      enabled: true,
      badgeText: 'Active',
      accentColor: '#0284c7',
      customNotice: 'Check the weekly teacher roll-call compliance and learner discipline logs.',
      allowedRoles: ['senior_teacher']
    },
    {
      id: 'deputy_head',
      name: 'Deputy Head Operations & Discipline',
      shortName: 'Deputy Head',
      description: 'Operational logistics, discipline records, staff attendance, substitute teacher arrangements and duty roster.',
      category: 'Leadership',
      icon: 'Sliders',
      enabled: true,
      badgeText: 'Active',
      accentColor: '#d97706',
      customNotice: 'Staff duty roster for next week has been generated and dispatched.',
      allowedRoles: ['deputy_head']
    },
    {
      id: 'dean_of_studies',
      name: 'Dean of Studies Academic Hub',
      shortName: 'Dean of Studies',
      description: 'Termly examination schedules, CBC report card publishing, KNEC CBA registrations and academic performance trends.',
      category: 'Academics',
      icon: 'Award',
      enabled: true,
      badgeText: 'Active',
      accentColor: '#8b5cf6',
      customNotice: 'Term 2 examination timetables and CBA assessment portfolios are ready for sign-off.',
      allowedRoles: ['dean_of_studies']
    },
    {
      id: 'curriculum_coordinator',
      name: 'Curriculum Coordinator Workspace',
      shortName: 'Curriculum Coordinator',
      description: 'CBC syllabus alignment, teaching resources repository, continuous assessment auditing and teacher pedagogical training.',
      category: 'Leadership',
      icon: 'FolderPlus',
      enabled: true,
      badgeText: 'Active',
      accentColor: '#4f46e5',
      customNotice: 'New KICD CBC syllabus curriculum guidelines updated for Junior Secondary grades 7-9.',
      allowedRoles: ['curriculum_coordinator']
    },
    {
      id: 'head_teacher',
      name: 'Head Teacher Executive Workspace',
      shortName: 'Head Teacher',
      description: 'School-wide holistic analytics, board reports, stakeholder communications and executive approvals.',
      category: 'Leadership',
      icon: 'Building2',
      enabled: true,
      badgeText: 'Active',
      accentColor: '#0f766e',
      customNotice: 'Board of Management quarterly review report generated and archived.',
      allowedRoles: ['head_teacher']
    },
    {
      id: 'librarian',
      name: 'Librarian & Resource Center',
      shortName: 'Library Hub',
      description: 'Cataloging physical and digital books, managing student borrowings, overdue fines, and e-learning resources.',
      category: 'Specialized Operations',
      icon: 'BookOpen',
      enabled: true,
      badgeText: 'Active',
      accentColor: '#0891b2',
      customNotice: 'Stock audit for science laboratory manuals and literature set books completed.',
      allowedRoles: ['librarian']
    },
    {
      id: 'nurse',
      name: 'Sanatorium & Clinic Workspace',
      shortName: 'Clinic & Health',
      description: 'Confidential student health records, clinic visits, medication dispensation, chronic condition logs and emergency contacts.',
      category: 'Specialized Operations',
      icon: 'Shield',
      enabled: true,
      badgeText: 'Active',
      accentColor: '#e11d48',
      customNotice: 'Restricted clinic portal: strictly authorized health personnel only.',
      allowedRoles: ['nurse']
    },
    {
      id: 'school_admin_staff',
      name: 'School Admin Staff & Secretarial Hub',
      shortName: 'Secretarial Hub',
      description: 'Gate exit passes, visitor logs, document requests, student registration files and general administrative support.',
      category: 'Specialized Operations',
      icon: 'Calendar',
      enabled: true,
      badgeText: 'Active',
      accentColor: '#ca8a04',
      customNotice: 'Visitor passes and gate exit registers active for day and boarding learners.',
      allowedRoles: ['school_admin_staff']
    },
    {
      id: 'transport_team',
      name: 'Transport & Fleet Logistics Workspace',
      shortName: 'Transport & Fleet',
      description: 'School bus fleet management, morning/evening routes, driver allocations, student pick-up/drop-off tracking and vehicle maintenance.',
      category: 'Specialized Operations',
      icon: 'Globe',
      enabled: true,
      badgeText: 'Active',
      accentColor: '#2563eb',
      customNotice: 'Route 4 bus maintenance service scheduled for Friday 4:00 PM.',
      allowedRoles: ['transport_team']
    },
    {
      id: 'cocurricular_team',
      name: 'Co-Curricular, Sports & Clubs Hub',
      shortName: 'Sports & Clubs',
      description: 'Athletics, football, swimming, music festivals, drama, robotics club, scouting and weekend inter-school fixtures.',
      category: 'Specialized Operations',
      icon: 'Sparkles',
      enabled: true,
      badgeText: 'Active',
      accentColor: '#16a34a',
      customNotice: 'Sub-County music and drama festival registration submissions due this Friday.',
      allowedRoles: ['cocurricular_team']
    },
    {
      id: 'admin',
      name: 'School Principal & Campus Administrator',
      shortName: 'School Administrator',
      description: 'Full management of this specific school campus: staff management, fee structures, classes, timetables and student profiles.',
      category: 'Administration',
      icon: 'School',
      enabled: true,
      badgeText: 'Active',
      accentColor: '#1e293b',
      customNotice: 'Campus operational status normal. Multi-tenancy isolation active.',
      allowedRoles: ['admin']
    }
  ],
  globalSettings: {
    platformName: 'EduSmart LMS',
    platformTagline: 'Multi-Tenant School Operating System',
    broadcastNotice: {
      active: false,
      message: 'Notice: Platform maintenance scheduled for Sunday at 02:00 AM EAT. No data disruption expected.',
      type: 'info',
      targetAudience: 'all'
    },
    maintenanceMode: false,
    allowPublicRegistration: true,
    primaryBrandColor: '#2563eb'
  },
  schoolOverrides: {}
};
