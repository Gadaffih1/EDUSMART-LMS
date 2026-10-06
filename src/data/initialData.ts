import {
  User,
  GradePassword,
  Topic,
  LessonNote,
  VideoLesson,
  AudioLesson,
  Quiz,
  QuizAttempt,
  Assignment,
  Announcement,
  VirtualClassRoom,
  WorkEntryLog,
  GateExitPass,
  AttendanceRecord,
  ReportCard,
  TimetableSlot,
  ChatMessage,
  LibraryBook,
  LibraryBorrowRecord,
  LibraryReservation,
  LibraryFine,
  LibraryAcquisition,
  LibraryShelfLocation,
  DigitalLibraryItem,
  ReadingProgrammeMember,
  LibraryAttendanceLog,
  LibraryTimetableSlot,
  LibraryEvent,
  LibraryAuditLog,
  LibraryPolicy,
  AppNotification,
  LearnerBadge,
  PortfolioItem,
  PeriodicReport,
  SearchAuditLog,
  ExternalTool,
  SchoolCalendarEvent,
  ParentCommunication,
  ExamTimetableEntry,
  SanatoriumRecord,
  TransportRoute,
  SchoolBus,
  StudentTransportProfile,
  TransportTripRecord,
  TransportIncident,
  TransportAlert,
  CoCurricularActivity,
  LearnerCoCurricularProfile,
  CoCurricularAttendanceRecord,
  CoCurricularCompetition,
  CoCurricularEquipment,
  CoCurricularTrip,
  CoCurricularAnnouncement,
  CoCurricularBudgetItem,
  BellPeriodDef,
  LearnerLunchRecord
} from '../types';

export const INITIAL_GRADE_PASSWORDS: GradePassword[] = [
  { grade: 1, password: 'GR1@2026', isActive: true },
  { grade: 2, password: 'GR2@2026', isActive: true },
  { grade: 3, password: 'GR3@2026', isActive: true },
  { grade: 4, password: 'GR4@2026', isActive: true },
  { grade: 5, password: 'GR5@2026', isActive: true },
  { grade: 6, password: 'GR6@2026', isActive: true },
  { grade: 7, password: 'GR7@2026', isActive: true },
  { grade: 8, password: 'GR8@2026', isActive: true },
  { grade: 9, password: 'GR9@2026', isActive: true },
];

