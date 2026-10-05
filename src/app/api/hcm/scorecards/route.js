import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { getInternalUser, hasPermission, jsonError, serverError } from "@/lib/hcm/auth";
import { logAudit } from "@/lib/hcm/audit";
import { notifyUsers } from "@/lib/hcm/notify";
import { candidateName } from "@/lib/hcm/recruitment";

const DEFAULT_CRITERIA = ["Technical skill", "Communication", "Problem solving", "Culture fit"];
const RECOMMENDATIONS = ["Strong hire", "Hire", "No hire", "Strong no hire"];

async function onPanel(supabase, interviewId, userId) {
  const { data } = await supabase
    .from("interview_panel")
    .select("interview_id")
    .eq("interview_id", interviewId)
    .eq("interviewer_id", userId)
    .maybeSingle();
  return Boolean(data);
}

// GET ?interview_id= — the caller's own scorecard plus criteria.
export async function GET(request) {
  const user = await getInternalUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const interviewId = new URL(request.url).searchParams.get("interview_id");
    if (!interviewId) return jsonError("interview_id is required.");
    const supabase = createHcmAdminClient();
    if (!(await onPanel(supabase, interviewId, user.id))) return jsonError("You are not on this interview panel.", 403);
    const { data } = await supabase
      .from("scorecards")
      .select("*")
      .eq("interview_id", interviewId)
      .eq("interviewer_id", user.id)
      .maybeSingle();
    return NextResponse.json({ success: true, scorecard: data, criteria: DEFAULT_CRITERIA, recommendations: RECOMMENDATIONS });
  } catch (err) {
    return serverError("Scorecard GET", err);
  }
}

// POST { interview_id, ratings: {criterion: 1-5}, comments, recommendation, submit: boolean }
export async function POST(request) {
  const user = await getInternalUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const body = await request.json();
    const supabase = createHcmAdminClient();
    if (!body.interview_id) return jsonError("interview_id is required.");
    if (!(await onPanel(supabase, body.interview_id, user.id))) return jsonError("You are not on this interview panel.", 403);

    const { data: interview } = await supabase
      .from("interviews")
      .select("id, status, scheduled_at, round_name, application_id, applications(first_name, last_name, email, position)")
      .eq("id", body.interview_id)
      .single();
    if (interview.status === "Cancelled") return jsonError("This interview was cancelled.");

    const { data: existing } = await supabase
      .from("scorecards")
      .select("*")
      .eq("interview_id", body.interview_id)
      .eq("interviewer_id", user.id)
      .maybeSingle();
    if (existing?.submitted_at) return jsonError("This scorecard is submitted and locked. Ask HR to reopen it.");

    const ratings = {};
    for (const [criterion, score] of Object.entries(body.ratings || {})) {
      const n = Number(score);
      if (Number.isInteger(n) && n >= 1 && n <= 5) ratings[criterion] = n;
    }
    const recommendation = RECOMMENDATIONS.includes(body.recommendation) ? body.recommendation : null;
    const submit = Boolean(body.submit);
    if (submit) {
      if (new Date(interview.scheduled_at).getTime() > Date.now()) return jsonError("You can submit the scorecard after the interview starts.");
      if (DEFAULT_CRITERIA.some((c) => !ratings[c])) return jsonError("Rate every criterion before submitting.");
      if (!recommendation) return jsonError("Choose a recommendation before submitting.");
    }

    const row = {
      interview_id: body.interview_id,
      interviewer_id: user.id,
      ratings,
      comments: String(body.comments || "").trim() || null,
      recommendation,
      submitted_at: submit ? new Date().toISOString() : null,
    };
    const { data, error } = await supabase.from("scorecards").upsert(row, { onConflict: "interview_id,interviewer_id" }).select().single();
    if (error) throw error;

    if (submit) {
      await logAudit({ actor: user, action: "scorecard.submit", entityType: "scorecard", entityId: data.id, after: row, request });
      const { data: panel } = await supabase.from("interview_panel").select("interviewer_id").eq("interview_id", body.interview_id);
      const { data: cards } = await supabase.from("scorecards").select("interviewer_id").eq("interview_id", body.interview_id).not("submitted_at", "is", null);
      if ((cards || []).length >= (panel || []).length) {
        await supabase.from("interviews").update({ status: "Completed" }).eq("id", body.interview_id).eq("status", "Scheduled");
        await notifyUsers(
          { permission: "application.move" },
          {
            title: `All feedback in: ${candidateName(interview.applications)}`,
            body: `${interview.round_name} · ${interview.applications.position}`,
            link: `/admin/dashboard/careers/applications?open=${interview.application_id}`,
          }
        );
      }
    }
    return NextResponse.json({ success: true, scorecard: data });
  } catch (err) {
    return serverError("Scorecard POST", err);
  }
}

// PATCH { id } — reopen a submitted scorecard (HR).
export async function PATCH(request) {
  const user = await getInternalUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!hasPermission(user, "scorecard.reopen")) return jsonError("You do not have permission to do this.", 403);
  try {
    const { id } = await request.json();
    const supabase = createHcmAdminClient();
    const { data, error } = await supabase
      .from("scorecards")
      .update({ submitted_at: null, reopened_by: user.id })
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) return jsonError("Scorecard not found.", 404);
    await logAudit({ actor: user, action: "scorecard.reopen", entityType: "scorecard", entityId: id, request });
    await notifyUsers([data.interviewer_id], { title: "A scorecard was reopened for edits", link: `/admin/dashboard/interviews?focus=${data.interview_id}` });
    return NextResponse.json({ success: true });
  } catch (err) {
    return serverError("Scorecard PATCH", err);
  }
}
