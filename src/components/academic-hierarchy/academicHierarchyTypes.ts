import { ClientDataStore } from '../../utils/clientDataStore';

export interface AcademicGrade {
  id: string;
  schoolId: string;
  name: string;
  gradeNumber: number | null;
  levelBand: string;
  academicYear: string;
  description?: string | null;
  isActive: boolean;
  seniorTeacherId?: string | null;
  seniorTeacherName?: string | null;
  seniorTeacherEmail?: string | null;
  seniorAssignedAt?: string | null;
  streamsCount: number;
  studentsCount: number;
}

export interface AcademicStream {
  id: string;
  schoolId: string;
  gradeId: string;
  name: string;
  displayName: string;
  capacity: number;
  roomLabel?: string | null;
  isActive: boolean;
  classTeacherId?: string | null;
  classTeacherName?: string | null;
  classTeacherEmail?: string | null;
  classAssignedAt?: string | null;
  studentsCount: number;
}

export interface StaffMemberOption {
  id: string;
  name: string;
  email: string;
  role: string;
  staffNumber?: string | null;
  tscNumber?: string | null;
  department?: string | null;
}

export interface StreamPerformanceRow {
  streamId: string;
  streamName: string;
  displayName: string;
  capacity: number;
  roomLabel: string;
  classTeacherId: string | null;
  classTeacherName: string;
  classTeacherEmail: string | null;
  studentsCount: number;
  attendanceRate: number;
  academicMean: number;
  assignmentCompletion: number;
  syllabusCoverage: number;
  openInterventionsCount: number;
  pendingReportsCount: number;
  latestReportStatus: string;
  latestReportDate: string | null;
  reportsSubmittedCount: number;
}

export interface SeniorReviewItem {
  id: string;
  report_id: string;
  reviewer_id: string;
  reviewer_name: string;
  decision: 'approved' | 'returned_for_correction' | 'info_requested' | 'instruction';
  comments: string;
  action_items?: string | null;
  created_at: string;
}

export interface ClassTeacherReportItem {
  id: string;
  school_id: string;
  grade_id: string;
  stream_id: string;
  grade_name?: string;
  stream_display_name?: string;
  class_teacher_id: string;
  class_teacher_name: string;
  senior_teacher_id?: string | null;
  senior_teacher_name?: string | null;
  report_type: string;
  period_label: string;
  academic_year: string;
  term: string;
  title: string;
  summary: string;
  attendance_rate: number;
  academic_mean: number;
  syllabus_coverage: number;
  assignment_completion: number;
  students_count: number;
  intervention_count: number;
  challenges?: string | null;
  recommendations?: string | null;
  status: string;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
  reviews?: SeniorReviewItem[];
}

export interface ConsolidatedGradeReportItem {
  id: string;
  school_id: string;
  grade_id: string;
  grade_name?: string;
  senior_teacher_id: string;
  senior_teacher_name: string;
  report_type: string;
  period_label: string;
  academic_year: string;
  term: string;
  title: string;
  executive_summary: string;
  weakSubjects: Array<{ subject: string; averageScore: number; streamsEvaluated: string[] }>;
  streamComparison: StreamPerformanceRow[];
  intervention_summary?: string | null;
  recommendations?: string | null;
  includedReportIds: string[];
  overall_attendance_rate: number;
  overall_academic_mean: number;
  overall_syllabus_coverage: number;
  total_students: number;
  total_streams: number;
  status: string;
  submitted_at?: string | null;
  admin_reviewer_id?: string | null;
  admin_reviewer_name?: string | null;
  admin_feedback?: string | null;
  admin_reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentInterventionItem {
  id: string;
  school_id: string;
  grade_id: string;
  stream_id: string;
  stream_display_name?: string;
  student_id: string;
  student_name: string;
  subject_name?: string | null;
  category: string;
  severity: string;
  baseline_score?: number | null;
  target_score?: number | null;
  identified_issue: string;
  intervention_plan: string;
  recommended_by_name: string;
  recommended_by_role: string;
  assigned_to_name?: string | null;
  status: string;
  parent_notified: number;
  outcome_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AcademicMonitoringItem {
  id: string;
  grade_id: string;
  stream_id: string;
  stream_display_name?: string;
  subject_name: string;
  teacher_name?: string | null;
  term: string;
  week_number: number;
  topics_planned: number;
  topics_completed: number;
  syllabus_coverage_pct: number;
  lessons_scheduled: number;
  lessons_delivered: number;
  assignment_completion_pct: number;
  assessment_mean_score: number;
  weak_areas?: string | null;
  remarks?: string | null;
  updated_at: string;
}

export interface GradeAnnouncementItem {
  id: string;
  school_id: string;
  grade_id?: string | null;
  stream_id?: string | null;
  grade_name?: string | null;
  stream_display_name?: string | null;
  author_name: string;
  author_role: string;
  target_audience: string;
  title: string;
  message: string;
  priority: string;
  is_pinned: number;
  created_at: string;
}

export interface GradeNotificationItem {
  id: string;
  grade_id?: string | null;
  stream_id?: string | null;
  category: string;
  severity: string;
  title: string;
  message: string;
  action_url_tab?: string | null;
  related_entity_id?: string | null;
  is_read: number;
  created_at: string;
}

export interface AcademicBootstrapPayload {
  schoolId: string;
  scope: {
    role: string;
    isAdmin: boolean;
    assignedGradeIds: string[];
    assignedStreamIds: string[];
  };
  grades: AcademicGrade[];
  streams: AcademicStream[];
  staffDirectory: StaffMemberOption[];
  subjectAssignments: any[];
  unreadNotificationsCount: number;
  compliance: {
    gradesMissingSeniorTeacher: string[];
    streamsMissingClassTeacher: string[];
  };
}

export interface GradeOverviewPayload {
  grade: {
    id: string;
    schoolId: string;
    name: string;
    gradeNumber: number | null;
    levelBand: string;
    academicYear: string;
    description?: string | null;
  };
  seniorTeacher: {
    assignmentId: string;
    teacherId: string;
    teacherName: string;
    teacherEmail: string;
    assignedAt: string;
  } | null;
  summary: {
    totalStudents: number;
    streamsCount: number;
    classTeachersCount: number;
    unassignedStreamsCount: number;
    overallAttendancePct: number;
    overallAcademicMean: number;
    overallSyllabusCoveragePct: number;
    overallAssignmentCompletionPct: number;
    pendingClassReportsCount: number;
    openInterventionsCount: number;
    subjectTeachersCount: number;
  };
  streams: StreamPerformanceRow[];
  weakSubjects: Array<{ subject: string; averageScore: number; streamsEvaluated: string[] }>;
  belowExpectationInterventions: StudentInterventionItem[];
  recentMonitoring: AcademicMonitoringItem[];
  recentClassReports: ClassTeacherReportItem[];
}

export async function ahApiFetch<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = ClientDataStore.getAuthHeaders({
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...((options.headers as Record<string, string>) || {}),
  });
  const res = await fetch(url, {
    credentials: 'include',
    ...options,
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data as T;
}
