import { FixedLessonCondition, SharedResourceFacility, SubjectName, GradeLevel } from '../types';

export const INITIAL_FIXED_LESSON_CONDITIONS: FixedLessonCondition[] = [
  {
    id: 'fix-assembly-mon',
    title: 'School-Wide Morning Assembly & Pastoral Devotion',
    subject: 'Pastoral Care & Assembly',
    dayOfWeek: 'Monday',
    period: 1,
    grades: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    streams: 'all',
    roomName: 'Main Assembly Quadrangle',
    teacherName: 'Dr. Arthur Mwangi (Head Teacher)',
    notes: 'Mandatory school assembly, national anthem, scriptural devotion, executive briefing, and student body address.',
    isActive: true
  },
  {
    id: 'fix-games-fri',
    title: 'Co-Curricular Sports, Physical Training & Clubs',
    subject: 'Physical Education & Sports',
    dayOfWeek: 'Friday',
    period: 8,
    grades: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    streams: 'all',
    roomName: 'Main Sports Pitch & Athletics Track',
    teacherName: 'Mr. Peter Ochieng (Sports Director)',
    notes: 'School-wide athletics, football, volleyball, netball drills, debate societies, and scouting parade.',
    isActive: true
  },
  {
    id: 'fix-remedial-wed',
    title: 'Remedial Mentorship & Library Study Hour',
    subject: 'Remedial & Library Study',
    dayOfWeek: 'Wednesday',
    period: 7,
    grades: [4, 5, 6, 7, 8, 9],
    streams: 'all',
    roomName: 'Library & Media Resource Center',
    teacherName: 'Mrs. Esther Kamau (Librarian)',
    notes: 'Formative assessment remediation, research literature consultation, and personalized teacher guidance.',
    isActive: true
  },
  {
    id: 'fix-stem-lab-thu',
    title: 'Junior School STEM & Science Practical Block',
    subject: 'Integrated Science',
    dayOfWeek: 'Thursday',
    period: 4,
    grades: [7, 8, 9],
    streams: 'all',
    roomName: 'Junior Science Lab 1',
    teacherName: 'Dr. Mercy Mwangi (HOD Sciences)',
    notes: 'Laboratory safety, scientific titration experiments, biology microscope slides, and physics mechanics.',
    isActive: true
  },
  {
    id: 'fix-creative-arts-tue',
    title: 'Creative Arts, Music & Cultural Rehearsal',
    subject: 'Creative Arts & Sports',
    dayOfWeek: 'Tuesday',
    period: 6,
    grades: [7, 8, 9],
    streams: 'all',
    roomName: 'Fine Art & Music Studio',
    teacherName: 'Mr. Peter Mutua',
    notes: 'Practical fine art drawing, Kenyan musical instrument practice, and folk choral verse rehearsals.',
    isActive: true
  }
];

