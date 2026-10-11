-- HCM Slice 5: exit / offboarding (resignation with manager + HR acceptance,
-- HR-initiated separation with CHRO approval, clearance checklist, exit
-- interview, settlement tracking, relieving and experience letters).
-- Run once in Dashboard > SQL Editor on project unjirnxwvtgifdaieijl, after
-- 20261008000001_hcm_leave_attendance.sql.

begin;

-- ===========================================================================
-- Exit cases
-- ===========================================================================
create table if not exists public.exit_cases (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  type text not null default 'Resignation'
    check (type in ('Resignation', 'Termination', 'Release', 'Contract end', 'Retirement', 'Other')),
  status text not null default 'Pending manager'
    check (status in ('Pending manager', 'Pending HR', 'Pending approval', 'In notice', 'Completed', 'Withdrawn', 'Cancelled')),
  reason_category text,
  reason text,
  submitted_at timestamptz not null default now(),
  requested_last_day date,
  notice_days int not null default 0 check (notice_days >= 0),
  last_working_date date,
  shortfall_reason text,
  manager_id uuid references public.internal_users (id) on delete set null,
  manager_comment text,
  hr_comment text,
  accepted_by uuid references auth.users (id) on delete set null,
  accepted_at timestamptz,
  initiated_by uuid references auth.users (id) on delete set null,
  stage_record_id uuid references public.stage_records (id) on delete set null,
  interview jsonb,
  interview_submitted_at timestamptz,
  interview_by uuid references auth.users (id) on delete set null,
  settlement_status text not null default 'Pending'
    check (settlement_status in ('Pending', 'Processing', 'Paid', 'Not applicable')),
  settlement_amount numeric(12, 2),
  settlement_paid_on date,
  settlement_note text,
  reminded_at timestamptz,
  completed_at timestamptz,
  completed_by uuid references auth.users (id) on delete set null,
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists exit_cases_one_open
  on public.exit_cases (employee_id) where status in ('Pending manager', 'Pending HR', 'Pending approval', 'In notice');
create index if not exists exit_cases_status_idx on public.exit_cases (status, last_working_date);

-- ===========================================================================
-- Changes to existing tables
-- ===========================================================================
alter table public.tasks drop constraint if exists tasks_context_type_check;
alter table public.tasks add constraint tasks_context_type_check check (context_type in ('onboarding', 'stage', 'exit'));
alter table public.tasks drop constraint if exists tasks_team_check;
alter table public.tasks add constraint tasks_team_check check (team in ('HR', 'IT', 'Admin', 'Finance', 'Manager', 'Buddy', 'Joiner', 'Self'));

alter table public.checklist_templates add column if not exists purpose text not null default 'onboarding';
alter table public.checklist_templates drop constraint if exists checklist_templates_purpose_check;
alter table public.checklist_templates add constraint checklist_templates_purpose_check check (purpose in ('onboarding', 'exit'));

alter table public.letters drop constraint if exists letters_type_check;
alter table public.letters add constraint letters_type_check check (type in
  ('confirmation', 'extension', 'conversion', 'internship_certificate', 'release', 'relieving', 'experience'));
alter table public.letters add column if not exists exit_case_id uuid references public.exit_cases (id) on delete set null;

alter table public.employee_events drop constraint if exists employee_events_type_check;
alter table public.employee_events add constraint employee_events_type_check check (type in
  ('join', 'update', 'confirm', 'extend', 'convert', 'release', 'promote', 'transfer', 'salary', 'resign', 'exit_cancel', 'exit'));

-- ===========================================================================
-- updated_at trigger + RLS
-- ===========================================================================
drop trigger if exists exit_cases_updated_at on public.exit_cases;
create trigger exit_cases_updated_at before update on public.exit_cases
  for each row execute function public.set_updated_at();
alter table public.exit_cases enable row level security;

-- ===========================================================================
-- Backfill: people already serving notice after a probation release
-- ===========================================================================
insert into public.exit_cases (employee_id, type, status, reason, last_working_date, manager_id, accepted_at, stage_record_id)
select e.id,
       'Release',
       'In notice',
       s.outcome_note,
       e.last_working_date,
       e.manager_id,
       coalesce(s.closed_at, now()),
       s.id
from public.employees e
left join lateral (
  select id, outcome_note, closed_at from public.stage_records
  where employee_id = e.id and outcome = 'Released'
  order by closed_at desc nulls last limit 1
) s on true
where e.status = 'Notice'
  and e.last_working_date is not null
  and not exists (
    select 1 from public.exit_cases x
    where x.employee_id = e.id and x.status in ('Pending manager', 'Pending HR', 'Pending approval', 'In notice')
  );

-- ===========================================================================
-- Seed: permissions, workflows, templates, clearance checklist
-- ===========================================================================
insert into public.permissions (code, description, module) values
  ('exit.manage', 'Run exits: HR acceptance, separations, clearance, settlement, exit interviews, letters', 'people'),
  ('exit.review', 'Accept team resignations and view team exits', 'people'),
  ('exit.approve', 'Approve separations initiated by HR', 'people')
on conflict (code) do update set description = excluded.description, module = excluded.module;

insert into public.role_permissions (role_code, permission_code, scope)
select r, p, s from (values
  ('chro', 'exit.manage', 'all'), ('chro', 'exit.review', 'all'), ('chro', 'exit.approve', 'all'),
  ('hr_manager', 'exit.manage', 'all'), ('hr_manager', 'exit.review', 'all'),
  ('hr_executive', 'exit.manage', 'all'), ('hr_executive', 'exit.review', 'all'),
  ('hiring_manager', 'exit.review', 'team')
) as v(r, p, s)
on conflict (role_code, permission_code) do nothing;

insert into public.workflow_definitions (type, name, steps) values
  ('resignation', 'Resignation acceptance',
   '[{"key":"manager_acceptance","label":"Manager acceptance","permission":"exit.review","sla_days":3},
     {"key":"hr_acceptance","label":"HR acceptance","permission":"exit.manage","sla_days":3}]'),
  ('separation', 'Separation approval',
   '[{"key":"chro_approval","label":"CHRO approval","permission":"exit.approve","sla_days":2}]')
on conflict (type) do nothing;

insert into public.checklist_templates (name, employment_type, is_default, purpose, items) values
  ('Standard exit clearance', null, true, 'exit',
   '[{"title":"Knowledge transfer and handover","team":"Manager","due_offset_days":-5},
     {"title":"Exit interview","team":"HR","due_offset_days":-3},
     {"title":"Clear advances, reimbursements and recoveries","team":"Finance","due_offset_days":-3},
     {"title":"Final leave and attendance reconciliation","team":"HR","due_offset_days":-1},
     {"title":"Collect laptop and accessories","team":"IT","due_offset_days":0},
     {"title":"Revoke email and tool access","team":"IT","due_offset_days":0},
     {"title":"Collect ID card and access card","team":"Admin","due_offset_days":0}]')
on conflict (name) do nothing;

insert into public.email_templates (code, name, stage, recipient, subject, body) values
  ('resignation_submitted', 'Resignation submitted', 'Exit', 'Manager',
   '{{employee_name}} has resigned',
   'Hi {{name}},\n\n{{employee_name}} submitted their resignation.\nReason: {{reason}}\nRequested last working day: {{last_day}}\n\nReview and accept: {{link}}'),
  ('resignation_pending_hr', 'Resignation awaiting HR', 'Exit', 'HR',
   'Resignation awaiting HR: {{employee_name}}',
   '{{employee_name}}''s resignation was accepted by {{manager_name}} and needs HR acceptance.\nRequested last working day: {{last_day}}\n\nReview: {{link}}'),
  ('resignation_accepted', 'Resignation accepted', 'Exit', 'Employee',
   'Your resignation has been accepted',
   'Hi {{name}},\n\nYour resignation has been accepted. Your last working day is {{last_day}}.\n\nDuring your notice period please complete the handover and the exit interview in the HCM portal: {{link}}'),
  ('resignation_withdrawn', 'Resignation withdrawn', 'Exit', 'Manager, HR',
   '{{employee_name}} withdrew their resignation',
   'Hi {{name}},\n\n{{employee_name}} has withdrawn their resignation. No further action is needed.'),
  ('separation_pending', 'Separation awaiting approval', 'Exit', 'CHRO',
   'Approval needed: {{type}} for {{employee_name}}',
   '{{initiator_name}} started a separation ({{type}}) for {{employee_name}}.\nLast working day: {{last_day}}\nReason: {{reason}}\n\nReview: {{link}}'),
  ('separation_notice', 'Separation notice', 'Exit', 'Employee',
   'Notice of separation',
   'Hi {{name}},\n\nThis is to inform you that your employment with Ascendus will end. Your last working day is {{last_day}}.\n\nHR will contact you about the exit formalities. Details: {{link}}'),
  ('exit_task_assigned', 'Exit clearance task assigned', 'Exit', 'IT, Admin, Finance, manager',
   'Exit clearance: {{task_title}}',
   'Hi {{name}},\n\nYou have an exit clearance task for {{employee_name}} (last working day {{last_day}}):\n{{task_title}}\nDue: {{due_date}}\n\nOpen: {{link}}'),
  ('exit_interview_request', 'Exit interview request', 'Exit', 'Employee',
   'Please complete your exit interview',
   'Hi {{name}},\n\nWe value your feedback. Please take a few minutes to complete your exit interview before {{last_day}}: {{link}}'),
  ('exit_cancelled', 'Exit cancelled', 'Exit', 'Employee',
   'Your exit has been cancelled',
   'Hi {{name}},\n\nYour exit process has been cancelled and you remain an active employee.\nNote: {{reason}}'),
  ('exit_completed', 'Exit completed', 'Exit', 'Employee',
   'Your relieving documents from Ascendus',
   'Hi {{name}},\n\nThank you for your time with Ascendus. Your exit is complete as of {{last_day}}.\n\n{{letters}}\n\nWe wish you every success.'),
  ('letter_relieving', 'Letter: relieving', 'Letter', 'Employee',
   'Relieving letter',
   'Date: {{date}}\n\nDear {{name}},\n\nThis is to confirm that you have been relieved from your duties as {{designation}} ({{employee_code}}) at Ascendus with effect from the close of business on {{last_day}}.\n\nYou have completed the exit formalities and have no dues outstanding other than the final settlement, which will be processed separately.\n\nFor Ascendus,\n{{signatory}}'),
  ('letter_experience', 'Letter: experience', 'Letter', 'Employee',
   'Experience certificate',
   'Date: {{date}}\n\nTo whom it may concern,\n\nThis is to certify that {{name}} ({{employee_code}}) worked with Ascendus as {{designation}}{{department_clause}} from {{joining_date}} to {{last_day}} ({{tenure_type}}).\n\nDuring this period we found {{name}} sincere and committed. We wish {{name}} every success in the future.\n\nFor Ascendus,\n{{signatory}}')
on conflict (code) do nothing;

commit;
