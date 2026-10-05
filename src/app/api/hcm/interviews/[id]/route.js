import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { requirePermission, jsonError, serverError } from "@/lib/hcm/auth";
import { logAudit } from "@/lib/hcm/audit";
import { interviewFields, sendInterviewEmails } from "@/lib/hcm/interviews";

// PATCH { action: "reschedule", scheduled_at, ...fields, panel? } | { action: "cancel", reason } | { action: "complete" }
export async function PATCH(request, { params }) {
  const auth = await requirePermission(request, "interview.schedule");
  if (auth.error) return auth.error;
  const { id } = await params;

  try {
    const body = await request.json();
    const supabase = createHcmAdminClient();
    const { data: interview } = await supabase.from("interviews").select("*, interview_panel(interviewer_id)").eq("id", id).maybeSingle();
    if (!interview) return jsonError("Interview not found.", 404);
    if (interview.status !== "Scheduled") return jsonError(`This interview is already ${interview.status.toLowerCase()}.`);

    const { data: app } = await supabase.from("applications").select("*").eq("id", interview.application_id).single();
    const { data: job } = app.job_id ? await supabase.from("jobs").select("title").eq("id", app.job_id).maybeSingle() : { data: null };
    let panelIds = interview.interview_panel.map((p) => p.interviewer_id);

    if (body.action === "reschedule") {
      const fields = interviewFields(body, { partial: true });
      if (fields.error) return jsonError(fields.error);
      const updates = { ...fields.value, reschedule_request: null, reschedule_requested_at: null, candidate_confirmed_at: null };
      const { data: updated, error } = await supabase.from("interviews").update(updates).eq("id", id).select().single();
      if (error) throw error;

      if (Array.isArray(body.panel)) {
        const next = [...new Set(body.panel.filter(Boolean))];
        if (!next.length) return jsonError("Add at least one interviewer to the panel.");
        await supabase.from("interview_panel").delete().eq("interview_id", id).not("interviewer_id", "in", `(${next.join(",")})`);
        await supabase.from("interview_panel").upsert(next.map((interviewer_id) => ({ interview_id: id, interviewer_id })), { onConflict: "interview_id,interviewer_id" });
        panelIds = [...new Set([...panelIds, ...next])];
      }
      const { data: panelUsers } = await supabase.from("internal_users").select("id, full_name, email").in("id", panelIds);
      await logAudit({ actor: auth.user, action: "interview.reschedule", entityType: "interview", entityId: id, before: interview, after: updated, request });
      await sendInterviewEmails("interview_rescheduled", updated, app, panelUsers, job);
      return NextResponse.json({ success: true, interview: updated });
    }

    if (body.action === "cancel") {
      const reason = String(body.reason || "").trim();
      if (!reason) return jsonError("A reason is required to cancel.");
      const { data: updated, error } = await supabase
        .from("interviews")
        .update({ status: "Cancelled", instructions: [interview.instructions, `Cancelled: ${reason}`].filter(Boolean).join("\n") })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      const { data: panelUsers } = await supabase.from("internal_users").select("id, full_name, email").in("id", panelIds);
      await logAudit({ actor: auth.user, action: "interview.cancel", entityType: "interview", entityId: id, before: { status: interview.status }, after: { status: "Cancelled", reason }, request });
      await sendInterviewEmails("interview_cancelled", updated, app, panelUsers, job);
      return NextResponse.json({ success: true, interview: updated });
    }

    if (body.action === "complete") {
      const { data: updated, error } = await supabase.from("interviews").update({ status: "Completed" }).eq("id", id).select().single();
      if (error) throw error;
      await logAudit({ actor: auth.user, action: "interview.complete", entityType: "interview", entityId: id, before: { status: interview.status }, after: { status: "Completed" }, request });
      return NextResponse.json({ success: true, interview: updated });
    }

    return jsonError("Unknown action.");
  } catch (err) {
    return serverError("Interview PATCH", err);
  }
}
