import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  Plus,
  Printer,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  ExamStreamInvigilatorAssignment,
  ExamTimetableEntry,
  GradeLevel,
  StreamName,
  User,
  getStreamsForGrade,
  getSubjectsForGrade,
} from '../../types';
import { Storage } from '../../utils/storage';
import { listSubjects } from '../../utils/catalogStore';
import { TenantSchoolLogo } from '../common/TenantSchoolLogo';
import { useTenant } from '../../context/TenantContext';

interface ExamScheduleManagerProps {
  currentUser: User;
  defaultGrade?: GradeLevel;
}

interface DailySlotTemplate {
  id: string;
  label: string;
  startTime: string;
  durationMinutes: number;
}

const DEFAULT_DAILY_SLOTS: DailySlotTemplate[] = [
  { id: 'slot-1', label: 'Morning Paper 1', startTime: '08:30', durationMinutes: 90 },
  { id: 'slot-2', label: 'Mid-Morning Paper 2', startTime: '10:30', durationMinutes: 90 },
  { id: 'slot-3', label: 'Afternoon Paper 3', startTime: '14:00', durationMinutes: 60 },
];

const EXAM_TYPES: ExamTimetableEntry['examType'][] = [
  'Opener Assessment',
  'Mid-Term Evaluation',
  'End-Term Summative',
  'KPSEA / KCSE National Mock',
];

const DEFAULT_SUBJECT_DURATIONS: Record<string, number> = {
  Mathematics: 90,
  English: 90,
  Kiswahili: 90,
  French: 60,
  'Integrated Science': 90,
  'Social Studies': 75,
  'Religious Education': 60,
  'Agriculture and Nutrition': 75,
  Agriculture: 75,
  Nutrition: 60,
  'Computer Studies': 75,
  'Creative Arts': 60,
  Arts: 60,
  Music: 60,
  'Library Lesson': 45,
  Swimming: 60,
  'Physical and Health Education': 60,
  'Pre-Technical Studies': 75,
  'Pretechnical Education': 75,
  'Business Studies': 75,
};

function addMinutesToTime(startTime: string, minutesToAdd: number): string {
  const [hStr, mStr] = startTime.split(':');
  const total = (parseInt(hStr || '8', 10) * 60) + parseInt(mStr || '30', 10) + Math.max(15, Number(minutesToAdd || 60));
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function getNextSchoolDates(startIso: string, count: number): Array<{ iso: string; dayLabel: string; dayNumber: number }> {
  const result: Array<{ iso: string; dayLabel: string; dayNumber: number }> = [];
  const base = startIso ? new Date(`${startIso}T08:00:00`) : new Date();
  const cursor = Number.isNaN(base.getTime()) ? new Date() : base;
  const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  let safety = 0;
  while (result.length < count && safety < 60) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) {
      const y = cursor.getFullYear();
      const m = String(cursor.getMonth() + 1).padStart(2, '0');
      const d = String(cursor.getDate()).padStart(2, '0');
      result.push({
        iso: `${y}-${m}-${d}`,
        dayLabel: weekdayNames[dow],
        dayNumber: result.length + 1,
      });
    }
    cursor.setDate(cursor.getDate() + 1);
    safety++;
  }
  return result;
}

