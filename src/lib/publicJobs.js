import { createClient } from "@supabase/supabase-js";

// Anon client on the HCM project: RLS only exposes Open, external, unarchived jobs.
const publicClient = createClient(
  process.env.NEXT_PUBLIC_CANDIDATE_SUPABASE_URL || "https://placeholder-project-dummy.supabase.co",
  process.env.NEXT_PUBLIC_CANDIDATE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_dummy",
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const PUBLIC_COLUMNS =
  "id, slug, title, company, location, mode_of_work, type_of_work, experience_level, categories, skills, about_job, responsibilities, qualifications, openings, closing_date, show_salary, salary_min, salary_max, currency, created_at";

function publicView(job) {
  if (!job) return job;
  if (job.show_salary) return job;
  const { salary_min, salary_max, ...rest } = job;
  return rest;
}

export async function getOpenJobs() {
  const { data, error } = await publicClient
    .from("jobs")
    .select(PUBLIC_COLUMNS)
    .eq("status", "Open")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getOpenJobs error:", error);
    return [];
  }
  return (data || []).map(publicView);
}

export async function getOpenJobBySlug(slug) {
  const { data, error } = await publicClient
    .from("jobs")
    .select(PUBLIC_COLUMNS)
    .eq("status", "Open")
    .eq("slug", slug)
    .maybeSingle();
  if (error) console.error("getOpenJobBySlug error:", error);
  return publicView(data) || null;
}
