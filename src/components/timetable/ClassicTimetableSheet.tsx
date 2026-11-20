import React, { useEffect, useMemo, useState } from 'react';
import { Printer, Plus } from 'lucide-react';
import { TimetableSlot, GradeLevel, StreamName } from '../../types';
import { useTenant } from '../../context/TenantContext';
import { TenantSchoolLogo } from '../common/TenantSchoolLogo';
import { Storage } from '../../utils/storage';
import { ClientDataStore } from '../../utils/clientDataStore';

const SHEET_PREFS_KEY = 'edusmart_timetable_sheet_prefs_v1';

export interface ClassicLessonSlotDef {
  lessonNumber: number;
  headerLabel: string;
  timeRange: string;
  startTime: string;
  endTime: string;
}

export const CLASSIC_11_LESSONS: ClassicLessonSlotDef[] = [
  { lessonNumber: 1, headerLabel: 'LESSON 1', timeRange: '8:20 - 9:00', startTime: '08:20', endTime: '09:00' },
  { lessonNumber: 2, headerLabel: 'LESSON 2', timeRange: '9:00 - 9:40', startTime: '09:00', endTime: '09:40' },
  { lessonNumber: 3, headerLabel: 'LESSON 3', timeRange: '9:40 - 10:20', startTime: '09:40', endTime: '10:20' },
  { lessonNumber: 4, headerLabel: 'LESSON 4', timeRange: '10:20 - 11:00', startTime: '10:20', endTime: '11:00' },
  { lessonNumber: 5, headerLabel: 'LESSON 5', timeRange: '11:00 - 11:40', startTime: '11:00', endTime: '11:40' },
  { lessonNumber: 6, headerLabel: 'LESSON 6', timeRange: '11:40 - 12:20', startTime: '11:40', endTime: '12:20' },
  { lessonNumber: 7, headerLabel: 'LESSON 7', timeRange: '12:20 - 13:00', startTime: '12:20', endTime: '13:00' },
  { lessonNumber: 8, headerLabel: 'LESSON 8', timeRange: '13:00 - 13:40', startTime: '13:00', endTime: '13:40' },
  { lessonNumber: 9, headerLabel: 'LESSON 9.', timeRange: '13:40 - 14:20', startTime: '13:40', endTime: '14:20' },
  { lessonNumber: 10, headerLabel: 'LESSON 10.', timeRange: '14:20 - 15:00', startTime: '14:20', endTime: '15:00' },
  { lessonNumber: 11, headerLabel: 'LESSON 11.', timeRange: '15:00 - 15:40', startTime: '15:00', endTime: '15:40' },
];

const DAYS_ROWS: Array<{ full: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'; short: string }> = [
  { full: 'Monday', short: 'Mo' },
  { full: 'Tuesday', short: 'Tu' },
  { full: 'Wednesday', short: 'We' },
  { full: 'Thursday', short: 'Th' },
  { full: 'Friday', short: 'Fri' },
];

/**
 * Authentic short-code formatting matching classic school timetable sheets
 * (e.g. MATH, ENG, KISW, SCI/TEC, SST, CRE, AGRI, NUT, ICT/ROBOTICS, A/C, MUSIC, P.E., LIB, FRENCH, SWIM, BS).
 */
