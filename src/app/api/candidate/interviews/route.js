import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { getCandidateFromRequest } from "@/lib/candidateAuth";
import { notifyUsers } from "@/lib/hcm/notify";
import { logAudit } from "@/lib/hcm/audit";

async function ownApplicationIds(supabase, candidateId) {
  const { data } = await supabase.from("applications").select("id").eq("candidate_id", candidateId);
  return (data || []).map((a) => a.id);
}

export async function GET(request) {
  const candidate = await getCandidateFromRequest(request);
  if (!candidate) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const supabase = createHcmAdminClient();
    const appIds = await ownApplicationIds(supabase, candidate.id);
    if (!appIds.length) return NextResponse.json({ success: true, interviews: [] });

    const { data, error } = await supabase
      .from("interviews")
      .select(
        "id, application_id, round, round_name, type, mode, scheduled_at, duration_min, meeting_link, location, instructions, status, candidate_confirmed_at, reschedule_request, interview_panel(internal_users(full_name, designation)), applications(position)"
      )
      .in("application_id", appIds)
      .order("scheduled_at", { ascending: false });
    if (error) throw error;

    const interviews = data.map((i) => ({
      id: i.id,
      application_id: i.application_id,
      position: i.applications?.position,
      round: i.round,
      round_name: i.round_name,
      type: i.type,
      mode: i.mode,
      scheduled_at: i.scheduled_at,
      duration_min: i.duration_min,
      meeting_link: i.status === "Scheduled" ? i.meeting_link : null,
      location: i.location,
      instructions: i.instructions,
      status: i.status,
      candidate_confirmed_at: i.candidate_confirmed_at,
      reschedule_request: i.reschedule_request,
      interviewers: i.interview_panel.map((p) => p.internal_users).filter(Boolean),
    }));
    return NextResponse.json({ success: true, interviews });
  } catch (err) {
    console.error("Candidate interviews GET error:", err);
    return NextResponse.json({ error: err.message || "Failed to load interviews." }, { status: 500 });
  }
}

// POST { id, action: "confirm" | "reschedule", note? }
export async function POST(request) {
  const candidate = await getCandidateFromRequest(request);
  if (!candidate) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const { id, action, note } = await request.json();
    const supabase = createHcmAdminClient();
    const { data: interview } = await supabase
      .from("interviews")
      .select("id, status, scheduled_at, round_name, reschedule_request, application_id, applications(candidate_id, first_name, last_name, position), interview_panel(interviewer_id)")
      .eq("id", id)
      .maybeSingle();
    if (!interview || interview.applications?.candidate_id !== candidate.id) {
      return NextResponse.json({ error: "Interview not found." }, { status: 404 });
    }
    if (interview.status !== "Scheduled" || new Date(interview.scheduled_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "This interview can no longer be changed." }, { status: 400 });
    }
    const name = `${interview.applications.first_name} ${interview.applications.last_name}`;
    const actor = { id: candidate.id, email: candidate.email };

    if (action === "confirm") {
      await supabase.from("interviews").update({ candidate_confirmed_at: new Date().toISOString() }).eq("id", id);
      await logAudit({ actor, action: "interview.candidate_confirm", entityType: "interview", entityId: id, request });
      return NextResponse.json({ success: true });
    }

    if (action === "reschedule") {
      const text = String(note || "").trim();
      if (!text) return NextResponse.json({ error: "Tell us which times work for you." }, { status: 400 });
      // One open request at a time keeps reschedules "within limits" (plan §10.2).
      if (interview.reschedule_request) {
        return NextResponse.json({ error: "You already asked to reschedule this interview. Our team will be in touch." }, { status: 409 });
      }
      await supabase
        .from("interviews")
        .update({ reschedule_request: text.slice(0, 1000), reschedule_requested_at: new Date().toISOString() })
        .eq("id", id);
      await logAudit({ actor, action: "interview.reschedule_request", entityType: "interview", entityId: id, after: { note: text }, request });
      await notifyUsers(
        { permission: "interview.schedule" },
        { title: `Reschedule requested: ${name}`, body: `${interview.round_name} · ${interview.applications.position}: ${text}`, link: `/admin/dashboard/interviews?focus=${id}` }
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (err) {
    console.error("Candidate interviews POST error:", err);
    return NextResponse.json({ error: err.message || "Failed to update interview." }, { status: 500 });
  }
}
