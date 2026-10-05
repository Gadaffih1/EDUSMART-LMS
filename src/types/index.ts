export type UserRole = 
  | 'student'        // Learner: Own academic and school information
  | 'parent'         // Parent: Their children's information
  | 'teacher'        // Teacher: Assigned classes and subjects
  | 'class_teacher'  // Class Teacher: Assigned class + learners
  | 'hod'            // HOD: Department
  | 'senior_teacher' // Senior Teacher: Academic/learner supervision
  | 'deputy_head'    // Deputy Head: Operations/discipline/staff
  | 'dean_of_studies'// Dean of Studies: Academic/assessment
  | 'librarian'      // Librarian: Library
  | 'head_teacher'   // Head Teacher: School-wide management
  | 'school_admin_staff' // School Admin Staff: Secretarial, registers, gate exits, work analysis, calendar
  | 'transport_team' // Transport Team: Drivers, Assistants, Fleet & Route Operations
  | 'cocurricular_team' // Co-Curricular Team: Sports Coaches, Club Patrons, Talent & Activities Management
  | 'admin';         // System Administrator: Full system administration

export type GradeLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

// Primary streams (Grades 1 to 6 - 8 streams)
export const PRIMARY_STREAMS = [
  'Dove',
  'Eagle',
  'Falcon',
  'Flamingo',
  'Heron',
  'Pelican',
  'Sparrow',
  'Swan'
] as const;

// Junior School streams (Grades 7 to 9 - 7 streams)
export const JUNIOR_STREAMS = [
  'Athi',
  'Chania',
  'Kerio',
  'Mara',
  'Sabaki',
  'Tana',
  'Turkwel'
] as const;

export type PrimaryStream = typeof PRIMARY_STREAMS[number];
export type JuniorStream = typeof JUNIOR_STREAMS[number];
export type StreamName = PrimaryStream | JuniorStream;

// Primary Subjects (Grades 1 to 6 - 8 subjects + PHE)
export const PRIMARY_SUBJECTS = [
  'Mathematics',
  'English',
  'Kiswahili',
  'Integrated Science',
  'Agriculture and Nutrition',
  'Social Studies',
  'Religious Education',
  'Creative Arts',
  'Physical and Health Education'
] as const;

// Junior School Subjects (Grades 7 to 9 - 9 subjects + PHE)
export const JUNIOR_SUBJECTS = [
  'Mathematics',
  'English',
  'Kiswahili',
  'Integrated Science',
  'Agriculture and Nutrition',
  'Social Studies',
  'Religious Education',
  'Creative Arts',
  'Pretechnical Education',
  'Physical and Health Education'
] as const;

export type PrimarySubject = typeof PRIMARY_SUBJECTS[number];
export type JuniorSubject = typeof JUNIOR_SUBJECTS[number];
export type SubjectName = PrimarySubject | JuniorSubject;

export function getStreamsForGrade(grade: GradeLevel): StreamName[] {
  if (grade <= 6) {
    return [...PRIMARY_STREAMS];
  }
  return [...JUNIOR_STREAMS];
}

export function getSubjectsForGrade(grade: GradeLevel): SubjectName[] {
  if (grade <= 6) {
    return [...PRIMARY_SUBJECTS];
  }
  return [...JUNIOR_SUBJECTS];
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  grade?: GradeLevel; // Exactly 1 grade for student
  stream?: StreamName; // Exactly 1 stream for student, or assigned stream for class teacher
  assignedStreams?: { grade: GradeLevel; stream: StreamName }[]; // For teachers who teach multiple streams
  assignedSubjects?: SubjectName[]; // For teachers who teach multiple subjects
  department?: string; // For HOD (e.g. 'Sciences & Mathematics', 'Languages', 'Humanities')
  childrenIds?: string[]; // For Parent (IDs of student children)
  phone?: string;
  avatarUrl?: string;
  admissionNumber?: string;
  parentName?: string;
  parentPhone?: string;
  tscNumber?: string; // Teachers Service Commission ID
  designation?: string;
}

export interface Topic {
  id: string;
  grade: GradeLevel;
  subject: SubjectName;
  title: string;
  term: 1 | 2 | 3;
  week: number;
  description: string;
}

