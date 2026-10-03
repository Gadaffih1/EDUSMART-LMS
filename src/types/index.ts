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

// Primary Subjects (Grades 1 to 6 - 8 subjects)
export const PRIMARY_SUBJECTS = [
  'Mathematics',
  'English',
  'Kiswahili',
  'Integrated Science',
  'Agriculture and Nutrition',
  'Social Studies',
  'Religious Education',
  'Creative Arts'
] as const;

// Junior School Subjects (Grades 7 to 9 - 9 subjects)
export const JUNIOR_SUBJECTS = [
  'Mathematics',
  'English',
  'Kiswahili',
  'Integrated Science',
  'Agriculture and Nutrition',
  'Social Studies',
  'Religious Education',
  'Creative Arts',
  'Pretechnical Education'
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


