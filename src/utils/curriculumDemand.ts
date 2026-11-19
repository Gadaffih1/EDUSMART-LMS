import { GradeLevel, SubjectName } from '../types';
import { ClientDataStore } from './clientDataStore';

export interface SubjectCurriculumDemand {
  subject: SubjectName;
  periodsPerWeek: number;
  requiresSpecialistFacility?: boolean;
  preferredFacilityType?: 'science_lab' | 'computer_lab' | 'art_studio' | 'sports_field' | 'workshop' | 'agri_plot' | 'library';
}

function readDemand(key: string): SubjectCurriculumDemand[] {
  const data = ClientDataStore.getCollection<SubjectCurriculumDemand[]>(key, []);
  return Array.isArray(data) ? data : [];
}

export function getCurriculumDemandForGrade(grade: GradeLevel): SubjectCurriculumDemand[] {
  const key = grade >= 7
    ? 'edusmart_junior_curriculum_demand_v1'
    : 'edusmart_primary_curriculum_demand_v1';
  return readDemand(key);
}
