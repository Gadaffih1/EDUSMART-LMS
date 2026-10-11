import { DocumentSubmissionRequest, DocumentSubmission, PostCategory, PortalSection } from '../types';

export const INITIAL_POST_CATEGORIES: PostCategory[] = [
  {
    id: 'cat-academic',
    name: 'Academic Directives & Syllabi',
    slug: 'academic-directives',
    color: 'emerald',
    description: 'Curriculum coverage guidelines, timetable adjustments, and CBC learning materials',
    icon: 'BookOpen',
    isSystemDefault: true,
  },
  {
    id: 'cat-computer-lab',
    name: 'CS Computer Lab & Coding',
    slug: 'cs-computer-lab',
    color: 'indigo',
    description: 'Scratch studio demonstrations, computational challenges, and digital literacy updates',
    icon: 'Laptop',
    isSystemDefault: true,
  },
  {
    id: 'cat-cocurricular',
    name: 'Sports & Co-Curricular',
    slug: 'sports-cocurricular',
    color: 'orange',
    description: 'Athletics fixtures, music festival preparations, and club activities',
    icon: 'Trophy',
    isSystemDefault: true,
  },
  {
    id: 'cat-sanatorium',
    name: 'Sanatorium & Health Briefs',
    slug: 'sanatorium-health',
    color: 'rose',
    description: 'Clinic immunization alerts, wellness notices, and student medical clearance',
    icon: 'HeartPulse',
    isSystemDefault: true,
  },
  {
    id: 'cat-assessments',
    name: 'CBC Assessments & KNEC',
    slug: 'cbc-assessments',
    color: 'blue',
    description: 'Assessment rubrics, SBA upload deadlines, and termly examination reports',
    icon: 'Award',
    isSystemDefault: true,
  },
  {
    id: 'cat-governance',
    name: 'Institutional Governance',
    slug: 'institutional-governance',
    color: 'purple',
    description: 'BOM board directives, staff briefings, and official school policies',
    icon: 'Shield',
    isSystemDefault: true,
  }
];

export const INITIAL_PORTAL_SECTIONS: PortalSection[] = [
  {
    id: 'sec-announcements',
    title: 'School Directives & Bulletins',
    description: 'Official administrative notices from head teacher and executive board',
    categoryKey: 'institutional-governance',
    isVisible: true,
    order: 1,
    targetAudience: 'all',
    icon: 'Bell',
    badge: 'Official Broadcast'
  },
  {
    id: 'sec-academics',
    title: 'Curriculum & Topical Learning Feed',
    description: 'Subject teacher reminders, homework releases, and digital lab schedules',
    categoryKey: 'academic-directives',
    isVisible: true,
    order: 2,
    targetAudience: 'students',
    icon: 'BookOpen',
    badge: 'CBC Grade 1-9'
  },
  {
    id: 'sec-computer-lab',
    title: 'Computer Lab Challenges & Coding Showcase',
    description: 'Weekly Scratch coding assignments, block puzzles, and project highlights',
    categoryKey: 'cs-computer-lab',
    isVisible: true,
    order: 3,
    targetAudience: 'all',
    icon: 'Code2',
    badge: 'STEM & CS'
  },
  {
    id: 'sec-cocurricular',
    title: 'Co-Curricular & Sports Academy Feed',
    description: 'Fixtures, team training times, talent trophies, and club patron posts',
    categoryKey: 'sports-cocurricular',
    isVisible: true,
    order: 4,
    targetAudience: 'all',
    icon: 'Trophy',
    badge: 'Talent & Athletics'
  }
];

