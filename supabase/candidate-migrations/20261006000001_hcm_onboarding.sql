-- HCM Slice 2: onboarding (pre-joining documents, BGV, onboarding checklists,
-- convert to employee, employee directory). Run once in Dashboard > SQL Editor
-- on project unjirnxwvtgifdaieijl, after 20261001000002.
-- All writes go through server routes using the service role key; RLS only
-- grants candidates read access to their own joiner and document rows.

begin;

-- ===========================================================================
-- Pre-joining
-- ===========================================================================
create table if not exists public.document_types (
  code text primary key,
  name text not null,
  description text,
  required boolean not null default true,
  applies_to text not null default 'all' check (applies_to in ('all', 'Internship', 'Experienced')),
  sort int not null default 100,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.joiners (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications (id) on delete cascade,
  offer_id uuid references public.offers (id) on delete set null,
  candidate_id uuid references auth.users (id) on delete set null,
  job_id uuid references public.jobs (id) on delete set null,
  full_name text not null,
  personal_email text not null,
  phone text,
  position text not null,
  department_id uuid references public.departments (id) on delete set null,
  location_id uuid references public.locations (id) on delete set null,
  grade_id uuid references public.grades (id) on delete set null,
  manager_id uuid references public.internal_users (id) on delete set null,
  buddy_id uuid references public.internal_users (id) on delete set null,
  employment_type text not null default 'Full-time',
  join_stage text not null default 'Probation' check (join_stage in ('Intern', 'Probation', 'Full-time')),
  joining_date date not null,
  reporting_time text,
  reporting_location text,
  day1_notes text,
  bgv_status text not null default 'Not started'
    check (bgv_status in ('Not started', 'In progress', 'Cleared', 'Failed')),
  bgv_note text,
  status text not null default 'Pre-joining' check (status in ('Pre-joining', 'Ready', 'Joined', 'Cancelled')),
  cancel_reason text,
  employee_id uuid,
  joining_details_sent_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists joiners_status_idx on public.joiners (status, joining_date);
create index if not exists joiners_candidate_idx on public.joiners (candidate_id);

create table if not exists public.joiner_documents (
  id uuid primary key default gen_random_uuid(),
  joiner_id uuid not null references public.joiners (id) on delete cascade,
  type_code text not null references public.document_types (code),
  name text not null,
  required boolean not null default true,
  status text not null default 'Requested' check (status in ('Requested', 'Uploaded', 'Verified', 'Rejected')),
  file_path text,
  file_name text,
  rejection_reason text,
  uploaded_at timestamptz,
  verified_by uuid references auth.users (id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (joiner_id, type_code)
);
create index if not exists joiner_documents_status_idx on public.joiner_documents (status);

-- ===========================================================================
-- Checklists and tasks (tasks is generic; slice 3 reuses it for intern and
-- probation work)
-- ===========================================================================
create table if not exists public.checklist_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  employment_type text,
  is_default boolean not null default false,
  items jsonb not null default '[]',
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  context_type text not null default 'onboarding' check (context_type in ('onboarding')),
  context_id uuid not null,
  title text not null,
  description text,
  team text not null default 'HR' check (team in ('HR', 'IT', 'Admin', 'Manager', 'Buddy', 'Joiner')),
  assignee_id uuid references public.internal_users (id) on delete set null,
  due_date date,
  status text not null default 'Open' check (status in ('Open', 'Done', 'Skipped')),
  completed_by uuid references auth.users (id) on delete set null,
  completed_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tasks_assignee_idx on public.tasks (assignee_id, status);
create index if not exists tasks_context_idx on public.tasks (context_type, context_id);

-- ===========================================================================
-- Employees
-- ===========================================================================
create table if not exists public.employees (
  id uuid primary key references public.internal_users (id) on delete cascade,
  employee_code text unique,
  candidate_id uuid references auth.users (id) on delete set null,
  application_id uuid references public.applications (id) on delete set null,
  joiner_id uuid references public.joiners (id) on delete set null,
  full_name text not null,
  official_email text not null unique,
  personal_email text,
  phone text,
  designation text,
  department_id uuid references public.departments (id) on delete set null,
  location_id uuid references public.locations (id) on delete set null,
  grade_id uuid references public.grades (id) on delete set null,
  manager_id uuid references public.internal_users (id) on delete set null,
  employment_type text not null default 'Full-time',
  stage text not null default 'Probation' check (stage in ('Intern', 'Probation', 'Full-time')),
  stage_end_date date,
  status text not null default 'Active' check (status in ('Active', 'Notice', 'Exited')),
  joining_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists employees_manager_idx on public.employees (manager_id);
create index if not exists employees_department_idx on public.employees (department_id);

alter table public.joiners
  drop constraint if exists joiners_employee_id_fkey,
  add constraint joiners_employee_id_fkey foreign key (employee_id) references public.employees (id) on delete set null;

create sequence if not exists public.employee_code_seq;
create or replace function public.set_employee_code()
returns trigger
language plpgsql
as $$
begin
  if new.employee_code is null then
    new.employee_code := 'ASC-' || lpad(nextval('public.employee_code_seq')::text, 5, '0');
  end if;
  return new;
end;
$$;
drop trigger if exists employees_code on public.employees;
create trigger employees_code before insert on public.employees
  for each row execute function public.set_employee_code();

create table if not exists public.employee_events (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  type text not null check (type in ('join', 'update', 'confirm', 'extend', 'promote', 'transfer', 'salary', 'exit')),
  effective_date date not null default current_date,
  before jsonb,
  after jsonb,
  note text,
  actor_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists employee_events_emp_idx on public.employee_events (employee_id, created_at);

-- ===========================================================================
-- updated_at triggers + RLS
-- ===========================================================================
do $$
declare t text;
begin
  foreach t in array array['document_types', 'joiners', 'joiner_documents', 'checklist_templates', 'tasks', 'employees']
  loop
    execute format('drop trigger if exists %1$s_updated_at on public.%1$s', t);
    execute format('create trigger %1$s_updated_at before update on public.%1$s
                    for each row execute function public.set_updated_at()', t);
  end loop;
  foreach t in array array['document_types', 'joiners', 'joiner_documents', 'checklist_templates', 'tasks',
                           'employees', 'employee_events']
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

drop policy if exists "Candidates read own joiner" on public.joiners;
create policy "Candidates read own joiner"
  on public.joiners for select
  to authenticated
  using (candidate_id = auth.uid());

drop policy if exists "Candidates read own joiner documents" on public.joiner_documents;
create policy "Candidates read own joiner documents"
  on public.joiner_documents for select
  to authenticated
  using (exists (select 1 from public.joiners j where j.id = joiner_id and j.candidate_id = auth.uid()));

-- ===========================================================================
-- Seed: role, permissions, templates, document types, checklist
-- ===========================================================================
insert into public.roles (code, name, description, rank, is_system) values
  ('employee', 'Employee', 'Self-service: home, profile and assigned tasks', 70, true)
on conflict (code) do update set name = excluded.name, description = excluded.description, rank = excluded.rank;

insert into public.permissions (code, description, module) values
  ('onboarding.manage', 'Run pre-joining, documents, BGV, onboarding checklists and convert joiners', 'onboarding'),
  ('employee.view', 'View employee records', 'people'),
  ('employee.manage', 'Edit employee job details and add existing staff', 'people')
on conflict (code) do update set description = excluded.description, module = excluded.module;

insert into public.role_permissions (role_code, permission_code, scope)
select r, p, s from (values
  ('chro', 'onboarding.manage', 'all'), ('chro', 'employee.view', 'all'), ('chro', 'employee.manage', 'all'),
  ('hr_manager', 'onboarding.manage', 'all'), ('hr_manager', 'employee.view', 'all'), ('hr_manager', 'employee.manage', 'all'),
  ('hr_executive', 'onboarding.manage', 'all'), ('hr_executive', 'employee.view', 'all'), ('hr_executive', 'employee.manage', 'all'),
  ('super_admin', 'employee.view', 'all'),
  ('hiring_manager', 'employee.view', 'team')
) as v(r, p, s)
on conflict (role_code, permission_code) do nothing;

insert into public.email_templates (code, name, stage, recipient, subject, body) values
  ('documents_requested', 'Documents requested', 'Pre-joining', 'Joiner',
   'Welcome aboard! Please upload your joining documents',
   'Hi {{candidate_name}},\n\nCongratulations on accepting our offer for {{job_title}}. Please upload the following documents before {{joining_date}}:\n{{documents}}\n\nUpload here: {{link}}'),
  ('document_rejected', 'Document rejected', 'Pre-joining', 'Joiner',
   'Please re-upload your {{document_name}}',
   'Hi {{candidate_name}},\n\nWe could not accept your {{document_name}}.\nReason: {{reason}}\n\nPlease upload it again: {{link}}'),
  ('joining_details', 'Welcome and Day-1 details', 'Pre-joining', 'Joiner, manager, buddy',
   'Your first day at Ascendus: {{joining_date}}',
   'Hi {{name}},\n\n{{joiner_name}} joins as {{job_title}} on {{joining_date}}.\nReporting time: {{reporting_time}}\nLocation: {{reporting_location}}\nManager: {{manager_name}}\nBuddy: {{buddy_name}}\n\n{{day1_notes}}'),
  ('onboarding_task_assigned', 'Onboarding task assigned', 'Onboarding', 'IT, Admin, manager',
   'Onboarding task: {{task_title}}',
   'Hi {{name}},\n\nYou have an onboarding task for {{joiner_name}} (joining {{joining_date}}):\n{{task_title}}\nDue: {{due_date}}\n\nOpen: {{link}}'),
  ('employee_account_created', 'Employee account created', 'Onboarding', 'New employee',
   'Your Ascendus employee account is ready',
   'Hi {{name}},\n\nWelcome to Ascendus! Your employee ID is {{employee_code}} and your official email is {{official_email}}.\nSet your password here (valid 48 hours): {{invite_link}}')
on conflict (code) do nothing;

insert into public.document_types (code, name, description, required, applies_to, sort) values
  ('id_proof', 'ID proof', 'Aadhaar card or passport', true, 'all', 10),
  ('pan', 'PAN card', null, true, 'all', 20),
  ('address_proof', 'Address proof', 'Utility bill, rental agreement or Aadhaar', true, 'all', 30),
  ('education', 'Education certificates', 'Highest degree certificate and mark sheets (single PDF)', true, 'all', 40),
  ('relieving_letter', 'Relieving / experience letter', 'From your most recent employer, if any', false, 'all', 50),
  ('photo', 'Passport-size photo', null, true, 'all', 60),
  ('bank_details', 'Bank details', 'Cancelled cheque or bank passbook front page', true, 'all', 70)
on conflict (code) do nothing;

insert into public.checklist_templates (name, employment_type, is_default, items) values
  ('Standard onboarding', null, true,
   '[{"title":"Send welcome kit and joining details","team":"HR","due_offset_days":-3},
     {"title":"Create laptop, email and tool accounts","team":"IT","due_offset_days":-2},
     {"title":"Arrange seat, access card and ID card","team":"Admin","due_offset_days":-1},
     {"title":"Prepare first-week plan","team":"Manager","due_offset_days":-1},
     {"title":"Intro call with the new joiner","team":"Buddy","due_offset_days":0},
     {"title":"Day-1 induction and policy walkthrough","team":"HR","due_offset_days":0},
     {"title":"Collect signed appointment letter","team":"HR","due_offset_days":1},
     {"title":"30-day check-in","team":"Manager","due_offset_days":30}]')
on conflict (name) do nothing;

commit;
