  -- Keep administrator identity separate from role-specific profiles.
  -- Passwords remain exclusively in Supabase Auth.

  create table if not exists public.admin_accounts (
    id uuid primary key default gen_random_uuid(),
    auth_user_id uuid not null unique
      references public.app_users (auth_user_id) on delete cascade,
    email text not null,
    created_at timestamptz not null default now()
  );

  create unique index if not exists admin_accounts_email_idx
    on public.admin_accounts (lower(email));

  alter table public.admin_accounts enable row level security;

  drop policy if exists admin_accounts_select_self on public.admin_accounts;
  create policy admin_accounts_select_self on public.admin_accounts
    for select to authenticated
    using (auth_user_id = auth.uid());

  grant select on public.admin_accounts to authenticated;
  grant all on public.admin_accounts to service_role;

  insert into public.admin_accounts (auth_user_id, email)
  select auth_user_id, email
  from public.app_users
  where role = 'admin'
    and is_active
  on conflict (auth_user_id) do nothing;
