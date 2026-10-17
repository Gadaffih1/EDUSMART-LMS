-- Add normalized identity and role-specific account tables alongside app_records.
-- Credentials stay in Supabase Auth; these tables must never store passwords.

create table if not exists public.app_users (
  auth_user_id uuid primary key references auth.users (id) on delete cascade,
  tenant_id text not null,
  app_user_id text not null,
  email text not null,
  display_name text not null,
  role text not null check (role in (
    'student', 'parent', 'teacher', 'class_teacher', 'hod', 'senior_teacher',
    'deputy_head', 'dean_of_studies', 'curriculum_coordinator', 'librarian',
    'head_teacher', 'school_admin_staff', 'nurse', 'transport_team',
    'cocurricular_team', 'finance_officer', 'procurement_officer',
    'storekeeper', 'hr_manager', 'admin'
  )),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, app_user_id)
);

create unique index if not exists app_users_tenant_email_idx
  on public.app_users (tenant_id, lower(email));

create table if not exists public.learner_accounts (
  learner_id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  app_user_id text not null,
  auth_user_id uuid references public.app_users (auth_user_id) on delete set null,
  full_name text not null,
  email text,
  admission_number text,
  grade text,
  stream text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, app_user_id),
  unique (tenant_id, admission_number)
);

create table if not exists public.parent_accounts (
  parent_id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  app_user_id text not null,
  auth_user_id uuid references public.app_users (auth_user_id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, app_user_id)
);

create table if not exists public.staff_accounts (
  staff_id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  app_user_id text not null,
  auth_user_id uuid references public.app_users (auth_user_id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  job_title text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, app_user_id)
);

create table if not exists public.parent_learner_links (
  tenant_id text not null,
  parent_app_user_id text not null,
  learner_app_user_id text not null,
  relationship text,
  created_at timestamptz not null default now(),
  primary key (tenant_id, parent_app_user_id, learner_app_user_id),
  foreign key (tenant_id, parent_app_user_id)
    references public.parent_accounts (tenant_id, app_user_id) on delete cascade,
  foreign key (tenant_id, learner_app_user_id)
    references public.learner_accounts (tenant_id, app_user_id) on delete cascade
);

create index if not exists learner_accounts_tenant_grade_idx
  on public.learner_accounts (tenant_id, grade, stream);
create index if not exists parent_accounts_tenant_idx
  on public.parent_accounts (tenant_id);
create index if not exists staff_accounts_tenant_idx
  on public.staff_accounts (tenant_id);
create index if not exists parent_learner_links_learner_idx
  on public.parent_learner_links (tenant_id, learner_app_user_id);

create or replace function public.app_accounts_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists app_users_touch_trg on public.app_users;
create trigger app_users_touch_trg
  before update on public.app_users
  for each row execute function public.app_accounts_touch();
drop trigger if exists learner_accounts_touch_trg on public.learner_accounts;
create trigger learner_accounts_touch_trg
  before update on public.learner_accounts
  for each row execute function public.app_accounts_touch();
drop trigger if exists parent_accounts_touch_trg on public.parent_accounts;
create trigger parent_accounts_touch_trg
  before update on public.parent_accounts
  for each row execute function public.app_accounts_touch();
drop trigger if exists staff_accounts_touch_trg on public.staff_accounts;
create trigger staff_accounts_touch_trg
  before update on public.staff_accounts
  for each row execute function public.app_accounts_touch();

alter table public.app_users enable row level security;
alter table public.learner_accounts enable row level security;
alter table public.parent_accounts enable row level security;
alter table public.staff_accounts enable row level security;
alter table public.parent_learner_links enable row level security;

drop policy if exists app_users_select_scoped on public.app_users;
create policy app_users_select_scoped on public.app_users
  for select to authenticated
  using (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
    and (
      auth_user_id = auth.uid()
      or auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
    )
  );

drop policy if exists app_users_admin_manage on public.app_users;
create policy app_users_admin_manage on public.app_users
  for all to authenticated
  using (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
    and auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  )
  with check (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
    and auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );

drop policy if exists learner_accounts_select_scoped on public.learner_accounts;
create policy learner_accounts_select_scoped on public.learner_accounts
  for select to authenticated
  using (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
    and (
      auth.jwt() -> 'app_metadata' ->> 'role' in (
        'admin', 'head_teacher', 'deputy_head', 'school_admin_staff',
        'teacher', 'class_teacher', 'hod', 'senior_teacher',
        'dean_of_studies', 'curriculum_coordinator'
      )
      or auth_user_id = auth.uid()
      or exists (
        select 1
        from public.parent_learner_links link
        join public.app_users parent_user
          on parent_user.tenant_id = link.tenant_id
         and parent_user.app_user_id = link.parent_app_user_id
        where link.tenant_id = learner_accounts.tenant_id
          and link.learner_app_user_id = learner_accounts.app_user_id
          and parent_user.auth_user_id = auth.uid()
          and parent_user.role = 'parent'
      )
    )
  );

drop policy if exists learner_accounts_admin_manage on public.learner_accounts;
create policy learner_accounts_admin_manage on public.learner_accounts
  for all to authenticated
  using (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
    and auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  )
  with check (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
    and auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );

drop policy if exists parent_accounts_select_scoped on public.parent_accounts;
create policy parent_accounts_select_scoped on public.parent_accounts
  for select to authenticated
  using (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
    and (
      auth_user_id = auth.uid()
      or auth.jwt() -> 'app_metadata' ->> 'role' in ('admin', 'head_teacher', 'deputy_head', 'school_admin_staff')
    )
  );

drop policy if exists parent_accounts_admin_manage on public.parent_accounts;
create policy parent_accounts_admin_manage on public.parent_accounts
  for all to authenticated
  using (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
    and auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  )
  with check (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
    and auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );

drop policy if exists staff_accounts_select_scoped on public.staff_accounts;
create policy staff_accounts_select_scoped on public.staff_accounts
  for select to authenticated
  using (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
    and (
      auth_user_id = auth.uid()
      or auth.jwt() -> 'app_metadata' ->> 'role' in ('admin', 'head_teacher', 'deputy_head', 'hr_manager')
    )
  );

drop policy if exists staff_accounts_admin_manage on public.staff_accounts;
create policy staff_accounts_admin_manage on public.staff_accounts
  for all to authenticated
  using (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
    and auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  )
  with check (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
    and auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );

drop policy if exists parent_learner_links_select_scoped on public.parent_learner_links;
create policy parent_learner_links_select_scoped on public.parent_learner_links
  for select to authenticated
  using (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
    and (
      auth.jwt() -> 'app_metadata' ->> 'role' in (
        'admin', 'head_teacher', 'deputy_head', 'school_admin_staff'
      )
      or exists (
        select 1
        from public.app_users parent_user
        where parent_user.tenant_id = parent_learner_links.tenant_id
          and parent_user.app_user_id = parent_learner_links.parent_app_user_id
          and parent_user.auth_user_id = auth.uid()
          and parent_user.role = 'parent'
      )
    )
  );

drop policy if exists parent_learner_links_admin_manage on public.parent_learner_links;
create policy parent_learner_links_admin_manage on public.parent_learner_links
  for all to authenticated
  using (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
    and auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  )
  with check (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
    and auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );

grant select, insert, update, delete on public.app_users to authenticated;
grant select, insert, update, delete on public.learner_accounts to authenticated;
grant select, insert, update, delete on public.parent_accounts to authenticated;
grant select, insert, update, delete on public.staff_accounts to authenticated;
grant select, insert, update, delete on public.parent_learner_links to authenticated;
grant all on public.app_users to service_role;
grant all on public.learner_accounts to service_role;
grant all on public.parent_accounts to service_role;
grant all on public.staff_accounts to service_role;
grant all on public.parent_learner_links to service_role;

-- Import only legacy profiles that are already backed by a Supabase Auth user
-- with matching trusted app_metadata. Keep unlinked demo profiles in app_records.
insert into public.app_users (
  auth_user_id, tenant_id, app_user_id, email, display_name, role, is_active
)
select
  auth_user.id,
  records.tenant_id,
  records.record_id,
  auth_user.email,
  coalesce(
    nullif(records.payload ->> 'name', ''),
    nullif(auth_user.raw_user_meta_data ->> 'name', ''),
    auth_user.email
  ),
  auth_user.raw_app_meta_data ->> 'role',
  coalesce((records.payload ->> 'isActive')::boolean, true)
