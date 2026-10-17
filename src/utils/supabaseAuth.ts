import type { User, UserRole } from '../types';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { SyncEngine } from './syncEngine';

const USER_ROLES: ReadonlySet<string> = new Set([
  'student',
  'parent',
  'teacher',
  'class_teacher',
  'hod',
  'senior_teacher',
  'deputy_head',
  'dean_of_studies',
  'curriculum_coordinator',
  'librarian',
  'head_teacher',
  'school_admin_staff',
  'nurse',
  'transport_team',
  'cocurricular_team',
  'finance_officer',
  'procurement_officer',
  'storekeeper',
  'hr_manager',
  'admin',
]);

function requiredMetadataValue(metadata: Record<string, unknown>, key: string): string {
  const value = metadata[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Supabase Auth app_metadata is missing ${key}.`);
  }
  return value.trim();
}

export async function getAuthenticatedAppUser(): Promise<User | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(`Unable to verify the Supabase session: ${error.message}`);
  const authUser = data.user;
  if (!authUser) {
    SyncEngine.activateIdentity(null);
    return null;
  }

  const metadata = authUser.app_metadata as Record<string, unknown>;
  const appUserId = requiredMetadataValue(metadata, 'app_user_id');
  const tenantId = requiredMetadataValue(metadata, 'tenant_id');
  const role = requiredMetadataValue(metadata, 'role');
  if (!USER_ROLES.has(role)) {
    throw new Error('Supabase Auth app_metadata contains an unsupported EduSmart role.');
  }
  SyncEngine.activateIdentity(appUserId, tenantId);

  const { data: profileRecord, error: profileError } = await supabase
    .from('app_records')
    .select('payload')
    .eq('collection', 'edusmart_users_v1')
    .eq('record_id', appUserId)
    .eq('tenant_id', tenantId)
    .eq('deleted', false)
    .maybeSingle();

  if (profileError) {
    throw new Error(`Unable to load the signed-in user's profile: ${profileError.message}`);
  }

  const profile = profileRecord?.payload && typeof profileRecord.payload === 'object'
    ? profileRecord.payload as Partial<User>
    : {};
  const displayName = typeof profile.name === 'string'
    ? profile.name
    : typeof authUser.user_metadata?.name === 'string'
      ? authUser.user_metadata.name
      : authUser.email;

  if (!authUser.email || !displayName) {
    throw new Error('The Supabase Auth user needs an email address and display name.');
  }

  const { password: _password, ...safeProfile } = profile;
  return {
    ...safeProfile,
    id: appUserId,
    name: displayName,
    email: authUser.email,
    role: role as UserRole,
    schoolId: tenantId,
    isActive: profile.isActive !== false,
  } as User;
}

export async function signInToEduSmart(email: string, password: string): Promise<User> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase Auth is not configured for this deployment.');
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);

  try {
    const user = await getAuthenticatedAppUser();
    if (!user) throw new Error('Supabase did not return an authenticated user.');
    await SyncEngine.hydrate();
    return user;
  } catch (error) {
    await supabase.auth.signOut();
    SyncEngine.activateIdentity(null);
    throw error;
  }
}