export interface LessonNote {
  id: string;
  topicId: string;
  grade: GradeLevel;
  subject: SubjectName;
  title: string;
  summary: string;
  content: string; // Structured reading notes with headings and bullet points
  keyTakeaways: string[];
  diagramUrl?: string;
  diagramCaption?: string;
  author: string;
  createdAt: string;
}

export interface VideoLesson {
  id: string;
  topicId: string;
  grade: GradeLevel;
  subject: SubjectName;
  title: string;
  durationMinutes: number;
  videoUrl: string; // Secure embedded educational video
  videoThumbnail?: string;
  keyPoints: string[];
  teacherName: string;
  createdAt: string;
}

export interface AudioLesson {
  id: string;
  topicId: string;
  grade: GradeLevel;
  subject: SubjectName;
  title: string;
  durationMinutes: number;
  audioUrl: string;
  transcript: string;
  keyPoints: string[];
  teacherName: string;
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  questionText: string;
  options: [string, string, string, string]; // Exactly 4 options A, B, C, D
  correctOptionIndex: number; // 0 for A, 1 for B, 2 for C, 3 for D
  explanation: string;
}

export interface Quiz {
  id: string;
  topicId: string;
  grade: GradeLevel;
  subject: SubjectName;
  title: string;
  passPercentage: number;
  timeLimitMinutes: number;
  questions: QuizQuestion[];
  teacherName: string;
  createdAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  subject: SubjectName;
  grade: GradeLevel;
  studentId: string;
  studentName: string;
  stream: StreamName;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  userAnswers: Record<string, number>; // questionId -> chosenOptionIndex
  completedAt: string;
}

export interface Assignment {
  id: string;
  grade: GradeLevel;
  stream?: StreamName; // specific stream or all streams in grade
  subject: SubjectName;
  title: string;
  instructions: string;
  dueDate: string;
  maxScore: number;
  teacherName: string;
  teacherId: string;
  submissionsCount?: number;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  grade: GradeLevel;
  stream: StreamName;
  submissionText: string;
  submittedAt: string;
  score?: number;
  feedback?: string;
  status: 'submitted' | 'graded';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'general' | 'lesson_reminder' | 'virtual_class' | 'urgent';
  targetGrade?: GradeLevel; // If undefined, whole school
  targetStream?: StreamName;
  author: string;
  authorRole: string;
  createdAt: string;
  meetLink?: string;
  scheduledTime?: string;
}

export interface VirtualClassRoom {
  id: string;
  grade: GradeLevel;
  stream?: StreamName;
  subject: SubjectName;
  topic: string;
  googleMeetLink: string;
  isLive: boolean;
  teacherName: string;
  scheduledTime: string;
  durationMinutes: number;
}

export interface WorkEntryLog {
  id: string;
  teacherId: string;
  teacherName: string;
  staffNo?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  signInLocation?: string;
  photoUrl?: string;
  geoStamp?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
    verifiedCampus?: boolean;
  };
  date: string;
  time: string;
  grade?: GradeLevel;
  stream?: StreamName;
  subject?: SubjectName;
  topicTaught?: string;
  objectivesCovered?: string;
  learnersPresent?: number;
  teacherRemarks?: string;
  timestamp: string;
}

export type GatePassStatus = 'pending' | 'active' | 'departed' | 'returned' | 'overdue';

export interface GateExitPass {
  id: string;
  studentId: string;
  studentName: string;
  admissionNumber?: string;
  grade: GradeLevel;
  stream: StreamName;
  teacherId: string;
  teacherName: string;
  tscNumber?: string;
  departureDate?: string;
  departureTime: string;
  expectedReturnTime?: string;
  actualReturnTime?: string;
  reason: string;
  guardianName: string;
  guardianPhone: string;
  guardianRelationship?: string;
  guardianIdNumber?: string;
  transportMode?: string;
  gatePassCode: string;
  status: GatePassStatus;
  approvedAt: string;
  securityRemarks?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  grade: GradeLevel;
  stream: StreamName;
  teacherId: string;
  teacherName: string;
  records: {
    studentId: string;
    studentName: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    remarks?: string;
  }[];
  summary: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    total: number;
    attendanceRate: number;
  };
}

export interface TimetableSlot {
  id: string;
  grade: GradeLevel;
  stream: StreamName;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  period: number;
  startTime: string;
  endTime: string;
  subject: SubjectName;
  teacherName: string;
  roomOrMeetLink?: string;
  roomName?: string;
  strandTopic?: string;
  teacherEmail?: string;
  isRemedial?: boolean;
  notes?: string;
  materialsNeeded?: string[];
  competencies?: string[];
}

