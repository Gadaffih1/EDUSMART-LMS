# EduSmart app_records SQL

- `app_records_schema.sql` creates the generic `public.app_records` store and its indexes/trigger.
- `../migrations/0002_authenticated_app_records.sql` replaces permissive policies with authenticated tenant/role-scoped policies.
- `../migrations/0003_normalized_accounts.sql` creates `app_users`, `learner_accounts`, `parent_accounts`, `staff_accounts`, and `parent_learner_links`. It copies matching legacy user records only when a Supabase Auth user exists with matching trusted metadata.
- `../migrations/0004_admin_accounts.sql` creates a separate admin identity table with an ID, Auth user ID, and email. Passwords remain in Supabase Auth and are never stored in this table.
- `app_records_seed_tenant_456.sql` inserts initial persisted application records for tenant `456`, preserving existing rows.
- `run_all.psql` runs these files in order. Run it from this directory with `psql -v ON_ERROR_STOP=1 "$DATABASE_URL" -f run_all.psql`.

In the Supabase Dashboard SQL Editor, run `app_records_schema.sql`, then `../migrations/0002_authenticated_app_records.sql`, `../migrations/0003_normalized_accounts.sql`, `../migrations/0004_admin_accounts.sql`, and finally `app_records_seed_tenant_456.sql`.

To invite the first administrator after applying migrations `0003` and `0004`, configure `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in `.env.local`, then run:

```powershell
npm run invite:admin -- --tenant-id 456 --email admin@example.com --name "School Administrator" --redirect-to https://your-domain.example/auth/setup-password --confirm
```

The server-side command sends a Supabase Auth invitation, sets trusted `app_metadata` to the admin role and tenant, and creates the `app_users` and `admin_accounts` profiles. It does not accept, store, or print a password; the administrator sets one through the Auth invitation flow. Never expose the secret key to the browser or commit it.

After applying the normalized account migration, verify its result with:

```powershell
npm run verify:accounts -- --tenant-id 456
```

Regenerate seed data from the TypeScript data registries with:

```powershell
npm run generate:supabase-sql -- --tenant-id 456
```

To use a different tenant ID, pass it to the generator and update the `\ir` target in `run_all.psql` to match the generated filename. The generated sample data may contain fictional student, medical, payroll, or financial examples. Review it before using it in a production tenant.

The generated seed includes persisted records from the storage registries. It excludes Auth users, password records, role permissions, platform customization, starter documentation, the platform-wide tenant registry, and non-persisted reference/configuration constants. Auth users must be provisioned separately with trusted Supabase `app_metadata`.

The application still reads and writes `app_records`; the normalized tables are additive and are not yet the application's active data layer. Do not drop `app_records` or treat this as a completed cutover.