export const INITIAL_USERS: User[] = [
  // Admin
  {
    id: 'usr-admin-1',
    name: 'Main Administrator',
    email: 'admin@edusmart.ac.ke',
    password: 'admin2026',
    role: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  // School Admin Staff (Registrar & Secretariat)
  {
    id: 'usr-admin-staff-1',
    name: 'Mrs. Sarah Cherono',
    email: 'adminstaff@edusmart.ac.ke',
    password: 'staff2026',
    role: 'school_admin_staff',
    tscNumber: 'ADM/45120/SEC',
    designation: 'Senior Administrative Officer & Academic Registrar',
    avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80',
  },
  // School Sanatorium Nurse In-Charge
  {
    id: 'usr-nurse-grace',
    name: 'Sister Grace Wambui, RN',
    email: 'nurse@edusmart.ac.ke',
    password: 'nurse2026',
    role: 'school_admin_staff',
    tscNumber: 'NCK/RN-58921',
    designation: 'School Nursing Officer In-Charge · Sanatorium Bay',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
  },
  // Transport Team - Lead Driver & Fleet Supervisor
  {
    id: 'usr-transport-lead',
    name: 'Mr. Josephat Kipkoech',
    email: 'transport@edusmart.ac.ke',
    password: 'transport2026',
    role: 'transport_team',
    phone: '+254 712 345 678',
    tscNumber: 'NTSA/PSV-78412',
    designation: 'Lead School Bus Driver & Fleet Operations Supervisor',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
  },
  // Transport Team - Senior Bus Chaperone & Student Roll Officer
  {
    id: 'usr-transport-assistant',
    name: 'Ms. Mary Wambui',
    email: 'chaperone@edusmart.ac.ke',
    password: 'transport2026',
    role: 'transport_team',
    phone: '+254 723 456 789',
    tscNumber: 'TRN/CHP-014',
    designation: 'Senior Bus Chaperone & Student Roll Officer',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  // Co-Curricular Team - Director of Sports & Activities
  {
    id: 'usr-cocurricular-lead',
    name: 'Coach Benjamin Omwenga',
    email: 'cocurricular@edusmart.ac.ke',
    password: 'cocurricular2026',
    role: 'cocurricular_team',
    phone: '+254 722 789 012',
    tscNumber: 'TSC/SP-38910',
    designation: 'Director of Sports & Head Football Academy Coach',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
  // Co-Curricular Team - Patron, Debate & Music/Drama Troupe
  {
    id: 'usr-patron-debate',
    name: 'Madame Grace Achieng',
    email: 'patron@edusmart.ac.ke',
    password: 'cocurricular2026',
    role: 'cocurricular_team',
    phone: '+254 721 345 987',
    tscNumber: 'TSC/CL-49201',
    designation: 'Senior Patron, Great Debaters Society & Drama Troupe',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  },
  // Head Teacher
  {
    id: 'usr-head-1',
    name: 'Dr. Arthur Mwangi',
    email: 'headteacher@edusmart.ac.ke',
    password: 'head2026',
    role: 'head_teacher',
    tscNumber: 'TSC/14982/ED',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  // Deputy Head Teacher
  {
    id: 'usr-deputy-1',
    name: 'Mr. Charles Omondi',
    email: 'deputy@edusmart.ac.ke',
    password: 'deputy2026',
    role: 'deputy_head',
    tscNumber: 'TSC/23491/ED',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
  // Dean of Studies
  {
    id: 'usr-dean-1',
    name: 'Ms. Beatrice Wanjiku',
    email: 'dean@edusmart.ac.ke',
    password: 'dean2026',
    role: 'dean_of_studies',
    tscNumber: 'TSC/38910/ED',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  // Head of Department (HOD) - Sciences & Mathematics
  {
    id: 'usr-hod-sciences',
    name: 'Dr. Mercy Mwangi',
    email: 'hod.sciences@edusmart.ac.ke',
    password: 'hod2026',
    role: 'hod',
    department: 'Sciences & Mathematics',
    tscNumber: 'TSC/31204/ED',
    assignedSubjects: ['Integrated Science', 'Mathematics'],
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  },
  // Senior Teacher - Academic & Learner Supervision
  {
    id: 'usr-senior-ochieng',
    name: 'Mr. Peter Ochieng',
    email: 'senior.teacher@edusmart.ac.ke',
    password: 'senior2026',
    role: 'senior_teacher',
    tscNumber: 'TSC/29410/ED',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
  },
  // Librarian
  {
    id: 'usr-lib-esther',
    name: 'Mrs. Esther Kamau',
    email: 'librarian@edusmart.ac.ke',
    password: 'lib2026',
    role: 'librarian',
    tscNumber: 'TSC/48102/ED',
    avatarUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
  },
  // Parent
  {
    id: 'usr-parent-otieno',
    name: 'Mrs. Grace Otieno (Parent)',
    email: 'parent.otieno@edusmart.ac.ke',
    password: 'parent2026',
    role: 'parent',
    phone: '+254 722 123 456',
    childrenIds: ['usr-stu-brian', 'usr-stu-faith', 'usr-stu-peter'],
    avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80',
  },
  // Class Teacher: Grade 4 Dove
  {
    id: 'usr-teach-kiprono',
    name: 'Mr. David Kiprono',
    email: 'mr.kiprono@edusmart.ac.ke',
    password: 'teach2026',
    role: 'class_teacher',
    grade: 4,
    stream: 'Dove',
    tscNumber: 'TSC/44120/ED',
    assignedStreams: [
      { grade: 4, stream: 'Dove' },
      { grade: 4, stream: 'Eagle' },
    ],
    assignedSubjects: ['Mathematics', 'Integrated Science'],
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  },
  // Class Teacher: Grade 8 Mara
  {
    id: 'usr-teach-akinyi',
    name: 'Mrs. Florence Akinyi',
    email: 'mrs.akinyi@edusmart.ac.ke',
    password: 'teach2026',
    role: 'class_teacher',
    grade: 8,
    stream: 'Mara',
    tscNumber: 'TSC/51294/ED',
    assignedStreams: [
      { grade: 8, stream: 'Mara' },
      { grade: 8, stream: 'Athi' },
    ],
    assignedSubjects: ['English', 'Social Studies'],
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  },
  // Subject Teacher
  {
    id: 'usr-teach-mutua',
    name: 'Mr. Peter Mutua',
    email: 'mr.mutua@edusmart.ac.ke',
    password: 'teach2026',
    role: 'teacher',
    tscNumber: 'TSC/67891/ED',
    assignedStreams: [
      { grade: 4, stream: 'Dove' },
      { grade: 7, stream: 'Kerio' },
      { grade: 8, stream: 'Mara' },
      { grade: 9, stream: 'Tana' }
    ],
    assignedSubjects: ['Mathematics', 'Pretechnical Education', 'Agriculture and Nutrition'],
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  },
  // Students - Grade 4 Dove
  {
    id: 'usr-stu-brian',
    name: 'Brian Otieno',
    email: 'brian.otieno@student.edusmart.ac.ke',
    password: 'GR4@2026',
    role: 'student',
    grade: 4,
    stream: 'Dove',
    admissionNumber: 'ADM/2023/0412',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-stu-amina',
    name: 'Amina Hassan',
    email: 'amina.hassan@student.edusmart.ac.ke',
    password: 'GR4@2026',
    role: 'student',
    grade: 4,
    stream: 'Dove',
    admissionNumber: 'ADM/2023/0413',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-stu-kelvin',
    name: 'Kelvin Kiprop',
    email: 'kelvin.kiprop@student.edusmart.ac.ke',
    password: 'GR4@2026',
    role: 'student',
    grade: 4,
    stream: 'Dove',
    admissionNumber: 'ADM/2023/0414',
  },
  {
    id: 'usr-stu-mercy',
    name: 'Mercy Chebet',
    email: 'mercy.chebet@student.edusmart.ac.ke',
    password: 'GR4@2026',
    role: 'student',
    grade: 4,
    stream: 'Dove',
    admissionNumber: 'ADM/2023/0415',
  },
  {
    id: 'usr-stu-daniel',
    name: 'Daniel Njoroge',
    email: 'daniel.njoroge@student.edusmart.ac.ke',
    password: 'GR4@2026',
    role: 'student',
    grade: 4,
    stream: 'Dove',
    admissionNumber: 'ADM/2023/0416',
  },
  // Students - Grade 8 Mara (Junior School)
  {
    id: 'usr-stu-faith',
    name: 'Faith Wanjiru',
    email: 'faith.wanjiru@student.edusmart.ac.ke',
    password: 'GR8@2026',
    role: 'student',
    grade: 8,
    stream: 'Mara',
    admissionNumber: 'ADM/2021/0819',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-stu-ian',
    name: 'Ian Mwangi',
    email: 'ian.mwangi@student.edusmart.ac.ke',
    password: 'GR8@2026',
    role: 'student',
    grade: 8,
    stream: 'Mara',
    admissionNumber: 'ADM/2021/0820',
  },
  {
    id: 'usr-stu-sharon',
    name: 'Sharon Cherono',
    email: 'sharon.cherono@student.edusmart.ac.ke',
    password: 'GR8@2026',
    role: 'student',
    grade: 8,
    stream: 'Mara',
    admissionNumber: 'ADM/2021/0821',
  },
  {
    id: 'usr-stu-victor',
    name: 'Victor Ochieng',
    email: 'victor.ochieng@student.edusmart.ac.ke',
    password: 'GR8@2026',
    role: 'student',
    grade: 8,
    stream: 'Mara',
    admissionNumber: 'ADM/2021/0822',
  },
  // Student - Grade 2 Eagle
  {
    id: 'usr-stu-kevin2',
    name: 'Kevin Maina',
    email: 'kevin.maina@student.edusmart.ac.ke',
    password: 'GR2@2026',
    role: 'student',
    grade: 2,
    stream: 'Eagle',
    admissionNumber: 'ADM/2025/0201',
  },
  {
    id: 'usr-stu-peter',
    name: 'Peter Otieno',
    email: 'peter.otieno@student.edusmart.ac.ke',
    password: 'GR2@2026',
    role: 'student',
    grade: 2,
    stream: 'Eagle',
    admissionNumber: 'ADM/2025/0202',
    avatarUrl: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=150&auto=format&fit=crop&q=80',
  }
];

export const INITIAL_TOPICS: Topic[] = [
  // Grade 4 Mathematics Topics
  {
    id: 'top-gr4-math-1',
    grade: 4,
    subject: 'Mathematics',
    title: 'Topic 1: Numbers & Place Values',
    term: 1,
    week: 1,
    description: 'Whole numbers up to 10,000, place values, reading, writing in symbols and words, and rounding off to the nearest 10 and 100.'
  },
  {
    id: 'top-gr4-math-2',
    grade: 4,
    subject: 'Mathematics',
    title: 'Topic 2: Fractions',
    term: 1,
    week: 3,
    description: 'Understanding proper fractions, equivalent fractions, addition and subtraction of like fractions, and solving real-world fractional word problems.'
  },
  {
    id: 'top-gr4-math-3',
    grade: 4,
    subject: 'Mathematics',
    title: 'Topic 3: Decimals',
    term: 1,
    week: 5,
    description: 'Tenths, hundredths, converting fractions to decimals, comparing decimals, and practical applications in Kenyan Shillings and measurements.'
  },
  // Grade 4 Integrated Science Topics
  {
    id: 'top-gr4-sci-1',
    grade: 4,
    subject: 'Integrated Science',
    title: 'Topic 1: Living Things & Plant Systems',
    term: 1,
    week: 2,
    description: 'Characteristics of plants, plant nutrition, xylem and phloem functions, photosynthesis, and caring for domestic vegetation.'
  },
  {
    id: 'top-gr4-sci-2',
    grade: 4,
    subject: 'Integrated Science',
    title: 'Topic 2: Matter & Energy Transformations',
    term: 1,
    week: 4,
    description: 'States of matter (solid, liquid, gas), heat transfer, water cycle, and renewable energy sources in everyday life.'
  },
  // Grade 4 English Topics
  {
    id: 'top-gr4-eng-1',
    grade: 4,
    subject: 'English',
    title: 'Topic 1: Reading Comprehension & Vocabulary',
    term: 1,
    week: 1,
    description: 'Narrative structures, contextual vocabulary, parts of speech: nouns and verbs, and descriptive paragraph composition.'
  },
  // Grade 8 Mathematics (Junior School)
  {
    id: 'top-gr8-math-1',
    grade: 8,
    subject: 'Mathematics',
    title: 'Topic 1: Algebraic Expressions & Linear Equations',
    term: 1,
    week: 1,
    description: 'Simplifying algebraic expressions, factorisation, solving linear equations in one unknown, and real-life problem modeling.'
  },
  // Grade 8 Pretechnical Education (Junior School)
  {
    id: 'top-gr8-pretech-1',
    grade: 8,
    subject: 'Pretechnical Education',
    title: 'Topic 1: Workshop Safety & Technical Drawing',
    term: 1,
    week: 2,
    description: 'Occupational safety protocols, personal protective equipment (PPE), orthographic projection, and drafting instruments.'
  }
];

export const INITIAL_LESSON_NOTES: LessonNote[] = [
  {
    id: 'note-gr4-math-fractions',
    topicId: 'top-gr4-math-2',
    grade: 4,
    subject: 'Mathematics',
    title: 'Understanding Fractions: Part of a Whole & Equal Portions',
    summary: 'Master proper fractions, numerators, denominators, and addition of like fractions with real visual models.',
    content: `
### 1. What is a Fraction?
A fraction represents **one or more equal parts of a whole**. 
When an item is divided into equal portions, each portion is a fraction.

- **Numerator (Top Number)**: Tells us how many equal parts are selected or considered.
- **Denominator (Bottom Number)**: Tells us the total number of equal parts the whole is divided into.

Example: In the fraction 3/4:
- 3 is the **Numerator** (3 parts taken).
- 4 is the **Denominator** (4 equal parts in total).

---

### 2. Types of Fractions
1. **Proper Fractions**: The numerator is strictly less than the denominator (e.g., 1/2, 3/4, 5/8).
2. **Improper Fractions**: The numerator is greater than or equal to the denominator (e.g., 5/3, 7/4).
3. **Mixed Numbers**: A whole number combined with a proper fraction (e.g., 1 1/2).

---

### 3. Adding Fractions with the Same Denominator
When denominators are identical, simply add the numerators together and keep the denominator unchanged:

$$\\frac{1}{2} + \\frac{1}{2} = \\frac{1 + 1}{2} = \\frac{2}{2} = 1$$

$$\\frac{2}{5} + \\frac{1}{5} = \\frac{2 + 1}{5} = \\frac{3}{5}$$

---

### 4. Finding a Fraction of a Given Quantity
To calculate a fraction of a quantity:
$$\\text{Fraction} \\times \\text{Total} = \\frac{\\text{Numerator}}{\\text{Denominator}} \\times \\text{Total}$$

Example: Find 3/4 of 20:
- Step 1: Divide 20 by the denominator 4: $20 \\div 4 = 5$
- Step 2: Multiply the result by the numerator 3: $5 \\times 3 = 15$
- **Result: 15**
    `,
    keyTakeaways: [
      'The numerator indicates portions taken; the denominator indicates total equal portions.',
      'When adding fractions with identical denominators, add only the numerators.',
      '3/4 of 20 equals 15 by calculating (20 ÷ 4) × 3.',
      'Always simplify fractions to their simplest form where applicable.'
    ],
    diagramUrl: '/src/assets/images/diagram_math_geometry_1790859731617.jpg',
    diagramCaption: 'Visual representation of fraction circular models and proportional division',
    author: 'Mr. David Kiprono',
    createdAt: '2026-09-15'
  },
  {
    id: 'note-gr4-sci-plants',
    topicId: 'top-gr4-sci-1',
    grade: 4,
    subject: 'Integrated Science',
    title: 'Plant Nutrition: Photosynthesis & Vascular Systems',
    summary: 'Explore how green plants manufacture food using sunlight, water, and carbon dioxide through chlorophyll.',
    content: `
### 1. Plant Nutrition (Photosynthesis)
Green plants are **autotrophs**—they make their own food through the process called **photosynthesis**.

The word photosynthesis comes from:
- *Photo* = Light
- *Synthesis* = Putting together

---

### 2. Requirements for Photosynthesis
For photosynthesis to take place, plants require four crucial components:
1. **Chlorophyll**: Green pigment inside chloroplasts that traps light energy.
2. **Sunlight**: Natural solar radiation providing energy for the chemical reaction.
3. **Carbon Dioxide ($CO_2$)**: Absorbed from the atmosphere through microscopic leaf pores called **stomata**.
4. **Water ($H_2O$)**: Absorbed from soil by root hairs and transported upward via xylem vessels.

---

### 3. Vascular Bundles: Xylem and Phloem
Plants have specialized transport tubes:
- **Xylem Vessels**: Conduct water and dissolved minerals from the roots upwards to stems and leaves.
- **Phloem Vessels**: Translocate manufactured sugars (glucose) from leaves to growing stems, storage roots, and fruits.

---

### 4. Word Equation of Photosynthesis
$$\\text{Carbon Dioxide} + \\text{Water} \\xrightarrow[\\text{Chlorophyll}]{\\text{Sunlight}} \\text{Glucose (Food)} + \\text{Oxygen}$$
    `,
    keyTakeaways: [
      'Photosynthesis produces glucose and releases vital oxygen into the atmosphere.',
      'Xylem conducts water and mineral salts upward from roots to leaves.',
      'Phloem distributes manufactured food from leaves to all other plant parts.',
      'Stomata control gas exchange in plant leaves.'
    ],
    diagramUrl: '/src/assets/images/diagram_science_ecosystem_1790859717590.jpg',
    diagramCaption: 'Cellular diagram of leaf photosynthesis, chloroplasts, and vascular transport',
    author: 'Mr. David Kiprono',
    createdAt: '2026-09-18'
  },
  {
    id: 'note-gr4-math-numbers',
    topicId: 'top-gr4-math-1',
    grade: 4,
    subject: 'Mathematics',
    title: 'Numbers: Place Value, Total Value & Rounding Off',
    summary: 'Master place values up to ten thousands and learn systematic rounding techniques.',
    content: `
### 1. Understanding Place Value
Every digit in a number has a value depending on its position:
- **Ten Thousands (T.Th)**
- **Thousands (Th)**
- **Hundreds (H)**
- **Tens (T)**
- **Ones (O)**

Example in the number **8,452**:
- 8 is in Thousands place: Total Value = $8 \\times 1000 = 8000$
- 4 is in Hundreds place: Total Value = $4 \\times 100 = 400$
- 5 is in Tens place: Total Value = $5 \\times 10 = 50$
- 2 is in Ones place: Total Value = $2 \\times 1 = 2$

---

### 2. Rounding Off Numbers
- **To the nearest 10**: Look at the digit in the Ones place. If it is 5 or greater, round up; if less than 5, round down.
- **To the nearest 100**: Look at the digit in the Tens place.
    `,
    keyTakeaways: [
      'Place value indicates the position of a digit in a numeral.',
      'Total value is the product of the digit and its place value.',
      'Digits 0-4 round down; digits 5-9 round up to the next unit.'
    ],
    author: 'Mr. David Kiprono',
    createdAt: '2026-09-10'
  },
  {
    id: 'note-gr8-pretech',
    topicId: 'top-gr8-pretech-1',
    grade: 8,
    subject: 'Pretechnical Education',
    title: 'Workshop Safety Protocols & Technical Drafting Tools',
    summary: 'Junior school foundation for occupational health, safety equipment, and orthographic drafting rules.',
    content: `
### 1. Workshop Safety Regulations
A technical workshop requires strict adherence to safety to prevent injuries:
- **Personal Protective Equipment (PPE)**: Safety goggles, leather aprons, steel-toed boots, and ear defenders.
- **Fire Precautions**: Familiarity with Carbon Dioxide ($CO_2$), Foam, and Water fire extinguishers.
- **Tidiness**: Keep walking aisles clear of wood shavings, metal turnings, and electrical cords.

---

### 2. Basic Technical Drafting Instruments
- **T-Square**: Used for drawing horizontal lines on the drawing board.
- **Set Squares (45° and 30°/60°)**: Used for precise angled and perpendicular lines.
- **Divider and Compass**: Used for transferring measurements and striking arcs.
    `,
    keyTakeaways: [
      'PPE must be inspected before starting any workshop activity.',
      'Clean workbenches minimize accidents and tool damage.',
      'Drawing instruments must be cleaned and stored in protective cases.'
    ],
    author: 'Mr. Peter Mutua',
    createdAt: '2026-09-20'
  }
];

export const INITIAL_VIDEOS: VideoLesson[] = [
  {
    id: 'vid-gr4-math-fractions',
    topicId: 'top-gr4-math-2',
    grade: 4,
    subject: 'Mathematics',
    title: 'Interactive Video: Visualizing Fractions with Geometric Shapes',
    durationMinutes: 14,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    videoThumbnail: '/src/assets/images/diagram_math_geometry_1790859731617.jpg',
    keyPoints: [
      'Visual breakdown of 1/2, 1/4, 3/4 using divided circles and chocolate bar models',
      'Step-by-step method to add fractions with common denominators',
      'Worked examples calculating 3/4 of 20 and 2/3 of 15',
      'Common pitfalls to avoid when simplifying answers'
    ],
    teacherName: 'Mr. David Kiprono',
    createdAt: '2026-09-16'
  },
  {
    id: 'vid-gr4-sci-plants',
    topicId: 'top-gr4-sci-1',
    grade: 4,
    subject: 'Integrated Science',
    title: 'Laboratory Demonstration: Investigating Photosynthesis in Green Leaves',
    durationMinutes: 18,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    videoThumbnail: '/src/assets/images/diagram_science_ecosystem_1790859717590.jpg',
    keyPoints: [
      'Testing a variegated leaf for the presence of starch with iodine solution',
      'Demonstration of oxygen bubbles released by Elodea pondweed under light',
      'Microscope view of open and closed stomatal guard cells',
      'Role of xylem and phloem vessels explained with food dye experiment'
    ],
    teacherName: 'Mr. David Kiprono',
    createdAt: '2026-09-19'
  }
];

export const INITIAL_AUDIOS: AudioLesson[] = [
  {
    id: 'aud-gr4-math-fractions',
    topicId: 'top-gr4-math-2',
    grade: 4,
    subject: 'Mathematics',
    title: 'Audio Masterclass: Mental Math with Fractions & Decimals',
    durationMinutes: 9,
    audioUrl: 'https://actions.google.com/sounds/v1/ambiences/outdoor_water_fountain.ogg',
    transcript: 'Welcome Grade 4 scholars to our EduSmart Audio Masterclass. Today we are unlocking mental math shortcuts for fractions. Remember, when someone asks you what is one half plus one half, do not hesitate—two halves make one whole! Now listen carefully to our word challenge: if a farmer has 20 eggs and sells three quarters of them, how many eggs are sold? Divide 20 into four equal baskets: each basket has 5 eggs. Take three baskets: 5 times 3 equals 15! Practice this anytime in your head.',
    keyPoints: [
      'Quick mental addition of common unit fractions',
      'Associating halves, quarters, and eighths with everyday objects',
      'Audio word problems to sharpen analytical listening'
    ],
    teacherName: 'Mr. David Kiprono',
    createdAt: '2026-09-17'
  },
  {
    id: 'aud-gr4-sci-plants',
    topicId: 'top-gr4-sci-1',
    grade: 4,
    subject: 'Integrated Science',
    title: 'Nature Audio Walk: The Secret Life of Plant Roots and Leaves',
    durationMinutes: 11,
    audioUrl: 'https://actions.google.com/sounds/v1/ambiences/gentle_rain.ogg',
    transcript: 'Step into the school botanical garden with Mr. Kiprono. Close your eyes and listen to the gentle breeze in the canopy. Those emerald green leaves are solar powered food factories. Right now, through tiny mouth-like pores called stomata, carbon dioxide enters the leaf while water ascends all the way from the roots through xylem conduits...',
    keyPoints: [
      'How plants act as the lungs and food providers of Planet Earth',
      'Sensory identification of tree bark, leaves, and vascular veins',
      'Conservation of indigenous trees in Kenya'
    ],
    teacherName: 'Mr. David Kiprono',
    createdAt: '2026-09-21'
  }
];

export const INITIAL_QUIZZES: Quiz[] = [
  {
    id: 'quiz-gr4-math-fractions',
    topicId: 'top-gr4-math-2',
    grade: 4,
    subject: 'Mathematics',
    title: 'Mathematics: Fractions Mastery Quiz',
    passPercentage: 70,
    timeLimitMinutes: 10,
    teacherName: 'Mr. David Kiprono',
    createdAt: '2026-09-20',
    questions: [
      {
        id: 'q1',
        questionText: 'What is 1/2 + 1/2 = ?',
        options: ['1', '2', '1/4', '1/3'],
        correctOptionIndex: 0,
        explanation: '1/2 + 1/2 = 2/2, which simplifies to 1 whole.'
      },
      {
        id: 'q2',
        questionText: 'Find 3/4 of 20 = ?',
        options: ['12', '15', '16', '18'],
        correctOptionIndex: 1,
        explanation: 'Divide 20 by 4 = 5. Then multiply by 3: 5 × 3 = 15.'
      },
      {
        id: 'q3',
        questionText: 'Which fraction is equivalent to 2/4?',
        options: ['1/2', '1/3', '3/4', '2/8'],
        correctOptionIndex: 0,
        explanation: 'Dividing both numerator and denominator of 2/4 by 2 gives 1/2.'
      },
      {
        id: 'q4',
        questionText: 'In the fraction 5/8, what is the number 8 called?',
        options: ['Numerator', 'Denominator', 'Quotient', 'Dividend'],
        correctOptionIndex: 1,
        explanation: 'The bottom number in a fraction is the denominator.'
      },
      {
        id: 'q5',
        questionText: 'A pupil ate 3/7 of a cake on Monday and 2/7 on Tuesday. What total fraction of cake was eaten?',
        options: ['5/14', '5/7', '1/7', '6/7'],
        correctOptionIndex: 1,
        explanation: 'Add numerators: 3/7 + 2/7 = 5/7.'
      }
    ]
  },
  {
    id: 'quiz-gr4-sci-plants',
    topicId: 'top-gr4-sci-1',
    grade: 4,
    subject: 'Integrated Science',
    title: 'Integrated Science: Plant Nutrition & Photosynthesis Quiz',
    passPercentage: 70,
    timeLimitMinutes: 12,
    teacherName: 'Mr. David Kiprono',
    createdAt: '2026-09-22',
    questions: [
      {
        id: 'qs1',
        questionText: 'Which green pigment in leaves absorbs solar energy for photosynthesis?',
        options: ['Chlorophyll', 'Melanin', 'Hemoglobin', 'Keratin'],
        correctOptionIndex: 0,
        explanation: 'Chlorophyll is the green pigment in chloroplasts responsible for trapping light.'
      },
      {
        id: 'qs2',
        questionText: 'Which vascular tube transports water and mineral salts from roots to leaves?',
        options: ['Phloem', 'Xylem', 'Stomata', 'Cortex'],
        correctOptionIndex: 1,
        explanation: 'Xylem conducts water and minerals upward, while phloem transports food.'
      },
      {
        id: 'qs3',
        questionText: 'What vital gas is produced and released by green plants during daylight photosynthesis?',
        options: ['Carbon Dioxide', 'Nitrogen', 'Oxygen', 'Methane'],
        correctOptionIndex: 2,
        explanation: 'Plants release oxygen ($O_2$) as a byproduct of photosynthesis.'
      }
    ]
  }
];

export const INITIAL_QUIZ_ATTEMPTS: QuizAttempt[] = [
  {
    id: 'att-1',
    quizId: 'quiz-gr4-math-fractions',
    quizTitle: 'Mathematics: Fractions Mastery Quiz',
    subject: 'Mathematics',
    grade: 4,
    studentId: 'usr-stu-brian',
    studentName: 'Brian Otieno',
    stream: 'Dove',
    score: 5,
    totalQuestions: 5,
    percentage: 100,
    passed: true,
    userAnswers: { q1: 0, q2: 1, q3: 0, q4: 1, q5: 1 },
    completedAt: '2026-09-25 10:45 AM'
  },
  {
    id: 'att-2',
    quizId: 'quiz-gr4-sci-plants',
    quizTitle: 'Integrated Science: Plant Nutrition & Photosynthesis',
    subject: 'Integrated Science',
    grade: 4,
    studentId: 'usr-stu-brian',
    studentName: 'Brian Otieno',
    stream: 'Dove',
    score: 3,
    totalQuestions: 3,
    percentage: 100,
    passed: true,
    userAnswers: { qs1: 0, qs2: 1, qs3: 2 },
    completedAt: '2026-09-26 02:15 PM'
  },
  {
    id: 'att-3',
    quizId: 'quiz-gr4-eng-vocab',
    quizTitle: 'English: Grammar & Reading Comprehension',
    subject: 'English',
    grade: 4,
    studentId: 'usr-stu-brian',
    studentName: 'Brian Otieno',
    stream: 'Dove',
    score: 4,
    totalQuestions: 5,
    percentage: 80,
    passed: true,
    userAnswers: { q1: 0, q2: 1, q3: 0, q4: 0, q5: 1 },
    completedAt: '2026-09-27 11:30 AM'
  },
  {
    id: 'att-4',
    quizId: 'quiz-gr4-agri-nutrition',
    quizTitle: 'Agriculture & Nutrition: Crops & Soil Fertility',
    subject: 'Agriculture and Nutrition',
    grade: 4,
    studentId: 'usr-stu-brian',
    studentName: 'Brian Otieno',
    stream: 'Dove',
    score: 4,
    totalQuestions: 5,
    percentage: 80,
    passed: true,
    userAnswers: { q1: 1, q2: 0, q3: 1, q4: 1, q5: 0 },
    completedAt: '2026-09-28 09:10 AM'
  },
  {
    id: 'att-5',
    quizId: 'quiz-gr4-math-decimals',
    quizTitle: 'Mathematics: Decimals & Place Value',
    subject: 'Mathematics',
    grade: 4,
    studentId: 'usr-stu-brian',
    studentName: 'Brian Otieno',
    stream: 'Dove',
    score: 4,
    totalQuestions: 5,
    percentage: 80,
    passed: true,
    userAnswers: { q1: 0, q2: 0, q3: 1, q4: 1, q5: 0 },
    completedAt: '2026-09-29 03:40 PM'
  },
  {
    id: 'att-6',
    quizId: 'quiz-gr4-social-studies',
    quizTitle: 'Social Studies: Physical Environment & Communities',
    subject: 'Social Studies',
    grade: 4,
    studentId: 'usr-stu-brian',
    studentName: 'Brian Otieno',
    stream: 'Dove',
    score: 5,
    totalQuestions: 5,
    percentage: 100,
    passed: true,
    userAnswers: { q1: 0, q2: 1, q3: 0, q4: 1, q5: 1 },
    completedAt: '2026-09-30 08:20 AM'
  },
  {
    id: 'att-7',
    quizId: 'quiz-gr4-math-fractions',
    quizTitle: 'Mathematics: Fractions Mastery Quiz',
    subject: 'Mathematics',
    grade: 4,
    studentId: 'usr-stu-amina',
    studentName: 'Amina Hassan',
    stream: 'Dove',
    score: 4,
    totalQuestions: 5,
    percentage: 80,
    passed: true,
    userAnswers: { q1: 0, q2: 1, q3: 0, q4: 0, q5: 1 },
    completedAt: '2026-09-25 11:10 AM'
  },
  {
    id: 'att-8',
    quizId: 'quiz-gr8-pretech',
    quizTitle: 'Pretechnical Education: Workshop Safety Protocols',
    subject: 'Pretechnical Education',
    grade: 8,
    studentId: 'usr-stu-faith',
    studentName: 'Faith Wanjiru',
    stream: 'Mara',
    score: 5,
    totalQuestions: 5,
    percentage: 100,
    passed: true,
    userAnswers: { q1: 0, q2: 1, q3: 0, q4: 1, q5: 1 },
    completedAt: '2026-09-27 10:00 AM'
  },
  {
    id: 'att-9',
    quizId: 'quiz-gr8-math-linear',
    quizTitle: 'Mathematics: Linear Equations in One Unknown',
    subject: 'Mathematics',
    grade: 8,
    studentId: 'usr-stu-faith',
    studentName: 'Faith Wanjiru',
    stream: 'Mara',
    score: 4,
    totalQuestions: 5,
    percentage: 80,
    passed: true,
    userAnswers: { q1: 1, q2: 0, q3: 1, q4: 1, q5: 0 },
    completedAt: '2026-09-28 01:30 PM'
  }
];

export const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asg-gr4-math-1',
    grade: 4,
    stream: 'Dove',
    subject: 'Mathematics',
    title: 'Practical Fraction Modeling with Household Items',
    instructions: 'Divide a piece of fruit or paper into 8 equal parts. Photograph or write down three fractions you can create (e.g., 2/8, 4/8, 6/8) and simplify them.',
    dueDate: '2026-10-06',
    maxScore: 20,
    teacherName: 'Mr. David Kiprono',
    teacherId: 'usr-teach-kiprono',
    submissionsCount: 4
  },
  {
    id: 'asg-gr4-sci-1',
    grade: 4,
    stream: 'Dove',
    subject: 'Integrated Science',
    title: 'Seed Germination Observation Journal',
    instructions: 'Plant 4 bean seeds in wet cotton wool or soil. Record the daily growth changes, root development, and emergence of first leaves over 5 days.',
    dueDate: '2026-10-08',
    maxScore: 25,
    teacherName: 'Mr. David Kiprono',
    teacherId: 'usr-teach-kiprono',
    submissionsCount: 3
  }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Mathematics Live Google Meet Lesson Reminder',
    content: 'All Grade 4 learners in Dove & Eagle streams are reminded to join our live Google Meet session on Fractions and Decimals. Have your exercise books, geometry ruler, and pencils ready.',
    type: 'lesson_reminder',
    targetGrade: 4,
    targetStream: 'Dove',
    author: 'Mr. David Kiprono',
    authorRole: 'Class Teacher',
    createdAt: '2026-10-01 07:30 AM',
    meetLink: 'https://meet.google.com/edu-gr4-dove',
    scheduledTime: 'Today at 10:00 AM'
  },
  {
    id: 'ann-2',
    title: 'CBC Term 1 Assessment & Mid-Term Schedule',
    content: 'The school continuous assessment tests for Grades 1 to 9 will commence next week. Learners are advised to review notes and attempt all topical quizzes in their student workspace.',
    type: 'general',
    author: 'Ms. Beatrice Wanjiku',
    authorRole: 'Dean of Studies',
    createdAt: '2026-09-28 08:00 AM'
  },
  {
    id: 'ann-3',
    title: 'Junior School Pretechnical Workshop Orientation',
    content: 'Grade 8 Mara learners will have a practical session in the Technical Workshop on Friday. Full workshop safety gear (coats and closed footwear) is required.',
    type: 'general',
    targetGrade: 8,
    targetStream: 'Mara',
    author: 'Mr. Peter Mutua',
    authorRole: 'Subject Teacher',
    createdAt: '2026-09-29 09:15 AM'
  }
];

export const INITIAL_VIRTUAL_CLASSES: VirtualClassRoom[] = [
  {
    id: 'vc-gr4-dove',
    grade: 4,
    stream: 'Dove',
    subject: 'Mathematics',
    topic: 'Fractions & Mental Calculation Strategies',
    googleMeetLink: 'https://meet.google.com/edu-gr4-dove',
    isLive: true,
    teacherName: 'Mr. David Kiprono',
    scheduledTime: '10:00 AM - 10:45 AM',
    durationMinutes: 45
  },
  {
    id: 'vc-gr4-sci',
    grade: 4,
    stream: 'Dove',
    subject: 'Integrated Science',
    topic: 'Photosynthesis Virtual Lab Experiment',
    googleMeetLink: 'https://meet.google.com/edu-gr4-sci',
    isLive: false,
    teacherName: 'Mr. David Kiprono',
    scheduledTime: 'Tomorrow at 02:00 PM',
    durationMinutes: 40
  },
  {
    id: 'vc-gr8-mara',
    grade: 8,
    stream: 'Mara',
    subject: 'Pretechnical Education',
    topic: 'Technical Drafting and Orthographic Projections',
    googleMeetLink: 'https://meet.google.com/edu-gr8-mara',
    isLive: true,
    teacherName: 'Mr. Peter Mutua',
    scheduledTime: '11:15 AM - 12:00 PM',
    durationMinutes: 45
  }
];

export const INITIAL_WORK_ENTRY_LOGS: WorkEntryLog[] = [
  {
    id: 'wel-1',
    teacherId: 'usr-teach-kiprono',
    teacherName: 'Mr. David Kiprono',
    staffNo: 'TSC/44120/ED',
    firstName: 'David',
    lastName: 'Kiprono',
    email: 'mr.kiprono@edusmart.ac.ke',
    signInLocation: 'EduSmart Main Campus, Staffroom Block A · Nairobi Grounds',
    photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    geoStamp: {
      latitude: -1.2921,
      longitude: 36.8219,
      accuracy: 4,
      address: 'EduSmart Main Campus Gate A · Coordinates -1.2921° S, 36.8219° E (Campus Perimeter Verified)',
      verifiedCampus: true
    },
    date: '2026-09-30',
    time: '08:30 AM',
    grade: 4,
    stream: 'Dove',
    subject: 'Mathematics',
    topicTaught: 'Fractions: Addition of like fractions and word problems',
    objectivesCovered: 'Learners able to add fractions with same denominators and calculate fraction of a quantity.',
    learnersPresent: 38,
    teacherRemarks: 'Active participation. 35 out of 38 scored 80%+ on exit slip.',
    timestamp: '2026-09-30T08:30:00'
  },
  {
    id: 'wel-2',
    teacherId: 'usr-teach-kiprono',
    teacherName: 'Mr. David Kiprono',
    staffNo: 'TSC/44120/ED',
    firstName: 'David',
    lastName: 'Kiprono',
    email: 'mr.kiprono@edusmart.ac.ke',
    signInLocation: 'EduSmart Main Campus, Science Lab 1 · Nairobi Grounds',
    photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    geoStamp: {
      latitude: -1.2922,
      longitude: 36.8218,
      accuracy: 5,
      address: 'EduSmart Laboratory Complex · Coordinates -1.2922° S, 36.8218° E (Campus Perimeter Verified)',
      verifiedCampus: true
    },
    date: '2026-09-29',
    time: '11:00 AM',
    grade: 4,
    stream: 'Eagle',
    subject: 'Integrated Science',
    topicTaught: 'Plant Nutrition: Xylem and Phloem transport demonstration',
    objectivesCovered: 'Identified pathways of water and food through celery stalk experiment.',
    learnersPresent: 40,
    teacherRemarks: 'Practical experiment completed successfully. Students submitted laboratory diagrams.',
    timestamp: '2026-09-29T11:00:00'
  },
  {
    id: 'wel-3',
    teacherId: 'usr-teach-mutua',
    teacherName: 'Mr. Peter Mutua',
    staffNo: 'TSC/39821/ED',
    firstName: 'Peter',
    lastName: 'Mutua',
    email: 'mr.mutua@edusmart.ac.ke',
    signInLocation: 'EduSmart Technical Wing, Workshop 2 · Nairobi Grounds',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    geoStamp: {
      latitude: -1.2920,
      longitude: 36.8222,
      accuracy: 6,
      address: 'EduSmart Pre-Technical Workshop Gate · Coordinates -1.2920° S, 36.8222° E (Campus Perimeter Verified)',
      verifiedCampus: true
    },
    date: '2026-09-30',
    time: '09:45 AM',
    grade: 8,
    stream: 'Mara',
    subject: 'Pretechnical Education',
    topicTaught: 'Workshop Safety Protocols & PPE requirements',
    objectivesCovered: 'Mastered fire hazard management, eye protection, and tool storage safety.',
    learnersPresent: 36,
    teacherRemarks: 'Safety demonstration carried out in workshop. All students passed safety checklist.',
    timestamp: '2026-09-30T09:45:00'
  }
];

export const INITIAL_GATE_EXIT_PASSES: GateExitPass[] = [
  {
    id: 'gep-1',
    studentId: 'usr-stu-kelvin',
    studentName: 'Kelvin Kiprop',
    grade: 4,
    stream: 'Dove',
    teacherId: 'usr-teach-kiprono',
    teacherName: 'Mr. David Kiprono',
    departureTime: '11:30 AM',
    expectedReturnTime: '02:00 PM',
    reason: 'Dental appointment at Nairobi Hospital with medical card verification',
    guardianName: 'Dr. Joseph Kiprop (Father)',
    guardianPhone: '+254 722 891 042',
    gatePassCode: 'GP-4D-8921',
    status: 'active',
    approvedAt: '2026-10-01 11:15 AM'
  },
  {
    id: 'gep-2',
    studentId: 'usr-stu-sharon',
    studentName: 'Sharon Cherono',
    grade: 8,
    stream: 'Mara',
    teacherId: 'usr-teach-akinyi',
    teacherName: 'Mrs. Florence Akinyi',
    departureTime: '01:00 PM',
    reason: 'Sudden fever reported to sanatorium; signed out to parent for rest',
    guardianName: 'Grace Cherono (Mother)',
    guardianPhone: '+254 711 445 892',
    gatePassCode: 'GP-8M-3310',
    status: 'departed',
    approvedAt: '2026-09-30 12:45 PM'
  }
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-rec-4d-today',
    date: '2026-10-01',
    grade: 4,
    stream: 'Dove',
    teacherId: 'usr-teach-kiprono',
    teacherName: 'Mr. David Kiprono',
    records: [
      { studentId: 'usr-stu-brian', studentName: 'Brian Otieno', status: 'present' },
      { studentId: 'usr-stu-amina', studentName: 'Amina Hassan', status: 'present' },
      { studentId: 'usr-stu-kelvin', studentName: 'Kelvin Kiprop', status: 'excused', remarks: 'Medical appointment at clinic' },
      { studentId: 'usr-stu-mercy', studentName: 'Mercy Chebet', status: 'present' },
      { studentId: 'usr-stu-daniel', studentName: 'Daniel Njoroge', status: 'late', remarks: 'Arrived at 08:20 AM' }
    ],
    summary: {
      present: 3,
      absent: 0,
      late: 1,
      excused: 1,
      total: 5,
      attendanceRate: 80
    }
  },
  {
    id: 'att-rec-4d-sep30',
    date: '2026-09-30',
    grade: 4,
    stream: 'Dove',
    teacherId: 'usr-teach-kiprono',
    teacherName: 'Mr. David Kiprono',
    records: [
      { studentId: 'usr-stu-brian', studentName: 'Brian Otieno', status: 'present' },
      { studentId: 'usr-stu-amina', studentName: 'Amina Hassan', status: 'present' },
      { studentId: 'usr-stu-kelvin', studentName: 'Kelvin Kiprop', status: 'present' },
      { studentId: 'usr-stu-mercy', studentName: 'Mercy Chebet', status: 'present' },
      { studentId: 'usr-stu-daniel', studentName: 'Daniel Njoroge', status: 'present' }
    ],
    summary: {
      present: 5,
      absent: 0,
      late: 0,
      excused: 0,
      total: 5,
      attendanceRate: 100
    }
  },
  {
    id: 'att-rec-4d-sep29',
    date: '2026-09-29',
    grade: 4,
    stream: 'Dove',
    teacherId: 'usr-teach-kiprono',
    teacherName: 'Mr. David Kiprono',
    records: [
      { studentId: 'usr-stu-brian', studentName: 'Brian Otieno', status: 'present' },
      { studentId: 'usr-stu-amina', studentName: 'Amina Hassan', status: 'present' },
      { studentId: 'usr-stu-kelvin', studentName: 'Kelvin Kiprop', status: 'present' },
      { studentId: 'usr-stu-mercy', studentName: 'Mercy Chebet', status: 'present' },
      { studentId: 'usr-stu-daniel', studentName: 'Daniel Njoroge', status: 'absent', remarks: 'Reported fever & flu by parent' }
    ],
    summary: {
      present: 4,
      absent: 1,
      late: 0,
      excused: 0,
      total: 5,
      attendanceRate: 80
    }
  },
  {
    id: 'att-rec-4d-sep28',
    date: '2026-09-28',
    grade: 4,
    stream: 'Dove',
    teacherId: 'usr-teach-kiprono',
    teacherName: 'Mr. David Kiprono',
    records: [
      { studentId: 'usr-stu-brian', studentName: 'Brian Otieno', status: 'present' },
      { studentId: 'usr-stu-amina', studentName: 'Amina Hassan', status: 'present' },
      { studentId: 'usr-stu-kelvin', studentName: 'Kelvin Kiprop', status: 'present' },
      { studentId: 'usr-stu-mercy', studentName: 'Mercy Chebet', status: 'present' },
      { studentId: 'usr-stu-daniel', studentName: 'Daniel Njoroge', status: 'present' }
    ],
    summary: {
      present: 5,
      absent: 0,
      late: 0,
      excused: 0,
      total: 5,
      attendanceRate: 100
    }
  },
  // Grade 8 Mara
  {
    id: 'att-rec-8m-today',
    date: '2026-10-01',
    grade: 8,
    stream: 'Mara',
    teacherId: 'usr-teach-akinyi',
    teacherName: 'Mrs. Florence Akinyi',
    records: [
      { studentId: 'usr-stu-faith', studentName: 'Faith Wanjiru', status: 'present' },
      { studentId: 'usr-stu-ian', studentName: 'Ian Mwangi', status: 'present' },
      { studentId: 'usr-stu-sharon', studentName: 'Sharon Cherono', status: 'absent', remarks: 'Sick leave granted - high fever' },
      { studentId: 'usr-stu-victor', studentName: 'Victor Ochieng', status: 'present' }
    ],
    summary: {
      present: 3,
      absent: 1,
      late: 0,
      excused: 0,
      total: 4,
      attendanceRate: 75
    }
  }
];

export const INITIAL_TIMETABLE: TimetableSlot[] = [
  // ========================================================
  // GRADE 4 DOVE - COMPREHENSIVE WEEKLY CBC SCHEDULE
  // ========================================================
  // Monday
  { id: 'tt-4d-m1', grade: 4, stream: 'Dove', dayOfWeek: 'Monday', period: 1, startTime: '08:00', endTime: '08:40', subject: 'Mathematics', teacherName: 'Mr. David Kiprono', teacherEmail: 'mr.kiprono@edusmart.ac.ke', roomName: 'Classroom 4-Dove', roomOrMeetLink: 'https://meet.google.com/edu-gr4-dove', strandTopic: 'Fractions & Decimals in Everyday Life', materialsNeeded: ['Maths Pupil Book 4', 'Ruler', 'Pencil'], competencies: ['Critical Thinking', 'Problem Solving'] },
  { id: 'tt-4d-m2', grade: 4, stream: 'Dove', dayOfWeek: 'Monday', period: 2, startTime: '08:40', endTime: '09:20', subject: 'English', teacherName: 'Mrs. Florence Akinyi', teacherEmail: 'florence.akinyi@edusmart.ac.ke', roomName: 'Classroom 4-Dove', roomOrMeetLink: 'https://meet.google.com/edu-gr4-eng', strandTopic: 'Reading Comprehension: Our Environment', materialsNeeded: ['English Course Book 4', 'Exercise Book'], competencies: ['Communication', 'Digital Literacy'] },
  { id: 'tt-4d-m3', grade: 4, stream: 'Dove', dayOfWeek: 'Monday', period: 3, startTime: '09:40', endTime: '10:20', subject: 'Integrated Science', teacherName: 'Mr. David Kiprono', teacherEmail: 'mr.kiprono@edusmart.ac.ke', roomName: 'Junior Science Lab 1', roomOrMeetLink: 'https://meet.google.com/edu-gr4-sci', strandTopic: 'Living Things: Plant Classification and Habitats', materialsNeeded: ['Fresh leaf specimens', 'Hand lenses', 'Lab notebook'], competencies: ['Learning to Learn', 'Observation'] },
  { id: 'tt-4d-m4', grade: 4, stream: 'Dove', dayOfWeek: 'Monday', period: 4, startTime: '10:20', endTime: '11:00', subject: 'Kiswahili', teacherName: 'Mwalimu Omwamba', teacherEmail: 'omwamba@edusmart.ac.ke', roomName: 'Classroom 4-Dove', roomOrMeetLink: 'https://meet.google.com/edu-gr4-swa', strandTopic: 'Kusikiliza na Kuzungumza: Maadili Kazini', materialsNeeded: ['Kitabu cha Kiswahili Ghorofa ya 4'], competencies: ['Uzalendo', 'Mawasiliano'] },
  { id: 'tt-4d-m5', grade: 4, stream: 'Dove', dayOfWeek: 'Monday', period: 5, startTime: '11:00', endTime: '11:40', subject: 'Agriculture and Nutrition', teacherName: 'Mr. Peter Mutua', teacherEmail: 'peter.mutua@edusmart.ac.ke', roomName: 'Agricultural Demonstration Plot', strandTopic: 'Kitchen Gardening & Compost Pit Preparation', materialsNeeded: ['Garden gloves', 'Trowel'], competencies: ['Self-Efficacy', 'Collaboration'] },
  { id: 'tt-4d-m6', grade: 4, stream: 'Dove', dayOfWeek: 'Monday', period: 6, startTime: '11:40', endTime: '12:20', subject: 'Social Studies', teacherName: 'Mrs. Wanjiru', teacherEmail: 'wanjiru@edusmart.ac.ke', roomName: 'Classroom 4-Dove', strandTopic: 'Physical Environment of Our County', materialsNeeded: ['Kenya Atlas', 'Colored Pencils'], competencies: ['Citizenship'] },
  { id: 'tt-4d-m7', grade: 4, stream: 'Dove', dayOfWeek: 'Monday', period: 7, startTime: '13:20', endTime: '14:00', subject: 'Creative Arts', teacherName: 'Ms. Achieng', teacherEmail: 'achieng@edusmart.ac.ke', roomName: 'Fine Art & Music Studio', strandTopic: 'Color Wheel & Pattern Weaving', materialsNeeded: ['Drawing pad', 'Poster paints', 'Brush #4'], competencies: ['Creativity and Imagination'] },
  { id: 'tt-4d-m8', grade: 4, stream: 'Dove', dayOfWeek: 'Monday', period: 8, startTime: '14:00', endTime: '14:40', subject: 'Physical and Health Education', teacherName: 'Coach Benjamin Omwenga', teacherEmail: 'cocurricular@edusmart.ac.ke', roomName: 'Main Sports Pitch', strandTopic: 'Athletics: Relay Baton Passing Technique', materialsNeeded: ['PE Kit', 'Running shoes', 'Water bottle'], competencies: ['Collaboration', 'Physical Fitness'] },

  // Tuesday
  { id: 'tt-4d-t1', grade: 4, stream: 'Dove', dayOfWeek: 'Tuesday', period: 1, startTime: '08:00', endTime: '08:40', subject: 'Agriculture and Nutrition', teacherName: 'Mr. Peter Mutua', teacherEmail: 'peter.mutua@edusmart.ac.ke', roomName: 'Classroom 4-Dove', strandTopic: 'Crop Maintenance & Drip Irrigation Models' },
  { id: 'tt-4d-t2', grade: 4, stream: 'Dove', dayOfWeek: 'Tuesday', period: 2, startTime: '08:40', endTime: '09:20', subject: 'Mathematics', teacherName: 'Mr. David Kiprono', teacherEmail: 'mr.kiprono@edusmart.ac.ke', roomName: 'Classroom 4-Dove', roomOrMeetLink: 'https://meet.google.com/edu-gr4-dove', strandTopic: 'Multiplication Arrays & Mental Math Challenges' },
  { id: 'tt-4d-t3', grade: 4, stream: 'Dove', dayOfWeek: 'Tuesday', period: 3, startTime: '09:40', endTime: '10:20', subject: 'Social Studies', teacherName: 'Mrs. Wanjiru', teacherEmail: 'wanjiru@edusmart.ac.ke', roomName: 'Classroom 4-Dove', strandTopic: 'Cultural Heritage: Traditional Ceremonies' },
  { id: 'tt-4d-t4', grade: 4, stream: 'Dove', dayOfWeek: 'Tuesday', period: 4, startTime: '10:20', endTime: '11:00', subject: 'English', teacherName: 'Mrs. Florence Akinyi', teacherEmail: 'florence.akinyi@edusmart.ac.ke', roomName: 'Classroom 4-Dove', strandTopic: 'Grammar: Past Simple Regular & Irregular Verbs' },
  { id: 'tt-4d-t5', grade: 4, stream: 'Dove', dayOfWeek: 'Tuesday', period: 5, startTime: '11:00', endTime: '11:40', subject: 'Religious Education', teacherName: 'Pastor James', teacherEmail: 'pastor.james@edusmart.ac.ke', roomName: 'Classroom 4-Dove', strandTopic: 'Creation & Stewardship of Natural Resources' },
  { id: 'tt-4d-t6', grade: 4, stream: 'Dove', dayOfWeek: 'Tuesday', period: 6, startTime: '11:40', endTime: '12:20', subject: 'Integrated Science', teacherName: 'Mr. David Kiprono', teacherEmail: 'mr.kiprono@edusmart.ac.ke', roomName: 'Junior Science Lab 1', strandTopic: 'Water Cycle Experiment and Cloud Formation' },
  { id: 'tt-4d-t7', grade: 4, stream: 'Dove', dayOfWeek: 'Tuesday', period: 7, startTime: '13:20', endTime: '14:00', subject: 'Kiswahili', teacherName: 'Mwalimu Omwamba', teacherEmail: 'omwamba@edusmart.ac.ke', roomName: 'Classroom 4-Dove', strandTopic: 'Kusoma kwa Ufahamu: Usafi wa Kibinafsi' },
  { id: 'tt-4d-t8', grade: 4, stream: 'Dove', dayOfWeek: 'Tuesday', period: 8, startTime: '14:00', endTime: '14:40', subject: 'Creative Arts', teacherName: 'Ms. Achieng', teacherEmail: 'achieng@edusmart.ac.ke', roomName: 'Music Studio', strandTopic: 'Traditional Kenyan Percussion & Descant Recorder' },

  // Wednesday
  { id: 'tt-4d-w1', grade: 4, stream: 'Dove', dayOfWeek: 'Wednesday', period: 1, startTime: '08:00', endTime: '08:40', subject: 'Creative Arts', teacherName: 'Ms. Achieng', teacherEmail: 'achieng@edusmart.ac.ke', roomName: 'Art Studio', strandTopic: 'Clay Modeling: Domestic Utensils' },
  { id: 'tt-4d-w2', grade: 4, stream: 'Dove', dayOfWeek: 'Wednesday', period: 2, startTime: '08:40', endTime: '09:20', subject: 'Religious Education', teacherName: 'Pastor James', teacherEmail: 'pastor.james@edusmart.ac.ke', roomName: 'Classroom 4-Dove', strandTopic: 'Honesty and Integrity at School' },
  { id: 'tt-4d-w3', grade: 4, stream: 'Dove', dayOfWeek: 'Wednesday', period: 3, startTime: '09:40', endTime: '10:20', subject: 'Mathematics', teacherName: 'Mr. David Kiprono', teacherEmail: 'mr.kiprono@edusmart.ac.ke', roomName: 'Classroom 4-Dove', roomOrMeetLink: 'https://meet.google.com/edu-gr4-dove', strandTopic: 'Measurement: Length in Meters and Centimeters' },
  { id: 'tt-4d-w4', grade: 4, stream: 'Dove', dayOfWeek: 'Wednesday', period: 4, startTime: '10:20', endTime: '11:00', subject: 'Integrated Science', teacherName: 'Mr. David Kiprono', teacherEmail: 'mr.kiprono@edusmart.ac.ke', roomName: 'Junior Science Lab 1', strandTopic: 'Human Digestive System: Organs & Functions' },
  { id: 'tt-4d-w5', grade: 4, stream: 'Dove', dayOfWeek: 'Wednesday', period: 5, startTime: '11:00', endTime: '11:40', subject: 'English', teacherName: 'Mrs. Florence Akinyi', teacherEmail: 'florence.akinyi@edusmart.ac.ke', roomName: 'Classroom 4-Dove', strandTopic: 'Creative Writing: A Day at the County Market' },
  { id: 'tt-4d-w6', grade: 4, stream: 'Dove', dayOfWeek: 'Wednesday', period: 6, startTime: '11:40', endTime: '12:20', subject: 'Kiswahili', teacherName: 'Mwalimu Omwamba', teacherEmail: 'omwamba@edusmart.ac.ke', roomName: 'Classroom 4-Dove', strandTopic: 'Kuandika Insha: Sherehe ya Kuzaliwa' },
  { id: 'tt-4d-w7', grade: 4, stream: 'Dove', dayOfWeek: 'Wednesday', period: 7, startTime: '13:20', endTime: '14:00', subject: 'Agriculture and Nutrition', teacherName: 'Mr. Peter Mutua', teacherEmail: 'peter.mutua@edusmart.ac.ke', roomName: 'Classroom 4-Dove', strandTopic: 'Food Groups & Balanced Diet Planning' },
  { id: 'tt-4d-w8', grade: 4, stream: 'Dove', dayOfWeek: 'Wednesday', period: 8, startTime: '14:00', endTime: '14:40', subject: 'Physical and Health Education', teacherName: 'Coach Benjamin Omwenga', teacherEmail: 'cocurricular@edusmart.ac.ke', roomName: 'Swimming Pool / Field', strandTopic: 'Water Safety and Freestyle Kicking' },

  // Thursday
  { id: 'tt-4d-th1', grade: 4, stream: 'Dove', dayOfWeek: 'Thursday', period: 1, startTime: '08:00', endTime: '08:40', subject: 'Mathematics', teacherName: 'Mr. David Kiprono', teacherEmail: 'mr.kiprono@edusmart.ac.ke', roomName: 'Classroom 4-Dove', roomOrMeetLink: 'https://meet.google.com/edu-gr4-dove', strandTopic: 'Geometry: 2D Shapes & Symmetry Lines' },
  { id: 'tt-4d-th2', grade: 4, stream: 'Dove', dayOfWeek: 'Thursday', period: 2, startTime: '08:40', endTime: '09:20', subject: 'English', teacherName: 'Mrs. Florence Akinyi', teacherEmail: 'florence.akinyi@edusmart.ac.ke', roomName: 'Classroom 4-Dove', strandTopic: 'Poetry Recitation & Rhyme Schemes' },
  { id: 'tt-4d-th3', grade: 4, stream: 'Dove', dayOfWeek: 'Thursday', period: 3, startTime: '09:40', endTime: '10:20', subject: 'Kiswahili', teacherName: 'Mwalimu Omwamba', teacherEmail: 'omwamba@edusmart.ac.ke', roomName: 'Classroom 4-Dove', strandTopic: 'Msamiati: Vyombo vya Nyumbani' },
  { id: 'tt-4d-th4', grade: 4, stream: 'Dove', dayOfWeek: 'Thursday', period: 4, startTime: '10:20', endTime: '11:00', subject: 'Integrated Science', teacherName: 'Mr. David Kiprono', teacherEmail: 'mr.kiprono@edusmart.ac.ke', roomName: 'Junior Science Lab 1', strandTopic: 'Energy: Sources of Heat and Light' },
  { id: 'tt-4d-th5', grade: 4, stream: 'Dove', dayOfWeek: 'Thursday', period: 5, startTime: '11:00', endTime: '11:40', subject: 'Social Studies', teacherName: 'Mrs. Wanjiru', teacherEmail: 'wanjiru@edusmart.ac.ke', roomName: 'Classroom 4-Dove', strandTopic: 'Economic Activities: Fishing and Trade' },
  { id: 'tt-4d-th6', grade: 4, stream: 'Dove', dayOfWeek: 'Thursday', period: 6, startTime: '11:40', endTime: '12:20', subject: 'Religious Education', teacherName: 'Pastor James', teacherEmail: 'pastor.james@edusmart.ac.ke', roomName: 'Classroom 4-Dove', strandTopic: 'Forgiveness and Conflict Resolution' },
  { id: 'tt-4d-th7', grade: 4, stream: 'Dove', dayOfWeek: 'Thursday', period: 7, startTime: '13:20', endTime: '14:00', subject: 'Creative Arts', teacherName: 'Ms. Achieng', teacherEmail: 'achieng@edusmart.ac.ke', roomName: 'Drama & Elocution Room', strandTopic: 'Dramatic Skits on Road Safety' },
  { id: 'tt-4d-th8', grade: 4, stream: 'Dove', dayOfWeek: 'Thursday', period: 8, startTime: '14:00', endTime: '14:40', subject: 'Agriculture and Nutrition', teacherName: 'Mr. Peter Mutua', teacherEmail: 'peter.mutua@edusmart.ac.ke', roomName: 'Home Science Kitchen', strandTopic: 'Table Setting and Fruit Salad Prep' },

  // Friday
  { id: 'tt-4d-f1', grade: 4, stream: 'Dove', dayOfWeek: 'Friday', period: 1, startTime: '08:00', endTime: '08:40', subject: 'English', teacherName: 'Mrs. Florence Akinyi', teacherEmail: 'florence.akinyi@edusmart.ac.ke', roomName: 'Classroom 4-Dove', strandTopic: 'Spelling Bee & Vocabulary Expansion' },
  { id: 'tt-4d-f2', grade: 4, stream: 'Dove', dayOfWeek: 'Friday', period: 2, startTime: '08:40', endTime: '09:20', subject: 'Mathematics', teacherName: 'Mr. David Kiprono', teacherEmail: 'mr.kiprono@edusmart.ac.ke', roomName: 'Classroom 4-Dove', roomOrMeetLink: 'https://meet.google.com/edu-gr4-dove', strandTopic: 'Weekly Formative Diagnostic Assessment' },
  { id: 'tt-4d-f3', grade: 4, stream: 'Dove', dayOfWeek: 'Friday', period: 3, startTime: '09:40', endTime: '10:20', subject: 'Kiswahili', teacherName: 'Mwalimu Omwamba', teacherEmail: 'omwamba@edusmart.ac.ke', roomName: 'Classroom 4-Dove', strandTopic: 'Imla na Maswali ya Marudio' },
  { id: 'tt-4d-f4', grade: 4, stream: 'Dove', dayOfWeek: 'Friday', period: 4, startTime: '10:20', endTime: '11:00', subject: 'Integrated Science', teacherName: 'Mr. David Kiprono', teacherEmail: 'mr.kiprono@edusmart.ac.ke', roomName: 'Junior Science Lab 1', strandTopic: 'Science Project Presentations' },
  { id: 'tt-4d-f5', grade: 4, stream: 'Dove', dayOfWeek: 'Friday', period: 5, startTime: '11:00', endTime: '11:40', subject: 'Social Studies', teacherName: 'Mrs. Wanjiru', teacherEmail: 'wanjiru@edusmart.ac.ke', roomName: 'Classroom 4-Dove', strandTopic: 'County Government Administration' },
  { id: 'tt-4d-f6', grade: 4, stream: 'Dove', dayOfWeek: 'Friday', period: 6, startTime: '11:40', endTime: '12:20', subject: 'Physical and Health Education', teacherName: 'Coach Benjamin Omwenga', teacherEmail: 'cocurricular@edusmart.ac.ke', roomName: 'Main Field', strandTopic: 'Inter-House Mini Soccer Match' },
  { id: 'tt-4d-f7', grade: 4, stream: 'Dove', dayOfWeek: 'Friday', period: 7, startTime: '13:20', endTime: '14:00', subject: 'Creative Arts', teacherName: 'Ms. Achieng', teacherEmail: 'achieng@edusmart.ac.ke', roomName: 'School Hall', strandTopic: 'Choral Folk Song Rehearsal' },
  { id: 'tt-4d-f8', grade: 4, stream: 'Dove', dayOfWeek: 'Friday', period: 8, startTime: '14:00', endTime: '14:40', subject: 'Religious Education', teacherName: 'Pastor James', teacherEmail: 'pastor.james@edusmart.ac.ke', roomName: 'Classroom 4-Dove', strandTopic: 'Pastoral Counseling & Weekend Preparation' },

  // ========================================================
  // GRADE 8 MARA - JUNIOR SCHOOL CBC SCHEDULE
  // ========================================================
  { id: 'tt-8m-m1', grade: 8, stream: 'Mara', dayOfWeek: 'Monday', period: 1, startTime: '08:00', endTime: '08:40', subject: 'Pretechnical Education', teacherName: 'Mr. Peter Mutua', teacherEmail: 'peter.mutua@edusmart.ac.ke', roomName: 'Pre-Tech Workshop A', roomOrMeetLink: 'https://meet.google.com/edu-gr8-mara', strandTopic: 'Technical Drawing: Isometric Projections', materialsNeeded: ['T-Square', 'Drawing Board', 'Set Squares'] },
  { id: 'tt-8m-m2', grade: 8, stream: 'Mara', dayOfWeek: 'Monday', period: 2, startTime: '08:40', endTime: '09:20', subject: 'Mathematics', teacherName: 'Mr. David Kiprono', teacherEmail: 'mr.kiprono@edusmart.ac.ke', roomName: 'Classroom 8-Mara', strandTopic: 'Algebraic Expressions & Factorization' },
  { id: 'tt-8m-m3', grade: 8, stream: 'Mara', dayOfWeek: 'Monday', period: 3, startTime: '09:40', endTime: '10:20', subject: 'Integrated Science', teacherName: 'Dr. Arthur Mwangi', teacherEmail: 'headteacher@edusmart.ac.ke', roomName: 'Senior Chemistry Lab', strandTopic: 'Acids, Bases, and Universal Indicators' },
  { id: 'tt-8m-m4', grade: 8, stream: 'Mara', dayOfWeek: 'Monday', period: 4, startTime: '10:20', endTime: '11:00', subject: 'English', teacherName: 'Mrs. Florence Akinyi', teacherEmail: 'florence.akinyi@edusmart.ac.ke', roomName: 'Classroom 8-Mara', strandTopic: 'Critical Essay Analysis & Argumentative Structure' },
  { id: 'tt-8m-m5', grade: 8, stream: 'Mara', dayOfWeek: 'Monday', period: 5, startTime: '11:00', endTime: '11:40', subject: 'Social Studies', teacherName: 'Mrs. Wanjiru', teacherEmail: 'wanjiru@edusmart.ac.ke', roomName: 'Classroom 8-Mara', strandTopic: 'African Early Civilizations: Egypt and Mali' },
  { id: 'tt-8m-m6', grade: 8, stream: 'Mara', dayOfWeek: 'Monday', period: 6, startTime: '11:40', endTime: '12:20', subject: 'Kiswahili', teacherName: 'Mwalimu Omwamba', teacherEmail: 'omwamba@edusmart.ac.ke', roomName: 'Classroom 8-Mara', strandTopic: 'Uchambuzi wa Ushairi: Mashairi ya Kisasa' },
  { id: 'tt-8m-m7', grade: 8, stream: 'Mara', dayOfWeek: 'Monday', period: 7, startTime: '13:20', endTime: '14:00', subject: 'Agriculture and Nutrition', teacherName: 'Mr. Peter Mutua', teacherEmail: 'peter.mutua@edusmart.ac.ke', roomName: 'Agri Laboratory', strandTopic: 'Soil Testing: pH Levels and Nitrogen Content' },
  { id: 'tt-8m-m8', grade: 8, stream: 'Mara', dayOfWeek: 'Monday', period: 8, startTime: '14:00', endTime: '14:40', subject: 'Physical and Health Education', teacherName: 'Coach Benjamin Omwenga', teacherEmail: 'cocurricular@edusmart.ac.ke', roomName: 'Basketball Court', strandTopic: 'Tactical Formations and Defensive Rebounding' },

  // Tuesday
  { id: 'tt-8m-t1', grade: 8, stream: 'Mara', dayOfWeek: 'Tuesday', period: 1, startTime: '08:00', endTime: '08:40', subject: 'Integrated Science', teacherName: 'Dr. Arthur Mwangi', teacherEmail: 'headteacher@edusmart.ac.ke', roomName: 'Senior Physics Lab', strandTopic: 'Electrical Circuits: Series vs Parallel Resistance' },
  { id: 'tt-8m-t2', grade: 8, stream: 'Mara', dayOfWeek: 'Tuesday', period: 2, startTime: '08:40', endTime: '09:20', subject: 'Mathematics', teacherName: 'Mr. David Kiprono', teacherEmail: 'mr.kiprono@edusmart.ac.ke', roomName: 'Classroom 8-Mara', strandTopic: 'Linear Inequalities in One Unknown' },
  { id: 'tt-8m-t3', grade: 8, stream: 'Mara', dayOfWeek: 'Tuesday', period: 3, startTime: '09:40', endTime: '10:20', subject: 'Pretechnical Education', teacherName: 'Mr. Peter Mutua', teacherEmail: 'peter.mutua@edusmart.ac.ke', roomName: 'Computer Lab B', strandTopic: 'Computer Hardware Components & Motherboard Architecture' },
  { id: 'tt-8m-t4', grade: 8, stream: 'Mara', dayOfWeek: 'Tuesday', period: 4, startTime: '10:20', endTime: '11:00', subject: 'English', teacherName: 'Mrs. Florence Akinyi', teacherEmail: 'florence.akinyi@edusmart.ac.ke', roomName: 'Classroom 8-Mara', strandTopic: 'Comprehension: Scientific Technological Innovations' },
  { id: 'tt-8m-t5', grade: 8, stream: 'Mara', dayOfWeek: 'Tuesday', period: 5, startTime: '11:00', endTime: '11:40', subject: 'Kiswahili', teacherName: 'Mwalimu Omwamba', teacherEmail: 'omwamba@edusmart.ac.ke', roomName: 'Classroom 8-Mara', strandTopic: 'Sarufi: Ngeli za Nomino na Upatanisho wa Kisarufi' },
  { id: 'tt-8m-t6', grade: 8, stream: 'Mara', dayOfWeek: 'Tuesday', period: 6, startTime: '11:40', endTime: '12:20', subject: 'Creative Arts', teacherName: 'Ms. Achieng', teacherEmail: 'achieng@edusmart.ac.ke', roomName: 'Design Studio', strandTopic: 'Graphic Design: Poster Typography and Visual Layout' },
  { id: 'tt-8m-t7', grade: 8, stream: 'Mara', dayOfWeek: 'Tuesday', period: 7, startTime: '13:20', endTime: '14:00', subject: 'Religious Education', teacherName: 'Pastor James', teacherEmail: 'pastor.james@edusmart.ac.ke', roomName: 'Classroom 8-Mara', strandTopic: 'Christian / Islamic Perspectives on Bioethics and Health' },
  { id: 'tt-8m-t8', grade: 8, stream: 'Mara', dayOfWeek: 'Tuesday', period: 8, startTime: '14:00', endTime: '14:40', subject: 'Social Studies', teacherName: 'Mrs. Wanjiru', teacherEmail: 'wanjiru@edusmart.ac.ke', roomName: 'Classroom 8-Mara', strandTopic: 'Regional Economic Blocs: EAC and COMESA' },

  // Wednesday
  { id: 'tt-8m-w1', grade: 8, stream: 'Mara', dayOfWeek: 'Wednesday', period: 1, startTime: '08:00', endTime: '08:40', subject: 'Mathematics', teacherName: 'Mr. David Kiprono', teacherEmail: 'mr.kiprono@edusmart.ac.ke', roomName: 'Classroom 8-Mara', strandTopic: 'Pythagoras Theorem in Real-Life Surveying' },
  { id: 'tt-8m-w2', grade: 8, stream: 'Mara', dayOfWeek: 'Wednesday', period: 2, startTime: '08:40', endTime: '09:20', subject: 'Integrated Science', teacherName: 'Dr. Arthur Mwangi', teacherEmail: 'headteacher@edusmart.ac.ke', roomName: 'Senior Biology Lab', strandTopic: 'Cell Division: Mitosis and Meiosis Under Microscope' },
  { id: 'tt-8m-w3', grade: 8, stream: 'Mara', dayOfWeek: 'Wednesday', period: 3, startTime: '09:40', endTime: '10:20', subject: 'English', teacherName: 'Mrs. Florence Akinyi', teacherEmail: 'florence.akinyi@edusmart.ac.ke', roomName: 'Classroom 8-Mara', strandTopic: 'Public Speaking: Parliamentary Debate Motions' },
  { id: 'tt-8m-w4', grade: 8, stream: 'Mara', dayOfWeek: 'Wednesday', period: 4, startTime: '10:20', endTime: '11:00', subject: 'Pretechnical Education', teacherName: 'Mr. Peter Mutua', teacherEmail: 'peter.mutua@edusmart.ac.ke', roomName: 'Pre-Tech Workshop A', strandTopic: 'Woodwork Joinery: Mortise and Tenon Joints' },
  { id: 'tt-8m-w5', grade: 8, stream: 'Mara', dayOfWeek: 'Wednesday', period: 5, startTime: '11:00', endTime: '11:40', subject: 'Social Studies', teacherName: 'Mrs. Wanjiru', teacherEmail: 'wanjiru@edusmart.ac.ke', roomName: 'Classroom 8-Mara', strandTopic: 'Environmental Conservation & Climate Change Mitigation' },
  { id: 'tt-8m-w6', grade: 8, stream: 'Mara', dayOfWeek: 'Wednesday', period: 6, startTime: '11:40', endTime: '12:20', subject: 'Kiswahili', teacherName: 'Mwalimu Omwamba', teacherEmail: 'omwamba@edusmart.ac.ke', roomName: 'Classroom 8-Mara', strandTopic: 'Uandishi Bunifu: Tahariri ya Gazeti' },
  { id: 'tt-8m-w7', grade: 8, stream: 'Mara', dayOfWeek: 'Wednesday', period: 7, startTime: '13:20', endTime: '14:00', subject: 'Agriculture and Nutrition', teacherName: 'Mr. Peter Mutua', teacherEmail: 'peter.mutua@edusmart.ac.ke', roomName: 'Poultry Farm Bay', strandTopic: 'Poultry Management: Vaccination and Brooding Cycles' },
  { id: 'tt-8m-w8', grade: 8, stream: 'Mara', dayOfWeek: 'Wednesday', period: 8, startTime: '14:00', endTime: '14:40', subject: 'Creative Arts', teacherName: 'Ms. Achieng', teacherEmail: 'achieng@edusmart.ac.ke', roomName: 'Music Auditorium', strandTopic: 'Ensemble Performance & Digital Audio Workstations (DAW)' },

  // Thursday
  { id: 'tt-8m-th1', grade: 8, stream: 'Mara', dayOfWeek: 'Thursday', period: 1, startTime: '08:00', endTime: '08:40', subject: 'Integrated Science', teacherName: 'Dr. Arthur Mwangi', teacherEmail: 'headteacher@edusmart.ac.ke', roomName: 'Senior Lab 2', strandTopic: 'Force, Pressure, and Hydraulic Systems' },
  { id: 'tt-8m-th2', grade: 8, stream: 'Mara', dayOfWeek: 'Thursday', period: 2, startTime: '08:40', endTime: '09:20', subject: 'Mathematics', teacherName: 'Mr. David Kiprono', teacherEmail: 'mr.kiprono@edusmart.ac.ke', roomName: 'Classroom 8-Mara', strandTopic: 'Commercial Arithmetic: Profit, Loss & Compound Interest' },
  { id: 'tt-8m-th3', grade: 8, stream: 'Mara', dayOfWeek: 'Thursday', period: 3, startTime: '09:40', endTime: '10:20', subject: 'Pretechnical Education', teacherName: 'Mr. Peter Mutua', teacherEmail: 'peter.mutua@edusmart.ac.ke', roomName: 'Computer Lab A', strandTopic: 'Introduction to Python Programming: Loops and Conditionals' },
  { id: 'tt-8m-th4', grade: 8, stream: 'Mara', dayOfWeek: 'Thursday', period: 4, startTime: '10:20', endTime: '11:00', subject: 'Kiswahili', teacherName: 'Mwalimu Omwamba', teacherEmail: 'omwamba@edusmart.ac.ke', roomName: 'Classroom 8-Mara', strandTopic: 'Fasihi Simulizi: Miviga na Ulumbi' },
  { id: 'tt-8m-th5', grade: 8, stream: 'Mara', dayOfWeek: 'Thursday', period: 5, startTime: '11:00', endTime: '11:40', subject: 'English', teacherName: 'Mrs. Florence Akinyi', teacherEmail: 'florence.akinyi@edusmart.ac.ke', roomName: 'Classroom 8-Mara', strandTopic: 'Direct and Indirect Speech in Dialogue' },
  { id: 'tt-8m-th6', grade: 8, stream: 'Mara', dayOfWeek: 'Thursday', period: 6, startTime: '11:40', endTime: '12:20', subject: 'Religious Education', teacherName: 'Pastor James', teacherEmail: 'pastor.james@edusmart.ac.ke', roomName: 'Classroom 8-Mara', strandTopic: 'Youth Leadership & Social Justice' },
  { id: 'tt-8m-th7', grade: 8, stream: 'Mara', dayOfWeek: 'Thursday', period: 7, startTime: '13:20', endTime: '14:00', subject: 'Social Studies', teacherName: 'Mrs. Wanjiru', teacherEmail: 'wanjiru@edusmart.ac.ke', roomName: 'Classroom 8-Mara', strandTopic: 'The Constitution of Kenya 2010: Bill of Rights' },
  { id: 'tt-8m-th8', grade: 8, stream: 'Mara', dayOfWeek: 'Thursday', period: 8, startTime: '14:00', endTime: '14:40', subject: 'Physical and Health Education', teacherName: 'Coach Benjamin Omwenga', teacherEmail: 'cocurricular@edusmart.ac.ke', roomName: 'Volleyball Court', strandTopic: 'Overhead Serving and Setting Precision' },

  // Friday
  { id: 'tt-8m-f1', grade: 8, stream: 'Mara', dayOfWeek: 'Friday', period: 1, startTime: '08:00', endTime: '08:40', subject: 'Mathematics', teacherName: 'Mr. David Kiprono', teacherEmail: 'mr.kiprono@edusmart.ac.ke', roomName: 'Classroom 8-Mara', strandTopic: 'Coordinate Geometry: Plotting Straight Lines' },
  { id: 'tt-8m-f2', grade: 8, stream: 'Mara', dayOfWeek: 'Friday', period: 2, startTime: '08:40', endTime: '09:20', subject: 'English', teacherName: 'Mrs. Florence Akinyi', teacherEmail: 'florence.akinyi@edusmart.ac.ke', roomName: 'Classroom 8-Mara', strandTopic: 'Comprehension & Vocabulary Masterclass' },
  { id: 'tt-8m-f3', grade: 8, stream: 'Mara', dayOfWeek: 'Friday', period: 3, startTime: '09:40', endTime: '10:20', subject: 'Integrated Science', teacherName: 'Dr. Arthur Mwangi', teacherEmail: 'headteacher@edusmart.ac.ke', roomName: 'Senior Lab 1', strandTopic: 'Weekly Science Practical & Lab Write-Up' },
  { id: 'tt-8m-f4', grade: 8, stream: 'Mara', dayOfWeek: 'Friday', period: 4, startTime: '10:20', endTime: '11:00', subject: 'Pretechnical Education', teacherName: 'Mr. Peter Mutua', teacherEmail: 'peter.mutua@edusmart.ac.ke', roomName: 'Pre-Tech Workshop B', strandTopic: 'Electrical Safety & Soldering Practice' },
  { id: 'tt-8m-f5', grade: 8, stream: 'Mara', dayOfWeek: 'Friday', period: 5, startTime: '11:00', endTime: '11:40', subject: 'Kiswahili', teacherName: 'Mwalimu Omwamba', teacherEmail: 'omwamba@edusmart.ac.ke', roomName: 'Classroom 8-Mara', strandTopic: 'Majadiliano ya Vikundi: Utunzaji wa Mazingira' },
  { id: 'tt-8m-f6', grade: 8, stream: 'Mara', dayOfWeek: 'Friday', period: 6, startTime: '11:40', endTime: '12:20', subject: 'Agriculture and Nutrition', teacherName: 'Mr. Peter Mutua', teacherEmail: 'peter.mutua@edusmart.ac.ke', roomName: 'Agri Garden', strandTopic: 'Harvesting & Farm Produce Post-Harvest Handling' },
  { id: 'tt-8m-f7', grade: 8, stream: 'Mara', dayOfWeek: 'Friday', period: 7, startTime: '13:20', endTime: '14:00', subject: 'Creative Arts', teacherName: 'Ms. Achieng', teacherEmail: 'achieng@edusmart.ac.ke', roomName: 'Art Studio', strandTopic: 'Sculptural Exhibition & Portfolio Review' },
  { id: 'tt-8m-f8', grade: 8, stream: 'Mara', dayOfWeek: 'Friday', period: 8, startTime: '14:00', endTime: '14:40', subject: 'Physical and Health Education', teacherName: 'Coach Benjamin Omwenga', teacherEmail: 'cocurricular@edusmart.ac.ke', roomName: 'Main Sports Complex', strandTopic: 'House Athletic League & Fitness Assessment' }
];

export const INITIAL_REPORT_CARDS: ReportCard[] = [
  {
    id: 'rep-brian-term1',
    studentId: 'usr-stu-brian',
    studentName: 'Brian Otieno',
    admissionNumber: 'ADM/2023/0412',
    grade: 4,
    stream: 'Dove',
    term: 'Term 1',
    academicYear: 2026,
    subjects: [
      { subject: 'Mathematics', openerScore: 28, midTermScore: 29, endTermScore: 38, total: 95, gradeLetter: 'A', rubricLevel: 'Exceeding Expectations', remarks: 'Exceptional mathematical grasp in Fractions and Decimals.', teacherName: 'Mr. David Kiprono' },
      { subject: 'English', openerScore: 25, midTermScore: 27, endTermScore: 36, total: 88, gradeLetter: 'A', rubricLevel: 'Exceeding Expectations', remarks: 'Fluent expressive reader with rich creative vocabulary.', teacherName: 'Mrs. Florence Akinyi' },
      { subject: 'Kiswahili', openerScore: 24, midTermScore: 26, endTermScore: 35, total: 85, gradeLetter: 'A', rubricLevel: 'Exceeding Expectations', remarks: 'Umahiri mzuri katika Insha na Sarufi.', teacherName: 'Mwalimu Omwamba' },
      { subject: 'Integrated Science', openerScore: 26, midTermScore: 28, endTermScore: 37, total: 91, gradeLetter: 'A', rubricLevel: 'Exceeding Expectations', remarks: 'Inquisitive scientific thinker, excellent lab diagrams.', teacherName: 'Mr. David Kiprono' },
      { subject: 'Agriculture and Nutrition', openerScore: 23, midTermScore: 25, endTermScore: 34, total: 82, gradeLetter: 'A', rubricLevel: 'Meeting Expectations', remarks: 'Active in garden projects and nutritional budgeting.', teacherName: 'Mr. Peter Mutua' },
      { subject: 'Social Studies', openerScore: 24, midTermScore: 26, endTermScore: 34, total: 84, gradeLetter: 'A', rubricLevel: 'Meeting Expectations', remarks: 'Sound knowledge of Kenyan physical features and history.', teacherName: 'Mrs. Wanjiru' },
      { subject: 'Religious Education', openerScore: 27, midTermScore: 28, endTermScore: 36, total: 91, gradeLetter: 'A', rubricLevel: 'Exceeding Expectations', remarks: 'Exemplary moral character and scripture synthesis.', teacherName: 'Pastor James' },
      { subject: 'Creative Arts', openerScore: 25, midTermScore: 26, endTermScore: 35, total: 86, gradeLetter: 'A', rubricLevel: 'Exceeding Expectations', remarks: 'Skilled in watercolor blending and rhythmic arts.', teacherName: 'Ms. Achieng' }
    ],
    overallAverage: 87.8,
    overallRubric: 'Exceeding Expectations',
    streamPosition: 1,
    totalStudentsInStream: 42,
    classTeacherRemarks: 'Brian is an outstanding, disciplined pupil who exhibits stellar leadership as Class Monitor. Excellent Term 1 performance.',
    headTeacherRemarks: 'Splendid results! Keep up the brilliant standard of academic excellence and good manners.',
    attendanceDays: 68,
    totalSchoolDays: 70,
    nextTermBegins: '2026-05-04'
  },
  {
    id: 'rep-amina-term1',
    studentId: 'usr-stu-amina',
    studentName: 'Amina Hassan',
    admissionNumber: 'ADM/2023/0413',
    grade: 4,
    stream: 'Dove',
    term: 'Term 1',
    academicYear: 2026,
    subjects: [
      { subject: 'Mathematics', openerScore: 24, midTermScore: 26, endTermScore: 34, total: 84, gradeLetter: 'A', rubricLevel: 'Meeting Expectations', remarks: 'Good accuracy in computation; continue practicing word sums.', teacherName: 'Mr. David Kiprono' },
      { subject: 'English', openerScore: 27, midTermScore: 28, endTermScore: 37, total: 92, gradeLetter: 'A', rubricLevel: 'Exceeding Expectations', remarks: 'Top orator in debates with impeccable comprehension.', teacherName: 'Mrs. Florence Akinyi' },
      { subject: 'Kiswahili', openerScore: 27, midTermScore: 28, endTermScore: 38, total: 93, gradeLetter: 'A', rubricLevel: 'Exceeding Expectations', remarks: 'Kazi safi sana ya ushairi na utungaji.', teacherName: 'Mwalimu Omwamba' },
      { subject: 'Integrated Science', openerScore: 24, midTermScore: 25, endTermScore: 33, total: 82, gradeLetter: 'A', rubricLevel: 'Meeting Expectations', remarks: 'Strong grasp of environmental conservation.', teacherName: 'Mr. David Kiprono' },
      { subject: 'Agriculture and Nutrition', openerScore: 25, midTermScore: 26, endTermScore: 35, total: 86, gradeLetter: 'A', rubricLevel: 'Exceeding Expectations', remarks: 'Passionate in kitchen gardening projects.', teacherName: 'Mr. Peter Mutua' },
      { subject: 'Social Studies', openerScore: 26, midTermScore: 27, endTermScore: 35, total: 88, gradeLetter: 'A', rubricLevel: 'Exceeding Expectations', remarks: 'Deep appreciation of national cohesion.', teacherName: 'Mrs. Wanjiru' },
      { subject: 'Religious Education', openerScore: 28, midTermScore: 29, endTermScore: 38, total: 95, gradeLetter: 'A', rubricLevel: 'Exceeding Expectations', remarks: 'Outstanding diligence and ethical discussions.', teacherName: 'Pastor James' },
      { subject: 'Creative Arts', openerScore: 24, midTermScore: 25, endTermScore: 33, total: 82, gradeLetter: 'A', rubricLevel: 'Meeting Expectations', remarks: 'Creative in beadwork and fabric decorations.', teacherName: 'Ms. Achieng' }
    ],
    overallAverage: 87.75,
    overallRubric: 'Exceeding Expectations',
    streamPosition: 2,
    totalStudentsInStream: 42,
    classTeacherRemarks: 'Amina is a respectful, hardworking and consistent pupil. Excellent contribution to class projects.',
    headTeacherRemarks: 'Very commendable accomplishment. Congratulations on your great Term 1 mark.',
    attendanceDays: 70,
    totalSchoolDays: 70,
    nextTermBegins: '2026-05-04'
  }
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    senderId: 'usr-teach-kiprono',
    senderName: 'Mr. David Kiprono',
    senderRole: 'class_teacher',
    grade: 4,
    stream: 'Dove',
    message: 'Good morning Grade 4 Dove scholars! Please ensure you have reviewed the Fractions notes before our 10:00 AM Google Meet session.',
    timestamp: '08:15 AM',
    isDirect: false
  },
  {
    id: 'msg-2',
    senderId: 'usr-stu-brian',
    senderName: 'Brian Otieno',
    senderRole: 'student',
    grade: 4,
    stream: 'Dove',
    message: 'Good morning Teacher Kiprono. We have reviewed Topic 2 and attempted the mental quiz.',
    timestamp: '08:22 AM',
    isDirect: false
  },
  {
    id: 'msg-3',
    senderId: 'usr-stu-brian',
    senderName: 'Brian Otieno',
    senderRole: 'student',
    grade: 4,
    recipientId: 'usr-teach-kiprono',
    recipientName: 'Mr. David Kiprono',
    message: 'Teacher Kiprono, on Question 4 of the Fractions worksheet, when simplifying 6/8 do we divide by 2?',
    timestamp: '09:05 AM',
    isDirect: true
  },
  {
    id: 'msg-4',
    senderId: 'usr-teach-kiprono',
    senderName: 'Mr. David Kiprono',
    senderRole: 'class_teacher',
    grade: 4,
    recipientId: 'usr-stu-brian',
    recipientName: 'Brian Otieno',
    message: 'Yes Brian! 6 divided by 2 is 3, and 8 divided by 2 is 4, which gives 3/4. Spot on!',
    timestamp: '09:12 AM',
    isDirect: true
  }
];

export const INITIAL_LIBRARY_BOOKS: LibraryBook[] = [
  {
    id: 'bk-cbc-math-4',
    isbn: '978-9966-25-104-1',
    title: 'KLB Top Scholar Mathematics Learner\'s Book Grade 4',
    author: 'Kenya Literature Bureau (KLB)',
    publisher: 'KLB Publishing',
    category: 'CBC Textbook',
    grade: 4,
    subject: 'Mathematics',
    copiesAvailable: 42,
    totalCopies: 45,
    locationShelf: 'Shelf M-04A'
  },
  {
    id: 'bk-cbc-sci-4',
    isbn: '978-9966-36-882-3',
    title: 'Spark Integrated Science Learner\'s Book Grade 4',
    author: 'Oxford University Press East Africa',
    publisher: 'Oxford EA',
    category: 'CBC Textbook',
    grade: 4,
    subject: 'Integrated Science',
    copiesAvailable: 38,
    totalCopies: 40,
    locationShelf: 'Shelf S-04B'
  },
  {
    id: 'bk-cbc-agri-4',
    isbn: '978-9966-10-551-2',
    title: 'Spotlight Agriculture & Nutrition Grade 4',
    author: 'Spotlight Publishers',
    publisher: 'Spotlight EA',
    category: 'CBC Textbook',
    grade: 4,
    subject: 'Agriculture and Nutrition',
    copiesAvailable: 35,
    totalCopies: 35,
    locationShelf: 'Shelf A-04C'
  },
  {
    id: 'bk-cbc-eng-8',
    isbn: '978-9966-44-902-1',
    title: 'Junior Secondary English Course Grade 8',
    author: 'Longhorn Publishers',
    publisher: 'Longhorn Kenya',
    category: 'CBC Textbook',
    grade: 8,
    subject: 'English',
    copiesAvailable: 28,
    totalCopies: 30,
    locationShelf: 'Shelf E-08A'
  },
  {
    id: 'bk-cbc-pretech-8',
    isbn: '978-9966-55-110-9',
    title: 'Pre-Technical Studies Learner\'s Guide Grade 8',
    author: 'Moran Publishers',
    publisher: 'Moran EA',
    category: 'CBC Textbook',
    grade: 8,
    subject: 'Pretechnical Education',
    copiesAvailable: 22,
    totalCopies: 25,
    locationShelf: 'Shelf P-08B'
  },
  {
    id: 'bk-story-chike',
    isbn: '978-0435-900-24-3',
    title: 'Chike and the River',
    author: 'Chinua Achebe',
    publisher: 'Heinemann African Writers',
    category: 'Fiction Storybook',
    copiesAvailable: 14,
    totalCopies: 15,
    locationShelf: 'Shelf FIC-ACH'
  },
  {
    id: 'bk-story-weep',
    isbn: '978-0143-106-99-9',
    title: 'Weep Not, Child',
    author: 'Ngũgĩ wa Thiong\'o',
    publisher: 'Penguin Classics',
    category: 'Supplementary Reader',
    copiesAvailable: 11,
    totalCopies: 12,
    locationShelf: 'Shelf LIT-NGU'
  }
];

export const INITIAL_BORROW_RECORDS: LibraryBorrowRecord[] = [
  {
    id: 'bor-1',
    bookId: 'bk-cbc-math-4',
    bookTitle: 'KLB Top Scholar Mathematics Learner\'s Book Grade 4',
    borrowerId: 'usr-stu-brian',
    borrowerName: 'Brian Otieno',
    borrowerRole: 'student',
    grade: 4,
    stream: 'Dove',
    borrowedDate: '2026-09-24',
    dueDate: '2026-10-08',
    status: 'active',
    remarks: 'Fractions study guide assigned by Mr. Kiprono'
  },
  {
    id: 'bor-2',
    bookId: 'bk-cbc-sci-4',
    bookTitle: 'Spark Integrated Science Learner\'s Book Grade 4',
    borrowerId: 'usr-stu-amina',
    borrowerName: 'Amina Hassan',
    borrowerRole: 'student',
    grade: 4,
    stream: 'Dove',
    borrowedDate: '2026-09-20',
    dueDate: '2026-10-04',
    status: 'active'
  },
  {
    id: 'bor-3',
    bookId: 'bk-story-chike',
    bookTitle: 'Chike and the River',
    borrowerId: 'usr-stu-kelvin',
    borrowerName: 'Kelvin Kiprop',
    borrowerRole: 'student',
    grade: 4,
    stream: 'Dove',
    borrowedDate: '2026-09-15',
    dueDate: '2026-09-29',
    status: 'overdue',
    remarks: 'First reminder sent'
  },
  {
    id: 'bor-4',
    bookId: 'bk-cbc-pretech-8',
    bookTitle: 'Pre-Technical Studies Learner\'s Guide Grade 8',
    borrowerId: 'usr-teach-mutua',
    borrowerName: 'Mr. Peter Mutua',
    borrowerRole: 'teacher',
    borrowedDate: '2026-09-22',
    dueDate: '2026-10-22',
    status: 'active',
    remarks: 'Lesson preparation'
  }
];

export const INITIAL_LIBRARY_RESERVATIONS: LibraryReservation[] = [
  {
    id: 'res-1',
    bookId: 'bk-cbc-math-4',
    bookTitle: 'KLB Top Scholar Mathematics Learner\'s Book Grade 4',
    borrowerId: 'usr-stu-wanjiku-7',
    borrowerName: 'Grace Wanjiku',
    borrowerRole: 'student',
    grade: 7,
    stream: 'Athi',
    reservationDate: '2026-10-02',
    expiryDate: '2026-10-09',
    status: 'pending',
    notes: 'Requested for homework catch-up'
  },
  {
    id: 'res-2',
    bookId: 'bk-enc-brit',
    bookTitle: 'Oxford Children\'s Illustrated Science Encyclopedia',
    borrowerId: 'usr-teach-mwangi',
    borrowerName: 'Mr. David Kiprono',
    borrowerRole: 'teacher',
    reservationDate: '2026-10-01',
    expiryDate: '2026-10-08',
    status: 'ready_for_pickup',
    notes: 'Reference copy reserved at circulation desk'
  }
];

export const INITIAL_LIBRARY_FINES: LibraryFine[] = [
  {
    id: 'fine-1',
    borrowRecordId: 'bor-3',
    bookTitle: 'Chike and the River',
    borrowerId: 'usr-stu-kelvin',
    borrowerName: 'Kelvin Kiprop',
    borrowerRole: 'student',
    daysOverdue: 5,
    fineAmount: 50,
    amountPaid: 0,
    status: 'unpaid',
    dateIssued: '2026-09-30'
  },
  {
    id: 'fine-2',
    borrowRecordId: 'bor-old-1',
    bookTitle: 'Weep Not, Child',
    borrowerId: 'usr-stu-otieno-4',
    borrowerName: 'Brian Otieno',
    borrowerRole: 'student',
    daysOverdue: 2,
    fineAmount: 20,
    amountPaid: 20,
    status: 'paid',
    dateIssued: '2026-09-18'
  }
];

export const INITIAL_LIBRARY_ACQUISITIONS: LibraryAcquisition[] = [
  {
    id: 'acq-1',
    title: 'Oxford Primary Science Atlas 2026 Edition',
    author: 'Oxford Cartography Team',
    isbn: '978-0-19-843210-9',
    publisher: 'Oxford University Press',
    quantity: 40,
    unitCost: 850,
    totalCost: 34000,
    supplier: 'Text Book Centre Ltd',
    requestDate: '2026-09-15',
    status: 'received',
    requestedBy: 'Madame Rose (HOD Sciences)'
  },
  {
    id: 'acq-2',
    title: 'Kenya National CBC Performing Arts Compendium',
    author: 'Kenya Institute of Curriculum Development (KICD)',
    isbn: '978-9966-25-119-0',
    publisher: 'KICD Press',
    quantity: 25,
    unitCost: 1100,
    totalCost: 27500,
    supplier: 'KLB Bookshop',
    requestDate: '2026-09-28',
    status: 'ordered',
    requestedBy: 'Madame Grace Achieng'
  }
];

export const INITIAL_LIBRARY_SHELVES: LibraryShelfLocation[] = [
  {
    id: 'shelf-01',
    code: 'SEC-A-01',
    sectionName: 'CBC Primary Mathematics & Numeracy',
    floor: 'Ground Floor',
    aisle: 'Aisle 1 - East Wing',
    deweyRange: '510.1 - 519.9',
    capacity: 250,
    currentCount: 210,
    categorySpecialization: 'CBC Mathematics Grades 1-6'
  },
  {
    id: 'shelf-02',
    code: 'SEC-A-02',
    sectionName: 'Integrated & Applied Science Wing',
    floor: 'Ground Floor',
    aisle: 'Aisle 2 - East Wing',
    deweyRange: '500.0 - 599.9',
    capacity: 300,
    currentCount: 265,
    categorySpecialization: 'Science & Pre-Technical Studies'
  },
  {
    id: 'shelf-03',
    code: 'SEC-B-01',
    sectionName: 'African Writers Series & Fiction',
    floor: '1st Floor',
    aisle: 'Aisle 3 - Literature Hall',
    deweyRange: '823.9 - 896.3',
    capacity: 350,
    currentCount: 320,
    categorySpecialization: 'African Literature & Children Fiction'
  },
  {
    id: 'shelf-04',
    code: 'SEC-REF-01',
    sectionName: 'Encyclopedias & Teacher Reference Hub',
    floor: '1st Floor',
    aisle: 'Quiet Reference Bay',
    deweyRange: '030.0 - 099.9',
    capacity: 150,
    currentCount: 110,
    categorySpecialization: 'Non-Circulating Reference'
  }
];

export const INITIAL_DIGITAL_LIBRARY_ITEMS: DigitalLibraryItem[] = [
  {
    id: 'dig-1',
    title: 'Kenya National Geographic & Biodiversity Digital Compendium',
    author: 'Kenya Wildlife Service & KICD',
    fileType: 'PDF',
    fileSize: '14.8 MB',
    category: 'Environmental & Agriculture',
    gradeLevel: 4,
    accessLevel: 'all',
    downloadCount: 184,
    readUrl: '#',
    coverColor: 'from-emerald-700 to-teal-900'
  },
  {
    id: 'dig-2',
    title: 'Young Inventors: Electronics & Scratch Coding Illustrated',
    author: 'Tech4Kids Africa',
    fileType: 'EPUB',
    fileSize: '8.2 MB',
    category: 'STEM & Robotics',
    gradeLevel: 5,
    accessLevel: 'all',
    downloadCount: 242,
    readUrl: '#',
    coverColor: 'from-blue-700 to-indigo-900'
  },
  {
    id: 'dig-3',
    title: 'Audiobook: Folk Tales from the Great Rift Valley',
    author: 'Narrated by Wanja Kimani',
    fileType: 'Audiobook',
    fileSize: '42.5 MB',
    category: 'Indigenous Knowledge & Stories',
    gradeLevel: 3,
    accessLevel: 'all',
    downloadCount: 310,
    readUrl: '#',
    coverColor: 'from-amber-700 to-orange-900'
  }
];

export const INITIAL_READING_PROGRAMME_MEMBERS: ReadingProgrammeMember[] = [
  {
    id: 'rpm-1',
    studentId: 'usr-stu-brian',
    studentName: 'Brian Otieno',
    grade: 4,
    stream: 'Dove',
    currentLevel: 'Gold Reader',
    booksReadThisTerm: 14,
    targetBooks: 15,
    pointsEarned: 280,
    badges: ['Bookworm 2026', 'Science Explorer', 'Folktale Master'],
    lastBookReviewed: 'Chike and the River (Rated 5/5)'
  },
  {
    id: 'rpm-2',
    studentId: 'usr-stu-wanjiku-7',
    studentName: 'Grace Wanjiku',
    grade: 7,
    stream: 'Athi',
    currentLevel: 'Platinum Scholar',
    booksReadThisTerm: 22,
    targetBooks: 20,
    pointsEarned: 450,
    badges: ['Literature Laureate', 'Speed Reader', 'Debate Scholar'],
    lastBookReviewed: 'Weep Not, Child (Critical essay submitted)'
  },
  {
    id: 'rpm-3',
    studentId: 'usr-stu-kelvin',
    studentName: 'Kelvin Kiprop',
    grade: 4,
    stream: 'Dove',
    currentLevel: 'Silver Reader',
    booksReadThisTerm: 8,
    targetBooks: 12,
    pointsEarned: 160,
    badges: ['Rising Reader'],
    lastBookReviewed: 'The Magic Fish'
  }
];

export const INITIAL_LIBRARY_ATTENDANCE: LibraryAttendanceLog[] = [
  {
    id: 'att-lib-1',
    learnerOrStaffId: 'usr-stu-brian',
    name: 'Brian Otieno',
    role: 'student',
    grade: 4,
    stream: 'Dove',
    entryTime: '08:15 AM',
    exitTime: '08:55 AM',
    purpose: 'Class Session',
    date: '2026-10-04'
  },
  {
    id: 'att-lib-2',
    learnerOrStaffId: 'usr-stu-wanjiku-7',
    name: 'Grace Wanjiku',
    role: 'student',
    grade: 7,
    stream: 'Athi',
    entryTime: '01:10 PM',
    exitTime: '01:45 PM',
    purpose: 'Computer / Research',
    date: '2026-10-04'
  },
  {
    id: 'att-lib-3',
    learnerOrStaffId: 'usr-teach-mutua',
    name: 'Mr. Peter Mutua',
    role: 'teacher',
    entryTime: '03:30 PM',
    purpose: 'Borrowing / Return',
    date: '2026-10-04'
  }
];

export const INITIAL_LIBRARY_TIMETABLE: LibraryTimetableSlot[] = [
  {
    id: 'slot-1',
    dayOfWeek: 'Monday',
    startTime: '08:20 AM',
    endTime: '09:00 AM',
    grade: 4,
    stream: 'Grade 4 Dove',
    teacherInCharge: 'Mr. David Kiprono',
    sessionType: 'Library Reading Period',
    venue: 'Main Library Reading Hall'
  },
  {
    id: 'slot-2',
    dayOfWeek: 'Tuesday',
    startTime: '10:40 AM',
    endTime: '11:20 AM',
    grade: 7,
    stream: 'Grade 7 Athi',
    teacherInCharge: 'Madame Grace Achieng',
    sessionType: 'Research & Digital Literacy',
    venue: 'Digital Research Suite'
  },
  {
    id: 'slot-3',
    dayOfWeek: 'Wednesday',
    startTime: '02:00 PM',
    endTime: '02:40 PM',
    grade: 5,
    stream: 'Grade 5 Eagle',
    teacherInCharge: 'Mr. Peter Mutua',
    sessionType: 'Library Reading Period',
    venue: 'Main Library Reading Hall'
  }
];

export const INITIAL_LIBRARY_EVENTS: LibraryEvent[] = [
  {
    id: 'evt-1',
    title: 'National Literacy Week & Book Fair',
    type: 'Book Fair',
    date: '2026-10-20',
    time: '09:00 AM - 04:00 PM',
    venue: 'Main School Auditorium & Library Lawns',
    targetAudience: 'All Learners, Teachers & Parents',
    coordinator: 'School Librarian & Language Dept',
    status: 'Upcoming',
    description: 'Book publisher exhibits, discounts, storytelling sessions, and reading marathon challenge.'
  },
  {
    id: 'evt-2',
    title: 'Renowned Author Visit: Storytelling Workshop',
    type: 'Author Visit',
    date: '2026-11-05',
    time: '11:00 AM - 01:00 PM',
    venue: 'Library Amphitheatre',
    targetAudience: 'Grades 4 - 8 Learners',
    coordinator: 'Madame Grace Achieng',
    status: 'Upcoming',
    description: 'Interactive creative writing workshop and book signing session with acclaimed children author.'
  }
];

export const INITIAL_LIBRARY_POLICIES: LibraryPolicy[] = [
  {
    id: 'pol-1',
    policyName: 'Student Borrowing Limit',
    category: 'Lending',
    value: '3 Books / 14 Days',
    description: 'Primary and Junior Secondary students can borrow up to 3 physical titles concurrently for two weeks.'
  },
  {
    id: 'pol-2',
    policyName: 'Faculty & Teacher Quota',
    category: 'Lending',
    value: '8 Books / Full Term',
    description: 'Teachers and subject leads can check out curriculum sets and teacher guides for the entire academic term.'
  },
  {
    id: 'pol-3',
    policyName: 'Overdue Penalty Structure',
    category: 'Fines',
    value: 'KES 10 per day',
    description: 'Overdue charges accrue daily per volume following a 48-hour grace period.'
  },
  {
    id: 'pol-4',
    policyName: 'Digital Device & Reading Bay Conduct',
    category: 'Conduct',
    value: 'Strict Silence & No Food',
    description: 'Headphones required in the digital audio suite; zero food or open beverage containers permitted.'
  }
];

export const INITIAL_LIBRARY_AUDIT_LOGS: LibraryAuditLog[] = [
  {
    id: 'aud-1',
    action: 'Book Circulation Issued',
    performedBy: 'Librarian (Mrs. Jane Wambua)',
    role: 'librarian',
    timestamp: '2026-10-04T08:16:00Z',
    details: 'Issued KLB Mathematics Grade 4 to Brian Otieno (ADM/2026/0401)'
  },
  {
    id: 'aud-2',
    action: 'Catalogue Stock Added',
    performedBy: 'Librarian (Mrs. Jane Wambua)',
    role: 'librarian',
    timestamp: '2026-10-03T14:20:00Z',
    details: 'Added 40 copies of Oxford Primary Science Atlas 2026 Edition (SEC-A-02)'
  },
  {
    id: 'aud-3',
    action: 'Overdue Reminder Dispatched',
    performedBy: 'System Automation',
    role: 'system',
    timestamp: '2026-10-02T07:00:00Z',
    details: 'Sent overdue SMS and portal alert to Parent of Kelvin Kiprop'
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  // 1. Assignment alert for Grade 4
  {
    id: 'notif-asgn-gr4',
    title: 'Upcoming Assignment: Mathematics Fractions',
    message: 'Equivalent Fractions Worksheet #2 is due tomorrow at 5:00 PM. Submit early for teacher review.',
    category: 'assignment',
    targetGrade: 4,
    urgency: 'high',
    linkTab: 'assignments',
    createdAt: '2026-10-01T06:30:00Z',
    readByUserIds: []
  },
  // 2. Grade / Quiz Result Alert for Grade 4
  {
    id: 'notif-grd-gr4',
    title: 'New Quiz Result Recorded',
    message: 'Your Fractions & Decimals topical assessment has been marked: 80% (PASS). Check your performance charts!',
    category: 'grade',
    targetGrade: 4,
    urgency: 'normal',
    linkTab: 'quiz_results',
    createdAt: '2026-09-30T14:15:00Z',
    readByUserIds: []
  },
  // 3. Administrative Announcement (School-wide)
  {
    id: 'notif-ann-school',
    title: 'Official Directive: Term 3 Mid-Term Clinic',
    message: 'Academic clinic and consultative meetings will take place on Friday, Oct 16th. Attendance is mandatory for all faculty and parents.',
    category: 'announcement',
    targetRole: 'all',
    urgency: 'high',
    createdAt: '2026-09-30T09:00:00Z',
    readByUserIds: []
  },
  // 4. Parent Specific: Homework & Gate Alert
  {
    id: 'notif-prt-homework',
    title: 'Learner Academic Milestone: Brian Otieno',
    message: 'Brian has completed 4/5 continuous assessment units for Term 3. Mathematics Grade 4 assignment is due tomorrow.',
    category: 'assignment',
    targetRole: 'parent',
    urgency: 'normal',
    linkTab: 'performance',
    createdAt: '2026-10-01T07:00:00Z',
    readByUserIds: []
  },
  // 5. Parent Specific: Gate Pass Notification
  {
    id: 'notif-prt-gate',
    title: 'Campus Gate Departure Pass Approved',
    message: 'Security Pass #GP-2026-0412 has been validated for Brian Otieno with guardian collection authorized at 12:30 PM.',
    category: 'safety',
    targetRole: 'parent',
    urgency: 'urgent',
    linkTab: 'gate_passes',
    createdAt: '2026-09-29T10:30:00Z',
    readByUserIds: []
  },
  // 6. Teacher Specific: Submissions to mark
  {
    id: 'notif-tch-submissions',
    title: 'Student Submissions Awaiting Grading',
    message: '28 learners in Grade 4 Dove have submitted the Agriculture & Nutrition crop harvesting project.',
    category: 'assignment',
    targetRole: 'teacher',
    urgency: 'normal',
    linkTab: 'assignments',
    createdAt: '2026-10-01T06:00:00Z',
    readByUserIds: []
  },
  // 7. Class Teacher Specific: Daily Register
  {
    id: 'notif-clt-attendance',
    title: 'Daily Class Register Prompt',
    message: 'Please complete and lock the morning attendance register for Grade 4 Dove before 09:00 AM.',
    category: 'system',
    targetRole: 'class_teacher',
    urgency: 'high',
    linkTab: 'class_register',
    createdAt: '2026-10-01T05:30:00Z',
    readByUserIds: []
  },
  // 8. HOD Specific: Curriculum Review
  {
    id: 'notif-hod-curriculum',
    title: 'Departmental Schemes of Work Audit',
    message: 'Sciences & Mathematics department syllabus tracking indicates 92% completion across Grade 1 to 9.',
    category: 'announcement',
    targetRole: 'hod',
    urgency: 'normal',
    linkTab: 'syllabus',
    createdAt: '2026-09-30T11:00:00Z',
    readByUserIds: []
  },
  // 9. Deputy Head Specific: Gate Pass & Duty
  {
    id: 'notif-dep-ops',
    title: 'Campus Security Alert: 2 Active Pass Outs',
    message: 'Two learners are currently off-campus under authorized medical pass-outs. Return expected before 4:00 PM.',
    category: 'safety',
    targetRole: 'deputy_head',
    urgency: 'high',
    linkTab: 'operations',
    createdAt: '2026-10-01T06:45:00Z',
    readByUserIds: []
  },
  // 10. Dean of Studies Specific: Exam Assessment Schedule
  {
    id: 'notif-dean-exams',
    title: 'Grade 6 KPSEA Simulation Exam Timetable Finalized',
    message: 'Assessment papers for KNEC simulation week have been approved and scheduled for printing.',
    category: 'grade',
    targetRole: 'dean_of_studies',
    urgency: 'high',
    linkTab: 'assessments',
    createdAt: '2026-09-29T16:00:00Z',
    readByUserIds: []
  },
  // 11. Librarian Specific: Book Return Notice
  {
    id: 'notif-lib-overdue',
    title: 'Library Circulation: 1 Overdue Loan',
    message: 'Book "Chike and the River" (Borrower: Kelvin Kiprop) is 2 days overdue. Auto-reminder sent.',
    category: 'system',
    targetRole: 'librarian',
    urgency: 'normal',
    linkTab: 'circulation',
    createdAt: '2026-09-30T08:15:00Z',
    readByUserIds: []
  },
  // 12. Head Teacher & Admin: Institutional Governance
  {
    id: 'notif-adm-head',
    title: 'Term 3 Board of Management Dossier Ready',
    message: 'Enrollment analytics and CBC competency reports for the upcoming executive meeting are ready for download.',
    category: 'announcement',
    targetRole: 'head_teacher',
    urgency: 'normal',
    linkTab: 'bom_report',
    createdAt: '2026-09-28T10:00:00Z',
    readByUserIds: []
  }
];

export const INITIAL_BADGES: LearnerBadge[] = [
  {
    id: 'bdg-top-scorer',
    title: 'Top Scorer',
    description: 'Score 100% or achieve top-tier distinction on a curriculum topical assessment quiz.',
    category: 'academic',
    iconName: 'Trophy',
    xpPoints: 150,
    dateUnlocked: '2026-09-30',
    unlocked: true,
    activityCriteria: 'Score 100% on any topical assessment quiz',
    currentProgress: 1,
    targetProgress: 1,
    progressMetric: 'perfect quiz'
  },
  {
    id: 'bdg-perfect-attendance',
    title: 'Perfect Attendance',
    description: 'Maintain 100% on-time daily attendance during active term with zero unauthorized gate departures.',
    category: 'attendance',
    iconName: 'Clock',
    xpPoints: 100,
    dateUnlocked: '2026-10-01',
    unlocked: true,
    activityCriteria: '100% roll-call attendance rate verified across term',
    currentProgress: 100,
    targetProgress: 100,
    progressMetric: '%'
  },
  {
    id: 'bdg-resource-explorer',
    title: 'Resource Explorer',
    description: 'Actively explore curriculum digital assets: read comprehensive notes, listen to teacher audios, and study diagrams.',
    category: 'academic',
    iconName: 'BookOpen',
    xpPoints: 120,
    dateUnlocked: '2026-09-28',
    unlocked: true,
    activityCriteria: 'Study 3 or more CBC curriculum resources (notes, audios, or videos)',
    currentProgress: 3,
    targetProgress: 3,
    progressMetric: 'resources studied'
  },
  {
    id: 'bdg-portfolio-artisan',
    title: 'Portfolio Artisan',
    description: 'Upload authentic practical work, science experiments, or creative art evidence to personal CBC E-Portfolio.',
    category: 'practical',
    iconName: 'Sparkles',
    xpPoints: 130,
    dateUnlocked: '2026-09-27',
    unlocked: true,
    activityCriteria: 'Submit 1 or more practical projects to E-Portfolio',
    currentProgress: 2,
    targetProgress: 1,
    progressMetric: 'projects uploaded'
  },
  {
    id: 'bdg-digital-citizen',
    title: 'Digital Citizen',
    description: 'Demonstrate exemplary online citizenship with zero disciplinary flags and verified curriculum research.',
    category: 'digital',
    iconName: 'ShieldCheck',
    xpPoints: 110,
    dateUnlocked: '2026-09-29',
    unlocked: true,
    activityCriteria: 'Complete 3 safe curriculum inquiries with clean audit log',
    currentProgress: 3,
    targetProgress: 3,
    progressMetric: 'clean searches'
  },
  {
    id: 'bdg-math-whiz',
    title: 'Fractions & Math Whiz',
    description: 'Demonstrated mastery in decimals conversion, fraction operations, and place value reasoning.',
    category: 'academic',
    iconName: 'Award',
    xpPoints: 100,
    dateUnlocked: '2026-09-30',
    unlocked: true,
    activityCriteria: 'Complete Math topical quiz with score >= 80%',
    currentProgress: 100,
    targetProgress: 80,
    progressMetric: '% score'
  },
  {
    id: 'bdg-quick-thinker',
    title: 'Quick Thinker',
    description: 'Complete a timed topical quiz in under half of the allotted time limit with a passing mark.',
    category: 'academic',
    iconName: 'Zap',
    xpPoints: 90,
    unlocked: false,
    activityCriteria: 'Submit a quiz in under 5 minutes with passing score',
    currentProgress: 0,
    targetProgress: 1,
    progressMetric: 'timed challenge'
  },
  {
    id: 'bdg-curious-scientist',
    title: 'Curious Scientist',
    description: 'Complete hands-on investigations in states of matter, plant seed germination, and soil conservation.',
    category: 'academic',
    iconName: 'Star',
    xpPoints: 115,
    unlocked: false,
    activityCriteria: 'Explore 2 Science video lectures and 2 topical notes',
    currentProgress: 1,
    targetProgress: 4,
    progressMetric: 'science modules'
  }
];

export const INITIAL_PORTFOLIO_ITEMS: PortfolioItem[] = [
  {
    id: 'port-1',
    studentId: 'usr-stu-brian',
    studentName: 'Brian Otieno',
    grade: 4,
    subject: 'Creative Arts',
    title: 'Indigenous Sisal & Reeds Weaving Basket',
    description: 'Constructed a traditional circular storage basket using dyed sisal fibers and dry reed strands found in local environment.',
    learningStrand: 'Craft & Indigenous Material Manipulation',
    category: 'Creative Arts & Craft',
    evidenceUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=80',
    reflection: 'I learned how to cross the warp and weft strands evenly so that the basket holds grains without spilling. It required patience and strong finger grip.',
    teacherFeedback: 'Exemplary craftsmanship. Shows deep mastery of geometric symmetry and indigenous Kenyan craft techniques.',
    competencyLevel: 'Exceeding Expectations',
    awardedPoints: 50,
    createdAt: '2026-09-26'
  },
  {
    id: 'port-2',
    studentId: 'usr-stu-brian',
    studentName: 'Brian Otieno',
    grade: 4,
    subject: 'Integrated Science',
    title: 'Multi-Layer Soil & Sand Water Filtration Unit',
    description: 'Designed and tested a mechanical water purifier using coarse gravel, fine sand, and activated charcoal layers inside a recycled container.',
    learningStrand: 'Environmental Conservation & Living Things',
    category: 'Experiment & Science',
    evidenceUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=500&auto=format&fit=crop&q=80',
    reflection: 'Filtered muddy rainwater from the school garden. The first output was slightly cloudy, but running it twice made it clear. Charcoal removed the odor.',
    teacherFeedback: 'Outstanding scientific inquiry. Brian formulated a clear hypothesis and recorded accurate flow-rate observations.',
    competencyLevel: 'Exceeding Expectations',
    awardedPoints: 60,
    createdAt: '2026-09-29'
  },
  {
    id: 'port-3',
    studentId: 'usr-stu-brian',
    studentName: 'Brian Otieno',
    grade: 4,
    subject: 'Agriculture and Nutrition',
    title: 'Sukuma Wiki Container Garden Growth Log',
    description: 'Planted collard greens in an upcycled sack filled with composted topsoil. Logged daily watering and weekly leaf growth.',
    learningStrand: 'Crop Production & Food Security',
    category: 'Project & Model',
    evidenceUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d69103a89?w=500&auto=format&fit=crop&q=80',
    reflection: 'Practiced vertical gardening because it saves space. Mulching with dry grass helped keep the soil moist during hot afternoons.',
    teacherFeedback: 'Very neat observational drawings and accurate growth measurements over 3 weeks.',
    competencyLevel: 'Meeting Expectations',
    awardedPoints: 45,
    createdAt: '2026-09-22'
  }
];

export const INITIAL_PERIODIC_REPORTS: PeriodicReport[] = [
  {
    id: 'rep-wk-5',
    studentId: 'usr-stu-brian',
    studentName: 'Brian Otieno',
    grade: 4,
    periodType: 'Weekly',
    periodLabel: 'Term 3 · Week 5 (Sep 28 - Oct 02, 2026)',
    academicMean: 82,
    attendanceRate: 100,
    quizzesCompleted: 2,
    assignmentsTurnedIn: 1,
    badgesEarned: 2,
    coreCompetencies: [
      { name: 'Critical Thinking & Problem Solving', level: 'Exceeding', notes: 'Demonstrated in Fractions subtraction and water filtration model.' },
      { name: 'Digital Literacy', level: 'Exceeding', notes: 'Consistently navigates topical notes and interactive quizzes independently.' },
      { name: 'Self-Efficacy & Collaboration', level: 'Meeting', notes: 'Active participation in group discussions during class teacher register review.' }
    ],
    keyStrengths: [
      'Mastered equivalent fractions conversion',
      'Prompt assignment completion with zero lateness',
      'Flawless weekly attendance'
    ],
    supportRecommendations: [
      'Explore extension decimal word problems',
      'Read 2 supplementary readers from the library'
    ],
    teacherRemarks: 'A stellar week of active participation and conceptual breakthroughs. Keep up the high standard.',
    generatedAt: '2026-10-01'
  },
  {
    id: 'rep-mth-sep',
    studentId: 'usr-stu-brian',
    studentName: 'Brian Otieno',
    grade: 4,
    periodType: 'Monthly',
    periodLabel: 'Monthly Progress Digest · September 2026',
    academicMean: 81,
    attendanceRate: 98,
    quizzesCompleted: 6,
    assignmentsTurnedIn: 4,
    badgesEarned: 4,
    coreCompetencies: [
      { name: 'Communication & Collaboration', level: 'Meeting', notes: 'Listens respectfully and presents portfolio reflections clearly.' },
      { name: 'Creativity & Imagination', level: 'Exceeding', notes: 'Produced exceptional basket weaving artifact in Creative Arts.' },
      { name: 'Citizenship', level: 'Exceeding', notes: 'Strict adherence to campus gate safety and clean classroom principles.' }
    ],
    keyStrengths: [
      'Steady upward trajectory across all 8 Primary learning areas',
      'Rich multi-media portfolio with 3 verified projects',
      'Strong numeracy and spatial reasoning'
    ],
    supportRecommendations: [
      'Encouraged to borrow more English fiction from Mrs. Kamau in the library',
      'Maintain steady practice on pre-algebraic balance puzzles'
    ],
    teacherRemarks: 'Brian has consolidated his position in the top decile of Grade 4 Dove. Highly recommended for academic mentorship honors.',
    generatedAt: '2026-09-30'
  },
  {
    id: 'rep-trm-3',
    studentId: 'usr-stu-brian',
    studentName: 'Brian Otieno',
    grade: 4,
    periodType: 'Termly',
    periodLabel: 'Term 3 Comprehensive CBC Dossier (2026)',
    academicMean: 82.5,
    attendanceRate: 98.5,
    quizzesCompleted: 14,
    assignmentsTurnedIn: 8,
    badgesEarned: 5,
    coreCompetencies: [
      { name: 'Critical Thinking', level: 'Exceeding', notes: 'Analyzes multi-step mathematical problems logically.' },
      { name: 'Learning to Learn', level: 'Exceeding', notes: 'Uses EduSmart AI Tutor constructively to understand incorrect attempts.' },
      { name: 'Environmental Responsibility', level: 'Exceeding', notes: 'Led sack-gardening and water conservation experiments.' }
    ],
    keyStrengths: [
      'Overall Mean of 82.5% (Exceeding Expectations)',
      'No disciplinary incidents logged this academic term',
      'Consistent e-portfolio submissions across Sciences and Arts'
    ],
    supportRecommendations: [
      'Prepare for Junior School Grade 5 foundational transition challenges',
      'Continue active reading program during school holidays'
    ],
    teacherRemarks: 'Exemplary academic and moral fortitude. A credit to Grade 4 Dove and the school community.',
    generatedAt: '2026-09-30'
  },
  {
    id: 'rep-ann-2026',
    studentId: 'usr-stu-brian',
    studentName: 'Brian Otieno',
    grade: 4,
    periodType: 'Annually',
    periodLabel: 'Annual Summative Academic Dossier · 2026 Year in Review',
    academicMean: 83.2,
    attendanceRate: 99.1,
    quizzesCompleted: 38,
    assignmentsTurnedIn: 24,
    badgesEarned: 5,
    coreCompetencies: [
      { name: 'Holistic Competency Achievement', level: 'Exceeding', notes: 'Satisfies all KICD Grade 4 curriculum strand milestones with distinction.' },
      { name: 'Social & Emotional Wellbeing', level: 'Exceeding', notes: 'Shows empathy, peer leadership, and respectful communication.' }
    ],
    keyStrengths: [
      'Consistently ranked top 3 in stream throughout Terms 1, 2, and 3',
      'Earned 5 CBC Competency Badges with 500+ XP Points',
      'Full compliance with campus security and digital safe search standards'
    ],
    supportRecommendations: [
      'Clear for promotion to Grade 5 with honors commendation'
    ],
    teacherRemarks: 'A stellar academic year. Brian has proven his capability across both academic theories and practical competencies.',
    generatedAt: '2026-09-30'
  }
];

export const INITIAL_EXTERNAL_TOOLS: ExternalTool[] = [
  {
    id: 'ext-meet',
    name: 'Google Meet',
    category: 'virtual_class',
    icon: 'Video',
    description: 'Official CBC live interactive audio-video classrooms with scheduled meeting codes.',
    url: 'https://meet.google.com/lookup/edusmart-gr4-dove',
    code: 'edusmart-gr4-dove',
    badge: 'Live Classroom'
  },
  {
    id: 'ext-zoom',
    name: 'Zoom Education',
    category: 'virtual_class',
    icon: 'Video',
    description: 'High-definition webinars, parent-teacher conferences, and joint inter-school lectures.',
    url: 'https://zoom.us/j/98471203941',
    code: '984 7120 3941',
    badge: 'Conferences'
  },
  {
    id: 'ext-classroom',
    name: 'Google Classroom',
    category: 'classroom',
    icon: 'School',
    description: 'Coursework submission hub, rubrics sharing, and cloud assignment drive integration.',
    url: 'https://classroom.google.com/c/MzkwODEy',
    code: 'c-gr4-dov',
    badge: 'Homework Sync'
  },
  {
    id: 'ext-forms',
    name: 'Google Forms',
    category: 'assessment',
    icon: 'FileText',
    description: 'Formative surveys, student reflection slips, and termly parent feedback questionnaires.',
    url: 'https://docs.google.com/forms/d/e/edusmart-cbc-feedback/viewform',
    badge: 'Surveys'
  },
  {
    id: 'ext-kahoot',
    name: 'Kahoot!',
    category: 'assessment',
    icon: 'Sparkles',
    description: 'Gamified live competitive trivia challenges for revision and energetic classroom wrap-ups.',
    url: 'https://kahoot.it/?pin=491028',
    code: 'PIN: 491 028',
    badge: 'Gamified Trivia'
  },
  {
    id: 'ext-quizizz',
    name: 'Quizizz',
    category: 'assessment',
    icon: 'Award',
    description: 'Self-paced gamified flashcard mastery challenges and asynchronous test drills.',
    url: 'https://quizizz.com/join?gc=829103',
    code: 'CODE: 829 103',
    badge: 'Self-Paced Game'
  },
  {
    id: 'ext-online-library',
    name: 'KICD Digital Library & E-Readers',
    category: 'library',
    icon: 'BookOpen',
    description: 'Kenya Institute of Curriculum Development approved digital textbooks and storybooks.',
    url: 'https://kicd.ac.ke/curriculum-materials',
    badge: 'Approved E-Books'
  }
];

export const INITIAL_SEARCH_AUDIT_LOGS: SearchAuditLog[] = [
  {
    id: 'sch-1',
    userId: 'usr-stu-brian',
    userName: 'Brian Otieno',
    userRole: 'student',
    grade: 4,
    searchQuery: 'how do plants absorb water in dry areas',
    timestamp: '2026-10-01T06:15:00Z',
    status: 'safe',
    educationalTopicFound: 'Agriculture: Soil Moisture & Crop Adaptations'
  },
  {
    id: 'sch-2',
    userId: 'usr-stu-brian',
    userName: 'Brian Otieno',
    userRole: 'student',
    grade: 4,
    searchQuery: 'simplifying fractions with unlike denominators',
    timestamp: '2026-09-30T15:20:00Z',
    status: 'safe',
    educationalTopicFound: 'Mathematics: Fractions Operations'
  },
  {
    id: 'sch-3',
    userId: 'usr-stu-kelvin',
    userName: 'Kelvin Kiprop',
    userRole: 'student',
    grade: 4,
    searchQuery: 'unsupervised online action games free play',
    timestamp: '2026-09-29T11:45:00Z',
    status: 'guided_redirection',
    filterReason: 'Non-curriculum leisure search during academic hours',
    educationalTopicFound: 'Redirected to: EduSmart Gamified CBC Math Challenges & Kahoot'
  }
];

export const INITIAL_CALENDAR_EVENTS: SchoolCalendarEvent[] = [
  {
    id: 'cal-1',
    title: 'Term 1 2026 Official Opening Day',
    description: 'School reopens for all Primary (Grades 1-6) and Junior School (Grades 7-9) learners. Assembly at 7:45 AM.',
    category: 'term_dates',
    term: 1,
    academicYear: 2026,
    startDate: '2026-01-06',
    endDate: '2026-01-06',
    targetAudience: 'All School',
    venue: 'Main School Assembly Quadrangle',
    isImportant: true,
    status: 'completed',
    updatedBy: 'Mrs. Sarah Cherono (Registrar)',
    updatedAt: '2026-01-05'
  },
  {
    id: 'cal-2',
    title: 'Term 1 Mid-Term Continuous Assessment Tests (CATs)',
    description: 'Mid-term formative CBC evaluation across all learning areas. Timetable issued to class teachers.',
    category: 'exams',
    term: 1,
    academicYear: 2026,
    startDate: '2026-02-16',
    endDate: '2026-02-19',
    targetAudience: 'All School',
    venue: 'Grade Classrooms & CBC Labs',
    isImportant: true,
    status: 'completed',
    updatedBy: 'Mrs. Sarah Cherono (Registrar)',
    updatedAt: '2026-02-10'
  },
  {
    id: 'cal-3',
    title: 'Term 1 Mid-Term Recess Break',
    description: 'Official Ministry of Education 4-day mid-term recess break for all students and teaching staff.',
    category: 'holiday',
    term: 1,
    academicYear: 2026,
    startDate: '2026-02-20',
    endDate: '2026-02-23',
    targetAudience: 'All School',
    venue: 'Campus Closed',
    isImportant: false,
    status: 'completed',
    updatedBy: 'Mrs. Sarah Cherono (Registrar)',
    updatedAt: '2026-02-18'
  },
  {
    id: 'cal-4',
    title: 'Annual Inter-House Athletics & CBC Talent Gala',
    description: 'Inter-house track and field sports day, gymnastics showcase, and traditional arts competition.',
    category: 'co_curricular',
    term: 1,
    academicYear: 2026,
    startDate: '2026-03-12',
    endDate: '2026-03-13',
    targetAudience: 'All School',
    venue: 'School Sports Pavilion & Grounds',
    isImportant: false,
    status: 'completed',
    updatedBy: 'Mrs. Sarah Cherono (Registrar)',
    updatedAt: '2026-03-05'
  },
  {
    id: 'cal-5',
    title: 'Term 1 End-of-Term Summative Evaluations',
    description: 'School-wide end-of-term examinations and practical assessments for Grade 1 through Grade 9.',
    category: 'exams',
    term: 1,
    academicYear: 2026,
    startDate: '2026-03-23',
    endDate: '2026-03-27',
    targetAudience: 'All School',
    venue: 'Examination Rooms & Science Labs',
    isImportant: true,
    status: 'ongoing',
    updatedBy: 'Mrs. Sarah Cherono (Registrar)',
    updatedAt: '2026-03-18'
  },
  {
    id: 'cal-6',
    title: 'Parent-Teacher Consultation & Academic Clinic',
    description: 'One-on-one parent conferencing with subject teachers and class tutors. Collection of Term 1 progress dossiers.',
    category: 'parents',
    term: 1,
    academicYear: 2026,
    startDate: '2026-04-01',
    endDate: '2026-04-01',
    targetAudience: 'Parents',
    venue: 'School Multipurpose Hall',
    isImportant: true,
    status: 'upcoming',
    updatedBy: 'Mrs. Sarah Cherono (Registrar)',
    updatedAt: '2026-03-25'
  },
  {
    id: 'cal-7',
    title: 'Term 1 Official Closing Day & Vacation Commences',
    description: 'Release of learners for 3-week April vacation. Termly report cards available on parent portal.',
    category: 'term_dates',
    term: 1,
    academicYear: 2026,
    startDate: '2026-04-03',
    endDate: '2026-04-03',
    targetAudience: 'All School',
    venue: 'Assembly Ground',
    isImportant: true,
    status: 'upcoming',
    updatedBy: 'Mrs. Sarah Cherono (Registrar)',
    updatedAt: '2026-03-25'
  },
  {
    id: 'cal-8',
    title: 'Term 2 2026 Opening Day (14 Weeks)',
    description: 'Commencement of Term 2 academic session. All boarders and day scholars report by 7:30 AM.',
    category: 'term_dates',
    term: 2,
    academicYear: 2026,
    startDate: '2026-04-27',
    endDate: '2026-04-27',
    targetAudience: 'All School',
    venue: 'Main Campus',
    isImportant: true,
    status: 'upcoming',
    updatedBy: 'Mrs. Sarah Cherono (Registrar)',
    updatedAt: '2026-03-25'
  }
];

export const INITIAL_PARENT_COMMUNICATIONS: ParentCommunication[] = [
  {
    id: 'pcom-1',
    title: 'Term 1 Academic Clinic & Parent Consultation Notice',
    message: 'Dear Parents & Guardians, You are cordially invited to the Term 1 Academic Clinic on Wednesday, April 1, 2026, from 8:30 AM to 3:30 PM. Class teachers and subject specialists will be available for individual progress consultations.',
    channel: 'Portal Circular',
    targetAudience: 'All Parents',
    sentBy: 'Mrs. Sarah Cherono',
    senderRole: 'School Administration & Registrar',
    dateSent: '2026-03-28 09:15 AM',
    recipientCount: 680,
    deliveryStatus: 'Delivered',
    category: 'Academic Clinic'
  },
  {
    id: 'pcom-2',
    title: 'Grade 6 & Grade 9 KPSEA / KJSEA Registration Verification',
    message: 'Important reminder for Grade 6 and Grade 9 parents: kindly verify your learner NEMIS/assessment details and birth certificate numbers with the School Registrar before Friday, April 3.',
    channel: 'SMS',
    targetAudience: 'Specific Grade',
    targetGrade: 6,
    sentBy: 'Mrs. Sarah Cherono',
    senderRole: 'School Administration & Registrar',
    dateSent: '2026-03-26 11:30 AM',
    recipientCount: 165,
    deliveryStatus: 'Delivered',
    category: 'General Notice'
  },
  {
    id: 'pcom-3',
    title: 'Term 1 Fee Clearance & Term 2 Pre-Invoicing Advisory',
    message: 'Dear Esteemed Parents, thank you for your ongoing partnership. Kindly ensure any outstanding termly activity and meals balance is cleared by March 31. Term 2 fee statements are now accessible on the parent portal.',
    channel: 'Email',
    targetAudience: 'All Parents',
    sentBy: 'Mrs. Sarah Cherono',
    senderRole: 'School Administration & Registrar',
    dateSent: '2026-03-24 02:45 PM',
    recipientCount: 680,
    deliveryStatus: 'Delivered',
    category: 'Fee Advisory'
  },
  {
    id: 'pcom-4',
    title: 'Annual Co-Curricular Gala Transport & Uniform Protocol',
    message: 'Learners taking part in the Athletics Gala are requested to report in their official house sports colors. School bus pick-up routes will operate 30 minutes earlier at 6:15 AM.',
    channel: 'Portal Circular',
    targetAudience: 'All Parents',
    sentBy: 'Mrs. Sarah Cherono',
    senderRole: 'School Administration & Registrar',
    dateSent: '2026-03-10 08:00 AM',
    recipientCount: 680,
    deliveryStatus: 'Delivered',
    category: 'School Event'
  }
];

export const INITIAL_EXAM_TIMETABLE: ExamTimetableEntry[] = [
  {
    id: 'ett-1',
    grade: 4,
    subject: 'Mathematics',
    examType: 'End-Term Summative',
    examDate: '2026-03-23',
    startTime: '08:30 AM',
    endTime: '10:00 AM',
    durationMinutes: 90,
    room: 'Hall A (Falcon & Dove)',
    invigilatorName: 'Mr. David Kiprono',
    instructions: 'Bring mathematical sets, 30cm ruler, pencils, and erasers. No electronic calculators permitted.'
  },
  {
    id: 'ett-2',
    grade: 4,
    subject: 'English',
    examType: 'End-Term Summative',
    examDate: '2026-03-23',
    startTime: '11:00 AM',
    endTime: '12:30 PM',
    durationMinutes: 90,
    room: 'Hall A (Falcon & Dove)',
    invigilatorName: 'Mrs. Joyce Waweru',
    instructions: 'Section A: Reading Comprehension & Grammar; Section B: Composition Writing.'
  },
  {
    id: 'ett-3',
    grade: 4,
    subject: 'Integrated Science',
    examType: 'End-Term Summative',
    examDate: '2026-03-24',
    startTime: '08:30 AM',
    endTime: '10:00 AM',
    durationMinutes: 90,
    room: 'Hall A (Falcon & Dove)',
    invigilatorName: 'Mr. Charles Omondi',
    instructions: 'Includes practical laboratory observation items and environmental science diagrams.'
  },
  {
    id: 'ett-4',
    grade: 4,
    subject: 'Kiswahili',
    examType: 'End-Term Summative',
    examDate: '2026-03-24',
    startTime: '11:00 AM',
    endTime: '12:30 PM',
    durationMinutes: 90,
    room: 'Hall A (Falcon & Dove)',
    invigilatorName: 'Mr. Peter Mutua',
    instructions: 'Karatasi ya 1: Lugha na Ufahamu; Karatasi ya 2: Insha.'
  },
  {
    id: 'ett-5',
    grade: 8,
    subject: 'Mathematics',
    examType: 'End-Term Summative',
    examDate: '2026-03-23',
    startTime: '08:00 AM',
    endTime: '10:00 AM',
    durationMinutes: 120,
    room: 'Junior Lab Block 2 (Mara & Athi)',
    invigilatorName: 'Dr. Mercy Mwangi',
    instructions: 'Mathematical tables provided. Ensure complete step-by-step working is shown.'
  },
  {
    id: 'ett-6',
    grade: 8,
    subject: 'Integrated Science',
    examType: 'End-Term Summative',
    examDate: '2026-03-24',
    startTime: '08:00 AM',
    endTime: '10:00 AM',
    durationMinutes: 120,
    room: 'Junior Science Lab 1',
    invigilatorName: 'Mr. Peter Ochieng',
    instructions: 'Chemistry and Physics sections require protective lab coats.'
  }
];

export const INITIAL_SANATORIUM_RECORDS: SanatoriumRecord[] = [
  {
    id: 'san-1',
    studentId: 'usr-stu-sharon',
    studentName: 'Sharon Cherono',
    admissionNumber: 'ADM/2021/0812',
    grade: 8,
    stream: 'Mara',
    parentName: 'Grace Cherono (Mother)',
    parentPhone: '+254 711 445 892',
    nurseInCharge: 'Sister Grace Wambui, RN',
    nurseLicenseNo: 'NCK/RN-58921',
    nurseStaffNo: 'SAN/002',
    date: '2026-10-02',
    arrivalTime: '10:15 AM',
    departureTime: '11:45 AM',
    visitReason: 'High febrile illness with chills, dizziness, and body weakness',
    symptoms: ['High Fever', 'Headache', 'Chills', 'Nausea'],
    vitalSigns: {
      temperature: 38.8,
      pulseRate: 94,
      bloodPressure: '110/72',
      respiratoryRate: 20
    },
    treatmentAdministered: 'Paracetamol 500mg oral stat, cold sponge compression applied to forehead and axillae, oral rehydration solution (ORS) 300ml administered.',
    disposition: 'signed_out_to_parent',
    bedNumber: 'Observation Bed #01',
    recommendations: 'Patient has high-grade fever unresponsive to mild antipyretics. Signed out to mother Grace Cherono for full laboratory malaria and typhoid diagnostic workup at Nairobi Hospital. 3 days medical leave recommended.',
    activityRestrictions: 'Complete bed rest; exempt from physical education, practicals, and evening preps until Monday.',
    followUpPlan: 'Parent to present medical discharge summary upon return to school.',
    parentNotified: true,
    parentNotificationNotes: 'Mother contacted at 10:40 AM; arrived at campus gate at 11:30 AM. Gate Pass #GP-8M-3310 dispatched.',
    gatePassId: 'gep-2',
    recordedAt: '2026-10-02T10:15:00',
    recordedBy: 'Sister Grace Wambui, RN'
  },
  {
    id: 'san-2',
    studentId: 'usr-stu-kelvin',
    studentName: 'Kelvin Kiprop',
    admissionNumber: 'ADM/2023/0414',
    grade: 4,
    stream: 'Dove',
    parentName: 'Dr. Joseph Kiprop (Father)',
    parentPhone: '+254 722 891 042',
    nurseInCharge: 'Sister Grace Wambui, RN',
    nurseLicenseNo: 'NCK/RN-58921',
    nurseStaffNo: 'SAN/002',
    date: '2026-10-02',
    arrivalTime: '08:45 AM',
    departureTime: '09:30 AM',
    visitReason: 'Sports abrasion on right knee and contusion sustained during morning physical warm-up',
    symptoms: ['Superficial laceration', 'Mild knee swelling', 'Localized pain'],
    vitalSigns: {
      temperature: 36.8,
      pulseRate: 78,
      bloodPressure: '105/68',
      respiratoryRate: 18
    },
    treatmentAdministered: 'Antiseptic cleaning with saline, povidone-iodine dressing applied, sterile gauze bandage wrapped. Cold ice compression applied for 15 minutes.',
    disposition: 'treated_returned_to_class',
    recommendations: 'Wound is clean and sterile dressing is intact. Keep dressing dry. Safe to attend all academic lessons. Excused from high-impact running and football for 48 hours.',
    activityRestrictions: 'No field sports or running until wound re-evaluated on Monday.',
    followUpPlan: 'Report back to sanatorium on Monday 08:30 AM for dressing review.',
    parentNotified: true,
    parentNotificationNotes: 'SMS notification sent via EduSmart clinic gateway confirming minor knee dressing.',
    recordedAt: '2026-10-02T08:45:00',
    recordedBy: 'Sister Grace Wambui, RN'
  },
  {
    id: 'san-3',
    studentId: 'usr-stu-brian',
    studentName: 'Brian Otieno',
    admissionNumber: 'ADM/2023/0412',
    grade: 4,
    stream: 'Dove',
    parentName: 'Mary Otieno (Mother)',
    parentPhone: '+254 722 345 678',
    nurseInCharge: 'Nurse David Ochieng, KRCHN',
    nurseLicenseNo: 'NCK/RN-61402',
    nurseStaffNo: 'SAN/005',
    date: '2026-10-03',
    arrivalTime: '09:10 AM',
    departureTime: '10:20 AM',
    visitReason: 'Acute bronchial spasm / exercise-induced asthma tightness after morning sprint drill',
    symptoms: ['Wheezing', 'Shortness of breath', 'Chest tightness'],
    vitalSigns: {
      temperature: 36.6,
      pulseRate: 86,
      bloodPressure: '108/70',
      respiratoryRate: 24
    },
    treatmentAdministered: 'Salbutamol 100mcg (2 puffs via spacer device). Patient positioned upright in high Fowler\'s. Peak flow measured at 280 L/min. Observed for 45 minutes until chest sounds cleared bilaterally.',
    disposition: 'treated_returned_to_class',
    recommendations: 'Bronchial spasm resolved; respiratory sounds clear bilaterally. Student carrying prescribed inhaler in school bag. Class teacher alerted to monitor during outdoor activities.',
    activityRestrictions: 'Avoid cold morning outdoor activities and dusty field areas for remainder of day.',
    followUpPlan: 'Return immediately if wheeze recurs; check-in before departure at 3:30 PM.',
    parentNotified: true,
    parentNotificationNotes: 'Parent informed via call; inhaler refill confirmed at home.',
    recordedAt: '2026-10-03T09:10:00',
    recordedBy: 'Nurse David Ochieng, KRCHN'
  },
  {
    id: 'san-4',
    studentId: 'usr-stu-faith',
    studentName: 'Faith Wanjiru',
    admissionNumber: 'ADM/2021/0811',
    grade: 8,
    stream: 'Mara',
    parentName: 'James Wanjiru (Father)',
    parentPhone: '+254 720 112 233',
    nurseInCharge: 'Sister Grace Wambui, RN',
    nurseLicenseNo: 'NCK/RN-58921',
    nurseStaffNo: 'SAN/002',
    date: '2026-10-03',
    arrivalTime: '11:00 AM',
    departureTime: '01:30 PM',
    visitReason: 'Throbbing frontal migraine and visual photophobia following computer lab session',
    symptoms: ['Severe headache', 'Photophobia', 'Mild nausea'],
    vitalSigns: {
      temperature: 37.1,
      pulseRate: 82,
      bloodPressure: '118/76',
      respiratoryRate: 18
    },
    treatmentAdministered: 'Ibuprofen 400mg with light snack and warm chamomile tea. Admitted to quiet dark recovery bay on Observation Bed #02.',
    disposition: 'admitted_observation_bay',
    bedNumber: 'Observation Bed #02',
    recommendations: 'Learner placed under dark-room rest protocol. Avoid screen exposure, fluorescent lights, and loud noise. Re-evaluate after 90 minutes of sleep before clearing to return to dorm/class.',
    activityRestrictions: 'Excused from afternoon computer practicals and physical education.',
    followUpPlan: 'Check blood pressure and headache pain score at 1:30 PM.',
    parentNotified: true,
    parentNotificationNotes: 'Father notified that Faith is resting comfortably in sanatorium observation room.',
    recordedAt: '2026-10-03T11:00:00',
    recordedBy: 'Sister Grace Wambui, RN'
  },
  {
    id: 'san-5',
    studentId: 'usr-stu-amina',
    studentName: 'Amina Hassan',
    admissionNumber: 'ADM/2023/0413',
    grade: 4,
    stream: 'Dove',
    parentName: 'Hassan Ali (Father)',
    parentPhone: '+254 721 889 001',
    nurseInCharge: 'Sister Grace Wambui, RN',
    nurseLicenseNo: 'NCK/RN-58921',
    nurseStaffNo: 'SAN/002',
    date: '2026-10-01',
    arrivalTime: '01:20 PM',
    departureTime: '02:15 PM',
    visitReason: 'Episodic stomach cramps and abdominal bloating after lunchtime meal',
    symptoms: ['Abdominal pain', 'Bloating'],
    vitalSigns: {
      temperature: 36.9,
      pulseRate: 76,
      bloodPressure: '102/66',
      respiratoryRate: 18
    },
    treatmentAdministered: 'Oral Hyoscine Butylbromide 10mg stat, warm water compress to epigastrium, rested 40 minutes in observation lounge.',
    disposition: 'treated_returned_to_class',
    recommendations: 'Abdominal cramps subsided completely. Advised to stay well hydrated and avoid spicy/oily cafeteria items for 24 hours.',
    activityRestrictions: 'Normal classroom activity resumed.',
    followUpPlan: 'Report back if cramps recur during evening prep.',
    parentNotified: false,
    parentNotificationNotes: 'Mild cramp, fully resolved; routine notification on weekly health summary.',
    recordedAt: '2026-10-01T01:20:00',
    recordedBy: 'Sister Grace Wambui, RN'
  }
];

// ========================================================
// 🚌 INITIAL TRANSPORT & FLEET DATA
// ========================================================

export const INITIAL_SCHOOL_BUSES: SchoolBus[] = [
  {
    id: 'bus-01',
    registrationNumber: 'KDG 218M',
    busNumber: 'Bus 01',
    model: 'Isuzu FRR 33-Seater School Coach',
    capacity: 33,
    currentOccupancy: 28,
    driverName: 'Mr. Josephat Kipkoech',
    driverPhone: '+254 712 345 678',
    assistantName: 'Ms. Mary Wambui',
    assistantPhone: '+254 723 456 789',
    assignedRouteId: 'route-01',
    assignedRouteName: 'Route 01 – Kiambu Road & Muthaiga',
    insuranceExpiry: '2027-02-28',
    inspectionStatus: 'Valid / Compliant',
    speedGovernorStatus: 'Certified & Calibrated (80 km/h)',
    gpsTrackingStatus: 'Active & Transmitting',
    currentLocation: 'Campus Main Gate Bus Bay (Parked)',
    emergencyContact: '+254 722 000 119',
    lastServiceDate: '2026-09-15',
    nextServiceDue: '2026-12-15'
  },
  {
    id: 'bus-02',
    registrationNumber: 'KDM 490T',
    busNumber: 'Bus 02',
    model: 'Mitsubishi Rosa 29-Seater Executive',
    capacity: 29,
    currentOccupancy: 24,
    driverName: 'Mr. Peter Njoroge',
    driverPhone: '+254 721 889 900',
    assistantName: 'Mrs. Eunice Akinyi',
    assistantPhone: '+254 733 445 566',
    assignedRouteId: 'route-02',
    assignedRouteName: 'Route 02 – Ngong Road & South C',
    insuranceExpiry: '2027-04-15',
    inspectionStatus: 'Valid / Compliant',
    speedGovernorStatus: 'Certified & Calibrated (80 km/h)',
    gpsTrackingStatus: 'Active & Transmitting',
    currentLocation: 'Prestige Plaza Ngong Rd (En Route)',
    emergencyContact: '+254 722 000 119',
    lastServiceDate: '2026-08-20',
    nextServiceDue: '2026-11-20'
  },
  {
    id: 'bus-03',
    registrationNumber: 'KDB 112W',
    busNumber: 'Bus 03',
    model: 'Toyota Coaster 25-Seater Shuttle',
    capacity: 25,
    currentOccupancy: 19,
    driverName: 'Mr. Patrick Mutiso',
    driverPhone: '+254 710 654 321',
    assistantName: 'Ms. Beatrice Chepngetich',
    assistantPhone: '+254 728 776 543',
    assignedRouteId: 'route-03',
    assignedRouteName: 'Route 03 – Thika Highway & Garden City',
    insuranceExpiry: '2027-01-30',
    inspectionStatus: 'Valid / Compliant',
    speedGovernorStatus: 'Certified & Calibrated (80 km/h)',
    gpsTrackingStatus: 'Active & Transmitting',
    currentLocation: 'Campus West Parking Bay',
    emergencyContact: '+254 722 000 119',
    lastServiceDate: '2026-09-02',
    nextServiceDue: '2026-12-02'
  }
];

export const INITIAL_TRANSPORT_ROUTES: TransportRoute[] = [
  {
    id: 'route-01',
    routeNumber: 'Route 01',
    name: 'Kiambu Road & Muthaiga Express',
    description: 'Serving Fourways Junction, Ridgeways, CID HQ, Muthaiga Roundabout and Campus.',
    busPlate: 'KDG 218M',
    busNumber: 'Bus 01',
    driverName: 'Mr. Josephat Kipkoech',
    driverPhone: '+254 712 345 678',
    assistantName: 'Ms. Mary Wambui',
    assistantPhone: '+254 723 456 789',
    morningStartTime: '06:20 AM',
    morningSchoolArrivalTime: '07:35 AM',
    afternoonDepartureTime: '03:45 PM',
    afternoonEndTime: '05:10 PM',
    termFee: 18500,
    status: 'Active',
    stops: [
      {
        id: 'stop-101',
        stopName: 'Fourways Junction Estate Gate',
        landmark: 'Near Shell Kiambu Road',
        morningPickupTime: '06:25 AM',
        afternoonDropoffTime: '04:15 PM',
        studentCount: 8
      },
      {
        id: 'stop-102',
        stopName: 'Ridgeways Mall Total Station',
        landmark: 'Opposite Ridgeways Baptist',
        morningPickupTime: '06:40 AM',
        afternoonDropoffTime: '04:30 PM',
        studentCount: 11
      },
      {
        id: 'stop-103',
        stopName: 'DCI Headquarters Mazingira Complex',
        landmark: 'Main Service Lane',
        morningPickupTime: '06:55 AM',
        afternoonDropoffTime: '04:45 PM',
        studentCount: 5
      },
      {
        id: 'stop-104',
        stopName: 'Muthaiga Roundabout Pedestrian Footbridge',
        landmark: 'Near Gertrude Children Hospital',
        morningPickupTime: '07:15 AM',
        afternoonDropoffTime: '05:00 PM',
        studentCount: 4
      }
    ]
  },
  {
    id: 'route-02',
    routeNumber: 'Route 02',
    name: 'Ngong Road & South C Shuttle',
    description: 'Serving Junction Mall, Adams Arcade, Prestige Plaza, Nyayo Highrise and South C.',
    busPlate: 'KDM 490T',
    busNumber: 'Bus 02',
    driverName: 'Mr. Peter Njoroge',
    driverPhone: '+254 721 889 900',
    assistantName: 'Mrs. Eunice Akinyi',
    assistantPhone: '+254 733 445 566',
    morningStartTime: '06:15 AM',
    morningSchoolArrivalTime: '07:40 AM',
    afternoonDepartureTime: '03:45 PM',
    afternoonEndTime: '05:20 PM',
    termFee: 19500,
    status: 'Active',
    stops: [
      {
        id: 'stop-201',
        stopName: 'The Junction Mall Shell',
        landmark: 'Ngong Road entrance',
        morningPickupTime: '06:20 AM',
        afternoonDropoffTime: '04:20 PM',
        studentCount: 7
      },
      {
        id: 'stop-202',
        stopName: 'Adams Arcade Market',
        landmark: 'Near Elgeyo Marakwet Rd junction',
        morningPickupTime: '06:38 AM',
        afternoonDropoffTime: '04:35 PM',
        studentCount: 9
      },
      {
        id: 'stop-203',
        stopName: 'Prestige Plaza Rubis',
        landmark: 'Opposite China Centre',
        morningPickupTime: '06:52 AM',
        afternoonDropoffTime: '04:50 PM',
        studentCount: 5
      },
      {
        id: 'stop-204',
        stopName: 'South C Bellevue Total Station',
        landmark: 'Mombasa Road slipway',
        morningPickupTime: '07:15 AM',
        afternoonDropoffTime: '05:10 PM',
        studentCount: 3
      }
    ]
  },
  {
    id: 'route-03',
    routeNumber: 'Route 03',
    name: 'Thika Superhighway & Roysambu Circuit',
    description: 'Serving TRM Mall, Garden City, Safari Park Hotel, Allsops and Pangani.',
    busPlate: 'KDB 112W',
    busNumber: 'Bus 03',
    driverName: 'Mr. Patrick Mutiso',
    driverPhone: '+254 710 654 321',
    assistantName: 'Ms. Beatrice Chepngetich',
    assistantPhone: '+254 728 776 543',
    morningStartTime: '06:25 AM',
    morningSchoolArrivalTime: '07:35 AM',
    afternoonDepartureTime: '03:45 PM',
    afternoonEndTime: '05:00 PM',
    termFee: 17000,
    status: 'Active',
    stops: [
      {
        id: 'stop-301',
        stopName: 'TRM Mall Service Lane',
        landmark: 'Thika Road Mall Gate 2',
        morningPickupTime: '06:30 AM',
        afternoonDropoffTime: '04:25 PM',
        studentCount: 6
      },
      {
        id: 'stop-302',
        stopName: 'Safari Park Hotel Stage',
        landmark: 'Near USIU Road turnoff',
        morningPickupTime: '06:45 AM',
        afternoonDropoffTime: '04:40 PM',
        studentCount: 5
      },
      {
        id: 'stop-303',
        stopName: 'Garden City Mall Overpass',
        landmark: 'Near Will Mary stage',
        morningPickupTime: '07:00 AM',
        afternoonDropoffTime: '04:55 PM',
        studentCount: 8
      }
    ]
  }
];

export const INITIAL_STUDENT_TRANSPORT_PROFILES: StudentTransportProfile[] = [
  {
    id: 'stp-1',
    studentId: 'stu-otieno-4',
    studentName: 'Brian Otieno',
    admissionNumber: 'ADM/2026/0401',
    grade: 4,
    stream: 'Dove',
    parentName: 'Mr. David Otieno',
    parentPhone: '+254 722 112 233',
    routeId: 'route-01',
    routeName: 'Route 01 – Kiambu Road & Muthaiga Express',
    busPlate: 'KDG 218M',
    busNumber: 'Bus 01',
    seatNumber: 'Seat 14A',
    pickupStop: 'Ridgeways Mall Total Station',
    dropoffStop: 'Ridgeways Mall Total Station',
    morningPickupTime: '06:40 AM',
    afternoonDropoffTime: '04:30 PM',
    transportStatus: 'Active',
    specialInstructions: 'Carries emergency salbutamol inhaler in school bag side pouch.',
    authorizedCollector: 'Mr. David Otieno (Father) or Mrs. Hellen Otieno (Mother)',
    feeStatus: 'Paid',
    termFee: 18500,
    balance: 0
  },
  {
    id: 'stp-2',
    studentId: 'stu-chebet-5',
    studentName: 'Faith Chebet',
    admissionNumber: 'ADM/2026/0501',
    grade: 5,
    stream: 'Eagle',
    parentName: 'Mrs. Caroline Chebet',
    parentPhone: '+254 722 998 877',
    routeId: 'route-01',
    routeName: 'Route 01 – Kiambu Road & Muthaiga Express',
    busPlate: 'KDG 218M',
    busNumber: 'Bus 01',
    seatNumber: 'Seat 08B',
    pickupStop: 'Fourways Junction Estate Gate',
    dropoffStop: 'Fourways Junction Estate Gate',
    morningPickupTime: '06:25 AM',
    afternoonDropoffTime: '04:15 PM',
    transportStatus: 'Active',
    specialInstructions: 'Front seats preferred due to mild motion sensitivity.',
    authorizedCollector: 'Mrs. Caroline Chebet or driver verification passcode.',
    feeStatus: 'Paid',
    termFee: 18500,
    balance: 0
  },
  {
    id: 'stp-3',
    studentId: 'stu-kip-7',
    studentName: 'Emmanuel Kiprono',
    admissionNumber: 'ADM/2026/0701',
    grade: 7,
    stream: 'Mara',
    parentName: 'Mr. Daniel Kiprono',
    parentPhone: '+254 721 554 433',
    routeId: 'route-01',
    routeName: 'Route 01 – Kiambu Road & Muthaiga Express',
    busPlate: 'KDG 218M',
    busNumber: 'Bus 01',
    seatNumber: 'Seat 22C',
    pickupStop: 'DCI Headquarters Mazingira Complex',
    dropoffStop: 'DCI Headquarters Mazingira Complex',
    morningPickupTime: '06:55 AM',
    afternoonDropoffTime: '04:45 PM',
    transportStatus: 'Active',
    specialInstructions: 'Junior School science project carrier; leaves with bag compartment access.',
    authorizedCollector: 'Self collection authorized (Grade 7 student identification card verified)',
    feeStatus: 'Paid',
    termFee: 18500,
    balance: 0
  },
  {
    id: 'stp-4',
    studentId: 'stu-wanjiku-8',
    studentName: 'Grace Wanjiku',
    admissionNumber: 'ADM/2026/0801',
    grade: 8,
    stream: 'Chania',
    parentName: 'Mrs. Alice Wanjiku',
    parentPhone: '+254 720 334 455',
    routeId: 'route-02',
    routeName: 'Route 02 – Ngong Road & South C Shuttle',
    busPlate: 'KDM 490T',
    busNumber: 'Bus 02',
    seatNumber: 'Seat 10A',
    pickupStop: 'Adams Arcade Market',
    dropoffStop: 'Adams Arcade Market',
    morningPickupTime: '06:38 AM',
    afternoonDropoffTime: '04:35 PM',
    transportStatus: 'Active',
    specialInstructions: 'Junior school peer mentor; assists with Grade 1 & 2 learners boarding.',
    authorizedCollector: 'Mrs. Alice Wanjiku (Mother)',
    feeStatus: 'Paid',
    termFee: 19500,
    balance: 0
  },
  {
    id: 'stp-5',
    studentId: 'stu-mutua-4',
    studentName: 'Kevin Mutua',
    admissionNumber: 'ADM/2026/0402',
    grade: 4,
    stream: 'Dove',
    parentName: 'Mr. James Mutua',
    parentPhone: '+254 724 667 788',
    routeId: 'route-02',
    routeName: 'Route 02 – Ngong Road & South C Shuttle',
    busPlate: 'KDM 490T',
    busNumber: 'Bus 02',
    seatNumber: 'Seat 18B',
    pickupStop: 'The Junction Mall Shell',
    dropoffStop: 'The Junction Mall Shell',
    morningPickupTime: '06:20 AM',
    afternoonDropoffTime: '04:20 PM',
    transportStatus: 'Active',
    specialInstructions: 'Allergies to peanut snacks; monitored by chaperone during snack time.',
    authorizedCollector: 'Mr. James Mutua or Sister Christine Mutua',
    feeStatus: 'Partial',
    termFee: 19500,
    balance: 4500
  },
  {
    id: 'stp-6',
    studentId: 'stu-kamau-6',
    studentName: 'Stacy Kamau',
    admissionNumber: 'ADM/2026/0601',
    grade: 6,
    stream: 'Falcon',
    parentName: 'Dr. Robert Kamau',
    parentPhone: '+254 722 887 766',
    routeId: 'route-03',
    routeName: 'Route 03 – Thika Highway & Garden City Circuit',
    busPlate: 'KDB 112W',
    busNumber: 'Bus 03',
    seatNumber: 'Seat 05C',
    pickupStop: 'Garden City Mall Overpass',
    dropoffStop: 'Garden City Mall Overpass',
    morningPickupTime: '07:00 AM',
    afternoonDropoffTime: '04:55 PM',
    transportStatus: 'Active',
    specialInstructions: 'Student band flute case kept safely under seat.',
    authorizedCollector: 'Dr. Robert Kamau (Father)',
    feeStatus: 'Paid',
    termFee: 17000,
    balance: 0
  }
];

export const INITIAL_TRANSPORT_TRIP_RECORDS: TransportTripRecord[] = [
  {
    id: 'ttr-01',
    date: '2026-10-04',
    tripType: 'Morning Pickup',
    routeId: 'route-01',
    routeName: 'Route 01 – Kiambu Road & Muthaiga Express',
    busPlate: 'KDG 218M',
    driverName: 'Mr. Josephat Kipkoech',
    assistantName: 'Ms. Mary Wambui',
    studentId: 'stu-otieno-4',
    studentName: 'Brian Otieno',
    grade: 4,
    stream: 'Dove',
    stopName: 'Ridgeways Mall Total Station',
    status: 'Boarded',
    timestamp: '06:42 AM',
    recordedBy: 'Ms. Mary Wambui (Chaperone)',
    notes: 'Boarded safely; uniform checked and seatbelt buckled.'
  },
  {
    id: 'ttr-02',
    date: '2026-10-04',
    tripType: 'Morning Pickup',
    routeId: 'route-01',
    routeName: 'Route 01 – Kiambu Road & Muthaiga Express',
    busPlate: 'KDG 218M',
    driverName: 'Mr. Josephat Kipkoech',
    assistantName: 'Ms. Mary Wambui',
    studentId: 'stu-chebet-5',
    studentName: 'Faith Chebet',
    grade: 5,
    stream: 'Eagle',
    stopName: 'Fourways Junction Estate Gate',
    status: 'Boarded',
    timestamp: '06:27 AM',
    recordedBy: 'Ms. Mary Wambui (Chaperone)',
    notes: 'Boarded on schedule.'
  },
  {
    id: 'ttr-03',
    date: '2026-10-04',
    tripType: 'Morning Pickup',
    routeId: 'route-01',
    routeName: 'Route 01 – Kiambu Road & Muthaiga Express',
    busPlate: 'KDG 218M',
    driverName: 'Mr. Josephat Kipkoech',
    assistantName: 'Ms. Mary Wambui',
    studentId: 'stu-kip-7',
    studentName: 'Emmanuel Kiprono',
    grade: 7,
    stream: 'Mara',
    stopName: 'DCI Headquarters Mazingira Complex',
    status: 'Boarded',
    timestamp: '06:57 AM',
    recordedBy: 'Ms. Mary Wambui (Chaperone)',
    notes: 'Handed project kit to luggage shelf.'
  },
  {
    id: 'ttr-04',
    date: '2026-10-04',
    tripType: 'Morning Pickup',
    routeId: 'route-02',
    routeName: 'Route 02 – Ngong Road & South C Shuttle',
    busPlate: 'KDM 490T',
    driverName: 'Mr. Peter Njoroge',
    assistantName: 'Mrs. Eunice Akinyi',
    studentId: 'stu-wanjiku-8',
    studentName: 'Grace Wanjiku',
    grade: 8,
    stream: 'Chania',
    stopName: 'Adams Arcade Market',
    status: 'Boarded',
    timestamp: '06:40 AM',
    recordedBy: 'Mrs. Eunice Akinyi (Chaperone)',
    notes: 'Onboarded on schedule.'
  },
  {
    id: 'ttr-05',
    date: '2026-10-04',
    tripType: 'Morning Pickup',
    routeId: 'route-02',
    routeName: 'Route 02 – Ngong Road & South C Shuttle',
    busPlate: 'KDM 490T',
    driverName: 'Mr. Peter Njoroge',
    assistantName: 'Mrs. Eunice Akinyi',
    studentId: 'stu-mutua-4',
    studentName: 'Kevin Mutua',
    grade: 4,
    stream: 'Dove',
    stopName: 'The Junction Mall Shell',
    status: 'Boarded',
    timestamp: '06:22 AM',
    recordedBy: 'Mrs. Eunice Akinyi (Chaperone)',
    notes: 'Parent escorted to bus steps.'
  }
];

export const INITIAL_TRANSPORT_INCIDENTS: TransportIncident[] = [
  {
    id: 'inc-01',
    date: '2026-10-03',
    time: '07:10 AM',
    busPlate: 'KDG 218M',
    driverName: 'Mr. Josephat Kipkoech',
    route: 'Route 01 – Kiambu Road',
    severity: 'Low',
    incidentType: 'Traffic Delay',
    description: 'Slow-moving commuter traffic along Muthaiga roundabout due to minor roadworks. Caused a 10-minute delay.',
    actionTaken: 'Driver notified school transport supervisor; SMS dispatched to all parents informing them of safe, controlled delay. Bus arrived safely on campus at 07:45 AM.',
    reportedBy: 'Mr. Josephat Kipkoech (Lead Driver)',
    followUpStatus: 'Resolved',
    studentsInvolved: ['All Route 01 passengers']
  },
  {
    id: 'inc-02',
    date: '2026-09-28',
    time: '04:35 PM',
    busPlate: 'KDM 490T',
    driverName: 'Mr. Peter Njoroge',
    route: 'Route 02 – Ngong Road',
    severity: 'Medium',
    incidentType: 'Unauthorized Collector Attempt',
    description: 'An unidentified person claiming to be a neighbour attempted to collect Grade 4 learner without parent written authorization.',
    actionTaken: 'Bus chaperone immediately withheld learner, contacted mother Dr. Caroline Chebet by direct call. Mother confirmed neighbour was not authorized. Learner safely retained and handed over to mother at school security office.',
    reportedBy: 'Mrs. Eunice Akinyi (Bus Chaperone)',
    followUpStatus: 'Resolved',
    studentsInvolved: ['Kevin Mutua']
  }
];

export const INITIAL_TRANSPORT_ALERTS: TransportAlert[] = [
  {
    id: 'alt-01',
    timestamp: '2026-10-04 07:38 AM',
    routeId: 'route-01',
    busPlate: 'KDG 218M',
    type: 'arrived_school',
    title: 'Bus 01 Arrived Safely at Campus',
    message: 'All 28 morning commuters on Kiambu Road Express have safely alighted at Campus Bus Bay and reported to morning assembly.',
    targetAudience: 'all_parents'
  },
  {
    id: 'alt-02',
    timestamp: '2026-10-04 06:42 AM',
    routeId: 'route-01',
    busPlate: 'KDG 218M',
    type: 'boarded',
    title: 'Student Boarding Confirmed: Brian Otieno',
    message: 'Brian Otieno safely boarded Bus 01 at Ridgeways Mall Total Station with Chaperone Ms. Mary Wambui.',
    targetAudience: 'route_parents'
  },
  {
    id: 'alt-03',
    timestamp: '2026-10-04 06:18 AM',
    routeId: 'route-02',
    busPlate: 'KDM 490T',
    type: 'departure',
    title: 'Morning Route 02 Commenced',
    message: 'Bus 02 departed Junction Mall depot on schedule with Driver Peter Njoroge.',
    targetAudience: 'route_parents'
  }
];

// ========================================================
// 🎯 INITIAL CO-CURRICULAR ACTIVITIES & TALENT DATA
// ========================================================

export const INITIAL_CO_CURRICULAR_ACTIVITIES: CoCurricularActivity[] = [
  {
    id: 'act-football',
    name: 'Simba Football Academy (U-13 & U-11)',
    category: 'Sports',
    type: 'sport',
    description: 'Premier soccer academy focusing on technical ball control, tactical positioning, physical agility, and national tournament fixtures.',
    patronName: 'Coach Benjamin Omwenga',
    patronPhone: '+254 722 789 012',
    patronEmail: 'cocurricular@edusmart.ac.ke',
    assistantName: 'Coach Kevin Baraza',
    venue: 'Main Sports Complex & Football Pitch',
    meetingDays: ['Tuesday', 'Thursday'],
    meetingTime: '04:00 PM - 05:30 PM',
    targetGrades: [3, 4, 5, 6, 7, 8, 9],
    maxParticipants: 40,
    currentMembersCount: 32,
    status: 'Active',
    achievementsCount: 5,
    icon: '⚽'
  },
  {
    id: 'act-basketball',
    name: 'Warriors Basketball Team',
    category: 'Sports',
    type: 'sport',
    description: 'Competitive basketball team focusing on fast breaks, defensive zones, three-point shooting, and inter-school league participation.',
    patronName: 'Coach Dennis Ochieng',
    patronPhone: '+254 723 889 110',
    patronEmail: 'basketball@edusmart.ac.ke',
    venue: 'Floodlit Outdoor Courts',
    meetingDays: ['Monday', 'Wednesday'],
    meetingTime: '04:00 PM - 05:30 PM',
    targetGrades: [4, 5, 6, 7, 8, 9],
    maxParticipants: 30,
    currentMembersCount: 24,
    status: 'Active',
    achievementsCount: 3,
    icon: '🏀'
  },
  {
    id: 'act-swimming',
    name: 'Dolphins Swimming Squad',
    category: 'Sports',
    type: 'sport',
    description: 'Year-round competitive swimming squad training in freestyle, backstroke, butterfly, breaststroke, and relay galas.',
    patronName: 'Coach Sarah Nekesa',
    patronPhone: '+254 711 445 221',
    patronEmail: 'swimming@edusmart.ac.ke',
    venue: 'Semi-Olympic Heated Swimming Pool',
    meetingDays: ['Tuesday', 'Friday'],
    meetingTime: '06:30 AM - 07:30 AM & 04:00 PM',
    targetGrades: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    maxParticipants: 35,
    currentMembersCount: 28,
    status: 'Active',
    achievementsCount: 7,
    icon: '🏊'
  },
  {
    id: 'act-athletics',
    name: 'Track & Field Athletics Club',
    category: 'Sports',
    type: 'sport',
    description: 'Sprint, middle distance, hurdles, long jump, and relay training geared toward regional track meets and cross country.',
    patronName: 'Coach Paul Kipchumba',
    patronPhone: '+254 720 119 883',
    patronEmail: 'athletics@edusmart.ac.ke',
    venue: 'Standard 400m Running Track',
    meetingDays: ['Wednesday', 'Saturday'],
    meetingTime: '04:00 PM - 05:15 PM',
    targetGrades: [4, 5, 6, 7, 8, 9],
    maxParticipants: 45,
    currentMembersCount: 36,
    status: 'Active',
    achievementsCount: 4,
    icon: '🏃'
  },
  {
    id: 'act-debate',
    name: 'Great Debaters & Public Speaking Society',
    category: 'Clubs & Societies',
    type: 'club',
    description: 'Developing eloquent orators, critical thinkers, and parliamentary debaters. Competing in Model UN and Kenya National Debate League.',
    patronName: 'Madame Grace Achieng',
    patronPhone: '+254 721 345 987',
    patronEmail: 'patron@edusmart.ac.ke',
    assistantName: 'Mr. David Kiprono',
    venue: 'Junior Secondary Amphitheatre',
    meetingDays: ['Tuesday', 'Thursday'],
    meetingTime: '04:00 PM - 05:15 PM',
    targetGrades: [4, 5, 6, 7, 8, 9],
    maxParticipants: 35,
    currentMembersCount: 28,
    status: 'Active',
    achievementsCount: 6,
    icon: '🎙️'
  },
  {
    id: 'act-robotics',
    name: 'Robotics, AI & Coding Innovators',
    category: 'STEM & Innovation',
    type: 'club',
    description: 'Hands-on hardware microcontrollers (Arduino, Raspberry Pi), Python coding, autonomous rovers, and Kenya Science & Engineering Fair exhibits.',
    patronName: 'Mr. Kelvin Muriuki',
    patronPhone: '+254 728 556 771',
    patronEmail: 'robotics@edusmart.ac.ke',
    venue: 'Smart STEM & Innovation Lab',
    meetingDays: ['Monday', 'Wednesday'],
    meetingTime: '04:00 PM - 05:30 PM',
    targetGrades: [3, 4, 5, 6, 7, 8, 9],
    maxParticipants: 28,
    currentMembersCount: 25,
    status: 'Active',
    achievementsCount: 4,
    icon: '🤖'
  },
  {
    id: 'act-music',
    name: 'Symphony Brass Band & Choral Ensemble',
    category: 'Creative Arts & Music',
    type: 'club',
    description: 'Instrumental mastery in trumpets, saxophones, violins, drums, and choral harmonization. Performs at national ceremonies and festivals.',
    patronName: 'Mr. Emmanuel Wekesa',
    patronPhone: '+254 725 334 112',
    patronEmail: 'music@edusmart.ac.ke',
    venue: 'Music Auditorium & Rehearsal Suites',
    meetingDays: ['Monday', 'Thursday'],
    meetingTime: '04:00 PM - 05:30 PM',
    targetGrades: [2, 3, 4, 5, 6, 7, 8, 9],
    maxParticipants: 40,
    currentMembersCount: 34,
    status: 'Active',
    achievementsCount: 8,
    icon: '🎺'
  },
  {
    id: 'act-drama',
    name: 'Creative Drama & Performing Arts Troupe',
    category: 'Creative Arts & Music',
    type: 'club',
    description: 'Stage plays, poetry dramatization, cultural dances, costume design, and voice projection for Kenya National Drama Festival.',
    patronName: 'Madame Grace Achieng',
    patronPhone: '+254 721 345 987',
    patronEmail: 'patron@edusmart.ac.ke',
    venue: 'Performing Arts Theatre Hall',
    meetingDays: ['Wednesday', 'Friday'],
    meetingTime: '04:00 PM - 05:30 PM',
    targetGrades: [3, 4, 5, 6, 7, 8, 9],
    maxParticipants: 35,
    currentMembersCount: 26,
    status: 'Active',
    achievementsCount: 4,
    icon: '🎭'
  },
  {
    id: 'act-chess',
    name: 'Grandmasters Chess & Board Strategy Club',
    category: 'Clubs & Societies',
    type: 'club',
    description: 'Analytical tactical openings, endgame tactics, blindfold visualization, and FIDE-rated inter-school chess championships.',
    patronName: 'Mr. George Odhiambo',
    patronPhone: '+254 719 883 204',
    patronEmail: 'chess@edusmart.ac.ke',
    venue: 'Library East Quiet Study Wing',
    meetingDays: ['Tuesday', 'Thursday'],
    meetingTime: '04:00 PM - 05:00 PM',
    targetGrades: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    maxParticipants: 30,
    currentMembersCount: 22,
    status: 'Active',
    achievementsCount: 3,
    icon: '♟️'
  },
  {
    id: 'act-scouts',
    name: 'Kenya Scouts & Girl Guides Movement',
    category: 'Leadership & Service',
    type: 'club',
    description: 'Outdoor camping skills, knot tying, first aid emergency response, leadership badges, civic volunteering, and ceremonial drills.',
    patronName: 'Scouter Evans Macharia',
    patronPhone: '+254 724 661 905',
    patronEmail: 'scouts@edusmart.ac.ke',
    venue: 'School Parade Ground & Pavilion',
    meetingDays: ['Friday'],
    meetingTime: '03:45 PM - 05:15 PM',
    targetGrades: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    maxParticipants: 50,
    currentMembersCount: 42,
    status: 'Active',
    achievementsCount: 5,
    icon: '⚜️'
  }
];

export const INITIAL_LEARNER_CO_CURRICULAR_PROFILES: LearnerCoCurricularProfile[] = [
  {
    id: 'lcp-01',
    studentId: 'stu-otieno-4',
    studentName: 'Brian Otieno',
    admissionNumber: 'ADM/2026/0401',
    grade: 4,
    stream: 'Dove',
    activityId: 'act-football',
    activityName: 'Simba Football Academy (U-13 & U-11)',
    category: 'Sports',
    role: 'Team Captain',
    registrationStatus: 'Active',
    registrationDate: '2026-01-12',
    attendanceRate: 96,
    talentStrengths: ['Football', 'Athletics', 'Leadership'],
    competitionsAttended: [
      'Nairobi Primary Schools Cup 2026',
      'KASSU Inter-County U-11 Tournament'
    ],
    awardsEarned: [
      'Top Scorer & Golden Boot (11 Goals)',
      'Most Valuable Player Trophy'
    ],
    coachNotes: 'Exceptional pitch awareness, tactical leadership, and disciplined work rate. Inspires team morale during tight fixtures.',
    parentConsentGiven: true
  },
  {
    id: 'lcp-02',
    studentId: 'stu-chebet-5',
    studentName: 'Faith Chebet',
    admissionNumber: 'ADM/2026/0501',
    grade: 5,
    stream: 'Eagle',
    activityId: 'act-music',
    activityName: 'Symphony Brass Band & Choral Ensemble',
    category: 'Creative Arts & Music',
    role: 'Member',
    registrationStatus: 'Active',
    registrationDate: '2026-01-14',
    attendanceRate: 98,
    talentStrengths: ['Music & Instruments', 'Drama & Acting'],
    competitionsAttended: [
      'Kenya Music Festival Regional Finals 2026',
      'Nairobi Young Instrumentalists Showcase'
    ],
    awardsEarned: [
      'First Place Trumpet Solo Grade 5 Category (Gold Certificate)',
      'Best Ensemble Harmony Award'
    ],
    coachNotes: 'Gifted pitch clarity and remarkable breath control on the Bb trumpet. Dedicated practice discipline.',
    parentConsentGiven: true
  },
  {
    id: 'lcp-03',
    studentId: 'stu-kip-7',
    studentName: 'Emmanuel Kiprono',
    admissionNumber: 'ADM/2026/0701',
    grade: 7,
    stream: 'Mara',
    activityId: 'act-robotics',
    activityName: 'Robotics, AI & Coding Innovators',
    category: 'STEM & Innovation',
    role: 'Club President',
    registrationStatus: 'Active',
    registrationDate: '2026-01-10',
    attendanceRate: 95,
    talentStrengths: ['Robotics & STEM', 'Leadership'],
    competitionsAttended: [
      'Kenya Science & Engineering Fair (KSEF) 2026',
      'Pan-African Young Coders Hackathon'
    ],
    awardsEarned: [
      'First Prize Innovation in Agriculture Automation Trophy',
      'Best Code Architecture Certificate'
    ],
    coachNotes: 'Superb problem-solving mindset and coding proficiency in Python and Arduino C++. Spearheads club projects with diligence.',
    parentConsentGiven: true
  },
  {
    id: 'lcp-04',
    studentId: 'stu-wanjiku-8',
    studentName: 'Grace Wanjiku',
    admissionNumber: 'ADM/2026/0801',
    grade: 8,
    stream: 'Chania',
    activityId: 'act-debate',
    activityName: 'Great Debaters & Public Speaking Society',
    category: 'Clubs & Societies',
    role: 'Secretary',
    registrationStatus: 'Active',
    registrationDate: '2026-01-15',
    attendanceRate: 96,
    talentStrengths: ['Debate & Public Speaking', 'Leadership'],
    competitionsAttended: [
      'National Inter-School Parliamentary Debate League',
      'East Africa Model United Nations (EAMUN) 2026'
    ],
    awardsEarned: [
      'Best Junior Speaker Nairobi Region Award',
      'Distinguished Delegate Trophy'
    ],
    coachNotes: 'Articulate delivery, cogent argumentation, and powerful rebuttals. Mentors Grade 4 and 5 debaters during joint practice.',
    parentConsentGiven: true
  },
  {
    id: 'lcp-05',
    studentId: 'stu-mutua-4',
    studentName: 'Kevin Mutua',
    admissionNumber: 'ADM/2026/0402',
    grade: 4,
    stream: 'Dove',
    activityId: 'act-chess',
    activityName: 'Grandmasters Chess & Board Strategy Club',
    category: 'Clubs & Societies',
    role: 'Member',
    registrationStatus: 'Active',
    registrationDate: '2026-01-16',
    attendanceRate: 92,
    talentStrengths: ['Chess', 'Fine Art'],
    competitionsAttended: [
      'Kenya National Youth Chess Championship 2026',
      'Kasparov Chess Foundation Nairobi Open'
    ],
    awardsEarned: [
      'Under-10 Category Bronze Medalist (5.5/7 points)'
    ],
    coachNotes: 'Sharp tactical vision with the Sicilian Defense. Developing patience in deep endgame calculations.',
    parentConsentGiven: true
  },
  {
    id: 'lcp-06',
    studentId: 'stu-kamau-6',
    studentName: 'Stacy Kamau',
    admissionNumber: 'ADM/2026/0601',
    grade: 6,
    stream: 'Falcon',
    activityId: 'act-swimming',
    activityName: 'Dolphins Swimming Squad',
    category: 'Sports',
    role: 'Team Captain',
    registrationStatus: 'Active',
    registrationDate: '2026-01-12',
    attendanceRate: 97,
    talentStrengths: ['Swimming', 'Athletics'],
    competitionsAttended: [
      'Kenya Swimming Federation (KSF) Junior Gala',
      'Oshwal Academy Invitational Gala 2026'
    ],
    awardsEarned: [
      'Gold Medal 50m Butterfly (32.4s)',
      'Gold Medal 100m Freestyle (1m 06s)'
    ],
    coachNotes: 'Elite hydrodynamic stroke technique and explosive start off the blocks. Exudes sportsmanship.',
    parentConsentGiven: true
  }
];

export const INITIAL_CO_CURRICULAR_ATTENDANCE: CoCurricularAttendanceRecord[] = [
  {
    id: 'cca-01',
    activityId: 'act-football',
    activityName: 'Simba Football Academy (U-13 & U-11)',
    date: '2026-10-02',
    studentId: 'stu-otieno-4',
    studentName: 'Brian Otieno',
    grade: 4,
    stream: 'Dove',
    status: 'Present',
    recordedBy: 'Coach Benjamin Omwenga',
    notes: 'Led warmups and finished set-piece drills.'
  },
  {
    id: 'cca-02',
    activityId: 'act-music',
    activityName: 'Symphony Brass Band & Choral Ensemble',
    date: '2026-10-01',
    studentId: 'stu-chebet-5',
    studentName: 'Faith Chebet',
    grade: 5,
    stream: 'Eagle',
    status: 'Present',
    recordedBy: 'Mr. Emmanuel Wekesa',
    notes: 'Mastered fanfare trumpet section bars 24-48.'
  },
  {
    id: 'cca-03',
    activityId: 'act-robotics',
    activityName: 'Robotics, AI & Coding Innovators',
    date: '2026-09-30',
    studentId: 'stu-kip-7',
    studentName: 'Emmanuel Kiprono',
    grade: 7,
    stream: 'Mara',
    status: 'Present',
    recordedBy: 'Mr. Kelvin Muriuki',
    notes: 'Calibrated ultrasonic sensors on obstacle avoidance chassis.'
  },
  {
    id: 'cca-04',
    activityId: 'act-debate',
    activityName: 'Great Debaters & Public Speaking Society',
    date: '2026-10-01',
    studentId: 'stu-wanjiku-8',
    studentName: 'Grace Wanjiku',
    grade: 8,
    stream: 'Chania',
    status: 'Present',
    recordedBy: 'Madame Grace Achieng',
    notes: 'Delivered affirmative opening on Climate Policy motion.'
  },
  {
    id: 'cca-05',
    activityId: 'act-chess',
    activityName: 'Grandmasters Chess & Board Strategy Club',
    date: '2026-10-02',
    studentId: 'stu-mutua-4',
    studentName: 'Kevin Mutua',
    grade: 4,
    stream: 'Dove',
    status: 'Present',
    recordedBy: 'Mr. George Odhiambo',
    notes: 'Won 2 blitz rounds using King Indian Defense.'
  },
  {
    id: 'cca-06',
    activityId: 'act-swimming',
    activityName: 'Dolphins Swimming Squad',
    date: '2026-10-02',
    studentId: 'stu-kamau-6',
    studentName: 'Stacy Kamau',
    grade: 6,
    stream: 'Falcon',
    status: 'Present',
    recordedBy: 'Coach Sarah Nekesa',
    notes: 'Completed 1,500m threshold endurance set.'
  }
];

export const INITIAL_CO_CURRICULAR_COMPETITIONS: CoCurricularCompetition[] = [
  {
    id: 'comp-01',
    title: 'Nairobi Inter-School Soccer Derby & Cup 2026',
    activityId: 'act-football',
    activityName: 'Simba Football Academy (U-13 & U-11)',
    category: 'Sports Competition',
    date: '2026-09-26',
    venue: 'Nyayo National Stadium Annex',
    host: 'Nairobi County Education Directorate',
    participatingSchools: ['EduSmart Academy', 'St. Austin Academy', 'Braeburn School', 'Brookhouse'],
    ourPosition: 'Champions (1st Place · Gold Trophy)',
    scoreOrTime: 'Final: 3 - 1 vs St. Austin',
    awards: ['Gold Trophy', 'Golden Boot (Brian Otieno)', 'Best Coach Award'],
    coachAccompanying: 'Coach Benjamin Omwenga',
    status: 'Completed',
    report: 'EduSmart dominated both halves with clinical finishes and disciplined midfield recovery. High commendation from match officials.'
  },
  {
    id: 'comp-02',
    title: 'Kenya National Music Festival Regional Finals',
    activityId: 'act-music',
    activityName: 'Symphony Brass Band & Choral Ensemble',
    category: 'Creative Arts & Music',
    date: '2026-09-18',
    venue: 'Kenya Cultural Centre & National Theatre',
    host: 'Ministry of Education',
    participatingSchools: ['EduSmart Academy', 'Alliance High', 'Kenya High', 'Kianda School'],
    ourPosition: '1st Runners Up (Silver Award)',
    scoreOrTime: 'Adjudicator Score: 94 / 100',
    awards: ['Silver Plaque', 'Best Brass Instrumental Solo (Faith Chebet)'],
    coachAccompanying: 'Mr. Emmanuel Wekesa',
    status: 'Completed',
    report: 'Exceptional brass harmonization and precise tempo modulation. Qualified for the National Finals in Mombasa.'
  },
  {
    id: 'comp-03',
    title: 'East Africa Junior Debating Open Championship',
    activityId: 'act-debate',
    activityName: 'Great Debaters & Public Speaking Society',
    category: 'Academic & Speech',
    date: '2026-10-18',
    venue: 'Strathmore University Auditorium',
    host: 'East Africa Debate Council',
    participatingSchools: ['EduSmart Academy', 'Greensteds', 'Hillcrest', 'St. Mary School'],
    ourPosition: 'Confirmed Finalist Delegation',
    scoreOrTime: 'Seeded #1 in Nairobi Division',
    awards: ['Upcoming Event'],
    coachAccompanying: 'Madame Grace Achieng',
    status: 'Upcoming',
    report: 'Team is currently in intensive motion preparation covering Global Trade and Digital AI Governance.'
  },
  {
    id: 'comp-04',
    title: 'Kenya Science & Engineering Fair (KSEF) Regional Finals',
    activityId: 'act-robotics',
    activityName: 'Robotics, AI & Coding Innovators',
    category: 'STEM & Robotics',
    date: '2026-09-12',
    venue: 'University of Nairobi Science Complex',
    host: 'National Commission for Science & Technology (NACOSTI)',
    participatingSchools: ['EduSmart Academy', 'Mang\'u High', 'Lenana School', 'Moi Girls'],
    ourPosition: '1st Place (Gold Trophy in Applied Tech)',
    scoreOrTime: 'Score: 96.5% Innovation Index',
    awards: ['Gold Trophy', 'Young Innovator of the Year Award'],
    coachAccompanying: 'Mr. Kelvin Muriuki',
    status: 'Completed',
    report: 'Autonomous solar-powered crop hydration rover built by Emmanuel Kiprono and team received unanimous acclaim from university panel.'
  }
];

export const INITIAL_CO_CURRICULAR_EQUIPMENT: CoCurricularEquipment[] = [
  {
    id: 'eq-01',
    itemName: 'FIFA Certified Match Footballs (Size 4 & 5)',
    category: 'Sports',
    quantity: 24,
    condition: 'New / Excellent',
    assignedActivity: 'Simba Football Academy',
    storageLocation: 'Sports Pavilion Store A',
    lastAuditDate: '2026-09-28'
  },
  {
    id: 'eq-02',
    itemName: 'Spalding Official Outdoor Basketballs',
    category: 'Sports',
    quantity: 16,
    condition: 'Good',
    assignedActivity: 'Warriors Basketball Team',
    storageLocation: 'Court Pavilion Store',
    lastAuditDate: '2026-09-28'
  },
  {
    id: 'eq-03',
    itemName: 'Yamaha YTR-2330 Bb Standard Trumpets',
    category: 'Music',
    quantity: 8,
    condition: 'New / Excellent',
    assignedActivity: 'Symphony Brass Band',
    storageLocation: 'Music Suite Instrument Vault',
    lastAuditDate: '2026-10-01'
  },
  {
    id: 'eq-04',
    itemName: 'Tournament Weighted Chess Boards & Digital DGT Timers',
    category: 'Clubs',
    quantity: 18,
    condition: 'Good',
    assignedActivity: 'Grandmasters Chess Club',
    storageLocation: 'Library East Archive',
    lastAuditDate: '2026-09-25'
  },
  {
    id: 'eq-05',
    itemName: 'Arduino Mega & IoT Sensor Robotics Starter Kits',
    category: 'STEM',
    quantity: 20,
    condition: 'New / Excellent',
    assignedActivity: 'Robotics Innovators',
    storageLocation: 'STEM Lab Locker 04',
    lastAuditDate: '2026-10-02'
  }
];

export const INITIAL_CO_CURRICULAR_TRIPS: CoCurricularTrip[] = [
  {
    id: 'trip-01',
    activityId: 'act-debate',
    activityName: 'Great Debaters & Public Speaking Society',
    destination: 'Kenya National Theatre, Nairobi',
    date: '2026-10-24',
    departureTime: '07:30 AM',
    returnTime: '06:00 PM',
    purpose: 'National Model United Nations & Inter-School Debate Semi-Finals',
    busAllocated: 'KDE 301E (Simba 01)',
    driverName: 'Mr. Josephat Kipkoech',
    accompanyingStaff: ['Madame Grace Achieng', 'Mr. David Kiprono'],
    participantLearnerIds: ['stu-wanjiku-7', 'stu-kiprono-8', 'stu-otieno-4'],
    parentConsentRequired: true,
    status: 'Scheduled',
    emergencyContact: '+254 721 345 987 (Madame Grace Achieng)',
    estimatedCostPerLearner: 1200,
    report: 'Official transport booked with EduSmart fleet. 28 delegate badges reserved.'
  },
  {
    id: 'trip-02',
    activityId: 'act-football',
    activityName: 'Simba Football Academy (U-13 & U-11)',
    destination: 'Kasarani International Sports Annex',
    date: '2026-10-18',
    departureTime: '08:00 AM',
    returnTime: '04:30 PM',
    purpose: 'Nairobi Inter-County Youth Soccer Invitational Cup (Quarter Finals)',
    busAllocated: 'KDE 302E (Simba 02)',
    driverName: 'Mr. Peter Otieno',
    accompanyingStaff: ['Coach Benjamin Omwenga', 'Coach Kevin Baraza'],
    participantLearnerIds: ['stu-otieno-4', 'stu-kamau-5'],
    parentConsentRequired: true,
    status: 'Scheduled',
    emergencyContact: '+254 722 789 012 (Coach Benjamin Omwenga)',
    estimatedCostPerLearner: 800,
    report: 'U-13 roster finalized. Medical kit and tournament hydration logistics in place.'
  },
  {
    id: 'trip-03',
    activityId: 'act-swimming',
    activityName: 'Dolphins Swimming Squad',
    destination: 'Brookhouse Runda Aquatic Center',
    date: '2026-09-26',
    departureTime: '06:30 AM',
    returnTime: '03:30 PM',
    purpose: 'Kenya Swimming Federation Junior League Meet',
    busAllocated: 'KDE 303E (Simba 03)',
    driverName: 'Mr. Samuel Mwangi',
    accompanyingStaff: ['Coach Sarah Nekesa'],
    participantLearnerIds: ['stu-mutua-3', 'stu-kamau-5'],
    parentConsentRequired: true,
    status: 'Completed',
    emergencyContact: '+254 711 445 221 (Coach Sarah Nekesa)',
    estimatedCostPerLearner: 1500,
    report: 'Won 3 gold and 2 silver medals. All swimmers returned safely by 03:20 PM.'
  }
];

export const INITIAL_CO_CURRICULAR_ANNOUNCEMENTS: CoCurricularAnnouncement[] = [
  {
    id: 'ann-01',
    title: 'Regional Debate Gala - Team Selection Confirmed',
    category: 'Competitions',
    message: 'Congratulations to our 12 delegates selected for the National Model UN semi-finals at Kenya National Theatre. Rehearsals will be held every Tuesday and Thursday.',
    targetAudience: 'All',
    activityId: 'act-debate',
    activityName: 'Great Debaters Society',
    date: '2026-10-02',
    author: 'Madame Grace Achieng',
    priority: 'High'
  },
  {
    id: 'ann-02',
    title: 'Term 3 Inter-House Sports Gala & Parent Invitations',
    category: 'Sports',
    message: 'The annual inter-house athletics, swimming, and soccer fixtures will take place on Saturday, October 31st. Parents are cordially invited to cheer the learners.',
    targetAudience: 'Parents',
    date: '2026-10-01',
    author: 'Coach Benjamin Omwenga',
    priority: 'Normal'
  },
  {
    id: 'ann-03',
    title: 'Robotics Team Qualifies for National NACOSTI Fair',
    category: 'Clubs',
    message: 'The EduSmart Autonomous Crop Rover team scored 96.5% and won 1st place in Applied Technology. National round exhibits scheduled for next month.',
    targetAudience: 'All',
    activityId: 'act-robotics',
    activityName: 'Robotics Innovators',
    date: '2026-09-29',
    author: 'Mr. Kelvin Muriuki',
    priority: 'High'
  },
  {
    id: 'ann-04',
    title: 'Medical Slips and Parent Consent for Kasarani Cup',
    category: 'Trips',
    message: 'All parents of U-13 football squad members are requested to digitally sign the consent slip in the Parent Portal by Wednesday, Oct 14th.',
    targetAudience: 'Parents',
    activityId: 'act-football',
    activityName: 'Simba Football Academy',
    date: '2026-10-03',
    author: 'Coach Benjamin Omwenga',
    priority: 'Urgent'
  }
];

export const INITIAL_CO_CURRICULAR_BUDGET: CoCurricularBudgetItem[] = [
  {
    id: 'bud-01',
    activityId: 'act-football',
    activityName: 'Simba Football Academy',
    category: 'Uniforms & Kits',
    allocatedAmount: 120000,
    spentAmount: 95000,
    term: 'Term 3',
    academicYear: 2026,
    approvedBy: 'Dr. Arthur Mwangi (Head Teacher)',
    status: 'Approved'
  },
  {
    id: 'bud-02',
    activityId: 'act-debate',
    activityName: 'Great Debaters Society',
    category: 'Tournaments & Entry',
    allocatedAmount: 65000,
    spentAmount: 42000,
    term: 'Term 3',
    academicYear: 2026,
    approvedBy: 'Mrs. Lydia Cherono (Deputy Head)',
    status: 'Approved'
  },
  {
    id: 'bud-03',
    activityId: 'act-robotics',
    activityName: 'Robotics Innovators',
    category: 'Equipment',
    allocatedAmount: 180000,
    spentAmount: 165000,
    term: 'Term 3',
    academicYear: 2026,
    approvedBy: 'Dr. Arthur Mwangi (Head Teacher)',
    status: 'Disbursed'
  },
  {
    id: 'bud-04',
    activityId: 'act-music',
    activityName: 'Symphony Brass Band',
    category: 'Equipment',
    allocatedAmount: 150000,
    spentAmount: 130000,
    term: 'Term 3',
    academicYear: 2026,
    approvedBy: 'Dr. Arthur Mwangi (Head Teacher)',
    status: 'Approved'
  },
  {
    id: 'bud-05',
    activityId: 'act-swimming',
    activityName: 'Dolphins Swimming Squad',
    category: 'Refreshments & First Aid',
    allocatedAmount: 45000,
    spentAmount: 38000,
    term: 'Term 3',
    academicYear: 2026,
    approvedBy: 'Mrs. Lydia Cherono (Deputy Head)',
    status: 'Approved'
  }
];

// ========================================================
// 🔔 INSTITUTIONAL BELL SCHEDULE & PERIOD TIMINGS
// ========================================================

export const INITIAL_BELL_SCHEDULE: BellPeriodDef[] = [
  { period: 1, label: 'Period 1 (Morning Core)', startTime: '08:00', endTime: '08:40' },
  { period: 2, label: 'Period 2 (Core Instruction)', startTime: '08:40', endTime: '09:20' },
  { period: 0, label: 'Morning Tea & Health Snack', startTime: '09:20', endTime: '09:40', isBreak: true, breakType: 'morning_tea' },
  { period: 3, label: 'Period 3 (STEM & Numeracy)', startTime: '09:40', endTime: '10:20' },
  { period: 4, label: 'Period 4 (Language Arts)', startTime: '10:20', endTime: '11:00' },
  { period: 5, label: 'Period 5 (Social & Applied Sciences)', startTime: '11:00', endTime: '11:40' },
  { period: 6, label: 'Period 6 (Creative & Practical)', startTime: '11:40', endTime: '12:20' },
  { period: 0, label: 'Midday Lunch & Pastoral Rest', startTime: '12:20', endTime: '13:20', isBreak: true, breakType: 'lunch' },
  { period: 7, label: 'Period 7 (Afternoon Session)', startTime: '13:20', endTime: '14:00' },
  { period: 8, label: 'Period 8 (Specialist & Lab)', startTime: '14:00', endTime: '14:40' },
  { period: 9, label: 'Remedial & Library Study', startTime: '14:40', endTime: '15:20', isBreak: true, breakType: 'remedial' },
  { period: 10, label: 'Co-Curricular Games & Clubs', startTime: '15:20', endTime: '16:30', isBreak: true, breakType: 'games' },
];

// ========================================================
// 🍱 LEARNER LUNCH ATTENDANCE & MEAL REGISTRY
// ========================================================

export const INITIAL_LUNCH_RECORDS: LearnerLunchRecord[] = [
  {
    id: 'lnch-001',
    studentId: 'usr-stu-brian',
    studentName: 'Brian Otieno',
    admissionNumber: 'ADM/2023/0412',
    grade: 4,
    stream: 'Dove',
    date: '2026-10-06',
    status: 'taken',
    takenAt: '12:45 PM',
    mealType: 'Standard Balanced Hot Meal',
    dietaryNotes: 'Full meal consumed, hydrated.',
    markedBy: 'Mr. David Kiprono',
    markedByRole: 'Class Teacher',
    updatedAt: '2026-10-06T12:45:00.000Z'
  },
  {
    id: 'lnch-002',
    studentId: 'usr-stu-amina',
    studentName: 'Amina Hassan',
    admissionNumber: 'ADM/2023/0413',
    grade: 4,
    stream: 'Dove',
    date: '2026-10-06',
    status: 'special_diet',
    takenAt: '12:50 PM',
    mealType: 'Special Medical Diet',
    dietaryNotes: 'Halal preparation, mild seasoning as advised by Sanatorium.',
    markedBy: 'Mr. David Kiprono',
    markedByRole: 'Class Teacher',
    updatedAt: '2026-10-06T12:50:00.000Z'
  },
  {
    id: 'lnch-003',
    studentId: 'usr-stu-kevin',
    studentName: 'Kevin Mutua',
    admissionNumber: 'ADM/2023/0414',
    grade: 4,
    stream: 'Dove',
    date: '2026-10-06',
    status: 'taken',
    takenAt: '12:40 PM',
    mealType: 'Standard Balanced Hot Meal',
    dietaryNotes: 'Full meal consumed.',
    markedBy: 'Mr. David Kiprono',
    markedByRole: 'Class Teacher',
    updatedAt: '2026-10-06T12:40:00.000Z'
  },
  {
    id: 'lnch-004',
    studentId: 'usr-stu-grace',
    studentName: 'Grace Njeri',
    admissionNumber: 'ADM/2023/0415',
    grade: 4,
    stream: 'Dove',
    date: '2026-10-06',
    status: 'taken',
    takenAt: '12:44 PM',
    mealType: 'Standard Balanced Hot Meal',
    dietaryNotes: 'Full meal consumed.',
    markedBy: 'Mr. David Kiprono',
    markedByRole: 'Class Teacher',
    updatedAt: '2026-10-06T12:44:00.000Z'
  },
  {
    id: 'lnch-005',
    studentId: 'usr-stu-emmanuel',
    studentName: 'Emmanuel Kipchumba',
    admissionNumber: 'ADM/2023/0416',
    grade: 4,
    stream: 'Dove',
    date: '2026-10-06',
    status: 'not_taken',
    dietaryNotes: 'In Sanatorium observation bay during lunchtime.',
    markedBy: 'Mr. David Kiprono',
    markedByRole: 'Class Teacher',
    updatedAt: '2026-10-06T12:55:00.000Z'
  },
  {
    id: 'lnch-006',
    studentId: 'usr-stu-faith',
    studentName: 'Faith Wanjiru',
    admissionNumber: 'ADM/2021/0819',
    grade: 8,
    stream: 'Mara',
    date: '2026-10-06',
    status: 'taken',
    takenAt: '12:35 PM',
    mealType: 'Standard Balanced Hot Meal',
    dietaryNotes: 'Full meal consumed, hot soup included.',
    markedBy: 'Mr. David Kiprono',
    markedByRole: 'Class Teacher',
    updatedAt: '2026-10-06T12:35:00.000Z'
  },
  {
    id: 'lnch-007',
    studentId: 'usr-stu-peter',
    studentName: 'Peter Omondi',
    admissionNumber: 'ADM/2021/0820',
    grade: 8,
    stream: 'Mara',
    date: '2026-10-06',
    status: 'taken',
    takenAt: '12:38 PM',
    mealType: 'Standard Balanced Hot Meal',
    dietaryNotes: 'Full meal consumed.',
    markedBy: 'Mr. David Kiprono',
    markedByRole: 'Class Teacher',
    updatedAt: '2026-10-06T12:38:00.000Z'
  },
  // Yesterday records (2026-10-05) for history
  {
    id: 'lnch-008',
    studentId: 'usr-stu-brian',
    studentName: 'Brian Otieno',
    admissionNumber: 'ADM/2023/0412',
    grade: 4,
    stream: 'Dove',
    date: '2026-10-05',
    status: 'taken',
    takenAt: '12:41 PM',
    mealType: 'Standard Balanced Hot Meal',
    dietaryNotes: 'Full hot lunch consumed.',
    markedBy: 'Mr. David Kiprono',
    markedByRole: 'Class Teacher',
    updatedAt: '2026-10-05T12:41:00.000Z'
  },
  {
    id: 'lnch-009',
    studentId: 'usr-stu-faith',
    studentName: 'Faith Wanjiru',
    admissionNumber: 'ADM/2021/0819',
    grade: 8,
    stream: 'Mara',
    date: '2026-10-05',
    status: 'taken',
    takenAt: '12:39 PM',
    mealType: 'Standard Balanced Hot Meal',
    dietaryNotes: 'Full lunch consumed.',
    markedBy: 'Mr. David Kiprono',
    markedByRole: 'Class Teacher',
    updatedAt: '2026-10-05T12:39:00.000Z'
  }
];





