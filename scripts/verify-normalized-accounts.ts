import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });
config();

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

if (process.argv.includes('--help')) {
  console.info('Usage: npm run verify:accounts -- --tenant-id <id>');
  process.exit(0);
}

const tenantId = argument('--tenant-id');
const supabaseUrl = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!tenantId || !supabaseUrl || !secretKey) {
  throw new Error('Tenant ID, SUPABASE_URL, and SUPABASE_SECRET_KEY are required.');
}

const supabase = createClient(supabaseUrl, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function countRows(
  table: string,
  filters: Array<[string, string]>
): Promise<number> {
  let query = supabase.from(table).select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId);
  for (const [column, value] of filters) query = query.eq(column, value);
  const { count, error } = await query;
  if (error) throw new Error(`Unable to verify ${table}: ${error.message}`);
  return count ?? 0;
}

const counts = await Promise.all([
  countRows('app_users', []),
  countRows('learner_accounts', []),
  countRows('parent_accounts', []),
  countRows('staff_accounts', []),
  countRows('parent_learner_links', []),
]);

const [users, learners, parents, staff, links] = counts;
console.info(`Normalized account counts for tenant ${tenantId}:`);
console.info(`  app_users: ${users}`);
console.info(`  learner_accounts: ${learners}`);
console.info(`  parent_accounts: ${parents}`);
console.info(`  staff_accounts: ${staff}`);
console.info(`  parent_learner_links: ${links}`);

if (users === 0 && learners === 0 && parents === 0 && staff === 0) {
  throw new Error('No normalized accounts found. Apply migration 0003_normalized_accounts.sql first.');
}
