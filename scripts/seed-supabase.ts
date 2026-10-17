import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });
config();

const targetTenantId = process.env.SEED_TENANT_ID;
const supabaseUrl = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (process.argv.includes('--help')) {
  console.info('Set SEED_TENANT_ID, SUPABASE_URL, and SUPABASE_SECRET_KEY, then run with --confirm.');
  process.exit(0);
}

if (!process.argv.includes('--confirm')) {
  throw new Error('Seeding is disabled by default. Review the target and rerun with --confirm.');
}
if (!targetTenantId || !supabaseUrl || !secretKey) {
  throw new Error('SEED_TENANT_ID, SUPABASE_URL, and SUPABASE_SECRET_KEY are required.');
}

class MemoryLocalStorage {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, String(value));
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  clear(): void {
    this.values.clear();
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  get length(): number {
    return this.values.size;
  }
}

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: new MemoryLocalStorage(),
});

const [{ Storage }, { OperationsStorage }] = await Promise.all([
  import('../src/utils/storage.ts'),
  import('../src/utils/operationsStorage.ts'),
]);

const supabase = createClient(supabaseUrl, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type AppRecord = {
  tenant_id: string;
  collection: string;
  record_id: string;
  payload: unknown;
  deleted: false;
};

function redactPasswords(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactPasswords);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !key.toLowerCase().includes('password'))
      .map(([key, item]) => [key, redactPasswords(item)])
  );
}

function applyTenant(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(applyTenant);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      (key === 'tenantId' || key === 'schoolId') && typeof item === 'string'
        ? targetTenantId
        : applyTenant(item),
    ])
  );
}

function recordsForCollection(collection: string, value: unknown): AppRecord[] {
  const entries = Array.isArray(value)
    ? value.map((payload, index) => ({
        id: payload && typeof payload === 'object' && 'id' in payload
          ? String((payload as { id: unknown }).id)
          : `idx:${index}`,
        payload,
      }))
    : value && typeof value === 'object'
      ? [{ id: 'singleton', payload: value }]
      : [];

  return entries.map(({ id, payload }) => ({
    tenant_id: targetTenantId!,
    collection,
    record_id: id,
    payload: applyTenant(redactPasswords(payload)),
    deleted: false,
  }));
}

async function loadExistingIds(collection: string): Promise<Set<string>> {
  const ids = new Set<string>();
  let from = 0;
  const pageSize = 1000;
  for (;;) {
    const { data, error } = await supabase
      .from('app_records')
      .select('record_id')
      .eq('tenant_id', targetTenantId!)
      .eq('collection', collection)
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`Unable to inspect ${collection}: ${error.message}`);
    for (const row of data || []) ids.add(row.record_id);
    if (!data || data.length < pageSize) return ids;
    from += pageSize;
  }
}

async function seedCollection(collection: string, value: unknown): Promise<number> {
  const existing = await loadExistingIds(collection);
  const missing = recordsForCollection(collection, value)
    .filter(record => !existing.has(record.record_id));

  for (let index = 0; index < missing.length; index += 500) {
    const { error } = await supabase
      .from('app_records')
      .upsert(missing.slice(index, index + 500), {
        onConflict: 'tenant_id,collection,record_id',
        ignoreDuplicates: true,
      });
    if (error) throw new Error(`Unable to seed ${collection}: ${error.message}`);
  }
  return missing.length;
}

async function importAuthProfiles(): Promise<{ imported: number; mappedAccounts: number }> {
  const existing = await loadExistingIds('edusmart_users_v1');
  const validRoles = new Set([
    'student', 'parent', 'teacher', 'class_teacher', 'hod', 'senior_teacher',
    'deputy_head', 'dean_of_studies', 'curriculum_coordinator', 'librarian',
    'head_teacher', 'school_admin_staff', 'nurse', 'transport_team',
    'cocurricular_team', 'finance_officer', 'procurement_officer',
    'storekeeper', 'hr_manager', 'admin',
  ]);
  const profiles: AppRecord[] = [];
  const perPage = 1000;
  let mappedAccounts = 0;

  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`Unable to list Supabase Auth users: ${error.message}`);

    for (const authUser of data.users) {
      const metadata = authUser.app_metadata || {};
      const appUserId = metadata.app_user_id;
      const tenantId = metadata.tenant_id;
      const role = metadata.role;
      if (
        tenantId !== targetTenantId ||
        typeof appUserId !== 'string' ||
        typeof role !== 'string' ||
        !validRoles.has(role)
      ) continue;
      mappedAccounts += 1;
      if (existing.has(appUserId)) continue;

      const userMetadata = authUser.user_metadata || {};
      const displayName = userMetadata.name || userMetadata.full_name || authUser.email;
      if (!authUser.email || typeof displayName !== 'string') continue;

      profiles.push({
        tenant_id: targetTenantId!,
        collection: 'edusmart_users_v1',
        record_id: appUserId,
        payload: {
          id: appUserId,
          name: displayName,
          email: authUser.email,
          role,
          schoolId: targetTenantId,
          isActive: !authUser.banned_until,
          grade: metadata.grade,
          stream: metadata.stream,
          childrenIds: metadata.children_ids,
        },
        deleted: false,
      });
    }

    if (data.users.length < perPage) break;
  }

  for (let index = 0; index < profiles.length; index += 500) {
    const { error } = await supabase
      .from('app_records')
      .upsert(profiles.slice(index, index + 500), {
        onConflict: 'tenant_id,collection,record_id',
        ignoreDuplicates: true,
      });
    if (error) throw new Error(`Unable to import Auth profiles: ${error.message}`);
  }
  return { imported: profiles.length, mappedAccounts };
}

const { imported: profileCount, mappedAccounts } = await importAuthProfiles();
if (mappedAccounts === 0) {
  throw new Error('No mapped Supabase Auth users were found for SEED_TENANT_ID.');
}
let seededCount = 0;
const seedCollections = {
  ...Storage.getInitialSeedCollections(),
  ...OperationsStorage.getInitialSeedCollections(),
};

for (const [collection, value] of Object.entries(seedCollections)) {
  if (collection === 'edusmart_grade_passwords_v1' || collection === 'edusmart_users_v1') continue;
  const count = await seedCollection(collection, value);
  if (count > 0) console.info(`Seeded ${count} initial records into ${collection}.`);
  seededCount += count;
}

console.info(`Seed complete for tenant ${targetTenantId}: ${profileCount} Auth profiles added, ${seededCount} initial records added. Existing records were preserved.`);
