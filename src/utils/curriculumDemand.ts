import { GradeLevel, SubjectName } from '../types';
import { ClientDataStore } from './clientDataStore';

export interface SubjectCurriculumDemand {
  subject: SubjectName;
  periodsPerWeek: number;
  requiresSpecialistFacility?: boolean;
  preferredFacilityType?: 'science_lab' | 'computer_lab' | 'art_studio' | 'sports_field' | 'workshop' | 'agri_plot' | 'library';
}

const DEFAULT_PRIMARY_WEEKLY_LESSONS: Record<string, { periodsPerWeek: number; requiresSpecialistFacility?: boolean; preferredFacilityType?: SubjectCurriculumDemand['preferredFacilityType'] }> = {
  mathematics: { periodsPerWeek: 5 },
  english: { periodsPerWeek: 5 },
  kiswahili: { periodsPerWeek: 4 },
  'science and technology': { periodsPerWeek: 4, requiresSpecialistFacility: true, preferredFacilityType: 'science_lab' },
  'agriculture and nutrition': { periodsPerWeek: 3, requiresSpecialistFacility: true, preferredFacilityType: 'agri_plot' },
  'social studies': { periodsPerWeek: 3 },
  'creative arts': { periodsPerWeek: 3, requiresSpecialistFacility: true, preferredFacilityType: 'art_studio' },
  'creative arts & sports': { periodsPerWeek: 3, requiresSpecialistFacility: true, preferredFacilityType: 'sports_field' },
  'religious education': { periodsPerWeek: 3 },
  'physical and health education': { periodsPerWeek: 3, requiresSpecialistFacility: true, preferredFacilityType: 'sports_field' },
  'library lesson': { periodsPerWeek: 1, requiresSpecialistFacility: true, preferredFacilityType: 'library' },
  arts: { periodsPerWeek: 2, requiresSpecialistFacility: true, preferredFacilityType: 'art_studio' },
  music: { periodsPerWeek: 2, requiresSpecialistFacility: true, preferredFacilityType: 'art_studio' },
  nutrition: { periodsPerWeek: 2 },
  french: { periodsPerWeek: 2 },
  swimming: { periodsPerWeek: 1, requiresSpecialistFacility: true, preferredFacilityType: 'sports_field' },
};

const DEFAULT_JUNIOR_WEEKLY_LESSONS: Record<string, { periodsPerWeek: number; requiresSpecialistFacility?: boolean; preferredFacilityType?: SubjectCurriculumDemand['preferredFacilityType'] }> = {
  mathematics: { periodsPerWeek: 5 },
  english: { periodsPerWeek: 5 },
  kiswahili: { periodsPerWeek: 4 },
  'integrated science': { periodsPerWeek: 5, requiresSpecialistFacility: true, preferredFacilityType: 'science_lab' },
  'pretechnical education': { periodsPerWeek: 4, requiresSpecialistFacility: true, preferredFacilityType: 'workshop' },
  'agriculture and nutrition': { periodsPerWeek: 4, requiresSpecialistFacility: true, preferredFacilityType: 'agri_plot' },
  'social studies': { periodsPerWeek: 4 },
  'creative arts & sports': { periodsPerWeek: 4, requiresSpecialistFacility: true, preferredFacilityType: 'sports_field' },
  'religious education': { periodsPerWeek: 3 },
  'health education': { periodsPerWeek: 2 },
  'library lesson': { periodsPerWeek: 1, requiresSpecialistFacility: true, preferredFacilityType: 'library' },
  arts: { periodsPerWeek: 2, requiresSpecialistFacility: true, preferredFacilityType: 'art_studio' },
  music: { periodsPerWeek: 2, requiresSpecialistFacility: true, preferredFacilityType: 'art_studio' },
  nutrition: { periodsPerWeek: 2 },
  french: { periodsPerWeek: 2 },
  swimming: { periodsPerWeek: 1, requiresSpecialistFacility: true, preferredFacilityType: 'sports_field' },
};

