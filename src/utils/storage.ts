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
  ExamTimetableEntry
} from '../types';
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
  INITIAL_PARENT_COMMUNICATIONS,
  INITIAL_EXAM_TIMETABLE
} from '../data/initialData';

const KEYS = {
  USERS: 'edusmart_users_v1',
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
};

function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage`, err);
    return defaultValue;
  }
}

function setToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing ${key} to localStorage`, err);
  }
}

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
    localStorage.setItem(KEYS.REPORT_CARDS, JSON.stringify(INITIAL_REPORT_CARDS));
    localStorage.setItem(KEYS.CHAT_MESSAGES, JSON.stringify(INITIAL_CHAT_MESSAGES));
    localStorage.setItem(KEYS.LIBRARY_BOOKS, JSON.stringify(INITIAL_LIBRARY_BOOKS));
    localStorage.setItem(KEYS.BORROW_RECORDS, JSON.stringify(INITIAL_BORROW_RECORDS));
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
    return getFromStorage<User[]>(KEYS.USERS, INITIAL_USERS);
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
    return users[idx];
  },
  deleteUser(id: string): void {
    const users = this.getUsers().filter(u => u.id !== id);
    setToStorage(KEYS.USERS, users);
  },
  findUserByEmail(email: string): User | undefined {
    const cleanEmail = email.trim().toLowerCase();
    return this.getUsers().find(u => u.email.toLowerCase() === cleanEmail);
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
    const logs = getFromStorage<WorkEntryLog[]>(KEYS.WORK_ENTRY_LOGS, INITIAL_WORK_ENTRY_LOGS);
    if (teacherId) {
      return logs.filter(l => l.teacherId === teacherId);
    }
    return logs;
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
    const slots = getFromStorage<TimetableSlot[]>(KEYS.TIMETABLE, INITIAL_TIMETABLE);
    return slots.filter(s => s.grade === grade && s.stream === stream);
  },
  saveTimetableSlot(slot: TimetableSlot): void {
    const slots = getFromStorage<TimetableSlot[]>(KEYS.TIMETABLE, INITIAL_TIMETABLE);
    const idx = slots.findIndex(s => s.id === slot.id);
    if (idx !== -1) {
      slots[idx] = slot;
    } else {
      slots.push(slot);
    }
    setToStorage(KEYS.TIMETABLE, slots);
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
  },
  returnBook(recordId: string, remarks?: string): void {
    const records = getFromStorage<LibraryBorrowRecord[]>(KEYS.BORROW_RECORDS, INITIAL_BORROW_RECORDS);
    const rec = records.find(r => r.id === recordId);
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
    }
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
  },

  deleteNotification(notificationId: string): void {
    const all = getFromStorage<AppNotification[]>(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const updated = all.filter(n => n.id !== notificationId);
    setToStorage(KEYS.NOTIFICATIONS, updated);
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
    return getFromStorage<SchoolCalendarEvent[]>(KEYS.CALENDAR_EVENTS, INITIAL_CALENDAR_EVENTS);
  },

  saveCalendarEvents(events: SchoolCalendarEvent[]): void {
    setToStorage(KEYS.CALENDAR_EVENTS, events);
  },

  addCalendarEvent(event: Omit<SchoolCalendarEvent, 'id'>): SchoolCalendarEvent {
    const events = this.getCalendarEvents();
    const newEvent: SchoolCalendarEvent = {
      ...event,
      id: `cal-${Date.now()}`
    };
    events.unshift(newEvent);
    this.saveCalendarEvents(events);
    return newEvent;
  },

  updateCalendarEvent(id: string, updates: Partial<SchoolCalendarEvent>): SchoolCalendarEvent | null {
    const events = this.getCalendarEvents();
    const index = events.findIndex(e => e.id === id);
    if (index === -1) return null;
    events[index] = { ...events[index], ...updates, updatedAt: new Date().toISOString().split('T')[0] };
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
    return getFromStorage<TimetableSlot[]>(KEYS.TIMETABLE, INITIAL_TIMETABLE);
  }
};