export interface FixedLessonCondition {
  id: string;
  title: string;
  subject: SubjectName | string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  period: number;
  grades: GradeLevel[]; // e.g. [1, 2, 3, 4, 5, 6, 7, 8, 9] or subset
  streams: 'all' | StreamName[]; // 'all' or specific streams
  roomName?: string;
  teacherName?: string;
  notes?: string;
  isActive: boolean;
}

export interface SharedResourceFacility {
  id: string;
  name: string;
  type: 'science_lab' | 'computer_lab' | 'art_studio' | 'sports_field' | 'workshop' | 'agri_plot' | 'library';
  capacity: number;
  suitableSubjects: string[];
  location: string;
}

export interface ReportCard {
  id: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  grade: GradeLevel;
  stream: StreamName;
  term: 'Term 1' | 'Term 2' | 'Term 3';
  academicYear: number;
  subjects: {
    subject: SubjectName;
    openerScore: number;
    midTermScore: number;
    endTermScore: number;
    total: number; // Out of 100
    gradeLetter: 'A' | 'B' | 'C' | 'D' | 'E';
    rubricLevel: 'Exceeding Expectations' | 'Meeting Expectations' | 'Approaching Expectations' | 'Below Expectations';
    remarks: string;
    teacherName: string;
  }[];
  overallAverage: number;
  overallRubric: 'Exceeding Expectations' | 'Meeting Expectations' | 'Approaching Expectations' | 'Below Expectations';
  streamPosition: number;
  totalStudentsInStream: number;
  classTeacherRemarks: string;
  headTeacherRemarks: string;
  attendanceDays: number;
  totalSchoolDays: number;
  nextTermBegins: string;
}

export interface GradePassword {
  grade: GradeLevel;
  password: string;
  isActive: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  grade: GradeLevel;
  stream?: StreamName;
  recipientId?: string; // For direct teacher chat
  recipientName?: string;
  message: string;
  timestamp: string;
  isDirect: boolean;
}

export interface LibraryBook {
  id: string;
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  category: 'CBC Textbook' | 'CBC Teacher Guide' | 'Supplementary Reader' | 'Encyclopedia' | 'Fiction Storybook';
  grade?: GradeLevel;
  subject?: SubjectName;
  copiesAvailable: number;
  totalCopies: number;
  locationShelf: string;
  coverImage?: string;
}

export interface LibraryBorrowRecord {
  id: string;
  bookId: string;
  bookTitle: string;
  borrowerId: string;
  borrowerName: string;
  borrowerRole: 'student' | 'teacher';
  grade?: GradeLevel;
  stream?: StreamName;
  borrowedDate: string;
  dueDate: string;
  returnedDate?: string;
  status: 'active' | 'returned' | 'overdue';
  remarks?: string;
}

// ========================================================
// 📚 EXPANDED LIBRARY MANAGEMENT PORTAL TYPES
// ========================================================

export interface LibraryReservation {
  id: string;
  bookId: string;
  bookTitle: string;
  borrowerId: string;
  borrowerName: string;
  borrowerRole: 'student' | 'teacher';
  grade?: GradeLevel;
  stream?: StreamName;
  reservationDate: string;
  expiryDate: string;
  status: 'pending' | 'ready_for_pickup' | 'fulfilled' | 'cancelled';
  notes?: string;
}

export interface LibraryFine {
  id: string;
  borrowRecordId: string;
  bookTitle: string;
  borrowerId: string;
  borrowerName: string;
  borrowerRole: 'student' | 'teacher';
  daysOverdue: number;
  fineAmount: number;
  amountPaid: number;
  status: 'unpaid' | 'paid' | 'waived';
  dateIssued: string;
}

export interface LibraryAcquisition {
  id: string;
  title: string;
  author: string;
  isbn: string;
  publisher: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  supplier: string;
  requestDate: string;
  status: 'requested' | 'approved' | 'ordered' | 'received' | 'catalogued';
  requestedBy: string;
}

export interface LibraryShelfLocation {
  id: string;
  code: string;
  sectionName: string;
  floor: string;
  aisle: string;
  deweyRange: string;
  capacity: number;
  currentCount: number;
  categorySpecialization: string;
}

