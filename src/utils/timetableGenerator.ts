import { 
  User, 
  GradeLevel, 
  StreamName, 
  TimetableSlot, 
  SubjectName, 
  FixedLessonCondition, 
  SharedResourceFacility,
  PRIMARY_STREAMS,
  JUNIOR_STREAMS
} from '../types';
import { getCurriculumDemandForGrade } from './curriculumDemand';

export interface AutoGenOptions {
  gradesToGenerate?: GradeLevel[];
  activeStreamsOverride?: { [grade: number]: StreamName[] };
  preserveManualOverrides?: boolean;
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
  };
  conflictReport: string[];
}

const DAYS_OF_WEEK: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'> = [
  'Monday', 
  'Tuesday', 
  'Wednesday', 
  'Thursday', 
  'Friday'
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
  { period: 9, startTime: '14:50', endTime: '15:30' }
];

// Sample CBC Topics generator
const CBC_STRAND_TOPICS: Record<string, string[]> = {
  'Mathematics': [
    'Numbers & Place Value Operations',
    'Fractions, Decimals and Percentages',
    'Algebraic Expressions & Formulations',
    'Geometry, Angles & Polygons',
    'Measurement, Capacity and Volume',
    'Data Representation & Probability'
  ],
  'English': [
    'Intensive Reading & Narrative Analysis',
    'Grammar: Active vs Passive Voice',
    'Functional Composition Writing',
    'Speech Delivery, Phonetics & Intonation',
    'Literary Appreciation & Poetry Analysis'
  ],
  'Kiswahili': [
    'Kusikiliza na Kuzungumza: Midahalo',
    'Sarufi: Ngeli za Nomino na Nyakati',
    'Kusoma kwa Ufahamu: Riwaya na Ushairi',
    'Insha ya Kubuni na Tahariri'
  ],
  'Integrated Science': [
    'Cell Structure & Living Organisms',
    'Separation of Mixtures & Lab Chemistry',
    'Force, Energy Transformation & Circuits',
    'Human Reproductive Health & Nutrition',
    'Environmental Conservation & Pollution'
  ],
  'Science and Technology': [
    'Plant and Animal Classification',
    'Simple Machines & Mechanical Energy',
    'Digital Devices & Computational Logic',
    'Human Body Organ Systems'
  ],
  'Pretechnical Education': [
    'Safety in Technical Environments',
    'Materials: Metals, Plastics & Wood',
    'Technical Drawing & Geometric Isometric Projections',
    'Simple Electronic Circuits & Robotics'
  ],
  'Agriculture and Nutrition': [
    'Soil Fertility & Organic Composting',
    'Vegetable Nursery Bed Establishment',
    'Animal Production: Poultry & Rabbits',
    'Food Preservation & Culinary Hygiene'
  ],
  'Creative Arts & Sports': [
    'Visual Arts: Perspective Shading',
    'Kenyan Indigenous Music & Rhythm',
    'Athletics: Relay Baton Exchanges',
    'Gymnastics & Spatial Formations'
  ],
  'Creative Arts': [
    'Color Theory & Mosaic Composition',
    'Percussion Instruments & Folk Songs',
    'Clay Modelling & Functional Pottery'
  ],
  'Physical and Health Education': [
    'Cardiorespiratory Endurance Training',
    'First Aid, CPR & Sports Safety',
    'Football Passing & Defensive Positioning'
  ],
  'Social Studies': [
    'East African Geography & Climatic Zones',
    'Historical Migration & Cultural Integration',
    'Governance, Citizenship & Human Rights',
    'Trade, Mining and Industrial Development'
  ],
  'Religious Education': [
    'Scriptural Teachings on Moral Integrity',
    'Peace, Reconciliation & Community Service',
    'African Religious Heritage & Values'
  ],
  'Health Education': [
    'Adolescent Health, Hygiene & Wellness',
    'Preventive Healthcare & Disease Vectors',
    'Mental Health, Stress Management & Resilience'
  ]
};

const CBC_COMPETENCIES = [
  'Critical Thinking and Problem Solving',
  'Communication and Collaboration',
  'Digital Literacy',
  'Creativity and Imagination',
  'Self-Efficacy and Leadership',
  'Citizenship and Value Orientation'
];

/**
 * Core Algorithmic Timetable Auto-Generator
 */
