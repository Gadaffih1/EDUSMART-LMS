import { ahApiFetch } from '../academic-hierarchy/academicHierarchyTypes';

export { ahApiFetch as vcApiFetch };

export type SchedulingMode =
  | 'individual_stream'
  | 'selected_streams_combined'
  | 'all_streams_combined'
  | 'multiple_separate';

export type LessonStatus = 'scheduled' | 'live' | 'postponed' | 'cancelled' | 'completed';

export interface VirtualClassroomStreamRef {
  streamId: string;
  classroomId: string;
  name: string;
  displayName: string;
}

export interface VirtualClassroomRoom {
  id: string;
  lessonId: string;
  schoolId: string;
  gradeId: string;
  streamId: string | null;
  streamNames: string[];
  livekitRoomName: string;
  title: string;
  classroomMode: 'combined' | 'separate';
  roomStatus: LessonStatus;
  assignedTeacherId: string;
  assignedTeacherName: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  durationMinutes: number;
  actualStartTime: string | null;
  actualEndTime: string | null;
  capacity: number;
  locked: boolean;
  waitingRoomEnabled: boolean;
  recordingEnabled: boolean;
  studentChatEnabled: boolean;
  studentScreenshareEnabled: boolean;
  studentCameraEnabled: boolean;
  studentMicEnabled: boolean;
  interactionEnabled: boolean;
  mutedAll: boolean;
  connectedCount: number;
  waitingCount: number;
}

export interface VirtualLessonTeacherAssignment {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherEmail?: string | null;
  classroomId: string | null;
  streamId: string | null;
  assignmentType: 'coordinator' | 'stream_teacher' | 'co_teacher';
  canCoTeach: boolean;
}

export interface VirtualLessonRecording {
  id: string;
  classroomId: string;
  recordingId: string;
  egressId?: string | null;
  recordingUrl?: string | null;
  recordingStatus: string;
  durationSeconds: number;
  startedBy: string;
  stoppedBy?: string | null;
  retentionUntil: string;
  createdAt: string;
}

export interface StudentSubscriptionCheck {
  allowed: boolean;
  code?: string;
  reason?: string;
  remainingWeeklyLessons: number;
  weeklyLessonLimit: number;
  lessonsUsedThisWeek: number;
  approvalStatus: string;
  tier: string;
}

export interface VirtualLessonItem {
  id: string;
  schoolId: string;
  gradeId: string;
  gradeName: string;
  coordinatorId: string;
  coordinatorName: string;
  subjectName: string;
  title: string;
  topic: string;
  subtopic: string;
  learningObjectives: string;
  keyLearningPoints: string[];
  resources: Array<{ title: string; url: string; type?: string }>;
  description: string;
  schedulingMode: SchedulingMode;
  classroomMode: 'combined' | 'separate';
  scheduledDate: string;
  startTime: string;
  endTime: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  durationMinutes: number;
  timezone: string;
  status: LessonStatus;
  isInstant: boolean;
  maxCapacity: number;
  recordingEnabled: boolean;
  waitingRoomEnabled: boolean;
  studentChatEnabled: boolean;
  studentScreenshareEnabled: boolean;
  studentCameraEnabled: boolean;
  studentMicEnabled: boolean;
  interactionEnabled: boolean;
  postponedReason?: string | null;
  cancelledReason?: string | null;
  actualStartedAt?: string | null;
  actualEndedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  streams: VirtualClassroomStreamRef[];
  classrooms: VirtualClassroomRoom[];
  teacherAssignments: VirtualLessonTeacherAssignment[];
  attendanceSummary: {
    totalRecorded: number;
    presentCount: number;
    partialCount: number;
  };
  recordings: VirtualLessonRecording[];
  // Role-specific scoped enrichments returned by API
  myAttendance?: any;
  myAdmissionStatus?: string | null;
  mySubscription?: StudentSubscriptionCheck;
  myPrivileges?: {
    canModerate: boolean;
    canView: boolean;
    isAssignedCoordinator: boolean;
    isCoTeacher: boolean;
  };
  myAssignments?: VirtualLessonTeacherAssignment[];
  childrenProgress?: Array<{
    studentId: string;
    studentName: string;
    streamId: string | null;
    attendance: any;
    subscription: StudentSubscriptionCheck;
  }>;
}

export interface VirtualLessonNotification {
  id: string;
  school_id: string;
  lesson_id: string;
  classroom_id: string | null;
  recipient_id: string;
  recipient_type: string;
  grade_id: string;
  grade_name?: string;
  streamIds: string[];
  subject_name: string;
  topic: string;
  coordinator_name: string;
  scheduled_date: string;
  start_time: string;
  duration_minutes: number;
  classroom_status: string;
  isCoTeacher: boolean;
  notification_type: string;
  title: string;
  message: string;
  read_at: string | null;
  updated_at: string;
}

