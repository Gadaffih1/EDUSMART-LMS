import { StaffAppraisalRecord, TPADStandardRating } from '../types';

export const INITIAL_TPAD_STANDARDS: Omit<TPADStandardRating, 'selfScore' | 'appraiserScore' | 'agreedScore' | 'evidenceDescription' | 'appraiserRemarks'>[] = [
  {
    standardId: 'tpad-std-1',
    standardNumber: 1,
    standardTitle: 'Professional Knowledge & Application',
    subStandards: [
      'Comprehensive preparation and updating of Schemes of Work from KICD curriculum designs',
      'Development of competency-focused Lesson Plans with clear specific learning outcomes',
      'Integration of teaching-learning resources including digital tools and concrete apparatus',
      'Adherence to lesson timetables, work entry records, and continuous syllabus pacing'
    ]
  },
  {
    standardId: 'tpad-std-2',
    standardNumber: 2,
    standardTitle: 'Comprehensive Learning Environment',
    subStandards: [
      'Safe, orderly, and learner-centered classroom physical/virtual environment',
      'Effective classroom management, gender equity, and pastoral inclusion',
      'Display of dynamic curriculum talking walls, charts, and learner exhibits',
      'Clear learner conduct standards and positive behavioral reinforcement'
    ]
  },
  {
    standardId: 'tpad-std-3',
    standardNumber: 3,
    standardTitle: 'Teacher Professional Development (TPD)',
    subStandards: [
      'Identification of personal pedagogical gaps and participation in TPD modules',
      'Attendance at school-based subject department panels, workshops, and KICD seminars',
      'Continuous ICT capacity building and incorporation of educational technology',
      'Mentorship of student teachers, novice faculty, and peer lesson co-planning'
    ]
  },
  {
    standardId: 'tpad-std-4',
    standardNumber: 4,
    standardTitle: 'Learner Protection, Safety, Well-Being & Values',
    subStandards: [
      'Adherence to Children Act 2022, child safeguarding, and zero corporal punishment',
      'Early detection and supportive referral of vulnerable, distressed, or unwell learners',
      'Integration of core CBC values (integrity, patriotism, love, peace, respect)',
      'Active supervision during school break times, laboratory sessions, and games'
    ]
  },
  {
    standardId: 'tpad-std-5',
    standardNumber: 5,
    standardTitle: 'Teacher Professional Conduct & Performance',
    subStandards: [
      'Punctuality in class reporting, morning assemblies, and scheduled teacher-on-duty rosters',
      'Timely assessment marking, constructive feedback, and submission of student marks',
      'Professional communication and collaborative partnership with parents and guardians',
      'Compliance with Teachers Service Commission (TSC) Code of Regulation and Ethics'
    ]
  }
];