export interface DigitalLibraryItem {
  id: string;
  title: string;
  author: string;
  fileType: 'PDF' | 'EPUB' | 'Audiobook' | 'Video';
  fileSize: string;
  category: string;
  gradeLevel?: GradeLevel;
  accessLevel: 'all' | 'students' | 'teachers';
  downloadCount: number;
  readUrl: string;
  coverColor: string;
}

export interface ReadingProgrammeMember {
  id: string;
  studentId: string;
  studentName: string;
  grade: GradeLevel;
  stream: StreamName;
  currentLevel: 'Bronze Reader' | 'Silver Reader' | 'Gold Reader' | 'Platinum Scholar';
  booksReadThisTerm: number;
  targetBooks: number;
  pointsEarned: number;
  badges: string[];
  lastBookReviewed: string;
}

export interface LibraryAttendanceLog {
  id: string;
  learnerOrStaffId: string;
  name: string;
  role: 'student' | 'teacher' | 'visitor';
  grade?: GradeLevel;
  stream?: StreamName;
  entryTime: string;
  exitTime?: string;
  purpose: 'Study & Revision' | 'Borrowing / Return' | 'Computer / Research' | 'Class Session';
  date: string;
}

export interface LibraryTimetableSlot {
  id: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  startTime: string;
  endTime: string;
  grade: GradeLevel;
  stream: string;
  teacherInCharge: string;
  sessionType: 'Library Reading Period' | 'Research & Digital Literacy' | 'Open Study';
  venue: string;
}

export interface LibraryEvent {
  id: string;
  title: string;
  type: 'Book Fair' | 'Author Visit' | 'Spelling Bee' | 'Storytelling Day' | 'Literacy Workshop';
  date: string;
  time: string;
  venue: string;
  targetAudience: string;
  coordinator: string;
  status: 'Upcoming' | 'Completed';
  description: string;
}

export interface LibraryAuditLog {
  id: string;
  action: string;
  performedBy: string;
  role: string;
  timestamp: string;
  details: string;
}

export interface LibraryPolicy {
  id: string;
  policyName: string;
  category: 'Lending' | 'Fines' | 'Conduct' | 'Acquisitions';
  value: string;
  description: string;
}

export type NotificationCategory = 'assignment' | 'grade' | 'announcement' | 'system' | 'safety';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  targetRole?: UserRole | 'all';
  targetGrade?: GradeLevel;
  targetStream?: StreamName;
  targetUserId?: string;
  urgency: 'normal' | 'high' | 'urgent';
  linkTab?: string;
  createdAt: string;
  readByUserIds: string[];
}

export interface LearnerBadge {
  id: string;
  title: string;
  description: string;
  category: 'academic' | 'conduct' | 'practical' | 'attendance' | 'digital';
  iconName: string;
  xpPoints: number;
  dateUnlocked?: string;
  unlocked: boolean;
  activityCriteria?: string;
  currentProgress?: number;
  targetProgress?: number;
  progressMetric?: string;
}

export interface PortfolioItem {
  id: string;
  studentId: string;
  studentName: string;
  grade: GradeLevel;
  subject: SubjectName;
  title: string;
  description: string;
  learningStrand: string;
  category: 'Project & Model' | 'Experiment & Science' | 'Creative Arts & Craft' | 'Digital Evidence' | 'Reflective Journal';
  evidenceUrl?: string;
  reflection: string;
  teacherFeedback?: string;
  competencyLevel?: 'Exceeding Expectations' | 'Meeting Expectations' | 'Approaching Expectations';
  awardedPoints: number;
  createdAt: string;
}

export interface PeriodicReport {
  id: string;
  studentId: string;
  studentName: string;
  grade: GradeLevel;
  periodType: 'Weekly' | 'Monthly' | 'Termly' | 'Annually';
  periodLabel: string;
  academicMean: number;
  attendanceRate: number;
  quizzesCompleted: number;
  assignmentsTurnedIn: number;
  badgesEarned: number;
  coreCompetencies: {
    name: string;
    level: 'Exceeding' | 'Meeting' | 'Approaching';
    notes: string;
  }[];
  keyStrengths: string[];
  supportRecommendations: string[];
  teacherRemarks: string;
  generatedAt: string;
}