export const INITIAL_SHARED_FACILITIES: SharedResourceFacility[] = [
  {
    id: 'fac-science-lab-1',
    name: 'Junior Science Lab 1',
    type: 'science_lab',
    capacity: 40,
    suitableSubjects: ['Integrated Science', 'Health Education'],
    location: 'Science Wing Room 101'
  },
  {
    id: 'fac-science-lab-2',
    name: 'Junior Science Lab 2',
    type: 'science_lab',
    capacity: 40,
    suitableSubjects: ['Integrated Science', 'Agriculture and Nutrition'],
    location: 'Science Wing Room 102'
  },
  {
    id: 'fac-comp-lab-a',
    name: 'Computer Lab A',
    type: 'computer_lab',
    capacity: 45,
    suitableSubjects: ['Pretechnical Education', 'Mathematics'],
    location: 'Technology Block Floor 2'
  },
  {
    id: 'fac-comp-lab-b',
    name: 'Computer Lab B',
    type: 'computer_lab',
    capacity: 40,
    suitableSubjects: ['Pretechnical Education', 'English'],
    location: 'Technology Block Floor 2'
  },
  {
    id: 'fac-art-studio',
    name: 'Fine Art & Music Studio',
    type: 'art_studio',
    capacity: 35,
    suitableSubjects: ['Creative Arts', 'Creative Arts & Sports'],
    location: 'Creative Arts Center'
  },
  {
    id: 'fac-agri-plot',
    name: 'Agricultural Demonstration Plot',
    type: 'agri_plot',
    capacity: 50,
    suitableSubjects: ['Agriculture and Nutrition', 'Pretechnical Education'],
    location: 'Campus East Farm Quad'
  },
  {
    id: 'fac-sports-pitch',
    name: 'Main Sports Pitch',
    type: 'sports_field',
    capacity: 100,
    suitableSubjects: ['Physical Education', 'Physical Education & Sports', 'Creative Arts & Sports'],
    location: 'Central Athletics Field'
  },
  {
    id: 'fac-workshop',
    name: 'Pre-Technical & Home Science Workshop',
    type: 'workshop',
    capacity: 35,
    suitableSubjects: ['Pretechnical Education', 'Agriculture and Nutrition'],
    location: 'Vocational Block'
  },
  {
    id: 'fac-library',
    name: 'Library & Media Resource Center',
    type: 'library',
    capacity: 60,
    suitableSubjects: ['English', 'Kiswahili', 'Remedial & Library Study', 'Social Studies'],
    location: 'Main Academic Building Ground Floor'
  }
];

export interface SubjectCurriculumDemand {
  subject: SubjectName;
  periodsPerWeek: number;
  requiresSpecialistFacility?: boolean;
  preferredFacilityType?: 'science_lab' | 'computer_lab' | 'art_studio' | 'sports_field' | 'workshop' | 'agri_plot' | 'library';
}

export const PRIMARY_CURRICULUM_DEMAND: SubjectCurriculumDemand[] = [
  { subject: 'Mathematics', periodsPerWeek: 5 },
  { subject: 'English', periodsPerWeek: 5 },
  { subject: 'Kiswahili', periodsPerWeek: 4 },
  { subject: 'Science and Technology', periodsPerWeek: 4, requiresSpecialistFacility: true, preferredFacilityType: 'science_lab' },
  { subject: 'Social Studies', periodsPerWeek: 3 },
  { subject: 'Religious Education', periodsPerWeek: 3 },
  { subject: 'Creative Arts', periodsPerWeek: 4, requiresSpecialistFacility: true, preferredFacilityType: 'art_studio' },
  { subject: 'Agriculture and Nutrition', periodsPerWeek: 4, requiresSpecialistFacility: true, preferredFacilityType: 'agri_plot' },
  { subject: 'Physical and Health Education', periodsPerWeek: 4, requiresSpecialistFacility: true, preferredFacilityType: 'sports_field' }
];

export const JUNIOR_CURRICULUM_DEMAND: SubjectCurriculumDemand[] = [
  { subject: 'Mathematics', periodsPerWeek: 5 },
  { subject: 'English', periodsPerWeek: 5 },
  { subject: 'Kiswahili', periodsPerWeek: 4 },
  { subject: 'Integrated Science', periodsPerWeek: 5, requiresSpecialistFacility: true, preferredFacilityType: 'science_lab' },
  { subject: 'Social Studies', periodsPerWeek: 3 },
  { subject: 'Religious Education', periodsPerWeek: 3 },
  { subject: 'Pretechnical Education', periodsPerWeek: 4, requiresSpecialistFacility: true, preferredFacilityType: 'computer_lab' },
  { subject: 'Agriculture and Nutrition', periodsPerWeek: 4, requiresSpecialistFacility: true, preferredFacilityType: 'agri_plot' },
  { subject: 'Creative Arts & Sports', periodsPerWeek: 4, requiresSpecialistFacility: true, preferredFacilityType: 'art_studio' },
  { subject: 'Health Education', periodsPerWeek: 2 }
];

export function getCurriculumDemandForGrade(grade: GradeLevel): SubjectCurriculumDemand[] {
  return grade >= 7 ? JUNIOR_CURRICULUM_DEMAND : PRIMARY_CURRICULUM_DEMAND;
}