function formatReadableDate(iso: string): string {
  if (!iso) return '—';
  const dt = new Date(`${iso}T08:00:00`);
  if (Number.isNaN(dt.getTime())) return iso;
  return dt.toLocaleDateString('en-KE', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export const ExamScheduleManager: React.FC<ExamScheduleManagerProps> = ({
  currentUser,
  defaultGrade = 4,
}) => {
  const { currentTenant } = useTenant();
  const [exams, setExams] = useState<ExamTimetableEntry[]>(() => Storage.getExamTimetables());
  const [allUsers, setAllUsers] = useState<User[]>(() => Storage.getUsers());

  const canManageExams = [
    'dean_of_studies',
    'deputy_head',
    'head_teacher',
    'curriculum_coordinator',
    'admin',
  ].includes(currentUser.role) || currentUser.accessScope === 'super_admin_only';

  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(
    currentUser.grade || defaultGrade
  );
  const [viewMode, setViewMode] = useState<'schedule' | 'invigilation' | 'scheduler'>('schedule');
  const [selectedSeriesFilter, setSelectedSeriesFilter] = useState<string>('ALL');
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Exam Series Generator State (Dean / Deputy Head)
  const [seriesName, setSeriesName] = useState<string>('Term 3 End-Term Examinations 2026');
  const [examType, setExamType] = useState<ExamTimetableEntry['examType']>('End-Term Summative');
  const [termLabel, setTermLabel] = useState<string>('Term 3 2026');
  const [startDate, setStartDate] = useState<string>('2026-11-23');
  const [targetScope, setTargetScope] = useState<'single_grade' | 'all_grades'>('single_grade');
  const [dailySlots, setDailySlots] = useState<DailySlotTemplate[]>(DEFAULT_DAILY_SLOTS);
  const [replaceExistingForGrade, setReplaceExistingForGrade] = useState<boolean>(true);
  const [subjectDurations, setSubjectDurations] = useState<Record<string, number>>(DEFAULT_SUBJECT_DURATIONS);
  const [excludedSubjects, setExcludedSubjects] = useState<string[]>([]);

  // Single Paper Modal State
  const [showAddPaperModal, setShowAddPaperModal] = useState(false);
  const [paperDate, setPaperDate] = useState('2026-11-23');
  const [paperStartTime, setPaperStartTime] = useState('08:30');
  const [paperDuration, setPaperDuration] = useState(90);
  const [paperSubject, setPaperSubject] = useState('Mathematics');
  const [paperInstructions, setPaperInstructions] = useState(
    'Candidates must be seated 15 minutes before start time. No unauthorized materials permitted.'
  );

  // Inline Stream Invigilator Editor Modal
  const [editingInvigilatorsExamId, setEditingInvigilatorsExamId] = useState<string | null>(null);

  useEffect(() => {
    const syncExams = () => setExams(Storage.getExamTimetables());
    const syncUsers = () => setAllUsers(Storage.getUsers());
    window.addEventListener('exam-timetables-updated', syncExams);
    window.addEventListener('users-updated', syncUsers);
    return () => {
      window.removeEventListener('exam-timetables-updated', syncExams);
      window.removeEventListener('users-updated', syncUsers);
    };
  }, []);

  const showFeedback = (type: 'ok' | 'err', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  };

  // Eligible teachers for exam invigilation
  const eligibleTeachers = useMemo(() => {
    const teachingRoles = new Set([
      'teacher',
      'class_teacher',
      'hod',
      'senior_teacher',
      'deputy_head',
      'dean_of_studies',
      'curriculum_coordinator',
      'librarian',
    ]);
    return allUsers
      .filter((u) => teachingRoles.has(u.role) && u.isActive !== false)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allUsers]);

  // Teachers who hold the dedicated "Exam Invigilation" Extra Role
  const designatedInvigilators = useMemo(
    () =>
      eligibleTeachers.filter(
        (u) => u.extraRoles?.includes('exam_invigilation') || u.examInvigilationConfig?.enabled
      ),
    [eligibleTeachers]
  );

  // All available subjects for a given grade (always includes French, Swimming, Library Lesson, Arts, Music, Nutrition + catalog subjects)
  const getAllSubjectsForGrade = (grade: GradeLevel): string[] => {
    const base = getSubjectsForGrade(grade).map((s) => String(s));
    const catalog = listSubjects().map((s) => String(s.name));
    const merged = Array.from(new Set<string>([...base, ...catalog]));
    // Keep Junior-only technical/business subjects on Grades 7-9 so Lower/Upper Primary stays crisp
    if (grade <= 6) {
      return merged.filter(
        (s) => !['Pretechnical Education', 'Pre-Technical Studies', 'Business Studies'].includes(s)
      );
    }
    return merged;
  };

  const activeGradeSubjects = useMemo(
    () => getAllSubjectsForGrade(selectedGrade),
    [selectedGrade]
  );

  const activeGradeStreams = useMemo(
    () => getStreamsForGrade(selectedGrade),
    [selectedGrade]
  );

  // Distinct series names
  const availableSeriesNames = useMemo(() => {
    const names = new Set<string>();
    exams.forEach((e) => {
      if (e.examSeriesName) names.add(e.examSeriesName);
    });
    return Array.from(names).sort();
  }, [exams]);

  // Exams filtered for currently selected grade & series
  const gradeExams = useMemo(() => {
    return exams
      .filter((e) => {
        if (e.grade !== selectedGrade) return false;
        if (selectedSeriesFilter !== 'ALL' && (e.examSeriesName || 'Default Schedule') !== selectedSeriesFilter) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const dCmp = a.examDate.localeCompare(b.examDate);
        if (dCmp !== 0) return dCmp;
        return a.startTime.localeCompare(b.startTime);
      });
  }, [exams, selectedGrade, selectedSeriesFilter]);

  // Group gradeExams by examDate (Day 1, Day 2, ... covering ALL days)
  const examsGroupedByDay = useMemo(() => {
    const map = new Map<string, ExamTimetableEntry[]>();
    for (const ex of gradeExams) {
      const list = map.get(ex.examDate) || [];
      list.push(ex);
      map.set(ex.examDate, list);
    }
    return Array.from(map.entries())
      .sort(([d1], [d2]) => d1.localeCompare(d2))
      .map(([dateIso, items], idx) => ({
        dateIso,
        dayNumber: items[0]?.dayNumber || idx + 1,
        readableDate: formatReadableDate(dateIso),
        items,
        totalDurationMinutes: items.reduce((acc, it) => acc + Number(it.durationMinutes || 0), 0),
      }));
  }, [gradeExams]);

  // Resolve stream invigilators for an exam entry (guaranteed to cover every stream in that grade)
  const resolveStreamInvigilators = (exam: ExamTimetableEntry): ExamStreamInvigilatorAssignment[] => {
    const streams = getStreamsForGrade(exam.grade);
    const existingByStream = new Map<string, ExamStreamInvigilatorAssignment>();
    (exam.streamInvigilators || []).forEach((si) => {
      existingByStream.set(si.stream, si);
    });

    return streams.map((st) => {
      const existing = existingByStream.get(st);
      if (existing) return existing;

      // Look up a teacher who has the Exam Invigilation extra role for this exact (grade, stream)
      const assignedExtra = designatedInvigilators.find((t) =>
        (t.examInvigilationConfig?.assignedStreams || []).some(
          (a) => a.grade === exam.grade && a.stream === st
        )
      );
      if (assignedExtra) {
        const cfg = assignedExtra.examInvigilationConfig?.assignedStreams?.find(
          (a) => a.grade === exam.grade && a.stream === st
        );
        return {
          stream: st,
          teacherId: assignedExtra.id,
          teacherName: assignedExtra.name,
          room: cfg?.room || `Grade ${exam.grade} ${st} Room`,
        };
      }
      return {
        stream: st,
        teacherName: exam.invigilatorName || 'Unassigned',
        room: `Grade ${exam.grade} ${st} Room`,
      };
    });
  };

  // Current teacher's own Exam Invigilation assignments (if logged in as a teacher with the extra role)
  const myInvigilationDuties = useMemo(() => {
    const freshUser = allUsers.find((u) => u.id === currentUser.id) || currentUser;
    const extraStreams = freshUser.examInvigilationConfig?.assignedStreams || [];
    const matchedExams = exams.filter((ex) =>
      (ex.streamInvigilators || []).some(
        (si) =>
          si.teacherId === currentUser.id ||
          si.teacherName.trim().toLowerCase() === currentUser.name.trim().toLowerCase()
      )
    );
    return {
      hasExtraRole:
        Boolean(freshUser.extraRoles?.includes('exam_invigilation')) ||
        Boolean(freshUser.examInvigilationConfig?.enabled),
      extraStreams,
      matchedExams,
    };
  }, [allUsers, currentUser, exams]);

  // Build collision-free stream invigilator assignments for a given grade & time slot
  const buildStreamInvigilatorsForSlot = (
    grade: GradeLevel,
    busyTeacherIdsInSlot: Set<string>,
    rotationSeed: number
  ): ExamStreamInvigilatorAssignment[] => {
    const streams = getStreamsForGrade(grade);
    const assignments: ExamStreamInvigilatorAssignment[] = [];

    streams.forEach((st, idx) => {
      // 1. Prefer a teacher explicitly assigned Exam Invigilation Extra Role for (grade, stream)
      const exactMatch = designatedInvigilators.find(
        (t) =>
          !busyTeacherIdsInSlot.has(t.id) &&
          (t.examInvigilationConfig?.assignedStreams || []).some(
            (a) => a.grade === grade && a.stream === st
          )
      );
      if (exactMatch) {
        busyTeacherIdsInSlot.add(exactMatch.id);
        const cfg = exactMatch.examInvigilationConfig?.assignedStreams?.find(
          (a) => a.grade === grade && a.stream === st
        );
        assignments.push({
          stream: st,
          teacherId: exactMatch.id,
          teacherName: exactMatch.name,
          room: cfg?.room || `Grade ${grade} ${st} Room`,
        });
        return;
      }

      // 2. Otherwise pick any free designated Exam Invigilator, then any free eligible teacher
      const pool = [...designatedInvigilators, ...eligibleTeachers.filter((t) => !designatedInvigilators.some((d) => d.id === t.id))];
      let picked: User | null = null;
      if (pool.length > 0) {
        for (let offset = 0; offset < pool.length; offset++) {
          const cand = pool[(rotationSeed + idx + offset) % pool.length];
          if (!busyTeacherIdsInSlot.has(cand.id)) {
            picked = cand;
            break;
          }
        }
      }

      if (picked) {
        busyTeacherIdsInSlot.add(picked.id);
        assignments.push({
          stream: st,
          teacherId: picked.id,
          teacherName: picked.name,
          room: `Grade ${grade} ${st} Room`,
        });
      } else {
        assignments.push({
          stream: st,
          teacherName: 'Assign Invigilator',
          room: `Grade ${grade} ${st} Room`,
        });
      }
    });

    return assignments;
  };

  // Auto-Generate Full Exam Schedule per Grade per Day for ALL Days capturing ALL Subjects
  const handleGenerateFullExamSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageExams) return;
    if (dailySlots.length === 0) {
      showFeedback('err', 'Configure at least 1 daily exam session slot.');
      return;
    }

    const gradesToSchedule: GradeLevel[] =
      targetScope === 'all_grades'
        ? ([1, 2, 3, 4, 5, 6, 7, 8, 9] as GradeLevel[])
        : [selectedGrade];

    const existingPreserved = replaceExistingForGrade
      ? exams.filter((ex) => !gradesToSchedule.includes(ex.grade))
      : [...exams];

    const generated: ExamTimetableEntry[] = [];
    // Track teacher busy per (examDate|startTime) across ALL grades so no teacher invigilates 2 streams simultaneously
    const slotTeacherBusy = new Map<string, Set<string>>();

    for (const ex of existingPreserved) {
      const slotKey = `${ex.examDate}|${ex.startTime}`;
      if (!slotTeacherBusy.has(slotKey)) slotTeacherBusy.set(slotKey, new Set());
      (ex.streamInvigilators || []).forEach((si) => {
        if (si.teacherId) slotTeacherBusy.get(slotKey)!.add(si.teacherId);
      });
    }

    let totalPapersCreated = 0;
    let totalDaysSpanned = 0;

    for (const grade of gradesToSchedule) {
      const gradeSubjects = getAllSubjectsForGrade(grade).filter(
        (s) => !excludedSubjects.includes(s)
      );
      if (gradeSubjects.length === 0) continue;

      const slotsPerDay = dailySlots.length;
      const daysNeeded = Math.ceil(gradeSubjects.length / slotsPerDay);
      totalDaysSpanned = Math.max(totalDaysSpanned, daysNeeded);
      const examDays = getNextSchoolDates(startDate, daysNeeded);

      gradeSubjects.forEach((subjectName, subIdx) => {
        const dayIdx = Math.floor(subIdx / slotsPerDay);
        const slotIdx = subIdx % slotsPerDay;
        const dayInfo = examDays[dayIdx];
        const slotTpl = dailySlots[slotIdx];
        if (!dayInfo || !slotTpl) return;

        const dur = Math.max(
          20,
          Number(subjectDurations[subjectName] || slotTpl.durationMinutes || 60)
        );
        const endTime = addMinutesToTime(slotTpl.startTime, dur);

        const slotKey = `${dayInfo.iso}|${slotTpl.startTime}`;
        if (!slotTeacherBusy.has(slotKey)) slotTeacherBusy.set(slotKey, new Set());
        const busySet = slotTeacherBusy.get(slotKey)!;

        const streamInvigilators = buildStreamInvigilatorsForSlot(
          grade,
          busySet,
          grade * 7 + subIdx
        );

        const leadInvig = streamInvigilators[0]?.teacherName || 'Assigned Stream Invigilators';

        generated.push({
          id: `ett-g${grade}-d${dayInfo.dayNumber}-s${slotIdx}-${Date.now()}-${subIdx}`,
          grade,
          subject: subjectName,
          examType,
          examSeriesName: seriesName.trim() || `${termLabel} ${examType}`,
          term: termLabel.trim() || 'Term 3 2026',
          examDate: dayInfo.iso,
          dayNumber: dayInfo.dayNumber,
          dayLabel: dayInfo.dayLabel,
          sessionLabel: slotTpl.label,
          startTime: slotTpl.startTime,
          endTime,
          durationMinutes: dur,
          room: `All Grade ${grade} Stream Rooms (${streamInvigilators.length} streams)`,
          invigilatorName: `${leadInvig}${streamInvigilators.length > 1 ? ` + ${streamInvigilators.length - 1} stream invigilators` : ''}`,
          streamInvigilators,
          instructions:
            subjectName === 'Swimming'
              ? 'Practical Swimming Assessment at School Pool · Swimwear & safety supervisor required.'
              : 'Report 15 minutes before paper start. Stream invigilators verify attendance register before unsealing papers.',
          scheduledBy: currentUser.name,
          scheduledByRole: currentUser.role === 'dean_of_studies' ? 'Dean of Studies' : currentUser.role === 'deputy_head' ? 'Deputy Head Teacher' : 'Academic Leadership',
        });
        totalPapersCreated++;
      });
    }

    const merged = [...existingPreserved, ...generated];
    Storage.saveExamTimetables(merged);
    setExams(merged);
    setSelectedSeriesFilter('ALL');
    setViewMode('schedule');
    showFeedback(
      'ok',
      `Scheduled ${totalPapersCreated} exam papers across ${totalDaysSpanned} exam day(s) for ${
        targetScope === 'all_grades' ? 'Grades 1–9' : `Grade ${selectedGrade}`
      } with collision-free per-stream invigilators.`
    );
  };

  // Add a single custom exam paper
  const handleAddSinglePaper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageExams) return;

    const slotKey = `${paperDate}|${paperStartTime}`;
    const busySet = new Set<string>();
    exams
      .filter((ex) => ex.examDate === paperDate && ex.startTime === paperStartTime)
      .forEach((ex) => {
        (ex.streamInvigilators || []).forEach((si) => {
          if (si.teacherId) busySet.add(si.teacherId);
        });
      });

    const streamInvigilators = buildStreamInvigilatorsForSlot(selectedGrade, busySet, exams.length + 1);
    const endTime = addMinutesToTime(paperStartTime, paperDuration);
    const dt = new Date(`${paperDate}T08:00:00`);
    const dayLabel = Number.isNaN(dt.getTime())
      ? ''
      : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dt.getDay()];

    Storage.addExamTimetableEntry({
      grade: selectedGrade,
      subject: paperSubject,
      examType,
      examSeriesName: seriesName.trim() || `${termLabel} ${examType}`,
      term: termLabel.trim() || 'Term 3 2026',
      examDate: paperDate,
      dayLabel,
      startTime: paperStartTime,
      endTime,
      durationMinutes: paperDuration,
      room: `All Grade ${selectedGrade} Stream Rooms (${streamInvigilators.length} streams)`,
      invigilatorName: `${streamInvigilators[0]?.teacherName || 'Unassigned'} (+${Math.max(0, streamInvigilators.length - 1)} streams)`,
      streamInvigilators,
      instructions: paperInstructions.trim(),
      scheduledBy: currentUser.name,
      scheduledByRole: currentUser.role === 'dean_of_studies' ? 'Dean of Studies' : 'Deputy Head Teacher',
    });

    setExams(Storage.getExamTimetables());
    setShowAddPaperModal(false);
    showFeedback('ok', `Added ${paperSubject} (${paperDuration} mins) for Grade ${selectedGrade} on ${paperDate}.`);
  };

  // Update a specific stream's invigilator on an exam paper (with double-booking collision check!)
  const handleAssignStreamInvigilator = (
    exam: ExamTimetableEntry,
    stream: StreamName,
    teacherId: string,
    roomOverride?: string,
    alsoGrantExtraRole = false
  ) => {
    const teacher = eligibleTeachers.find((t) => t.id === teacherId);
    if (!teacher) return;

    // Collision check: ensure teacher isn't already invigilating ANOTHER stream at the exact same date & startTime
    const clashExam = exams.find((other) => {
      if (other.examDate !== exam.examDate || other.startTime !== exam.startTime) return false;
      return (other.streamInvigilators || []).some(
        (si) =>
          si.teacherId === teacher.id &&
          !(other.id === exam.id && si.stream === stream)
      );
    });

    if (clashExam) {
      const clashStream = (clashExam.streamInvigilators || []).find((si) => si.teacherId === teacher.id);
      showFeedback(
        'err',
        `Invigilator collision blocked: ${teacher.name} is already assigned to Grade ${clashExam.grade} ${clashStream?.stream || ''} (${clashExam.subject}) on ${exam.examDate} at ${exam.startTime}.`
      );
      return;
    }

    const currentList = resolveStreamInvigilators(exam);
    const updatedList = currentList.map((item) =>
      item.stream === stream
        ? {
            ...item,
            teacherId: teacher.id,
            teacherName: teacher.name,
            room: roomOverride !== undefined ? roomOverride : item.room,
          }
        : item
    );

    Storage.updateExamTimetableEntry(exam.id, {
      streamInvigilators: updatedList,
      invigilatorName: `${updatedList[0]?.teacherName || teacher.name}${
        updatedList.length > 1 ? ` + ${updatedList.length - 1} stream invigilators` : ''
      }`,
    });

    // Optionally grant & persist the teacher's Exam Invigilation Extra Role for this stream
    if (alsoGrantExtraRole) {
      const existingRoles = teacher.extraRoles || [];
      const nextRoles = existingRoles.includes('exam_invigilation')
        ? existingRoles
        : [...existingRoles, 'exam_invigilation' as const];
      const existingStreams = teacher.examInvigilationConfig?.assignedStreams || [];
      const hasStream = existingStreams.some((s) => s.grade === exam.grade && s.stream === stream);
      const nextStreams = hasStream
        ? existingStreams
        : [
            ...existingStreams,
            {
              grade: exam.grade,
              stream,
              room: roomOverride || `Grade ${exam.grade} ${stream} Exam Room`,
              examSessionName: exam.examSeriesName || 'Term Examinations',
            },
          ];
      Storage.assignExtraRolesToUser(teacher.id, nextRoles, {
        examInvigilationConfig: {
          enabled: true,
          assignedStreams: nextStreams,
          notes: teacher.examInvigilationConfig?.notes,
        },
      });
      setAllUsers(Storage.getUsers());
    }

    setExams(Storage.getExamTimetables());
    showFeedback(
      'ok',
      `Assigned ${teacher.name} as Exam Invigilator for Grade ${exam.grade} ${stream} (${exam.subject}).`
    );
  };

  // Assign a teacher directly to a stream as their standing Exam Invigilation extra role (applies across all days of the grade's exam!)
  const handleAssignStandingStreamInvigilator = (stream: StreamName, teacherId: string) => {
    const teacher = eligibleTeachers.find((t) => t.id === teacherId);
    if (!teacher) return;

    // 1. Update teacher's Exam Invigilation extra role
    const existingRoles = teacher.extraRoles || [];
    const nextRoles = existingRoles.includes('exam_invigilation')
      ? existingRoles
      : [...existingRoles, 'exam_invigilation' as const];
    const existingStreams = teacher.examInvigilationConfig?.assignedStreams || [];
    const hasStream = existingStreams.some((s) => s.grade === selectedGrade && s.stream === stream);
    const nextStreams = hasStream
      ? existingStreams
      : [
          ...existingStreams,
          {
            grade: selectedGrade,
            stream,
            room: `Grade ${selectedGrade} ${stream} Exam Room`,
            examSessionName: seriesName.trim() || 'Term Examinations',
          },
        ];

    Storage.assignExtraRolesToUser(teacher.id, nextRoles, {
      examInvigilationConfig: {
        enabled: true,
        assignedStreams: nextStreams,
        notes: teacher.examInvigilationConfig?.notes,
      },
    });

    // 2. Apply this invigilator across all scheduled papers for selectedGrade on this stream (skipping only if double-booked)
    const allExamsCopy = Storage.getExamTimetables();
    let appliedPapers = 0;
    let skippedClashes = 0;

    const updatedAll = allExamsCopy.map((ex) => {
      if (ex.grade !== selectedGrade) return ex;
      const hasClash = allExamsCopy.some((other) => {
        if (other.examDate !== ex.examDate || other.startTime !== ex.startTime) return false;
        return (other.streamInvigilators || []).some(
          (si) => si.teacherId === teacher.id && !(other.id === ex.id && si.stream === stream)
        );
      });
      if (hasClash) {
        skippedClashes++;
        return ex;
      }
      const list = resolveStreamInvigilators(ex).map((si) =>
        si.stream === stream ? { ...si, teacherId: teacher.id, teacherName: teacher.name } : si
      );
      appliedPapers++;
      return {
        ...ex,
        streamInvigilators: list,
        invigilatorName: `${list[0]?.teacherName || teacher.name}${
          list.length > 1 ? ` + ${list.length - 1} stream invigilators` : ''
        }`,
      };
    });

    Storage.saveExamTimetables(updatedAll);
    setAllUsers(Storage.getUsers());
    setExams(updatedAll);
    showFeedback(
      'ok',
      `Granted Exam Invigilation extra role to ${teacher.name} for Grade ${selectedGrade} ${stream} (${appliedPapers} paper(s) linked${
        skippedClashes > 0 ? `, ${skippedClashes} skipped due to existing slot assignment` : ''
      }).`
    );
  };

  // Export Official Per-Grade All-Days Exam Schedule CSV
  const handleExportCsv = () => {
    const header = [
      'Grade',
      'Day #',
      'Exam Date',
      'Weekday',
      'Start Time',
      'End Time',
      'Duration (mins)',
      'Subject',
      'Exam Type',
      ...activeGradeStreams.map((s) => `${s} Invigilator`),
    ];
    const rows = gradeExams.map((ex) => {
      const invigs = resolveStreamInvigilators(ex);
      const byStream = new Map(invigs.map((i) => [i.stream, `${i.teacherName} (${i.room})`]));
      return [
        `Grade ${ex.grade}`,
        `Day ${ex.dayNumber || ''}`,
        ex.examDate,
        ex.dayLabel || formatReadableDate(ex.examDate).split(',')[0],
        ex.startTime,
        ex.endTime,
        String(ex.durationMinutes),
        ex.subject,
        ex.examType,
        ...activeGradeStreams.map((s) => byStream.get(s) || 'Unassigned'),
      ];
    });
    const csv = [header, ...rows]
      .map((r) => r.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Grade_${selectedGrade}_Exam_Schedule_All_Days.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const editingExamObj = useMemo(
    () => exams.find((e) => e.id === editingInvigilatorsExamId) || null,
    [exams, editingInvigilatorsExamId]
  );

  // Coverage stats for selected grade
  const coveredSubjectsCount = useMemo(
    () => new Set(gradeExams.map((e) => e.subject.toLowerCase())).size,
    [gradeExams]
  );

  return (
    <div className="space-y-5">
      {/* Feedback Banner */}
      {toast && (
        <div
          className={`px-4 py-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 ${
            toast.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-rose-50 border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
          <button type="button" onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Teacher's Personal Exam Invigilation Extra-Role Duty Notice */}
      {myInvigilationDuties.hasExtraRole && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <ClipboardCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
            <div className="text-xs text-teal-950 space-y-0.5">
              <div className="font-bold">Exam Invigilation Extra Role Active for {currentUser.name}</div>
              <div>
                Assigned Stream(s):{' '}
                <strong className="font-mono">
                  {myInvigilationDuties.extraStreams.length > 0
                    ? myInvigilationDuties.extraStreams.map((s) => `Grade ${s.grade} ${s.stream}`).join(', ')
                    : 'Assigned in active exam roster'}
                </strong>{' '}
                · <span className="font-mono tabular-nums font-bold">{myInvigilationDuties.matchedExams.length}</span> scheduled paper(s) under your supervision.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Bar (Single-Elevation Enterprise Contract) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:border-none print:p-0">
        <div className="flex items-start gap-3">
          <div className="bg-slate-50 border border-slate-200 p-1.5 rounded-lg shrink-0">
            <TenantSchoolLogo size="sm" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-700" />
              <span>{currentTenant.name} · Official Examination Schedule &amp; Invigilation Desk</span>
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight mt-0.5">
              Grade {selectedGrade} Examination Schedule — All Days &amp; All Subjects
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              {canManageExams
                ? 'Schedule examinations with daily papers & durations, assign stream invigilators without collisions, and produce official per-grade schedules.'
                : `Published examination dates, paper durations, rooms, and per-stream invigilators for Grade ${selectedGrade}.`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(Number(e.target.value) as GradeLevel)}
            className="px-3 py-2 text-xs font-bold border border-slate-200 rounded-lg bg-white text-slate-900"
          >
            {([1, 2, 3, 4, 5, 6, 7, 8, 9] as GradeLevel[]).map((g) => (
              <option key={g} value={g}>Grade {g}</option>
            ))}
          </select>

          {availableSeriesNames.length > 1 && (
            <select
              value={selectedSeriesFilter}
              onChange={(e) => setSelectedSeriesFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-700 max-w-[200px]"
            >
              <option value="ALL">All Exam Series</option>
              {availableSeriesNames.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={gradeExams.length === 0}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Schedule</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="bg-white border border-slate-200 rounded-xl grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 print:hidden">
        <div className="p-3.5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Exam Days Scheduled</div>
          <div className="text-xl font-extrabold font-mono tabular-nums text-slate-900 mt-0.5">
            {examsGroupedByDay.length}
          </div>
          <div className="text-[11px] text-slate-500">Consecutive school days</div>
        </div>
        <div className="p-3.5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Subjects Captured</div>
          <div className="text-xl font-extrabold font-mono tabular-nums text-slate-900 mt-0.5">
            {coveredSubjectsCount} <span className="text-xs font-semibold text-slate-400">/ {activeGradeSubjects.length}</span>
          </div>
          <div className="text-[11px] text-slate-500">Includes French, Swimming &amp; CBC subjects</div>
        </div>
        <div className="p-3.5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Streams Covered</div>
          <div className="text-xl font-extrabold font-mono tabular-nums text-slate-900 mt-0.5">
            {activeGradeStreams.length}
          </div>
          <div className="text-[11px] text-slate-500">Grade {selectedGrade}: {activeGradeStreams.slice(0, 4).join(', ')}{activeGradeStreams.length > 4 ? '…' : ''}</div>
        </div>
        <div className="p-3.5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Designated Invigilators</div>
          <div className="text-xl font-extrabold font-mono tabular-nums text-teal-700 mt-0.5">
            {designatedInvigilators.length}
          </div>
          <div className="text-[11px] text-slate-500">Teachers with Exam Invigilation extra role</div>
        </div>
      </div>

      {/* Mode Switcher Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-2 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => setViewMode('schedule')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'schedule' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Per-Grade All-Days Exam Schedule</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('invigilation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'invigilation' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Stream Invigilation Roster</span>
          </button>
          {canManageExams && (
            <button
              type="button"
              onClick={() => setViewMode('scheduler')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'scheduler' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Schedule Exam &amp; Durations (Dean / Deputy)</span>
            </button>
          )}
        </div>

        {canManageExams && viewMode !== 'scheduler' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setPaperSubject(activeGradeSubjects[0] || 'Mathematics');
                setShowAddPaperModal(true);
              }}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Paper</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('scheduler')}
              className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg inline-flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-Produce Full Exam Schedule</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================
          VIEW 1: OFFICIAL PER-GRADE, PER-DAY EXAM SCHEDULE (ALL DAYS)
          ======================================================== */}
      {viewMode === 'schedule' && (
        <div className="space-y-4">
          {examsGroupedByDay.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
              <div className="text-sm font-bold text-slate-900">
                No examination schedule produced yet for Grade {selectedGrade}
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {canManageExams
                  ? `Use the Exam Scheduler to set daily papers & durations and automatically generate a complete multi-day schedule capturing all ${activeGradeSubjects.length} subjects (including French & Swimming) with per-stream invigilators.`
                  : `The Dean of Studies or Deputy Head Teacher has not yet published the examination schedule for Grade ${selectedGrade}.`}
              </p>
              {canManageExams && (
                <button
                  type="button"
                  onClick={() => setViewMode('scheduler')}
                  className="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Schedule Grade {selectedGrade} Exams Now</span>
                </button>
              )}
            </div>
          ) : (
            examsGroupedByDay.map((dayGroup) => (
              <section
                key={dayGroup.dateIso}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden break-inside-avoid"
              >
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 bg-slate-900 text-white text-[11px] font-mono font-bold rounded">
                      DAY {dayGroup.dayNumber}
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      {dayGroup.readableDate}
                    </h3>
                    <span className="text-xs font-mono text-slate-500">({dayGroup.dateIso})</span>
                  </div>
                  <div className="text-xs font-mono tabular-nums text-slate-600 flex items-center gap-3">
                    <span>{dayGroup.items.length} paper{dayGroup.items.length === 1 ? '' : 's'}</span>
                    <span>·</span>
                    <span>Total Exam Time: <strong>{dayGroup.totalDurationMinutes} mins</strong></span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-600 font-semibold bg-white">
                        <th className="py-2.5 px-4">Time Window</th>
                        <th className="py-2.5 px-3 text-right">Duration</th>
                        <th className="py-2.5 px-4">Subject / Paper</th>
                        <th className="py-2.5 px-4">Stream Invigilators (Grade {selectedGrade})</th>
                        {canManageExams && <th className="py-2.5 px-4 text-right print:hidden">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dayGroup.items.map((exam) => {
                        const streamInvigs = resolveStreamInvigilators(exam);
                        return (
                          <tr key={exam.id} className="hover:bg-slate-50/70 align-top">
                            <td className="py-2.5 px-4 font-mono tabular-nums whitespace-nowrap">
                              <div className="font-bold text-slate-900">
                                {exam.startTime} – {exam.endTime}
                              </div>
                              {exam.sessionLabel && (
                                <div className="text-[10px] text-slate-500">{exam.sessionLabel}</div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                              <span className="font-bold text-slate-900">{exam.durationMinutes} min</span>
                            </td>
                            <td className="py-2.5 px-4">
                              <div className="font-bold text-slate-900">{exam.subject}</div>
                              <div className="text-[11px] text-slate-500">
                                {exam.examSeriesName || exam.examType}
                              </div>
                            </td>
                            <td className="py-2.5 px-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1 text-[11px]">
                                {streamInvigs.map((si) => (
                                  <div key={si.stream} className="flex items-center justify-between gap-2 border-b border-slate-100 pb-0.5">
                                    <span className="font-bold text-slate-700">{si.stream}:</span>
                                    <span className="text-slate-900 truncate">{si.teacherName}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            {canManageExams && (
                              <td className="py-2.5 px-4 text-right whitespace-nowrap print:hidden">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setEditingInvigilatorsExamId(exam.id)}
                                    className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md cursor-pointer"
                                  >
                                    Assign Invigilators
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      Storage.deleteExamTimetableEntry(exam.id);
                                      setExams(Storage.getExamTimetables());
                                    }}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                    title="Remove exam paper"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            ))
          )}
        </div>
      )}

      {/* ========================================================
          VIEW 2: STREAM INVIGILATION ROSTER (PER STREAM ASSIGNMENT)
          ======================================================== */}
      {viewMode === 'invigilation' && (
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Grade {selectedGrade} Per-Stream Exam Invigilation Matrix
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Assign a designated Exam Invigilator teacher to each stream in Grade {selectedGrade}. Standing assignments automatically grant the <strong>Exam Invigilation</strong> extra role and sync across all scheduled papers for that stream.
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {activeGradeStreams.length} streams · {designatedInvigilators.length} teachers with Exam Invigilation role
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-4">Stream</th>
                  <th className="py-2.5 px-4">Exam Room</th>
                  <th className="py-2.5 px-4">Designated Stream Invigilator (Extra Role)</th>
                  <th className="py-2.5 px-4">Scheduled Papers Covered</th>
                  {canManageExams && <th className="py-2.5 px-4 text-right">Assign / Reassign Invigilator</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeGradeStreams.map((stream) => {
                  const standingTeacher = designatedInvigilators.find((t) =>
                    (t.examInvigilationConfig?.assignedStreams || []).some(
                      (s) => s.grade === selectedGrade && s.stream === stream
                    )
                  );
                  const standingCfg = standingTeacher?.examInvigilationConfig?.assignedStreams?.find(
                    (s) => s.grade === selectedGrade && s.stream === stream
                  );
                  const coveredCount = gradeExams.filter((ex) =>
                    resolveStreamInvigilators(ex).some(
                      (si) => si.stream === stream && si.teacherName && si.teacherName !== 'Unassigned' && si.teacherName !== 'Assign Invigilator'
                    )
                  ).length;

                  return (
                    <tr key={stream} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        Grade {selectedGrade} {stream}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {standingCfg?.room || `Grade ${selectedGrade} ${stream} Exam Room`}
                      </td>
                      <td className="py-3 px-4">
                        {standingTeacher ? (
                          <div>
                            <div className="font-semibold text-slate-900">{standingTeacher.name}</div>
                            <div className="text-[11px] text-teal-700 font-medium">
                              Exam Invigilation Extra Role Active
                            </div>
                          </div>
                        ) : (
                          <span className="text-amber-700 font-medium">
                            Not pinned (uses per-paper rotation)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                        {coveredCount} / {gradeExams.length} papers
                      </td>
                      {canManageExams && (
                        <td className="py-3 px-4 text-right">
                          <select
                            value={standingTeacher?.id || ''}
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAssignStandingStreamInvigilator(stream, e.target.value);
                              }
                            }}
                            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-medium text-slate-800 max-w-[230px]"
                          >
                            <option value="">-- Assign Stream Invigilator --</option>
                            {eligibleTeachers.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                                {t.extraRoles?.includes('exam_invigilation') ? ' ★ Invigilator' : ''}
                              </option>
                            ))}
                          </select>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ========================================================
          VIEW 3: EXAM SCHEDULER BUILDER (DEAN OF STUDIES / DEPUTY HEAD)
          ======================================================== */}
      {viewMode === 'scheduler' && canManageExams && (
        <form onSubmit={handleGenerateFullExamSchedule} className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
            <div className="border-b border-slate-200 pb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
                  <span>Dean of Studies &amp; Deputy Head Examination Scheduler</span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                  Configure Exam Series, Daily Sessions &amp; Subject Durations
                </h3>
              </div>
              <span className="text-xs font-mono tabular-nums text-slate-600">
                Estimated Duration:{' '}
                <strong>
                  {Math.ceil(
                    activeGradeSubjects.filter((s) => !excludedSubjects.includes(s)).length /
                      Math.max(1, dailySlots.length)
                  )}{' '}
                  exam day(s)
                </strong>
              </span>
            </div>

            {/* Series Details */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Exam Series Name</label>
                <input
                  type="text"
                  required
                  value={seriesName}
                  onChange={(e) => setSeriesName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-medium"
                  placeholder="e.g. Term 3 End-Term Examinations 2026"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Assessment Type</label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value as ExamTimetableEntry['examType'])}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-medium"
                >
                  {EXAM_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Exam Start Date (Day 1)</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Term / Session Label</label>
                <input
                  type="text"
                  value={termLabel}
                  onChange={(e) => setTermLabel(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Grade Scope</label>
                <select
                  value={targetScope}
                  onChange={(e) => setTargetScope(e.target.value as 'single_grade' | 'all_grades')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-semibold"
                >
                  <option value="single_grade">Selected Grade Only (Grade {selectedGrade})</option>
                  <option value="all_grades">All Grades (Grades 1–9 Complete School Schedule)</option>
                </select>
              </div>
              <div className="flex items-end pb-1.5">
                <label className="inline-flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={replaceExistingForGrade}
                    onChange={(e) => setReplaceExistingForGrade(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900"
                  />
                  <span>Replace existing schedule for targeted grade(s)</span>
                </label>
              </div>
            </div>

            {/* Daily Paper Slots & Durations */}
            <div className="space-y-2.5 pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-700" />
                    <span>Daily Examination Sessions &amp; Default Durations</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Define how many exam papers run each day and their start times (weekends skipped automatically).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setDailySlots([
                      ...dailySlots,
                      {
                        id: `slot-${Date.now()}`,
                        label: `Paper ${dailySlots.length + 1}`,
                        startTime: '15:15',
                        durationMinutes: 60,
                      },
                    ])
                  }
                  className="px-2.5 py-1 text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Daily Slot</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {dailySlots.map((slot, idx) => (
                  <div key={slot.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={slot.label}
                        onChange={(e) => {
                          const next = [...dailySlots];
                          next[idx] = { ...next[idx], label: e.target.value };
                          setDailySlots(next);
                        }}
                        className="font-bold text-slate-900 bg-white border border-slate-200 rounded px-2 py-1 text-xs flex-1"
                      />
                      {dailySlots.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setDailySlots(dailySlots.filter((_, i) => i !== idx))}
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">Start</label>
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => {
                            const next = [...dailySlots];
                            next[idx] = { ...next[idx], startTime: e.target.value };
                            setDailySlots(next);
                          }}
                          className="w-full px-2 py-1 border border-slate-200 rounded bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">Default Mins</label>
                        <input
                          type="number"
                          min={20}
                          max={180}
                          step={5}
                          value={slot.durationMinutes}
                          onChange={(e) => {
                            const next = [...dailySlots];
                            next[idx] = { ...next[idx], durationMinutes: Math.max(20, Number(e.target.value || 60)) };
                            setDailySlots(next);
                          }}
                          className="w-full px-2 py-1 border border-slate-200 rounded bg-white font-mono tabular-nums"
                        />
                      </div>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      Window: {slot.startTime} – {addMinutesToTime(slot.startTime, slot.durationMinutes)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subjects & Per-Subject Paper Durations (Capturing ALL Subjects including French & Swimming) */}
            <div className="space-y-2.5 pt-3 border-t border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Subjects &amp; Paper Durations ({activeGradeSubjects.filter((s) => !excludedSubjects.includes(s)).length} of {activeGradeSubjects.length} included)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    All Grade {selectedGrade} subjects (including French, Swimming, Library Lesson, Arts, Music, Nutrition) are captured automatically. Adjust individual paper durations below.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setExcludedSubjects([])}
                  className="text-xs font-semibold text-slate-700 hover:text-slate-900 underline cursor-pointer"
                >
                  Select All Subjects
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {activeGradeSubjects.map((subj) => {
                  const included = !excludedSubjects.includes(subj);
                  const dur = subjectDurations[subj] ?? DEFAULT_SUBJECT_DURATIONS[subj] ?? 60;
                  return (
                    <div
                      key={subj}
                      className={`px-3 py-2 rounded-lg border flex items-center justify-between gap-2 text-xs ${
                        included ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer min-w-0">
                        <input
                          type="checkbox"
                          checked={included}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setExcludedSubjects(excludedSubjects.filter((x) => x !== subj));
                            } else {
                              setExcludedSubjects([...excludedSubjects, subj]);
                            }
                          }}
                          className="rounded border-slate-300 text-slate-900"
                        />
                        <span className="truncate">{subj}</span>
                      </label>
                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="number"
                          min={20}
                          max={180}
                          step={5}
                          disabled={!included}
                          value={dur}
                          onChange={(e) =>
                            setSubjectDurations((prev) => ({
                              ...prev,
                              [subj]: Math.max(20, Number(e.target.value || 60)),
                            }))
                          }
                          className="w-14 px-1.5 py-0.5 border border-slate-200 rounded text-right font-mono tabular-nums"
                        />
                        <span className="text-[10px] text-slate-500">min</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-600 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-teal-700 shrink-0" />
                <span>
                  Invigilators holding the <strong>Exam Invigilation</strong> extra role are assigned first to their designated streams with zero double-booking.
                </span>
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg inline-flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  Produce Official Exam Schedule ({targetScope === 'all_grades' ? 'All Grades 1–9' : `Grade ${selectedGrade}`})
                </span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================
          MODAL: ADD SINGLE EXAM PAPER
          ======================================================== */}
      {showAddPaperModal && canManageExams && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">
                Add Examination Paper — Grade {selectedGrade}
              </h3>
              <button type="button" onClick={() => setShowAddPaperModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddSinglePaper} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject</label>
                <select
                  value={paperSubject}
                  onChange={(e) => {
                    setPaperSubject(e.target.value);
                    setPaperDuration(DEFAULT_SUBJECT_DURATIONS[e.target.value] || 60);
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-semibold"
                >
                  {activeGradeSubjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Exam Date</label>
                  <input
                    type="date"
                    required
                    value={paperDate}
                    onChange={(e) => setPaperDate(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={paperStartTime}
                    onChange={(e) => setPaperStartTime(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    min={20}
                    max={180}
                    step={5}
                    value={paperDuration}
                    onChange={(e) => setPaperDuration(Math.max(20, Number(e.target.value || 60)))}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-lg font-mono tabular-nums"
                  />
                </div>
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                Computed Window: {paperStartTime} – {addMinutesToTime(paperStartTime, paperDuration)} ({paperDuration} mins)
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Examination Instructions</label>
                <textarea
                  rows={2}
                  value={paperInstructions}
                  onChange={(e) => setPaperInstructions(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPaperModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg cursor-pointer"
                >
                  Save Paper &amp; Assign Stream Invigilators
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: PER-STREAM INVIGILATOR ASSIGNMENT FOR A PAPER
          ======================================================== */}
      {editingExamObj && canManageExams && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Assign Stream Invigilators — Grade {editingExamObj.grade} · {editingExamObj.subject}
                </h3>
                <div className="text-[11px] font-mono text-slate-500">
                  {editingExamObj.examDate} · {editingExamObj.startTime}–{editingExamObj.endTime} ({editingExamObj.durationMinutes} mins)
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingInvigilatorsExamId(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-2.5 text-xs">
              {resolveStreamInvigilators(editingExamObj).map((si) => (
                <div
                  key={si.stream}
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      Grade {editingExamObj.grade} {si.stream}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">{si.room}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={si.teacherId || ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAssignStreamInvigilator(
                            editingExamObj,
                            si.stream,
                            e.target.value,
                            si.room,
                            true
                          );
                        }
                      }}
                      className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-semibold text-slate-800 min-w-[220px]"
                    >
                      <option value="">-- Select Stream Invigilator --</option>
                      {eligibleTeachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                          {t.extraRoles?.includes('exam_invigilation') ? ' ★ Invigilator' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[11px] text-slate-600">
              <span>Selecting a teacher automatically checks for slot clashes and grants the Exam Invigilation extra role.</span>
              <button
                type="button"
                onClick={() => setEditingInvigilatorsExamId(null)}
                className="px-4 py-1.5 bg-slate-900 text-white font-bold rounded-lg cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