export interface SearchAuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  grade?: GradeLevel;
  searchQuery: string;
  timestamp: string;
  status: 'safe' | 'flagged' | 'guided_redirection';
  filterReason?: string;
  educationalTopicFound?: string;
}

export interface ExternalTool {
  id: string;
  name: string;
  category: 'assessment' | 'virtual_class' | 'library' | 'classroom';
  icon: string;
  description: string;
  url: string;
  code?: string;
  badge: string;
}

export interface SchoolCalendarEvent {
  id: string;
  title: string;
  description: string;
  category: 'term_dates' | 'academic' | 'exams' | 'co_curricular' | 'parents' | 'holiday';
  term: 1 | 2 | 3;
  academicYear: number;
  startDate: string;
  endDate: string;
  targetAudience: 'All School' | 'Primary (Grades 1-6)' | 'Junior School (Grades 7-9)' | 'Parents' | 'Teachers & Staff';
  venue?: string;
  isImportant: boolean;
  status: 'upcoming' | 'ongoing' | 'completed' | 'rescheduled';
  updatedBy?: string;
  updatedAt?: string;
}

export interface ParentCommunication {
  id: string;
  title: string;
  message: string;
  channel: 'SMS' | 'Email' | 'Portal Circular' | 'Urgent Broadcast';
  targetAudience: 'All Parents' | 'Primary Parents' | 'Junior School Parents' | 'Specific Grade' | 'Specific Stream';
  targetGrade?: GradeLevel;
  targetStream?: StreamName;
  sentBy: string;
  senderRole: string;
  dateSent: string;
  recipientCount: number;
  deliveryStatus: 'Delivered' | 'Scheduled' | 'Pending';
  category: 'Academic Clinic' | 'Fee Advisory' | 'School Event' | 'Health & Safety' | 'General Notice';
}

export interface ExamTimetableEntry {
  id: string;
  grade: GradeLevel;
  subject: SubjectName;
  examType: 'Opener Assessment' | 'Mid-Term Evaluation' | 'End-Term Summative' | 'KPSEA / KCSE National Mock';
  examDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  room: string;
  invigilatorName: string;
  instructions: string;
}

// ========================================================
// SCHOOL SANATORIUM & CLINIC HEALTH AUDIT TYPES
// ========================================================

export type SanatoriumDisposition = 
  | 'treated_returned_to_class'     // Treated & Returned to Class
  | 'admitted_observation_bay'     // Resting in Sanatorium Observation Bay
  | 'referred_to_hospital'         // Referred to Hospital / Clinic
  | 'signed_out_to_parent'         // Signed Out to Parent / Picked Up
  | 'under_monitoring';            // Continuous Bedside Monitoring

export interface SanatoriumRecord {
  id: string;
  
  // Student details
  studentId: string;
  studentName: string;
  admissionNumber: string;
  grade: GradeLevel;
  stream: StreamName;
  parentName?: string;
  parentPhone?: string;

  // Nurse In-Charge
  nurseInCharge: string;            // e.g. "Sister Grace Wambui, RN"
  nurseLicenseNo?: string;          // e.g. "NCK/RN-58921"
  nurseStaffNo?: string;            // e.g. "SAN/002"

  // Time & Details of Attendance
  date: string;                     // e.g. "2026-10-02"
  arrivalTime: string;              // e.g. "09:30 AM"
  departureTime?: string;           // e.g. "10:15 AM"
  visitReason: string;              // Chief complaint e.g. "Sudden high fever & chills"
  symptoms: string[];               // e.g. ["High Fever", "Headache", "Fatigue"]
  vitalSigns?: {
    temperature: number;            // in °C e.g. 38.6
    pulseRate?: number;             // in bpm e.g. 88
    bloodPressure?: string;         // e.g. "115/75"
    respiratoryRate?: number;       // e.g. 19
  };
  treatmentAdministered: string;    // Clinical treatment & medicines provided
  disposition: SanatoriumDisposition; // Clinic outcome
  bedNumber?: string;               // e.g. "Observation Bed #02"

  // Recommendations
  recommendations: string;          // Clinical guidance for teachers, parent, and learner
  activityRestrictions?: string;    // e.g. "Exempt from Physical Education for 3 days"
  followUpPlan?: string;            // e.g. "Review at 2:00 PM before prep"
  parentNotified: boolean;          // Phone / SMS notification logged
  parentNotificationNotes?: string; // Summary of communication with parent
  gatePassId?: string;              // Linked Gate Exit Pass ID if signed out to parent