export const INITIAL_DOCUMENT_REQUESTS: DocumentSubmissionRequest[] = [
  {
    id: 'doc-req-001',
    title: 'Grade 4 CBC Transition Dossier & Birth Certificate',
    description: 'Mandatory submission of the official Ministry birth certificate copy and medical immunization record for NEMIS / KNEC CBA index registration.',
    requestedByUserId: 'usr-admin-system',
    requestedByUserName: 'Principal Dr. Peter Otieno',
    requestedByUserRole: 'head_teacher',
    targetUserIds: ['usr-stu-brian', 'usr-stu-faith', 'usr-stu-kevin'], // targeted specific users
    targetGrade: 4,
    targetRole: 'student',
    dueDate: '2026-11-15',
    requiredDocTypes: ['Birth Certificate (PDF or Clear JPG)', 'MOH Immunization Card', 'Grade 3 CBA Transition Assessment Summary'],
    mandatory: true,
    createdAt: '2026-10-01T08:00:00.000Z',
    status: 'active',
    instructions: 'Please upload scanned PDF or crisp mobile phone photos. File sizes up to 15MB are accepted. Ensure learner full names match school admission registers.'
  },
  {
    id: 'doc-req-002',
    title: 'Teacher Annual TIG Professional Development Dossier',
    description: 'Submission of TSC Teacher Induction & Guidance (TIG) portfolio evidence, lesson attendance records, and subject remedial log sheets.',
    requestedByUserId: 'usr-admin-system',
    requestedByUserName: 'Gadsa Systems Administrator',
    requestedByUserRole: 'admin',
    targetUserIds: ['usr-teach-sarah', 'usr-teach-omondi'], // targeted specific teachers
    targetRole: 'teacher',
    dueDate: '2026-11-20',
    requiredDocTypes: ['TPAD Self-Assessment Summary Sheet', 'Approved Schemes of Work Q4', 'Remedial Attendance Register'],
    mandatory: true,
    createdAt: '2026-10-05T09:30:00.000Z',
    status: 'active',
    instructions: 'Upload certified documents signed by the respective Head of Department or Dean of Studies.'
  },
  {
    id: 'doc-req-003',
    title: 'Parent Emergency Contact & Hospital Authorization Slip',
    description: 'Submission of authorized medical consent form allowing emergency ambulance transit to designated partner referral hospitals.',
    requestedByUserId: 'usr-admin-system',
    requestedByUserName: 'Sister Agnes Kilonzo',
    requestedByUserRole: 'nurse',
    targetUserIds: ['usr-par-mary', 'usr-par-john'], // targeted specific parents
    targetRole: 'parent',
    dueDate: '2026-11-25',
    requiredDocTypes: ['Signed Hospital Consent Form', 'National ID Copy (Primary Guardian)'],
    mandatory: false,
    createdAt: '2026-10-08T11:00:00.000Z',
    status: 'active',
    instructions: 'Required for all boarders and day scholars participating in inter-county sports or excursion trips.'
  }
];

export const INITIAL_DOCUMENT_SUBMISSIONS: DocumentSubmission[] = [
  {
    id: 'sub-001',
    requestId: 'doc-req-001',
    userId: 'usr-stu-brian',
    userName: 'Brian Kipchumba',
    userEmail: 'brian.kipchumba@student.edusmart.ac.ke',
    userRole: 'student',
    fileName: 'Brian_Kipchumba_BirthCert_NEMIS.pdf',
    fileSize: '1.8 MB',
    fileType: 'application/pdf',
    notes: 'Uploaded verified certified copy from civil registration bureau.',
    status: 'verified',
    submittedAt: '2026-10-06T14:22:00.000Z',
    reviewedBy: 'Dr. Peter Otieno',
    reviewNotes: 'Verified against KNEC CBA index register. Entry validated.',
    reviewedAt: '2026-10-07T09:15:00.000Z'
  },
  {
    id: 'sub-002',
    requestId: 'doc-req-001',
    userId: 'usr-stu-faith',
    userName: 'Faith Wanjiku',
    userEmail: 'faith.wanjiku@student.edusmart.ac.ke',
    userRole: 'student',
    fileName: 'Faith_Wanjiku_Immunization_and_Cert.jpg',
    fileSize: '3.4 MB',
    fileType: 'image/jpeg',
    notes: 'Scanned clinic card showing all childhood immunizations complete.',
    status: 'submitted',
    submittedAt: '2026-10-09T16:05:00.000Z'
  },
  {
    id: 'sub-003',
    requestId: 'doc-req-002',
    userId: 'usr-teach-sarah',
    userName: 'Ms. Sarah Mwangi',
    userEmail: 'sarah.mwangi@teacher.edusmart.ac.ke',
    userRole: 'teacher',
    fileName: 'Sarah_Mwangi_TPAD_Term3_Summary.pdf',
    fileSize: '4.2 MB',
    fileType: 'application/pdf',
    notes: 'Attached certified lesson study reviews and learner progress tracking sheets.',
    status: 'verified',
    submittedAt: '2026-10-08T10:30:00.000Z',
    reviewedBy: 'Dean of Studies Mr. Kamau',
    reviewNotes: 'All 8 competencies meet standard. Approved.',
    reviewedAt: '2026-10-09T11:40:00.000Z'
  }
];
