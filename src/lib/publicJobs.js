import { supabase } from "@/lib/supabaseClient";

// Anon client: RLS on `jobs` only exposes status = 'Open'.
const PUBLIC_COLUMNS =
  "id, slug, title, company, location, mode_of_work, type_of_work, experience_level, categories, about_job, responsibilities, qualifications, created_at";

export async function getOpenJobs() {
  const { data, error } = await supabase
    .from("jobs")
    .select(PUBLIC_COLUMNS)
    .eq("status", "Open")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getOpenJobs error:", error);
    return [];
  }
  return data || [];
}

export async function getOpenJobBySlug(slug) {
  const { data, error } = await supabase
    .from("jobs")
    .select(PUBLIC_COLUMNS)
    .eq("status", "Open")
    .eq("slug", slug)
    .maybeSingle();
  if (error) console.error("getOpenJobBySlug error:", error);
  return data || null;
}
