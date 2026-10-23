import type { TPADStandardRating } from '../types';

type TpadStandardSeed = Omit<
  TPADStandardRating,
  'selfScore' | 'appraiserScore' | 'agreedScore' | 'evidenceDescription' | 'appraiserRemarks' | 'evidenceArtifactUrl'
>;

export function loadTpadStandards(): TpadStandardSeed[] {
  try {
    const raw = localStorage.getItem('edusmart_tpad_standards_v1');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed as TpadStandardSeed[] : [];
  } catch {
    return [];
  }
}