  recordedAt: string;               // ISO timestamp
  recordedBy?: string;              // Staff member or nurse who logged
}

// ========================================================
// 🚌 SCHOOL TRANSPORT & FLEET TRACKING SYSTEM TYPES
// ========================================================

export type TransportStatus = 'Active' | 'Suspended' | 'Temporary';
export type BoardingStatus = 'Boarded' | 'Safely Alighted' | 'Absent' | 'Parent Transported' | 'Waiting';
export type TripType = 'Morning Pickup' | 'Afternoon Drop-off';
export type TripStatus = 'Scheduled' | 'In Transit' | 'Completed' | 'Delayed';

export interface TransportStop {
  id: string;
  stopName: string;
  landmark: string;
  morningPickupTime: string;
  afternoonDropoffTime: string;
  studentCount: number;
}

export interface TransportRoute {
  id: string;
  routeNumber: string;
  name: string;
  description: string;
  busPlate: string;
  busNumber: string;
  driverName: string;
  driverPhone: string;
  assistantName: string;
  assistantPhone: string;
  morningStartTime: string;
  morningSchoolArrivalTime: string;
  afternoonDepartureTime: string;
  afternoonEndTime: string;
  stops: TransportStop[];
  termFee: number;
  status: 'Active' | 'Suspended';
}

export interface SchoolBus {
  id: string;
  registrationNumber: string; // Plate e.g. "KDG 218M"
  busNumber: string;          // e.g. "Bus 01"
  model: string;              // e.g. "Isuzu FRR 33-Seater"
  capacity: number;
  currentOccupancy: number;
  driverName: string;
  driverPhone: string;
  assistantName: string;
  assistantPhone: string;
  assignedRouteId: string;
  assignedRouteName: string;
  insuranceExpiry: string;
  inspectionStatus: 'Valid / Compliant' | 'Due Soon' | 'Maintenance Needed';
  speedGovernorStatus: string;
  gpsTrackingStatus: 'Active & Transmitting' | 'Stationary' | 'Offline';
  currentLocation: string;
  emergencyContact: string;
  lastServiceDate: string;
  nextServiceDue: string;
}

export interface StudentTransportProfile {
  id: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  grade: GradeLevel;
  stream: StreamName;
  parentName: string;
  parentPhone: string;
  routeId: string;
  routeName: string;
  busPlate: string;
  busNumber: string;
  seatNumber: string;
  pickupStop: string;
  dropoffStop: string;
  morningPickupTime: string;
  afternoonDropoffTime: string;
  transportStatus: TransportStatus;
  specialInstructions: string;
  authorizedCollector: string;
  feeStatus: 'Paid' | 'Partial' | 'Pending';
  termFee: number;
  balance: number;
}

export interface TransportTripRecord {
  id: string;
  date: string;
  tripType: TripType;
  routeId: string;
  routeName: string;
  busPlate: string;
  driverName: string;
  assistantName: string;
  studentId: string;
  studentName: string;
  grade: GradeLevel;
  stream: StreamName;
  stopName: string;
  status: BoardingStatus;
  timestamp: string;
  recordedBy: string;
  notes?: string;
}

export interface TransportIncident {
  id: string;
  date: string;
  time: string;
  busPlate: string;
  driverName: string;
  route: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  incidentType: 'Traffic Delay' | 'Mechanical Glitch' | 'Minor Misbehaviour' | 'Medical Concern' | 'Unauthorized Collector Attempt' | 'Weather Obstacle';
  description: string;
  actionTaken: string;
  reportedBy: string;
  followUpStatus: 'Resolved' | 'Under Investigation' | 'Requires Parent Meeting';
  studentsInvolved?: string[];
}

export interface TransportAlert {
  id: string;
  timestamp: string;
  routeId: string;
  busPlate: string;
  type: 'departure' | 'boarded' | 'arrived_school' | 'alighted' | 'delayed' | 'breakdown' | 'emergency' | 'absence';
  title: string;
  message: string;
  targetAudience: 'all_parents' | 'route_parents' | 'admin_only';
}

// ========================================================
// 🎯 CO-CURRICULAR ACTIVITIES & TALENT PORTAL TYPES
// ========================================================

