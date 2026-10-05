-- HCM Slice 1: foundation (roles, permissions, org, audit, notifications,
-- workflow) + recruitment (requisitions, jobs, pipeline, interviews,
-- scorecards, offers). Run once in Dashboard > SQL Editor on project
-- unjirnxwvtgifdaieijl, after 20260930000001_candidate_portal.sql.
-- All writes go through server routes using the service role key; RLS only
-- grants candidates read access to their own rows and the public read access
-- to open external jobs.

begin;

-- ===========================================================================
-- Internal users should not get a candidate profile row.
-- ===========================================================================
create or replace function public.handle_new_candidate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.raw_app_meta_data ->> 'account_type', '') = 'internal' then
    return new;
  end if;
  insert into public.candidate_profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ===========================================================================
-- Organization
-- ===========================================================================
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text unique,
  parent_id uuid references public.departments (id) on delete set null,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  city text,
  country text,
  timezone text not null default 'Asia/Kolkata',
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  band_min numeric(14, 2),
  band_max numeric(14, 2),
  currency text not null default 'INR',
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grades_band_order check (band_min is null or band_max is null or band_min <= band_max)
);

-- ===========================================================================
-- Access control
-- ===========================================================================
create table if not exists public.internal_users (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null unique,
  department_id uuid references public.departments (id) on delete set null,
  designation text,
  status text not null default 'Invited'
    check (status in ('Invited', 'Active', 'Suspended', 'Deactivated')),
  invited_by uuid references auth.users (id) on delete set null,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.roles (
  code text primary key,
  name text not null,
  description text,
  rank int not null default 100,
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.permissions (
  code text primary key,
  description text not null,
  module text not null
);

create table if not exists public.role_permissions (
  role_code text not null references public.roles (code) on delete cascade,
  permission_code text not null references public.permissions (code) on delete cascade,
  scope text not null default 'all' check (scope in ('own', 'team', 'department', 'all')),
  primary key (role_code, permission_code)
);

create table if not exists public.user_roles (
  user_id uuid not null references public.internal_users (id) on delete cascade,
  role_code text not null references public.roles (code) on delete cascade,
  expires_at timestamptz,
  granted_by uuid references auth.users (id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, role_code)
);

-- ===========================================================================
-- Workflow engine
-- ===========================================================================
create table if not exists public.workflow_definitions (
  type text primary key,
  name text not null,
  steps jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  step int not null,
  step_key text not null,
  approver_permission text not null,
  status text not null default 'Pending'
    check (status in ('Pending', 'Approved', 'Rejected', 'Sent back', 'Cancelled')),
  decided_by uuid references auth.users (id) on delete set null,
  comment text,
  due_at timestamptz,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists approvals_entity_idx on public.approvals (entity_type, entity_id);
create index if not exists approvals_pending_idx on public.approvals (approver_permission) where status = 'Pending';

-- ===========================================================================
-- Recruitment
-- ===========================================================================
create table if not exists public.requisitions (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  role_title text not null,
  department_id uuid references public.departments (id) on delete set null,
  location_id uuid references public.locations (id) on delete set null,
  grade_id uuid references public.grades (id) on delete set null,
  openings int not null default 1 check (openings > 0),
  request_type text not null default 'New' check (request_type in ('New', 'Replacement')),
  replacing_name text,
  employment_type text not null default 'Full-time',
  budget_min numeric(14, 2),
  budget_max numeric(14, 2),
  currency text not null default 'INR',
  target_date date,
  skills text[] not null default '{}',
  justification text,
  status text not null default 'Draft'
    check (status in ('Draft', 'Pending HR', 'Pending CHRO', 'Sent back', 'Approved', 'Rejected', 'Posted', 'Filled', 'Closed', 'Withdrawn')),
  raised_by uuid not null references public.internal_users (id),
  submitted_at timestamptz,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists requisitions_status_idx on public.requisitions (status);
create index if not exists requisitions_raised_by_idx on public.requisitions (raised_by);

create sequence if not exists public.requisition_code_seq;
create or replace function public.set_requisition_code()
returns trigger
language plpgsql
as $$
begin
  if new.code is null then
    new.code := 'REQ-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.requisition_code_seq')::text, 5, '0');
  end if;
  return new;
end;
$$;
drop trigger if exists requisitions_code on public.requisitions;
create trigger requisitions_code before insert on public.requisitions
  for each row execute function public.set_requisition_code();

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  company text not null default '',
  location text not null,
  mode_of_work text not null default 'On-site' check (mode_of_work in ('Remote', 'Hybrid', 'On-site')),
  type_of_work text not null default 'Full-time'
    check (type_of_work in ('Full-time', 'Part-time', 'Contract', 'Freelancer', 'Internship')),
  experience_level text not null,
  categories text[] not null default '{}',
  about_job text not null default '',
  responsibilities text[] not null default '{}',
  qualifications text[] not null default '{}',
  skills text[] not null default '{}',
  status text not null default 'Draft' check (status in ('Draft', 'Open', 'Paused', 'Closed')),
  visibility text not null default 'external' check (visibility in ('external', 'internal', 'both')),
  requisition_id uuid references public.requisitions (id) on delete set null,
  department_id uuid references public.departments (id) on delete set null,
  location_id uuid references public.locations (id) on delete set null,
  hiring_manager_id uuid references public.internal_users (id) on delete set null,
  openings int not null default 1 check (openings > 0),
  salary_min numeric(14, 2),
  salary_max numeric(14, 2),
  currency text not null default 'INR',
  show_salary boolean not null default false,
  closing_date date,
  interview_rounds jsonb not null default '[{"name":"HR Screening","type":"hr"},{"name":"Technical","type":"technical"}]',
  archived boolean not null default false,
  posted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists jobs_status_idx on public.jobs (status);

-- Existing jobs copied from the admin project (same ids as applications.job_id).
-- (inserted after org seed below)

-- applications: status -> pipeline stage
alter table public.applications drop constraint if exists applications_status_check;
update public.applications set status = case status
  when 'New' then 'Applied'
  when 'Reviewed' then 'Screening'
  when 'Interviewing' then 'Interview'
  else status end;
alter table public.applications rename column status to stage;
alter table public.applications alter column stage set default 'Applied';
alter table public.applications add constraint applications_stage_check check (stage in
  ('Applied', 'Screening', 'Hold', 'Shortlisted', 'Interview', 'Selected', 'Offer', 'Hired', 'Rejected', 'Withdrawn'));
alter index if exists applications_status_idx rename to applications_stage_idx;

alter table public.applications
  add column if not exists current_round int not null default 0,
  add column if not exists rejection_reason text,
  add column if not exists source text not null default 'Careers site',
  add column if not exists stage_changed_at timestamptz not null default now(),
  add column if not exists withdrawn_at timestamptz,
  add column if not exists manager_interest text check (manager_interest in ('Interested', 'Not interested')),
  add column if not exists tags text[] not null default '{}';

update public.applications set source = 'Legacy import' where candidate_id is null;


create table if not exists public.application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  from_stage text,
  to_stage text not null,
  actor_id uuid references auth.users (id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists application_events_app_idx on public.application_events (application_id, created_at);

insert into public.application_events (application_id, from_stage, to_stage, created_at)
select id, null, 'Applied', created_at from public.applications a
where not exists (select 1 from public.application_events e where e.application_id = a.id);

create table if not exists public.application_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  author_id uuid not null references public.internal_users (id),
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  round int not null,
  round_name text not null,
  type text not null default 'technical' check (type in ('hr', 'technical', 'managerial', 'culture', 'other')),
  mode text not null default 'online' check (mode in ('online', 'onsite', 'phone')),
  scheduled_at timestamptz not null,
  duration_min int not null default 45 check (duration_min > 0),
  meeting_link text,
  location text,
  instructions text,
  status text not null default 'Scheduled' check (status in ('Scheduled', 'Completed', 'Cancelled')),
  candidate_confirmed_at timestamptz,
  reschedule_request text,
  reschedule_requested_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists interviews_app_idx on public.interviews (application_id);
create index if not exists interviews_scheduled_idx on public.interviews (scheduled_at);

create table if not exists public.interview_panel (
  interview_id uuid not null references public.interviews (id) on delete cascade,
  interviewer_id uuid not null references public.internal_users (id) on delete cascade,
  primary key (interview_id, interviewer_id)
);
create index if not exists interview_panel_user_idx on public.interview_panel (interviewer_id);

create table if not exists public.scorecards (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.interviews (id) on delete cascade,
  interviewer_id uuid not null references public.internal_users (id) on delete cascade,
  ratings jsonb not null default '{}',
  comments text,
  recommendation text check (recommendation in ('Strong hire', 'Hire', 'No hire', 'Strong no hire')),
  submitted_at timestamptz,
  reopened_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (interview_id, interviewer_id)
);

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  salary numeric(14, 2) not null check (salary >= 0),
  currency text not null default 'INR',
  breakdown jsonb not null default '[]',
  joining_date date not null,
  expires_at date not null,
  letter_body text not null default '',
  status text not null default 'Draft' check (status in
    ('Draft', 'Pending approval', 'Approved', 'Sent', 'Accepted', 'Declined', 'Discussion requested', 'Expired', 'Withdrawn')),
  requires_approval boolean not null default false,
  candidate_note text,
  accepted_name text,
  responded_at timestamptz,
  sent_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists offers_app_idx on public.offers (application_id);
create unique index if not exists offers_one_active_per_app on public.offers (application_id)
  where status in ('Draft', 'Pending approval', 'Approved', 'Sent', 'Discussion requested');

-- ===========================================================================
-- Communications + audit
-- ===========================================================================
create table if not exists public.email_templates (
  code text primary key,
  name text not null,
  stage text not null,
  recipient text not null,
  subject text not null,
  body text not null,
  enabled boolean not null default true,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  template_code text references public.email_templates (code) on delete set null,
  to_email text not null,
  subject text not null,
  body text not null,
  status text not null default 'queued' check (status in ('queued', 'skipped', 'sent', 'failed')),
  error text,
  related_entity text,
  related_id uuid,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
create index if not exists email_outbox_status_idx on public.email_outbox (status, created_at);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  actor_email text,
  action text not null,
  entity_type text not null,
  entity_id text,
  before jsonb,
  after jsonb,
  ip text,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);

create or replace function public.audit_logs_immutable()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_logs is append-only';
end;
$$;
drop trigger if exists audit_logs_no_update on public.audit_logs;
create trigger audit_logs_no_update before update or delete on public.audit_logs
  for each row execute function public.audit_logs_immutable();

-- ===========================================================================
-- updated_at triggers
-- ===========================================================================
do $$
declare t text;
begin
  foreach t in array array['departments', 'locations', 'grades', 'internal_users', 'requisitions', 'jobs',
                           'interviews', 'scorecards', 'offers']
  loop
    execute format('drop trigger if exists %1$s_updated_at on public.%1$s', t);
    execute format('create trigger %1$s_updated_at before update on public.%1$s
                    for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- ===========================================================================
-- RLS
-- ===========================================================================
do $$
declare t text;
begin
  foreach t in array array['departments', 'locations', 'grades', 'internal_users', 'roles', 'permissions',
                           'role_permissions', 'user_roles', 'workflow_definitions', 'approvals', 'requisitions',
                           'jobs', 'application_events', 'application_notes', 'interviews', 'interview_panel',
                           'scorecards', 'offers', 'email_templates', 'email_outbox', 'notifications', 'audit_logs']
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

drop policy if exists "Public reads open external jobs" on public.jobs;
create policy "Public reads open external jobs"
  on public.jobs for select
  to anon, authenticated
  using (status = 'Open' and visibility in ('external', 'both') and not archived);

drop policy if exists "Candidates read own interviews" on public.interviews;
create policy "Candidates read own interviews"
  on public.interviews for select
  to authenticated
  using (exists (select 1 from public.applications a where a.id = application_id and a.candidate_id = auth.uid()));

drop policy if exists "Candidates read own sent offers" on public.offers;
create policy "Candidates read own sent offers"
  on public.offers for select
  to authenticated
  using (
    status in ('Sent', 'Accepted', 'Declined', 'Discussion requested', 'Expired')
    and exists (select 1 from public.applications a where a.id = application_id and a.candidate_id = auth.uid())
  );

drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

-- ===========================================================================
-- Seed: roles, permissions, workflows, templates, org
-- ===========================================================================
insert into public.roles (code, name, description, rank, is_system) values
  ('super_admin', 'Super Admin', 'System owner: users, roles, settings, audit', 10, true),
  ('chro', 'CHRO', 'Approves requisitions and high-value offers; org-wide view', 20, true),
  ('hr_manager', 'HR Manager', 'Runs recruitment and HR operations', 30, true),
  ('hr_executive', 'HR Executive', 'Day-to-day recruitment operations', 40, true),
  ('hiring_manager', 'Hiring Manager', 'Raises requisitions, interviews, final decision', 50, true),
  ('interviewer', 'Interviewer', 'Submits scorecards for assigned interviews', 60, true)
on conflict (code) do update set name = excluded.name, description = excluded.description, rank = excluded.rank;

insert into public.permissions (code, description, module) values
  ('user.manage', 'Add, edit, suspend and deactivate internal users', 'admin'),
  ('role.manage', 'Edit roles and the permission matrix', 'admin'),
  ('org.manage', 'Manage departments, locations and grades', 'admin'),
  ('audit.view', 'View audit logs', 'admin'),
  ('template.manage', 'Edit email templates', 'admin'),
  ('content.manage', 'Manage blogs, case studies and whitepapers', 'content'),
  ('dashboard.org', 'View org-wide recruitment metrics', 'reports'),
  ('requisition.create', 'Raise hiring requisitions', 'recruitment'),
  ('requisition.view', 'View requisitions', 'recruitment'),
  ('requisition.review', 'HR review of requisitions', 'recruitment'),
  ('requisition.approve', 'Final approval of requisitions', 'recruitment'),
  ('job.view', 'View job postings', 'recruitment'),
  ('job.manage', 'Create, edit, publish and close jobs', 'recruitment'),
  ('application.view', 'View applications and candidate profiles', 'recruitment'),
  ('application.move', 'Move applications between pipeline stages', 'recruitment'),
  ('application.decide', 'Final select/reject decision and shortlist interest', 'recruitment'),
  ('interview.schedule', 'Schedule, reschedule and cancel interviews', 'recruitment'),
  ('interview.view', 'View interviews', 'recruitment'),
  ('scorecard.submit', 'Submit interview scorecards', 'recruitment'),
  ('scorecard.view_all', 'View every panelist scorecard', 'recruitment'),
  ('scorecard.reopen', 'Reopen a submitted scorecard', 'recruitment'),
  ('offer.create', 'Draft, send and withdraw offers', 'recruitment'),
  ('offer.approve', 'Approve offers above band', 'recruitment'),
  ('offer.view_salary', 'See salary expectations and offer amounts', 'recruitment')
on conflict (code) do update set description = excluded.description, module = excluded.module;

insert into public.role_permissions (role_code, permission_code, scope)
select r, p, s from (values
  ('super_admin', 'user.manage', 'all'), ('super_admin', 'role.manage', 'all'), ('super_admin', 'org.manage', 'all'),
  ('super_admin', 'audit.view', 'all'), ('super_admin', 'template.manage', 'all'), ('super_admin', 'content.manage', 'all'),

  ('chro', 'dashboard.org', 'all'), ('chro', 'requisition.view', 'all'), ('chro', 'requisition.review', 'all'),
  ('chro', 'requisition.approve', 'all'), ('chro', 'requisition.create', 'all'), ('chro', 'job.view', 'all'),
  ('chro', 'job.manage', 'all'), ('chro', 'application.view', 'all'), ('chro', 'application.move', 'all'),
  ('chro', 'application.decide', 'all'), ('chro', 'interview.view', 'all'), ('chro', 'interview.schedule', 'all'),
  ('chro', 'scorecard.view_all', 'all'), ('chro', 'scorecard.reopen', 'all'), ('chro', 'offer.create', 'all'),
  ('chro', 'offer.approve', 'all'), ('chro', 'offer.view_salary', 'all'), ('chro', 'template.manage', 'all'),
  ('chro', 'audit.view', 'all'),

  ('hr_manager', 'dashboard.org', 'all'), ('hr_manager', 'requisition.view', 'all'), ('hr_manager', 'requisition.review', 'all'),
  ('hr_manager', 'requisition.create', 'all'), ('hr_manager', 'job.view', 'all'), ('hr_manager', 'job.manage', 'all'),
  ('hr_manager', 'application.view', 'all'), ('hr_manager', 'application.move', 'all'), ('hr_manager', 'interview.view', 'all'),
  ('hr_manager', 'interview.schedule', 'all'), ('hr_manager', 'scorecard.view_all', 'all'), ('hr_manager', 'scorecard.reopen', 'all'),
  ('hr_manager', 'offer.create', 'all'), ('hr_manager', 'offer.view_salary', 'all'), ('hr_manager', 'template.manage', 'all'),
  ('hr_manager', 'content.manage', 'all'),

  ('hr_executive', 'requisition.view', 'all'), ('hr_executive', 'requisition.review', 'all'), ('hr_executive', 'job.view', 'all'),
  ('hr_executive', 'job.manage', 'all'), ('hr_executive', 'application.view', 'all'), ('hr_executive', 'application.move', 'all'),
  ('hr_executive', 'interview.view', 'all'), ('hr_executive', 'interview.schedule', 'all'), ('hr_executive', 'scorecard.view_all', 'all'),
  ('hr_executive', 'offer.create', 'all'), ('hr_executive', 'offer.view_salary', 'all'),

  ('hiring_manager', 'requisition.create', 'own'), ('hiring_manager', 'requisition.view', 'own'), ('hiring_manager', 'job.view', 'own'),
  ('hiring_manager', 'application.view', 'own'), ('hiring_manager', 'application.decide', 'own'), ('hiring_manager', 'interview.view', 'own'),
  ('hiring_manager', 'scorecard.submit', 'own'), ('hiring_manager', 'scorecard.view_all', 'own'),

  ('interviewer', 'interview.view', 'own'), ('interviewer', 'scorecard.submit', 'own')
) as v(r, p, s)
on conflict (role_code, permission_code) do nothing;

insert into public.workflow_definitions (type, name, steps) values
  ('requisition', 'Hiring requisition approval',
   '[{"key":"hr_review","label":"HR review","permission":"requisition.review","status":"Pending HR","sla_days":3},
     {"key":"chro_approval","label":"CHRO approval","permission":"requisition.approve","status":"Pending CHRO","sla_days":3}]'),
  ('offer', 'Offer approval',
   '[{"key":"chro_approval","label":"CHRO approval","permission":"offer.approve","condition":"salary_above_band","sla_days":2}]')
on conflict (type) do nothing;

insert into public.email_templates (code, name, stage, recipient, subject, body) values
  ('user_invited', 'Internal user invite', 'Access', 'Internal user',
   'You have been invited to Ascendus HCM',
   'Hi {{name}},\n\n{{inviter_name}} has invited you to Ascendus HCM as {{roles}}.\nSet your password here (valid 48 hours): {{invite_link}}'),
  ('requisition_submitted', 'Requisition submitted', 'Requisition', 'HR, CHRO',
   'New hiring request {{requisition_code}}: {{role_title}}',
   '{{manager_name}} raised a request for {{openings}} x {{role_title}} ({{department}}).\nReview it: {{link}}'),
  ('requisition_decided', 'Requisition decision', 'Requisition', 'Manager, HR',
   'Hiring request {{requisition_code}} {{decision}}',
   'Your request for {{role_title}} was {{decision}} by {{approver_name}}.\nComment: {{comment}}'),
  ('approval_pending', 'Approval pending', 'Workflow', 'Approver',
   'Approval needed: {{entity_label}}',
   'An item is waiting for your approval: {{entity_label}}.\nOpen: {{link}}'),
  ('application_received', 'Application received', 'Application', 'Candidate',
   'We received your application for {{job_title}}',
   'Hi {{candidate_name}},\n\nThank you for applying for {{job_title}} at Ascendus. Our team will review your application and keep you updated.\nTrack your application: {{link}}'),
  ('application_shortlisted', 'Shortlisted', 'Application', 'Candidate',
   'You have been shortlisted for {{job_title}}',
   'Hi {{candidate_name}},\n\nGood news! You have been shortlisted for {{job_title}}. We will contact you shortly with interview details.'),
  ('interview_scheduled', 'Interview scheduled', 'Interview', 'Candidate, panel',
   'Interview scheduled: {{job_title}} - {{round_name}}',
   'Hi {{name}},\n\nAn interview has been scheduled.\nRole: {{job_title}}\nRound: {{round_name}}\nWhen: {{interview_date}}\nMode: {{mode}}\nLink/Location: {{where}}'),
  ('interview_rescheduled', 'Interview rescheduled', 'Interview', 'Candidate, panel',
   'Interview rescheduled: {{job_title}} - {{round_name}}',
   'Hi {{name}},\n\nYour interview has moved to {{interview_date}}.\nMode: {{mode}}\nLink/Location: {{where}}'),
  ('interview_cancelled', 'Interview cancelled', 'Interview', 'Candidate, panel',
   'Interview cancelled: {{job_title}} - {{round_name}}',
   'Hi {{name}},\n\nThe interview for {{job_title}} ({{round_name}}) on {{interview_date}} has been cancelled.'),
  ('feedback_pending', 'Feedback pending', 'Interview', 'Interviewer',
   'Please submit your scorecard for {{candidate_name}}',
   'Hi {{name}},\n\nPlease submit your scorecard for {{candidate_name}} ({{job_title}}, {{round_name}}): {{link}}'),
  ('round_cleared', 'Round cleared', 'Interview', 'Candidate',
   'Update on your application for {{job_title}}',
   'Hi {{candidate_name}},\n\nYou have cleared {{round_name}}. We will share details of the next step soon.'),
  ('application_rejected', 'Not selected', 'Application', 'Candidate',
   'Update on your application for {{job_title}}',
   'Hi {{candidate_name}},\n\nThank you for your interest in {{job_title}}. After careful consideration, we have decided not to move forward with your application at this time. We wish you the best.'),
  ('offer_sent', 'Offer sent', 'Offer', 'Candidate',
   'Congratulations! Your offer for {{job_title}}',
   'Hi {{candidate_name}},\n\nWe are delighted to offer you the role of {{job_title}}. Your proposed joining date is {{joining_date}}. Please respond by {{expiry_date}}: {{link}}'),
  ('offer_responded', 'Offer response', 'Offer', 'HR, manager',
   '{{candidate_name}} {{response}} the offer for {{job_title}}',
   '{{candidate_name}} has {{response}} the offer for {{job_title}}.\nNote: {{note}}')
on conflict (code) do nothing;

insert into public.departments (name, code) values
  ('SAP Consulting & Delivery', 'SAP'),
  ('Sales & Business Development', 'SALES'),
  ('Marketing', 'MKT'),
  ('Engineering & Technology', 'ENG'),
  ('Design', 'DES'),
  ('Human Resources', 'HR'),
  ('Finance & Operations', 'FIN')
on conflict (name) do nothing;

insert into public.locations (name, city, country) values
  ('Puducherry', 'Puducherry', 'India')
on conflict (name) do nothing;

-- Existing jobs from the admin project
insert into public.jobs (id, title, slug, company, location, mode_of_work, type_of_work, experience_level, categories, about_job, responsibilities, qualifications, status, visibility, department_id, location_id, posted_at, created_at) values
  ($j$0ff466b9-c619-450c-a905-4e07382a0014$j$::uuid, $j$Business Development Executive$j$, $j$business-development-executive$j$, '', $j$Hybrid$j$, $j$Hybrid$j$, $j$Full-time$j$, $j$Fresher$j$, array[$j$Sales & Business Development$j$]::text[], $j$We're seeking a highly motivated and ambitious individual to join our team as a Business Development Executive, driving lead generation and client relationships for our SAP solutions and services.$j$, array[$j$Identify and generate leads through channels such as LinkedIn, cold calling, emails, and networking$j$,$j$Build and maintain strong relationships with potential and existing clients to understand their business needs$j$,$j$Conduct research on industry trends, competitors, and potential clients to identify new business opportunities$j$,$j$Contact potential clients through calls, emails, and meetings to present our SAP solutions and services$j$,$j$Prepare business proposals, sales presentations, and pitch decks tailored to client needs$j$]::text[], array[$j$Bachelor's degree in BE or Business Administration$j$,$j$0-1 years of experience$j$,$j$Strong communication and interpersonal skills, presentation skills, and the ability to confidently engage with clients and build relationships$j$,$j$Excellent organizational and time management skills, with the ability to prioritize tasks effectively$j$,$j$Ability to work both independently and collaboratively in a team-oriented environment$j$,$j$Prior internship or part-time work experience in sales or BDE is a plus$j$]::text[], $j$Open$j$, 'external', (select id from public.departments where name = $j$Sales & Business Development$j$), (select id from public.locations where name = 'Puducherry'), $j$2026-09-01T07:53:22.867143+00:00$j$::timestamptz, $j$2026-09-03T07:53:22.867143+00:00$j$::timestamptz),
  ($j$78f95fb0-52f5-4869-922f-a088af278eca$j$::uuid, $j$SAP ABAP developer$j$, $j$sap-abap-developer$j$, '', $j$Hybrid$j$, $j$Hybrid$j$, $j$Full-time$j$, $j$Fresher$j$, array[$j$SAP Consulting & Delivery$j$]::text[], $j$We're seeking an experienced SAP Consultant to support enterprise business processes, optimize SAP solutions, and collaborate with business and technical teams to deliver scalable and efficient implementations.$j$, array[$j$Configure, implement, and support SAP solutions based on business requirements$j$,$j$Analyze business processes and translate requirements into SAP solutions$j$,$j$Collaborate with functional and technical teams on SAP implementation projects$j$,$j$Troubleshoot system issues and provide timely resolution$j$,$j$Develop and maintain SAP documentation, configurations, and process workflows$j$,$j$Support system upgrades, integrations, testing, and continuous process improvements$j$]::text[], array[$j$0-1 years of experience working with SAP systems$j$,$j$Strong understanding of SAP modules and enterprise business processes$j$,$j$Experience with SAP implementation, configuration, and support$j$,$j$Knowledge of SAP integration with other enterprise applications$j$,$j$Strong analytical, communication, and problem-solving skills$j$,$j$Bachelor's degree in Computer Science, Information Technology, Business, or related field$j$]::text[], $j$Open$j$, 'external', (select id from public.departments where name = $j$SAP Consulting & Delivery$j$), (select id from public.locations where name = 'Puducherry'), $j$2026-08-27T07:53:22.867143+00:00$j$::timestamptz, $j$2026-09-03T07:53:22.867143+00:00$j$::timestamptz),
  ($j$25654d84-594e-4610-91c1-ffae7e1fde47$j$::uuid, $j$Marketing Executive$j$, $j$marketing-executive$j$, '', $j$Hybrid$j$, $j$Hybrid$j$, $j$Full-time$j$, $j$Expertise$j$, array[$j$Marketing$j$]::text[], $j$We're looking for a Marketing Executive to plan and execute campaigns that build brand visibility and generate qualified pipeline across our enterprise technology and SAP consulting offerings.$j$, array[$j$Plan and execute digital and offline marketing campaigns$j$,$j$Manage content calendars across website, social, and email channels$j$,$j$Coordinate with design and content teams on campaign assets$j$,$j$Track campaign performance and report on key marketing metrics$j$,$j$Support event, webinar, and lead-generation initiatives$j$,$j$Maintain brand consistency across all marketing materials$j$]::text[], array[$j$1-3 years of experience in marketing or a related field$j$,$j$Familiarity with digital marketing tools and social media platforms$j$,$j$Strong written and verbal communication skills$j$,$j$Basic understanding of SEO and campaign analytics$j$,$j$Ability to manage multiple projects and deadlines$j$,$j$Bachelor's degree in Marketing, Communications, or related field$j$]::text[], $j$Open$j$, 'external', (select id from public.departments where name = $j$Marketing$j$), (select id from public.locations where name = 'Puducherry'), $j$2026-08-31T07:53:22.867143+00:00$j$::timestamptz, $j$2026-09-03T07:53:22.867143+00:00$j$::timestamptz),
  ($j$880a161d-f746-4623-a475-e17847ce279c$j$::uuid, $j$UI/UX Designer$j$, $j$uiux-designer$j$, '', $j$Hybrid$j$, $j$Hybrid$j$, $j$Full-time$j$, $j$Fresher$j$, array[$j$Design$j$]::text[], $j$We are looking for a fresher UI/UX Designer to join our product team. You will work closely with product managers and developers to design intuitive, user-centered interfaces for web and mobile applications.$j$, array[$j$Assist in creating wireframes, prototypes, and high-fidelity mockups,$j$,$j$Conduct basic user research and usability testing.$j$,$j$Collaborate with developers to ensure design feasibility.$j$,$j$Maintain and follow the design system and style guide.$j$,$j$Iterate on designs based on feedback from stakeholders.$j$]::text[], array[$j$Degree/diploma in Design, HCI, or related field.$j$,$j$Familiarity with Figma or Adobe XD$j$,$j$Basic understanding of UX principles and responsive design$j$,$j$Good communication and attention to detail$j$,$j$Portfolio of academic or personal design projects$j$]::text[], $j$Open$j$, 'external', (select id from public.departments where name = $j$Design$j$), (select id from public.locations where name = 'Puducherry'), $j$2026-09-07T06:57:54.800959+00:00$j$::timestamptz, $j$2026-09-07T06:57:54.800959+00:00$j$::timestamptz),
  ($j$5dc36987-57d7-4124-a84c-2fefa2c369d2$j$::uuid, $j$Application Developer$j$, $j$application-developer$j$, '', $j$Hybrid$j$, $j$Hybrid$j$, $j$Full-time$j$, $j$Expertise$j$, array[$j$Engineering & Technology$j$]::text[], $j$We are looking for a fresher Application Developer to design, build, and maintain applications across web and mobile platforms. You will work on real client and internal projects.$j$, array[$j$Develop and maintain applications using modern programming languages and frameworks$j$,$j$Write clean, testable, and efficient code based on requirements and design specs$j$,$j$Debug, troubleshoot, and fix issues across application layers$j$,$j$Work with APIs, databases, and third-party integrations$j$,$j$Collaborate with designers, QA, and backend/frontend developers Qualifications$j$]::text[], array[$j$2- 3 years of experience in application development$j$,$j$Working knowledge of at least one programming language (Java, C#, JavaScript, Python, etc.)$j$,$j$Basic understanding of databases (SQL) and API integration$j$,$j$Understanding of Git and version control basics$j$,$j$Willingness to learn and adapt quickly$j$,$j$Degree in Computer Science, IT, or related field$j$]::text[], $j$Open$j$, 'external', (select id from public.departments where name = $j$Engineering & Technology$j$), (select id from public.locations where name = 'Puducherry'), $j$2026-09-07T07:04:10.45301+00:00$j$::timestamptz, $j$2026-09-07T07:04:10.45301+00:00$j$::timestamptz),
  ($j$efee5c0b-8e83-4e61-adb6-d15233117282$j$::uuid, $j$Graphic Designer$j$, $j$graphic-designer$j$, '', $j$Hybrid$j$, $j$Hybrid$j$, $j$Full-time$j$, $j$Fresher$j$, array[$j$Marketing$j$,$j$Design$j$]::text[], $j$We are hiring a fresher Graphic Designer to create visual content for marketing, branding, and social media. You will work with the marketing team to bring campaigns and brand assets to life.$j$, array[$j$Design graphics for social media, presentations, and marketing collateral$j$,$j$Support branding and visual identity projects$j$,$j$Prepare print-ready and digital-ready design files$j$,$j$Collaborate with marketing team on campaign visuals$j$,$j$Maintain brand consistency across all designs$j$]::text[], array[$j$Degree/diploma in Graphic Design, Fine Arts, or related field$j$,$j$Proficiency in Adobe Photoshop, Illustrator, or Canva$j$,$j$Strong sense of layout, color, and typography$j$,$j$Ability to manage multiple design requests$j$,$j$Portfolio showcasing design work$j$]::text[], $j$Open$j$, 'external', (select id from public.departments where name = $j$Marketing$j$), (select id from public.locations where name = 'Puducherry'), $j$2026-09-07T07:04:10.45301+00:00$j$::timestamptz, $j$2026-09-07T07:04:10.45301+00:00$j$::timestamptz),
  ($j$9cbfdf13-1dce-4033-a59b-b1b6828a5617$j$::uuid, $j$Full Stack Web Developer$j$, $j$full-stack-web-developer$j$, '', $j$Hybrid$j$, $j$Hybrid$j$, $j$Full-time$j$, $j$Fresher$j$, array[$j$Engineering & Technology$j$]::text[], $j$We are seeking a fresher Fullstack Developer to work across both frontend and backend of our applications. You will get hands-on experience building end-to-end features under senior developer mentorship.$j$, array[$j$Build frontend interfaces using React/Next.js and backend APIs using Node.js$j$,$j$Integrate with databases and third-party services$j$,$j$Write clean, maintainable, and tested code$j$,$j$Debug and resolve issues across the stack$j$,$j$Participate in code reviews and team stand-ups$j$]::text[], array[$j$Degree in Computer Science, IT, or related field$j$,$j$Basic knowledge of JavaScript/Node.js and a frontend framework (React preferred)$j$,$j$Understanding of REST APIs and relational databases$j$,$j$Familiarity with Git version control$j$,$j$Strong problem-solving fundamentals$j$]::text[], $j$Open$j$, 'external', (select id from public.departments where name = $j$Engineering & Technology$j$), (select id from public.locations where name = 'Puducherry'), $j$2026-09-07T07:04:10.45301+00:00$j$::timestamptz, $j$2026-09-07T07:04:10.45301+00:00$j$::timestamptz)
on conflict (id) do nothing;

update public.applications a set job_id = null
where job_id is not null and not exists (select 1 from public.jobs j where j.id = a.job_id);

alter table public.applications
  drop constraint if exists applications_job_id_fkey,
  add constraint applications_job_id_fkey foreign key (job_id) references public.jobs (id) on delete set null;

commit;
