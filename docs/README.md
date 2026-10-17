# EduSmart LMS Integrated Portals Starter Package

This package implements the target architecture specified in the EduSmart Integrated Operations & Finance design.

## Architecture Overview
- **EduSmart LMS Core**: Preserves student portal, parent portal, tenant schools, and teacher modules.
- **Shared Integration Layer**: Multi-tenant isolation, role-based approvals, audit logs, and notification feeds.
- **Portals**:
  1. **Finance**: Billing, payments, fee statements, general ledgers, departmental budgets.
  2. **Procurement**: Purchase requisitions, approved vendor directory, RFQ bidding, Local Purchase Orders (LPO).
  3. **Stores & Inventory**: Stock catalog, multi-location stock levels, Goods Received Notes (GRN), Store Issue Vouchers (SIV), stocktake audits.
  4. **HR & Payroll**: Employee master dossiers, Kenyan statutory deductions (PAYE, NSSF, NHIF/SHIF, Housing Levy 1.5%), monthly payroll runs, digital payslips.

## Included Files in this Starter Package
- `001_core_schema.sql`: Additive PostgreSQL schema with tenant-scoped tables and indices.
- `API_CONTRACT.md`: Proposed API routes, request/response models, and security rules.
- `IMPLEMENTATION_PLAN.md`: Phased rollout sequence.
- `ACCEPTANCE_TESTS.md`: Verification test cases for tenant isolation, financial integrity, and statutory calculations.
- `README.md`: This installation and architectural overview guide.

## Supabase app_records setup

The running application uses the generic `app_records` store, not the normalized tables in `001_core_schema.sql`. The normalized identity migration is an additive staging step.

1. In the Supabase SQL Editor, apply `../supabase/migrations/0001_app_records.sql`, then `../supabase/migrations/0002_authenticated_app_records.sql`.
2. Provision existing Supabase Auth users through a trusted, server-side process and set their trusted `app_metadata` fields: `app_user_id`, `tenant_id`, and `role`. Do not allow clients to set these claims.
3. Configure the client with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Keep `SUPABASE_SECRET_KEY` server-only; never expose it through a `VITE_` variable or commit it.
4. Set `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `SEED_TENANT_ID` in the private environment, then run `npm run seed:supabase -- --confirm` to add missing initial records and legacy Auth-backed profiles.
5. Apply `../supabase/migrations/0003_normalized_accounts.sql`. It creates the normalized account tables and imports only legacy profiles already matching a trusted Supabase Auth user.
6. Apply `../supabase/migrations/0004_admin_accounts.sql`. It creates a separate admin identity table with an ID, Auth user ID, and email; passwords stay in Supabase Auth.
7. Invite the first/new administrator as described below. The invite command creates the Auth account and normalized admin profiles after migrations `0003` and `0004`.

The migration order is required. The second migration removes anonymous access and enforces tenant/role checks. Seeding has not been run by applying these source changes; each target Supabase project must be migrated and seeded explicitly.

The initial dataset contains sample records. Review and replace sample medical, finance, payroll, and student data before seeding a production tenant; the importer preserves existing rows but does not verify that sample values are real or appropriate.

Migration `0003_normalized_accounts.sql` adds shared `app_users` profiles and separate `learner_accounts`, `parent_accounts`, `staff_accounts`, and `parent_learner_links` tables. It imports only legacy user records matched to an existing Supabase Auth account with the same trusted `app_metadata`. The application continues to use `app_records` until its data access paths are deliberately migrated and verified; do not drop the generic table as part of this setup.

To invite an administrator after applying migrations `0003` and `0004`, add `<https-url>/auth/setup-password` to Supabase Auth's allowed redirect URLs, then run `npm run invite:admin -- --tenant-id <tenant-id> --email <email> --name "<display name>" --redirect-to <https-url>/auth/setup-password --confirm`. Supabase Auth sends the invitation, and the setup page lets the invited user set a password through Auth; the application does not store it in SQL. Verify imported account counts with `npm run verify:accounts -- --tenant-id <tenant-id>`.

These tables are additive staging for normalization, not an application cutover. Existing LMS modules continue to read/write `app_records`; migrate and verify each feature before removing that legacy store.