export interface VirtualLessonParticipant {
  id: string;
  classroom_id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  stream_id: string | null;
  livekit_identity: string;
  admission_status: 'admitted' | 'waiting' | 'rejected' | 'removed';
  is_co_host: number;
  mic_allowed: number;
  cam_allowed: number;
  screenshare_allowed: number;
  chat_allowed: number;
  hand_raised: number;
  hand_raised_at: string | null;
  join_time: string | null;
  leave_time: string | null;
  total_duration_seconds: number;
  reconnect_count: number;
  attendance_status: string;
  is_connected: number;
}

export interface VirtualClassroomMeta {
  schoolId: string;
  nairobiNow: { dateStr: string; timeStr: string; isoOffset: string };
  policy: {
    defaultMaxCapacity: number;
    maxDurationMinutes: number;
    overlapPolicy: 'warn' | 'block';
    teacherConflictPolicy: 'warn' | 'block';
    defaultRecordingEnabled: boolean;
    defaultWaitingRoomEnabled: boolean;
    requirePaidPassOnly: boolean;
    weeklyLessonLimitDefault: number;
    recordingRetentionDays: number;
  };
  livekitStatus: { configured: boolean; missingKeys: string[] };
  grades: Array<{
    id: string;
    name: string;
    gradeNumber: number | null;
    levelBand: string;
    seniorTeacherId: string | null;
    seniorTeacherName: string | null;
  }>;
  streams: Array<{
    id: string;
    gradeId: string;
    name: string;
    displayName: string;
    capacity: number;
    classTeacherId: string | null;
    classTeacherName: string | null;
    studentCount: number;
  }>;
  teachers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    tscNumber: string | null;
    assignedSubjects: string[];
  }>;
  gradeSubjectAssignments: Array<{
    gradeId: string;
    streamId: string | null;
    teacherId: string;
    teacherName: string;
    subjectName: string;
  }>;
  subjects: string[];
}

export interface JoinClassroomResponse {
  joined: boolean;
  waiting?: boolean;
  admissionStatus: string;
  participantId?: string;
  classroomId?: string;
  lessonId?: string;
  message?: string;
  configured?: boolean;
  missingKeys?: string[];
  token?: string | null;
  livekitUrl?: string;
  iceServers?: any[];
  roomName?: string;
  identity?: string;
  isModerator?: boolean;
  remainingSeconds?: number;
  endsAt?: string;
  permissions?: {
    micAllowed: boolean;
    camAllowed: boolean;
    screenShareAllowed: boolean;
    chatAllowed: boolean;
  };
  classroom?: VirtualClassroomRoom;
  lesson?: VirtualLessonItem;
}

export function formatCountdownSeconds(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const rem = s % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

export function getSecondsUntilIso(iso: string | null | undefined, nowMs: number): number {
  if (!iso) return 0;
  const target = Date.parse(iso);
  if (Number.isNaN(target)) return 0;
  return Math.max(0, Math.floor((target - nowMs) / 1000));
}

export function formatSchedulingModeLabel(mode: SchedulingMode): string {
  switch (mode) {
    case 'individual_stream':
      return 'Individual Stream';
    case 'selected_streams_combined':
      return 'Selected Streams (Combined)';
    case 'all_streams_combined':
      return 'All Streams (Combined)';
    case 'multiple_separate':
      return 'Multiple Separate Stream Rooms';
    default:
      return mode;
  }
}

export function exportAttendanceRegisterCsv(
  lessonTitle: string,
  subjectName: string,
  scheduledDate: string,
  rows: Array<{
    studentName: string;
    admissionNumber: string;
    streamName: string;
    attendanceStatus: string;
    totalAttendanceMinutes: number;
    firstJoinedAt: string | null;
    lastLeftAt: string | null;
    reconnectCount: number;
    verifiedVia: string;
  }>
): void {
  const headers = [
    'Student Name',
    'Admission Number',
    'Stream',
    'Attendance Status',
    'Duration (Mins)',
    'First Joined (EAT)',
    'Last Left (EAT)',
    'Reconnects',
    'Verification Source',
  ];
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csvLines = [
    [esc(`Lesson: ${subjectName} - ${lessonTitle}`), esc(`Date: ${scheduledDate}`)].join(','),
    headers.map(esc).join(','),
    ...rows.map((r) =>
      [
        esc(r.studentName),
        esc(r.admissionNumber),
        esc(r.streamName),
        esc(r.attendanceStatus.toUpperCase()),
        esc(r.totalAttendanceMinutes),
        esc(r.firstJoinedAt ? new Date(r.firstJoinedAt).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' }) : '-'),
        esc(r.lastLeftAt ? new Date(r.lastLeftAt).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' }) : '-'),
        esc(r.reconnectCount),
        esc(r.verifiedVia),
      ].join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvLines], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `attendance-${scheduledDate}-${subjectName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
