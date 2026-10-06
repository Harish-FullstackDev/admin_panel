-- HCM Slice 3: intern and probation tracking (stage records, weekly updates,
-- reviews, outcomes with CHRO approval for extend/release, letters).
-- Run once in Dashboard > SQL Editor on project unjirnxwvtgifdaieijl, after
-- 20261006000001_hcm_onboarding.sql.

begin;

-- ===========================================================================
-- Stage records
-- ===========================================================================
create table if not exists public.stage_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  type text not null check (type in ('Intern', 'Probation')),
  start_date date not null,
  end_date date not null,
  original_end_date date not null,
  extension_count int not null default 0,
  mentor_id uuid references public.internal_users (id) on delete set null,
  mid_review_date date,
  final_review_date date,
  mid_reminded_at timestamptz,
  final_reminded_at timestamptz,
  status text not null default 'Active' check (status in ('Active', 'Pending approval', 'Completed')),
  recommendation text check (recommendation in ('Confirm', 'Extend', 'Convert to probation', 'Convert to full-time', 'Release')),
  recommended_by uuid references auth.users (id) on delete set null,
  proposed_outcome text check (proposed_outcome in ('Confirmed', 'Extended', 'Converted', 'Released')),
  proposed_end_date date,
  proposed_stage text check (proposed_stage in ('Probation', 'Full-time')),
  proposed_last_day date,
  proposed_note text,
  proposed_by uuid references auth.users (id) on delete set null,
  outcome text check (outcome in ('Confirmed', 'Extended', 'Converted', 'Released')),
  outcome_note text,
  decided_by uuid references auth.users (id) on delete set null,
  closed_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stage_records_dates check (end_date > start_date)
);
create unique index if not exists stage_records_one_open
  on public.stage_records (employee_id) where status in ('Active', 'Pending approval');
create index if not exists stage_records_status_idx on public.stage_records (status, end_date);

create table if not exists public.stage_updates (
  id uuid primary key default gen_random_uuid(),
  stage_record_id uuid not null references public.stage_records (id) on delete cascade,
  week_start date not null,
  summary text not null,
  blockers text,
  next_week text,
  mentor_rating int check (mentor_rating between 1 and 5),
  mentor_comment text,
  rated_by uuid references auth.users (id) on delete set null,
  rated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (stage_record_id, week_start)
);

create table if not exists public.stage_reviews (
  id uuid primary key default gen_random_uuid(),
  stage_record_id uuid not null references public.stage_records (id) on delete cascade,
  type text not null check (type in ('self', 'mid', 'final')),
  reviewer_id uuid references public.internal_users (id) on delete set null,
  ratings jsonb not null default '{}',
  overall int check (overall between 1 and 5),
  strengths text,
  improvements text,
  comments text,
  recommendation text check (recommendation in ('Confirm', 'Extend', 'Convert to probation', 'Convert to full-time', 'Release')),
  submitted_at timestamptz,
  reopened_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (stage_record_id, type)
);

create table if not exists public.letters (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  type text not null check (type in ('confirmation', 'extension', 'conversion', 'internship_certificate', 'release')),
  title text not null,
  body text not null,
  stage_record_id uuid references public.stage_records (id) on delete set null,
  issued_by uuid references auth.users (id) on delete set null,
  issued_at timestamptz not null default now()
);
create index if not exists letters_employee_idx on public.letters (employee_id, issued_at desc);

-- ===========================================================================
-- Changes to existing tables
-- ===========================================================================
alter table public.tasks drop constraint if exists tasks_context_type_check;
alter table public.tasks add constraint tasks_context_type_check check (context_type in ('onboarding', 'stage'));
alter table public.tasks drop constraint if exists tasks_team_check;
alter table public.tasks add constraint tasks_team_check check (team in ('HR', 'IT', 'Admin', 'Manager', 'Buddy', 'Joiner', 'Self'));
alter table public.tasks add column if not exists progress int check (progress between 0 and 100);

alter table public.employee_events drop constraint if exists employee_events_type_check;
alter table public.employee_events add constraint employee_events_type_check check (type in
  ('join', 'update', 'confirm', 'extend', 'convert', 'release', 'promote', 'transfer', 'salary', 'exit'));

alter table public.employees add column if not exists last_working_date date;

