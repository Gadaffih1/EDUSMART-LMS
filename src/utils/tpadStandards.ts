import type { TPADStandardRating } from '../types';
import { ClientDataStore } from './clientDataStore';

type TpadStandardSeed = Omit<
  TPADStandardRating,
  'selfScore' | 'appraiserScore' | 'agreedScore' | 'evidenceDescription' | 'appraiserRemarks' | 'evidenceArtifactUrl'
>;

export function loadTpadStandards(): TpadStandardSeed[] {
  const data = ClientDataStore.getCollection<TpadStandardSeed[]>('edusmart_tpad_standards_v1', []);
  return Array.isArray(data) ? data : [];
}
