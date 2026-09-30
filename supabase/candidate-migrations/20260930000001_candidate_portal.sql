-- Candidate portal schema for Supabase project unjirnxwvtgifdaieijl.
-- Run once in Dashboard > SQL Editor. Jobs live in the admin project; job_id
-- here references those rows by value only (no cross-database FK).

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- candidate_profiles: one row per auth user
-- ---------------------------------------------------------------------------
create table if not exists public.candidate_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text not null,
  phone text,
  city text,
  country text,
  linkedin text,
  portfolio text,
  key_skills text,
  experience text,
  resume_path text,
  resume_filename text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists candidate_profiles_updated_at on public.candidate_profiles;
create trigger candidate_profiles_updated_at
  before update on public.candidate_profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_candidate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_candidate();

-- ---------------------------------------------------------------------------
-- applications: mirrors the admin project's job_applications columns
-- ---------------------------------------------------------------------------
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references auth.users (id) on delete set null,
  job_id uuid,
  job_slug text,
  position text not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  zip text,
  country text,
  experience text,
  job_title text,
  employer text,
  key_skills text,
  cover_letter text,
  resume_path text not null,
  resume_filename text,
  start_date text,
  current_salary text,
  expected_salary text,
  linkedin text,
  portfolio text,
  ref_name text,
  ref_relationship text,
  ref_email text,
  ref_phone text,
  hear_about text,
  consent_given boolean not null default false,
  status text not null default 'New'
    check (status in ('New', 'Reviewed', 'Shortlisted', 'Interviewing', 'Rejected', 'Hired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint applications_candidate_job_unique unique (candidate_id, job_id)
);

create index if not exists applications_candidate_id_idx on public.applications (candidate_id);
create index if not exists applications_job_id_idx on public.applications (job_id);
create index if not exists applications_status_idx on public.applications (status);
create index if not exists applications_created_at_idx on public.applications (created_at desc);

drop trigger if exists applications_updated_at on public.applications;
create trigger applications_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: candidates read their own data. All writes go through server routes
-- using the service role key, which bypasses RLS.
-- ---------------------------------------------------------------------------
alter table public.candidate_profiles enable row level security;
alter table public.applications enable row level security;

drop policy if exists "Candidates read own profile" on public.candidate_profiles;
create policy "Candidates read own profile"
  on public.candidate_profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Candidates update own profile" on public.candidate_profiles;
create policy "Candidates update own profile"
  on public.candidate_profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Candidates read own applications" on public.applications;
create policy "Candidates read own applications"
  on public.applications for select
  to authenticated
  using (auth.uid() = candidate_id);
