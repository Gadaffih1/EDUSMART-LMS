import { CoordinatorSchemeOfWork, CoordinatorSyllabusTopic, CoordinatorCBAModeration } from '../types';

export const INITIAL_COORDINATOR_SYLLABUS_TRACKING: CoordinatorSyllabusTopic[] = [
  {
    id: 'syl-01',
    grade: 4,
    subject: 'Mathematics',
    strand: 'Numbers & Operations',
    subStrand: 'Fractions & Equivalent Quantities',
    expectedWeek: 7,
    completedWeek: 7,
    status: 'on_schedule',
    leadTeacher: 'Ms. Sarah Mwangi',
    competencyTarget: 'Critical thinking in splitting concrete objects into fractional units',
    coordinatorRemarks: 'Instructional pace strictly aligned with Term 2 KICD syllabus standards.',
    comments: [
      {
        id: 'comm-syl-1',
        author: 'Mrs. Beatrice Omari',
        authorRole: 'Curriculum Coordinator',
        comment: 'Teacher manipulative kits utilized effectively during Tuesday observation.',
        createdAt: '2026-10-06T10:00:00Z'
      }
    ]
  },
  {
    id: 'syl-02',
    grade: 4,
    subject: 'Integrated Science',
    strand: 'Living Things & Ecosystems',
    subStrand: 'Plant Nutrition & Water Transport',
    expectedWeek: 7,
    completedWeek: 6,
    status: 'lagging',
    leadTeacher: 'Mr. David Omondi',
    competencyTarget: 'Practical experiment setup with food dye and celery stalks',
    coordinatorRemarks: 'Lagging by 1 week due to missed double period during sports gala.',
    comments: [
      {
        id: 'comm-syl-2',
        author: 'Mrs. Beatrice Omari',
        authorRole: 'Curriculum Coordinator',
        comment: 'Catch-up remedial practical scheduled for Friday 2:00 PM.',
        createdAt: '2026-10-07T14:20:00Z'
      }
    ]
  },
  {
    id: 'syl-03',
    grade: 7,
    subject: 'Computer Studies',
    strand: 'Computational Thinking',
    subStrand: 'Scratch Algorithms & Loop Iterations',
    expectedWeek: 7,
    completedWeek: 8,
    status: 'ahead',
    leadTeacher: 'Mr. John Kamau',
    competencyTarget: 'Sprite broadcast messaging and variable scorekeeper counters',
    coordinatorRemarks: 'Ahead of target schedule due to active lunchtime coding lab attendance.',
    comments: [
      {
        id: 'comm-syl-3',
        author: 'Mrs. Beatrice Omari',
        authorRole: 'Curriculum Coordinator',
        comment: 'Exemplary integration with student streak badges and bonus point challenges.',
        createdAt: '2026-10-08T09:15:00Z'
      }
    ]
  },
  {
    id: 'syl-04',
    grade: 8,
    subject: 'Pretechnical Education',
    strand: 'Materials & Production',
    subStrand: 'Safety in Mechanical Workshop',
    expectedWeek: 7,
    completedWeek: 7,
    status: 'on_schedule',
    leadTeacher: 'Mrs. Grace Njeri',
    competencyTarget: 'Standard PPE protocol and hazardous material storage',
    coordinatorRemarks: 'Workshop floor hazard signs completed and verified.'
  },
  {
    id: 'syl-05',
    grade: 5,
    subject: 'Creative Arts',
    strand: 'Visual Arts & Craft',
    subStrand: 'Weaving & Pattern Construction',
    expectedWeek: 7,
    completedWeek: 5,
    status: 'lagging',
    leadTeacher: 'Mr. Patrick Mutiso',
    competencyTarget: 'Local fibre collection and geometric loom design',
    coordinatorRemarks: '2-week lag; banana fiber drying took longer than anticipated.',
    comments: [
      {
        id: 'comm-syl-4',
        author: 'Mrs. Beatrice Omari',
        authorRole: 'Curriculum Coordinator',
        comment: 'Teacher advised to utilize pre-treated synthetic twines for group demonstrations.',
        createdAt: '2026-10-09T08:30:00Z'
      }
    ]
  },
  {
    id: 'syl-06',
    grade: 6,
    subject: 'Social Studies',
    strand: 'Resources & Economic Activities',
    subStrand: 'Dairy Farming in Eastern Africa',
    expectedWeek: 7,
    completedWeek: 7,
    status: 'on_schedule',
    leadTeacher: 'Mrs. Janet Otieno',
    competencyTarget: 'Map interpretation and cooperative society benefits',
    coordinatorRemarks: 'Field excursion notes integrated into learner portfolios.'
  }
];

