import {
  User,
  GradeLevel,
  StreamName,
  TimetableSlot,
  SubjectName,
  FixedLessonCondition,
  SharedResourceFacility,
} from '../types';
import { getCurriculumDemandForGrade, getSubjectDemandMeta, getSubjectWeeklyLessonLimit } from './curriculumDemand';

export interface ExplicitAllocatedSubject {
  grade: GradeLevel;
  stream: StreamName;
  subject: SubjectName;
  periodsPerWeek: number;
  teacherName?: string;
  teacherEmail?: string;
  requiresSpecialistFacility?: boolean;
  preferredFacilityType?: string;
}

export interface AutoGenOptions {
  gradesToGenerate?: GradeLevel[];
  activeStreamsOverride?: { [grade: number]: StreamName[] };
  preserveManualOverrides?: boolean;
  allocatedStreamSubjects?: ExplicitAllocatedSubject[];
}

export interface TimetableGenerationResult {
  slots: TimetableSlot[];
  stats: {
    totalPeriods: number;
    totalStreams: number;
    fixedPeriodsEnforced: number;
    sharedResourceBookings: Record<string, number>;
    teacherWorkloads: Record<string, { periods: number; subjects: string[]; streams: string[] }>;
    conflictsResolved: number;
    unassignedDemands: number;
    generatedAt: string;
    strictAllocation: {
      allocatedGrades: GradeLevel[];
      allocatedStreams: Array<{ grade: GradeLevel; stream: StreamName }>;
      allocatedSubjectLinks: number;
      requiredWeeklyPeriods: number;
      scheduledAllocatedPeriods: number;
      exactQuotaMatches: number;
      underAllocatedSubjects: number;
    };
  };
  conflictReport: string[];
}

const DAYS_OF_WEEK: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'> = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
];

interface BellPeriodDef {
  period: number;
  startTime: string;
  endTime: string;
}

const BELL_PERIODS: BellPeriodDef[] = [
  { period: 1, startTime: '08:00', endTime: '08:40' },
  { period: 2, startTime: '08:40', endTime: '09:20' },
  { period: 3, startTime: '09:20', endTime: '10:00' },
  { period: 4, startTime: '10:00', endTime: '10:40' },
  { period: 5, startTime: '11:10', endTime: '11:50' },
  { period: 6, startTime: '11:50', endTime: '12:30' },
  { period: 7, startTime: '12:30', endTime: '13:10' },
  { period: 8, startTime: '14:10', endTime: '14:50' },
  { period: 9, startTime: '14:50', endTime: '15:30' },
];

const CBC_STRAND_TOPICS: Record<string, string[]> = {
  Mathematics: [
    'Numbers & Place Value Operations',
    'Fractions, Decimals and Percentages',
    'Algebraic Expressions & Formulations',
    'Geometry, Angles & Polygons',
    'Measurement, Capacity and Volume',
    'Data Representation & Probability',
  ],
  English: [
    'Intensive Reading & Narrative Analysis',
    'Grammar: Active vs Passive Voice',
    'Functional Composition Writing',
    'Speech Delivery, Phonetics & Intonation',
    'Literary Appreciation & Poetry Analysis',
  ],
  Kiswahili: [
    'Kusikiliza na Kuzungumza: Midahalo',
    'Sarufi: Ngeli za Nomino na Nyakati',
    'Kusoma kwa Ufahamu: Riwaya na Ushairi',
    'Insha ya Kubuni na Tahariri',
  ],
  'Integrated Science': [
    'Cell Structure & Living Organisms',
    'Separation of Mixtures & Lab Chemistry',
    'Force, Energy Transformation & Circuits',
    'Human Reproductive Health & Nutrition',
    'Environmental Conservation & Pollution',
  ],
  'Science and Technology': [
    'Plant and Animal Classification',
    'Simple Machines & Mechanical Energy',
    'Digital Devices & Computational Logic',
    'Human Body Organ Systems',
  ],
  'Pretechnical Education': [
    'Safety in Technical Environments',
    'Materials: Metals, Plastics & Wood',
    'Technical Drawing & Geometric Isometric Projections',
    'Simple Electronic Circuits & Robotics',
  ],
  'Agriculture and Nutrition': [
    'Soil Fertility & Organic Composting',
    'Vegetable Nursery Bed Establishment',
    'Animal Production: Poultry & Rabbits',
    'Food Preservation & Culinary Hygiene',
  ],
  'Creative Arts & Sports': [
    'Visual Arts: Perspective Shading',
    'Kenyan Indigenous Music & Rhythm',
    'Athletics: Relay Baton Exchanges',
    'Gymnastics & Spatial Formations',
  ],
  'Creative Arts': [
    'Color Theory & Mosaic Composition',
    'Percussion Instruments & Folk Songs',
    'Clay Modelling & Functional Pottery',
  ],
  'Physical and Health Education': [
    'Cardiorespiratory Endurance Training',
    'First Aid, CPR & Sports Safety',
    'Football Passing & Defensive Positioning',
  ],
  'Social Studies': [
    'East African Geography & Climatic Zones',
    'Historical Migration & Cultural Integration',
    'Governance, Citizenship & Human Rights',
    'Trade, Mining and Industrial Development',
  ],
  'Religious Education': [
    'Scriptural Teachings on Moral Integrity',
    'Peace, Reconciliation & Community Service',
    'African Religious Heritage & Values',
  ],
  'Health Education': [
    'Adolescent Health, Hygiene & Wellness',
    'Preventive Healthcare & Disease Vectors',
    'Mental Health, Stress Management & Resilience',
  ],
  'Library Lesson': [
    'Information Literacy & Reference Catalogue Skills',
    'Guided Extensive Reading & Book Review',
    'CBC Digital Research & Citation Ethics',
    'Storytelling, Comprehension & Vocabulary Mastery',
  ],
  Arts: [
    'Drawing, Perspective & Visual Composition',
    'Sculpture, Clay Modelling & Applied Crafts',
    'Printmaking, Collage & Colour Harmony',
  ],
  Music: [
    'Kenyan Folk Songs, Rhythm & Percussion',
    'Vocal Harmony, Sight-Reading & Pitch',
    'Instrumental Ensemble & Musical Appreciation',
  ],
  Nutrition: [
    'Balanced Diets & Micronutrient Health',
    'Food Hygiene, Preservation & Safe Preparation',
    'Meal Planning for Growing Learners',
  ],
};