export function formatSubjectShortCode(subject: string): string {
  const raw = String(subject || '').trim();
  const lower = raw.toLowerCase();
  if (!raw) return '';
  if (lower === 'mathematics' || lower === 'maths' || lower === 'math') return 'MATH';
  if (lower === 'english' || lower === 'english language') return 'ENG';
  if (lower === 'kiswahili' || lower === 'kiswahili lugha') return 'KISW';
  if (lower === 'integrated science' || lower === 'science & technology' || lower === 'science and technology' || lower === 'science') return 'SCI/TEC';
  if (lower === 'social studies') return 'SST';
  if (lower === 'religious education' || lower === 'c.r.e' || lower === 'cre' || lower === 'christian religious education') return 'CRE';
  if (lower === 'agriculture and nutrition' || lower === 'agriculture') return 'AGRI';
  if (lower === 'nutrition' || lower === 'home science') return 'NUT';
  if (lower === 'computer studies' || lower === 'ict' || lower === 'ict/robotics' || lower === 'coding & robotics') return 'ICT/ROBOTICS';
  if (lower === 'creative arts' || lower === 'arts' || lower === 'art & craft' || lower === 'art and craft') return 'A/C';
  if (lower === 'music') return 'MUSIC';
  if (lower === 'physical and health education' || lower === 'physical education' || lower === 'phe' || lower === 'p.e.' || lower === 'pe') return 'P.E.';
  if (lower === 'pre-technical studies' || lower === 'business studies') return lower.includes('business') ? 'BS' : 'PRE-TECH';
  if (lower === 'library lesson' || lower === 'library') return 'LIB';
  if (lower === 'french') return 'FRENCH';
  if (lower === 'swimming') return 'SWIM';
  if (lower === 'life skills' || lower === 'life skills education') return 'L/S.';
  if (lower === 'guidance & counseling' || lower === 'guidance and counseling' || lower === 'pastoral care') return 'C/G';
  if (lower === 'clubs' || lower === 'clubs & societies') return 'CLUBS';
  if (lower === 'environmental activities') return 'ENV';
  if (lower === 'hygiene and nutrition') return 'NUT';
  if (lower === 'break' || lower === 'lunch' || lower === 'off duty') return raw.toUpperCase();
  return raw.length <= 10 ? raw.toUpperCase() : raw.slice(0, 9).toUpperCase();
}

export function formatStreamShortTag(grade: number, stream: string): string {
  const s = String(stream || '').trim();
  const lower = s.toLowerCase();
  let code = s.toUpperCase();
  if (lower === 'dove') code = 'DO';
  else if (lower === 'chania') code = 'CHAN';
  else if (lower === 'turkwel') code = 'TUR';
  else if (lower === 'eagle') code = 'EAG';
  else if (lower === 'falcon') code = 'FAL';
  else if (lower === 'kerio') code = 'KERIO';
  else if (lower === 'mara') code = 'MARA';
  else if (lower === 'tana') code = 'TANA';
  else if (lower === 'athi') code = 'ATHI';
  else if (s.length > 5) code = s.slice(0, 4).toUpperCase();
  return `${grade} ${code}`;
}

export function formatTeacherShortName(name: string): string {
  const cleaned = String(name || '')
    .replace(/\b(Mr\.?|Mrs\.?|Ms\.?|Miss|Dr\.?|Prof\.?|Tr\.?|Teacher)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '';
  if (cleaned.includes('/')) {
    return cleaned
      .split('/')
      .map((part) => formatTeacherShortName(part))
      .filter(Boolean)
      .join(' / ');
  }
  const parts = cleaned.split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].toUpperCase();
  const last = parts[parts.length - 1];
  return last.toUpperCase();
}

/**
 * Maps an academic period index (1..9) onto the 11-lesson sheet column (1..11),
 * respecting grade-band Break and Lunch columns:
 *  - Primary (Grades 1–6): Break = Lesson 5 (11:00–11:40), Lunch = Lesson 9 (13:40–14:20)
 *  - Junior (Grades 7–9):  Break = Lesson 4 (10:20–11:00), Lunch = Lesson 8 (13:00–13:40)
 */
function mapAcademicPeriodToLessonCol(period: number, isJuniorBand: boolean): number {
  const p = Number(period || 1);
  if (isJuniorBand) {
    // Academic periods 1..3 -> Lessons 1..3; Lesson 4 = BREAK; 4..6 -> Lessons 5..7; Lesson 8 = LUNCH; 7..9 -> Lessons 9..11
    if (p <= 3) return Math.max(1, p);
    if (p <= 6) return p + 1;
    if (p <= 9) return p + 2;
    return Math.min(11, p);
  }
  // Primary: Academic periods 1..4 -> Lessons 1..4; Lesson 5 = BREAK; 5..7 -> Lessons 6..8; Lesson 9 = LUNCH; 8..9 -> Lessons 10..11
  if (p <= 4) return Math.max(1, p);
  if (p <= 7) return p + 1;
  if (p <= 9) return p + 2;
  return Math.min(11, p);
}

function mapLessonColToAcademicPeriod(lessonCol: number, isJuniorBand: boolean): number | null {
  if (isJuniorBand) {
    if (lessonCol === 4 || lessonCol === 8) return null;
    if (lessonCol <= 3) return lessonCol;
    if (lessonCol <= 7) return lessonCol - 1;
    return lessonCol - 2;
  }
  if (lessonCol === 5 || lessonCol === 9) return null;
  if (lessonCol <= 4) return lessonCol;
  if (lessonCol <= 8) return lessonCol - 1;
  return lessonCol - 2;
}

