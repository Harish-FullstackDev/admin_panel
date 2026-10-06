-- HCM Slice 4: leave (types, balances, requests with manager -> HR approval,
-- holidays) and attendance (portal check-in/out, corrections).
-- Run once in Dashboard > SQL Editor on project unjirnxwvtgifdaieijl, after
-- 20261007000001_hcm_probation.sql. Work week: Sunday-Thursday (Fri/Sat off),
-- enforced in application code (src/lib/hcm/leave.js WEEKEND).

begin;

-- ===========================================================================
-- Leave
-- ===========================================================================
create table if not exists public.leave_types (
  code text primary key,
  name text not null,
  annual_quota numeric(5, 1) check (annual_quota is null or annual_quota >= 0),
  intern_quota numeric(5, 1) check (intern_quota is null or intern_quota >= 0),
  interns_allowed boolean not null default true,
  paid boolean not null default true,
  carry_forward_max numeric(5, 1) not null default 0 check (carry_forward_max >= 0),
  allow_half_day boolean not null default true,
  color text not null default 'teal',
  sort int not null default 100,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leave_balances (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  leave_type text not null references public.leave_types (code),
  year int not null,
  allocated numeric(5, 1) not null default 0,
  carried numeric(5, 1) not null default 0,
  adjusted numeric(5, 1) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, leave_type, year)
);

create table if not exists public.leave_adjustments (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  leave_type text not null references public.leave_types (code),
  year int not null,
  days numeric(5, 1) not null check (days <> 0),
  reason text not null,
  actor_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists leave_adjustments_emp_idx on public.leave_adjustments (employee_id, year);

create table if not exists public.holidays (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  name text not null,
  location_id uuid references public.locations (id) on delete cascade,
  optional boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists holidays_date_location_uniq
  on public.holidays (date, coalesce(location_id, '00000000-0000-0000-0000-000000000000'::uuid));

create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  leave_type text not null references public.leave_types (code),
  start_date date not null,
  end_date date not null,
  start_half boolean not null default false,
  end_half boolean not null default false,
  days numeric(5, 1) not null check (days > 0),
  reason text,
  status text not null default 'Pending manager'
    check (status in ('Pending manager', 'Pending HR', 'Approved', 'Rejected', 'Cancelled')),
  manager_id uuid references public.internal_users (id) on delete set null,
  decided_by uuid references auth.users (id) on delete set null,
  decided_at timestamptz,
  decision_comment text,
  cancel_reason text,
  cancelled_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leave_requests_dates check (end_date >= start_date)
);
create index if not exists leave_requests_emp_idx on public.leave_requests (employee_id, start_date);
create index if not exists leave_requests_status_idx on public.leave_requests (status);

-- ===========================================================================
-- Attendance
-- ===========================================================================
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  work_date date not null,
  check_in timestamptz,
  check_out timestamptz,
  source text not null default 'portal' check (source in ('portal', 'correction')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, work_date),
  constraint attendance_order check (check_out is null or check_in is null or check_out >= check_in)
);

create table if not exists public.attendance_corrections (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  work_date date not null,
  check_in timestamptz not null,
  check_out timestamptz not null,
  reason text not null,
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  decided_by uuid references auth.users (id) on delete set null,
  decided_at timestamptz,
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_corrections_order check (check_out > check_in)
);
create index if not exists attendance_corrections_status_idx on public.attendance_corrections (status, employee_id);