export const INITIAL_STAFF_APPRAISALS: StaffAppraisalRecord[] = [
  {
    id: 'appraisal-001',
    teacherId: 'u-teacher-01',
    teacherName: 'Ms. Sarah Mwangi',
    tscNumber: 'TSC/489211/KE',
    designation: 'Senior Teacher II / Head of Mathematics',
    department: 'Mathematics & Computational Sciences',
    subjectsTaught: ['Mathematics'],
    term: 2,
    academicYear: 2026,
    status: 'countersigned',
    standards: [
      {
        standardId: 'tpad-std-1',
        standardNumber: 1,
        standardTitle: 'Professional Knowledge & Application',
        subStandards: ['Comprehensive preparation of Schemes of Work', 'Competency-focused Lesson Plans'],
        selfScore: 5,
        appraiserScore: 5,
        agreedScore: 5,
        evidenceDescription: 'Schemes of Work for Term 2 submitted in Week 1; 100% lesson plans verified with manipulative aids for fractions.',
        appraiserRemarks: 'Flawless pedagogical documentation. Exemplary use of concrete realia.'
      },
      {
        standardId: 'tpad-std-2',
        standardNumber: 2,
        standardTitle: 'Comprehensive Learning Environment',
        subStandards: ['Safe, orderly classroom climate', 'Display of dynamic talking walls'],
        selfScore: 4,
        appraiserScore: 5,
        agreedScore: 5,
        evidenceDescription: 'Interactive math talking wall featuring fraction strips and geometric origami; zero disciplinary referrals.',
        appraiserRemarks: 'Classroom displays actively reinforce learner curiosity and self-assessment.'
      },
      {
        standardId: 'tpad-std-3',
        standardNumber: 3,
        standardTitle: 'Teacher Professional Development (TPD)',
        subStandards: ['Participation in TPD modules', 'Continuous ICT integration'],
        selfScore: 4,
        appraiserScore: 4,
        agreedScore: 4,
        evidenceDescription: 'Completed CEMASTEA Module 3 on Inquiry-Based Math Instruction; conducted peer workshop for junior school math teachers.',
        appraiserRemarks: 'Good departmental initiative in cascading CEMASTEA techniques.'
      },
      {
        standardId: 'tpad-std-4',
        standardNumber: 4,
        standardTitle: 'Learner Protection, Safety, Well-Being & Values',
        subStandards: ['Child safeguarding compliance', 'Integration of core CBC values'],
        selfScore: 5,
        appraiserScore: 5,
        agreedScore: 5,
        evidenceDescription: 'Coordinated math clinic for struggling learners; established supportive peer-buddy groups.',
        appraiserRemarks: 'Commendable empathy and pastoral attentiveness.'
      },
      {
        standardId: 'tpad-std-5',
        standardNumber: 5,
        standardTitle: 'Teacher Professional Conduct & Performance',
        subStandards: ['Punctuality and duty rosters', 'Timely assessment marking'],
        selfScore: 5,
        appraiserScore: 5,
        agreedScore: 5,
        evidenceDescription: 'Assigned as Teacher-on-Duty Week 3; 100% daily morning briefing attendance; CAT marks submitted 2 days ahead of deadline.',
        appraiserRemarks: 'Model professional conduct and institutional dedication.'
      }
    ],
    lessonObservations: [
      {
        id: 'obs-01',
        date: '2026-10-03',
        subject: 'Mathematics',
        grade: 4,
        stream: 'East',
        strandOrTopic: 'Fractions & Equivalence Models',
        observationScore: 96,
        strengths: [
          'High learner engagement using physical paper strip folding',
          'Clear formative questioning techniques targeting critical thinking',
          'Excellent pace distribution across introduction, inquiry, and conclusion'
        ],
        areasForGrowth: [
          'Extend challenge problems for learners who master equivalent fractions ahead of class'
        ],
        observerName: 'Mrs. Beatrice Omari (Curriculum Coordinator)'
      }
    ],
    tpdGapIdentified: 'Advanced digital spreadsheet modelling for Junior Secondary Grade 7 mathematics.',
    targetInterventions: 'Enroll in upcoming KICD Digital Mathematics Teaching Practicum in Term 3.',
    appraiserName: 'Mr. James Wafula (Deputy Head Teacher)',
    appraiserRole: 'Deputy Head Teacher',
    countersigningOfficerName: 'Dr. Arthur Onyango (Head Teacher)',
    overallPercentage: 96,
    performanceGrade: 'Exemplary (90-100%)',
    teacherComments: 'Grateful for constructive feedback on fraction realia. Looking forward to expanding digital math lessons.',
    appraiserGeneralRemarks: 'Consistently exceptional instructor who elevates school academic standards.',
    countersigningRemarks: 'Appraisal ratified by Head Teacher. Commended for exemplary devotion to learner outcome excellence.',
    submittedAt: '2026-10-05T08:00:00Z',
    completedAt: '2026-10-07T14:30:00Z',
    countersignedAt: '2026-10-08T10:15:00Z',
    createdAt: '2026-10-01T09:00:00Z'
  },
  {
    id: 'appraisal-002',
    teacherId: 'u-teacher-02',
    teacherName: 'Mr. David Omondi',
    tscNumber: 'TSC/512940/KE',
    designation: 'Instructor / Science Faculty Lead',
    department: 'Pure & Integrated Sciences',
    subjectsTaught: ['Integrated Science'],
    term: 2,
    academicYear: 2026,
    status: 'completed',
    standards: [
      {
        standardId: 'tpad-std-1',
        standardNumber: 1,
        standardTitle: 'Professional Knowledge & Application',
        subStandards: ['Comprehensive preparation of Schemes of Work', 'Competency-focused Lesson Plans'],
        selfScore: 4,
        appraiserScore: 4,
        agreedScore: 4,
        evidenceDescription: 'Executed 6 laboratory practical sessions on capillary action and natural plant indicators; schemes up to date.',
        appraiserRemarks: 'Hands-on practical experiments executed safely and effectively.'
      },
      {
        standardId: 'tpad-std-2',
        standardNumber: 2,
        standardTitle: 'Comprehensive Learning Environment',
        subStandards: ['Safe, orderly classroom climate', 'Display of dynamic talking walls'],
        selfScore: 4,
        appraiserScore: 4,
        agreedScore: 4,
        evidenceDescription: 'Science lab apparatus clearly demarcated; safety eye wash stations inspected weekly.',
        appraiserRemarks: 'Good laboratory hygiene and chemical storage protocols.'
      },
      {
        standardId: 'tpad-std-3',
        standardNumber: 3,
        standardTitle: 'Teacher Professional Development (TPD)',
        subStandards: ['Participation in TPD modules', 'Continuous ICT integration'],
        selfScore: 3,
        appraiserScore: 4,
        agreedScore: 4,
        evidenceDescription: 'Integrated EduSmart Virtual Science Lab simulations into Grade 8 chemistry lessons.',
        appraiserRemarks: 'Notable improvement in leveraging digital laboratory workbench tools.'
      },
      {
        standardId: 'tpad-std-4',
        standardNumber: 4,
        standardTitle: 'Learner Protection, Safety, Well-Being & Values',
        subStandards: ['Child safeguarding compliance', 'Integration of core CBC values'],
        selfScore: 4,
        appraiserScore: 4,
        agreedScore: 4,
        evidenceDescription: 'Strict enforcement of lab PPE coats and goggles; environmental cleanup of biological specimens.',
        appraiserRemarks: 'High emphasis on laboratory hazard mitigation.'
      },
      {
        standardId: 'tpad-std-5',
        standardNumber: 5,
        standardTitle: 'Teacher Professional Conduct & Performance',
        subStandards: ['Punctuality and duty rosters', 'Timely assessment marking'],
        selfScore: 4,
        appraiserScore: 4,
        agreedScore: 4,
        evidenceDescription: 'Regular duty supervision; marks recorded and uploaded in timely fashion.',
        appraiserRemarks: 'Dependable and cooperative faculty member.'
      }
    ],
    lessonObservations: [
      {
        id: 'obs-02',
        date: '2026-10-06',
        subject: 'Integrated Science',
        grade: 8,
        stream: 'all',
        strandOrTopic: 'Natural Acid-Base Indicators & pH Testing',
        observationScore: 88,
        strengths: [
          'Effective guided discovery using crushed hibiscus petals',
          'Good safety reinforcement before distributing chemical reagents',
          'Active collaborative team dynamics in laboratory groups'
        ],
        areasForGrowth: [
          'Ensure all groups complete written hypothesis prior to beginning laboratory manipulation'
        ],
        observerName: 'Mrs. Beatrice Omari (Curriculum Coordinator)'
      }
    ],
    tpdGapIdentified: 'Formative rubric development for laboratory psychomotor skills.',
    targetInterventions: 'Collaborate with Curriculum Coordinator on CBA Performance Task rubrics.',
    appraiserName: 'Mrs. Beatrice Omari (Curriculum Coordinator)',
    appraiserRole: 'Curriculum Coordinator',
    countersigningOfficerName: 'Dr. Arthur Onyango (Head Teacher)',
    overallPercentage: 88,
    performanceGrade: 'Very Good (80-89%)',
    teacherComments: 'Enjoyed integrating the virtual lab alongside physical apparatus. Will standardize lab rubrics.',
    appraiserGeneralRemarks: 'Solid STEM educator with strong commitment to learner practical proficiency.',
    submittedAt: '2026-10-06T10:00:00Z',
    completedAt: '2026-10-09T11:00:00Z',
    createdAt: '2026-10-02T08:30:00Z'
  },
  {
    id: 'appraisal-003',
    teacherId: 'u-teacher-03',
    teacherName: 'Mr. John Kamau',
    tscNumber: 'TSC/630144/KE',
    designation: 'Senior Faculty / ICT & Computing Lead',
    department: 'Technical & Applied Sciences',
    subjectsTaught: ['Computer Studies'],
    term: 2,
    academicYear: 2026,
    status: 'countersigned',
    standards: [
      {
        standardId: 'tpad-std-1',
        standardNumber: 1,
        standardTitle: 'Professional Knowledge & Application',
        subStandards: ['Comprehensive preparation of Schemes of Work', 'Competency-focused Lesson Plans'],
        selfScore: 5,
        appraiserScore: 5,
        agreedScore: 5,
        evidenceDescription: 'Authored complete Term 2 Scratch Algorithm challenges and spreadsheet financial templates.',
        appraiserRemarks: 'Exceptional mastery of junior secondary computing designs.'
      },
      {
        standardId: 'tpad-std-2',
        standardNumber: 2,
        standardTitle: 'Comprehensive Learning Environment',
        subStandards: ['Safe, orderly classroom climate', 'Display of dynamic talking walls'],
        selfScore: 5,
        appraiserScore: 5,
        agreedScore: 5,
        evidenceDescription: 'Computer Lab projected environment maintained with zero workstation downtime; keyboard shortcut posters installed.',
        appraiserRemarks: 'Computer Lab is in world-class instructional condition.'
      },
      {
        standardId: 'tpad-std-3',
        standardNumber: 3,
        standardTitle: 'Teacher Professional Development (TPD)',
        subStandards: ['Participation in TPD modules', 'Continuous ICT integration'],
        selfScore: 5,
        appraiserScore: 5,
        agreedScore: 5,
        evidenceDescription: 'Conducted whole-school staff training on Scratch coding projection and digital attendance tracking.',
        appraiserRemarks: 'A key school-wide catalyst for ICT adoption across disciplines.'
      },
      {
        standardId: 'tpad-std-4',
        standardNumber: 4,
        standardTitle: 'Learner Protection, Safety, Well-Being & Values',
        subStandards: ['Child safeguarding compliance', 'Integration of core CBC values'],
        selfScore: 5,
        appraiserScore: 5,
        agreedScore: 5,
        evidenceDescription: 'Strict digital safety protocols in place; SafeSearch browser and content firewalls configured for all student terminals.',
        appraiserRemarks: 'Exemplary diligence regarding student digital safety and cyber hygiene.'
      },
      {
        standardId: 'tpad-std-5',
        standardNumber: 5,
        standardTitle: 'Teacher Professional Conduct & Performance',
        subStandards: ['Punctuality and duty rosters', 'Timely assessment marking'],
        selfScore: 5,
        appraiserScore: 5,
        agreedScore: 5,
        evidenceDescription: 'Always punctual; maintains computerized equipment log and manages school website portal updates.',
        appraiserRemarks: 'Outstanding work ethic and selfless institutional service.'
      }
    ],
    lessonObservations: [
      {
        id: 'obs-03',
        date: '2026-10-04',
        subject: 'Computer Studies',
        grade: 7,
        stream: 'West',
        strandOrTopic: 'Scratch Broadcast Messaging & Animation Control',
        observationScore: 98,
        strengths: [
          'High energy interactive coding demonstration in projected mode',
          'Instant gamified feedback via Challenge Library bonus points',
          'Peer mentoring where fast coders assist adjacent students'
        ],
        areasForGrowth: [
          'Capture screenshots of top learner animations for digital portfolio display'
        ],
        observerName: 'Mrs. Beatrice Omari (Curriculum Coordinator)'
      }
    ],
    tpdGapIdentified: 'Artificial intelligence ethics and introductory Python for Grade 9 curriculum rollout.',
    targetInterventions: 'Attend National KICD Emerging Computing Technologies summit in November 2026.',
    appraiserName: 'Mr. James Wafula (Deputy Head Teacher)',
    appraiserRole: 'Deputy Head Teacher',
    countersigningOfficerName: 'Dr. Arthur Onyango (Head Teacher)',
    overallPercentage: 98,
    performanceGrade: 'Exemplary (90-100%)',
    teacherComments: 'Excited about student enthusiasm for Scratch challenges and coding streaks.',
    appraiserGeneralRemarks: 'Indispensable leader in digital transformation. Recommended for TSC national award.',
    countersigningRemarks: 'Approved with highest recommendation. The school leads the sub-county in ICT integration thanks to Mr. Kamau.',
    submittedAt: '2026-10-04T14:00:00Z',
    completedAt: '2026-10-06T16:00:00Z',
    countersignedAt: '2026-10-07T09:30:00Z',
    createdAt: '2026-10-01T10:00:00Z'
  },
  {
    id: 'appraisal-004',
    teacherId: 'u-teacher-04',
    teacherName: 'Mrs. Grace Njeri',
    tscNumber: 'TSC/467812/KE',
    designation: 'Senior Teacher / Workshop Administrator',
    department: 'Pretechnical & Creative Arts',
    subjectsTaught: ['Pretechnical Education'],
    term: 2,
    academicYear: 2026,
    status: 'appraisal_meeting_pending',
    standards: [
      {
        standardId: 'tpad-std-1',
        standardNumber: 1,
        standardTitle: 'Professional Knowledge & Application',
        subStandards: ['Comprehensive preparation of Schemes of Work', 'Competency-focused Lesson Plans'],
        selfScore: 4,
        appraiserScore: 4,
        agreedScore: 4,
        evidenceDescription: 'Technical drawing plates compiled; workshop tool maintenance logs kept up to date.',
        appraiserRemarks: 'Strong technical accuracy and drafting competency.'
      },
      {
        standardId: 'tpad-std-2',
        standardNumber: 2,
        standardTitle: 'Comprehensive Learning Environment',
        subStandards: ['Safe, orderly classroom climate', 'Display of dynamic talking walls'],
        selfScore: 5,
        appraiserScore: 5,
        agreedScore: 5,
        evidenceDescription: 'Workshop floor hazard markings freshly repainted; safety goggles sterilized after each period.',
        appraiserRemarks: 'Top-tier workshop safety culture.'
      },
      {
        standardId: 'tpad-std-3',
        standardNumber: 3,
        standardTitle: 'Teacher Professional Development (TPD)',
        subStandards: ['Participation in TPD modules', 'Continuous ICT integration'],
        selfScore: 3,
        appraiserScore: 3,
        agreedScore: 3,
        evidenceDescription: 'Attended regional TVET transition workshop.',
        appraiserRemarks: 'Encouraged to integrate more CAD/digital 3D drafting into junior school lessons.'
      },
      {
        standardId: 'tpad-std-4',
        standardNumber: 4,
        standardTitle: 'Learner Protection, Safety, Well-Being & Values',
        subStandards: ['Child safeguarding compliance', 'Integration of core CBC values'],
        selfScore: 5,
        appraiserScore: 5,
        agreedScore: 5,
        evidenceDescription: 'Zero workshop incidents recorded; excellent learner discipline regarding cutting blades.',
        appraiserRemarks: 'Flawless safety oversight.'
      },
      {
        standardId: 'tpad-std-5',
        standardNumber: 5,
        standardTitle: 'Teacher Professional Conduct & Performance',
        subStandards: ['Punctuality and duty rosters', 'Timely assessment marking'],
        selfScore: 4,
        appraiserScore: 4,
        agreedScore: 4,
        evidenceDescription: 'Consistent punctuality and reliable equipment inventory management.',
        appraiserRemarks: 'Very dependable senior teacher.'
      }
    ],
    lessonObservations: [
      {
        id: 'obs-04',
        date: '2026-10-05',
        subject: 'Pretechnical Education',
        grade: 8,
        stream: 'all',
        strandOrTopic: 'Workshop Tool Station Inspection & Rust Prevention',
        observationScore: 90,
        strengths: [
          'Step-by-step practical demonstration on linseed oil application',
          'Strict enforcement of safety zone walkways',
          'Individual checks on learner grip technique'
        ],
        areasForGrowth: [
          'Introduce digital stopwatches for measuring learner station transition efficiency'
        ],
        observerName: 'Mr. James Wafula (Deputy Head Teacher)'
      }
    ],
    tpdGapIdentified: 'Digital CAD software integration for Junior Secondary isometric drawing.',
    targetInterventions: 'Pair with Mr. Kamau for sketchup / online CAD modules in Computer Lab.',
    appraiserName: 'Mr. James Wafula (Deputy Head Teacher)',
    appraiserRole: 'Deputy Head Teacher',
    overallPercentage: 86,
    performanceGrade: 'Very Good (80-89%)',
    teacherComments: 'Meeting scheduled with Deputy Head to finalize agreed ratings and submit to Head Teacher.',
    appraiserGeneralRemarks: 'Robust technical instructor with impeccable safety records.',
    submittedAt: '2026-10-05T11:00:00Z',
    createdAt: '2026-10-02T11:00:00Z'
  },
  {
    id: 'appraisal-005',
    teacherId: 'u-teacher-05',
    teacherName: 'Mr. Patrick Mutiso',
    tscNumber: 'TSC/582910/KE',
    designation: 'Faculty / Arts & Music Lead',
    department: 'Creative Arts & Sports',
    subjectsTaught: ['Creative Arts'],
    term: 2,
    academicYear: 2026,
    status: 'submitted_for_appraisal',
    standards: [
      {
        standardId: 'tpad-std-1',
        standardNumber: 1,
        standardTitle: 'Professional Knowledge & Application',
        subStandards: ['Comprehensive preparation of Schemes of Work', 'Competency-focused Lesson Plans'],
        selfScore: 4,
        appraiserScore: 3,
        agreedScore: 3,
        evidenceDescription: 'Indigenous fiber weaving schemes prepared; lesson plans updated for Grade 5.',
        appraiserRemarks: 'Pacing lag noted in Week 5; catch-up remedial sessions required.'
      },
      {
        standardId: 'tpad-std-2',
        standardNumber: 2,
        standardTitle: 'Comprehensive Learning Environment',
        subStandards: ['Safe, orderly classroom climate', 'Display of dynamic talking walls'],
        selfScore: 4,
        appraiserScore: 4,
        agreedScore: 4,
        evidenceDescription: 'Art studio displays learner placemats and traditional Kenyan beadwork exhibits.',
        appraiserRemarks: 'Vibrant, colorful cultural studio atmosphere.'
      },
      {
        standardId: 'tpad-std-3',
        standardNumber: 3,
        standardTitle: 'Teacher Professional Development (TPD)',
        subStandards: ['Participation in TPD modules', 'Continuous ICT integration'],
        selfScore: 3,
        appraiserScore: 3,
        agreedScore: 3,
        evidenceDescription: 'Attended county cultural music festival adjudication training.',
        appraiserRemarks: 'Recommended to document digital photographic portfolios of learner artworks.'
      },
      {
        standardId: 'tpad-std-4',
        standardNumber: 4,
        standardTitle: 'Learner Protection, Safety, Well-Being & Values',
        subStandards: ['Child safeguarding compliance', 'Integration of core CBC values'],
        selfScore: 4,
        appraiserScore: 4,
        agreedScore: 4,
        evidenceDescription: 'Safe storage of craft cutting instruments and non-toxic dyes.',
        appraiserRemarks: 'Safe material handling observed.'
      },
      {
        standardId: 'tpad-std-5',
        standardNumber: 5,
        standardTitle: 'Teacher Professional Conduct & Performance',
        subStandards: ['Punctuality and duty rosters', 'Timely assessment marking'],
        selfScore: 3,
        appraiserScore: 3,
        agreedScore: 3,
        evidenceDescription: 'Conducts choir practice punctually; working on speeding up mark uploads.',
        appraiserRemarks: 'Needs to ensure gradebook submissions meet official administrative timelines.'
      }
    ],
    lessonObservations: [
      {
        id: 'obs-05',
        date: '2026-10-07',
        subject: 'Creative Arts',
        grade: 5,
        stream: 'North',
        strandOrTopic: 'Indigenous Cardboard Loom Weaving',
        observationScore: 78,
        strengths: [
          'Excellent cultural storytelling regarding indigenous sisal fiber extraction',
          'Learners excited and engaged in tactile yarn threading'
        ],
        areasForGrowth: [
          'Demonstrate edge tension control more clearly to prevent hour-glassing of placemats',
          'Accelerate pacing to cover remaining strands on schedule'
        ],
        observerName: 'Mrs. Beatrice Omari (Curriculum Coordinator)'
      }
    ],
    tpdGapIdentified: 'Syllabus pacing acceleration and formative rubric calibration for psychomotor crafts.',
    targetInterventions: 'Attend Curriculum Coordinator coaching sessions on CBC pacing recovery.',
    appraiserName: 'Mrs. Beatrice Omari (Curriculum Coordinator)',
    appraiserRole: 'Curriculum Coordinator',
    overallPercentage: 74,
    performanceGrade: 'Good (60-79%)',
    teacherComments: 'Working diligently on catch-up weaving schedule.',
    appraiserGeneralRemarks: 'Creative teacher with strong cultural passion. Pacing support in progress.',
    submittedAt: '2026-10-07T12:00:00Z',
    createdAt: '2026-10-03T09:00:00Z'
  }
];
