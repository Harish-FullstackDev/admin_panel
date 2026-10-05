import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { requirePermission, jsonError, serverError } from "@/lib/hcm/auth";
import { moveApplication, WorkflowError, APPLICATION_STAGES } from "@/lib/hcm/workflow";
import { stripSalary, managedJobIds, afterStageChange } from "@/lib/hcm/recruitment";

const LIST_COLUMNS =
  "id, candidate_id, job_id, job_slug, position, first_name, last_name, email, phone, city, country, experience, job_title, employer, key_skills, current_salary, expected_salary, stage, current_round, source, tags, manager_interest, rejection_reason, stage_changed_at, created_at";

// GET ?job_id=&stage=&q=
export async function GET(request) {
  const auth = await requirePermission(request, "application.view");
  if (auth.error) return auth.error;
  try {
    const params = new URL(request.url).searchParams;
    const supabase = createHcmAdminClient();
    let query = supabase.from("applications").select(LIST_COLUMNS).order("created_at", { ascending: false });

    if (auth.scope === "own") {
      const ids = await managedJobIds(auth.user.id);
      if (!ids.length) return NextResponse.json({ success: true, applications: [] });
      query = query.in("job_id", ids);
      // Managers see candidates once HR has shortlisted them (plan §9).
      query = query.in("stage", ["Shortlisted", "Interview", "Selected", "Offer", "Hired"]);
    }
    if (params.get("job_id")) query = query.eq("job_id", params.get("job_id"));
    if (params.get("stage")) query = query.eq("stage", params.get("stage"));
    const q = params.get("q")?.trim();
    if (q) {
      const safe = q.replace(/[%,()]/g, " ");
      query = query.or(
        `first_name.ilike.%${safe}%,last_name.ilike.%${safe}%,email.ilike.%${safe}%,position.ilike.%${safe}%,key_skills.ilike.%${safe}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ success: true, applications: data.map((a) => stripSalary(auth.user, a)) });
  } catch (err) {
    return serverError("Applications GET", err);
  }
}

// POST (bulk) { ids: string[], to: stage, reason? }
export async function POST(request) {
  const auth = await requirePermission(request, "application.move");
  if (auth.error) return auth.error;
  try {
    const { ids, to, reason } = await request.json();
    if (!Array.isArray(ids) || !ids.length) return jsonError("Select at least one application.");
    if (!APPLICATION_STAGES.includes(to)) return jsonError("Invalid stage.");
    if (!["Screening", "Shortlisted", "Hold", "Rejected"].includes(to)) {
      return jsonError("Bulk moves support Screening, Shortlisted, Hold and Rejected only.");
    }

    const supabase = createHcmAdminClient();
    const results = [];
    for (const id of ids.slice(0, 200)) {
      try {
        const { after } = await moveApplication(id, to, { actor: auth.user, reason, request });
        const { data: job } = after.job_id
          ? await supabase.from("jobs").select("title").eq("id", after.job_id).maybeSingle()
          : { data: null };
        await afterStageChange(after, to, { job });
        results.push({ id, ok: true });
      } catch (err) {
        results.push({ id, ok: false, error: err instanceof WorkflowError ? err.message : "Failed." });
      }
    }
    return NextResponse.json({ success: true, results, moved: results.filter((r) => r.ok).length });
  } catch (err) {
    return serverError("Applications bulk", err);
  }
}