from public.app_records records
join auth.users auth_user
  on auth_user.raw_app_meta_data ->> 'tenant_id' = records.tenant_id
 and auth_user.raw_app_meta_data ->> 'app_user_id' = records.record_id
 and auth_user.raw_app_meta_data ->> 'role' = records.payload ->> 'role'
where records.collection = 'edusmart_users_v1'
  and records.deleted = false
  and auth_user.email is not null
on conflict do nothing;

insert into public.learner_accounts (
  tenant_id, app_user_id, auth_user_id, full_name, email,
  admission_number, grade, stream, phone, is_active
)
select
  records.tenant_id,
  records.record_id,
  app_user.auth_user_id,
  coalesce(nullif(records.payload ->> 'name', ''), 'Learner'),
  nullif(records.payload ->> 'email', ''),
  nullif(records.payload ->> 'admissionNumber', ''),
  records.payload ->> 'grade',
  nullif(records.payload ->> 'stream', ''),
  nullif(records.payload ->> 'phone', ''),
  coalesce((records.payload ->> 'isActive')::boolean, true)
from public.app_records records
left join public.app_users app_user
  on app_user.tenant_id = records.tenant_id
 and app_user.app_user_id = records.record_id
where records.collection = 'edusmart_users_v1'
  and records.deleted = false
  and records.payload ->> 'role' = 'student'
on conflict do nothing;

insert into public.parent_accounts (
  tenant_id, app_user_id, auth_user_id, full_name, email, phone, is_active
)
select
  records.tenant_id,
  records.record_id,
  app_user.auth_user_id,
  coalesce(nullif(records.payload ->> 'name', ''), 'Parent'),
  nullif(records.payload ->> 'email', ''),
  nullif(records.payload ->> 'phone', ''),
  coalesce((records.payload ->> 'isActive')::boolean, true)
from public.app_records records
left join public.app_users app_user
  on app_user.tenant_id = records.tenant_id
 and app_user.app_user_id = records.record_id
where records.collection = 'edusmart_users_v1'
  and records.deleted = false
  and records.payload ->> 'role' = 'parent'
on conflict do nothing;

insert into public.staff_accounts (
  tenant_id, app_user_id, auth_user_id, full_name, email, phone, job_title, is_active
)
select
  records.tenant_id,
  records.record_id,
  app_user.auth_user_id,
  coalesce(nullif(records.payload ->> 'name', ''), 'Staff member'),
  nullif(records.payload ->> 'email', ''),
  nullif(records.payload ->> 'phone', ''),
  nullif(records.payload ->> 'jobTitle', ''),
  coalesce((records.payload ->> 'isActive')::boolean, true)
from public.app_records records
left join public.app_users app_user
  on app_user.tenant_id = records.tenant_id
 and app_user.app_user_id = records.record_id
where records.collection = 'edusmart_users_v1'
  and records.deleted = false
  and records.payload ->> 'role' not in ('student', 'parent', 'admin')
on conflict do nothing;

insert into public.parent_learner_links (
  tenant_id, parent_app_user_id, learner_app_user_id
)
select distinct
  parent_records.tenant_id,
  parent_records.record_id,
  child_ids.child_app_user_id
from public.app_records parent_records
cross join lateral jsonb_array_elements_text(
  case
    when jsonb_typeof(parent_records.payload -> 'childrenIds') = 'array'
      then parent_records.payload -> 'childrenIds'
    else '[]'::jsonb
  end
) as child_ids(child_app_user_id)
join public.parent_accounts parent_account
  on parent_account.tenant_id = parent_records.tenant_id
 and parent_account.app_user_id = parent_records.record_id
join public.learner_accounts learner_account
  on learner_account.tenant_id = parent_records.tenant_id
 and learner_account.app_user_id = child_ids.child_app_user_id
where parent_records.collection = 'edusmart_users_v1'
  and parent_records.deleted = false
  and parent_records.payload ->> 'role' = 'parent'
on conflict do nothing;