-- ===========================================================================
-- updated_at triggers + RLS
-- ===========================================================================
do $$
declare t text;
begin
  foreach t in array array['stage_records', 'stage_updates', 'stage_reviews']
  loop
    execute format('drop trigger if exists %1$s_updated_at on public.%1$s', t);
    execute format('create trigger %1$s_updated_at before update on public.%1$s
                    for each row execute function public.set_updated_at()', t);
  end loop;
  foreach t in array array['stage_records', 'stage_updates', 'stage_reviews', 'letters']
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ===========================================================================
-- Backfill: open records for current interns / probationers
-- ===========================================================================
insert into public.stage_records (employee_id, type, start_date, end_date, original_end_date, mid_review_date, final_review_date)
select e.id,
       e.stage,
       e.joining_date,
       e.stage_end_date,
       e.stage_end_date,
       e.joining_date + ((e.stage_end_date - e.joining_date) / 2),
       greatest(e.stage_end_date - 14, e.joining_date + ((e.stage_end_date - e.joining_date) / 2))
from public.employees e
where e.status = 'Active'
  and e.stage in ('Intern', 'Probation')
  and e.stage_end_date is not null
  and e.stage_end_date > e.joining_date
  and not exists (
    select 1 from public.stage_records s
    where s.employee_id = e.id and s.status in ('Active', 'Pending approval')
  );

-- ===========================================================================
-- Seed: permissions, workflow, templates
-- ===========================================================================
insert into public.permissions (code, description, module) values
  ('probation.manage', 'Run intern and probation tracking and decide outcomes', 'people'),
  ('probation.review', 'Review interns and probationers, rate updates, assign tasks', 'people'),
  ('probation.approve', 'Approve probation extensions and releases', 'people')
on conflict (code) do update set description = excluded.description, module = excluded.module;

insert into public.role_permissions (role_code, permission_code, scope)
select r, p, s from (values
  ('chro', 'probation.manage', 'all'), ('chro', 'probation.review', 'all'), ('chro', 'probation.approve', 'all'),
  ('hr_manager', 'probation.manage', 'all'), ('hr_manager', 'probation.review', 'all'),
  ('hr_executive', 'probation.manage', 'all'), ('hr_executive', 'probation.review', 'all'),
  ('hiring_manager', 'probation.review', 'team')
) as v(r, p, s)
on conflict (role_code, permission_code) do nothing;

insert into public.workflow_definitions (type, name, steps) values
  ('stage_outcome', 'Probation / internship outcome approval',
   '[{"key":"chro_approval","label":"CHRO approval","permission":"probation.approve","condition":"extend_or_release","sla_days":2}]')
on conflict (type) do nothing;

insert into public.email_templates (code, name, stage, recipient, subject, body) values
  ('stage_review_due', 'Probation / internship review due', 'Probation', 'Manager, HR',
   '{{review_type}} review due for {{employee_name}} on {{review_date}}',
   'Hi {{name}},\n\nThe {{review_type}} review for {{employee_name}} ({{stage_type}}) is due on {{review_date}}.\nOpen the tracker: {{link}}'),
  ('stage_outcome_pending', 'Outcome awaiting approval', 'Probation', 'CHRO',
   'Approval needed: {{outcome}} for {{employee_name}}',
   '{{proposer_name}} proposed "{{outcome}}" for {{employee_name}} ({{stage_type}}).\n{{details}}\nNote: {{note}}\n\nReview: {{link}}'),
  ('stage_outcome', 'Probation / internship outcome', 'Probation', 'Employee',
   'Update on your {{stage_type_lower}}: {{outcome}}',
   'Hi {{name}},\n\nYour {{stage_type_lower}} outcome: {{outcome}}.\n{{details}}\n\nYour letter is available in the HCM portal: {{link}}'),
  ('letter_confirmation', 'Letter: confirmation', 'Letter', 'Employee',
   'Confirmation of employment',
   'Date: {{date}}\n\nDear {{name}},\n\nWe are pleased to confirm that you have successfully completed your probation period. Your employment as {{designation}} ({{employee_code}}) is confirmed with effect from {{effective_date}}.\n\nAll other terms of your appointment remain unchanged.\n\nCongratulations, and thank you for your contribution.\n\nFor Ascendus,\n{{signatory}}'),
  ('letter_extension', 'Letter: probation extension', 'Letter', 'Employee',
   'Extension of {{stage_type_lower}} period',
   'Date: {{date}}\n\nDear {{name}},\n\nFurther to your review, your {{stage_type_lower}} period as {{designation}} ({{employee_code}}) has been extended until {{end_date}}.\n\n{{note}}\n\nYour manager will continue to support you during this period.\n\nFor Ascendus,\n{{signatory}}'),
  ('letter_conversion', 'Letter: conversion', 'Letter', 'Employee',
   'Change of employment status',
   'Date: {{date}}\n\nDear {{name}},\n\nWe are pleased to inform you that, on completion of your internship, you will join us as {{new_stage}} with effect from {{effective_date}}.{{end_clause}}\n\nCongratulations!\n\nFor Ascendus,\n{{signatory}}'),
  ('letter_internship_certificate', 'Letter: internship certificate', 'Letter', 'Employee',
   'Internship certificate',
   'Date: {{date}}\n\nThis is to certify that {{name}} ({{employee_code}}) completed an internship with Ascendus as {{designation}} from {{start_date}} to {{end_date}}.\n\nWe wish {{name}} every success.\n\nFor Ascendus,\n{{signatory}}'),
  ('letter_release', 'Letter: release', 'Letter', 'Employee',
   'Completion of {{stage_type_lower}} period',
   'Date: {{date}}\n\nDear {{name}},\n\nFollowing your {{stage_type_lower}} review, we regret to inform you that your engagement as {{designation}} ({{employee_code}}) will end. Your last working day will be {{last_day}}.\n\n{{note}}\n\nHR will contact you about the exit formalities.\n\nFor Ascendus,\n{{signatory}}')
on conflict (code) do nothing;

commit;
