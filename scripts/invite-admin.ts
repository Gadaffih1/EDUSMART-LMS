import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });
config();

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

if (process.argv.includes('--help')) {
  console.info(
    'Usage: npm run invite:admin -- --tenant-id <id> --email <email> --name <name> --redirect-to <url> --confirm'
  );
  process.exit(0);
}

if (!process.argv.includes('--confirm')) {
  throw new Error('Admin invitation is disabled by default. Review the target and rerun with --confirm.');
}

const tenantId = argument('--tenant-id');
const email = argument('--email')?.trim().toLowerCase();
const name = argument('--name')?.trim();
const redirectTo = argument('--redirect-to');
const supabaseUrl = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!tenantId || !email || !name || !redirectTo || !supabaseUrl || !secretKey) {
  throw new Error(
    'Tenant ID, email, name, redirect URL, SUPABASE_URL, and SUPABASE_SECRET_KEY are required.'
  );
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error('Provide a valid admin email address.');
}

const redirectUrl = new URL(redirectTo);
if (
  redirectUrl.protocol !== 'https:' &&
  !(redirectUrl.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(redirectUrl.hostname))
) {
  throw new Error('Admin invitation redirect URL must use HTTPS (or localhost for development).');
}

const supabase = createClient(supabaseUrl, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const [
  { error: profileTableError },
  { error: recordsTableError },
  { error: adminAccountsTableError },
] = await Promise.all([
  supabase.from('app_users').select('auth_user_id', { head: true }).limit(0),
  supabase.from('app_records').select('record_id', { head: true }).limit(0),
  supabase.from('admin_accounts').select('id', { head: true }).limit(0),
]);
if (profileTableError) {
  throw new Error(`The app_users table is unavailable. Apply migration 0003 before inviting an admin: ${profileTableError.message}`);
}
if (recordsTableError) {
  throw new Error(`The app_records table is unavailable. Apply migrations 0001 and 0002 before inviting an admin: ${recordsTableError.message}`);
}
if (adminAccountsTableError) {
  throw new Error(`The admin_accounts table is unavailable. Apply migration 0004 before inviting an admin: ${adminAccountsTableError.message}`);
}

for (let page = 1; ; page += 1) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) throw new Error(`Unable to check whether the admin email is already registered: ${error.message}`);
  if (data.users.some(user => user.email?.toLowerCase() === email)) {
    throw new Error(`An Auth user already exists for ${email}. No invitation was sent; use the existing-account provisioning process.`);
  }
  if (data.users.length < 1000) break;
}

const { data: invitation, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
  data: { name },
  redirectTo: redirectUrl.toString(),
});
if (inviteError) {
  throw new Error(`Unable to invite admin: ${inviteError.message}`);
}
if (!invitation.user) {
  throw new Error('Supabase returned no invited user. No normalized admin profile was created.');
}

const authUser = invitation.user;
const { error: metadataError } = await supabase.auth.admin.updateUserById(authUser.id, {
  app_metadata: {
    ...authUser.app_metadata,
    app_user_id: authUser.id,
    tenant_id: tenantId,
    role: 'admin',
  },
});
if (metadataError) {
  throw new Error(
    `The invitation was sent, but trusted admin metadata could not be set. The account is not ready to sign in: ${metadataError.message}`
  );
}

const { error: profileError } = await supabase.from('app_users').insert({
  auth_user_id: authUser.id,
  tenant_id: tenantId,
  app_user_id: authUser.id,
  email,
  display_name: name,
  role: 'admin',
  is_active: true,
});
if (profileError) {
  throw new Error(
    `The invitation was sent and trusted metadata was set, but the app_users profile could not be created. The account is not ready to sign in: ${profileError.message}`
  );
}

const { error: adminAccountError } = await supabase.from('admin_accounts').insert({
  auth_user_id: authUser.id,
  email,
});
if (adminAccountError) {
  throw new Error(
    `The invitation and app_users profile were created, but the admin_accounts profile could not be created. The account is not ready for admin access: ${adminAccountError.message}`
  );
}

const { error: legacyProfileError } = await supabase.from('app_records').upsert({
  tenant_id: tenantId,
  collection: 'edusmart_users_v1',
  record_id: authUser.id,
  payload: {
    id: authUser.id,
    name,
    email,
    role: 'admin',
    schoolId: tenantId,
    isActive: true,
  },
  deleted: false,
}, {
  onConflict: 'tenant_id,collection,record_id',
});
if (legacyProfileError) {
  throw new Error(
    `The invitation and normalized profile were created, but the current app_records login profile could not be created. The account cannot sign in until this is fixed: ${legacyProfileError.message}`
  );
}

console.info(`Admin invitation sent for ${email} in tenant ${tenantId}. The user must accept the email and set their password through Supabase Auth.`);