interface CellItem {
  kind: 'lesson' | 'break' | 'lunch' | 'off_duty' | 'empty';
  colStart: number;
  colSpan: number;
  slot?: TimetableSlot;
  title?: string;
  teacherText?: string;
  classTag?: string;
}

export interface ClassicTimetableSheetProps {
  mode: 'class' | 'teacher';
  slots: TimetableSlot[];
  grade?: GradeLevel;
  stream?: StreamName | string;
  teacherName?: string;
  classTeacherName?: string;
  offDutySlots?: Array<{ day: string; period: number }>;
  termLabel?: string;
  themeText?: string;
  canEdit?: boolean;
  onSelectSlot?: (slot: TimetableSlot) => void;
  onAddSlot?: (day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday', academicPeriod: number) => void;
  hideToolbar?: boolean;
  printPageSize?: 'A4' | 'A3';
}

export const ClassicTimetableSheet: React.FC<ClassicTimetableSheetProps> = ({
  mode,
  slots,
  grade = 4,
  stream = 'Dove',
  teacherName = '',
  classTeacherName,
  offDutySlots = [],
  termLabel,
  themeText,
  canEdit = false,
  onSelectSlot,
  onAddSlot,
  hideToolbar = false,
  printPageSize: initialPrintSize = 'A4',
}) => {
  const { currentTenant } = useTenant();
  const [useShortCodes, setUseShortCodesState] = useState<boolean>(() => {
    const saved = ClientDataStore.getPreference<{ useShortCodes?: boolean; pageSize?: 'A4' | 'A3' } | null>(SHEET_PREFS_KEY, null);
    return typeof saved?.useShortCodes === 'boolean' ? saved.useShortCodes : true;
  });
  const [pageSize, setPageSizeState] = useState<'A4' | 'A3'>(() => {
    const saved = ClientDataStore.getPreference<{ useShortCodes?: boolean; pageSize?: 'A4' | 'A3' } | null>(SHEET_PREFS_KEY, null);
    return saved?.pageSize === 'A3' || saved?.pageSize === 'A4' ? saved.pageSize : initialPrintSize;
  });

  const setUseShortCodes = (val: boolean | ((prev: boolean) => boolean)) => {
    setUseShortCodesState((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      const cur = ClientDataStore.getPreference<Record<string, any>>(SHEET_PREFS_KEY, {});
      ClientDataStore.setPreference(SHEET_PREFS_KEY, { ...cur, useShortCodes: next });
      return next;
    });
  };

  const setPageSize = (val: 'A4' | 'A3' | ((prev: 'A4' | 'A3') => 'A4' | 'A3')) => {
    setPageSizeState((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      const cur = ClientDataStore.getPreference<Record<string, any>>(SHEET_PREFS_KEY, {});
      ClientDataStore.setPreference(SHEET_PREFS_KEY, { ...cur, pageSize: next });
      return next;
    });
  };

  useEffect(() => {
    const onPrefSync = (evt: Event) => {
      const key = (evt as CustomEvent)?.detail?.key;
      if (key === '*' || key === 'user_preferences') {
        const saved = ClientDataStore.getPreference<{ useShortCodes?: boolean; pageSize?: 'A4' | 'A3' } | null>(SHEET_PREFS_KEY, null);
        if (saved && typeof saved === 'object') {
          if (typeof saved.useShortCodes === 'boolean') setUseShortCodesState(saved.useShortCodes);
          if (saved.pageSize === 'A4' || saved.pageSize === 'A3') setPageSizeState(saved.pageSize);
        }
      }
    };
    window.addEventListener('edusmart:data-changed', onPrefSync);
    return () => window.removeEventListener('edusmart:data-changed', onPrefSync);
  }, []);

  const [mobileDay, setMobileDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'>('Monday');
  const [mobileForceMatrix, setMobileForceMatrix] = useState(false);

  const offDutyKeySet = useMemo(() => {
    const s = new Set<string>();
    for (const item of offDutySlots || []) {
      if (item?.day && item?.period) {
        s.add(`${String(item.day).toLowerCase()}|${Number(item.period)}`);
      }
    }
    return s;
  }, [offDutySlots]);

  // Determine whether this sheet uses Junior School (Break L4, Lunch L8) or Primary (Break L5, Lunch L9)
  const isJuniorBand = useMemo(() => {
    if (mode === 'class') return Number(grade) >= 7;
    if (slots.length === 0) return false;
    const juniorCount = slots.filter((s) => Number(s.grade) >= 7).length;
    return juniorCount >= slots.length / 2;
  }, [mode, grade, slots]);

  const breakLessonCol = isJuniorBand ? 4 : 5;
  const lunchLessonCol = isJuniorBand ? 8 : 9;

  // Auto-resolve class teacher name for Class mode or teacher's homeroom for Teacher Break/Lunch duty
  const resolvedClassTeacher = useMemo(() => {
    if (classTeacherName && classTeacherName.trim()) return classTeacherName.trim();
    const allUsers = Storage.getUsers();
    if (mode === 'class') {
      const ct = allUsers.find(
        (u) =>
          (u.role === 'class_teacher' || (u.assignedRoles || []).includes('class_teacher')) &&
          Number(u.grade) === Number(grade) &&
          String(u.stream || '').toLowerCase() === String(stream || '').toLowerCase()
      );
      if (ct) return ct.name;
      const anyTeacherForClass = slots[0]?.teacherName;
      return anyTeacherForClass || 'Class Teacher';
    }
    // Teacher mode: find homeroom stream if this teacher is a class teacher
    const teacherLower = teacherName.toLowerCase();
    const matchedUser = allUsers.find((u) => u.name.toLowerCase() === teacherLower);
    return matchedUser?.name || teacherName;
  }, [classTeacherName, mode, grade, stream, slots, teacherName]);

  const teacherHomeroomTag = useMemo(() => {
    if (mode === 'class') return formatStreamShortTag(Number(grade), String(stream));
    const allUsers = Storage.getUsers();
    const teacherLower = teacherName.toLowerCase();
    const matchedUser = allUsers.find((u) => u.name.toLowerCase() === teacherLower);
    if (matchedUser?.grade && matchedUser?.stream) {
      return formatStreamShortTag(Number(matchedUser.grade), String(matchedUser.stream));
    }
    const firstSlot = slots[0];
    if (firstSlot) return formatStreamShortTag(Number(firstSlot.grade), String(firstSlot.stream));
    return '';
  }, [mode, grade, stream, teacherName, slots]);

  // Build 5-day × 11-lesson merged row cells
  const rowsByDay = useMemo(() => {
    const teacherDisplayShort = formatTeacherShortName(teacherName);
    const classTeacherDisplayShort = formatTeacherShortName(resolvedClassTeacher);
    const classShortTag = formatStreamShortTag(Number(grade), String(stream));

    return DAYS_ROWS.map(({ full: dayName, short: dayShort }) => {
      const daySlots = slots.filter((s) => s.dayOfWeek === dayName);

      // Map each slot to its 1..11 column
      const colSlotMap = new Map<number, TimetableSlot>();
      for (const s of daySlots) {
        const col = mapAcademicPeriodToLessonCol(s.period, isJuniorBand);
        if (col >= 1 && col <= 11 && col !== breakLessonCol && col !== lunchLessonCol) {
          if (!colSlotMap.has(col)) {
            colSlotMap.set(col, s);
          }
        }
      }

      // Build raw 11 columns
      const rawCells: CellItem[] = [];
      for (let col = 1; col <= 11; col++) {
        if (col === breakLessonCol) {
          rawCells.push({
            kind: 'break',
            colStart: col,
            colSpan: 1,
            title: 'BREAK',
            teacherText: mode === 'class' ? classTeacherDisplayShort : teacherDisplayShort,
            classTag: mode === 'class' ? classShortTag : teacherHomeroomTag,
          });
          continue;
        }
        if (col === lunchLessonCol) {
          rawCells.push({
            kind: 'lunch',
            colStart: col,
            colSpan: 1,
            title: 'LUNCH',
            teacherText: mode === 'class' ? classTeacherDisplayShort : teacherDisplayShort,
            classTag: mode === 'class' ? classShortTag : teacherHomeroomTag,
          });
          continue;
        }

        const slot = colSlotMap.get(col);
        const mappedAcademicPeriod = mapLessonColToAcademicPeriod(col, isJuniorBand);
        const isConfiguredOffDuty =
          mode === 'teacher' &&
          mappedAcademicPeriod !== null &&
          offDutyKeySet.has(`${dayName.toLowerCase()}|${mappedAcademicPeriod}`);

        if (slot) {
          const isOffDuty =
            isConfiguredOffDuty ||
            String(slot.subject || '').toLowerCase().includes('off duty') ||
            String(slot.notes || '').toLowerCase().includes('off duty');
          rawCells.push({
            kind: isOffDuty ? 'off_duty' : 'lesson',
            colStart: col,
            colSpan: 1,
            slot,
            title: isOffDuty
              ? 'OFF DUTY'
              : useShortCodes
              ? formatSubjectShortCode(slot.subject)
              : slot.subject,
            teacherText: formatTeacherShortName(
              slot.isReliefCover && slot.reliefTeacherName ? slot.reliefTeacherName : slot.teacherName
            ),
            classTag: formatStreamShortTag(Number(slot.grade), String(slot.stream)),
          });
        } else if (isConfiguredOffDuty) {
          rawCells.push({
            kind: 'off_duty',
            colStart: col,
            colSpan: 1,
            title: 'OFF DUTY',
          });
        } else {
          rawCells.push({
            kind: 'empty',
            colStart: col,
            colSpan: 1,
          });
        }
      }

      // Merge adjacent consecutive identical lessons (e.g., Double SWIM, Double ICT/ROBOTICS, Double CLUBS, OFF DUTY)
      const merged: CellItem[] = [];
      for (const cell of rawCells) {
        const prev = merged[merged.length - 1];
        const canMergeLesson =
          prev &&
          cell.kind === 'lesson' &&
          prev.kind === 'lesson' &&
          prev.slot &&
          cell.slot &&
          prev.slot.subject === cell.slot.subject &&
          prev.slot.grade === cell.slot.grade &&
          prev.slot.stream === cell.slot.stream &&
          prev.teacherText === cell.teacherText;

        const canMergeOffDuty = prev && cell.kind === 'off_duty' && prev.kind === 'off_duty';

        if (canMergeLesson || canMergeOffDuty) {
          prev.colSpan += 1;
        } else {
          merged.push({ ...cell });
        }
      }

      return { dayName, dayShort, cells: merged };
    });
  }, [
    slots,
    isJuniorBand,
    breakLessonCol,
    lunchLessonCol,
    mode,
    grade,
    stream,
    teacherName,
    resolvedClassTeacher,
    teacherHomeroomTag,
    useShortCodes,
    offDutyKeySet,
  ]);

  const schoolHeading = (currentTenant.name || 'SCHOOL').toUpperCase();
  const addressLine = (
    currentTenant.address ||
    `${schoolHeading}${currentTenant.registrationNumber ? `, ${currentTenant.registrationNumber}` : ''}`
  ).toUpperCase();
  const effectiveTerm = (termLabel || `${currentTenant.term || 'TERM 3 2026'}`).toUpperCase();
  const effectiveTheme = (themeText || currentTenant.motto || 'EXCELLENCE IN LEARNING').toUpperCase();
  const shortOrgTag = currentTenant.shortName
    ? `@${currentTenant.shortName.replace(/\s+/g, '').toUpperCase().slice(0, 6)}`
    : '@SCHOOL';

  const activeMobileRow = rowsByDay.find((r) => r.dayName === mobileDay) || rowsByDay[0];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs print:border-none print:rounded-none print:shadow-none">
      <style>{`@media print { @page { size: ${pageSize} landscape; margin: 8mm; } }`}</style>

      {/* Compact Action Toolbar (hidden on print) */}
      {!hideToolbar && (
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 print:hidden">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="font-bold text-slate-900">
              {mode === 'class' ? `Grade ${grade} ${stream} Official Sheet` : `${teacherName || 'Faculty'} Official Timetable Sheet`}
            </span>
            <span className="text-slate-300">·</span>
            <span className="font-mono text-[11px]">
              11-Lesson Matrix (8:20 – 15:40) · {isJuniorBand ? 'Junior Break L4 / Lunch L8' : 'Primary Break L5 / Lunch L9'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setUseShortCodes(true)}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  useShortCodes ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Short Codes
              </button>
              <button
                type="button"
                onClick={() => setUseShortCodes(false)}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  !useShortCodes ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Full Titles
              </button>
            </div>

            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setPageSize('A4')}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  pageSize === 'A4' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Print in A4 Landscape"
              >
                A4
              </button>
              <button
                type="button"
                onClick={() => setPageSize('A3')}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  pageSize === 'A3' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Print in A3 Landscape"
              >
                A3
              </button>
            </div>

            <button
              type="button"
              onClick={() => setMobileForceMatrix((v) => !v)}
              className="md:hidden px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-[11px] font-bold cursor-pointer"
            >
              {mobileForceMatrix ? 'Daily Cards' : 'Full Matrix'}
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print {pageSize}</span>
            </button>
          </div>
        </div>
      )}

      {/* Mobile-Friendly Daily Card View (visible on small screens unless toggled to full matrix; hidden on print) */}
      {!mobileForceMatrix && (
        <div className="md:hidden p-3 space-y-3 print:hidden">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2 min-w-0">
              <TenantSchoolLogo variant="emblem" size="sm" />
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-slate-900 uppercase truncate">{schoolHeading}</div>
                <div className="text-[11px] font-bold text-slate-600 truncate">
                  {mode === 'class' ? `Grade ${grade} ${stream}` : teacherName || 'Faculty Timetable'}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-1">
            {DAYS_ROWS.map((d) => (
              <button
                key={d.full}
                type="button"
                onClick={() => setMobileDay(d.full)}
                className={`py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  mobileDay === d.full ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {d.short}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {activeMobileRow?.cells.map((cell) => {
              const startDef = CLASSIC_11_LESSONS[cell.colStart - 1];
              const endDef = CLASSIC_11_LESSONS[Math.min(CLASSIC_11_LESSONS.length - 1, cell.colStart + cell.colSpan - 2)];
              const timeSpan =
                startDef && endDef
                  ? cell.colSpan > 1
                    ? `${startDef.startTime} – ${endDef.endTime} (${cell.colSpan}p)`
                    : startDef.timeRange
                  : `L${cell.colStart}`;
              if (cell.kind === 'empty') {
                return (
                  <div key={`${mobileDay}-${cell.colStart}`} className="flex items-center justify-between px-3 py-2 rounded-lg border border-dashed border-slate-200 text-[11px] text-slate-400">
                    <span className="font-mono">{timeSpan}</span>
                    <span>Free Period</span>
                  </div>
                );
              }
              if (cell.kind === 'break' || cell.kind === 'lunch') {
                return (
                  <div key={`${mobileDay}-${cell.colStart}`} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
                    <span className="font-mono text-[11px]">{timeSpan}</span>
                    <span>{cell.title}</span>
                  </div>
                );
              }
              if (cell.kind === 'off_duty') {
                return (
                  <div key={`${mobileDay}-${cell.colStart}`} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-extrabold tracking-widest">
                    <span className="font-mono text-[11px] tracking-normal text-slate-300">{timeSpan}</span>
                    <span>OFF DUTY</span>
                  </div>
                );
              }
              const slot = cell.slot!;
              return (
                <button
                  key={`${mobileDay}-${cell.colStart}`}
                  type="button"
                  onClick={() => onSelectSlot?.(slot)}
                  className="w-full text-left px-3 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="text-[11px] font-mono text-slate-500">{timeSpan}</div>
                    <div className="text-sm font-extrabold text-slate-900 truncate">{slot.subject}</div>
                    <div className="text-[11px] text-slate-600 truncate">
                      {mode === 'class' ? slot.teacherName : `Grade ${slot.grade} ${slot.stream}`} · {slot.roomName || 'Classroom'}
                    </div>
                  </div>
                  {cell.colSpan > 1 && (
                    <span className="shrink-0 px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-bold">
                      {cell.colSpan}× Block
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Printable Official Timetable Document */}
      <div className={`${mobileForceMatrix ? 'block' : 'hidden md:block'} print:block p-3 sm:p-5 bg-white overflow-x-auto print:p-0`}>
        <div className="min-w-[1040px] max-w-full mx-auto bg-white text-black font-sans">
          {/* OFFICIAL TOP HEADER (Tenant Logo Left + Centered Institutional Header + Class Teacher Right) */}
          <div className="relative flex items-start justify-between gap-4 pb-2">
            <div className="shrink-0 flex items-center pt-0.5">
              <TenantSchoolLogo variant="emblem" size="md" />
            </div>

            <div className="flex-1 text-center px-2">
              <h2 className="text-base sm:text-lg font-extrabold tracking-wide text-black uppercase font-serif leading-tight">
                {schoolHeading}
              </h2>
              <div className="text-sm sm:text-base font-extrabold text-black uppercase tracking-wide mt-0.5 font-serif">
                {mode === 'class' ? `${grade} ${String(stream || '').toUpperCase()}` : String(teacherName || 'FACULTY').toUpperCase()}
              </div>
              <div className="text-[10px] sm:text-[11px] font-medium text-neutral-800 uppercase tracking-tight mt-0.5">
                {addressLine}
              </div>
            </div>

            <div className="shrink-0 min-w-[140px] flex flex-col items-end justify-end self-end">
              {mode === 'class' && (
                <div className="text-[11px] font-medium text-neutral-900 text-right whitespace-nowrap">
                  Class teacher: <span className="font-semibold uppercase">{resolvedClassTeacher}</span>
                </div>
              )}
            </div>
          </div>

          {/* 11-LESSON HORIZONTAL MATRIX TABLE (Mo–Fri rows × LESSON 1–11 columns) */}
          <table className="w-full border-collapse border-[1.5px] border-black table-fixed bg-white">
            <thead>
              <tr className="border-b-[1.5px] border-black">
                <th className="w-[54px] border-r border-neutral-500 bg-white" />
                {CLASSIC_11_LESSONS.map((col) => (
                  <th
                    key={col.lessonNumber}
                    className="py-2 px-1 border-r border-neutral-500 last:border-r-0 text-center align-middle bg-white"
                  >
                    <div className="text-[12px] sm:text-[13px] font-extrabold tracking-tight text-black leading-tight">
                      {col.headerLabel}
                    </div>
                    <div className="text-[10px] sm:text-[11px] font-bold text-black tabular-nums leading-tight mt-0.5">
                      {col.timeRange}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rowsByDay.map(({ dayName, dayShort, cells }) => (
                <tr key={dayName} className="border-b border-neutral-500 last:border-b-0">
                  {/* Left Day Abbreviation Cell */}
                  <td className="border-r border-neutral-500 text-center align-middle py-4 px-1 bg-white">
                    <span className="text-xl sm:text-2xl font-extrabold text-black tracking-tight">
                      {dayShort}
                    </span>
                  </td>

                  {/* 11 Lesson Columns (with automatic colSpan for multi-period blocks) */}
                  {cells.map((cell) => {
                    const key = `${dayName}-${cell.colStart}`;

                    // 1. BREAK or LUNCH Cell
                    if (cell.kind === 'break' || cell.kind === 'lunch') {
                      if (mode === 'teacher') {
                        return (
                          <td
                            key={key}
                            colSpan={cell.colSpan}
                            className="border-r border-neutral-500 last:border-r-0 p-1.5 align-top h-[88px] bg-white"
                          >
                            <div className="h-full flex flex-col justify-between">
                              <div className="text-[10px] font-extrabold text-black uppercase leading-tight">
                                {cell.title}
                              </div>
                              <div className="text-[9.5px] font-medium text-neutral-800 uppercase leading-tight truncate">
                                {cell.teacherText}
                              </div>
                              <div className="text-[10px] font-bold text-black uppercase text-right leading-tight">
                                {cell.classTag}
                              </div>
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td
                          key={key}
                          colSpan={cell.colSpan}
                          className="border-r border-neutral-500 last:border-r-0 p-1.5 align-top h-[88px] bg-white"
                        >
                          <div className="h-full flex flex-col justify-between">
                            <div className="text-[9.5px] font-medium text-neutral-800 leading-none">
                              {cell.classTag}
                            </div>
                            <div className="text-[14px] font-extrabold text-black text-center tracking-tight leading-tight">
                              {cell.title}
                            </div>
                            <div className="text-[9px] font-medium text-neutral-800 uppercase text-center leading-tight line-clamp-2">
                              {cell.teacherText}
                            </div>
                          </div>
                        </td>
                      );
                    }

                    // 2. OFF DUTY Spanning Cell
                    if (cell.kind === 'off_duty') {
                      return (
                        <td
                          key={key}
                          colSpan={cell.colSpan}
                          className="border-r border-neutral-500 last:border-r-0 p-2 align-middle text-center h-[88px] bg-white"
                        >
                          <span className="text-sm font-extrabold tracking-[0.28em] text-black uppercase font-serif">
                            OFF DUTY
                          </span>
                        </td>
                      );
                    }

                    // 3. EMPTY / FREE PERIOD Cell
                    if (cell.kind === 'empty') {
                      const academicPeriod = mapLessonColToAcademicPeriod(cell.colStart, isJuniorBand);
                      return (
                        <td
                          key={key}
                          colSpan={cell.colSpan}
                          className="border-r border-neutral-500 last:border-r-0 p-1 align-middle h-[88px] bg-white group"
                        >
                          {canEdit && mode === 'class' && academicPeriod && onAddSlot ? (
                            <button
                              type="button"
                              onClick={() => onAddSlot(dayName, academicPeriod)}
                              title={`Add lesson on ${dayName} Lesson ${cell.colStart}`}
                              className="w-full h-full flex items-center justify-center text-transparent group-hover:text-slate-500 hover:bg-slate-50 rounded transition-colors cursor-pointer print:hidden"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          ) : null}
                        </td>
                      );
                    }

                    // 4. POPULATED LESSON CELL
                    const slot = cell.slot!;
                    const isSpanned = cell.colSpan > 1;

                    if (mode === 'teacher') {
                      // Image 1 layout: Top-left subject, middle-left (or centered when spanned) teacher, bottom-right Grade Stream
                      return (
                        <td
                          key={key}
                          colSpan={cell.colSpan}
                          onClick={() => onSelectSlot?.(slot)}
                          title={`${slot.subject} · Grade ${slot.grade} ${slot.stream} · ${slot.roomName || 'Classroom'}`}
                          className="border-r border-neutral-500 last:border-r-0 p-1.5 align-top h-[88px] bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <div className="h-full flex flex-col justify-between">
                            <div
                              className={`font-extrabold text-black uppercase leading-tight ${
                                isSpanned ? 'text-[15px] font-serif' : 'text-[10.5px]'
                              }`}
                            >
                              {cell.title}
                            </div>

                            <div
                              className={`text-[9.5px] font-medium text-neutral-800 uppercase leading-tight truncate ${
                                isSpanned ? 'text-center' : 'text-left'
                              }`}
                            >
                              {cell.teacherText}
                              {slot.isReliefCover ? ' (RELIEF)' : ''}
                            </div>

                            <div className="text-[10px] font-extrabold text-black uppercase text-right leading-tight">
                              {cell.classTag}
                            </div>
                          </div>
                        </td>
                      );
                    }

                    // Image 2 layout (Class Timetable): Top-left class tag (hidden on wide spans like SWIM/ICT/CLUBS), big centered subject, bottom-right teacher
                    return (
                      <td
                        key={key}
                        colSpan={cell.colSpan}
                        onClick={() => onSelectSlot?.(slot)}
                        title={`${slot.subject} · ${slot.teacherName} · ${slot.roomName || 'Classroom'}`}
                        className="border-r border-neutral-500 last:border-r-0 p-1.5 align-top h-[88px] bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <div className="h-full flex flex-col justify-between">
                          <div className="text-[9.5px] font-medium text-neutral-800 leading-none min-h-[10px]">
                            {!isSpanned ? cell.classTag : ''}
                          </div>

                          <div
                            className={`font-extrabold text-black text-center leading-tight tracking-tight px-0.5 ${
                              isSpanned
                                ? 'text-[16px]'
                                : useShortCodes
                                ? 'text-[13.5px]'
                                : 'text-[11px]'
                            }`}
                          >
                            {cell.title}
                          </div>

                          <div className="text-[9.5px] font-medium text-neutral-900 uppercase text-right leading-tight truncate">
                            {cell.teacherText}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* OFFICIAL BOTTOM FOOTER */}
          <div className="flex items-center justify-between pt-1.5 text-[10.5px] font-medium text-neutral-900">
            <div className="tracking-tight">
              <span className="font-semibold">{effectiveTerm}</span>
              <span className="ml-3">THEME:- {effectiveTheme}</span>
            </div>
            <div className="flex items-center gap-8 font-medium">
              <span>{shortOrgTag}</span>
              <span className="text-neutral-700">Official School Timetable</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