export type CoCurricularCategory = 
  | 'Sports' 
  | 'Clubs & Societies' 
  | 'Creative Arts & Music' 
  | 'STEM & Innovation' 
  | 'Leadership & Service';

export type ActivityMemberRole = 
  | 'Member' 
  | 'Team Captain' 
  | 'Vice Captain' 
  | 'Club President' 
  | 'Vice President' 
  | 'Secretary' 
  | 'Treasurer' 
  | 'Organizing Secretary';

export type RegistrationStatus = 'Pending' | 'Approved' | 'Active' | 'Withdrawn';

export type TalentArea = 
  | 'Football' 
  | 'Basketball' 
  | 'Athletics' 
  | 'Swimming' 
  | 'Debate & Public Speaking' 
  | 'Robotics & STEM' 
  | 'Music & Instruments' 
  | 'Drama & Acting' 
  | 'Fine Art' 
  | 'Chess' 
  | 'Leadership';

export interface CoCurricularActivity {
  id: string;
  name: string;
  category: CoCurricularCategory;
  type: 'sport' | 'club';
  description: string;
  patronName: string;
  patronPhone: string;
  patronEmail: string;
  assistantName?: string;
  venue: string;
  meetingDays: string[];
  meetingTime: string;
  targetGrades: GradeLevel[];
  maxParticipants: number;
  currentMembersCount: number;
  status: 'Active' | 'Seasonal' | 'Recruiting';
  achievementsCount: number;
  icon: string;
}

export interface LearnerCoCurricularProfile {
  id: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  grade: GradeLevel;
  stream: StreamName;
  activityId: string;
  activityName: string;
  category: CoCurricularCategory;
  role: ActivityMemberRole;
  registrationStatus: RegistrationStatus;
  registrationDate: string;
  attendanceRate: number;
  talentStrengths: TalentArea[];
  competitionsAttended: string[];
  awardsEarned: string[];
  coachNotes: string;
  parentConsentGiven: boolean;
}

export interface CoCurricularAttendanceRecord {
  id: string;
  activityId: string;
  activityName: string;
  date: string;
  studentId: string;
  studentName: string;
  grade: GradeLevel;
  stream: StreamName;
  status: 'Present' | 'Absent' | 'Excused' | 'Late';
  recordedBy: string;
  notes?: string;
}

export interface CoCurricularCompetition {
  id: string;
  title: string;
  activityId: string;
  activityName: string;
  category: string;
  date: string;
  venue: string;
  host: string;
  participatingSchools: string[];
  ourPosition: string;
  scoreOrTime: string;
  awards: string[];
  coachAccompanying: string;
  status: 'Upcoming' | 'Completed';
  report: string;
}

export interface CoCurricularEquipment {
  id: string;
  itemName: string;
  category: string;
  quantity: number;
  condition: 'New / Excellent' | 'Good' | 'Fair / Maintenance Due';
  assignedActivity: string;
  storageLocation: string;
  lastAuditDate: string;
}

export interface CoCurricularTrip {
  id: string;
  activityId: string;
  activityName: string;
  destination: string;
  date: string;
  departureTime: string;
  returnTime: string;
  purpose: string;
  busAllocated?: string;
  driverName?: string;
  accompanyingStaff: string[];
  participantLearnerIds: string[];
  parentConsentRequired: boolean;
  status: 'Scheduled' | 'Departed' | 'Completed' | 'Cancelled';
  emergencyContact: string;
  estimatedCostPerLearner?: number;
  report?: string;
}

export interface CoCurricularAnnouncement {
  id: string;
  title: string;
  category: 'All' | 'Sports' | 'Clubs' | 'Competitions' | 'Trips';
  message: string;
  targetAudience: 'All' | 'Learners' | 'Parents' | 'Coaches';
  activityId?: string;
  activityName?: string;
  date: string;
  author: string;
  priority: 'Normal' | 'High' | 'Urgent';
}

export interface CoCurricularBudgetItem {
  id: string;
  activityId: string;
  activityName: string;
  category: 'Equipment' | 'Tournaments & Entry' | 'Transport & Fuel' | 'Uniforms & Kits' | 'Refreshments & First Aid' | 'Awards & Trophies';
  allocatedAmount: number;
  spentAmount: number;
  term: 'Term 1' | 'Term 2' | 'Term 3';
  academicYear: number;
  approvedBy: string;
  status: 'Approved' | 'Pending Review' | 'Disbursed';
}




