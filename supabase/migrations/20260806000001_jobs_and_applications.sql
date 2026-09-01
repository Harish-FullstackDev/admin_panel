-- supabase/migrations/20260806000001_jobs_and_applications.sql
--
-- NOTE: `public.jobs` and `public.job_applications` already exist in this
-- project (created outside this repo's migration history — presumably by
-- the separate application that owns the public careers page). This
-- migration is intentionally additive-only: it does NOT create, alter, or
-- drop either table. It only fills two verified gaps on `jobs`:
--   1. RLS is enabled on `jobs` but had zero policies, so no one (public
--      anon key or authenticated admin) could read/write it at all.
--   2. `jobs` had no updated_at trigger (job_applications already has one).
--
-- Every statement below is written to be safe to re-run.

-- =============================================================================
-- 1. RLS policies for public.jobs
-- =============================================================================
DO $$ BEGIN
    CREATE POLICY "Public can view open jobs" ON public.jobs
        FOR SELECT
        USING (status = 'Open');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Admins have full access to jobs" ON public.jobs
        FOR ALL TO authenticated
        USING (true)
        WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- 2. updated_at trigger for public.jobs
--    (reuses update_updated_at_column(), already defined by
--    20260624000002_final_relational_schema.sql and already in use by the
--    existing job_applications trigger)
-- =============================================================================
DO $$ BEGIN
    CREATE TRIGGER update_jobs_updated_at
        BEFORE UPDATE ON public.jobs
        FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
