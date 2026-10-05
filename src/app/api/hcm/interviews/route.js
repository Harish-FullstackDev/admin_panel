import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { requirePermission, jsonError, serverError } from "@/lib/hcm/auth";
import { logAudit } from "@/lib/hcm/audit";
import { moveApplication, WorkflowError } from "@/lib/hcm/workflow";
import { managedJobIds, candidateName } from "@/lib/hcm/recruitment";
import { interviewFields, sendInterviewEmails } from "@/lib/hcm/interviews";

// GET ?application_id=&scope=upcoming|past|all
export async function GET(request) {
  const auth = await requirePermission(request, "interview.view");
  if (auth.error) return auth.error;
  try {
    const params = new URL(request.url).searchParams;
    const supabase = createHcmAdminClient();
    let query = supabase
      .from("interviews")
      .select("*, interview_panel(interviewer_id), applications!inner(id, first_name, last_name, email, position, job_id, stage)")
      .order("scheduled_at", { ascending: params.get("scope") !== "past" });

    if (auth.scope === "own") {
      const { data: mine } = await supabase.from("interview_panel").select("interview_id").eq("interviewer_id", auth.user.id);
      const allowed = new Set((mine || []).map((p) => p.interview_id));
      const jobIds = await managedJobIds(auth.user.id);
      if (jobIds.length) {
        const { data: managed } = await supabase
          .from("interviews")
          .select("id, applications!inner(job_id)")
          .in("applications.job_id", jobIds);
        for (const i of managed || []) allowed.add(i.id);
      }
      if (!allowed.size) return NextResponse.json({ success: true, interviews: [] });
      query = query.in("id", [...allowed]);
    }
    if (params.get("application_id")) query = query.eq("application_id", params.get("application_id"));
    const now = new Date().toISOString();
    if (params.get("scope") === "upcoming") query = query.gte("scheduled_at", now).eq("status", "Scheduled");
    if (params.get("scope") === "past") query = query.lt("scheduled_at", now);

    const { data, error } = await query.limit(300);
    if (error) throw error;

    const ids = data.map((i) => i.id);
    const panelUserIds = [...new Set(data.flatMap((i) => i.interview_panel.map((p) => p.interviewer_id)))];
    const [cards, users] = await Promise.all([
      ids.length ? supabase.from("scorecards").select("interview_id, interviewer_id, submitted_at").in("interview_id", ids) : { data: [] },
      panelUserIds.length ? supabase.from("internal_users").select("id, full_name").in("id", panelUserIds) : { data: [] },
    ]);
    const names = Object.fromEntries((users.data || []).map((u) => [u.id, u.full_name]));

    const interviews = data.map((i) => {
      const mineCard = (cards.data || []).find((c) => c.interview_id === i.id && c.interviewer_id === auth.user.id);
      const submitted = (cards.data || []).filter((c) => c.interview_id === i.id && c.submitted_at).length;
      return {
        id: i.id,
        application_id: i.application_id,
        candidate_name: candidateName(i.applications),
        position: i.applications.position,
        job_id: i.applications.job_id,
        round: i.round,
        round_name: i.round_name,
        type: i.type,
        mode: i.mode,
        scheduled_at: i.scheduled_at,
        duration_min: i.duration_min,
        meeting_link: i.meeting_link,
        location: i.location,
        instructions: i.instructions,
        status: i.status,
        candidate_confirmed_at: i.candidate_confirmed_at,
        reschedule_request: i.reschedule_request,
        panel: i.interview_panel.map((p) => ({ id: p.interviewer_id, name: names[p.interviewer_id] || "—" })),
        on_panel: i.interview_panel.some((p) => p.interviewer_id === auth.user.id),
        my_scorecard: mineCard ? (mineCard.submitted_at ? "Submitted" : "Draft") : null,
        scorecards_submitted: submitted,
      };
    });
    return NextResponse.json({ success: true, interviews });
  } catch (err) {
    return serverError("Interviews GET", err);
  }
}

// POST { application_id, round_name, type, mode, scheduled_at, duration_min, meeting_link, location, instructions, panel: [ids] }
export async function POST(request) {
  const auth = await requirePermission(request, "interview.schedule");
  if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const fields = interviewFields(body);
    if (fields.error) return jsonError(fields.error);
    const panel = [...new Set((body.panel || []).filter(Boolean))];
    if (!panel.length) return jsonError("Add at least one interviewer to the panel.");

    const supabase = createHcmAdminClient();
    const { data: app } = await supabase.from("applications").select("*").eq("id", body.application_id).maybeSingle();
    if (!app) return jsonError("Application not found.", 404);
    if (!["Shortlisted", "Interview"].includes(app.stage)) {
      return jsonError("Only shortlisted or interviewing candidates can be scheduled.");
    }

    const { data: panelUsers } = await supabase.from("internal_users").select("id, full_name, email, status").in("id", panel);
    if ((panelUsers || []).length !== panel.length || panelUsers.some((u) => u.status !== "Active")) {
      return jsonError("Every panelist must be an active internal user.");
    }

    const { count } = await supabase
      .from("interviews")
      .select("id", { count: "exact", head: true })
      .eq("application_id", app.id)
      .neq("status", "Cancelled");
    const round = (count || 0) + 1;

    const { data: interview, error } = await supabase
      .from("interviews")
      .insert({ ...fields.value, application_id: app.id, round, created_by: auth.user.id })
      .select()
      .single();
    if (error) throw error;
    const { error: panelError } = await supabase
      .from("interview_panel")
      .insert(panel.map((interviewer_id) => ({ interview_id: interview.id, interviewer_id })));
    if (panelError) throw panelError;

    await moveApplication(app.id, "Interview", {
      actor: auth.user,
      request,
      reason: `${interview.round_name} scheduled`,
      patch: { current_round: round },
    });
    await logAudit({ actor: auth.user, action: "interview.schedule", entityType: "interview", entityId: interview.id, after: { ...interview, panel }, request });

    const { data: job } = app.job_id ? await supabase.from("jobs").select("title").eq("id", app.job_id).maybeSingle() : { data: null };
    await sendInterviewEmails("interview_scheduled", interview, app, panelUsers, job);

    return NextResponse.json({ success: true, interview }, { status: 201 });
  } catch (err) {
    if (err instanceof WorkflowError) return jsonError(err.message, err.status);
    return serverError("Interviews POST", err);
  }
}