export const INITIAL_COORDINATOR_SCHEMES_OF_WORK: CoordinatorSchemeOfWork[] = [
  {
    id: 'sch-01',
    teacher: 'Ms. Sarah Mwangi',
    grade: 4,
    subject: 'Mathematics',
    term: 2,
    academicYear: 2026,
    submittedDate: '2026-10-02',
    status: 'approved',
    feedback: 'Excellent alignment with CBC inquiry questions and learner rubrics.',
    reviewedBy: 'Mrs. Beatrice Omari',
    createdAt: '2026-10-02T08:00:00Z',
    comments: [
      {
        id: 'sch-comm-1',
        author: 'Mrs. Beatrice Omari',
        authorRole: 'Curriculum Coordinator',
        comment: 'Inquiry questions in Week 6 and 7 provide great formative assessment opportunities.',
        createdAt: '2026-10-02T11:00:00Z'
      }
    ]
  },
  {
    id: 'sch-02',
    teacher: 'Mr. David Omondi',
    grade: 4,
    subject: 'Integrated Science',
    term: 2,
    academicYear: 2026,
    submittedDate: '2026-10-04',
    status: 'pending_revision',
    feedback: 'Please incorporate the Virtual Science Lab experiment on Acids & Bases into Week 8.',
    reviewedBy: 'Mrs. Beatrice Omari',
    createdAt: '2026-10-04T09:30:00Z',
    comments: [
      {
        id: 'sch-comm-2',
        author: 'Mrs. Beatrice Omari',
        authorRole: 'Curriculum Coordinator',
        comment: 'Awaiting revised lesson step notes with laboratory safety goggles requirement.',
        createdAt: '2026-10-05T08:45:00Z'
      }
    ]
  },
  {
    id: 'sch-03',
    teacher: 'Mr. John Kamau',
    grade: 7,
    subject: 'Computer Studies',
    term: 2,
    academicYear: 2026,
    submittedDate: '2026-10-05',
    status: 'approved',
    feedback: 'Great use of Computer Lab Challenge Library for Grade 7 coding sessions.',
    reviewedBy: 'Mrs. Beatrice Omari',
    createdAt: '2026-10-05T14:00:00Z'
  },
  {
    id: 'sch-04',
    teacher: 'Mrs. Grace Njeri',
    grade: 8,
    subject: 'Pretechnical Education',
    term: 2,
    academicYear: 2026,
    submittedDate: '2026-10-06',
    status: 'approved',
    feedback: 'Comprehensive workshop risk mitigation guidelines and tool maintenance checklist included.',
    reviewedBy: 'Mrs. Beatrice Omari',
    createdAt: '2026-10-06T10:15:00Z'
  },
  {
    id: 'sch-05',
    teacher: 'Mr. Patrick Mutiso',
    grade: 5,
    subject: 'Creative Arts',
    term: 2,
    academicYear: 2026,
    submittedDate: '2026-10-07',
    status: 'remediation_planned',
    feedback: 'Requires condensed timeline for indigenous weaving to prevent Term 2 syllabus backlog.',
    reviewedBy: 'Mrs. Beatrice Omari',
    createdAt: '2026-10-07T11:20:00Z',
    comments: [
      {
        id: 'sch-comm-3',
        author: 'Mrs. Beatrice Omari',
        authorRole: 'Curriculum Coordinator',
        comment: 'Met with teacher to restructure Week 8 and 9 into double-period craft clinics.',
        createdAt: '2026-10-08T15:00:00Z'
      }
    ]
  }
];

export const INITIAL_COORDINATOR_CBA_MODERATIONS: CoordinatorCBAModeration[] = [
  {
    id: 'mod-01',
    grade: 4,
    stream: 'all',
    subject: 'Mathematics',
    assessmentTitle: 'Fraction Strip Construction & Equivalence Investigation',
    moderator: 'Mrs. Beatrice Omari',
    moderatedDate: '2026-10-07',
    consensusLevel: 'ME',
    sampleSize: 40,
    eeCount: 12,
    meCount: 20,
    aeCount: 6,
    beCount: 2,
    varianceNotes: 'Inter-stream scoring variance between East and West within 3.5% acceptable margin.',
    consensusStatus: 'verified',
    createdAt: '2026-10-07T12:00:00Z',
    comments: [
      {
        id: 'mod-comm-1',
        author: 'Mrs. Beatrice Omari',
        authorRole: 'Curriculum Coordinator',
        comment: 'Uniform criteria applied across all 4 streams. Exemplary rubric descriptors.',
        createdAt: '2026-10-07T14:00:00Z'
      }
    ]
  },
  {
    id: 'mod-02',
    grade: 7,
    stream: 'East',
    subject: 'Computer Studies',
    assessmentTitle: 'Scratch Interactive Traffic Light Controller Project',
    moderator: 'Mrs. Beatrice Omari',
    moderatedDate: '2026-10-08',
    consensusLevel: 'EE',
    sampleSize: 36,
    eeCount: 16,
    meCount: 15,
    aeCount: 4,
    beCount: 1,
    varianceNotes: 'High digital fluency demonstrated; 44% achieved EE with custom sprite animations.',
    consensusStatus: 'verified',
    createdAt: '2026-10-08T16:00:00Z',
    comments: [
      {
        id: 'mod-comm-2',
        author: 'Mrs. Beatrice Omari',
        authorRole: 'Curriculum Coordinator',
        comment: 'Code submissions moderated via Computer Lab Studio repository.',
        createdAt: '2026-10-08T16:30:00Z'
      }
    ]
  },
  {
    id: 'mod-03',
    grade: 5,
    stream: 'West',
    subject: 'Creative Arts',
    assessmentTitle: 'Traditional Fibre Loom Weaving Practical',
    moderator: 'Mrs. Beatrice Omari',
    moderatedDate: '2026-10-09',
    consensusLevel: 'AE',
    sampleSize: 38,
    eeCount: 4,
    meCount: 16,
    aeCount: 14,
    beCount: 4,
    varianceNotes: 'Elevated AE and BE frequency due to incomplete tensioning in student looms.',
    consensusStatus: 'action_required',
    createdAt: '2026-10-09T13:00:00Z',
    comments: [
      {
        id: 'mod-comm-3',
        author: 'Mrs. Beatrice Omari',
        authorRole: 'Curriculum Coordinator',
        comment: 'Departmental head instructed to run remedial loom knotting clinics next Monday.',
        createdAt: '2026-10-09T15:10:00Z'
      }
    ]
  }
];
