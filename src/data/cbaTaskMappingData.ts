import { CBATaskMapping } from '../types';

export const INITIAL_CBA_TASK_MAPPINGS: CBATaskMapping[] = [
  {
    id: 'cba-map-001',
    grade: 4,
    stream: 'East',
    subject: 'Mathematics',
    term: 2,
    academicYear: 2026,
    strand: 'Numbers & Operations',
    subStrand: 'Fractions & Equivalent Quantities',
    objectiveCode: 'CBC-MAT-G4-O1',
    curriculumObjective: 'Learner can divide concrete continuous quantities into fractional parts and compare equivalent values using physical models.',
    coreCompetency: 'Critical Thinking & Problem Solving',
    bloomDomain: 'Applying & Calculating',
    taskTitle: 'Fraction Strip Construction & Equivalence Investigation',
    taskDescription: 'Learners measure, fold, and color paper strips into halves, quarters, and eighths, verifying equivalence by direct superposition in paired classwork.',
    assessmentType: 'Authentic Performance Task',
    assessmentCycle: 'Continuous Assessment (CATs)',
    leadTeacherName: 'Ms. Sarah Mwangi',
    weightagePercent: 15,
    rubricCriteria: [
      {
        id: 'rc-01',
        criterionTitle: 'Precision in Fractional Division',
        eeDescriptor: 'Accurately measures and folds strips into equal units; spontaneously discovers and explains 2/4 = 1/2 and 4/8 = 1/2.',
        meDescriptor: 'Folds strips into equal units with minimal guidance and correctly identifies equivalent pairs.',
        aeDescriptor: 'Requires teacher prompts to fold equal strips; partially identifies equivalent pairs.',
        beDescriptor: 'Struggles to form equal divisions without continuous one-on-one assistance.'
      },
      {
        id: 'rc-02',
        criterionTitle: 'Mathematical Communication & Justification',
        eeDescriptor: 'Articulates clear rationale using fractional notation and relates to real-life sharing scenarios.',
        meDescriptor: 'Uses correct fraction terms (numerator, denominator) to explain equivalence.',
        aeDescriptor: 'Names basic fractions but struggles to explain why 2/4 is equal to 1/2.',
        beDescriptor: 'Unable to label fractional components without reference cards.'
      }
    ],
    alignmentStatus: 'verified',
    alignmentScore: 96,
    attainmentDistribution: {
      eeCount: 14,
      meCount: 22,
      aeCount: 5,
      beCount: 1,
      totalLearners: 42
    },
    coordinatorNotes: 'Fully aligned to KICD Grade 4 Curriculum Designs. Excellent formative rubric incorporating core competency.',
    lastVerifiedBy: 'Mrs. Beatrice Omari (Curriculum Coordinator)',
    lastVerifiedAt: '2026-10-08T11:30:00Z',
    createdAt: '2026-10-01T08:00:00Z'
  },
  {
    id: 'cba-map-002',
    grade: 4,
    stream: 'all',
    subject: 'Integrated Science',
    term: 2,
    academicYear: 2026,
    strand: 'Living Things & Ecosystems',
    subStrand: 'Plant Nutrition & Water Transport',
    objectiveCode: 'CBC-SCI-G4-O2',
    curriculumObjective: 'Investigate the uptake and transport of colored water through plant stems using celery or white flowers.',
    coreCompetency: 'Critical Thinking & Problem Solving',
    bloomDomain: 'Analyzing & Deconstructing',
    taskTitle: 'Xylem Capillary Action Laboratory Experiment & Observation Journal',
    taskDescription: 'Small group setup: immerse celery stalks in red and blue food dye solutions, record hourly observations, dissect cross-sections to trace colored vascular bundles.',
    assessmentType: 'Practical Lab Experiment',
    assessmentCycle: 'Continuous Assessment (CATs)',
    leadTeacherName: 'Mr. David Omondi',
    weightagePercent: 20,
    rubricCriteria: [
      {
        id: 'rc-03',
        criterionTitle: 'Experimental Setup & Hygiene',
        eeDescriptor: 'Sets up apparatus independently with pristine controls; measures dye dilution systematically.',
        meDescriptor: 'Follows lab safety procedures and sets up colored water tubes accurately.',
        aeDescriptor: 'Spills solution or cuts stalk unevenly; needs minor peer assistance.',
        beDescriptor: 'Does not follow lab safety or experimental sequence.'
      },
      {
        id: 'rc-04',
        criterionTitle: 'Cross-Section Analysis & Drawing',
        eeDescriptor: 'Produces labelled diagram showing colored xylem vessels with precise anatomical notes.',
        meDescriptor: 'Identifies colored dots in cross-section and links to water transport.',
        aeDescriptor: 'Draws general celery stalk without pinpointing vascular bundles.',
        beDescriptor: 'Leaves journal entry incomplete or incorrect.'
      }
    ],
    alignmentStatus: 'verified',
    alignmentScore: 92,
    attainmentDistribution: {
      eeCount: 11,
      meCount: 25,
      aeCount: 6,
      beCount: 2,
      totalLearners: 44
    },
    coordinatorNotes: 'Integrated Science lab criteria conforms to KICD inquiry-based learning principles.',
    lastVerifiedBy: 'Mrs. Beatrice Omari (Curriculum Coordinator)',
    lastVerifiedAt: '2026-10-09T09:15:00Z',
    createdAt: '2026-10-02T10:00:00Z'
  },
  {
    id: 'cba-map-003',
    grade: 7,
    stream: 'West',
    subject: 'Computer Studies',
    term: 2,
    academicYear: 2026,
    strand: 'Computational Thinking & Algorithms',
    subStrand: 'Scratch Block-Based Programming',
    objectiveCode: 'CBC-CS-G7-O1',
    curriculumObjective: 'Design and implement an interactive digital story or animation incorporating conditional logic, variable counters, and broadcast messages.',
    coreCompetency: 'Digital Literacy',
    bloomDomain: 'Creating & Designing',
    taskTitle: 'Interactive Traffic Light & Pedestrian Safety Animation in Scratch',
    taskDescription: 'Learners write Scratch block algorithms where user pressing spacebar changes light sequence and broadcasts message to animate pedestrian walking.',
    assessmentType: 'Digital Coding Project',
    assessmentCycle: 'CAT 1',
    leadTeacherName: 'Mr. John Kamau',
    weightagePercent: 25,
    rubricCriteria: [
      {
        id: 'rc-05',
        criterionTitle: 'Algorithmic Sequence & Conditional Logic',
        eeDescriptor: 'Implements nested if-else loops, costume switches with zero glitching, and custom sound triggers.',
        meDescriptor: 'Successfully programs sequential lights and triggers sprite movement via broadcast.',
        aeDescriptor: 'Code executes but light timing is erratic or broadcast message triggers incorrect sprite.',
        beDescriptor: 'Incomplete block arrangement with script errors preventing execution.'
      },
      {
        id: 'rc-06',
        criterionTitle: 'Creative Synthesis & User Experience',
        eeDescriptor: 'Adds custom backdrop, audio cues, and pedestrian accessibility features.',
        meDescriptor: 'Creates clean visual interface adhering to road safety guidelines.',
        aeDescriptor: 'Functional but lacks proper scaling or clear visual indicators.',
        beDescriptor: 'Uses default scratch cat with no road safety thematic assets.'
      }
    ],
    alignmentStatus: 'verified',
    alignmentScore: 98,
    attainmentDistribution: {
      eeCount: 16,
      meCount: 18,
      aeCount: 4,
      beCount: 0,
      totalLearners: 38
    },
    coordinatorNotes: 'Exemplary alignment with Junior Secondary Computer Studies syllabus. Project tested in Scratch Computer Lab.',
    lastVerifiedBy: 'Mrs. Beatrice Omari (Curriculum Coordinator)',
    lastVerifiedAt: '2026-10-07T14:20:00Z',
    createdAt: '2026-10-03T11:00:00Z'
  },
  {
    id: 'cba-map-004',
    grade: 8,
    stream: 'all',
    subject: 'Pretechnical Education',
    term: 2,
    academicYear: 2026,
    strand: 'Materials & Production',
    subStrand: 'Mechanical Workshop Safety & Tool Maintenance',
    objectiveCode: 'CBC-PTE-G8-O2',
    curriculumObjective: 'Demonstrate proper selection, handling, cleaning, and hazard-free storage of woodworking and metalwork hand tools.',
    coreCompetency: 'Self-Efficacy',
    bloomDomain: 'Psychomotor & Practical Execution',
    taskTitle: 'Workshop Tool Station Inspection & Maintenance Practical Checklist',
    taskDescription: 'Individual assessment in workshop: select specified tools (crosscut saw, try square, bench plane), inspect for defects, apply light oiling, and safely stow on shadow board.',
    assessmentType: 'Observation Checklist',
    assessmentCycle: 'Continuous Assessment (CATs)',
    leadTeacherName: 'Mrs. Grace Njeri',
    weightagePercent: 15,
    rubricCriteria: [
      {
        id: 'rc-07',
        criterionTitle: 'Safety Apparel & PPE Compliance',
        eeDescriptor: 'Strictly wears eye protection, workshop coat, leather apron, and coaches peers on safety zone discipline.',
        meDescriptor: 'Wears all required PPE and adheres to workshop walkway rules.',
        aeDescriptor: 'Needs reminding to fasten eye protection or tuck in loose clothing.',
        beDescriptor: 'Enters workshop without mandatory PPE.'
      },
      {
        id: 'rc-08',
        criterionTitle: 'Tool Handling & Preventative Oiling',
        eeDescriptor: 'Handles cutting edges with expert grip, wipes metal surfaces with linseed/lubricating oil, stows on designated pegs.',
        meDescriptor: 'Properly identifies tools, removes sawdust/swarf, and returns to correct shadow outline.',
        aeDescriptor: 'Leaves tools on workbench or applies excessive oil without wiping.',
        beDescriptor: 'Misidentifies common hand tools or mishandles bladed instruments.'
      }
    ],
    alignmentStatus: 'verified',
    alignmentScore: 90,
    attainmentDistribution: {
      eeCount: 12,
      meCount: 20,
      aeCount: 7,
      beCount: 1,
      totalLearners: 40
    },
    coordinatorNotes: 'OSHA / KICD technical requirements met. Validated for Term 2 practical assessment.',
    lastVerifiedBy: 'Mrs. Beatrice Omari (Curriculum Coordinator)',
    lastVerifiedAt: '2026-10-06T15:45:00Z',
    createdAt: '2026-10-04T09:30:00Z'
  },
  {
    id: 'cba-map-005',
    grade: 5,
    stream: 'North',
    subject: 'Creative Arts',
    term: 2,
    academicYear: 2026,
    strand: 'Visual Arts & Craft',
    subStrand: 'Weaving & Pattern Construction',
    objectiveCode: 'CBC-ART-G5-O1',
    curriculumObjective: 'Construct a simple cardboard loom and weave functional placemat incorporating traditional Kenyan geometric motifs and indigenous plant fibers.',
    coreCompetency: 'Imagination & Creativity',
    bloomDomain: 'Creating & Designing',
    taskTitle: 'Indigenous Fiber Loom Weaving & Cultural Motif Portfolio',
    taskDescription: 'Learners prepare sisal or banana fiber yarns, string warp threads on notched cardboard, and weave alternating weft patterns reflecting indigenous cultural designs.',
    assessmentType: 'Authentic Performance Task',
    assessmentCycle: 'Continuous Assessment (CATs)',
    leadTeacherName: 'Mr. Patrick Mutiso',
    weightagePercent: 20,
    rubricCriteria: [
      {
        id: 'rc-09',
        criterionTitle: 'Loom Warping & Tension Uniformity',
        eeDescriptor: 'Tension across all warp strings is impeccably uniform; edge selvages remain straight and parallel.',
        meDescriptor: 'Warp strings are secure with consistent tension throughout.',
        aeDescriptor: 'Uneven tension causes wavering borders in first half of placemat.',
        beDescriptor: 'Cardboard loom warps or tears due to excessive pulling.'
      },
      {
        id: 'rc-10',
        criterionTitle: 'Cultural Motif Integration & Finishing',
        eeDescriptor: 'Integrates two-tone contrasting geometric pattern inspired by local heritage; secures fringe knots neatly.',
        meDescriptor: 'Uses complementary colored yarns and completes secure fringe finish.',
        aeDescriptor: 'Pattern is disorganized; fringe ends untied.',
        beDescriptor: 'Incomplete weave with fewer than 5 cm executed.'
      }
    ],
    alignmentStatus: 'needs_remediation',
    alignmentScore: 72,
    attainmentDistribution: {
      eeCount: 6,
      meCount: 18,
      aeCount: 12,
      beCount: 4,
      totalLearners: 40
    },
    coordinatorNotes: 'Pacing lag noted in syllabus radar. Assessment rubrics require clearer scaffolding on selvage control.',
    lastVerifiedBy: 'Mrs. Beatrice Omari (Curriculum Coordinator)',
    lastVerifiedAt: '2026-10-05T13:00:00Z',
    createdAt: '2026-10-02T13:30:00Z'
  },
  {
    id: 'cba-map-006',
    grade: 6,
    stream: 'South',
    subject: 'Social Studies',
    term: 2,
    academicYear: 2026,
    strand: 'Resources & Economic Activities',
    subStrand: 'Dairy Farming in Eastern Africa',
    objectiveCode: 'CBC-SS-G6-O3',
    curriculumObjective: 'Analyze factors influencing dairy cattle rearing in Kenya and assess the role of cooperative societies in milk processing and market distribution.',
    coreCompetency: 'Communication & Collaboration',
    bloomDomain: 'Evaluating & Justifying',
    taskTitle: 'Cooperative Society Model & Farmer Advocacy Speech Presentation',
    taskDescription: 'Learners work in triads to draft a mock cooperative society constitution, construct a supply-chain diagram from cooling hub to consumer, and deliver an oral defense.',
    assessmentType: 'Oral Presentation & Rubric',
    assessmentCycle: 'Continuous Assessment (CATs)',
    leadTeacherName: 'Mrs. Janet Otieno',
    weightagePercent: 15,
    rubricCriteria: [
      {
        id: 'rc-11',
        criterionTitle: 'Economic Supply Chain Understanding',
        eeDescriptor: 'Thoroughly diagrams chilling centers, pasteurization, veterinary support, and dividend calculation.',
        meDescriptor: 'Accurately traces milk journey from farm gate to retail packaging.',
        aeDescriptor: 'Omits key stages like quality testing or cooperative value addition.',
        beDescriptor: 'Confuses cooperative structure with private middlemen.'
      },
      {
        id: 'rc-12',
        criterionTitle: 'Public Advocacy & Triad Collaboration',
        eeDescriptor: 'High-impact oral delivery; each triad member articulates distinct economic arguments persuasively.',
        meDescriptor: 'All group members speak and respond to coordinator questions competently.',
        aeDescriptor: 'One learner dominates presentation while others remain passive.',
        beDescriptor: 'Presentation lacks preparation; read directly from fragmented notes.'
      }
    ],
    alignmentStatus: 'verified',
    alignmentScore: 94,
    attainmentDistribution: {
      eeCount: 12,
      meCount: 22,
      aeCount: 5,
      beCount: 1,
      totalLearners: 40
    },
    coordinatorNotes: 'Rubric aligns well with CBC citizenship and financial literacy values.',
    lastVerifiedBy: 'Mrs. Beatrice Omari (Curriculum Coordinator)',
    lastVerifiedAt: '2026-10-09T16:10:00Z',
    createdAt: '2026-10-05T11:20:00Z'
  },
  {
    id: 'cba-map-007',
    grade: 6,
    stream: 'all',
    subject: 'Agriculture',
    term: 2,
    academicYear: 2026,
    strand: 'Crop Production & Environmental Conservation',
    subStrand: 'Kitchen Garden & Container Gardening',
    objectiveCode: 'CBC-AGR-G6-O1',
    curriculumObjective: 'Construct multi-storey sack gardens using recycled materials and organic compost to optimize food production in limited spaces.',
    coreCompetency: 'Citizenship',
    bloomDomain: 'Psychomotor & Practical Execution',
    taskTitle: 'Multi-Storey Vertical Sack Garden Construction & Drip Irrigation Trial',
    taskDescription: 'Outdoor class project: perforate and layer gunny sacks with central gravel core for water percolation, transplant indigenous vegetable seedlings (managu, terere).',
    assessmentType: 'Authentic Performance Task',
    assessmentCycle: 'Continuous Assessment (CATs)',
    leadTeacherName: 'Mr. Samuel Kibet',
    weightagePercent: 20,
    rubricCriteria: [
      {
        id: 'rc-13',
        criterionTitle: 'Gravel Column Core Construction',
        eeDescriptor: 'Builds flawless vertical gravel percolation core with perforated tin canister; soil compost mix is friable and rich.',
        meDescriptor: 'Correctly places central gravel column and compacts soil firmly.',
        aeDescriptor: 'Gravel column collapses or shifts off-center during soil filling.',
        beDescriptor: 'Fills sack with unamended clay soil without drainage column.'
      },
      {
        id: 'rc-14',
        criterionTitle: 'Seedling Spacing & Water Conservation',
        eeDescriptor: 'Spaces holes staggered at 15cm intervals; installs simple recycled bottle drip irrigation.',
        meDescriptor: 'Transplants healthy seedlings without root trauma and moistens bed.',
        aeDescriptor: 'Punctures sack holes too close together causing tearing.',
        beDescriptor: 'Damages seedling roots during transplanting.'
      }
    ],
    alignmentStatus: 'verified',
    alignmentScore: 95,
    attainmentDistribution: {
      eeCount: 15,
      meCount: 21,
      aeCount: 4,
      beCount: 0,
      totalLearners: 40
    },
    coordinatorNotes: 'Outstanding practical application linking food security and environmental conservation.',
    lastVerifiedBy: 'Mrs. Beatrice Omari (Curriculum Coordinator)',
    lastVerifiedAt: '2026-10-10T10:45:00Z',
    createdAt: '2026-10-06T08:15:00Z'
  },
  {
    id: 'cba-map-008',
    grade: 3,
    stream: 'East',
    subject: 'English',
    term: 2,
    academicYear: 2026,
    strand: 'Language & Literacy',
    subStrand: 'Reading Comprehension & Character Empathy',
    objectiveCode: 'CBC-ENG-G3-O2',
    curriculumObjective: 'Read age-appropriate literary narrative, identify sequence of events, and explain character motivations using full sentences.',
    coreCompetency: 'Communication & Collaboration',
    bloomDomain: 'Understanding & Explaining',
    taskTitle: 'Oral Storyboard Retelling & Character Role-Play Assessment',
    taskDescription: 'Learners draw a 4-panel storyboard of the class reader "The Clever Hare", then verbally recount the climax to the class while answering inferential questions.',
    assessmentType: 'Formative Classwork & Checklist',
    assessmentCycle: 'Weekly Formative',
    leadTeacherName: 'Mrs. Mary Wangari',
    weightagePercent: 10,
    rubricCriteria: [
      {
        id: 'rc-15',
        criterionTitle: 'Sequential Narrative Articulation',
        eeDescriptor: 'Recounts all 4 story stages fluently with rich vocabulary, vocal expression, and logical transitions.',
        meDescriptor: 'Tells the story beginning, middle, and end in correct order.',
        aeDescriptor: 'Jumbles sequence of events; requires teacher prompt on what happened next.',
        beDescriptor: 'Relies solely on single-word answers to teacher questions.'
      }
    ],
    alignmentStatus: 'pending_verification',
    alignmentScore: 84,
    attainmentDistribution: {
      eeCount: 10,
      meCount: 20,
      aeCount: 6,
      beCount: 2,
      totalLearners: 38
    },
    coordinatorNotes: 'Submitted for coordinator review. Need to verify whether rubric includes phonics fluency metrics.',
    lastVerifiedBy: 'Mrs. Beatrice Omari (Curriculum Coordinator)',
    lastVerifiedAt: '2026-10-09T14:00:00Z',
    createdAt: '2026-10-08T09:00:00Z'
  },
  {
    id: 'cba-map-009',
    grade: 8,
    stream: 'all',
    subject: 'Integrated Science',
    term: 2,
    academicYear: 2026,
    strand: 'Matter & Chemical Reactions',
    subStrand: 'Acids, Bases & Natural Indicators',
    objectiveCode: 'CBC-SCI-G8-O4',
    curriculumObjective: 'Extract natural acid-base indicators from hibiscus petals and red cabbage, and test everyday household substances (lemon juice, soap, ash water, vinegar).',
    coreCompetency: 'Critical Thinking & Problem Solving',
    bloomDomain: 'Analyzing & Deconstructing',
    taskTitle: 'Natural Plant Indicator Extraction & pH Classification Lab',
    taskDescription: 'Learners boil crushed hibiscus petals in hot water, filter filtrate into spotting tiles, observe distinct color shifts with acidic and basic test reagents.',
    assessmentType: 'Practical Lab Experiment',
    assessmentCycle: 'Mid-Term Evaluation',
    leadTeacherName: 'Mr. David Omondi',
    weightagePercent: 20,
    rubricCriteria: [
      {
        id: 'rc-16',
        criterionTitle: 'Safe Chemical Reagent Handling',
        eeDescriptor: 'Zero contamination across test wells; systematically cleans droppers between acid and alkali samples.',
        meDescriptor: 'Accurately tests each substance with fresh indicator without spillage.',
        aeDescriptor: 'Contaminates one test well by dipping used dropper into reagent bottle.',
        beDescriptor: 'Disregards safety instructions or consumes edible test materials.'
      },
      {
        id: 'rc-17',
        criterionTitle: 'Tabulation & Color Classification',
        eeDescriptor: 'Constructs precise multi-column data table grouping items into strong acid, weak acid, neutral, and base.',
        meDescriptor: 'Correctly classifies lemon juice as acid and wood ash as base.',
        aeDescriptor: 'Records color changes but confuses which color represents acid vs base.',
        beDescriptor: 'Leaves lab classification table blank.'
      }
    ],
    alignmentStatus: 'verified',
    alignmentScore: 97,
    attainmentDistribution: {
      eeCount: 14,
      meCount: 21,
      aeCount: 4,
      beCount: 1,
      totalLearners: 40
    },
    coordinatorNotes: 'Excellently structured Junior Secondary science practical. Natural indicators reduce reagent expense while teaching genuine chemistry principles.',
    lastVerifiedBy: 'Mrs. Beatrice Omari (Curriculum Coordinator)',
    lastVerifiedAt: '2026-10-10T12:00:00Z',
    createdAt: '2026-10-06T14:00:00Z'
  },
  {
    id: 'cba-map-010',
    grade: 7,
    stream: 'East',
    subject: 'Pretechnical Education',
    term: 2,
    academicYear: 2026,
    strand: 'Technical Drawing',
    subStrand: 'Isometric & Oblique Projections',
    objectiveCode: 'CBC-PTE-G7-O3',
    curriculumObjective: 'Construct 30-degree isometric views of simple shaped wooden blocks using T-square, 30/60 set square, and standard dimensioning lines.',
    coreCompetency: 'Imagination & Creativity',
    bloomDomain: 'Applying & Calculating',
    taskTitle: 'Isometric Block Projection Drawing Plate #4',
    taskDescription: 'Drafting exercise: tape drawing sheet, set baseline with T-square, construct 30-degree receding axes, project stepped rectangular prism with neat hidden lines.',
    assessmentType: 'Authentic Performance Task',
    assessmentCycle: 'Continuous Assessment (CATs)',
    leadTeacherName: 'Mrs. Grace Njeri',
    weightagePercent: 20,
    rubricCriteria: [
      {
        id: 'rc-18',
        criterionTitle: 'Drafting Geometry & Linework',
        eeDescriptor: 'Razor-sharp object lines; feather-light construction lines; exact 30-degree angles verified by protractor.',
        meDescriptor: 'Accurate 30-degree axes with clean visible edges and correct dimensions.',
        aeDescriptor: 'Slight smudge marks or lines drawn at 45 degrees instead of 30 degrees.',
        beDescriptor: 'Freehand sketching without using drafting instruments.'
      }
    ],
    alignmentStatus: 'verified',
    alignmentScore: 93,
    attainmentDistribution: {
      eeCount: 13,
      meCount: 19,
      aeCount: 6,
      beCount: 1,
      totalLearners: 39
    },
    coordinatorNotes: 'Technical drawing plates verified. High psychomotor development demonstrated.',
    lastVerifiedBy: 'Mrs. Beatrice Omari (Curriculum Coordinator)',
    lastVerifiedAt: '2026-10-08T16:00:00Z',
    createdAt: '2026-10-04T13:00:00Z'
  },
  {
    id: 'cba-map-011',
    grade: 5,
    stream: 'all',
    subject: 'Mathematics',
    term: 2,
    academicYear: 2026,
    strand: 'Measurement',
    subStrand: 'Area & Perimeter of Regular and Irregular Polygons',
    objectiveCode: 'CBC-MAT-G5-O4',
    curriculumObjective: 'Estimate and calculate the area of irregular plane figures using grid overlay methods with square-centimeter counting.',
    coreCompetency: 'Critical Thinking & Problem Solving',
    bloomDomain: 'Applying & Calculating',
    taskTitle: 'School Garden Plot Area Estimation via 1m Grid Overlay',
    taskDescription: 'Learners peg out 1-meter string grids over an irregularly shaped herb patch in the school yard, count full squares and half-squares, and estimate total surface area.',
    assessmentType: 'Fieldwork & Practical Observation',
    assessmentCycle: 'Continuous Assessment (CATs)',
    leadTeacherName: 'Ms. Sarah Mwangi',
    weightagePercent: 15,
    rubricCriteria: [
      {
        id: 'rc-19',
        criterionTitle: 'Grid Laying & Field Measurement',
        eeDescriptor: 'Maintains perpendicular strings using 3-4-5 triangle method; counts and tallies boundary partial squares methodically.',
        meDescriptor: 'Lays grid over irregular plot and counts whole and partial squares.',
        aeDescriptor: 'Counts whole squares but ignores squares with over 50% coverage.',
        beDescriptor: 'Fails to construct aligned grid without continuous instruction.'
      }
    ],
    alignmentStatus: 'verified',
    alignmentScore: 91,
    attainmentDistribution: {
      eeCount: 10,
      meCount: 23,
      aeCount: 7,
      beCount: 2,
      totalLearners: 42
    },
    coordinatorNotes: 'Practical application connects Mathematics with outdoor environmental awareness.',
    lastVerifiedBy: 'Mrs. Beatrice Omari (Curriculum Coordinator)',
    lastVerifiedAt: '2026-10-07T10:15:00Z',
    createdAt: '2026-10-03T09:00:00Z'
  },
  {
    id: 'cba-map-012',
    grade: 9,
    stream: 'all',
    subject: 'Computer Studies',
    term: 2,
    academicYear: 2026,
    strand: 'Digital Literacy & Data Science',
    subStrand: 'Spreadsheet Modeling & Data Visualization',
    objectiveCode: 'CBC-CS-G9-O2',
    curriculumObjective: 'Design a functional financial ledger spreadsheet utilizing arithmetic formulas (SUM, AVERAGE, IF), absolute referencing, and interactive bar charts.',
    coreCompetency: 'Digital Literacy',
    bloomDomain: 'Creating & Designing',
    taskTitle: 'School Canteen Inventory & Profit/Loss Simulation Model',
    taskDescription: 'Learners build a multi-column budget sheet tracking snack sales, profit margins, conditionally format low stock in red, and generate dynamic sales bar charts.',
    assessmentType: 'Digital Coding Project',
    assessmentCycle: 'CAT 2',
    leadTeacherName: 'Mr. John Kamau',
    weightagePercent: 25,
    rubricCriteria: [
      {
        id: 'rc-20',
        criterionTitle: 'Formula Architecture & Error-Free Calculations',
        eeDescriptor: 'Seamlessly embeds nested IF logic, absolute cell locks ($B$1), and data validation dropdowns.',
        meDescriptor: 'Accurately uses SUM, AVERAGE, and basic multiplication formulas.',
        aeDescriptor: 'Values hardcoded in cells instead of utilizing automated formula references.',
        beDescriptor: 'Spreadsheet has #REF or #DIV/0 syntax errors throughout.'
      }
    ],
    alignmentStatus: 'verified',
    alignmentScore: 96,
    attainmentDistribution: {
      eeCount: 15,
      meCount: 18,
      aeCount: 4,
      beCount: 1,
      totalLearners: 38
    },
    coordinatorNotes: 'Prepares Grade 9 learners for senior school business and computing pathways.',
    lastVerifiedBy: 'Mrs. Beatrice Omari (Curriculum Coordinator)',
    lastVerifiedAt: '2026-10-10T15:30:00Z',
    createdAt: '2026-10-07T11:00:00Z'
  }
];