const CBC_COMPETENCIES = [
  'Critical Thinking and Problem Solving',
  'Communication and Collaboration',
  'Digital Literacy',
  'Creativity and Imagination',
  'Self-Efficacy and Leadership',
  'Citizenship and Value Orientation',
];

interface ResolvedAllocation {
  grade: GradeLevel;
  stream: StreamName;
  subject: SubjectName;
  periodsPerWeek: number;
  teacherName: string;
  teacherEmail: string;
  requiresSpecialistFacility?: boolean;
  preferredFacilityType?: string;
}

function allocKey(grade: number, stream: string, subject: string): string {
  return `${grade}::${stream.trim().toLowerCase()}::${subject.trim().toLowerCase()}`;
}

/**
 * Strictly Allocated Algorithmic Timetable Auto-Generator:
 * - Assigns lessons STRICTLY to grades, streams, and subjects that are explicitly allocated.
 * - Assigns each lesson STRICTLY to the allocated teacher (no unallocated fallbacks).
 * - Schedules STRICTLY as per the configured weekly lesson count (periodsPerWeek) for each subject.
 */
export function generateAutomatedTimetable(
  teachers: User[],
  fixedConditions: FixedLessonCondition[],
  sharedFacilities: SharedResourceFacility[],
  options: AutoGenOptions = {}
): TimetableGenerationResult {
  const generatedSlots: TimetableSlot[] = [];
  const conflictReport: string[] = [];

  const allowedGradesFilter =
    options.gradesToGenerate && options.gradesToGenerate.length > 0
      ? new Set<number>(options.gradesToGenerate.map(Number))
      : null;

  // ========================================================
  // STEP 1: BUILD STRICT ALLOCATION REGISTRY (Grade + Stream + Subject + Weekly Lessons)
  // ========================================================
  const strictAllocations = new Map<string, ResolvedAllocation>();

  // Build teacher lookup & strict authorization helper so no teacher can EVER appear for an unassigned subject, grade, or stream
  const teacherByEmailLower = new Map<string, User>();
  const teacherByNameLower = new Map<string, User>();
  for (const t of teachers) {
    if (t.email) teacherByEmailLower.set(t.email.trim().toLowerCase(), t);
    if (t.name) teacherByNameLower.set(t.name.trim().toLowerCase(), t);
  }

  const isTeacherStrictlyAuthorized = (
    teacher: User | undefined,
    grade: number,
    stream: string,
    subject: string
  ): { ok: boolean; reason?: string } => {
    if (!teacher) return { ok: true };
    const subLower = subject.trim().toLowerCase();
    const stLower = stream.trim().toLowerCase();

    if (Array.isArray(teacher.assignedSubjectAllocations)) {
      const exactMatch = teacher.assignedSubjectAllocations.some((a: any) => {
        if (Number(a?.grade) !== Number(grade)) return false;
        const aStreams: string[] = Array.isArray(a?.streams)
          ? a.streams
          : a?.stream
          ? [String(a.stream)]
          : [];
        const aSubjects: string[] = Array.isArray(a?.subjects)
          ? a.subjects
          : a?.subject
          ? [String(a.subject)]
          : [];
        return (
          aStreams.some((s) => String(s).trim().toLowerCase() === stLower) &&
          aSubjects.some((s) => String(s).trim().toLowerCase() === subLower)
        );
      });
      if (!exactMatch) {
        return {
          ok: false,
          reason: `${teacher.name} is not strictly assigned to Grade ${grade} ${stream} · ${subject}.`,
        };
      }
      return { ok: true };
    }

    if (Array.isArray(teacher.assignedSubjects) && teacher.assignedSubjects.length > 0) {
      const teachesSub = teacher.assignedSubjects.some(
        (s) => String(s || '').trim().toLowerCase() === subLower
      );
      if (!teachesSub) {
        return {
          ok: false,
          reason: `${teacher.name} is not assigned to teach ${subject}.`,
        };
      }
    }

    const legacyStreams = [...(teacher.assignedStreams || [])];
    if (teacher.grade && teacher.stream) {
      legacyStreams.push({ grade: teacher.grade, stream: teacher.stream });
    }
    if (legacyStreams.length > 0) {
      const teachesStream = legacyStreams.some(
        (st) => Number(st.grade) === Number(grade) && String(st.stream || '').trim().toLowerCase() === stLower
      );
      if (!teachesStream) {
        return {
          ok: false,
          reason: `${teacher.name} is not assigned to Grade ${grade} ${stream}.`,
        };
      }
    }

    return { ok: true };
  };

  // Priority A: Explicit Master Timetable / Stream-Subject allocations passed in options
  if (Array.isArray(options.allocatedStreamSubjects) && options.allocatedStreamSubjects.length > 0) {
    for (const item of options.allocatedStreamSubjects) {
      const grade = Number(item.grade) as GradeLevel;
      const stream = String(item.stream || '').trim() as StreamName;
      const subject = String(item.subject || '').trim() as SubjectName;
      if (!grade || !stream || !subject) continue;
      if (allowedGradesFilter && !allowedGradesFilter.has(grade)) continue;
      if (
        options.activeStreamsOverride &&
        options.activeStreamsOverride[grade] &&
        !options.activeStreamsOverride[grade].some((s) => s.toLowerCase() === stream.toLowerCase())
      ) {
        continue;
      }

      const key = allocKey(grade, stream, subject);
      if (strictAllocations.has(key)) continue;

      const tName = item.teacherName?.trim() || '';
      const tEmail = item.teacherEmail?.trim() || '';
      const matchedTeacher =
        (tEmail ? teacherByEmailLower.get(tEmail.toLowerCase()) : undefined) ||
        (tName ? teacherByNameLower.get(tName.toLowerCase()) : undefined);
      if (matchedTeacher) {
        const auth = isTeacherStrictlyAuthorized(matchedTeacher, grade, stream, subject);
        if (!auth.ok) {
          conflictReport.push(`Blocked out-of-scope allocation: ${auth.reason}`);
          continue;
        }
      }

      const demandMeta = getSubjectDemandMeta(grade, subject);
      const periodsPerWeek = getSubjectWeeklyLessonLimit(grade, subject, item.periodsPerWeek);
      strictAllocations.set(key, {
        grade,
        stream,
        subject,
        periodsPerWeek,
        teacherName: tName,
        teacherEmail: tEmail || 'faculty@edusmart.ac.ke',
        requiresSpecialistFacility: item.requiresSpecialistFacility ?? demandMeta?.requiresSpecialistFacility,
        preferredFacilityType: item.preferredFacilityType ?? demandMeta?.preferredFacilityType,
      });
    }
  }

  // Priority B: Explicit Faculty Grade + Stream + Subject Allocations (assignedSubjectAllocations)
  for (const teacher of teachers) {
    const explicitAllocs = teacher.assignedSubjectAllocations || [];
    for (const a of explicitAllocs as any[]) {
      const grade = Number(a.grade) as GradeLevel;
      const aStreams: string[] = Array.isArray(a?.streams)
        ? a.streams
        : a?.stream
        ? [String(a.stream)]
        : [];
      const aSubjects: string[] = Array.isArray(a?.subjects)
        ? a.subjects
        : a?.subject
        ? [String(a.subject)]
        : [];
      for (const rawStream of aStreams) {
        for (const rawSubj of aSubjects) {
          const stream = String(rawStream || '').trim() as StreamName;
          const subject = String(rawSubj || '').trim() as SubjectName;
          if (!grade || !stream || !subject) continue;
          if (allowedGradesFilter && !allowedGradesFilter.has(grade)) continue;
          if (
            options.activeStreamsOverride &&
            options.activeStreamsOverride[grade] &&
            !options.activeStreamsOverride[grade].some((s) => s.toLowerCase() === stream.toLowerCase())
          ) {
            continue;
          }

          const key = allocKey(grade, stream, subject);
          const existing = strictAllocations.get(key);
          if (existing) {
            if (!existing.teacherName) {
              existing.teacherName = teacher.name;
              existing.teacherEmail = teacher.email || existing.teacherEmail;
            }
            continue;
          }

          const demandMeta = getSubjectDemandMeta(grade, subject);
          const periodsPerWeek = getSubjectWeeklyLessonLimit(grade, subject, a.periodsPerWeek);
          strictAllocations.set(key, {
            grade,
            stream,
            subject,
            periodsPerWeek,
            teacherName: teacher.name,
            teacherEmail: teacher.email || 'faculty@edusmart.ac.ke',
            requiresSpecialistFacility: demandMeta?.requiresSpecialistFacility,
            preferredFacilityType: demandMeta?.preferredFacilityType,
          });
        }
      }
    }
  }

  // Priority C: Legacy teacher assignedStreams × assignedSubjects ONLY for teachers without assignedSubjectAllocations array
  for (const teacher of teachers) {
    if (Array.isArray(teacher.assignedSubjectAllocations)) {
      continue;
    }
    const streams = teacher.assignedStreams || [];
    const subjects = teacher.assignedSubjects || [];
    const streamTargets: Array<{ grade: GradeLevel; stream: StreamName }> = [...streams];
    if (teacher.grade && teacher.stream) {
      const hasPrimary = streamTargets.some(
        (st) => st.grade === teacher.grade && st.stream.toLowerCase() === String(teacher.stream).toLowerCase()
      );
      if (!hasPrimary) {
        streamTargets.push({ grade: teacher.grade, stream: teacher.stream });
      }
    }

    for (const st of streamTargets) {
      const grade = Number(st.grade) as GradeLevel;
      const stream = String(st.stream || '').trim() as StreamName;
      if (!grade || !stream) continue;
      if (allowedGradesFilter && !allowedGradesFilter.has(grade)) continue;
      if (
        options.activeStreamsOverride &&
        options.activeStreamsOverride[grade] &&
        !options.activeStreamsOverride[grade].some((s) => s.toLowerCase() === stream.toLowerCase())
      ) {
        continue;
      }

      const validGradeSubjects = new Set(getCurriculumDemandForGrade(grade).map((d) => String(d.subject).trim().toLowerCase()));
      for (const sub of subjects) {
        const subject = String(sub || '').trim() as SubjectName;
        if (!subject) continue;
        if (validGradeSubjects.size > 0 && !validGradeSubjects.has(subject.toLowerCase())) continue;
        const key = allocKey(grade, stream, subject);
        if (strictAllocations.has(key)) continue;

        const demandMeta = getSubjectDemandMeta(grade, subject);
        const periodsPerWeek = getSubjectWeeklyLessonLimit(grade, subject);
        strictAllocations.set(key, {
          grade,
          stream,
          subject,
          periodsPerWeek,
          teacherName: teacher.name,
          teacherEmail: teacher.email || 'faculty@edusmart.ac.ke',
          requiresSpecialistFacility: demandMeta?.requiresSpecialistFacility,
          preferredFacilityType: demandMeta?.preferredFacilityType,
        });
      }
    }
  }

  // Derive allocated Grades & Streams STRICTLY from active allocations (never invent unallocated streams!)
  const gradeStreamsMap = new Map<GradeLevel, StreamName[]>();
  const allocatedStreamsList: Array<{ grade: GradeLevel; stream: StreamName }> = [];
  const seenStreamKeys = new Set<string>();

  for (const alloc of strictAllocations.values()) {
    const sk = `${alloc.grade}::${alloc.stream.toLowerCase()}`;
    if (!seenStreamKeys.has(sk)) {
      seenStreamKeys.add(sk);
      allocatedStreamsList.push({ grade: alloc.grade, stream: alloc.stream });
      const arr = gradeStreamsMap.get(alloc.grade) || [];
      arr.push(alloc.stream);
      gradeStreamsMap.set(alloc.grade, arr);
    }
  }

  const allocatedGrades = Array.from(gradeStreamsMap.keys()).sort((a, b) => a - b);
  allocatedGrades.forEach((g) => {
    const arr = gradeStreamsMap.get(g) || [];
    arr.sort((a, b) => a.localeCompare(b));
    gradeStreamsMap.set(g, arr);
  });
  allocatedStreamsList.sort((a, b) => (a.grade !== b.grade ? a.grade - b.grade : a.stream.localeCompare(b.stream)));

  // Tracking matrices for zero-collision enforcement
  const streamSchedule = new Map<string, TimetableSlot>();
  const teacherSchedule = new Map<string, string>();
  const facilitySchedule = new Map<string, string>();
  const streamSubjectDailyCount = new Map<string, number>();
  const scheduledWeeklyCountByAlloc = new Map<string, number>();

  let fixedPeriodsEnforced = 0;
  const sharedResourceBookings: Record<string, number> = {};
  sharedFacilities.forEach((f) => {
    sharedResourceBookings[f.name] = 0;
  });

  const teacherWorkloads: Record<string, { periods: number; subjects: string[]; streams: string[] }> = {};
  teachers.forEach((t) => {
    teacherWorkloads[t.name] = { periods: 0, subjects: [], streams: [] };
  });

  if (strictAllocations.size === 0) {
    conflictReport.push(
      'No active Grade, Stream, and Subject allocations found. Assign teachers to specific grades, streams, and subjects before generating the timetable.'
    );
    return {
      slots: [],
      stats: {
        totalPeriods: 0,
        totalStreams: 0,
        fixedPeriodsEnforced: 0,
        sharedResourceBookings,
        teacherWorkloads,
        conflictsResolved: 0,
        unassignedDemands: 0,
        generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString(),
        strictAllocation: {
          allocatedGrades: [],
          allocatedStreams: [],
          allocatedSubjectLinks: 0,
          requiredWeeklyPeriods: 0,
          scheduledAllocatedPeriods: 0,
          exactQuotaMatches: 0,
          underAllocatedSubjects: 0,
        },
      },
      conflictReport,
    };
  }

  // ========================================================
  // STEP 2: APPLY FIXED LESSONS ONLY TO ALLOCATED GRADES & STREAMS
  //         AND COUNT MATCHING SUBJECTS AGAINST WEEKLY QUOTA
  // ========================================================
  const activeFixed = fixedConditions.filter((c) => c.isActive);

  activeFixed.forEach((condition) => {
    const bell = BELL_PERIODS.find((b) => b.period === condition.period);
    if (!bell) return;

    allocatedGrades.forEach((grade) => {
      if (!condition.grades.includes(grade)) return;
      const streams = gradeStreamsMap.get(grade) || [];

      streams.forEach((stream) => {
        if (
          condition.streams !== 'all' &&
          !condition.streams.some((s) => s.toLowerCase() === stream.toLowerCase())
        ) {
          return;
        }

        const streamSlotKey = `${grade}-${stream}-${condition.dayOfWeek}-${condition.period}`;
        if (streamSchedule.has(streamSlotKey)) return;

        // If this fixed lesson is for a curriculum subject allocated to this stream, enforce weekly cap & allocated teacher!
        const matchingAllocKey = allocKey(grade, stream, String(condition.subject || ''));
        const matchingAlloc = strictAllocations.get(matchingAllocKey);
        if (matchingAlloc) {
          const already = scheduledWeeklyCountByAlloc.get(matchingAllocKey) || 0;
          if (already >= matchingAlloc.periodsPerWeek) {
            conflictReport.push(
              `Skipped extra fixed lesson "${condition.title}" for Grade ${grade} ${stream} (${matchingAlloc.subject}): weekly quota of ${matchingAlloc.periodsPerWeek} period(s) already met.`
            );
            return;
          }
        }

        const roomName = condition.roomName || (grade >= 7 ? `Junior Block Rm ${grade}` : `Primary Block Rm ${grade}`);
        const facilityKey = `${roomName.toLowerCase()}-${condition.dayOfWeek}-${condition.period}`;
        const teacherName = matchingAlloc?.teacherName || condition.teacherName || 'Faculty Lead';
        const isNamedTeacher =
          teacherName.trim().length > 0 &&
          teacherName.toLowerCase() !== 'faculty lead' &&
          teacherName.toLowerCase() !== 'all staff';
        const teacherKey = `${teacherName.toLowerCase()}-${condition.dayOfWeek}-${condition.period}`;

        // Strict assignment scope guard on fixed lessons with a named teacher
        if (isNamedTeacher && condition.subject) {
          const matchedT = teacherByNameLower.get(teacherName.trim().toLowerCase());
          if (matchedT) {
            const auth = isTeacherStrictlyAuthorized(matchedT, grade, stream, String(condition.subject));
            if (!auth.ok) {
              conflictReport.push(
                `Blocked out-of-scope fixed lesson "${condition.title}" (${condition.dayOfWeek} P${condition.period}): ${auth.reason}`
              );
              return;
            }
          }
        }

        // Strictly prevent any teacher from having more than 1 lesson at a time
        if (isNamedTeacher && teacherSchedule.has(teacherKey)) {
          conflictReport.push(
            `Blocked double-booking on fixed lesson "${condition.title}" for Grade ${grade} ${stream} (${condition.dayOfWeek} P${condition.period}): ${teacherName} is already teaching ${teacherSchedule.get(teacherKey)} at that time.`
          );
          return;
        }

        const fixedSlot: TimetableSlot = {
          id: `slot-fixed-${grade}-${stream.toLowerCase().replace(/\s+/g, '')}-${condition.dayOfWeek.slice(0, 3).toLowerCase()}-p${condition.period}`,
          grade,
          stream,
          dayOfWeek: condition.dayOfWeek,
          period: condition.period,
          startTime: bell.startTime,
          endTime: bell.endTime,
          subject: condition.subject as SubjectName,
          teacherName,
          roomName,
          roomOrMeetLink: `https://meet.google.com/edu-gr${grade}-${stream.toLowerCase()}-anchor`,
          strandTopic: condition.title,
          notes: condition.notes || 'Institutional Anchor Period (Locked Before Publication)',
          teacherEmail: matchingAlloc?.teacherEmail || 'academic.office@edusmart.ac.ke',
          materialsNeeded: ['Official Learner Journal', 'Stationery Pouch'],
          competencies: ['Citizenship and Value Orientation', 'Self-Efficacy and Leadership'],
        };

        streamSchedule.set(streamSlotKey, fixedSlot);
        generatedSlots.push(fixedSlot);
        fixedPeriodsEnforced++;

        if (matchingAlloc) {
          scheduledWeeklyCountByAlloc.set(
            matchingAllocKey,
            (scheduledWeeklyCountByAlloc.get(matchingAllocKey) || 0) + 1
          );
          const dailySubjectKey = `${grade}-${stream}-${condition.dayOfWeek}-${matchingAlloc.subject}`;
          streamSubjectDailyCount.set(dailySubjectKey, (streamSubjectDailyCount.get(dailySubjectKey) || 0) + 1);
        }

        if (condition.roomName) {
          facilitySchedule.set(facilityKey, `${grade} ${stream}`);
          if (sharedResourceBookings[condition.roomName] !== undefined) {
            sharedResourceBookings[condition.roomName]++;
          }
        }

        if (isNamedTeacher) {
          teacherSchedule.set(teacherKey, `Grade ${grade} ${stream}`);
          if (teacherWorkloads[teacherName]) {
            teacherWorkloads[teacherName].periods++;
            if (!teacherWorkloads[teacherName].streams.includes(`Gr ${grade} ${stream}`)) {
              teacherWorkloads[teacherName].streams.push(`Gr ${grade} ${stream}`);
            }
          }
        }
      });
    });
  });

  // ========================================================
  // STEP 3: SCHEDULE ALLOCATED SUBJECTS STRICTLY AS PER WEEKLY QUOTA
  // ========================================================
  let unassignedDemands = 0;
  let conflictsResolved = 0;
  let totalRequiredWeeklyPeriods = 0;

  for (const alloc of strictAllocations.values()) {
    totalRequiredWeeklyPeriods += alloc.periodsPerWeek;
  }

  // Group allocations by stream, ordered most-constrained first (higher weekly count / specialist rooms first)
  allocatedStreamsList.forEach(({ grade, stream }) => {
    const streamAllocs = Array.from(strictAllocations.values())
      .filter((a) => a.grade === grade && a.stream.toLowerCase() === stream.toLowerCase())
      .sort((a, b) => b.periodsPerWeek - a.periodsPerWeek || a.subject.localeCompare(b.subject));

    // Check if total weekly periods for this stream exceed weekly bell capacity (45 periods)
    const streamTotalRequired = streamAllocs.reduce((sum, a) => sum + a.periodsPerWeek, 0);
    const maxWeeklySlots = DAYS_OF_WEEK.length * BELL_PERIODS.length;
    if (streamTotalRequired > maxWeeklySlots) {
      conflictReport.push(
        `Grade ${grade} ${stream} has ${streamTotalRequired} allocated periods/week across ${streamAllocs.length} subjects, exceeding the ${maxWeeklySlots} weekly bell periods.`
      );
    }

    const lessonTickets: Array<{ alloc: ResolvedAllocation; key: string; occurrence: number }> = [];
    streamAllocs.forEach((alloc) => {
      const key = allocKey(alloc.grade, alloc.stream, alloc.subject);
      if (!alloc.teacherName) {
        const remainingForUnassigned = Math.max(0, alloc.periodsPerWeek - (scheduledWeeklyCountByAlloc.get(key) || 0));
        unassignedDemands += remainingForUnassigned;
        conflictReport.push(
          `Skipped Grade ${grade} ${stream} · ${alloc.subject} (${remainingForUnassigned} lessons/week): no allocated subject teacher assigned.`
        );
        return;
      }
      const alreadyFixed = scheduledWeeklyCountByAlloc.get(key) || 0;
      const remainingToSchedule = Math.max(0, alloc.periodsPerWeek - alreadyFixed);
      for (let i = 0; i < remainingToSchedule; i++) {
        lessonTickets.push({ alloc, key, occurrence: alreadyFixed + i });
      }
    });

    lessonTickets.forEach((ticket, ticketIndex) => {
      const { alloc, key } = ticket;
      const currentScheduledForAlloc = scheduledWeeklyCountByAlloc.get(key) || 0;
      // Strict hard ceiling: never exceed periodsPerWeek for this (grade, stream, subject)
      if (currentScheduledForAlloc >= alloc.periodsPerWeek) {
        return;
      }

      let scheduled = false;
      const dayStartIndex = ticketIndex % DAYS_OF_WEEK.length;

      // Two passes: pass 1 prefers max 1 period/day for spread; pass 2 allows up to 2 periods/day when weekly quota > 5 or tight slots
      const dailyCaps = [1, 2];

      for (const dailyCap of dailyCaps) {
        if (scheduled) break;

        for (let dayOffset = 0; dayOffset < DAYS_OF_WEEK.length; dayOffset++) {
          if (scheduled) break;
          const day = DAYS_OF_WEEK[(dayStartIndex + dayOffset) % DAYS_OF_WEEK.length];

          const dailySubjectKey = `${grade}-${stream}-${day}-${alloc.subject}`;
          const currentDailyCount = streamSubjectDailyCount.get(dailySubjectKey) || 0;
          if (currentDailyCount >= dailyCap) {
            continue;
          }

          for (const bell of BELL_PERIODS) {
            const streamSlotKey = `${grade}-${stream}-${day}-${bell.period}`;
            if (streamSchedule.has(streamSlotKey)) {
              continue;
            }

            const teacherKey = `${alloc.teacherName.toLowerCase()}-${day}-${bell.period}`;
            if (teacherSchedule.has(teacherKey)) {
              conflictsResolved++;
              continue;
            }

            // Resolve facility
            let chosenFacilityName = `Classroom ${grade}-${stream}`;
            let chosenFacilityKey: string | null = null;

            const isLibraryLesson = String(alloc.subject).toLowerCase().includes('library');
            if (isLibraryLesson) {
              const libCandidates = sharedFacilities.filter(
                (f) => f.type === 'library' || f.name.toLowerCase().includes('library')
              );
              let pickedLib: SharedResourceFacility | null = null;
              for (const cand of libCandidates) {
                const facKey = `${cand.name.toLowerCase()}-${day}-${bell.period}`;
                if (!facilitySchedule.has(facKey)) {
                  pickedLib = cand;
                  chosenFacilityKey = facKey;
                  break;
                }
              }
              chosenFacilityName = pickedLib ? pickedLib.name : 'Main Library Reading Hall';
            } else if (alloc.requiresSpecialistFacility && alloc.preferredFacilityType) {
              const candidates = sharedFacilities.filter(
                (f) => f.type === alloc.preferredFacilityType || f.suitableSubjects.includes(alloc.subject)
              );
              let availableFacility: SharedResourceFacility | null = null;
              for (const cand of candidates) {
                const facKey = `${cand.name.toLowerCase()}-${day}-${bell.period}`;
                if (!facilitySchedule.has(facKey)) {
                  availableFacility = cand;
                  chosenFacilityKey = facKey;
                  break;
                }
              }
              if (availableFacility) {
                chosenFacilityName = availableFacility.name;
              } else {
                chosenFacilityName = `Classroom ${grade}-${stream} (Practical Station)`;
                chosenFacilityKey = null;
                conflictsResolved++;
              }
            }

            const strandTopics = CBC_STRAND_TOPICS[alloc.subject] || ['CBC Core Concepts & Practical Application'];
            const strandTopic = strandTopics[ticket.occurrence % strandTopics.length];
            const compIndex = (ticketIndex + bell.period) % CBC_COMPETENCIES.length;

            const slot: TimetableSlot = {
              id: `slot-${grade}${stream.toLowerCase().replace(/\s+/g, '')}-${day.slice(0, 3).toLowerCase()}-p${bell.period}`,
              grade,
              stream,
              dayOfWeek: day,
              period: bell.period,
              startTime: bell.startTime,
              endTime: bell.endTime,
              subject: alloc.subject,
              teacherName: alloc.teacherName,
              teacherEmail: alloc.teacherEmail,
              roomName: chosenFacilityName,
              roomOrMeetLink: `https://meet.google.com/edu-gr${grade}-${stream.toLowerCase()}-${alloc.subject.slice(0, 4).toLowerCase()}`,
              strandTopic,
              notes: `CBC curriculum pacing (${ticket.occurrence + 1}/${alloc.periodsPerWeek} weekly lessons) · Grade ${grade} ${stream}.`,
              materialsNeeded: [
                'Learner Course Handbook',
                'Activity Exercise Notebook',
                chosenFacilityName.includes('Lab') ? 'Protective Lab Coat & Safety Eyewear' : 'Mathematical Geometrical Set',
              ],
              competencies: [
                CBC_COMPETENCIES[compIndex],
                CBC_COMPETENCIES[(compIndex + 1) % CBC_COMPETENCIES.length],
              ],
            };

            streamSchedule.set(streamSlotKey, slot);
            teacherSchedule.set(teacherKey, `${grade} ${stream}`);
            if (chosenFacilityKey && chosenFacilityName && sharedResourceBookings[chosenFacilityName] !== undefined) {
              facilitySchedule.set(chosenFacilityKey, `${grade} ${stream}`);
              sharedResourceBookings[chosenFacilityName]++;
            }

            streamSubjectDailyCount.set(dailySubjectKey, currentDailyCount + 1);
            scheduledWeeklyCountByAlloc.set(key, (scheduledWeeklyCountByAlloc.get(key) || 0) + 1);

            if (!teacherWorkloads[alloc.teacherName]) {
              teacherWorkloads[alloc.teacherName] = { periods: 0, subjects: [], streams: [] };
            }
            teacherWorkloads[alloc.teacherName].periods++;
            if (!teacherWorkloads[alloc.teacherName].subjects.includes(alloc.subject)) {
              teacherWorkloads[alloc.teacherName].subjects.push(alloc.subject);
            }
            const streamLabel = `Gr ${grade} ${stream}`;
            if (!teacherWorkloads[alloc.teacherName].streams.includes(streamLabel)) {
              teacherWorkloads[alloc.teacherName].streams.push(streamLabel);
            }

            generatedSlots.push(slot);
            scheduled = true;
            break;
          }
        }
      }

      if (!scheduled) {
        unassignedDemands++;
        conflictReport.push(
          `Unable to place lesson ${ticket.occurrence + 1}/${alloc.periodsPerWeek} for Grade ${grade} ${stream} · ${alloc.subject} (${alloc.teacherName}) without teacher or stream clash.`
        );
      }
    });
  });

  // Compute strict weekly quota compliance summary
  let exactQuotaMatches = 0;
  let underAllocatedSubjects = 0;
  let scheduledAllocatedPeriods = 0;

  for (const [key, alloc] of strictAllocations.entries()) {
    const placed = scheduledWeeklyCountByAlloc.get(key) || 0;
    scheduledAllocatedPeriods += placed;
    if (placed === alloc.periodsPerWeek) {
      exactQuotaMatches++;
    } else if (placed < alloc.periodsPerWeek) {
      underAllocatedSubjects++;
    }
  }

  return {
    slots: generatedSlots,
    stats: {
      totalPeriods: generatedSlots.length,
      totalStreams: allocatedStreamsList.length,
      fixedPeriodsEnforced,
      sharedResourceBookings,
      teacherWorkloads,
      conflictsResolved,
      unassignedDemands,
      generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString(),
      strictAllocation: {
        allocatedGrades,
        allocatedStreams: allocatedStreamsList,
        allocatedSubjectLinks: strictAllocations.size,
        requiredWeeklyPeriods: totalRequiredWeeklyPeriods,
        scheduledAllocatedPeriods,
        exactQuotaMatches,
        underAllocatedSubjects,
      },
    },
    conflictReport,
  };
}