function readDemand(key: string): SubjectCurriculumDemand[] {
  const data = ClientDataStore.getCollection<SubjectCurriculumDemand[]>(key, []);
  return Array.isArray(data) ? data : [];
}

export function getCurriculumDemandForGrade(grade: GradeLevel): SubjectCurriculumDemand[] {
  const key = grade >= 7
    ? 'edusmart_junior_curriculum_demand_v1'
    : 'edusmart_primary_curriculum_demand_v1';
  const stored = readDemand(key);
  const defaults = grade >= 7 ? DEFAULT_JUNIOR_WEEKLY_LESSONS : DEFAULT_PRIMARY_WEEKLY_LESSONS;

  if (stored.length > 0) {
    const existingLower = new Set(stored.map((d) => String(d.subject).trim().toLowerCase()));
    const merged = [...stored];
    for (const [subjLower, meta] of Object.entries(defaults)) {
      if (!existingLower.has(subjLower)) {
        const displayName =
          subjLower === 'library lesson'
            ? 'Library Lesson'
            : subjLower === 'arts'
            ? 'Arts'
            : subjLower === 'music'
            ? 'Music'
            : subjLower === 'nutrition'
            ? 'Nutrition'
            : subjLower === 'french'
            ? 'French'
            : subjLower === 'swimming'
            ? 'Swimming'
            : null;
        if (displayName) {
          merged.push({
            subject: displayName as SubjectName,
            periodsPerWeek: meta.periodsPerWeek,
            requiresSpecialistFacility: meta.requiresSpecialistFacility,
            preferredFacilityType: meta.preferredFacilityType,
          });
        }
      }
    }
    return merged;
  }

  return Object.entries(defaults).map(([subjLower, meta]) => ({
    subject: subjLower.replace(/\b\w/g, (c) => c.toUpperCase()) as SubjectName,
    periodsPerWeek: meta.periodsPerWeek,
    requiresSpecialistFacility: meta.requiresSpecialistFacility,
    preferredFacilityType: meta.preferredFacilityType,
  }));
}

export function getSubjectDemandMeta(grade: GradeLevel, subject: string): SubjectCurriculumDemand | null {
  const clean = String(subject || '').trim().toLowerCase();
  if (!clean) return null;
  const list = getCurriculumDemandForGrade(grade);
  const found = list.find((d) => String(d.subject).trim().toLowerCase() === clean);
  if (found) return found;
  const defaults = grade >= 7 ? DEFAULT_JUNIOR_WEEKLY_LESSONS : DEFAULT_PRIMARY_WEEKLY_LESSONS;
  const def = defaults[clean];
  if (def) {
    return {
      subject: subject as SubjectName,
      periodsPerWeek: def.periodsPerWeek,
      requiresSpecialistFacility: def.requiresSpecialistFacility,
      preferredFacilityType: def.preferredFacilityType,
    };
  }
  return null;
}

/**
 * Resolves the authoritative weekly lesson count for a specific subject in a grade.
 * Prefers explicit stream/teacher allocation periodsPerWeek, then school curriculum demand.
 */
export function getSubjectWeeklyLessonLimit(
  grade: GradeLevel,
  subject: string,
  explicitPeriodsPerWeek?: number | null
): number {
  if (typeof explicitPeriodsPerWeek === 'number' && Number.isFinite(explicitPeriodsPerWeek) && explicitPeriodsPerWeek >= 1) {
    return Math.floor(explicitPeriodsPerWeek);
  }
  const meta = getSubjectDemandMeta(grade, subject);
  if (meta && meta.periodsPerWeek >= 1) {
    return Math.floor(meta.periodsPerWeek);
  }
  const lower = String(subject || '').trim().toLowerCase();
  if (lower.includes('library')) return 1;
  if (lower.includes('math') || lower.includes('english')) return 5;
  if (lower.includes('kiswahili') || lower.includes('science')) return 4;
  return 3;
}