export function generateAutomatedTimetable(
  teachers: User[],
  fixedConditions: FixedLessonCondition[],
  sharedFacilities: SharedResourceFacility[],
  options: AutoGenOptions = {}
): TimetableGenerationResult {
  const generatedSlots: TimetableSlot[] = [];
  const conflictReport: string[] = [];

  const targetGrades: GradeLevel[] = options.gradesToGenerate && options.gradesToGenerate.length > 0
    ? options.gradesToGenerate
    : [1, 2, 3, 4, 5, 6, 7, 8, 9];

  // Tracking matrices for zero-collision enforcement
  // 1. streamSchedule: Map<`${grade}-${stream}-${day}-${period}`, TimetableSlot>
  const streamSchedule = new Map<string, TimetableSlot>();
  
  // 2. teacherSchedule: Map<`${teacherName.toLowerCase()}-${day}-${period}`, string> -> streamKey
  const teacherSchedule = new Map<string, string>();

  // 3. facilitySchedule: Map<`${facilityName.toLowerCase()}-${day}-${period}`, string> -> streamKey
  const facilitySchedule = new Map<string, string>();

  // 4. streamSubjectDailyCount: Map<`${grade}-${stream}-${day}-${subject}`, number>
  const streamSubjectDailyCount = new Map<string, number>();

  // Stats accumulators
  let fixedPeriodsEnforced = 0;
  const sharedResourceBookings: Record<string, number> = {};
  sharedFacilities.forEach(f => {
    sharedResourceBookings[f.name] = 0;
  });

  const teacherWorkloads: Record<string, { periods: number; subjects: string[]; streams: string[] }> = {};
  teachers.forEach(t => {
    teacherWorkloads[t.name] = { periods: 0, subjects: [], streams: [] };
  });

  // Determine streams per grade
  const gradeStreamsMap: Map<GradeLevel, StreamName[]> = new Map();
  targetGrades.forEach(g => {
    if (options.activeStreamsOverride && options.activeStreamsOverride[g]) {
      gradeStreamsMap.set(g, options.activeStreamsOverride[g]);
    } else if (g >= 7) {
      // Focus on active demonstration streams
      gradeStreamsMap.set(g, ['Mara', 'Athi', 'Chania']);
    } else {
      gradeStreamsMap.set(g, ['Dove', 'Eagle']);
    }
  });

  let totalStreamsCount = 0;
  gradeStreamsMap.forEach(streams => {
    totalStreamsCount += streams.length;
  });

  // ========================================================
  // STEP 1: APPLY FIXED LESSONS / INSTITUTIONAL ANCHORS FIRST
  // ========================================================
  const activeFixed = fixedConditions.filter(c => c.isActive);

  activeFixed.forEach(condition => {
    const bell = BELL_PERIODS.find(b => b.period === condition.period);
    if (!bell) return;

    targetGrades.forEach(grade => {
      if (!condition.grades.includes(grade)) return;
      const streams = gradeStreamsMap.get(grade) || [];

      streams.forEach(stream => {
        if (condition.streams !== 'all' && !condition.streams.includes(stream)) {
          return;
        }

        const streamSlotKey = `${grade}-${stream}-${condition.dayOfWeek}-${condition.period}`;
        
        // Facility check
        const roomName = condition.roomName || (grade >= 7 ? `Junior Block Rm ${grade}` : `Primary Block Rm ${grade}`);
        const facilityKey = `${roomName.toLowerCase()}-${condition.dayOfWeek}-${condition.period}`;

        // Teacher check
        const teacherName = condition.teacherName || 'Faculty Lead';
        const teacherKey = `${teacherName.toLowerCase()}-${condition.dayOfWeek}-${condition.period}`;

        const fixedSlot: TimetableSlot = {
          id: `slot-fixed-${grade}-${stream.charAt(0).toLowerCase()}-${condition.dayOfWeek.slice(0, 3).toLowerCase()}-p${condition.period}`,
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
          teacherEmail: 'academic.office@edusmart.ac.ke',
          materialsNeeded: ['Official Learner Journal', 'Stationery Pouch'],
          competencies: ['Citizenship and Value Orientation', 'Self-Efficacy and Leadership']
        };

        streamSchedule.set(streamSlotKey, fixedSlot);
        generatedSlots.push(fixedSlot);
        fixedPeriodsEnforced++;

        if (condition.roomName) {
          facilitySchedule.set(facilityKey, `${grade} ${stream}`);
          if (sharedResourceBookings[condition.roomName] !== undefined) {
            sharedResourceBookings[condition.roomName]++;
          }
        }

        if (condition.teacherName && teacherWorkloads[condition.teacherName]) {
          teacherSchedule.set(teacherKey, `${grade} ${stream}`);
          teacherWorkloads[condition.teacherName].periods++;
          if (!teacherWorkloads[condition.teacherName].streams.includes(`Gr ${grade} ${stream}`)) {
            teacherWorkloads[condition.teacherName].streams.push(`Gr ${grade} ${stream}`);
          }
        }
      });
    });
  });

  // ========================================================
  // STEP 2: BUILD TEACHER ALLOCATION LOOKUP
  // ========================================================
  // Map<`${grade}-${stream}-${subject}`, User>
  const allocationMap = new Map<string, User>();

  teachers.forEach(teacher => {
    const streams = teacher.assignedStreams || [];
    const subjects = teacher.assignedSubjects || [];

    streams.forEach(as => {
      subjects.forEach(sub => {
        allocationMap.set(`${as.grade}-${as.stream}-${sub}`, teacher);
      });
    });

    // Also include primary grade/stream if set
    if (teacher.grade && teacher.stream && subjects.length > 0) {
      subjects.forEach(sub => {
        const key = `${teacher.grade}-${teacher.stream}-${sub}`;
        if (!allocationMap.has(key)) {
          allocationMap.set(key, teacher);
        }
      });
    }
  });

  // Helper to find best teacher for a stream and subject
  const resolveTeacherForClass = (grade: GradeLevel, stream: StreamName, subject: SubjectName): User => {
    // 1. Direct allocation (grade, stream, subject)
    const exact = allocationMap.get(`${grade}-${stream}-${subject}`);
    if (exact) return exact;

    // 2. Teacher assigned to this grade & stream who can teach general primary / junior
    const streamTeacher = teachers.find(t => 
      t.assignedStreams?.some(as => as.grade === grade && as.stream === stream)
    );
    if (streamTeacher && (!streamTeacher.assignedSubjects || streamTeacher.assignedSubjects.length === 0 || streamTeacher.assignedSubjects.includes(subject))) {
      return streamTeacher;
    }

    // 3. Teacher assigned to this subject anywhere
    const subjectTeacher = teachers.find(t => t.assignedSubjects?.includes(subject));
    if (subjectTeacher) return subjectTeacher;

    // 4. Fallback specialist assignments based on academic role
    if (subject.includes('Math')) {
      const mathT = teachers.find(t => t.name.includes('Kiprono') || t.name.includes('Mwangi'));
      if (mathT) return mathT;
    }
    if (subject.includes('Science') || subject.includes('Health')) {
      const sciT = teachers.find(t => t.name.includes('Mwangi') || t.name.includes('Kiprono'));
      if (sciT) return sciT;
    }
    if (subject.includes('English') || subject.includes('Kiswahili') || subject.includes('Social')) {
      const langT = teachers.find(t => t.name.includes('Akinyi') || t.name.includes('Ochieng'));
      if (langT) return langT;
    }
    if (subject.includes('Technical') || subject.includes('Agriculture') || subject.includes('Art')) {
      const techT = teachers.find(t => t.name.includes('Mutua') || t.name.includes('Kamau'));
      if (techT) return techT;
    }

    return teachers[0]; // Institutional default
  };

  // ========================================================
  // STEP 3: SCHEDULE REMAINING CURRICULUM PERIODS
  // ========================================================
  let unassignedDemands = 0;
  let conflictsResolved = 0;

  targetGrades.forEach(grade => {
    const streams = gradeStreamsMap.get(grade) || [];
    const demands = getCurriculumDemandForGrade(grade);

    streams.forEach(stream => {
      // Expand demands into individual lesson tickets
      const lessonTickets: Array<{
        subject: SubjectName;
        requiresSpecialistFacility?: boolean;
        preferredFacilityType?: string;
      }> = [];

      demands.forEach(d => {
        for (let i = 0; i < d.periodsPerWeek; i++) {
          lessonTickets.push({
            subject: d.subject,
            requiresSpecialistFacility: d.requiresSpecialistFacility,
            preferredFacilityType: d.preferredFacilityType
          });
        }
      });

      // Distribute lessons over periods 1..8 and days Monday..Friday
      lessonTickets.forEach((ticket, ticketIndex) => {
        const teacher = resolveTeacherForClass(grade, stream, ticket.subject);
        let scheduled = false;

        // Spread heuristic: start day search based on ticketIndex % 5 to distribute evenly
        const dayStartIndex = ticketIndex % DAYS_OF_WEEK.length;

        for (let dayOffset = 0; dayOffset < DAYS_OF_WEEK.length; dayOffset++) {
          if (scheduled) break;
          const day = DAYS_OF_WEEK[(dayStartIndex + dayOffset) % DAYS_OF_WEEK.length];

          // Check daily limit for this subject (max 2 per day, ideally 1)
          const dailySubjectKey = `${grade}-${stream}-${day}-${ticket.subject}`;
          const currentDailyCount = streamSubjectDailyCount.get(dailySubjectKey) || 0;
          if (currentDailyCount >= 2) {
            continue; // Distribute on another day
          }

          for (const bell of BELL_PERIODS) {
            const streamSlotKey = `${grade}-${stream}-${day}-${bell.period}`;
            
            // 1. Is stream free at this period?
            if (streamSchedule.has(streamSlotKey)) {
              continue;
            }

            // 2. Is teacher free at this period?
            const teacherKey = `${teacher.name.toLowerCase()}-${day}-${bell.period}`;
            if (teacherSchedule.has(teacherKey)) {
              conflictsResolved++;
              continue; // Teacher is teaching another stream
            }

            // 3. Resolve facility
            let chosenFacilityName = `Classroom ${grade}-${stream}`;
            let chosenFacilityKey: string | null = null;

            if (ticket.requiresSpecialistFacility && ticket.preferredFacilityType) {
              // Find matching facility from shared resources
              const candidates = sharedFacilities.filter(f => 
                f.type === ticket.preferredFacilityType || f.suitableSubjects.includes(ticket.subject)
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
                // If specialized facility is fully booked, fall back to class room
                chosenFacilityName = `Classroom ${grade}-${stream} (Practical Station)`;
                chosenFacilityKey = null;
                conflictsResolved++;
              }
            }

            // Book slot!
            const strandTopics = CBC_STRAND_TOPICS[ticket.subject] || ['CBC Core Concepts & Practical Application'];
            const strandTopic = strandTopics[ticketIndex % strandTopics.length];
            const compIndex = (ticketIndex + bell.period) % CBC_COMPETENCIES.length;

            const slot: TimetableSlot = {
              id: `slot-${grade}${stream.charAt(0).toLowerCase()}-${day.slice(0, 3).toLowerCase()}-p${bell.period}`,
              grade,
              stream,
              dayOfWeek: day,
              period: bell.period,
              startTime: bell.startTime,
              endTime: bell.endTime,
              subject: ticket.subject,
              teacherName: teacher.name,
              teacherEmail: teacher.email,
              roomName: chosenFacilityName,
              roomOrMeetLink: `https://meet.google.com/edu-gr${grade}-${stream.toLowerCase()}-${ticket.subject.slice(0, 4).toLowerCase()}`,
              strandTopic,
              notes: `CBC curriculum pacing · Formative lesson delivery for Grade ${grade} ${stream}.`,
              materialsNeeded: [
                'Learner Course Handbook',
                'Activity Exercise Notebook',
                chosenFacilityName.includes('Lab') ? 'Protective Lab Coat & Safety Eyewear' : 'Mathematical Geometrical Set'
              ],
              competencies: [CBC_COMPETENCIES[compIndex], CBC_COMPETENCIES[(compIndex + 1) % CBC_COMPETENCIES.length]]
            };

            // Register in lookup matrices
            streamSchedule.set(streamSlotKey, slot);
            teacherSchedule.set(teacherKey, `${grade} ${stream}`);
            if (chosenFacilityKey && chosenFacilityName && sharedResourceBookings[chosenFacilityName] !== undefined) {
              facilitySchedule.set(chosenFacilityKey, `${grade} ${stream}`);
              sharedResourceBookings[chosenFacilityName]++;
            }

            streamSubjectDailyCount.set(dailySubjectKey, currentDailyCount + 1);

            // Record teacher stats
            if (!teacherWorkloads[teacher.name]) {
              teacherWorkloads[teacher.name] = { periods: 0, subjects: [], streams: [] };
            }
            teacherWorkloads[teacher.name].periods++;
            if (!teacherWorkloads[teacher.name].subjects.includes(ticket.subject)) {
              teacherWorkloads[teacher.name].subjects.push(ticket.subject);
            }
            const streamLabel = `Gr ${grade} ${stream}`;
            if (!teacherWorkloads[teacher.name].streams.includes(streamLabel)) {
              teacherWorkloads[teacher.name].streams.push(streamLabel);
            }

            generatedSlots.push(slot);
            scheduled = true;
            break;
          }
        }

        if (!scheduled) {
          unassignedDemands++;
          conflictReport.push(
            `Unable to find an open slot for Grade ${grade} ${stream} (${ticket.subject}) without teacher or room collision.`
          );
        }
      });
    });
  });

  return {
    slots: generatedSlots,
    stats: {
      totalPeriods: generatedSlots.length,
      totalStreams: totalStreamsCount,
      fixedPeriodsEnforced,
      sharedResourceBookings,
      teacherWorkloads,
      conflictsResolved,
      unassignedDemands,
      generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString()
    },
    conflictReport
  };
}
