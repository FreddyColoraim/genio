create type public.app_role as enum ('admin', 'hr', 'manager', 'employee');
create type public.onboarding_status as enum ('not_started', 'in_progress', 'waiting', 'complete');
create type public.document_status as enum ('pending', 'review', 'signed');
create type public.onboarding_step_status as enum ('todo', 'done');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  workspace_id uuid,
  full_name text not null,
  role public.app_role not null default 'employee',
  created_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  team_size text,
  operating_mode text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_workspace_id_fkey
  foreign key (workspace_id) references public.workspaces(id) on delete cascade;

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  full_name text not null,
  email text not null,
  title text not null,
  department text not null,
  manager_name text,
  start_date date not null,
  status public.onboarding_status not null default 'not_started',
  progress int not null default 0 check (progress between 0 and 100),
  created_at timestamptz not null default now()
);

create table public.employee_documents (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  storage_path text not null,
  status public.document_status not null default 'pending',
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.employee_onboarding_steps (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  description text not null,
  position int not null,
  status public.onboarding_step_status not null default 'todo',
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  recipient_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.employees enable row level security;
alter table public.employee_documents enable row level security;
alter table public.employee_onboarding_steps enable row level security;
alter table public.notifications enable row level security;

create policy "profiles can read workspace members"
  on public.profiles for select
  using (workspace_id in (select workspace_id from public.profiles where id = auth.uid()));

create policy "workspace members can read workspace"
  on public.workspaces for select
  using (id in (select workspace_id from public.profiles where id = auth.uid()));

create policy "hr can manage employees"
  on public.employees for all
  using (
    workspace_id in (
      select workspace_id from public.profiles
      where id = auth.uid() and role in ('admin', 'hr', 'manager')
    )
  );

create policy "members can read documents"
  on public.employee_documents for select
  using (workspace_id in (select workspace_id from public.profiles where id = auth.uid()));

create policy "hr can manage documents"
  on public.employee_documents for all
  using (
    workspace_id in (
      select workspace_id from public.profiles
      where id = auth.uid() and role in ('admin', 'hr')
    )
  );

create policy "members can read onboarding steps"
  on public.employee_onboarding_steps for select
  using (workspace_id in (select workspace_id from public.profiles where id = auth.uid()));

create policy "hr can manage onboarding steps"
  on public.employee_onboarding_steps for all
  using (
    workspace_id in (
      select workspace_id from public.profiles
      where id = auth.uid() and role in ('admin', 'hr', 'manager')
    )
  );

create policy "members can read own notifications"
  on public.notifications for select
  using (recipient_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('employee-documents', 'employee-documents', false)
on conflict (id) do nothing;

create policy "workspace users can upload employee documents"
  on storage.objects for insert
  with check (bucket_id = 'employee-documents' and auth.role() = 'authenticated');

create policy "workspace users can read employee documents"
  on storage.objects for select
  using (bucket_id = 'employee-documents' and auth.role() = 'authenticated');