-- ===========================================================================
-- updated_at triggers + RLS
-- ===========================================================================
do $$
declare t text;
begin
  foreach t in array array['leave_types', 'leave_balances', 'holidays', 'leave_requests', 'attendance', 'attendance_corrections']
  loop
    execute format('drop trigger if exists %1$s_updated_at on public.%1$s', t);
    execute format('create trigger %1$s_updated_at before update on public.%1$s
                    for each row execute function public.set_updated_at()', t);
  end loop;
  foreach t in array array['leave_types', 'leave_balances', 'leave_adjustments', 'holidays', 'leave_requests',
                           'attendance', 'attendance_corrections']
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ===========================================================================
-- Seed: leave types, holidays, permissions, workflow, templates
-- ===========================================================================
insert into public.leave_types (code, name, annual_quota, intern_quota, interns_allowed, paid, carry_forward_max, allow_half_day, color, sort) values
  ('CL', 'Casual leave', 12, 6, true, true, 0, true, 'teal', 10),
  ('SL', 'Sick leave', 12, null, false, true, 0, true, 'sky', 20),
  ('EL', 'Earned leave', 15, null, false, true, 30, false, 'violet', 30),
  ('LOP', 'Unpaid leave', null, null, true, false, 0, true, 'slate', 90)
on conflict (code) do nothing;

insert into public.holidays (date, name)
select v.d::date, v.n from (values
  ('2026-01-01', 'New Year''s Day'), ('2026-01-15', 'Pongal'), ('2026-01-26', 'Republic Day'),
  ('2026-05-01', 'May Day'), ('2026-08-15', 'Independence Day'), ('2026-10-02', 'Gandhi Jayanti'),
  ('2026-12-25', 'Christmas'),
  ('2027-01-01', 'New Year''s Day'), ('2027-01-15', 'Pongal'), ('2027-01-26', 'Republic Day'),
  ('2027-05-01', 'May Day'), ('2027-08-15', 'Independence Day'), ('2027-10-02', 'Gandhi Jayanti'),
  ('2027-12-25', 'Christmas')
) as v(d, n)
where not exists (select 1 from public.holidays h where h.date = v.d::date and h.location_id is null);

insert into public.permissions (code, description, module) values
  ('leave.manage', 'Leave policies, holidays, balances and the HR approval step', 'leave'),
  ('leave.approve', 'Approve team leave requests', 'leave'),
  ('attendance.view', 'View team attendance', 'attendance'),
  ('attendance.manage', 'Approve any attendance correction and edit attendance', 'attendance')
on conflict (code) do update set description = excluded.description, module = excluded.module;

insert into public.role_permissions (role_code, permission_code, scope)
select r, p, s from (values
  ('chro', 'leave.manage', 'all'), ('chro', 'leave.approve', 'all'), ('chro', 'attendance.view', 'all'), ('chro', 'attendance.manage', 'all'),
  ('hr_manager', 'leave.manage', 'all'), ('hr_manager', 'leave.approve', 'all'), ('hr_manager', 'attendance.view', 'all'), ('hr_manager', 'attendance.manage', 'all'),
  ('hr_executive', 'leave.manage', 'all'), ('hr_executive', 'leave.approve', 'all'), ('hr_executive', 'attendance.view', 'all'), ('hr_executive', 'attendance.manage', 'all'),
  ('hiring_manager', 'leave.approve', 'team'), ('hiring_manager', 'attendance.view', 'team'),
  ('super_admin', 'attendance.view', 'all')
) as v(r, p, s)
on conflict (role_code, permission_code) do nothing;

insert into public.workflow_definitions (type, name, steps) values
  ('leave', 'Leave approval',
   '[{"key":"manager_approval","label":"Manager approval","permission":"leave.approve","sla_days":2},
     {"key":"hr_approval","label":"HR approval","permission":"leave.manage","sla_days":2}]')
on conflict (type) do nothing;

insert into public.email_templates (code, name, stage, recipient, subject, body) values
  ('leave_requested', 'Leave requested', 'Leave', 'Manager',
   '{{employee_name}} requested {{leave_type}}: {{dates}}',
   'Hi {{name}},\n\n{{employee_name}} has requested {{days}} day(s) of {{leave_type}} ({{dates}}).\nReason: {{reason}}\n\nApprove or reject: {{link}}'),
  ('leave_pending_hr', 'Leave awaiting HR', 'Leave', 'HR',
   'Leave awaiting HR approval: {{employee_name}}',
   '{{employee_name}}''s {{leave_type}} ({{dates}}, {{days}} day(s)) was approved by {{manager_name}} and needs HR approval.\n\nReview: {{link}}'),
  ('leave_decided', 'Leave decision', 'Leave', 'Employee',
   'Your {{leave_type}} request was {{decision}}',
   'Hi {{name}},\n\nYour {{leave_type}} request for {{dates}} ({{days}} day(s)) was {{decision}}.\n{{comment}}\n\nDetails: {{link}}'),
  ('leave_cancelled', 'Leave cancelled', 'Leave', 'Manager',
   '{{employee_name}} cancelled {{leave_type}}: {{dates}}',
   'Hi {{name}},\n\n{{employee_name}}''s {{leave_type}} for {{dates}} was cancelled.\nReason: {{reason}}'),
  ('attendance_correction_requested', 'Attendance correction requested', 'Attendance', 'Manager',
   'Attendance correction: {{employee_name}}, {{work_date}}',
   'Hi {{name}},\n\n{{employee_name}} asked to correct attendance for {{work_date}} to {{times}}.\nReason: {{reason}}\n\nReview: {{link}}'),
  ('attendance_correction_decided', 'Attendance correction decision', 'Attendance', 'Employee',
   'Your attendance correction for {{work_date}} was {{decision}}',
   'Hi {{name}},\n\nYour attendance correction for {{work_date}} was {{decision}}.\n{{comment}}')
on conflict (code) do nothing;

commit;
