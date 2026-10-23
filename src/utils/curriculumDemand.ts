import { GradeLevel, SubjectName } from '../types';

export interface SubjectCurriculumDemand {
  subject: SubjectName;
  periodsPerWeek: number;
  requiresSpecialistFacility?: boolean;
  preferredFacilityType?: 'science_lab' | 'computer_lab' | 'art_studio' | 'sports_field' | 'workshop' | 'agri_plot' | 'library';
}

function readDemand(key: string): SubjectCurriculumDemand[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getCurriculumDemandForGrade(grade: GradeLevel): SubjectCurriculumDemand[] {
  const key = grade >= 7
    ? 'edusmart_junior_curriculum_demand_v1'
    : 'edusmart_primary_curriculum_demand_v1';
  return readDemand(key);
}
