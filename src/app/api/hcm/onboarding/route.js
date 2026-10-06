import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { requirePermission, jsonError, serverError } from "@/lib/hcm/auth";
import { createJoiner, joinerReadiness, JOINER_SELECT, OnboardingError } from "@/lib/hcm/onboarding";

// GET: joiners with readiness counts, plus hired applications that have no
// joiner yet (legacy hires, or an auto-start that failed).
export async function GET(request) {
  const auth = await requirePermission(request, "onboarding.manage");
  if (auth.error) return auth.error;

  try {
    const db = createHcmAdminClient();
    const status = new URL(request.url).searchParams.get("status");
    let query = db.from("joiners").select(JOINER_SELECT).order("joining_date");
    if (status) query = query.eq("status", status);
    const { data: joiners, error } = await query;
    if (error) throw error;

    const ids = joiners.map((j) => j.id);
    const [{ data: docs }, { data: tasks }, { data: hired }, { data: started }] = await Promise.all([
      ids.length ? db.from("joiner_documents").select("joiner_id, required, status").in("joiner_id", ids) : { data: [] },
      ids.length ? db.from("tasks").select("context_id, status").eq("context_type", "onboarding").in("context_id", ids) : { data: [] },
      db.from("applications").select("id, first_name, last_name, email, position, stage_changed_at").eq("stage", "Hired").order("stage_changed_at", { ascending: false }),
      db.from("joiners").select("application_id"),
    ]);

    const rows = joiners.map((j) => ({
      ...j,
      readiness: joinerReadiness(
        j,
        (docs || []).filter((d) => d.joiner_id === j.id),
        (tasks || []).filter((t) => t.context_id === j.id)
      ),
    }));
    const startedIds = new Set((started || []).map((s) => s.application_id));
    return NextResponse.json({
      success: true,
      joiners: rows,
      hiredWithoutJoiner: (hired || []).filter((a) => !startedIds.has(a.id)),
    });
  } catch (err) {
    return serverError("Onboarding GET", err);
  }
}

// POST { application_id }: start onboarding by hand.
export async function POST(request) {
  const auth = await requirePermission(request, "onboarding.manage");
  if (auth.error) return auth.error;
  try {
    const { application_id } = await request.json();
    if (!application_id) return jsonError("application_id is required.");
    const { joiner, created } = await createJoiner(application_id, auth.user, request);
    return NextResponse.json({ success: true, joiner, created }, { status: created ? 201 : 200 });
  } catch (err) {
    if (err instanceof OnboardingError) return jsonError(err.message, err.status);
    return serverError("Onboarding POST", err);
  }
}
