import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { INITIAL_CURRICULUM_WRITTEN_REPORTS } from '../src/data/curriculumWrittenReportsData.ts';

config({ path: '.env.local' });
config();

const TABLE = 'app_records';
const COLLECTION = 'edusmart_curriculum_written_reports_v1';
const selectedTenantIdIndex = process.argv.indexOf('--tenant-id');
const selectedTenantId = selectedTenantIdIndex >= 0
  ? process.argv[selectedTenantIdIndex + 1]
  : undefined;
const tenantId = selectedTenantId || process.env.SEED_TENANT_ID;
const supabaseUrl = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (process.argv.includes('--help')) {
  console.info('Set SUPABASE_URL and SUPABASE_SECRET_KEY, then run with --tenant-id <id> --confirm.');
  process.exit(0);
}

if (!process.argv.includes('--confirm')) {
  throw new Error('Seeding is disabled by default. Review the tenant and rerun with --confirm.');
}
if (!tenantId || !supabaseUrl || !secretKey) {
  throw new Error('A tenant ID, SUPABASE_URL, and SUPABASE_SECRET_KEY are required.');
}

const reports = INITIAL_CURRICULUM_WRITTEN_REPORTS.slice(0, 2);
if (reports.length !== 2) {
  throw new Error('Expected at least two curriculum report records in the source data.');
}

const supabase = createClient(supabaseUrl, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const reportIds = reports.map(report => report.id);
const { data: existingRows, error: existingError } = await supabase
  .from(TABLE)
  .select('record_id,tenant_id')
  .eq('collection', COLLECTION)
  .in('record_id', reportIds);

if (existingError) {
  throw new Error(`Unable to inspect ${TABLE}: ${existingError.message}`);
}

const conflicts = (existingRows || []).filter(row => row.tenant_id !== tenantId);
if (conflicts.length > 0) {
  throw new Error(
    `Record IDs already exist under a different tenant: ${conflicts.map(row => row.record_id).join(', ')}. No rows were written.`
  );
}

const existingIds = new Set((existingRows || []).map(row => row.record_id));
const records = reports
  .filter(report => !existingIds.has(report.id))
  .map(report => ({
    tenant_id: tenantId,
    collection: COLLECTION,
    record_id: report.id,
    payload: report,
    deleted: false,
  }));

if (records.length > 0) {
  const { error: insertError } = await supabase.from(TABLE).insert(records);
  if (insertError) {
    throw new Error(`Unable to seed curriculum reports: ${insertError.message}`);
  }
}

const { data: verifiedRows, error: verifyError } = await supabase
  .from(TABLE)
  .select('record_id')
  .eq('tenant_id', tenantId)
  .eq('collection', COLLECTION)
  .in('record_id', reportIds);

if (verifyError) {
  throw new Error(`Unable to verify seeded curriculum reports: ${verifyError.message}`);
}

const verifiedIds = new Set((verifiedRows || []).map(row => row.record_id));
if (reportIds.some(id => !verifiedIds.has(id))) {
  throw new Error('Seed completed without verifying both requested curriculum report records.');
}

console.info(
  `Verified 2 curriculum reports for tenant ${tenantId}: ${records.length} inserted, ${existingIds.size} already present.`
);
