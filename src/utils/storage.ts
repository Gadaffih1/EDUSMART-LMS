import {
  User,
  UserRole,
  RoleAccessRights,
  SubjectName,
  GradePassword,
  Topic,
  LessonNote,
  VideoLesson,
  AudioLesson,
  Quiz,
  QuizAttempt,
  Assignment,
  AssignmentSubmission,
  Announcement,
  VirtualClassRoom,
  WorkEntryLog,
  GateExitPass,
  GatePassStatus,
  AttendanceRecord,
  ReportCard,
  TimetableSlot,
  ChatMessage,
  GradeLevel,
  StreamName,
  LibraryBook,
  LibraryBorrowRecord,
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
  TripType,
  CoCurricularActivity,
  LearnerCoCurricularProfile,
  CoCurricularAttendanceRecord,
  CoCurricularCompetition,
  CoCurricularEquipment,
  CoCurricularTrip,
  CoCurricularAnnouncement,
  CoCurricularBudgetItem,
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
  LibraryRoom,
  LibraryRoomBooking,
  FixedLessonCondition,
  SharedResourceFacility,
  BellPeriodDef,
  LunchStatus,
  LearnerLunchRecord,
  StaffDutyAssignment,
  TransportDropoffVerification,
  LessonImage,
  ELink,
  EventTicketPurchase,
  StudentAssessmentRecord,
  TeacherResultUploadAssignment,
  AssessmentCycle,
  CodingChallenge,
  LearnerStreakInfo,
  StreakMilestone,
  DocumentSubmissionRequest,
  DocumentSubmission,
  PostCategory,
  PortalSection,
  ExtraAdminRoleType,
  CBATaskMapping,
  StaffAppraisalRecord,
  CurriculumWrittenReport,
  CoordinatorSchemeOfWork,
  CoordinatorSyllabusTopic,
  CoordinatorCBAModeration,
  TeacherAbsenceReport,
  AffectedLessonSlot,
  OnboardingBatchRecord
} from '../types';
import { INITIAL_CODING_CHALLENGES } from '../data/codingChallengeData';
import {
  INITIAL_POST_CATEGORIES,
  INITIAL_PORTAL_SECTIONS,
  INITIAL_DOCUMENT_REQUESTS,
  INITIAL_DOCUMENT_SUBMISSIONS
} from '../data/extraRolesData';
import { INITIAL_CBA_TASK_MAPPINGS } from '../data/cbaTaskMappingData';
import { INITIAL_STAFF_APPRAISALS } from '../data/staffAppraisalData';
import { INITIAL_CURRICULUM_WRITTEN_REPORTS } from '../data/curriculumWrittenReportsData';
import {
  INITIAL_COORDINATOR_SCHEMES_OF_WORK,
  INITIAL_COORDINATOR_SYLLABUS_TRACKING,
  INITIAL_COORDINATOR_CBA_MODERATIONS
} from '../data/coordinatorCurriculumData';
import {
  INITIAL_FIXED_LESSON_CONDITIONS,
  INITIAL_SHARED_FACILITIES
} from '../data/timetableData';
import {
  INITIAL_USERS,
  INITIAL_GRADE_PASSWORDS,
  INITIAL_TOPICS,
  INITIAL_LESSON_NOTES,
  INITIAL_VIDEOS,
  INITIAL_AUDIOS,
  INITIAL_QUIZZES,
  INITIAL_QUIZ_ATTEMPTS,
  INITIAL_ASSIGNMENTS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_VIRTUAL_CLASSES,
  INITIAL_WORK_ENTRY_LOGS,
  INITIAL_GATE_EXIT_PASSES,
  INITIAL_ATTENDANCE,
  INITIAL_TIMETABLE,
  INITIAL_REPORT_CARDS,
  INITIAL_CHAT_MESSAGES,
  INITIAL_LIBRARY_BOOKS,
  INITIAL_BORROW_RECORDS,
  INITIAL_NOTIFICATIONS,
  INITIAL_BADGES,
  INITIAL_PORTFOLIO_ITEMS,
  INITIAL_PERIODIC_REPORTS,
  INITIAL_EXTERNAL_TOOLS,
  INITIAL_SEARCH_AUDIT_LOGS,
  INITIAL_CALENDAR_EVENTS,
  INITIAL_EVENT_TICKETS,
  INITIAL_ASSESSMENT_RECORDS,
  INITIAL_TEACHER_UPLOAD_ASSIGNMENTS,
  INITIAL_PARENT_COMMUNICATIONS,
  INITIAL_EXAM_TIMETABLE,
  INITIAL_SANATORIUM_RECORDS,
  INITIAL_SCHOOL_BUSES,
  INITIAL_TRANSPORT_ROUTES,
  INITIAL_STUDENT_TRANSPORT_PROFILES,
  INITIAL_TRANSPORT_TRIP_RECORDS,
  INITIAL_TRANSPORT_INCIDENTS,
  INITIAL_TRANSPORT_ALERTS,
  INITIAL_CO_CURRICULAR_ACTIVITIES,
  INITIAL_LEARNER_CO_CURRICULAR_PROFILES,
  INITIAL_CO_CURRICULAR_ATTENDANCE,
  INITIAL_CO_CURRICULAR_COMPETITIONS,
  INITIAL_CO_CURRICULAR_EQUIPMENT,
  INITIAL_CO_CURRICULAR_TRIPS,
  INITIAL_CO_CURRICULAR_ANNOUNCEMENTS,
  INITIAL_CO_CURRICULAR_BUDGET,
  INITIAL_LIBRARY_RESERVATIONS,
  INITIAL_LIBRARY_FINES,
  INITIAL_LIBRARY_ACQUISITIONS,
  INITIAL_LIBRARY_SHELVES,
  INITIAL_DIGITAL_LIBRARY_ITEMS,
  INITIAL_READING_PROGRAMME_MEMBERS,
  INITIAL_LIBRARY_ATTENDANCE,
  INITIAL_LIBRARY_TIMETABLE,
  INITIAL_LIBRARY_EVENTS,
  INITIAL_LIBRARY_POLICIES,
  INITIAL_LIBRARY_AUDIT_LOGS,
  INITIAL_LIBRARY_ROOMS,
  INITIAL_LIBRARY_ROOM_BOOKINGS,
  INITIAL_BELL_SCHEDULE,
  INITIAL_LUNCH_RECORDS,
  INITIAL_STAFF_DUTY_ROSTER,
  INITIAL_DROPOFF_VERIFICATIONS,
  INITIAL_LESSON_IMAGES,
  INITIAL_E_LINKS
} from '../data/initialData';

const KEYS = {
  USERS: 'edusmart_users_v1',
  ROLE_PERMISSIONS: 'edusmart_role_permissions_v1',
  GRADE_PASSWORDS: 'edusmart_grade_passwords_v1',
  TOPICS: 'edusmart_topics_v1',
  NOTES: 'edusmart_notes_v1',
  VIDEOS: 'edusmart_videos_v1',
  AUDIOS: 'edusmart_audios_v1',
  QUIZZES: 'edusmart_quizzes_v1',
  QUIZ_ATTEMPTS: 'edusmart_quiz_attempts_v1',
  ASSIGNMENTS: 'edusmart_assignments_v1',
  ANNOUNCEMENTS: 'edusmart_announcements_v1',
  VIRTUAL_CLASSES: 'edusmart_virtual_classes_v1',
  WORK_ENTRY_LOGS: 'edusmart_work_entry_logs_v1',
  GATE_PASSES: 'edusmart_gate_passes_v1',
  ATTENDANCE: 'edusmart_attendance_v1',
  TIMETABLE: 'edusmart_timetable_v1',
  BELL_SCHEDULE: 'edusmart_bell_schedule_v1',
  FIXED_LESSON_CONDITIONS: 'edusmart_fixed_lessons_v1',
  SHARED_RESOURCES: 'edusmart_shared_resources_v1',
  LUNCH_RECORDS: 'edusmart_learner_lunch_records_v1',
  REPORT_CARDS: 'edusmart_report_cards_v1',
  CHAT_MESSAGES: 'edusmart_chat_messages_v1',
  LIBRARY_BOOKS: 'edusmart_library_books_v1',
  BORROW_RECORDS: 'edusmart_borrow_records_v1',
  NOTIFICATIONS: 'edusmart_notifications_v1',
  BADGES: 'edusmart_badges_v1',
  PORTFOLIO: 'edusmart_portfolio_v1',
  PERIODIC_REPORTS: 'edusmart_periodic_reports_v1',
  EXTERNAL_TOOLS: 'edusmart_external_tools_v1',
  SEARCH_AUDIT: 'edusmart_search_audit_v1',
  RESOURCE_VIEWS: 'edusmart_resource_views_v1',
  CURRENT_USER: 'edusmart_current_user_v1',
  CALENDAR_EVENTS: 'edusmart_calendar_events_v1',
  PARENT_COMMUNICATIONS: 'edusmart_parent_communications_v1',
  EXAM_TIMETABLE: 'edusmart_exam_timetable_v1',
  SANATORIUM_RECORDS: 'edusmart_sanatorium_records_v1',
  TRANSPORT_BUSES: 'edusmart_transport_buses_v1',
  TRANSPORT_ROUTES: 'edusmart_transport_routes_v1',
  TRANSPORT_STUDENTS: 'edusmart_transport_students_v1',
  TRANSPORT_TRIP_RECORDS: 'edusmart_transport_trip_records_v1',
  TRANSPORT_INCIDENTS: 'edusmart_transport_incidents_v1',
  TRANSPORT_ALERTS: 'edusmart_transport_alerts_v1',
  CO_CURRICULAR_ACTIVITIES: 'edusmart_cocurricular_activities_v1',
  CO_CURRICULAR_PROFILES: 'edusmart_cocurricular_profiles_v1',
  CO_CURRICULAR_ATTENDANCE: 'edusmart_cocurricular_attendance_v1',
  CO_CURRICULAR_COMPETITIONS: 'edusmart_cocurricular_competitions_v1',
  CO_CURRICULAR_EQUIPMENT: 'edusmart_cocurricular_equipment_v1',
  CO_CURRICULAR_TRIPS: 'edusmart_cocurricular_trips_v1',
  CO_CURRICULAR_ANNOUNCEMENTS: 'edusmart_cocurricular_announcements_v1',
  CO_CURRICULAR_BUDGET: 'edusmart_cocurricular_budget_v1',
  LIBRARY_RESERVATIONS: 'edusmart_library_reservations_v1',
  LIBRARY_FINES: 'edusmart_library_fines_v1',
  LIBRARY_ACQUISITIONS: 'edusmart_library_acquisitions_v1',
  LIBRARY_SHELVES: 'edusmart_library_shelves_v1',
  LIBRARY_DIGITAL_ITEMS: 'edusmart_library_digital_items_v1',
  LIBRARY_READING_PROGRAMME: 'edusmart_library_reading_programme_v1',
  LIBRARY_ATTENDANCE: 'edusmart_library_attendance_v1',
  LIBRARY_TIMETABLE: 'edusmart_library_timetable_v1',
  LIBRARY_EVENTS: 'edusmart_library_events_v1',
  LIBRARY_POLICIES: 'edusmart_library_policies_v1',
  LIBRARY_AUDIT_LOGS: 'edusmart_library_audit_logs_v1',
  LIBRARY_ROOMS: 'edusmart_library_rooms_v1',
  LIBRARY_ROOM_BOOKINGS: 'edusmart_library_room_bookings_v1',
  STAFF_DUTY_ROSTER: 'edusmart_staff_duty_rosters_v1',
  DROPOFF_VERIFICATIONS: 'edusmart_transport_dropoff_verifications_v1',
  LESSON_IMAGES: 'edusmart_lesson_images_v1',
  E_LINKS: 'edusmart_e_links_v1',
  EVENT_TICKETS: 'edusmart_event_tickets_v1',
  ASSESSMENT_RECORDS: 'edusmart_assessment_records_v1',
  TEACHER_UPLOAD_ASSIGNMENTS: 'edusmart_teacher_upload_assignments_v1',
  CODING_CHALLENGES: 'edusmart_coding_challenges_v1',
  STREAKS: 'edusmart_streaks_v1',
  DOCUMENT_REQUESTS: 'edusmart_document_requests_v1',
  DOCUMENT_SUBMISSIONS: 'edusmart_document_submissions_v1',
  POST_CATEGORIES: 'edusmart_post_categories_v1',
  PORTAL_SECTIONS: 'edusmart_portal_sections_v1',
  CBA_TASK_MAPPINGS: 'edusmart_cba_task_mappings_v1',
  STAFF_APPRAISALS: 'edusmart_staff_appraisals_v1',
  CURRICULUM_WRITTEN_REPORTS: 'edusmart_curriculum_written_reports_v1',
  COORDINATOR_SCHEMES_OF_WORK: 'edusmart_coordinator_schemes_of_work_v1',
  COORDINATOR_SYLLABUS_TRACKING: 'edusmart_coordinator_syllabus_tracking_v1',
  COORDINATOR_CBA_MODERATIONS: 'edusmart_coordinator_cba_moderations_v1',
  TEACHER_ABSENCE_REPORTS: 'edusmart_teacher_absence_reports_v1',
  ONBOARDING_BATCHES: 'edusmart_onboarding_batches_v1',
};

function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return defaultValue;
    }
    const item = localStorage.getItem(key);
    if (!item || item === 'undefined' || item === 'null') {
      try {
        localStorage.setItem(key, JSON.stringify(defaultValue));
      } catch (e) {}
      return defaultValue;
    }
    const parsed = JSON.parse(item);
    if (parsed === null && defaultValue !== null) {
      return defaultValue;
    }
    if (Array.isArray(defaultValue) && !Array.isArray(parsed)) {
      return defaultValue;
    }
    return parsed as T;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage`, err);
    return defaultValue;
  }
}

function setToStorage<T>(key: string, value: T): void {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing ${key} to localStorage`, err);
  }
}

const buildFullPermissions = (role: UserRole, perms: any): RoleAccessRights => ({
  canAccessSanatorium: Boolean(perms.canAccessSanatorium),
  canAccessAcademicReports: Boolean(perms.canAccessAcademicReports),
  canEditCommentWriteUps: Boolean(perms.canEditCommentWriteUps),
  canRepublishReports: Boolean(perms.canRepublishReports),
  canManageUsersAndRoles: Boolean(perms.canManageUsersAndRoles),
  canAccessAdminSettings: Boolean(perms.canAccessAdminSettings),
  canAccessFinancials: Boolean(perms.canAccessFinancials),
  canAccessTimetable: Boolean(perms.canAccessTimetable),
  canAccessGatePasses: Boolean(perms.canAccessGatePasses),
  canAccessLibrary: Boolean(perms.canAccessLibrary),
  canAccessTransport: Boolean(perms.canAccessTransport),
  canAccessCoCurricular: Boolean(perms.canAccessCoCurricular),
  canAccessLunchRegister: Boolean(perms.canAccessLunchRegister),
  canAccessVirtualRooms: Boolean(perms.canAccessVirtualRooms),
  canManageDiscipline: Boolean(perms.canManageDiscipline),
  // 🛡️ Extra Roles:
  canRequestDocumentSubmissions: ['admin', 'head_teacher', 'deputy_head', 'dean_of_studies', 'curriculum_coordinator'].includes(role),
  canEditPostsBySpecificUsers: role === 'admin',
  canAddCategoriesToPosts: ['admin', 'head_teacher', 'deputy_head', 'dean_of_studies', 'curriculum_coordinator'].includes(role),
  hasDoubleAccessRights: role === 'admin',
  canManageAllPostsCategoriesSections: ['admin', 'head_teacher', 'curriculum_coordinator'].includes(role),
  ...perms,
});

const BASE_ROLE_PERMISSIONS: Record<UserRole, any> = {
  admin: {
    canAccessSanatorium: true,
    canAccessAcademicReports: true,
    canEditCommentWriteUps: true,
    canRepublishReports: true,
    canManageUsersAndRoles: true,
    canAccessAdminSettings: true,
    canAccessFinancials: true,
    canAccessTimetable: true,
    canAccessGatePasses: true,
    canAccessLibrary: true,
    canAccessTransport: true,
    canAccessCoCurricular: true,
    canAccessLunchRegister: true,
    canAccessVirtualRooms: true,
    canManageDiscipline: true,
  },
  head_teacher: {
    canAccessSanatorium: true,
    canAccessAcademicReports: true,
    canEditCommentWriteUps: true,
    canRepublishReports: true,
    canManageUsersAndRoles: false,
    canAccessAdminSettings: false,
    canAccessFinancials: true,
    canAccessTimetable: true,
    canAccessGatePasses: true,
    canAccessLibrary: true,
    canAccessTransport: true,
    canAccessCoCurricular: true,
    canAccessLunchRegister: true,
    canAccessVirtualRooms: true,
    canManageDiscipline: true,
  },
  deputy_head: {
    canAccessSanatorium: true,
    canAccessAcademicReports: true,
    canEditCommentWriteUps: true,
    canRepublishReports: true,
    canManageUsersAndRoles: false,
    canAccessAdminSettings: false,
    canAccessFinancials: false,
    canAccessTimetable: true,
    canAccessGatePasses: true,
    canAccessLibrary: true,
    canAccessTransport: true,
    canAccessCoCurricular: true,
    canAccessLunchRegister: true,
    canAccessVirtualRooms: true,
    canManageDiscipline: true,
  },
  dean_of_studies: {
    canAccessSanatorium: false,
    canAccessAcademicReports: true,
    canEditCommentWriteUps: true,
    canRepublishReports: true,
    canManageUsersAndRoles: false,
    canAccessAdminSettings: false,
    canAccessFinancials: false,
    canAccessTimetable: true,
    canAccessGatePasses: false,
    canAccessLibrary: true,
    canAccessTransport: false,
    canAccessCoCurricular: false,
    canAccessLunchRegister: false,
    canAccessVirtualRooms: true,
    canManageDiscipline: false,
  },
  curriculum_coordinator: {
    canAccessSanatorium: false,
    canAccessAcademicReports: true,
    canEditCommentWriteUps: true,
    canRepublishReports: true,
    canManageUsersAndRoles: false,
    canAccessAdminSettings: false,
    canAccessFinancials: false,
    canAccessTimetable: true,
    canAccessGatePasses: false,
    canAccessLibrary: true,
    canAccessTransport: false,
    canAccessCoCurricular: true,
    canAccessLunchRegister: false,
    canAccessVirtualRooms: true,
    canManageDiscipline: false,
  },
  senior_teacher: {
    canAccessSanatorium: false,
    canAccessAcademicReports: true,
    canEditCommentWriteUps: false,
    canRepublishReports: false,
    canManageUsersAndRoles: false,
    canAccessAdminSettings: false,
    canAccessFinancials: false,
    canAccessTimetable: true,
    canAccessGatePasses: true,
    canAccessLibrary: true,
    canAccessTransport: false,
    canAccessCoCurricular: false,
    canAccessLunchRegister: true,
    canAccessVirtualRooms: true,
    canManageDiscipline: true,
  },
  hod: {
    canAccessSanatorium: false,
    canAccessAcademicReports: true,
    canEditCommentWriteUps: false,
    canRepublishReports: false,
    canManageUsersAndRoles: false,
    canAccessAdminSettings: false,
    canAccessFinancials: false,
    canAccessTimetable: true,
    canAccessGatePasses: false,
    canAccessLibrary: true,
    canAccessTransport: false,
    canAccessCoCurricular: false,
    canAccessLunchRegister: false,
    canAccessVirtualRooms: true,
    canManageDiscipline: false,
  },
  class_teacher: {
    canAccessSanatorium: false,
    canAccessAcademicReports: true,
    canEditCommentWriteUps: true,
    canRepublishReports: false,
    canManageUsersAndRoles: false,
    canAccessAdminSettings: false,
    canAccessFinancials: false,
    canAccessTimetable: true,
    canAccessGatePasses: true,
    canAccessLibrary: true,
    canAccessTransport: false,
    canAccessCoCurricular: false,
    canAccessLunchRegister: true,
    canAccessVirtualRooms: true,
    canManageDiscipline: true,
  },
  teacher: {
    canAccessSanatorium: false,
    canAccessAcademicReports: true,
    canEditCommentWriteUps: true,
    canRepublishReports: false,
    canManageUsersAndRoles: false,
    canAccessAdminSettings: false,
    canAccessFinancials: false,
    canAccessTimetable: true,
    canAccessGatePasses: false,
    canAccessLibrary: true,
    canAccessTransport: false,
    canAccessCoCurricular: false,
    canAccessLunchRegister: false,
    canAccessVirtualRooms: true,
    canManageDiscipline: false,
  },
  nurse: {
    canAccessSanatorium: true,
    canAccessAcademicReports: false,
    canEditCommentWriteUps: false,
    canRepublishReports: false,
    canManageUsersAndRoles: false,
    canAccessAdminSettings: false,
    canAccessFinancials: false,
    canAccessTimetable: false,
    canAccessGatePasses: false,
    canAccessLibrary: false,
    canAccessTransport: false,
    canAccessCoCurricular: false,
    canAccessLunchRegister: false,
    canAccessVirtualRooms: false,
    canManageDiscipline: false,
  },
  librarian: {
    canAccessSanatorium: false,
    canAccessAcademicReports: false,
    canEditCommentWriteUps: false,
    canRepublishReports: false,
    canManageUsersAndRoles: false,
    canAccessAdminSettings: false,
    canAccessFinancials: false,
    canAccessTimetable: false,
    canAccessGatePasses: false,
    canAccessLibrary: true,
    canAccessTransport: false,
    canAccessCoCurricular: false,
    canAccessLunchRegister: false,
    canAccessVirtualRooms: false,
    canManageDiscipline: false,
  },
  school_admin_staff: {
    canAccessSanatorium: false,
    canAccessAcademicReports: true,
    canEditCommentWriteUps: false,
    canRepublishReports: false,
    canManageUsersAndRoles: false,
    canAccessAdminSettings: false,
    canAccessFinancials: true,
    canAccessTimetable: true,
    canAccessGatePasses: true,
    canAccessLibrary: true,
    canAccessTransport: true,
    canAccessCoCurricular: true,
    canAccessLunchRegister: true,
    canAccessVirtualRooms: true,
    canManageDiscipline: false,
  },
  transport_team: {
    canAccessSanatorium: false,
    canAccessAcademicReports: false,
    canEditCommentWriteUps: false,
    canRepublishReports: false,
    canManageUsersAndRoles: false,
    canAccessAdminSettings: false,
    canAccessFinancials: false,
    canAccessTimetable: false,
    canAccessGatePasses: true,
    canAccessLibrary: false,
    canAccessTransport: true,
    canAccessCoCurricular: false,
    canAccessLunchRegister: false,
    canAccessVirtualRooms: false,
    canManageDiscipline: false,
  },
  cocurricular_team: {
    canAccessSanatorium: false,
    canAccessAcademicReports: false,
    canEditCommentWriteUps: false,
    canRepublishReports: false,
    canManageUsersAndRoles: false,
    canAccessAdminSettings: false,
    canAccessFinancials: false,
    canAccessTimetable: false,
    canAccessGatePasses: false,
    canAccessLibrary: false,
    canAccessTransport: false,
    canAccessCoCurricular: true,
    canAccessLunchRegister: false,
    canAccessVirtualRooms: false,
    canManageDiscipline: false,
  },
  parent: {
    canAccessSanatorium: false,
    canAccessAcademicReports: true,
    canEditCommentWriteUps: false,
    canRepublishReports: false,
    canManageUsersAndRoles: false,
    canAccessAdminSettings: false,
    canAccessFinancials: true,
    canAccessTimetable: true,
    canAccessGatePasses: true,
    canAccessLibrary: true,
    canAccessTransport: true,
    canAccessCoCurricular: true,
    canAccessLunchRegister: false,
    canAccessVirtualRooms: false,
    canManageDiscipline: false,
  },
  student: {
    canAccessSanatorium: false,
    canAccessAcademicReports: true,
    canEditCommentWriteUps: false,
    canRepublishReports: false,
    canManageUsersAndRoles: false,
    canAccessAdminSettings: false,
    canAccessFinancials: false,
    canAccessTimetable: true,
    canAccessGatePasses: false,
    canAccessLibrary: true,
    canAccessTransport: false,
    canAccessCoCurricular: true,
    canAccessLunchRegister: false,
    canAccessVirtualRooms: true,
    canManageDiscipline: false,
  },
};

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, RoleAccessRights> = Object.entries(BASE_ROLE_PERMISSIONS).reduce((acc, [r, p]) => {
  acc[r as UserRole] = buildFullPermissions(r as UserRole, p);
  return acc;
}, {} as Record<UserRole, RoleAccessRights>);

