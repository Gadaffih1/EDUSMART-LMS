import { CurriculumWrittenReport } from '../types';

export const INITIAL_CURRICULUM_WRITTEN_REPORTS: CurriculumWrittenReport[] = [
  {
    id: 'c-rep-001',
    title: 'Term 2 CBC Curriculum Pacing & Syllabi Synchronization Audit',
    reportType: 'Syllabus Pacing & Audit',
    targetGrade: 'All Grades',
    term: 2,
    academicYear: 2026,
    authorName: 'Mrs. Beatrice Omari',
    authorRole: 'Curriculum Coordinator',
    executiveSummary: 'Institutional audit of all 9 grade levels in primary and junior school streams. Overall pacing achievement sits at 91.2% on schedule, with 148 schemes of work verified and cross-referenced with national KICD designs.',
    keyFindings: [
      'Grade 4 Mathematics and Integrated Science streams are 100% synchronized with Term 2 Week 7 pacing benchmarks.',
      'Grade 7 Computer Studies coding curriculum is running 1 week ahead due to daily Scratch Computer Lab interactive studio usage.',
      'Grade 5 Creative Arts weaving sub-strand exhibits a 2-week lag in North stream due to local fiber harvesting delays.',
      'Grade 8 Pretechnical workshop safety compliance reached 94% following hands-on hazard mitigation practicals.'
    ],
    recommendations: [
      'Organize two remedial practical block periods for Grade 5 Creative Arts to complete indigenous loom projects before Week 9.',
      'Adopt Computer Lab Challenge Library model across Pretechnical drawing modules.',
      'Standardize formative observation rubrics across junior secondary science laboratory classes.'
    ],
    qualitativeComments: [
      {
        id: 'comm-01',
        author: 'Dr. Arthur Onyango',
        authorRole: 'Head Teacher',
        comment: 'Comprehensive pacing audit approved. Remedial timetable adjustments for Grade 5 Arts authorized immediately.',
        createdAt: '2026-10-08T09:30:00Z'
      },
      {
        id: 'comm-02',
        author: 'Mr. James Wafula',
        authorRole: 'Deputy Head Teacher',
        comment: 'Double laboratory sessions allocated for Tuesday afternoon to assist lagging streams.',
        createdAt: '2026-10-08T11:15:00Z'
      }
    ],
    status: 'published',
    createdAt: '2026-10-07T08:00:00Z',
    publishedAt: '2026-10-08T14:00:00Z'
  },
  {
    id: 'c-rep-002',
    title: 'CBA Formative Moderation & Attainment Consistency Analysis across Streams',
    reportType: 'CBA Moderation & Attainment',
    targetGrade: 4,
    term: 2,
    academicYear: 2026,
    authorName: 'Mrs. Beatrice Omari',
    authorRole: 'Curriculum Coordinator',
    executiveSummary: 'Comparative study across Grades 4 East, West, North, and South streams on competency-based assessment attainment tiers (EE, ME, AE, BE). Moderation reveals strong consistency in meeting expectations.',
    keyFindings: [
      '28.4% of cohort achieved Exceeding Expectations (EE) in hands-on mathematical problem-solving.',
      '56.2% consistently Met Expectations (ME), adhering closely to KICD standard benchmarks.',
      'Approaching Expectations (AE) reduced from 18% in Term 1 to 12.1% in Term 2 following peer-mentoring groups.',
      'Below Expectations (BE) learners identified for targeted scaffolding in decimal notation and fraction conversion.'
    ],
    recommendations: [
      'Maintain continuous portfolio artifact collection for all borderline AE learners.',
      'Share Ms. Mwangi\'s fraction strip manipulative rubric as best practice model across all primary streams.'
    ],
    qualitativeComments: [
      {
        id: 'comm-03',
        author: 'Mrs. Beatrice Omari',
        authorRole: 'Curriculum Coordinator',
        comment: 'All report card qualitative remarks across Grade 4 have been moderated and endorsed with curriculum stamps.',
        createdAt: '2026-10-09T10:00:00Z'
      }
    ],
    status: 'published',
    createdAt: '2026-10-08T12:00:00Z',
    publishedAt: '2026-10-09T15:30:00Z'
  },
  {
    id: 'c-rep-003',
    title: 'Junior Secondary STEM Transition & Scratch Computer Lab Integration Report',
    reportType: 'Curriculum Implementation',
    targetGrade: 7,
    term: 2,
    academicYear: 2026,
    authorName: 'Mrs. Beatrice Omari',
    authorRole: 'Curriculum Coordinator',
    executiveSummary: 'Evaluation of Grades 7-9 rollout of digital literacy, algorithmic thinking, and integrated science laboratories. Computer Lab projection and Virtual Science Lab adoption evaluated.',
    keyFindings: [
      '100% of Grade 7 learners successfully completed their Scratch traffic light animation challenge.',
      'Bonus Points (BP) gamification streak mechanism resulted in 98% voluntary lunchtime challenge attempts.',
      'Virtual Science experiment simulations boosted learner pre-lab quiz scores by 22% compared to traditional blackboard chalk lectures.'
    ],
    recommendations: [
      'Expand challenge library with advanced nested loops and mathematical coordinate animations for Term 3.',
      'Schedule joint STEM exhibition for parents during upcoming Academic Open Day.'
    ],
    qualitativeComments: [
      {
        id: 'comm-04',
        author: 'Mr. John Kamau',
        authorRole: 'Computer Studies Lead',
        comment: 'Learner feedback on projected coding studio has been phenomenal. Grade 8 Python transition modules drafted.',
        createdAt: '2026-10-10T14:20:00Z'
      }
    ],
    status: 'submitted_to_bom',
    createdAt: '2026-10-09T16:00:00Z',
    publishedAt: '2026-10-10T16:30:00Z'
  }
];