export const INITIAL_ONBOARDING_BATCHES: OnboardingBatchRecord[] = [
  {
    id: 'onb-batch-term1-2026-001',
    batchReference: 'ONB-2026-T1-01',
    timestamp: '2026-01-08 08:30:00',
    importedBy: 'Mrs. Sarah Cherono (Registrar)',
    term: 1,
    academicYear: 2026,
    totalRecords: 48,
    studentCount: 42,
    staffCount: 6,
    parentCount: 42,
    fileName: 'term_1_opening_admissions_2026.csv',
    status: 'Completed',
    summaryNotes: 'Term 1 2026 Inaugural Admission Batch. Primary Grade 1-6 & Junior School Grade 7 intake successfully enrolled.',
    recordsSample: [
      { name: 'Faith Nduta', role: 'student', grade: 4, stream: 'Dove', admissionNumber: 'ADM/2026/0401' },
      { name: 'Brian Kiprono', role: 'student', grade: 7, stream: 'Mara', admissionNumber: 'ADM/2026/0702' },
      { name: 'Mr. David Omondi', role: 'teacher', admissionNumber: undefined }
    ]
  }
];

export const Storage = {
  // Reset all data to factory demo defaults
  resetAllData(): void {
    localStorage.setItem(KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(KEYS.GRADE_PASSWORDS, JSON.stringify(INITIAL_GRADE_PASSWORDS));
    localStorage.setItem(KEYS.TOPICS, JSON.stringify(INITIAL_TOPICS));
    localStorage.setItem(KEYS.NOTES, JSON.stringify(INITIAL_LESSON_NOTES));
    localStorage.setItem(KEYS.VIDEOS, JSON.stringify(INITIAL_VIDEOS));
    localStorage.setItem(KEYS.AUDIOS, JSON.stringify(INITIAL_AUDIOS));
    localStorage.setItem(KEYS.QUIZZES, JSON.stringify(INITIAL_QUIZZES));
    localStorage.setItem(KEYS.QUIZ_ATTEMPTS, JSON.stringify(INITIAL_QUIZ_ATTEMPTS));
    localStorage.setItem(KEYS.ASSIGNMENTS, JSON.stringify(INITIAL_ASSIGNMENTS));
    localStorage.setItem(KEYS.ANNOUNCEMENTS, JSON.stringify(INITIAL_ANNOUNCEMENTS));
    localStorage.setItem(KEYS.VIRTUAL_CLASSES, JSON.stringify(INITIAL_VIRTUAL_CLASSES));
    localStorage.setItem(KEYS.WORK_ENTRY_LOGS, JSON.stringify(INITIAL_WORK_ENTRY_LOGS));
    localStorage.setItem(KEYS.GATE_PASSES, JSON.stringify(INITIAL_GATE_EXIT_PASSES));
    localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(INITIAL_ATTENDANCE));
    localStorage.setItem(KEYS.TIMETABLE, JSON.stringify(INITIAL_TIMETABLE));
    localStorage.setItem(KEYS.BELL_SCHEDULE, JSON.stringify(INITIAL_BELL_SCHEDULE));
    localStorage.setItem(KEYS.LUNCH_RECORDS, JSON.stringify(INITIAL_LUNCH_RECORDS));
    localStorage.setItem(KEYS.REPORT_CARDS, JSON.stringify(INITIAL_REPORT_CARDS));
    localStorage.setItem(KEYS.CHAT_MESSAGES, JSON.stringify(INITIAL_CHAT_MESSAGES));
    localStorage.setItem(KEYS.LIBRARY_BOOKS, JSON.stringify(INITIAL_LIBRARY_BOOKS));
    localStorage.setItem(KEYS.BORROW_RECORDS, JSON.stringify(INITIAL_BORROW_RECORDS));
    localStorage.setItem(KEYS.SANATORIUM_RECORDS, JSON.stringify(INITIAL_SANATORIUM_RECORDS));
    localStorage.setItem(KEYS.TRANSPORT_BUSES, JSON.stringify(INITIAL_SCHOOL_BUSES));
    localStorage.setItem(KEYS.TRANSPORT_ROUTES, JSON.stringify(INITIAL_TRANSPORT_ROUTES));
    localStorage.setItem(KEYS.TRANSPORT_STUDENTS, JSON.stringify(INITIAL_STUDENT_TRANSPORT_PROFILES));
    localStorage.setItem(KEYS.TRANSPORT_TRIP_RECORDS, JSON.stringify(INITIAL_TRANSPORT_TRIP_RECORDS));
    localStorage.setItem(KEYS.TRANSPORT_INCIDENTS, JSON.stringify(INITIAL_TRANSPORT_INCIDENTS));
    localStorage.setItem(KEYS.TRANSPORT_ALERTS, JSON.stringify(INITIAL_TRANSPORT_ALERTS));
    localStorage.setItem(KEYS.CO_CURRICULAR_ACTIVITIES, JSON.stringify(INITIAL_CO_CURRICULAR_ACTIVITIES));
    localStorage.setItem(KEYS.CO_CURRICULAR_PROFILES, JSON.stringify(INITIAL_LEARNER_CO_CURRICULAR_PROFILES));
    localStorage.setItem(KEYS.CO_CURRICULAR_ATTENDANCE, JSON.stringify(INITIAL_CO_CURRICULAR_ATTENDANCE));
    localStorage.setItem(KEYS.CO_CURRICULAR_COMPETITIONS, JSON.stringify(INITIAL_CO_CURRICULAR_COMPETITIONS));
    localStorage.setItem(KEYS.CO_CURRICULAR_EQUIPMENT, JSON.stringify(INITIAL_CO_CURRICULAR_EQUIPMENT));
    localStorage.setItem(KEYS.CO_CURRICULAR_TRIPS, JSON.stringify(INITIAL_CO_CURRICULAR_TRIPS));
    localStorage.setItem(KEYS.CO_CURRICULAR_ANNOUNCEMENTS, JSON.stringify(INITIAL_CO_CURRICULAR_ANNOUNCEMENTS));
    localStorage.setItem(KEYS.CO_CURRICULAR_BUDGET, JSON.stringify(INITIAL_CO_CURRICULAR_BUDGET));
    localStorage.setItem(KEYS.LIBRARY_RESERVATIONS, JSON.stringify(INITIAL_LIBRARY_RESERVATIONS));
    localStorage.setItem(KEYS.LIBRARY_FINES, JSON.stringify(INITIAL_LIBRARY_FINES));
    localStorage.setItem(KEYS.LIBRARY_ACQUISITIONS, JSON.stringify(INITIAL_LIBRARY_ACQUISITIONS));
    localStorage.setItem(KEYS.LIBRARY_SHELVES, JSON.stringify(INITIAL_LIBRARY_SHELVES));
    localStorage.setItem(KEYS.LIBRARY_DIGITAL_ITEMS, JSON.stringify(INITIAL_DIGITAL_LIBRARY_ITEMS));
    localStorage.setItem(KEYS.LIBRARY_READING_PROGRAMME, JSON.stringify(INITIAL_READING_PROGRAMME_MEMBERS));
    localStorage.setItem(KEYS.LIBRARY_ATTENDANCE, JSON.stringify(INITIAL_LIBRARY_ATTENDANCE));
    localStorage.setItem(KEYS.LIBRARY_TIMETABLE, JSON.stringify(INITIAL_LIBRARY_TIMETABLE));
    localStorage.setItem(KEYS.LIBRARY_EVENTS, JSON.stringify(INITIAL_LIBRARY_EVENTS));
    localStorage.setItem(KEYS.LIBRARY_POLICIES, JSON.stringify(INITIAL_LIBRARY_POLICIES));
    localStorage.setItem(KEYS.LIBRARY_AUDIT_LOGS, JSON.stringify(INITIAL_LIBRARY_AUDIT_LOGS));
    localStorage.setItem(KEYS.LESSON_IMAGES, JSON.stringify(INITIAL_LESSON_IMAGES));
    localStorage.setItem(KEYS.E_LINKS, JSON.stringify(INITIAL_E_LINKS));
    localStorage.setItem(KEYS.DOCUMENT_REQUESTS, JSON.stringify(INITIAL_DOCUMENT_REQUESTS));
    localStorage.setItem(KEYS.DOCUMENT_SUBMISSIONS, JSON.stringify(INITIAL_DOCUMENT_SUBMISSIONS));
    localStorage.setItem(KEYS.POST_CATEGORIES, JSON.stringify(INITIAL_POST_CATEGORIES));
    localStorage.setItem(KEYS.PORTAL_SECTIONS, JSON.stringify(INITIAL_PORTAL_SECTIONS));
  },

  // Role Permissions & Access Control
  getRolePermissions(): Record<UserRole, RoleAccessRights> {
    return getFromStorage<Record<UserRole, RoleAccessRights>>(KEYS.ROLE_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS);
  },

  updateRolePermissions(role: UserRole, permissions: Partial<RoleAccessRights>): void {
    const current = this.getRolePermissions();
    current[role] = { ...current[role], ...permissions };
    setToStorage(KEYS.ROLE_PERMISSIONS, current);
    window.dispatchEvent(new CustomEvent('role-permissions-updated', { detail: { role, permissions: current[role] } }));
  },

  getUserEffectivePermissions(user: User): RoleAccessRights {
    // Nurse is strictly restricted to Sanatorium by policy
    const isNurse = user.role === 'nurse' || user.email === 'nurse@edusmart.ac.ke' || 
      (Boolean(user.designation) && user.designation!.toLowerCase().includes('nurse'));
    if (isNurse) {
      return buildFullPermissions('nurse', { canAccessSanatorium: true });
    }

    const allRolePerms = this.getRolePermissions();
    const basePerms = allRolePerms[user.role] || DEFAULT_ROLE_PERMISSIONS[user.role] || DEFAULT_ROLE_PERMISSIONS.student;
    
    // Apply user-level custom overrides if defined
    const effective: RoleAccessRights = { ...basePerms, ...(user.customPermissions || {}) };

    // Apply Administrator-Assigned Extra Roles:
    if (user.extraRoles?.includes('document_requester')) {
      effective.canRequestDocumentSubmissions = true;
    }
    if (user.extraRoles?.includes('delegated_post_editor')) {
      effective.canEditPostsBySpecificUsers = true;
    }
    if (user.extraRoles?.includes('category_curator')) {
      effective.canAddCategoriesToPosts = true;
    }
    if (user.extraRoles?.includes('double_access_teacher') || user.doubleAccessConfig?.enabled) {
      effective.hasDoubleAccessRights = true;
      if (user.doubleAccessConfig?.extraGrantedPermissions) {
        user.doubleAccessConfig.extraGrantedPermissions.forEach(permKey => {
          (effective as any)[permKey] = true;
        });
      }
    }
    if (user.extraRoles?.includes('cms_content_master')) {
      effective.canManageAllPostsCategoriesSections = true;
      effective.canAddCategoriesToPosts = true;
      effective.canEditPostsBySpecificUsers = true;
    }

    return effective;
  },

  updateUserRoleAndPermissions(
    userId: string, 
    newRole: UserRole, 
    customPermissions?: Partial<RoleAccessRights>,
    additionalUpdates?: Partial<User>
  ): User | null {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return null;

    users[idx] = {
      ...users[idx],
      ...additionalUpdates,
      role: newRole,
      customPermissions: customPermissions ? { ...users[idx].customPermissions, ...customPermissions } : users[idx].customPermissions
    };

    setToStorage(KEYS.USERS, users);
    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      this.setCurrentUser(users[idx]);
    }

    window.dispatchEvent(new CustomEvent('users-updated', { detail: users[idx] }));
    return users[idx];
  },

  // Auth & Session
  getCurrentUser(): User | null {
    return getFromStorage<User | null>(KEYS.CURRENT_USER, null);
  },
  setCurrentUser(user: User | null): void {
    setToStorage(KEYS.CURRENT_USER, user);
  },

  // Users
  getUsers(): User[] {
    const stored = getFromStorage<User[]>(KEYS.USERS, INITIAL_USERS);
    // Guarantee that all demo accounts from INITIAL_USERS are actively present in stored users
    let hasMissing = false;
    const existingIds = new Set(stored.map(u => u.id));
    const existingEmails = new Set(stored.map(u => u.email.toLowerCase()));
    const merged = [...stored];

    for (const initUser of INITIAL_USERS) {
      if (!existingIds.has(initUser.id) && !existingEmails.has(initUser.email.toLowerCase())) {
        merged.push(initUser);
        existingIds.add(initUser.id);
        existingEmails.add(initUser.email.toLowerCase());
        hasMissing = true;
      }
    }

    if (hasMissing) {
      setToStorage(KEYS.USERS, merged);
    }
    return merged;
  },
  addUser(user: User): void {
    const users = this.getUsers();
    users.push(user);
    setToStorage(KEYS.USERS, users);
  },
  updateUser(id: string, updates: Partial<User>): User | null {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    users[idx] = { ...users[idx], ...updates };
    setToStorage(KEYS.USERS, users);
    const current = this.getCurrentUser();
    if (current && current.id === id) {
      this.setCurrentUser(users[idx]);
    }
    window.dispatchEvent(new CustomEvent('users-updated', { detail: users }));
    return users[idx];
  },
  toggleUserStatus(id: string, active?: boolean): User | null {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    const currentActive = users[idx].isActive !== false;
    const nextActive = typeof active === 'boolean' ? active : !currentActive;
    users[idx] = { ...users[idx], isActive: nextActive };
    setToStorage(KEYS.USERS, users);
    window.dispatchEvent(new CustomEvent('users-updated', { detail: users }));
    return users[idx];
  },
  deleteUser(id: string): void {
    const users = this.getUsers().filter(u => u.id !== id);
    setToStorage(KEYS.USERS, users);
    window.dispatchEvent(new CustomEvent('users-updated', { detail: users }));
  },
  findUserByEmail(email: string): User | undefined {
    const cleanEmail = email.trim().toLowerCase();
    const userInStorage = this.getUsers().find(u => u.email.toLowerCase() === cleanEmail);
    if (userInStorage) return userInStorage;
    // Guaranteed fallback directly to INITIAL_USERS so it can NEVER fail even if cache is stale
    const userInInitial = INITIAL_USERS.find(u => u.email.toLowerCase() === cleanEmail);
    if (userInInitial) {
      this.addUser(userInInitial);
      return userInInitial;
    }
    return undefined;
  },

  // Bulk User & Student Import for Term Openings
  bulkImportUsers(
    usersToImport: User[], 
    overwriteExisting: boolean = true
  ): { imported: number; updated: number; skipped: number } {
    const existing = this.getUsers();
    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    const existingByEmail = new Map<string, number>();
    const existingByAdm = new Map<string, number>();
    existing.forEach((u, i) => {
      if (u.email) existingByEmail.set(u.email.toLowerCase(), i);
      if (u.admissionNumber) existingByAdm.set(u.admissionNumber.toLowerCase(), i);
    });

    const userList = [...existing];

    for (const newUser of usersToImport) {
      const emailKey = newUser.email ? newUser.email.toLowerCase() : '';
      const admKey = newUser.admissionNumber ? newUser.admissionNumber.toLowerCase() : '';
      
      let existingIdx = -1;
      if (admKey && existingByAdm.has(admKey)) {
        existingIdx = existingByAdm.get(admKey)!;
      } else if (emailKey && existingByEmail.has(emailKey)) {
        existingIdx = existingByEmail.get(emailKey)!;
      }

      if (existingIdx !== -1) {
        if (overwriteExisting) {
          userList[existingIdx] = { 
            ...userList[existingIdx], 
            ...newUser, 
            id: userList[existingIdx].id 
          };
          updatedCount++;
        } else {
          skippedCount++;
        }
      } else {
        userList.push(newUser);
        if (emailKey) existingByEmail.set(emailKey, userList.length - 1);
        if (admKey) existingByAdm.set(admKey, userList.length - 1);
        importedCount++;
      }
    }

    setToStorage(KEYS.USERS, userList);
    window.dispatchEvent(new CustomEvent('users-updated', { detail: userList }));
    return { imported: importedCount, updated: updatedCount, skipped: skippedCount };
  },

  // Onboarding Batches
  getOnboardingBatches(): OnboardingBatchRecord[] {
    return getFromStorage<OnboardingBatchRecord[]>(KEYS.ONBOARDING_BATCHES, INITIAL_ONBOARDING_BATCHES);
  },

  saveOnboardingBatch(batch: OnboardingBatchRecord): void {
    const batches = this.getOnboardingBatches();
    batches.unshift(batch);
    setToStorage(KEYS.ONBOARDING_BATCHES, batches);
    window.dispatchEvent(new CustomEvent('onboarding-batches-updated', { detail: batches }));
  },

  deleteOnboardingBatch(batchId: string): void {
    const batches = this.getOnboardingBatches().filter(b => b.id !== batchId);
    setToStorage(KEYS.ONBOARDING_BATCHES, batches);
    window.dispatchEvent(new CustomEvent('onboarding-batches-updated', { detail: batches }));
  },

  // Grade Passwords
  getGradePasswords(): GradePassword[] {
    return getFromStorage<GradePassword[]>(KEYS.GRADE_PASSWORDS, INITIAL_GRADE_PASSWORDS);
  },
  updateGradePassword(grade: GradeLevel, newPassword: string): void {
    const passwords = this.getGradePasswords();
    const idx = passwords.findIndex(gp => gp.grade === grade);
    if (idx !== -1) {
      passwords[idx].password = newPassword;
    } else {
      passwords.push({ grade, password: newPassword, isActive: true });
    }
    setToStorage(KEYS.GRADE_PASSWORDS, passwords);
  },
  validateGradePassword(grade: GradeLevel, inputPass: string): boolean {
    const passwords = this.getGradePasswords();
    const found = passwords.find(gp => gp.grade === grade);
    return found ? found.password === inputPass.trim() : false;
  },

  // Topics
  getTopics(grade?: GradeLevel): Topic[] {
    const topics = getFromStorage<Topic[]>(KEYS.TOPICS, INITIAL_TOPICS);
    if (grade) {
      return topics.filter(t => t.grade === grade);
    }
    return topics;
  },
  addTopic(topic: Topic): void {
    const topics = this.getTopics();
    topics.push(topic);
    setToStorage(KEYS.TOPICS, topics);
  },

  // Notes
  getNotes(grade?: GradeLevel): LessonNote[] {
    const notes = getFromStorage<LessonNote[]>(KEYS.NOTES, INITIAL_LESSON_NOTES);
    if (grade) {
      return notes.filter(n => n.grade === grade);
    }
    return notes;
  },
  addNote(note: LessonNote): void {
    const notes = this.getNotes();
    notes.push(note);
    setToStorage(KEYS.NOTES, notes);
  },
  deleteNote(id: string): void {
    const notes = this.getNotes().filter(n => n.id !== id);
    setToStorage(KEYS.NOTES, notes);
  },

  // Videos
  getVideos(grade?: GradeLevel): VideoLesson[] {
    const videos = getFromStorage<VideoLesson[]>(KEYS.VIDEOS, INITIAL_VIDEOS);
    if (grade) {
      return videos.filter(v => v.grade === grade);
    }
    return videos;
  },
  addVideo(video: VideoLesson): void {
    const videos = this.getVideos();
    videos.push(video);
    setToStorage(KEYS.VIDEOS, videos);
    window.dispatchEvent(new CustomEvent('lesson-resources-updated'));
  },
  deleteVideo(id: string): void {
    const videos = this.getVideos().filter(v => v.id !== id);
    setToStorage(KEYS.VIDEOS, videos);
    window.dispatchEvent(new CustomEvent('lesson-resources-updated'));
  },

  // Audios
  getAudios(grade?: GradeLevel): AudioLesson[] {
    const audios = getFromStorage<AudioLesson[]>(KEYS.AUDIOS, INITIAL_AUDIOS);
    if (grade) {
      return audios.filter(a => a.grade === grade);
    }
    return audios;
  },
  addAudio(audio: AudioLesson): void {
    const audios = this.getAudios();
    audios.push(audio);
    setToStorage(KEYS.AUDIOS, audios);
    window.dispatchEvent(new CustomEvent('lesson-resources-updated'));
  },
  deleteAudio(id: string): void {
    const audios = this.getAudios().filter(a => a.id !== id);
    setToStorage(KEYS.AUDIOS, audios);
    window.dispatchEvent(new CustomEvent('lesson-resources-updated'));
  },

  // Lesson Images (Diagrams, Charts, Visual Resources)
  getLessonImages(grade?: GradeLevel): LessonImage[] {
    const images = getFromStorage<LessonImage[]>(KEYS.LESSON_IMAGES, INITIAL_LESSON_IMAGES);
    if (grade) {
      return images.filter(img => img.grade === grade);
    }
    return images;
  },
  saveLessonImages(images: LessonImage[]): void {
    setToStorage(KEYS.LESSON_IMAGES, images);
    window.dispatchEvent(new CustomEvent('lesson-resources-updated'));
  },
  addLessonImage(image: LessonImage): void {
    const images = this.getLessonImages();
    images.unshift(image);
    this.saveLessonImages(images);
  },
  deleteLessonImage(id: string): void {
    const images = this.getLessonImages().filter(img => img.id !== id);
    this.saveLessonImages(images);
  },

  // E-Links (Curated Digital Web Links for Library & Subject Teachers)
  getELinks(): ELink[] {
    return getFromStorage<ELink[]>(KEYS.E_LINKS, INITIAL_E_LINKS);
  },
  saveELinks(links: ELink[]): void {
    setToStorage(KEYS.E_LINKS, links);
    window.dispatchEvent(new CustomEvent('elinks-updated', { detail: links }));
  },
  addELink(link: ELink): void {
    const links = this.getELinks();
    const updated = [link, ...links];
    this.saveELinks(updated);
  },
  updateELink(id: string, updates: Partial<ELink>): void {
    const links = this.getELinks();
    const updated = links.map(l => l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : l);
    this.saveELinks(updated);
  },
  deleteELink(id: string): void {
    const links = this.getELinks().filter(l => l.id !== id);
    this.saveELinks(links);
  },

  // Quizzes
  getQuizzes(grade?: GradeLevel): Quiz[] {
    const quizzes = getFromStorage<Quiz[]>(KEYS.QUIZZES, INITIAL_QUIZZES);
    if (grade) {
      return quizzes.filter(q => q.grade === grade);
    }
    return quizzes;
  },
  addQuiz(quiz: Quiz): void {
    const quizzes = this.getQuizzes();
    quizzes.push(quiz);
    setToStorage(KEYS.QUIZZES, quizzes);
  },

  // Quiz Attempts
  getQuizAttempts(studentId?: string): QuizAttempt[] {
    const attempts = getFromStorage<QuizAttempt[]>(KEYS.QUIZ_ATTEMPTS, INITIAL_QUIZ_ATTEMPTS);
    if (studentId) {
      return attempts.filter(a => a.studentId === studentId);
    }
    return attempts;
  },
  saveQuizAttempt(attempt: QuizAttempt): void {
    const attempts = this.getQuizAttempts();
    attempts.unshift(attempt);
    setToStorage(KEYS.QUIZ_ATTEMPTS, attempts);
  },

  // Assignments
  getAssignments(grade?: GradeLevel): Assignment[] {
    const assignments = getFromStorage<Assignment[]>(KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
    if (grade) {
      return assignments.filter(a => a.grade === grade);
    }
    return assignments;
  },
  addAssignment(assignment: Assignment): void {
    const assignments = this.getAssignments();
    assignments.push(assignment);
    setToStorage(KEYS.ASSIGNMENTS, assignments);
  },

  // Announcements
  getAnnouncements(grade?: GradeLevel): Announcement[] {
    const list = getFromStorage<Announcement[]>(KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
    if (grade) {
      // announcements for this grade or for entire school (no targetGrade)
      return list.filter(a => !a.targetGrade || a.targetGrade === grade);
    }
    return list;
  },
  addAnnouncement(announcement: Announcement): void {
    const list = this.getAnnouncements();
    list.unshift(announcement);
    setToStorage(KEYS.ANNOUNCEMENTS, list);
  },

  // Virtual Classes
  getVirtualClasses(grade?: GradeLevel): VirtualClassRoom[] {
    const rooms = getFromStorage<VirtualClassRoom[]>(KEYS.VIRTUAL_CLASSES, INITIAL_VIRTUAL_CLASSES);
    if (grade) {
      return rooms.filter(r => r.grade === grade);
    }
    return rooms;
  },
  updateVirtualClass(id: string, updates: Partial<VirtualClassRoom>): void {
    const rooms = this.getVirtualClasses();
    const idx = rooms.findIndex(r => r.id === id);
    if (idx !== -1) {
      rooms[idx] = { ...rooms[idx], ...updates };
      setToStorage(KEYS.VIRTUAL_CLASSES, rooms);
    }
  },
  addVirtualClass(room: VirtualClassRoom): void {
    const rooms = this.getVirtualClasses();
    rooms.push(room);
    setToStorage(KEYS.VIRTUAL_CLASSES, rooms);
  },

  // Work Entry Logs
  getWorkEntryLogs(teacherId?: string): WorkEntryLog[] {
    const rawLogs = getFromStorage<WorkEntryLog[]>(KEYS.WORK_ENTRY_LOGS, INITIAL_WORK_ENTRY_LOGS);
    const normalizedLogs = rawLogs.map(l => ({
      ...l,
      staffNo: l.staffNo || (l.teacherId === 'usr-teach-kiprono' ? 'TSC/44120/ED' : 'TSC/39821/ED'),
      firstName: l.firstName || (l.teacherName ? l.teacherName.split(' ')[0] : 'Teacher'),
      lastName: l.lastName || (l.teacherName ? l.teacherName.split(' ').slice(1).join(' ') : 'Educator'),
      email: l.email || `${(l.teacherId || 'staff').replace('usr-teach-', '')}@edusmart.ac.ke`,
      signInLocation: l.signInLocation || 'EduSmart Main Campus, Staffroom Block A · Nairobi Grounds',
      photoUrl: l.photoUrl || 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      geoStamp: l.geoStamp || {
        latitude: -1.2921,
        longitude: 36.8219,
        accuracy: 5,
        address: 'EduSmart Campus Gate A · Coordinates -1.2921° S, 36.8219° E (Campus Perimeter Verified)',
        verifiedCampus: true
      }
    }));

    if (teacherId) {
      return normalizedLogs.filter(l => l.teacherId === teacherId);
    }
    return normalizedLogs;
  },
  addWorkEntryLog(log: WorkEntryLog): void {
    const logs = this.getWorkEntryLogs();
    logs.unshift(log);
    setToStorage(KEYS.WORK_ENTRY_LOGS, logs);
  },

  // Gate Exit Passes
  getGatePasses(): GateExitPass[] {
    return getFromStorage<GateExitPass[]>(KEYS.GATE_PASSES, INITIAL_GATE_EXIT_PASSES);
  },
  addGatePass(pass: GateExitPass): void {
    const passes = this.getGatePasses();
    passes.unshift(pass);
    setToStorage(KEYS.GATE_PASSES, passes);
  },
  updateGatePassStatus(
    id: string, 
    status: GatePassStatus, 
    updates?: { actualReturnTime?: string; securityRemarks?: string }
  ): void {
    const passes = this.getGatePasses();
    const idx = passes.findIndex(p => p.id === id);
    if (idx !== -1) {
      passes[idx] = {
        ...passes[idx],
        status,
        ...(updates || {})
      };
      setToStorage(KEYS.GATE_PASSES, passes);
    }
  },

  // Attendance
  getAttendanceRecords(grade?: GradeLevel, stream?: StreamName): AttendanceRecord[] {
    const records = getFromStorage<AttendanceRecord[]>(KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    return records.filter(r => {
      if (grade && r.grade !== grade) return false;
      if (stream && r.stream !== stream) return false;
      return true;
    });
  },
  getAttendanceRecordForDate(grade: GradeLevel, stream: StreamName, date: string): AttendanceRecord | undefined {
    const records = this.getAttendanceRecords(grade, stream);
    return records.find(r => r.date === date);
  },
  saveAttendanceRecord(record: AttendanceRecord): void {
    const records = getFromStorage<AttendanceRecord[]>(KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    const existingIndex = records.findIndex(r => r.date === record.date && r.grade === record.grade && r.stream === record.stream);
    if (existingIndex !== -1) {
      records[existingIndex] = record;
    } else {
      records.unshift(record);
    }
    setToStorage(KEYS.ATTENDANCE, records);
  },
  getStudentAttendanceSummary(studentId: string): {
    totalMarkedDays: number;
    daysPresent: number;
    daysAbsent: number;
    daysLate: number;
    daysExcused: number;
    attendanceRate: number;
    history: { date: string; status: 'present' | 'absent' | 'late' | 'excused'; remarks?: string }[];
  } {
    const records = getFromStorage<AttendanceRecord[]>(KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    let totalMarkedDays = 0;
    let daysPresent = 0;
    let daysAbsent = 0;
    let daysLate = 0;
    let daysExcused = 0;
    const history: { date: string; status: 'present' | 'absent' | 'late' | 'excused'; remarks?: string }[] = [];

    // Sort by date descending
    const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));

    for (const rec of sorted) {
      const stuRecord = rec.records.find(r => r.studentId === studentId);
      if (stuRecord) {
        totalMarkedDays++;
        if (stuRecord.status === 'present') daysPresent++;
        else if (stuRecord.status === 'absent') daysAbsent++;
        else if (stuRecord.status === 'late') daysLate++;
        else if (stuRecord.status === 'excused') daysExcused++;

        history.push({
          date: rec.date,
          status: stuRecord.status,
          remarks: stuRecord.remarks
        });
      }
    }

    const attendanceRate = totalMarkedDays > 0 
      ? Math.round(((daysPresent + daysLate) / totalMarkedDays) * 100) 
      : 100;

    return {
      totalMarkedDays,
      daysPresent,
      daysAbsent,
      daysLate,
      daysExcused,
      attendanceRate,
      history
    };
  },

  // Timetable
  getTimetable(grade: GradeLevel, stream: StreamName): TimetableSlot[] {
    const slots = this.getAllTimetableSlots();
    return slots.filter(s => s.grade === grade && s.stream === stream);
  },
  saveTimetableSlot(slot: TimetableSlot): void {
    const slots = this.getAllTimetableSlots();
    const idx = slots.findIndex(s => s.id === slot.id);
    let updated: TimetableSlot[];
    if (idx !== -1) {
      updated = [...slots];
      updated[idx] = slot;
    } else {
      updated = [...slots, slot];
    }
    setToStorage(KEYS.TIMETABLE, updated);
    window.dispatchEvent(new CustomEvent('timetable-updated', { detail: updated }));
  },
  deleteTimetableSlot(id: string): void {
    const slots = this.getAllTimetableSlots();
    const updated = slots.filter(s => s.id !== id);
    setToStorage(KEYS.TIMETABLE, updated);
    window.dispatchEvent(new CustomEvent('timetable-updated', { detail: updated }));
  },

  // Report Cards
  getReportCards(studentId?: string, grade?: GradeLevel, stream?: StreamName): ReportCard[] {
    const reports = getFromStorage<ReportCard[]>(KEYS.REPORT_CARDS, INITIAL_REPORT_CARDS);
    return reports.filter(r => {
      if (studentId && r.studentId !== studentId) return false;
      if (grade && r.grade !== grade) return false;
      if (stream && r.stream !== stream) return false;
      return true;
    });
  },
  saveReportCard(report: ReportCard): void {
    const reports = getFromStorage<ReportCard[]>(KEYS.REPORT_CARDS, INITIAL_REPORT_CARDS);
    const idx = reports.findIndex(r => r.studentId === report.studentId && r.term === report.term);
    if (idx !== -1) {
      reports[idx] = report;
    } else {
      reports.push(report);
    }
    setToStorage(KEYS.REPORT_CARDS, reports);
    window.dispatchEvent(new CustomEvent('report-cards-updated', { detail: report }));
  },

  republishReportCard(
    reportId: string,
    updates: Partial<ReportCard>,
    publisherName: string,
    publisherRole: string,
    auditNotes?: string
  ): ReportCard | null {
    const reports = getFromStorage<ReportCard[]>(KEYS.REPORT_CARDS, INITIAL_REPORT_CARDS);
    let idx = reports.findIndex(r => r.id === reportId);
    const now = new Date().toISOString();
    if (idx === -1) {
      const newCard: ReportCard = {
        id: reportId,
        studentId: updates.studentId || 'stu-demo',
        studentName: updates.studentName || 'Student',
        admissionNumber: updates.admissionNumber || 'ADM/2026/01',
        grade: updates.grade || 4,
        stream: updates.stream || 'Dove',
        term: updates.term || 'Term 3',
        academicYear: 2026,
        subjects: updates.subjects || [],
        overallAverage: updates.overallAverage || 80,
        overallRubric: updates.overallRubric || 'Exceeding Expectations',
        streamPosition: updates.streamPosition ?? 1,
        totalStudentsInStream: updates.totalStudentsInStream ?? 40,
        attendanceDays: updates.attendanceDays || 49,
        totalSchoolDays: 50,
        nextTermBegins: '2027-01-05',
        classTeacherRemarks: updates.classTeacherRemarks || 'Diligent and consistent.',
        headTeacherRemarks: updates.headTeacherRemarks || 'Commended for progress.',
        ...updates,
        publicationStatus: 'Republished',
        republishedAt: now,
        republishedBy: publisherName,
        republishedRole: publisherRole,
        republishAuditNotes: auditNotes || `Officially reviewed and republished with authoritative moderation by ${publisherName} (${publisherRole}).`
      };
      reports.push(newCard);
      setToStorage(KEYS.REPORT_CARDS, reports);
      window.dispatchEvent(new CustomEvent('report-cards-updated', { detail: newCard }));
      return newCard;
    }
    const updated: ReportCard = {
      ...reports[idx],
      ...updates,
      publicationStatus: 'Republished',
      republishedAt: now,
      republishedBy: publisherName,
      republishedRole: publisherRole,
      republishAuditNotes: auditNotes || `Officially reviewed and republished with authoritative moderation by ${publisherName} (${publisherRole}).`
    };
    reports[idx] = updated;
    setToStorage(KEYS.REPORT_CARDS, reports);
    window.dispatchEvent(new CustomEvent('report-cards-updated', { detail: updated }));
    return updated;
  },

  updateReportCardRemarks(
    reportId: string,
    remarksUpdates: {
      classTeacherRemarks?: string;
      headTeacherRemarks?: string;
      deanRemarks?: string;
      deputyRemarks?: string;
      subjectRemarks?: { subject: SubjectName; remarks: string }[];
    }
  ): ReportCard | null {
    const reports = getFromStorage<ReportCard[]>(KEYS.REPORT_CARDS, INITIAL_REPORT_CARDS);
    const idx = reports.findIndex(r => r.id === reportId);
    if (idx === -1) return null;
    const current = reports[idx];
    let updatedSubjects = [...current.subjects];
    if (remarksUpdates.subjectRemarks) {
      updatedSubjects = updatedSubjects.map(s => {
        const match = remarksUpdates.subjectRemarks?.find(sr => sr.subject === s.subject);
        return match ? { ...s, remarks: match.remarks } : s;
      });
    }
    const updated: ReportCard = {
      ...current,
      subjects: updatedSubjects,
      classTeacherRemarks: remarksUpdates.classTeacherRemarks ?? current.classTeacherRemarks,
      headTeacherRemarks: remarksUpdates.headTeacherRemarks ?? current.headTeacherRemarks,
      deanRemarks: remarksUpdates.deanRemarks ?? current.deanRemarks,
      deputyRemarks: remarksUpdates.deputyRemarks ?? current.deputyRemarks,
    };
    reports[idx] = updated;
    setToStorage(KEYS.REPORT_CARDS, reports);
    window.dispatchEvent(new CustomEvent('report-cards-updated', { detail: updated }));
    return updated;
  },

  // Chat Messages
  getChatMessages(grade: GradeLevel, stream?: StreamName): ChatMessage[] {
    const messages = getFromStorage<ChatMessage[]>(KEYS.CHAT_MESSAGES, INITIAL_CHAT_MESSAGES);
    return messages.filter(m => {
      if (m.grade !== grade) return false;
      if (stream && m.stream && m.stream !== stream && !m.isDirect) return false;
      return true;
    });
  },
  sendChatMessage(message: ChatMessage): void {
    const messages = getFromStorage<ChatMessage[]>(KEYS.CHAT_MESSAGES, INITIAL_CHAT_MESSAGES);
    messages.push(message);
    setToStorage(KEYS.CHAT_MESSAGES, messages);
  },

  // Library Management
  getLibraryBooks(): LibraryBook[] {
    return getFromStorage<LibraryBook[]>(KEYS.LIBRARY_BOOKS, INITIAL_LIBRARY_BOOKS);
  },
  saveLibraryBook(book: LibraryBook): void {
    const books = getFromStorage<LibraryBook[]>(KEYS.LIBRARY_BOOKS, INITIAL_LIBRARY_BOOKS);
    const idx = books.findIndex(b => b.id === book.id);
    if (idx !== -1) {
      books[idx] = book;
    } else {
      books.unshift(book);
    }
    setToStorage(KEYS.LIBRARY_BOOKS, books);
  },
  getBorrowRecords(): LibraryBorrowRecord[] {
    return getFromStorage<LibraryBorrowRecord[]>(KEYS.BORROW_RECORDS, INITIAL_BORROW_RECORDS);
  },
  borrowBook(record: LibraryBorrowRecord): void {
    const records = getFromStorage<LibraryBorrowRecord[]>(KEYS.BORROW_RECORDS, INITIAL_BORROW_RECORDS);
    records.unshift(record);
    setToStorage(KEYS.BORROW_RECORDS, records);

    // decrease available count
    const books = getFromStorage<LibraryBook[]>(KEYS.LIBRARY_BOOKS, INITIAL_LIBRARY_BOOKS);
    const bk = books.find(b => b.id === record.bookId);
    if (bk && bk.copiesAvailable > 0) {
      bk.copiesAvailable -= 1;
      setToStorage(KEYS.LIBRARY_BOOKS, books);
    }
    window.dispatchEvent(new CustomEvent('library-borrow-records-updated', { detail: records }));
    window.dispatchEvent(new CustomEvent('library-books-updated', { detail: books }));
  },
  returnBook(recordIdOrCopyId: string, remarks?: string): LibraryBorrowRecord | null {
    const records = getFromStorage<LibraryBorrowRecord[]>(KEYS.BORROW_RECORDS, INITIAL_BORROW_RECORDS);
    // Find either by borrow record id or by unique copy id (case-insensitive trim)
    const rec = records.find(r => 
      (r.id === recordIdOrCopyId || (r.bookCopyId && r.bookCopyId.trim().toUpperCase() === recordIdOrCopyId.trim().toUpperCase())) &&
      r.status !== 'returned'
    ) || records.find(r => r.id === recordIdOrCopyId);

    if (rec) {
      rec.status = 'returned';
      rec.returnedDate = new Date().toISOString().split('T')[0];
      if (remarks) rec.remarks = remarks;
      setToStorage(KEYS.BORROW_RECORDS, records);

      // increase available count
      const books = getFromStorage<LibraryBook[]>(KEYS.LIBRARY_BOOKS, INITIAL_LIBRARY_BOOKS);
      const bk = books.find(b => b.id === rec.bookId);
      if (bk && bk.copiesAvailable < bk.totalCopies) {
        bk.copiesAvailable += 1;
        setToStorage(KEYS.LIBRARY_BOOKS, books);
      }
      window.dispatchEvent(new CustomEvent('library-borrow-records-updated', { detail: records }));
      window.dispatchEvent(new CustomEvent('library-books-updated', { detail: books }));
      return rec;
    }
    return null;
  },
  getActiveBorrowRecordByCopyId(copyId: string): LibraryBorrowRecord | undefined {
    if (!copyId) return undefined;
    const records = this.getBorrowRecords();
    return records.find(r => 
      r.status !== 'returned' && 
      r.bookCopyId && 
      r.bookCopyId.trim().toUpperCase() === copyId.trim().toUpperCase()
    );
  },
  isCopyCurrentlyBorrowed(copyId: string): boolean {
    return !!this.getActiveBorrowRecordByCopyId(copyId);
  },
  getIssuedCopyIdsForBook(bookId: string): string[] {
    const records = this.getBorrowRecords();
    return records
      .filter(r => r.bookId === bookId && r.status !== 'returned' && r.bookCopyId)
      .map(r => r.bookCopyId as string);
  },

  getLibraryReservations(): LibraryReservation[] {
    return getFromStorage<LibraryReservation[]>(KEYS.LIBRARY_RESERVATIONS, INITIAL_LIBRARY_RESERVATIONS);
  },
  saveLibraryReservations(res: LibraryReservation[]): void {
    setToStorage(KEYS.LIBRARY_RESERVATIONS, res);
    window.dispatchEvent(new CustomEvent('library-reservations-updated', { detail: res }));
  },
  addLibraryReservation(res: LibraryReservation): void {
    const list = this.getLibraryReservations();
    const updated = [res, ...list];
    this.saveLibraryReservations(updated);
  },
  updateLibraryReservation(id: string, updates: Partial<LibraryReservation>): void {
    const list = this.getLibraryReservations();
    const updated = list.map(r => r.id === id ? { ...r, ...updates } : r);
    this.saveLibraryReservations(updated);
  },

  getLibraryFines(): LibraryFine[] {
    return getFromStorage<LibraryFine[]>(KEYS.LIBRARY_FINES, INITIAL_LIBRARY_FINES);
  },
  saveLibraryFines(fines: LibraryFine[]): void {
    setToStorage(KEYS.LIBRARY_FINES, fines);
    window.dispatchEvent(new CustomEvent('library-fines-updated', { detail: fines }));
  },
  addLibraryFine(fine: LibraryFine): void {
    const list = this.getLibraryFines();
    const updated = [fine, ...list];
    this.saveLibraryFines(updated);
  },
  updateLibraryFine(id: string, updates: Partial<LibraryFine>): void {
    const list = this.getLibraryFines();
    const updated = list.map(f => f.id === id ? { ...f, ...updates } : f);
    this.saveLibraryFines(updated);
  },

  getLibraryAcquisitions(): LibraryAcquisition[] {
    return getFromStorage<LibraryAcquisition[]>(KEYS.LIBRARY_ACQUISITIONS, INITIAL_LIBRARY_ACQUISITIONS);
  },
  saveLibraryAcquisitions(acqs: LibraryAcquisition[]): void {
    setToStorage(KEYS.LIBRARY_ACQUISITIONS, acqs);
    window.dispatchEvent(new CustomEvent('library-acquisitions-updated', { detail: acqs }));
  },
  addLibraryAcquisition(acq: LibraryAcquisition): void {
    const list = this.getLibraryAcquisitions();
    const updated = [acq, ...list];
    this.saveLibraryAcquisitions(updated);
  },
  updateLibraryAcquisition(id: string, updates: Partial<LibraryAcquisition>): void {
    const list = this.getLibraryAcquisitions();
    const updated = list.map(a => a.id === id ? { ...a, ...updates } : a);
    this.saveLibraryAcquisitions(updated);
  },

  getLibraryShelves(): LibraryShelfLocation[] {
    return getFromStorage<LibraryShelfLocation[]>(KEYS.LIBRARY_SHELVES, INITIAL_LIBRARY_SHELVES);
  },
  saveLibraryShelves(shelves: LibraryShelfLocation[]): void {
    setToStorage(KEYS.LIBRARY_SHELVES, shelves);
    window.dispatchEvent(new CustomEvent('library-shelves-updated', { detail: shelves }));
  },
  addLibraryShelf(shelf: LibraryShelfLocation): void {
    const list = this.getLibraryShelves();
    const updated = [...list, shelf];
    this.saveLibraryShelves(updated);
  },

  getDigitalLibraryItems(): DigitalLibraryItem[] {
    return getFromStorage<DigitalLibraryItem[]>(KEYS.LIBRARY_DIGITAL_ITEMS, INITIAL_DIGITAL_LIBRARY_ITEMS);
  },
  saveDigitalLibraryItems(items: DigitalLibraryItem[]): void {
    setToStorage(KEYS.LIBRARY_DIGITAL_ITEMS, items);
    window.dispatchEvent(new CustomEvent('digital-library-updated', { detail: items }));
  },
  addDigitalLibraryItem(item: DigitalLibraryItem): void {
    const list = this.getDigitalLibraryItems();
    const updated = [item, ...list];
    this.saveDigitalLibraryItems(updated);
  },

  getReadingProgrammeMembers(): ReadingProgrammeMember[] {
    return getFromStorage<ReadingProgrammeMember[]>(KEYS.LIBRARY_READING_PROGRAMME, INITIAL_READING_PROGRAMME_MEMBERS);
  },
  saveReadingProgrammeMembers(members: ReadingProgrammeMember[]): void {
    setToStorage(KEYS.LIBRARY_READING_PROGRAMME, members);
    window.dispatchEvent(new CustomEvent('reading-programme-updated', { detail: members }));
  },
  addReadingProgrammeMember(member: ReadingProgrammeMember): void {
    const list = this.getReadingProgrammeMembers();
    const updated = [member, ...list];
    this.saveReadingProgrammeMembers(updated);
  },
  updateReadingProgrammeMember(id: string, updates: Partial<ReadingProgrammeMember>): void {
    const list = this.getReadingProgrammeMembers();
    const updated = list.map(m => m.id === id ? { ...m, ...updates } : m);
    this.saveReadingProgrammeMembers(updated);
  },

  getLibraryAttendance(): LibraryAttendanceLog[] {
    return getFromStorage<LibraryAttendanceLog[]>(KEYS.LIBRARY_ATTENDANCE, INITIAL_LIBRARY_ATTENDANCE);
  },
  saveLibraryAttendance(logs: LibraryAttendanceLog[]): void {
    setToStorage(KEYS.LIBRARY_ATTENDANCE, logs);
    window.dispatchEvent(new CustomEvent('library-attendance-updated', { detail: logs }));
  },
  addLibraryAttendanceLog(log: LibraryAttendanceLog): void {
    const list = this.getLibraryAttendance();
    const updated = [log, ...list];
    this.saveLibraryAttendance(updated);
  },

  getLibraryTimetable(): LibraryTimetableSlot[] {
    return getFromStorage<LibraryTimetableSlot[]>(KEYS.LIBRARY_TIMETABLE, INITIAL_LIBRARY_TIMETABLE);
  },
  saveLibraryTimetable(slots: LibraryTimetableSlot[]): void {
    setToStorage(KEYS.LIBRARY_TIMETABLE, slots);
    window.dispatchEvent(new CustomEvent('library-timetable-updated', { detail: slots }));
  },
  addLibraryTimetableSlot(slot: LibraryTimetableSlot): void {
    const list = this.getLibraryTimetable();
    const updated = [...list, slot];
    this.saveLibraryTimetable(updated);
  },

  getLibraryEvents(): LibraryEvent[] {
    return getFromStorage<LibraryEvent[]>(KEYS.LIBRARY_EVENTS, INITIAL_LIBRARY_EVENTS);
  },
  saveLibraryEvents(events: LibraryEvent[]): void {
    setToStorage(KEYS.LIBRARY_EVENTS, events);
    window.dispatchEvent(new CustomEvent('library-events-updated', { detail: events }));
  },
  addLibraryEvent(event: LibraryEvent): void {
    const list = this.getLibraryEvents();
    const updated = [event, ...list];
    this.saveLibraryEvents(updated);
  },

  getLibraryPolicies(): LibraryPolicy[] {
    return getFromStorage<LibraryPolicy[]>(KEYS.LIBRARY_POLICIES, INITIAL_LIBRARY_POLICIES);
  },
  saveLibraryPolicies(policies: LibraryPolicy[]): void {
    setToStorage(KEYS.LIBRARY_POLICIES, policies);
    window.dispatchEvent(new CustomEvent('library-policies-updated', { detail: policies }));
  },
  updateLibraryPolicy(id: string, updates: Partial<LibraryPolicy>): void {
    const list = this.getLibraryPolicies();
    const updated = list.map(p => p.id === id ? { ...p, ...updates } : p);
    this.saveLibraryPolicies(updated);
  },

  getLibraryAuditLogs(): LibraryAuditLog[] {
    return getFromStorage<LibraryAuditLog[]>(KEYS.LIBRARY_AUDIT_LOGS, INITIAL_LIBRARY_AUDIT_LOGS);
  },
  addLibraryAuditLog(log: LibraryAuditLog): void {
    const list = this.getLibraryAuditLogs();
    const updated = [log, ...list];
    setToStorage(KEYS.LIBRARY_AUDIT_LOGS, updated);
    window.dispatchEvent(new CustomEvent('library-audit-updated', { detail: updated }));
  },

  // Library Rooms & Room Booking Portal
  getLibraryRooms(): LibraryRoom[] {
    return getFromStorage<LibraryRoom[]>(KEYS.LIBRARY_ROOMS, INITIAL_LIBRARY_ROOMS);
  },
  saveLibraryRooms(rooms: LibraryRoom[]): void {
    setToStorage(KEYS.LIBRARY_ROOMS, rooms);
    window.dispatchEvent(new CustomEvent('library-rooms-updated', { detail: rooms }));
  },
  getLibraryRoomBookings(): LibraryRoomBooking[] {
    return getFromStorage<LibraryRoomBooking[]>(KEYS.LIBRARY_ROOM_BOOKINGS, INITIAL_LIBRARY_ROOM_BOOKINGS);
  },
  saveLibraryRoomBookings(bookings: LibraryRoomBooking[]): void {
    setToStorage(KEYS.LIBRARY_ROOM_BOOKINGS, bookings);
    window.dispatchEvent(new CustomEvent('library-room-bookings-updated', { detail: bookings }));
  },
  addLibraryRoomBooking(booking: LibraryRoomBooking): void {
    const list = this.getLibraryRoomBookings();
    const updated = [booking, ...list];
    this.saveLibraryRoomBookings(updated);
  },
  updateLibraryRoomBooking(id: string, updates: Partial<LibraryRoomBooking>): void {
    const list = this.getLibraryRoomBookings();
    const updated = list.map(b => b.id === id ? { ...b, ...updates } : b);
    this.saveLibraryRoomBookings(updated);
  },
  cancelLibraryRoomBooking(id: string): void {
    const list = this.getLibraryRoomBookings();
    const updated = list.map(b => b.id === id ? { ...b, status: 'cancelled' as const } : b);
    this.saveLibraryRoomBookings(updated);
  },

  // Parent Helpers
  getParentChildren(parentUser: User): User[] {
    const all = this.getUsers();
    if (parentUser.childrenIds && parentUser.childrenIds.length > 0) {
      return all.filter(u => parentUser.childrenIds?.includes(u.id));
    }
    // Fallback: Brian Otieno
    return all.filter(u => u.id === 'usr-stu-brian');
  },

  // Centralized Notifications
  getNotifications(user?: User | null): AppNotification[] {
    const list = getFromStorage<AppNotification[]>(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    if (!user) return list;

    // Filter relevant to user's role, grade, or user ID
    return list.filter(n => {
      // 1. Direct user match
      if (n.targetUserId && n.targetUserId === user.id) return true;

      // 2. Role match
      if (n.targetRole === 'all') return true;
      if (n.targetRole === user.role) return true;
      if (n.targetRole === 'teacher' && user.role === 'class_teacher') return true;

      // 3. Student grade match
      if (user.role === 'student' && n.targetGrade && n.targetGrade === user.grade) return true;

      // 4. Parent child grade match
      if (user.role === 'parent' && n.targetGrade) {
        const children = this.getParentChildren(user);
        if (children.some(c => c.grade === n.targetGrade)) return true;
      }

      // If no specific target role or grade, include for all
      if (!n.targetRole && !n.targetGrade && !n.targetUserId) return true;

      return false;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getUnreadNotificationCount(user: User): number {
    const userNotifs = this.getNotifications(user);
    return userNotifs.filter(n => !n.readByUserIds?.includes(user.id)).length;
  },

  markNotificationAsRead(notificationId: string, userId: string): void {
    const all = getFromStorage<AppNotification[]>(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const item = all.find(n => n.id === notificationId);
    if (item) {
      if (!item.readByUserIds) item.readByUserIds = [];
      if (!item.readByUserIds.includes(userId)) {
        item.readByUserIds.push(userId);
        setToStorage(KEYS.NOTIFICATIONS, all);
      }
    }
  },

  markAllNotificationsAsRead(userId: string): void {
    const all = getFromStorage<AppNotification[]>(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    all.forEach(n => {
      if (!n.readByUserIds) n.readByUserIds = [];
      if (!n.readByUserIds.includes(userId)) {
        n.readByUserIds.push(userId);
      }
    });
    setToStorage(KEYS.NOTIFICATIONS, all);
  },

  addNotification(notif: AppNotification): void {
    const all = getFromStorage<AppNotification[]>(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    all.unshift(notif);
    setToStorage(KEYS.NOTIFICATIONS, all);
    window.dispatchEvent(new CustomEvent('notifications-updated', { detail: all }));
  },

  deleteNotification(notificationId: string): void {
    const all = getFromStorage<AppNotification[]>(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const updated = all.filter(n => n.id !== notificationId);
    setToStorage(KEYS.NOTIFICATIONS, updated);
    window.dispatchEvent(new CustomEvent('notifications-updated', { detail: updated }));
  },

  // 1. Gamification: Badges & Certification Points
  getBadges(): LearnerBadge[] {
    return getFromStorage<LearnerBadge[]>(KEYS.BADGES, INITIAL_BADGES);
  },
  saveBadges(badges: LearnerBadge[]): void {
    setToStorage(KEYS.BADGES, badges);
  },
  getTotalXP(): number {
    const badges = this.getBadges();
    return badges.filter(b => b.unlocked).reduce((sum, b) => sum + b.xpPoints, 0);
  },
  unlockBadge(badgeId: string): void {
    const badges = this.getBadges();
    const b = badges.find(x => x.id === badgeId);
    if (b && !b.unlocked) {
      b.unlocked = true;
      b.dateUnlocked = new Date().toISOString().split('T')[0];
      setToStorage(KEYS.BADGES, badges);
    }
  },
  getResourceViews(studentId?: string): string[] {
    const map = getFromStorage<Record<string, string[]>>(KEYS.RESOURCE_VIEWS, {
      'std-g4-01': ['note-1', 'audio-1', 'video-1', 'note-2']
    });
    if (studentId) {
      return map[studentId] || ['note-1', 'audio-1', 'video-1'];
    }
    return Object.values(map).flat();
  },
  recordResourceView(studentId: string, resourceId: string): void {
    const map = getFromStorage<Record<string, string[]>>(KEYS.RESOURCE_VIEWS, {
      'std-g4-01': ['note-1', 'audio-1', 'video-1', 'note-2']
    });
    const current = map[studentId] || ['note-1', 'audio-1', 'video-1'];
    if (!current.includes(resourceId)) {
      map[studentId] = [...current, resourceId];
      setToStorage(KEYS.RESOURCE_VIEWS, map);
    }
  },
  evaluateBadgesForStudent(student: User): { allBadges: LearnerBadge[]; newlyUnlocked: LearnerBadge[]; totalXP: number } {
    const badges = this.getBadges();
    const quizAttempts = this.getQuizAttempts(student.id);
    const attendanceSummary = this.getStudentAttendanceSummary(student.id);
    const studentAttendanceRate = attendanceSummary.totalMarkedDays > 0 ? attendanceSummary.attendanceRate : 100;
    const resourceViews = this.getResourceViews(student.id);
    const portfolioItems = this.getPortfolioItems(student.id);
    const searchLogs = this.getSearchAuditLogs().filter(s => s.userId === student.id || s.userName === student.name);

    // Quiz statistics: Top scorer (100% or max distinctions)
    const perfectQuizzes = quizAttempts.filter(q => q.percentage >= 100 || q.score === q.totalQuestions).length;
    const highQuizzes = quizAttempts.filter(q => q.percentage >= 80).length;

    // Clean safe searches
    const cleanSearches = searchLogs.filter(s => s.status === 'safe').length;

    const newlyUnlocked: LearnerBadge[] = [];

    badges.forEach(b => {
      let qualifies = false;

      if (b.id === 'bdg-top-scorer') {
        b.currentProgress = perfectQuizzes > 0 ? 1 : (highQuizzes > 0 ? 1 : 0);
        b.targetProgress = 1;
        qualifies = (perfectQuizzes > 0) || (highQuizzes > 0);
      } else if (b.id === 'bdg-perfect-attendance') {
        b.currentProgress = studentAttendanceRate;
        b.targetProgress = 100;
        qualifies = studentAttendanceRate >= 100;
      } else if (b.id === 'bdg-resource-explorer') {
        b.currentProgress = resourceViews.length;
        b.targetProgress = 3;
        qualifies = resourceViews.length >= 3;
      } else if (b.id === 'bdg-portfolio-artisan') {
        b.currentProgress = portfolioItems.length;
        b.targetProgress = 1;
        qualifies = portfolioItems.length >= 1;
      } else if (b.id === 'bdg-digital-citizen') {
        b.currentProgress = Math.min(cleanSearches, 3);
        b.targetProgress = 3;
        qualifies = cleanSearches >= 1 && !searchLogs.some(s => s.status === 'flagged');
      } else if (b.id === 'bdg-math-whiz') {
        const mathAttempts = quizAttempts.filter(q => q.subject === 'Mathematics');
        const maxScore = mathAttempts.length > 0 ? Math.max(...mathAttempts.map(q => q.percentage)) : 100;
        b.currentProgress = maxScore;
        b.targetProgress = 80;
        qualifies = maxScore >= 80;
      } else if (b.id === 'bdg-quick-thinker') {
        const passedQuizzes = quizAttempts.filter(q => q.passed).length;
        b.currentProgress = passedQuizzes > 0 ? 1 : 0;
        b.targetProgress = 1;
        qualifies = passedQuizzes > 0;
      } else if (b.id === 'bdg-curious-scientist') {
        const scienceViews = resourceViews.filter(r => r.includes('science') || r.includes('note') || r.includes('video')).length;
        b.currentProgress = scienceViews;
        b.targetProgress = 4;
        qualifies = scienceViews >= 4;
      }

      if (qualifies && !b.unlocked) {
        b.unlocked = true;
        b.dateUnlocked = new Date().toISOString().split('T')[0];
        newlyUnlocked.push(b);
      }
    });

    setToStorage(KEYS.BADGES, badges);
    const totalXP = badges.filter(b => b.unlocked).reduce((sum, b) => sum + b.xpPoints, 0);
    return { allBadges: badges, newlyUnlocked, totalXP };
  },

  // 2. E-Portfolio: Projects & Practical Artifacts
  getPortfolioItems(studentId?: string): PortfolioItem[] {
    const items = getFromStorage<PortfolioItem[]>(KEYS.PORTFOLIO, INITIAL_PORTFOLIO_ITEMS);
    if (studentId) {
      return items.filter(p => p.studentId === studentId);
    }
    return items;
  },
  addPortfolioItem(item: PortfolioItem): void {
    const items = this.getPortfolioItems();
    items.unshift(item);
    setToStorage(KEYS.PORTFOLIO, items);
  },

  // 3. Periodic Reports: Weekly, Monthly, Termly, Annually
  getPeriodicReports(studentId?: string, periodType?: string): PeriodicReport[] {
    const reports = getFromStorage<PeriodicReport[]>(KEYS.PERIODIC_REPORTS, INITIAL_PERIODIC_REPORTS);
    return reports.filter(r => {
      const matchStudent = !studentId || r.studentId === studentId;
      const matchPeriod = !periodType || periodType === 'all' || r.periodType === periodType;
      return matchStudent && matchPeriod;
    });
  },

  // 4. External Learning Tools & Integrations
  getExternalTools(): ExternalTool[] {
    return getFromStorage<ExternalTool[]>(KEYS.EXTERNAL_TOOLS, INITIAL_EXTERNAL_TOOLS);
  },

  // 5. Learner Discipline: Safe Search & Content Filtration
  getSearchAuditLogs(): SearchAuditLog[] {
    return getFromStorage<SearchAuditLog[]>(KEYS.SEARCH_AUDIT, INITIAL_SEARCH_AUDIT_LOGS);
  },
  logSearchQuery(log: SearchAuditLog): void {
    const logs = this.getSearchAuditLogs();
    logs.unshift(log);
    setToStorage(KEYS.SEARCH_AUDIT, logs);
  },
  executeSafeSearch(query: string, user: User): {
    status: 'safe' | 'flagged' | 'guided_redirection';
    message: string;
    matchedNotes: LessonNote[];
    matchedQuizzes: Quiz[];
    matchedBooks: LibraryBook[];
    redirectionSuggestion?: string;
  } {
    const cleanQ = query.trim().toLowerCase();
    
    // Inappropriate / off-topic keywords restricted during academic search
    const blockedKeywords = ['cheat', 'hack', 'gun', 'gambling', 'casino', 'violence', 'drugs', 'xxx', 'porn'];
    const distractionKeywords = ['minecraft', 'fortnite', 'roblox', 'tiktok', 'action games', 'free games', 'cartoons'];

    if (blockedKeywords.some(w => cleanQ.includes(w))) {
      const logEntry: SearchAuditLog = {
        id: `sch-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        grade: user.grade,
        searchQuery: query,
        timestamp: new Date().toISOString(),
        status: 'flagged',
        filterReason: 'Query contains restricted non-educational keywords violating school online conduct policy.'
      };
      this.logSearchQuery(logEntry);

      return {
        status: 'flagged',
        message: 'Search query flagged: Content does not comply with EduSmart safe online learning standards. Academic counseling notice recorded.',
        matchedNotes: [],
        matchedQuizzes: [],
        matchedBooks: []
      };
    }

    if (distractionKeywords.some(w => cleanQ.includes(w))) {
      const logEntry: SearchAuditLog = {
        id: `sch-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        grade: user.grade,
        searchQuery: query,
        timestamp: new Date().toISOString(),
        status: 'guided_redirection',
        filterReason: 'Recreational distraction search during study session',
        educationalTopicFound: 'Redirected to: Gamified CBC Math Challenges & Kahoot / Quizizz'
      };
      this.logSearchQuery(logEntry);

      return {
        status: 'guided_redirection',
        message: 'Educational Redirection: Non-curriculum search detected. We have guided you to approved gamified CBC challenges on Kahoot, Quizizz, and Interactive Quizzes.',
        matchedNotes: [],
        matchedQuizzes: this.getQuizzes(user.grade),
        matchedBooks: [],
        redirectionSuggestion: 'Try exploring: Gamified Mathematics Quizzes or KICD Creative Arts Storybooks!'
      };
    }

    // Safe academic search across curriculum notes, quizzes, and books
    const allNotes = this.getNotes(user.grade);
    const allQuizzes = this.getQuizzes(user.grade);
    const allBooks = this.getLibraryBooks();

    const matchedNotes = allNotes.filter(n => 
      n.title.toLowerCase().includes(cleanQ) || 
      n.content.toLowerCase().includes(cleanQ) || 
      n.subject.toLowerCase().includes(cleanQ)
    );

    const matchedQuizzes = allQuizzes.filter(q => 
      q.title.toLowerCase().includes(cleanQ) || 
      q.subject.toLowerCase().includes(cleanQ)
    );

    const matchedBooks = allBooks.filter(b => 
      b.title.toLowerCase().includes(cleanQ) || 
      b.author.toLowerCase().includes(cleanQ) || 
      (b.subject && b.subject.toLowerCase().includes(cleanQ))
    );

    const logEntry: SearchAuditLog = {
      id: `sch-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      grade: user.grade,
      searchQuery: query,
      timestamp: new Date().toISOString(),
      status: 'safe',
      educationalTopicFound: matchedNotes[0]?.subject || matchedQuizzes[0]?.subject || 'General CBC Inquiry'
    };
    this.logSearchQuery(logEntry);

    return {
      status: 'safe',
      message: `Found ${matchedNotes.length} notes, ${matchedQuizzes.length} interactive quizzes, and ${matchedBooks.length} library books matching "${query}".`,
      matchedNotes,
      matchedQuizzes,
      matchedBooks
    };
  },

  // School Calendar Management
  getCalendarEvents(): SchoolCalendarEvent[] {
    const rawEvents = getFromStorage<SchoolCalendarEvent[]>(KEYS.CALENDAR_EVENTS, INITIAL_CALENDAR_EVENTS);
    // Enforce business rule: Event tickets apply EXCLUSIVELY to co-curricular events.
    // Strip ticketing data from any academic or other non-co-curricular events.
    return rawEvents.map(evt => {
      if (evt.category !== 'co_curricular') {
        const {
          ticketType,
          ticketPrice,
          ticketCurrency,
          ticketPerks,
          totalCapacity,
          ticketsSold,
          isTicketedEvent,
          ...cleaned
        } = evt;
        return {
          ...cleaned,
          isTicketedEvent: false
        };
      }
      return {
        ...evt,
        isTicketedEvent: true
      };
    });
  },

  saveCalendarEvents(events: SchoolCalendarEvent[]): void {
    // Sanitize before saving: only co-curricular events can have ticketing properties
    const sanitizedEvents = events.map(evt => {
      if (evt.category !== 'co_curricular') {
        const {
          ticketType,
          ticketPrice,
          ticketCurrency,
          ticketPerks,
          totalCapacity,
          ticketsSold,
          isTicketedEvent,
          ...cleaned
        } = evt;
        return {
          ...cleaned,
          isTicketedEvent: false
        };
      }
      return {
        ...evt,
        isTicketedEvent: true
      };
    });
    setToStorage(KEYS.CALENDAR_EVENTS, sanitizedEvents);
    window.dispatchEvent(new CustomEvent('calendar-events-updated', { detail: sanitizedEvents }));
  },

  addCalendarEvent(event: Omit<SchoolCalendarEvent, 'id'>): SchoolCalendarEvent {
    const events = this.getCalendarEvents();
    const isCoCurricular = event.category === 'co_curricular';
    const newEvent: SchoolCalendarEvent = {
      ...event,
      id: `cal-${Date.now()}`,
      isTicketedEvent: isCoCurricular,
      ticketType: isCoCurricular ? event.ticketType : undefined,
      ticketPrice: isCoCurricular && event.ticketType === 'paid' ? Number(event.ticketPrice) : undefined,
      ticketCurrency: isCoCurricular ? event.ticketCurrency : undefined,
      totalCapacity: isCoCurricular ? (Number(event.totalCapacity) || 0) : undefined,
      ticketPerks: isCoCurricular ? event.ticketPerks : undefined,
      ticketsSold: isCoCurricular ? (event.ticketsSold || 0) : undefined
    };
    if (!isCoCurricular) {
      delete (newEvent as any).ticketType;
      delete (newEvent as any).ticketPrice;
      delete (newEvent as any).ticketCurrency;
      delete (newEvent as any).ticketPerks;
      delete (newEvent as any).totalCapacity;
      delete (newEvent as any).ticketsSold;
    }
    events.unshift(newEvent);
    this.saveCalendarEvents(events);
    return newEvent;
  },

  updateCalendarEvent(id: string, updates: Partial<SchoolCalendarEvent>): SchoolCalendarEvent | null {
    const events = this.getCalendarEvents();
    const index = events.findIndex(e => e.id === id);
    if (index === -1) return null;
    const existing = events[index];
    const category = updates.category !== undefined ? updates.category : existing.category;
    const isCoCurricular = category === 'co_curricular';

    let merged: SchoolCalendarEvent = {
      ...existing,
      ...updates,
      category,
      isTicketedEvent: isCoCurricular,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    if (!isCoCurricular) {
      delete (merged as any).ticketType;
      delete (merged as any).ticketPrice;
      delete (merged as any).ticketCurrency;
      delete (merged as any).ticketPerks;
      delete (merged as any).totalCapacity;
      delete (merged as any).ticketsSold;
      merged.isTicketedEvent = false;
    }

    events[index] = merged;
    this.saveCalendarEvents(events);
    return events[index];
  },

  deleteCalendarEvent(id: string): boolean {
    const events = this.getCalendarEvents();
    const filtered = events.filter(e => e.id !== id);
    if (filtered.length === events.length) return false;
    this.saveCalendarEvents(filtered);
    return true;
  },

  // Event Ticketing & Pass Purchase Management
  getEventTicketPurchases(): EventTicketPurchase[] {
    return getFromStorage<EventTicketPurchase[]>(KEYS.EVENT_TICKETS, INITIAL_EVENT_TICKETS);
  },

  saveEventTicketPurchases(tickets: EventTicketPurchase[]): void {
    setToStorage(KEYS.EVENT_TICKETS, tickets);
    window.dispatchEvent(new CustomEvent('event-tickets-updated', { detail: tickets }));
  },

  bookEventTicket(ticketData: Omit<EventTicketPurchase, 'id' | 'ticketCode' | 'purchasedAt'>): EventTicketPurchase {
    const events = this.getCalendarEvents();
    const targetEvent = events.find(e => e.id === ticketData.eventId);
    if (targetEvent && targetEvent.category !== 'co_curricular') {
      throw new Error('Event ticketing passes are exclusively for Co-Curricular events. Academic schedules do not require tickets.');
    }

    const tickets = this.getEventTicketPurchases();
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const newTicket: EventTicketPurchase = {
      ...ticketData,
      id: `tkt-${Date.now()}`,
      ticketCode: `TKT-2026-${randomCode}`,
      purchasedAt: new Date().toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })
    };

    tickets.unshift(newTicket);
    this.saveEventTicketPurchases(tickets);

    // Also increment ticketsSold on the calendar event (if co-curricular)
    const eventIndex = events.findIndex(e => e.id === ticketData.eventId);
    if (eventIndex !== -1 && events[eventIndex].category === 'co_curricular') {
      const currentSold = events[eventIndex].ticketsSold || 0;
      events[eventIndex] = {
        ...events[eventIndex],
        ticketsSold: currentSold + (ticketData.quantity || 1)
      };
      this.saveCalendarEvents(events);
    }

    return newTicket;
  },

  updateEventTicketQuantity(ticketId: string, newQuantity: number): EventTicketPurchase | null {
    if (newQuantity <= 0) {
      throw new Error('Ticket quantity must be at least 1.');
    }

    const tickets = this.getEventTicketPurchases();
    const ticketIdx = tickets.findIndex(t => t.id === ticketId);
    if (ticketIdx === -1) return null;

    const ticket = tickets[ticketIdx];
    const events = this.getCalendarEvents();
    const eventIdx = events.findIndex(e => e.id === ticket.eventId);
    const targetEvent = eventIdx !== -1 ? events[eventIdx] : null;

    const delta = newQuantity - ticket.quantity;

    if (targetEvent) {
      const currentSold = targetEvent.ticketsSold || 0;
      const totalCapacity = targetEvent.totalCapacity || 400;
      if (delta > 0 && currentSold + delta > totalCapacity) {
        const available = Math.max(0, totalCapacity - currentSold);
        throw new Error(`Cannot add ${delta} ticket(s). Only ${available} seat(s) remaining for capacity.`);
      }

      // Update event ticketsSold
      events[eventIdx] = {
        ...targetEvent,
        ticketsSold: Math.max(0, currentSold + delta)
      };
      this.saveCalendarEvents(events);
    }

    // Update ticket record
    const updatedTicket: EventTicketPurchase = {
      ...ticket,
      quantity: newQuantity,
      totalAmount: ticket.unitPrice * newQuantity
    };

    tickets[ticketIdx] = updatedTicket;
    this.saveEventTicketPurchases(tickets);
    return updatedTicket;
  },

  deleteEventTicket(id: string): boolean {
    const tickets = this.getEventTicketPurchases();
    const filtered = tickets.filter(t => t.id !== id);
    if (filtered.length === tickets.length) return false;
    this.saveEventTicketPurchases(filtered);
    return true;
  },

  // Parents Communications
  getParentCommunications(): ParentCommunication[] {
    return getFromStorage<ParentCommunication[]>(KEYS.PARENT_COMMUNICATIONS, INITIAL_PARENT_COMMUNICATIONS);
  },

  saveParentCommunications(comms: ParentCommunication[]): void {
    setToStorage(KEYS.PARENT_COMMUNICATIONS, comms);
  },

  addParentCommunication(comm: Omit<ParentCommunication, 'id'>): ParentCommunication {
    const comms = this.getParentCommunications();
    const newComm: ParentCommunication = {
      ...comm,
      id: `pcom-${Date.now()}`
    };
    comms.unshift(newComm);
    this.saveParentCommunications(comms);
    return newComm;
  },

  // Exam Timetables
  getExamTimetables(): ExamTimetableEntry[] {
    return getFromStorage<ExamTimetableEntry[]>(KEYS.EXAM_TIMETABLE, INITIAL_EXAM_TIMETABLE);
  },

  saveExamTimetables(exams: ExamTimetableEntry[]): void {
    setToStorage(KEYS.EXAM_TIMETABLE, exams);
  },

  addExamTimetableEntry(entry: Omit<ExamTimetableEntry, 'id'>): ExamTimetableEntry {
    const exams = this.getExamTimetables();
    const newEntry: ExamTimetableEntry = {
      ...entry,
      id: `ett-${Date.now()}`
    };
    exams.push(newEntry);
    this.saveExamTimetables(exams);
    return newEntry;
  },

  getAllTimetableSlots(): TimetableSlot[] {
    const stored = getFromStorage<TimetableSlot[]>(KEYS.TIMETABLE, INITIAL_TIMETABLE);
    const existingIds = new Set(stored.map(s => s.id));
    const missing = INITIAL_TIMETABLE.filter(s => !existingIds.has(s.id));
    if (missing.length > 0) {
      const merged = [...stored, ...missing];
      setToStorage(KEYS.TIMETABLE, merged);
      return merged;
    }
    return stored;
  },

  setAllTimetableSlots(slots: TimetableSlot[]): void {
    setToStorage(KEYS.TIMETABLE, slots);
    window.dispatchEvent(new CustomEvent('timetable-updated', { detail: slots }));
  },

  // ========================================================
  // 🔔 BELL SCHEDULE & PERIOD TIMINGS METHODS
  // ========================================================

  getBellSchedule(): BellPeriodDef[] {
    const stored = getFromStorage<BellPeriodDef[]>(KEYS.BELL_SCHEDULE, INITIAL_BELL_SCHEDULE);
    const hasPeriod9Instructional = stored.some(b => b.period === 9 && !b.isBreak);
    const hasPeriod10 = stored.some(b => b.period === 10);
    const hasPeriod11 = stored.some(b => b.period === 11);
    const breakAfter4 = stored.findIndex(b => b.period === 4) < stored.findIndex(b => b.isBreak && b.breakType === 'morning_tea');
    if (!hasPeriod9Instructional || !hasPeriod10 || !hasPeriod11 || !breakAfter4) {
      setToStorage(KEYS.BELL_SCHEDULE, INITIAL_BELL_SCHEDULE);
      return INITIAL_BELL_SCHEDULE;
    }
    return stored;
  },

  saveBellSchedule(schedule: BellPeriodDef[]): void {
    setToStorage(KEYS.BELL_SCHEDULE, schedule);
    window.dispatchEvent(new CustomEvent('bell-schedule-updated', { detail: schedule }));

    // Synchronize timetable slot start and end times to the updated bell timings
    try {
      const allSlots = this.getAllTimetableSlots();
      let hasChanges = false;
      const updatedSlots = allSlots.map(slot => {
        const bell = schedule.find(b => b.period === slot.period);
        if (bell && (slot.startTime !== bell.startTime || slot.endTime !== bell.endTime)) {
          hasChanges = true;
          return {
            ...slot,
            startTime: bell.startTime,
            endTime: bell.endTime
          };
        }
        return slot;
      });

      if (hasChanges) {
        setToStorage(KEYS.TIMETABLE, updatedSlots);
        window.dispatchEvent(new CustomEvent('timetable-updated', { detail: updatedSlots }));
      }
    } catch {
      // Ignore sync error if timetable slots not loaded
    }
  },

  resetBellSchedule(): BellPeriodDef[] {
    setToStorage(KEYS.BELL_SCHEDULE, INITIAL_BELL_SCHEDULE);
    window.dispatchEvent(new CustomEvent('bell-schedule-updated', { detail: INITIAL_BELL_SCHEDULE }));
    return INITIAL_BELL_SCHEDULE;
  },

  getFixedLessonConditions(): FixedLessonCondition[] {
    return getFromStorage<FixedLessonCondition[]>(KEYS.FIXED_LESSON_CONDITIONS, INITIAL_FIXED_LESSON_CONDITIONS);
  },

  saveFixedLessonCondition(condition: FixedLessonCondition): void {
    const list = this.getFixedLessonConditions();
    const idx = list.findIndex(c => c.id === condition.id);
    let updated: FixedLessonCondition[];
    if (idx !== -1) {
      updated = [...list];
      updated[idx] = condition;
    } else {
      updated = [...list, condition];
    }
    setToStorage(KEYS.FIXED_LESSON_CONDITIONS, updated);
    window.dispatchEvent(new CustomEvent('fixed-lessons-updated', { detail: updated }));
  },

  deleteFixedLessonCondition(id: string): void {
    const list = this.getFixedLessonConditions();
    const updated = list.filter(c => c.id !== id);
    setToStorage(KEYS.FIXED_LESSON_CONDITIONS, updated);
    window.dispatchEvent(new CustomEvent('fixed-lessons-updated', { detail: updated }));
  },

  resetFixedLessonConditions(): FixedLessonCondition[] {
    setToStorage(KEYS.FIXED_LESSON_CONDITIONS, INITIAL_FIXED_LESSON_CONDITIONS);
    window.dispatchEvent(new CustomEvent('fixed-lessons-updated', { detail: INITIAL_FIXED_LESSON_CONDITIONS }));
    return INITIAL_FIXED_LESSON_CONDITIONS;
  },

  getSharedFacilities(): SharedResourceFacility[] {
    return getFromStorage<SharedResourceFacility[]>(KEYS.SHARED_RESOURCES, INITIAL_SHARED_FACILITIES);
  },

  // ========================================================
  // SCHOOL SANATORIUM & CLINICAL ATTENDANCE METHODS
  // ========================================================

  getSanatoriumRecords(studentId?: string, grade?: GradeLevel, stream?: StreamName): SanatoriumRecord[] {
    const records = getFromStorage<SanatoriumRecord[]>(KEYS.SANATORIUM_RECORDS, INITIAL_SANATORIUM_RECORDS);
    return records.filter(r => {
      if (studentId && r.studentId !== studentId) return false;
      if (grade !== undefined && r.grade !== grade) return false;
      if (stream !== undefined && r.stream !== stream) return false;
      return true;
    });
  },

  saveSanatoriumRecords(records: SanatoriumRecord[]): void {
    setToStorage(KEYS.SANATORIUM_RECORDS, records);
    window.dispatchEvent(new CustomEvent('sanatorium-records-updated', { detail: records }));
  },

  addSanatoriumRecord(record: SanatoriumRecord): void {
    const records = this.getSanatoriumRecords();
    const updated = [record, ...records];
    this.saveSanatoriumRecords(updated);
  },

  updateSanatoriumRecord(id: string, updates: Partial<SanatoriumRecord>): void {
    const records = this.getSanatoriumRecords();
    const updated = records.map(r => r.id === id ? { ...r, ...updates } : r);
    this.saveSanatoriumRecords(updated);
  },

  deleteSanatoriumRecord(id: string): void {
    const records = this.getSanatoriumRecords();
    const updated = records.filter(r => r.id !== id);
    this.saveSanatoriumRecords(updated);
  },

  // ========================================================
  // 🍱 LEARNER LUNCH ATTENDANCE & MEAL REGISTRY METHODS
  // ========================================================

  getLunchRecords(date?: string, grade?: GradeLevel, stream?: StreamName, studentId?: string): LearnerLunchRecord[] {
    const records = getFromStorage<LearnerLunchRecord[]>(KEYS.LUNCH_RECORDS, INITIAL_LUNCH_RECORDS);
    return records.filter(r => {
      if (date && r.date !== date) return false;
      if (grade !== undefined && r.grade !== grade) return false;
      if (stream !== undefined && r.stream !== stream) return false;
      if (studentId && r.studentId !== studentId) return false;
      return true;
    });
  },

  saveLunchRecord(record: LearnerLunchRecord): void {
    const records = getFromStorage<LearnerLunchRecord[]>(KEYS.LUNCH_RECORDS, INITIAL_LUNCH_RECORDS);
    const idx = records.findIndex(r => r.id === record.id || (r.studentId === record.studentId && r.date === record.date));
    let updated: LearnerLunchRecord[];
    if (idx !== -1) {
      updated = [...records];
      updated[idx] = { ...updated[idx], ...record };
    } else {
      updated = [record, ...records];
    }
    setToStorage(KEYS.LUNCH_RECORDS, updated);
    window.dispatchEvent(new CustomEvent('lunch-records-updated', { detail: updated }));
  },

  batchSaveLunchRecords(newRecords: LearnerLunchRecord[]): void {
    const existing = getFromStorage<LearnerLunchRecord[]>(KEYS.LUNCH_RECORDS, INITIAL_LUNCH_RECORDS);
    const map = new Map<string, LearnerLunchRecord>();
    existing.forEach(r => map.set(`${r.studentId}-${r.date}`, r));
    newRecords.forEach(r => map.set(`${r.studentId}-${r.date}`, r));
    const merged = Array.from(map.values());
    setToStorage(KEYS.LUNCH_RECORDS, merged);
    window.dispatchEvent(new CustomEvent('lunch-records-updated', { detail: merged }));
  },

  markLearnerLunch(
    studentId: string, 
    status: LunchStatus, 
    details?: Partial<LearnerLunchRecord>
  ): LearnerLunchRecord {
    const today = details?.date || new Date().toISOString().split('T')[0];
    const existingList = getFromStorage<LearnerLunchRecord[]>(KEYS.LUNCH_RECORDS, INITIAL_LUNCH_RECORDS);
    const existing = existingList.find(r => r.studentId === studentId && r.date === today);

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let updatedRecord: LearnerLunchRecord;
    if (existing) {
      updatedRecord = {
        ...existing,
        status,
        takenAt: status === 'taken' || status === 'special_diet' ? (details?.takenAt || timeStr) : undefined,
        ...details,
        updatedAt: now.toISOString()
      };
    } else {
      // Find student details
      const user = this.getUsers().find(u => u.id === studentId);
      updatedRecord = {
        id: `lnch-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        studentId,
        studentName: user?.name || details?.studentName || 'Learner',
        admissionNumber: user?.admissionNumber || details?.admissionNumber || 'ADM/2026/001',
        grade: user?.grade || details?.grade || 4,
        stream: user?.stream || details?.stream || 'Dove',
        date: today,
        status,
        takenAt: status === 'taken' || status === 'special_diet' ? (details?.takenAt || timeStr) : undefined,
        mealType: details?.mealType || (status === 'special_diet' ? 'Special Medical Diet' : 'Standard Balanced Hot Meal'),
        dietaryNotes: details?.dietaryNotes || '',
        markedBy: details?.markedBy || 'Class Teacher',
        markedByRole: details?.markedByRole || 'Class Teacher',
        updatedAt: now.toISOString()
      };
    }

    this.saveLunchRecord(updatedRecord);
    return updatedRecord;
  },

  // ========================================================
  // 🚌 SCHOOL TRANSPORT & FLEET TRACKING SYSTEM METHODS
  // ========================================================

  getSchoolBuses(): SchoolBus[] {
    return getFromStorage<SchoolBus[]>(KEYS.TRANSPORT_BUSES, INITIAL_SCHOOL_BUSES);
  },

  saveSchoolBuses(buses: SchoolBus[]): void {
    setToStorage(KEYS.TRANSPORT_BUSES, buses);
    window.dispatchEvent(new CustomEvent('transport-buses-updated', { detail: buses }));
  },

  updateSchoolBus(id: string, updates: Partial<SchoolBus>): void {
    const buses = this.getSchoolBuses();
    const updated = buses.map(b => b.id === id ? { ...b, ...updates } : b);
    this.saveSchoolBuses(updated);
  },

  getTransportRoutes(): TransportRoute[] {
    return getFromStorage<TransportRoute[]>(KEYS.TRANSPORT_ROUTES, INITIAL_TRANSPORT_ROUTES);
  },

  saveTransportRoutes(routes: TransportRoute[]): void {
    setToStorage(KEYS.TRANSPORT_ROUTES, routes);
    window.dispatchEvent(new CustomEvent('transport-routes-updated', { detail: routes }));
  },

  addTransportRoute(route: TransportRoute): void {
    const routes = this.getTransportRoutes();
    const updated = [...routes, route];
    this.saveTransportRoutes(updated);
  },

  updateTransportRoute(id: string, updates: Partial<TransportRoute>): void {
    const routes = this.getTransportRoutes();
    const updated = routes.map(r => r.id === id ? { ...r, ...updates } : r);
    this.saveTransportRoutes(updated);
  },

  getStudentTransportProfiles(studentId?: string, routeId?: string, grade?: GradeLevel): StudentTransportProfile[] {
    const profiles = getFromStorage<StudentTransportProfile[]>(KEYS.TRANSPORT_STUDENTS, INITIAL_STUDENT_TRANSPORT_PROFILES);
    return profiles.filter(p => {
      if (studentId && p.studentId !== studentId) return false;
      if (routeId && p.routeId !== routeId) return false;
      if (grade !== undefined && p.grade !== grade) return false;
      return true;
    });
  },

  saveStudentTransportProfiles(profiles: StudentTransportProfile[]): void {
    setToStorage(KEYS.TRANSPORT_STUDENTS, profiles);
    window.dispatchEvent(new CustomEvent('transport-students-updated', { detail: profiles }));
  },

  addStudentTransportProfile(profile: StudentTransportProfile): void {
    const profiles = this.getStudentTransportProfiles();
    const updated = [profile, ...profiles];
    this.saveStudentTransportProfiles(updated);
  },

  updateStudentTransportProfile(id: string, updates: Partial<StudentTransportProfile>): void {
    const profiles = this.getStudentTransportProfiles();
    const updated = profiles.map(p => p.id === id ? { ...p, ...updates } : p);
    this.saveStudentTransportProfiles(updated);
  },

  deleteStudentTransportProfile(id: string): void {
    const profiles = this.getStudentTransportProfiles();
    const updated = profiles.filter(p => p.id !== id);
    this.saveStudentTransportProfiles(updated);
  },

  getTransportTripRecords(date?: string, tripType?: TripType, routeId?: string, studentId?: string): TransportTripRecord[] {
    const records = getFromStorage<TransportTripRecord[]>(KEYS.TRANSPORT_TRIP_RECORDS, INITIAL_TRANSPORT_TRIP_RECORDS);
    return records.filter(r => {
      if (date && r.date !== date) return false;
      if (tripType && r.tripType !== tripType) return false;
      if (routeId && r.routeId !== routeId) return false;
      if (studentId && r.studentId !== studentId) return false;
      return true;
    });
  },

  saveTransportTripRecords(records: TransportTripRecord[]): void {
    setToStorage(KEYS.TRANSPORT_TRIP_RECORDS, records);
    window.dispatchEvent(new CustomEvent('transport-trip-records-updated', { detail: records }));
  },

  addTransportTripRecord(record: TransportTripRecord): void {
    const records = this.getTransportTripRecords();
    const updated = [record, ...records];
    this.saveTransportTripRecords(updated);
  },

  updateTransportTripRecord(id: string, updates: Partial<TransportTripRecord>): void {
    const records = this.getTransportTripRecords();
    const updated = records.map(r => r.id === id ? { ...r, ...updates } : r);
    this.saveTransportTripRecords(updated);
  },

  getTransportIncidents(): TransportIncident[] {
    return getFromStorage<TransportIncident[]>(KEYS.TRANSPORT_INCIDENTS, INITIAL_TRANSPORT_INCIDENTS);
  },

  saveTransportIncidents(incidents: TransportIncident[]): void {
    setToStorage(KEYS.TRANSPORT_INCIDENTS, incidents);
    window.dispatchEvent(new CustomEvent('transport-incidents-updated', { detail: incidents }));
  },

  addTransportIncident(incident: TransportIncident): void {
    const incidents = this.getTransportIncidents();
    const updated = [incident, ...incidents];
    this.saveTransportIncidents(updated);
  },

  updateTransportIncident(id: string, updates: Partial<TransportIncident>): void {
    const incidents = this.getTransportIncidents();
    const updated = incidents.map(i => i.id === id ? { ...i, ...updates } : i);
    this.saveTransportIncidents(updated);
  },

  getTransportAlerts(): TransportAlert[] {
    return getFromStorage<TransportAlert[]>(KEYS.TRANSPORT_ALERTS, INITIAL_TRANSPORT_ALERTS);
  },

  saveTransportAlerts(alerts: TransportAlert[]): void {
    setToStorage(KEYS.TRANSPORT_ALERTS, alerts);
    window.dispatchEvent(new CustomEvent('transport-alerts-updated', { detail: alerts }));
  },

  addTransportAlert(alert: TransportAlert): void {
    const alerts = this.getTransportAlerts();
    const updated = [alert, ...alerts];
    this.saveTransportAlerts(updated);
  },

  // ========================================================
  // 🎯 CO-CURRICULAR ACTIVITIES & TALENT METHODS
  // ========================================================

  getCoCurricularActivities(): CoCurricularActivity[] {
    return getFromStorage<CoCurricularActivity[]>(KEYS.CO_CURRICULAR_ACTIVITIES, INITIAL_CO_CURRICULAR_ACTIVITIES);
  },

  saveCoCurricularActivities(activities: CoCurricularActivity[]): void {
    setToStorage(KEYS.CO_CURRICULAR_ACTIVITIES, activities);
    window.dispatchEvent(new CustomEvent('cocurricular-activities-updated', { detail: activities }));
  },

  addCoCurricularActivity(activity: CoCurricularActivity): void {
    const activities = this.getCoCurricularActivities();
    const updated = [activity, ...activities];
    this.saveCoCurricularActivities(updated);
  },

  updateCoCurricularActivity(id: string, updates: Partial<CoCurricularActivity>): void {
    const activities = this.getCoCurricularActivities();
    const updated = activities.map(a => a.id === id ? { ...a, ...updates } : a);
    this.saveCoCurricularActivities(updated);
  },

  getLearnerCoCurricularProfiles(): LearnerCoCurricularProfile[] {
    return getFromStorage<LearnerCoCurricularProfile[]>(KEYS.CO_CURRICULAR_PROFILES, INITIAL_LEARNER_CO_CURRICULAR_PROFILES);
  },

  saveLearnerCoCurricularProfiles(profiles: LearnerCoCurricularProfile[]): void {
    setToStorage(KEYS.CO_CURRICULAR_PROFILES, profiles);
    window.dispatchEvent(new CustomEvent('cocurricular-profiles-updated', { detail: profiles }));
  },

  addLearnerCoCurricularProfile(profile: LearnerCoCurricularProfile): void {
    const profiles = this.getLearnerCoCurricularProfiles();
    const updated = [profile, ...profiles];
    this.saveLearnerCoCurricularProfiles(updated);
  },

  updateLearnerCoCurricularProfile(id: string, updates: Partial<LearnerCoCurricularProfile>): void {
    const profiles = this.getLearnerCoCurricularProfiles();
    const updated = profiles.map(p => p.id === id ? { ...p, ...updates } : p);
    this.saveLearnerCoCurricularProfiles(updated);
  },

  deleteLearnerCoCurricularProfile(id: string): void {
    const profiles = this.getLearnerCoCurricularProfiles();
    const updated = profiles.filter(p => p.id !== id);
    this.saveLearnerCoCurricularProfiles(updated);
  },

  getCoCurricularAttendance(): CoCurricularAttendanceRecord[] {
    return getFromStorage<CoCurricularAttendanceRecord[]>(KEYS.CO_CURRICULAR_ATTENDANCE, INITIAL_CO_CURRICULAR_ATTENDANCE);
  },

  saveCoCurricularAttendance(records: CoCurricularAttendanceRecord[]): void {
    setToStorage(KEYS.CO_CURRICULAR_ATTENDANCE, records);
    window.dispatchEvent(new CustomEvent('cocurricular-attendance-updated', { detail: records }));
  },

  addCoCurricularAttendanceRecords(newRecords: CoCurricularAttendanceRecord[]): void {
    const current = this.getCoCurricularAttendance();
    const updated = [...newRecords, ...current];
    this.saveCoCurricularAttendance(updated);
  },

  getCoCurricularCompetitions(): CoCurricularCompetition[] {
    return getFromStorage<CoCurricularCompetition[]>(KEYS.CO_CURRICULAR_COMPETITIONS, INITIAL_CO_CURRICULAR_COMPETITIONS);
  },

  saveCoCurricularCompetitions(competitions: CoCurricularCompetition[]): void {
    setToStorage(KEYS.CO_CURRICULAR_COMPETITIONS, competitions);
    window.dispatchEvent(new CustomEvent('cocurricular-competitions-updated', { detail: competitions }));
  },

  addCoCurricularCompetition(comp: CoCurricularCompetition): void {
    const competitions = this.getCoCurricularCompetitions();
    const updated = [comp, ...competitions];
    this.saveCoCurricularCompetitions(updated);
  },

  updateCoCurricularCompetition(id: string, updates: Partial<CoCurricularCompetition>): void {
    const competitions = this.getCoCurricularCompetitions();
    const updated = competitions.map(c => c.id === id ? { ...c, ...updates } : c);
    this.saveCoCurricularCompetitions(updated);
  },

  getCoCurricularEquipment(): CoCurricularEquipment[] {
    return getFromStorage<CoCurricularEquipment[]>(KEYS.CO_CURRICULAR_EQUIPMENT, INITIAL_CO_CURRICULAR_EQUIPMENT);
  },

  saveCoCurricularEquipment(equipment: CoCurricularEquipment[]): void {
    setToStorage(KEYS.CO_CURRICULAR_EQUIPMENT, equipment);
    window.dispatchEvent(new CustomEvent('cocurricular-equipment-updated', { detail: equipment }));
  },

  addCoCurricularEquipment(item: CoCurricularEquipment): void {
    const equipment = this.getCoCurricularEquipment();
    const updated = [item, ...equipment];
    this.saveCoCurricularEquipment(updated);
  },

  updateCoCurricularEquipment(id: string, updates: Partial<CoCurricularEquipment>): void {
    const equipment = this.getCoCurricularEquipment();
    const updated = equipment.map(e => e.id === id ? { ...e, ...updates } : e);
    this.saveCoCurricularEquipment(updated);
  },

  getCoCurricularTrips(): CoCurricularTrip[] {
    return getFromStorage<CoCurricularTrip[]>(KEYS.CO_CURRICULAR_TRIPS, INITIAL_CO_CURRICULAR_TRIPS);
  },

  saveCoCurricularTrips(trips: CoCurricularTrip[]): void {
    setToStorage(KEYS.CO_CURRICULAR_TRIPS, trips);
    window.dispatchEvent(new CustomEvent('cocurricular-trips-updated', { detail: trips }));
  },

  addCoCurricularTrip(trip: CoCurricularTrip): void {
    const trips = this.getCoCurricularTrips();
    const updated = [trip, ...trips];
    this.saveCoCurricularTrips(updated);
  },

  updateCoCurricularTrip(id: string, updates: Partial<CoCurricularTrip>): void {
    const trips = this.getCoCurricularTrips();
    const updated = trips.map(t => t.id === id ? { ...t, ...updates } : t);
    this.saveCoCurricularTrips(updated);
  },

  getCoCurricularAnnouncements(): CoCurricularAnnouncement[] {
    return getFromStorage<CoCurricularAnnouncement[]>(KEYS.CO_CURRICULAR_ANNOUNCEMENTS, INITIAL_CO_CURRICULAR_ANNOUNCEMENTS);
  },

  saveCoCurricularAnnouncements(announcements: CoCurricularAnnouncement[]): void {
    setToStorage(KEYS.CO_CURRICULAR_ANNOUNCEMENTS, announcements);
    window.dispatchEvent(new CustomEvent('cocurricular-announcements-updated', { detail: announcements }));
  },

  addCoCurricularAnnouncement(announcement: CoCurricularAnnouncement): void {
    const announcements = this.getCoCurricularAnnouncements();
    const updated = [announcement, ...announcements];
    this.saveCoCurricularAnnouncements(updated);
  },

  getCoCurricularBudgets(): CoCurricularBudgetItem[] {
    return getFromStorage<CoCurricularBudgetItem[]>(KEYS.CO_CURRICULAR_BUDGET, INITIAL_CO_CURRICULAR_BUDGET);
  },

  saveCoCurricularBudgets(items: CoCurricularBudgetItem[]): void {
    setToStorage(KEYS.CO_CURRICULAR_BUDGET, items);
    window.dispatchEvent(new CustomEvent('cocurricular-budget-updated', { detail: items }));
  },

  addCoCurricularBudgetItem(item: CoCurricularBudgetItem): void {
    const items = this.getCoCurricularBudgets();
    const updated = [item, ...items];
    this.saveCoCurricularBudgets(updated);
  },

  updateCoCurricularBudgetItem(id: string, updates: Partial<CoCurricularBudgetItem>): void {
    const items = this.getCoCurricularBudgets();
    const updated = items.map(b => b.id === id ? { ...b, ...updates } : b);
    this.saveCoCurricularBudgets(updated);
  },

  // Staff Weekly Duty Rosters
  getStaffDutyRosters(): StaffDutyAssignment[] {
    return getFromStorage<StaffDutyAssignment[]>(KEYS.STAFF_DUTY_ROSTER, INITIAL_STAFF_DUTY_ROSTER);
  },

  saveStaffDutyRosters(rosters: StaffDutyAssignment[]): void {
    setToStorage(KEYS.STAFF_DUTY_ROSTER, rosters);
    window.dispatchEvent(new CustomEvent('staff-duty-rosters-updated', { detail: rosters }));
  },

  addStaffDutyRoster(roster: StaffDutyAssignment): void {
    const rosters = this.getStaffDutyRosters();
    const updated = [roster, ...rosters];
    this.saveStaffDutyRosters(updated);
  },

  updateStaffDutyRoster(id: string, updates: Partial<StaffDutyAssignment>): void {
    const rosters = this.getStaffDutyRosters();
    const updated = rosters.map(r => r.id === id ? { ...r, ...updates } : r);
    this.saveStaffDutyRosters(updated);
  },

  deleteStaffDutyRoster(id: string): void {
    const rosters = this.getStaffDutyRosters();
    const updated = rosters.filter(r => r.id !== id);
    this.saveStaffDutyRosters(updated);
  },

  // Transport Dropoff Verifications (Afternoon Drop-off Parent Consent OTP)
  getDropoffVerifications(): TransportDropoffVerification[] {
    return getFromStorage<TransportDropoffVerification[]>(KEYS.DROPOFF_VERIFICATIONS, INITIAL_DROPOFF_VERIFICATIONS);
  },

  saveDropoffVerifications(verifs: TransportDropoffVerification[]): void {
    setToStorage(KEYS.DROPOFF_VERIFICATIONS, verifs);
    window.dispatchEvent(new CustomEvent('dropoff-verifications-updated', { detail: verifs }));
  },

  addDropoffVerification(verif: TransportDropoffVerification): void {
    const verifs = this.getDropoffVerifications();
    // Replace any existing pending verification for this student or add new
    const filtered = verifs.filter(v => !(v.studentId === verif.studentId && v.status === 'pending_code'));
    const updated = [verif, ...filtered];
    this.saveDropoffVerifications(updated);
  },

  updateDropoffVerification(id: string, updates: Partial<TransportDropoffVerification>): void {
    const verifs = this.getDropoffVerifications();
    const updated = verifs.map(v => v.id === id ? { ...v, ...updates } : v);
    this.saveDropoffVerifications(updated);
  },

  // ========================================================
  // CBC ASSESSMENT RECORDS & WHOLE GRADE RESULTS
  // ========================================================
  getAssessmentRecords(filter?: { grade?: GradeLevel; term?: 1 | 2 | 3; cycle?: AssessmentCycle; studentId?: string; isPublished?: boolean }): StudentAssessmentRecord[] {
    let records = getFromStorage<StudentAssessmentRecord[]>(KEYS.ASSESSMENT_RECORDS, INITIAL_ASSESSMENT_RECORDS);
    if (!filter) return records;
    if (filter.grade !== undefined) records = records.filter(r => r.grade === filter.grade);
    if (filter.term !== undefined) records = records.filter(r => r.term === filter.term);
    if (filter.cycle !== undefined) records = records.filter(r => r.assessmentCycle === filter.cycle);
    if (filter.studentId !== undefined) records = records.filter(r => r.studentId === filter.studentId);
    if (filter.isPublished !== undefined) records = records.filter(r => r.deanPublished === filter.isPublished);
    return records;
  },

  saveAssessmentRecord(record: StudentAssessmentRecord): void {
    const records = getFromStorage<StudentAssessmentRecord[]>(KEYS.ASSESSMENT_RECORDS, INITIAL_ASSESSMENT_RECORDS);
    const index = records.findIndex(r => r.id === record.id);
    if (index >= 0) {
      records[index] = record;
    } else {
      records.unshift(record);
    }
    setToStorage(KEYS.ASSESSMENT_RECORDS, records);
    window.dispatchEvent(new CustomEvent('assessment-records-updated', { detail: records }));
  },

  saveGradeAssessmentRecords(recordsToSave: StudentAssessmentRecord[]): void {
    const allRecords = getFromStorage<StudentAssessmentRecord[]>(KEYS.ASSESSMENT_RECORDS, INITIAL_ASSESSMENT_RECORDS);
    for (const rec of recordsToSave) {
      const idx = allRecords.findIndex(r => r.id === rec.id || (r.studentId === rec.studentId && r.grade === rec.grade && r.term === rec.term && r.assessmentCycle === rec.assessmentCycle));
      if (idx >= 0) {
        allRecords[idx] = rec;
      } else {
        allRecords.unshift(rec);
      }
    }
    setToStorage(KEYS.ASSESSMENT_RECORDS, allRecords);
    window.dispatchEvent(new CustomEvent('assessment-records-updated', { detail: allRecords }));
  },

  publishGradeAssessments(grade: GradeLevel, cycle: AssessmentCycle, term: 1 | 2 | 3, published: boolean, publishedBy: string): void {
    const allRecords = getFromStorage<StudentAssessmentRecord[]>(KEYS.ASSESSMENT_RECORDS, INITIAL_ASSESSMENT_RECORDS);
    const updated = allRecords.map(r => {
      if (r.grade === grade && r.assessmentCycle === cycle && r.term === term) {
        return {
          ...r,
          deanPublished: published,
          publishedAt: published ? new Date().toISOString().replace('T', ' ').slice(0, 16) : undefined,
          publishedBy: published ? publishedBy : undefined
        };
      }
      return r;
    });
    setToStorage(KEYS.ASSESSMENT_RECORDS, updated);
    window.dispatchEvent(new CustomEvent('assessment-records-updated', { detail: updated }));
  },

  deleteAssessmentRecord(id: string): void {
    const allRecords = getFromStorage<StudentAssessmentRecord[]>(KEYS.ASSESSMENT_RECORDS, INITIAL_ASSESSMENT_RECORDS);
    const filtered = allRecords.filter(r => r.id !== id);
    setToStorage(KEYS.ASSESSMENT_RECORDS, filtered);
    window.dispatchEvent(new CustomEvent('assessment-records-updated', { detail: filtered }));
  },

  // ========================================================
  // TEACHER RESULT UPLOAD ASSIGNMENTS
  // ========================================================
  getTeacherUploadAssignments(teacherId?: string): TeacherResultUploadAssignment[] {
    const assignments = getFromStorage<TeacherResultUploadAssignment[]>(KEYS.TEACHER_UPLOAD_ASSIGNMENTS, INITIAL_TEACHER_UPLOAD_ASSIGNMENTS);
    if (teacherId) {
      return assignments.filter(a => a.teacherId === teacherId);
    }
    return assignments;
  },

  saveTeacherUploadAssignment(assignment: TeacherResultUploadAssignment): void {
    const assignments = this.getTeacherUploadAssignments();
    const idx = assignments.findIndex(a => a.id === assignment.id);
    if (idx >= 0) {
      assignments[idx] = assignment;
    } else {
      assignments.unshift(assignment);
    }
    setToStorage(KEYS.TEACHER_UPLOAD_ASSIGNMENTS, assignments);
    window.dispatchEvent(new CustomEvent('teacher-assignments-updated', { detail: assignments }));
  },

  updateTeacherUploadAssignment(id: string, updates: Partial<TeacherResultUploadAssignment>): void {
    const assignments = this.getTeacherUploadAssignments();
    const idx = assignments.findIndex(a => a.id === id);
    if (idx >= 0) {
      assignments[idx] = { ...assignments[idx], ...updates };
      setToStorage(KEYS.TEACHER_UPLOAD_ASSIGNMENTS, assignments);
      window.dispatchEvent(new CustomEvent('teacher-assignments-updated', { detail: assignments }));
    }
  },

  deleteTeacherUploadAssignment(id: string): void {
    const assignments = this.getTeacherUploadAssignments();
    const filtered = assignments.filter(a => a.id !== id);
    setToStorage(KEYS.TEACHER_UPLOAD_ASSIGNMENTS, filtered);
    window.dispatchEvent(new CustomEvent('teacher-assignments-updated', { detail: filtered }));
  },

  // ========================================================
  // 💻 COMPUTER LAB: CODING CHALLENGES
  // ========================================================
  getCodingChallenges(grade?: GradeLevel): CodingChallenge[] {
    const list = getFromStorage<CodingChallenge[]>(KEYS.CODING_CHALLENGES, INITIAL_CODING_CHALLENGES);
    if (grade) {
      return list.filter(c => c.grade === grade || c.stream === 'ALL');
    }
    return list;
  },

  saveCodingChallenges(challenges: CodingChallenge[]): void {
    setToStorage(KEYS.CODING_CHALLENGES, challenges);
    window.dispatchEvent(new CustomEvent('coding-challenges-updated', { detail: challenges }));
  },

  addCodingChallenge(challenge: CodingChallenge): void {
    const challenges = this.getCodingChallenges();
    challenges.unshift(challenge);
    this.saveCodingChallenges(challenges);
  },

  updateCodingChallenge(id: string, updates: Partial<CodingChallenge>): void {
    const challenges = this.getCodingChallenges();
    const idx = challenges.findIndex(c => c.id === id);
    if (idx >= 0) {
      challenges[idx] = { ...challenges[idx], ...updates };
      this.saveCodingChallenges(challenges);
    }
  },

  deleteCodingChallenge(id: string): void {
    const challenges = this.getCodingChallenges();
    const filtered = challenges.filter(c => c.id !== id);
    this.saveCodingChallenges(filtered);
  },

  // ========================================================
  // 🏆 LEARNER QUIZ PARTICIPATION & STREAKS ENGINE
  // ========================================================
  getLearnerStreakInfo(studentId: string): LearnerStreakInfo {
    const attempts = this.getQuizAttempts(studentId);
    const todayStr = new Date().toISOString().split('T')[0];

    const attemptDates = Array.from(new Set(attempts.map(a => a.completedAt.split('T')[0]))).sort().reverse();
    const streakActiveToday = attemptDates.includes(todayStr);

    let currentStreakDays = 0;
    const checkDate = new Date();
    if (!streakActiveToday) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    for (let i = 0; i < 60; i++) {
      const dStr = checkDate.toISOString().split('T')[0];
      if (attemptDates.includes(dStr)) {
        currentStreakDays++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    if (currentStreakDays === 0 && attempts.length > 0) {
      currentStreakDays = Math.min(attempts.length, 5);
    } else if (currentStreakDays === 0) {
      currentStreakDays = 3;
    }

    const longestStreakDays = Math.max(currentStreakDays + 4, 12);
    const lastQuizDate = attempts.length > 0 ? attempts[0].completedAt : `${todayStr}T09:30:00Z`;
    const multiplier = currentStreakDays >= 14 ? 2.5 : currentStreakDays >= 7 ? 2.0 : currentStreakDays >= 3 ? 1.5 : 1.0;
    const totalQuizzesCompleted = attempts.length > 0 ? attempts.length : 8;
    const avgScore = attempts.length > 0 
      ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length)
      : 86;

    let currentTier: LearnerStreakInfo['currentTier'] = 'Bronze Explorer';
    let nextTier = 'Silver Coder';
    let progressToNextTierPercent = 65;
    let pointsToNextTier = 45;

    if (totalQuizzesCompleted < 5) {
      currentTier = 'Novice';
      nextTier = 'Bronze Explorer';
      progressToNextTierPercent = Math.round((totalQuizzesCompleted / 5) * 100);
      pointsToNextTier = (5 - totalQuizzesCompleted) * 20;
    } else if (totalQuizzesCompleted < 10) {
      currentTier = 'Bronze Explorer';
      nextTier = 'Silver Coder';
      progressToNextTierPercent = Math.round(((totalQuizzesCompleted - 5) / 5) * 100);
      pointsToNextTier = (10 - totalQuizzesCompleted) * 25;
    } else if (totalQuizzesCompleted < 25) {
      currentTier = 'Silver Coder';
      nextTier = 'Gold Scholar';
      progressToNextTierPercent = Math.round(((totalQuizzesCompleted - 10) / 15) * 100);
      pointsToNextTier = (25 - totalQuizzesCompleted) * 30;
    } else if (totalQuizzesCompleted < 50) {
      currentTier = 'Gold Scholar';
      nextTier = 'Diamond Master';
      progressToNextTierPercent = Math.round(((totalQuizzesCompleted - 25) / 25) * 100);
      pointsToNextTier = (50 - totalQuizzesCompleted) * 40;
    } else {
      currentTier = 'Diamond Master';
      nextTier = 'Grandmaster Trailblazer';
      progressToNextTierPercent = 92;
      pointsToNextTier = 120;
    }

    const milestones: StreakMilestone[] = [
      {
        id: 'ms-streak-3',
        title: 'Ignition Spark',
        target: 3,
        current: currentStreakDays,
        unit: 'Days Streak',
        achieved: currentStreakDays >= 3,
        badgeReward: 'Spark Initiate (+50 BP)',
        icon: 'Flame',
        tierColor: 'from-amber-400 to-orange-500',
        description: 'Complete quizzes for 3 consecutive days.'
      },
      {
        id: 'ms-streak-7',
        title: 'Weekly Champion',
        target: 7,
        current: currentStreakDays,
        unit: 'Days Streak',
        achieved: currentStreakDays >= 7,
        badgeReward: '7-Day Marathoner (+150 BP)',
        icon: 'Trophy',
        tierColor: 'from-orange-500 to-rose-600',
        description: 'Maintain an unbroken 7-day daily quiz rhythm.'
      },
      {
        id: 'ms-quiz-count',
        title: 'Academic Volume Builder',
        target: 15,
        current: totalQuizzesCompleted,
        unit: 'Quizzes Completed',
        achieved: totalQuizzesCompleted >= 15,
        badgeReward: 'Centurion Scholar (+200 BP)',
        icon: 'BookOpen',
        tierColor: 'from-blue-500 to-indigo-600',
        description: 'Take and submit 15 CBC curriculum quizzes.'
      },
      {
        id: 'ms-high-score',
        title: 'Precision Marksman',
        target: 3,
        current: attempts.filter(a => a.percentage >= 85).length || 2,
        unit: 'Distinctions (≥85%)',
        achieved: (attempts.filter(a => a.percentage >= 85).length || 2) >= 3,
        badgeReward: 'Mastery Gold (+250 BP)',
        icon: 'Award',
        tierColor: 'from-emerald-500 to-teal-600',
        description: 'Achieve at least 85% on 3 separate topical assessments.'
      },
      {
        id: 'ms-streak-14',
        title: 'Unstoppable Momentum',
        target: 14,
        current: currentStreakDays,
        unit: 'Days Streak',
        achieved: currentStreakDays >= 14,
        badgeReward: 'Grandmaster Trailblazer (+500 BP)',
        icon: 'Zap',
        tierColor: 'from-purple-600 to-pink-600',
        description: 'Conquer two full weeks of continuous academic mastery.'
      }
    ];

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const now = new Date();
    const currDay = now.getDay();
    const mondayOffset = currDay === 0 ? -6 : 1 - currDay;
    const weeklyActivity = dayNames.map((dayName, idx) => {
      const d = new Date(now);
      d.setDate(now.getDate() + mondayOffset + idx);
      const dStr = d.toISOString().split('T')[0];
      const count = attempts.filter(a => a.completedAt.startsWith(dStr)).length;
      const isPastOrToday = d <= now;
      return {
        day: dayName,
        date: dStr,
        completed: count > 0 || (isPastOrToday && (idx % 2 === 0 || idx === 1)),
        quizzesCount: count || (isPastOrToday ? (idx % 2 === 0 ? 1 : 2) : 0)
      };
    });

    return {
      currentStreakDays,
      longestStreakDays,
      lastQuizDate,
      streakActiveToday,
      multiplier,
      freezeShieldsAvailable: 2,
      totalQuizzesCompleted,
      averageQuizScore: avgScore,
      currentTier,
      nextTier,
      progressToNextTierPercent,
      pointsToNextTier,
      milestones,
      weeklyActivity
    };
  },

  // Bonus Points (BP) alias
  getTotalBP(): number {
    return this.getTotalXP();
  },

  // ========================================================
  // 1. DOCUMENT SUBMISSION REQUESTS & SUBMISSIONS
  // ========================================================
  getDocumentRequests(): DocumentSubmissionRequest[] {
    return getFromStorage<DocumentSubmissionRequest[]>(KEYS.DOCUMENT_REQUESTS, INITIAL_DOCUMENT_REQUESTS);
  },

  saveDocumentRequests(requests: DocumentSubmissionRequest[]): void {
    setToStorage(KEYS.DOCUMENT_REQUESTS, requests);
    window.dispatchEvent(new CustomEvent('document-requests-updated', { detail: requests }));
  },

  addDocumentRequest(request: DocumentSubmissionRequest): void {
    const list = this.getDocumentRequests();
    const updated = [request, ...list];
    this.saveDocumentRequests(updated);
  },

  updateDocumentRequest(id: string, updates: Partial<DocumentSubmissionRequest>): void {
    const list = this.getDocumentRequests();
    const idx = list.findIndex(r => r.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      this.saveDocumentRequests(list);
    }
  },

  deleteDocumentRequest(id: string): void {
    const list = this.getDocumentRequests();
    const filtered = list.filter(r => r.id !== id);
    this.saveDocumentRequests(filtered);
  },

  getDocumentSubmissions(requestId?: string): DocumentSubmission[] {
    const list = getFromStorage<DocumentSubmission[]>(KEYS.DOCUMENT_SUBMISSIONS, INITIAL_DOCUMENT_SUBMISSIONS);
    if (requestId) {
      return list.filter(s => s.requestId === requestId);
    }
    return list;
  },

  saveDocumentSubmissions(submissions: DocumentSubmission[]): void {
    setToStorage(KEYS.DOCUMENT_SUBMISSIONS, submissions);
    window.dispatchEvent(new CustomEvent('document-submissions-updated', { detail: submissions }));
  },

  addDocumentSubmission(submission: DocumentSubmission): void {
    const list = this.getDocumentSubmissions();
    const updated = [submission, ...list];
    this.saveDocumentSubmissions(updated);
  },

  updateDocumentSubmission(id: string, updates: Partial<DocumentSubmission>): void {
    const list = this.getDocumentSubmissions();
    const idx = list.findIndex(s => s.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      this.saveDocumentSubmissions(list);
    }
  },

  // ========================================================
  // 2. POST CATEGORIES & TAXONOMY
  // ========================================================
  getPostCategories(): PostCategory[] {
    return getFromStorage<PostCategory[]>(KEYS.POST_CATEGORIES, INITIAL_POST_CATEGORIES);
  },

  savePostCategories(categories: PostCategory[]): void {
    setToStorage(KEYS.POST_CATEGORIES, categories);
    window.dispatchEvent(new CustomEvent('post-categories-updated', { detail: categories }));
  },

  addPostCategory(category: PostCategory): void {
    const list = this.getPostCategories();
    const updated = [...list, category];
    this.savePostCategories(updated);
  },

  updatePostCategory(id: string, updates: Partial<PostCategory>): void {
    const list = this.getPostCategories();
    const idx = list.findIndex(c => c.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      this.savePostCategories(list);
    }
  },

  deletePostCategory(id: string): void {
    const list = this.getPostCategories();
    const filtered = list.filter(c => c.id !== id);
    this.savePostCategories(filtered);
  },

  // ========================================================
  // 3. PORTAL SECTIONS MANAGEMENT
  // ========================================================
  getPortalSections(): PortalSection[] {
    return getFromStorage<PortalSection[]>(KEYS.PORTAL_SECTIONS, INITIAL_PORTAL_SECTIONS);
  },

  savePortalSections(sections: PortalSection[]): void {
    setToStorage(KEYS.PORTAL_SECTIONS, sections);
    window.dispatchEvent(new CustomEvent('portal-sections-updated', { detail: sections }));
  },

  addPortalSection(section: PortalSection): void {
    const list = this.getPortalSections();
    const updated = [...list, section];
    this.savePortalSections(updated);
  },

  updatePortalSection(id: string, updates: Partial<PortalSection>): void {
    const list = this.getPortalSections();
    const idx = list.findIndex(s => s.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      this.savePortalSections(list);
    }
  },

  deletePortalSection(id: string): void {
    const list = this.getPortalSections();
    const filtered = list.filter(s => s.id !== id);
    this.savePortalSections(filtered);
  },

  // ========================================================
  // 4. ANNOUNCEMENT EDIT & DELETE (DELEGATED & CMS)
  // ========================================================
  updateAnnouncement(id: string, updates: Partial<Announcement>): void {
    const list = this.getAnnouncements();
    const idx = list.findIndex(a => a.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      setToStorage(KEYS.ANNOUNCEMENTS, list);
      window.dispatchEvent(new CustomEvent('announcements-updated', { detail: list }));
    }
  },

  deleteAnnouncement(id: string): void {
    const list = this.getAnnouncements();
    const filtered = list.filter(a => a.id !== id);
    setToStorage(KEYS.ANNOUNCEMENTS, filtered);
    window.dispatchEvent(new CustomEvent('announcements-updated', { detail: filtered }));
  },

  // ========================================================
  // 5. ASSIGN EXTRA ROLES SEPARATELY BY ADMINISTRATOR
  // ========================================================
  assignExtraRolesToUser(
    userId: string,
    extraRoles: ExtraAdminRoleType[],
    scopes?: {
      documentRequestScope?: User['documentRequestScope'];
      delegatedPostEditorScope?: User['delegatedPostEditorScope'];
      doubleAccessConfig?: User['doubleAccessConfig'];
      customPermissions?: Partial<RoleAccessRights>;
    }
  ): User | null {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return null;

    users[idx] = {
      ...users[idx],
      extraRoles,
      documentRequestScope: scopes?.documentRequestScope ?? users[idx].documentRequestScope,
      delegatedPostEditorScope: scopes?.delegatedPostEditorScope ?? users[idx].delegatedPostEditorScope,
      doubleAccessConfig: scopes?.doubleAccessConfig ?? users[idx].doubleAccessConfig,
      customPermissions: scopes?.customPermissions ? { ...users[idx].customPermissions, ...scopes.customPermissions } : users[idx].customPermissions,
    };

    setToStorage(KEYS.USERS, users);
    window.dispatchEvent(new CustomEvent('users-updated', { detail: users }));
    return users[idx];
  },

  // ========================================================
  // 6. CBA TASK MAPPING & CURRICULUM ALIGNMENT
  // ========================================================
  getCBATaskMappings(): CBATaskMapping[] {
    return getFromStorage<CBATaskMapping[]>(KEYS.CBA_TASK_MAPPINGS, INITIAL_CBA_TASK_MAPPINGS);
  },

  saveCBATaskMappings(mappings: CBATaskMapping[]): void {
    setToStorage(KEYS.CBA_TASK_MAPPINGS, mappings);
    window.dispatchEvent(new CustomEvent('cba-task-mappings-updated', { detail: mappings }));
  },

  addCBATaskMapping(mapping: CBATaskMapping): CBATaskMapping {
    const list = this.getCBATaskMappings();
    const updated = [mapping, ...list];
    this.saveCBATaskMappings(updated);
    return mapping;
  },

  updateCBATaskMapping(id: string, updates: Partial<CBATaskMapping>): CBATaskMapping | null {
    const list = this.getCBATaskMappings();
    const idx = list.findIndex(m => m.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
    this.saveCBATaskMappings(list);
    return list[idx];
  },

  deleteCBATaskMapping(id: string): void {
    const list = this.getCBATaskMappings();
    const updated = list.filter(m => m.id !== id);
    this.saveCBATaskMappings(updated);
  },

  verifyCBATaskMapping(id: string, verifiedBy: string, notes?: string, alignmentScore?: number): CBATaskMapping | null {
    const list = this.getCBATaskMappings();
    const idx = list.findIndex(m => m.id === id);
    if (idx === -1) return null;
    list[idx] = {
      ...list[idx],
      alignmentStatus: 'verified',
      alignmentScore: alignmentScore !== undefined ? alignmentScore : (list[idx].alignmentScore || 95),
      lastVerifiedBy: verifiedBy,
      lastVerifiedAt: new Date().toISOString(),
      coordinatorNotes: notes || list[idx].coordinatorNotes,
      updatedAt: new Date().toISOString()
    };
    this.saveCBATaskMappings(list);
    return list[idx];
  },

  addCommentToCBATaskMapping(mappingId: string, commentData: { author: string; authorRole: string; comment: string }): CBATaskMapping | null {
    const list = this.getCBATaskMappings();
    const idx = list.findIndex(m => m.id === mappingId);
    if (idx === -1) return null;
    const newComment = {
      id: `comm-cba-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      author: commentData.author,
      authorRole: commentData.authorRole,
      comment: commentData.comment,
      createdAt: new Date().toISOString()
    };
    list[idx] = {
      ...list[idx],
      comments: [...(list[idx].comments || []), newComment],
      coordinatorNotes: commentData.comment,
      updatedAt: new Date().toISOString()
    };
    this.saveCBATaskMappings(list);
    return list[idx];
  },

  removeCommentFromCBATaskMapping(mappingId: string, commentId: string): CBATaskMapping | null {
    const list = this.getCBATaskMappings();
    const idx = list.findIndex(m => m.id === mappingId);
    if (idx === -1) return null;
    list[idx] = {
      ...list[idx],
      comments: (list[idx].comments || []).filter(c => c.id !== commentId),
      updatedAt: new Date().toISOString()
    };
    this.saveCBATaskMappings(list);
    return list[idx];
  },

  // ========================================================
  // 7. STAFF PERFORMANCE APPRAISAL & DEVELOPMENT (TSC TPAD)
  // ========================================================
  getStaffAppraisals(): StaffAppraisalRecord[] {
    return getFromStorage<StaffAppraisalRecord[]>(KEYS.STAFF_APPRAISALS, INITIAL_STAFF_APPRAISALS);
  },

  saveStaffAppraisals(appraisals: StaffAppraisalRecord[]): void {
    setToStorage(KEYS.STAFF_APPRAISALS, appraisals);
    window.dispatchEvent(new CustomEvent('staff-appraisals-updated', { detail: appraisals }));
  },

  addStaffAppraisal(appraisal: StaffAppraisalRecord): StaffAppraisalRecord {
    const list = this.getStaffAppraisals();
    const updated = [appraisal, ...list];
    this.saveStaffAppraisals(updated);
    return appraisal;
  },

  updateStaffAppraisal(id: string, updates: Partial<StaffAppraisalRecord>): StaffAppraisalRecord | null {
    const list = this.getStaffAppraisals();
    const idx = list.findIndex(a => a.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
    this.saveStaffAppraisals(list);
    return list[idx];
  },

  countersignStaffAppraisal(id: string, countersignedBy: string, remarks?: string): StaffAppraisalRecord | null {
    const list = this.getStaffAppraisals();
    const idx = list.findIndex(a => a.id === id);
    if (idx === -1) return null;
    list[idx] = {
      ...list[idx],
      status: 'countersigned',
      countersigningOfficerName: countersignedBy,
      countersigningRemarks: remarks || list[idx].countersigningRemarks || 'Appraisal verified and ratified by Executive Headship.',
      countersignedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.saveStaffAppraisals(list);
    return list[idx];
  },

  deleteStaffAppraisal(id: string): void {
    const list = this.getStaffAppraisals();
    const updated = list.filter(a => a.id !== id);
    this.saveStaffAppraisals(updated);
  },

  // ========================================================
  // 8. CURRICULUM WRITTEN REPORTS & QUALITATIVE COMMENTS
  // ========================================================
  getCurriculumWrittenReports(): CurriculumWrittenReport[] {
    return getFromStorage<CurriculumWrittenReport[]>(KEYS.CURRICULUM_WRITTEN_REPORTS, INITIAL_CURRICULUM_WRITTEN_REPORTS);
  },

  saveCurriculumWrittenReports(reports: CurriculumWrittenReport[]): void {
    setToStorage(KEYS.CURRICULUM_WRITTEN_REPORTS, reports);
    window.dispatchEvent(new CustomEvent('curriculum-written-reports-updated', { detail: reports }));
  },

  addCurriculumWrittenReport(report: CurriculumWrittenReport): CurriculumWrittenReport {
    const list = this.getCurriculumWrittenReports();
    const updated = [report, ...list];
    this.saveCurriculumWrittenReports(updated);
    return report;
  },

  updateCurriculumWrittenReport(id: string, updates: Partial<CurriculumWrittenReport>): CurriculumWrittenReport | null {
    const list = this.getCurriculumWrittenReports();
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
    this.saveCurriculumWrittenReports(list);
    return list[idx];
  },

  deleteCurriculumWrittenReport(id: string): void {
    const list = this.getCurriculumWrittenReports();
    const updated = list.filter(r => r.id !== id);
    this.saveCurriculumWrittenReports(updated);
  },

  addCommentToCurriculumReport(reportId: string, commentData: { author: string; authorRole: string; comment: string }): CurriculumWrittenReport | null {
    const list = this.getCurriculumWrittenReports();
    const idx = list.findIndex(r => r.id === reportId);
    if (idx === -1) return null;

    const newComment = {
      id: `comm-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      author: commentData.author,
      authorRole: commentData.authorRole,
      comment: commentData.comment,
      createdAt: new Date().toISOString()
    };

    list[idx] = {
      ...list[idx],
      qualitativeComments: [...(list[idx].qualitativeComments || []), newComment],
      updatedAt: new Date().toISOString()
    };

    this.saveCurriculumWrittenReports(list);
    return list[idx];
  },

  removeCommentFromCurriculumReport(reportId: string, commentId: string): CurriculumWrittenReport | null {
    const list = this.getCurriculumWrittenReports();
    const idx = list.findIndex(r => r.id === reportId);
    if (idx === -1) return null;

    list[idx] = {
      ...list[idx],
      qualitativeComments: (list[idx].qualitativeComments || []).filter(c => c.id !== commentId),
      updatedAt: new Date().toISOString()
    };

    this.saveCurriculumWrittenReports(list);
    return list[idx];
  },

  editCommentInCurriculumReport(reportId: string, commentId: string, newCommentText: string): CurriculumWrittenReport | null {
    const list = this.getCurriculumWrittenReports();
    const idx = list.findIndex(r => r.id === reportId);
    if (idx === -1) return null;

    list[idx] = {
      ...list[idx],
      qualitativeComments: (list[idx].qualitativeComments || []).map(c => 
        c.id === commentId ? { ...c, comment: newCommentText } : c
      ),
      updatedAt: new Date().toISOString()
    };

    this.saveCurriculumWrittenReports(list);
    return list[idx];
  },

  // ========================================================
  // 9. COORDINATOR SCHEMES OF WORK & PEDAGOGICAL VERIFICATION
  // ========================================================
  getCoordinatorSchemesOfWork(): CoordinatorSchemeOfWork[] {
    return getFromStorage<CoordinatorSchemeOfWork[]>(KEYS.COORDINATOR_SCHEMES_OF_WORK, INITIAL_COORDINATOR_SCHEMES_OF_WORK);
  },

  saveCoordinatorSchemesOfWork(schemes: CoordinatorSchemeOfWork[]): void {
    setToStorage(KEYS.COORDINATOR_SCHEMES_OF_WORK, schemes);
    window.dispatchEvent(new CustomEvent('coordinator-schemes-updated', { detail: schemes }));
  },

  addCoordinatorSchemeOfWork(scheme: CoordinatorSchemeOfWork): CoordinatorSchemeOfWork {
    const list = this.getCoordinatorSchemesOfWork();
    const updated = [scheme, ...list];
    this.saveCoordinatorSchemesOfWork(updated);
    return scheme;
  },

  updateCoordinatorSchemeOfWork(id: string, updates: Partial<CoordinatorSchemeOfWork>): CoordinatorSchemeOfWork | null {
    const list = this.getCoordinatorSchemesOfWork();
    const idx = list.findIndex(s => s.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
    this.saveCoordinatorSchemesOfWork(list);
    return list[idx];
  },

  deleteCoordinatorSchemeOfWork(id: string): void {
    const list = this.getCoordinatorSchemesOfWork();
    const updated = list.filter(s => s.id !== id);
    this.saveCoordinatorSchemesOfWork(updated);
  },

  addCommentToCoordinatorScheme(schemeId: string, commentData: { author: string; authorRole: string; comment: string }): CoordinatorSchemeOfWork | null {
    const list = this.getCoordinatorSchemesOfWork();
    const idx = list.findIndex(s => s.id === schemeId);
    if (idx === -1) return null;
    const newComment = {
      id: `comm-sch-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      author: commentData.author,
      authorRole: commentData.authorRole,
      comment: commentData.comment,
      createdAt: new Date().toISOString()
    };
    list[idx] = {
      ...list[idx],
      comments: [...(list[idx].comments || []), newComment],
      updatedAt: new Date().toISOString()
    };
    this.saveCoordinatorSchemesOfWork(list);
    return list[idx];
  },

  removeCommentFromCoordinatorScheme(schemeId: string, commentId: string): CoordinatorSchemeOfWork | null {
    const list = this.getCoordinatorSchemesOfWork();
    const idx = list.findIndex(s => s.id === schemeId);
    if (idx === -1) return null;
    list[idx] = {
      ...list[idx],
      comments: (list[idx].comments || []).filter(c => c.id !== commentId),
      updatedAt: new Date().toISOString()
    };
    this.saveCoordinatorSchemesOfWork(list);
    return list[idx];
  },

  // ========================================================
  // 10. COORDINATOR SYLLABUS PACING & TOPIC TRACKING
  // ========================================================
  getCoordinatorSyllabusTracking(): CoordinatorSyllabusTopic[] {
    return getFromStorage<CoordinatorSyllabusTopic[]>(KEYS.COORDINATOR_SYLLABUS_TRACKING, INITIAL_COORDINATOR_SYLLABUS_TRACKING);
  },

  saveCoordinatorSyllabusTracking(topics: CoordinatorSyllabusTopic[]): void {
    setToStorage(KEYS.COORDINATOR_SYLLABUS_TRACKING, topics);
    window.dispatchEvent(new CustomEvent('coordinator-syllabus-updated', { detail: topics }));
  },

  addCoordinatorSyllabusTopic(topic: CoordinatorSyllabusTopic): CoordinatorSyllabusTopic {
    const list = this.getCoordinatorSyllabusTracking();
    const updated = [topic, ...list];
    this.saveCoordinatorSyllabusTracking(updated);
    return topic;
  },

  updateCoordinatorSyllabusTopic(id: string, updates: Partial<CoordinatorSyllabusTopic>): CoordinatorSyllabusTopic | null {
    const list = this.getCoordinatorSyllabusTracking();
    const idx = list.findIndex(t => t.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
    this.saveCoordinatorSyllabusTracking(list);
    return list[idx];
  },

  deleteCoordinatorSyllabusTopic(id: string): void {
    const list = this.getCoordinatorSyllabusTracking();
    const updated = list.filter(t => t.id !== id);
    this.saveCoordinatorSyllabusTracking(updated);
  },

  addCommentToCoordinatorSyllabusTopic(topicId: string, commentData: { author: string; authorRole: string; comment: string }): CoordinatorSyllabusTopic | null {
    const list = this.getCoordinatorSyllabusTracking();
    const idx = list.findIndex(t => t.id === topicId);
    if (idx === -1) return null;
    const newComment = {
      id: `comm-syl-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      author: commentData.author,
      authorRole: commentData.authorRole,
      comment: commentData.comment,
      createdAt: new Date().toISOString()
    };
    list[idx] = {
      ...list[idx],
      comments: [...(list[idx].comments || []), newComment],
      coordinatorRemarks: commentData.comment,
      updatedAt: new Date().toISOString()
    };
    this.saveCoordinatorSyllabusTracking(list);
    return list[idx];
  },

  removeCommentFromCoordinatorSyllabusTopic(topicId: string, commentId: string): CoordinatorSyllabusTopic | null {
    const list = this.getCoordinatorSyllabusTracking();
    const idx = list.findIndex(t => t.id === topicId);
    if (idx === -1) return null;
    list[idx] = {
      ...list[idx],
      comments: (list[idx].comments || []).filter(c => c.id !== commentId),
      updatedAt: new Date().toISOString()
    };
    this.saveCoordinatorSyllabusTracking(list);
    return list[idx];
  },

  // ========================================================
  // 11. COORDINATOR CBA MODERATION & ATTAINMENT HARMONIZATION
  // ========================================================
  getCoordinatorCBAModerations(): CoordinatorCBAModeration[] {
    return getFromStorage<CoordinatorCBAModeration[]>(KEYS.COORDINATOR_CBA_MODERATIONS, INITIAL_COORDINATOR_CBA_MODERATIONS);
  },

  saveCoordinatorCBAModerations(records: CoordinatorCBAModeration[]): void {
    setToStorage(KEYS.COORDINATOR_CBA_MODERATIONS, records);
    window.dispatchEvent(new CustomEvent('coordinator-moderations-updated', { detail: records }));
  },

  addCoordinatorCBAModeration(record: CoordinatorCBAModeration): CoordinatorCBAModeration {
    const list = this.getCoordinatorCBAModerations();
    const updated = [record, ...list];
    this.saveCoordinatorCBAModerations(updated);
    return record;
  },

  updateCoordinatorCBAModeration(id: string, updates: Partial<CoordinatorCBAModeration>): CoordinatorCBAModeration | null {
    const list = this.getCoordinatorCBAModerations();
    const idx = list.findIndex(m => m.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
    this.saveCoordinatorCBAModerations(list);
    return list[idx];
  },

  deleteCoordinatorCBAModeration(id: string): void {
    const list = this.getCoordinatorCBAModerations();
    const updated = list.filter(m => m.id !== id);
    this.saveCoordinatorCBAModerations(updated);
  },

  addCommentToCoordinatorCBAModeration(modId: string, commentData: { author: string; authorRole: string; comment: string }): CoordinatorCBAModeration | null {
    const list = this.getCoordinatorCBAModerations();
    const idx = list.findIndex(m => m.id === modId);
    if (idx === -1) return null;
    const newComment = {
      id: `comm-mod-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      author: commentData.author,
      authorRole: commentData.authorRole,
      comment: commentData.comment,
      createdAt: new Date().toISOString()
    };
    list[idx] = {
      ...list[idx],
      comments: [...(list[idx].comments || []), newComment],
      updatedAt: new Date().toISOString()
    };
    this.saveCoordinatorCBAModerations(list);
    return list[idx];
  },

  removeCommentFromCoordinatorCBAModeration(modId: string, commentId: string): CoordinatorCBAModeration | null {
    const list = this.getCoordinatorCBAModerations();
    const idx = list.findIndex(m => m.id === modId);
    if (idx === -1) return null;
    list[idx] = {
      ...list[idx],
      comments: (list[idx].comments || []).filter(c => c.id !== commentId),
      updatedAt: new Date().toISOString()
    };
    this.saveCoordinatorCBAModerations(list);
    return list[idx];
  },

  // ========================================================
  // 12. TEACHER ABSENCE REPORTING & DEAN/DEPUTY RELIEF BOOKING
  // ========================================================

  getTeacherAbsenceReports(): TeacherAbsenceReport[] {
    return getFromStorage<TeacherAbsenceReport[]>(KEYS.TEACHER_ABSENCE_REPORTS, INITIAL_TEACHER_ABSENCE_REPORTS);
  },

  saveTeacherAbsenceReports(reports: TeacherAbsenceReport[]): void {
    setToStorage(KEYS.TEACHER_ABSENCE_REPORTS, reports);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('teacher-absence-reports-updated', { detail: reports }));
    }
  },

  addTeacherAbsenceReport(report: TeacherAbsenceReport): void {
    const list = this.getTeacherAbsenceReports();
    const updated = [report, ...list];
    this.saveTeacherAbsenceReports(updated);

    // Broadcast high-priority notification to Head Teacher, Deputy, Dean, and Senior Teacher
    try {
      const recipientRoles = report.notifiedRoles || ['head_teacher', 'deputy_head', 'dean_of_studies', 'senior_teacher'];
      const users = this.getUsers();
      const targetUsers = users.filter(u => recipientRoles.includes(u.role as any));

      targetUsers.forEach(u => {
        this.addNotification({
          id: `notif-abs-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          targetUserId: u.id,
          targetRole: u.role,
          title: `URGENT: Teacher Absence Report · ${report.teacherName}`,
          message: `${report.teacherName} reported absent (${report.leaveType.replace('_', ' ').toUpperCase()}) from ${report.startDate} to ${report.endDate}. ${report.affectedClasses?.length || 0} classes need relief cover.`,
          category: 'academic',
          urgency: 'urgent',
          linkTab: 'timetable',
          createdAt: new Date().toISOString(),
          readByUserIds: []
        });
      });
    } catch (e) {
      console.warn('Failed to dispatch absence notifications', e);
    }
  },

  updateTeacherAbsenceReport(id: string, updates: Partial<TeacherAbsenceReport>): TeacherAbsenceReport | null {
    const list = this.getTeacherAbsenceReports();
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) return null;
    list[idx] = {
      ...list[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.saveTeacherAbsenceReports(list);
    return list[idx];
  },

  deleteTeacherAbsenceReport(id: string): void {
    const list = this.getTeacherAbsenceReports().filter(r => r.id !== id);
    this.saveTeacherAbsenceReports(list);
  },

  bookReliefTeacher(slotId: string, reliefData: {
    reliefTeacherName: string;
    reliefTeacherEmail?: string;
    bookedBy: string;
    reason?: string;
    instructions?: string;
    absentTeacherName?: string;
  }): TimetableSlot | null {
    const allSlots = this.getAllTimetableSlots();
    const idx = allSlots.findIndex(s => s.id === slotId);
    if (idx === -1) return null;

    const originalSlot = allSlots[idx];
    const updatedSlot: TimetableSlot = {
      ...originalSlot,
      isReliefCover: true,
      reliefTeacherName: reliefData.reliefTeacherName,
      reliefTeacherEmail: reliefData.reliefTeacherEmail,
      reliefBookedBy: reliefData.bookedBy,
      reliefBookedAt: new Date().toISOString(),
      reliefReason: reliefData.reason || 'Colleague absence cover',
      reliefInstructions: reliefData.instructions,
      absentTeacherName: reliefData.absentTeacherName || originalSlot.teacherName
    };

    allSlots[idx] = updatedSlot;
    this.setAllTimetableSlots(allSlots);

    // Notify booked relief teacher
    try {
      const users = this.getUsers();
      const bookedUser = users.find(u => u.name.toLowerCase() === reliefData.reliefTeacherName.toLowerCase());
      if (bookedUser) {
        this.addNotification({
          id: `notif-rel-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          targetUserId: bookedUser.id,
          targetRole: bookedUser.role,
          title: `Relief Lesson Assignment: Grade ${originalSlot.grade} ${originalSlot.stream}`,
          message: `You have been assigned by ${reliefData.bookedBy} to cover ${originalSlot.subject} for Grade ${originalSlot.grade} ${originalSlot.stream} on ${originalSlot.dayOfWeek} Period ${originalSlot.period} (${originalSlot.startTime}–${originalSlot.endTime}) substituting for ${updatedSlot.absentTeacherName}.`,
          category: 'academic',
          urgency: 'high',
          linkTab: 'timetable',
          createdAt: new Date().toISOString(),
          readByUserIds: []
        });
      }
    } catch (e) {
      console.warn('Failed to dispatch relief assignment notification', e);
    }

    // Check if this fulfills an absence report and update status
    try {
      const reports = this.getTeacherAbsenceReports();
      const report = reports.find(r => r.teacherName.toLowerCase() === (updatedSlot.absentTeacherName || '').toLowerCase());
      if (report) {
        this.updateTeacherAbsenceReport(report.id, {
          reliefStatus: 'partially_assigned'
        });
      }
    } catch {}

    return updatedSlot;
  },

  cancelReliefBooking(slotId: string): TimetableSlot | null {
    const allSlots = this.getAllTimetableSlots();
    const idx = allSlots.findIndex(s => s.id === slotId);
    if (idx === -1) return null;

    const updatedSlot: TimetableSlot = {
      ...allSlots[idx],
      isReliefCover: false,
      reliefTeacherName: undefined,
      reliefTeacherEmail: undefined,
      reliefBookedBy: undefined,
      reliefBookedAt: undefined,
      reliefReason: undefined,
      reliefInstructions: undefined,
      absentTeacherName: undefined
    };

    allSlots[idx] = updatedSlot;
    this.setAllTimetableSlots(allSlots);
    return updatedSlot;
  }
};

export const INITIAL_TEACHER_ABSENCE_REPORTS: TeacherAbsenceReport[] = [
  {
    id: 'abs-rep-01',
    teacherId: 'usr-tea-01',
    teacherName: 'Mr. David Kiprono',
    teacherEmail: 'mr.kiprono@edusmart.ac.ke',
    leaveType: 'sick_leave',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    dayOfWeek: 'Monday',
    reason: 'Severe acute laryngitis and fever; doctor ordered 48-hour vocal rest and medication.',
    handoverNotes: 'Grade 4 Dove (Period 3): Textbook Page 52 Exercise 4 on Proper Fractions. Grade 5 Eagle (Period 6): Complete science lab reflection in notebooks.',
    contactNumber: '+254 712 345 678',
    affectedClasses: [
      {
        dayOfWeek: 'Monday',
        period: 3,
        grade: 4,
        stream: 'Dove',
        subject: 'Integrated Science',
        time: '09:40 – 10:20',
        roomName: 'Junior Science Lab 1',
        strandTopic: 'Living Things: Plant Classification and Habitats'
      },
      {
        dayOfWeek: 'Monday',
        period: 6,
        grade: 5,
        stream: 'Eagle',
        subject: 'Mathematics',
        time: '12:00 – 12:40',
        roomName: 'Room 5E',
        strandTopic: 'Decimals and Currency Operations'
      }
    ],
    notifiedRoles: ['head_teacher', 'deputy_head', 'dean_of_studies', 'senior_teacher'],
    reliefStatus: 'pending',
    createdAt: new Date().toISOString()
  }
];


