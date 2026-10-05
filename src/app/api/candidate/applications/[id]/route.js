import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { getCandidateFromRequest } from "@/lib/candidateAuth";
import { moveApplication, cancelPendingApprovals, WorkflowError } from "@/lib/hcm/workflow";
import { notifyUsers } from "@/lib/hcm/notify";

// POST { action: "withdraw", reason }
export async function POST(request, { params }) {
  const candidate = await getCandidateFromRequest(request);
  if (!candidate) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;

  try {
    const { action, reason } = await request.json();
    if (action !== "withdraw") return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    const supabase = createHcmAdminClient();
    const { data: app } = await supabase
      .from("applications")
      .select("id, candidate_id, stage, position, first_name, last_name")
      .eq("id", id)
      .maybeSingle();
    if (!app || app.candidate_id !== candidate.id) return NextResponse.json({ error: "Application not found." }, { status: 404 });

    const { after } = await moveApplication(id, "Withdrawn", {
      actor: { id: candidate.id, email: candidate.email },
      reason: String(reason || "").trim() || undefined,
      request,
    });

    const now = new Date().toISOString();
    const { data: interviews } = await supabase
      .from("interviews")
      .select("id")
      .eq("application_id", id)
      .eq("status", "Scheduled")
      .gte("scheduled_at", now);
    if (interviews?.length) {
      await supabase.from("interviews").update({ status: "Cancelled" }).in("id", interviews.map((i) => i.id));
    }
    const { data: offers } = await supabase
      .from("offers")
      .select("id")
      .eq("application_id", id)
      .in("status", ["Draft", "Pending approval", "Approved", "Sent", "Discussion requested"]);
    for (const o of offers || []) {
      await cancelPendingApprovals("offer", o.id);
      await supabase.from("offers").update({ status: "Withdrawn" }).eq("id", o.id);
    }

    await notifyUsers(
      { permission: "application.move" },
      { title: `Application withdrawn: ${app.first_name} ${app.last_name}`, body: app.position, link: `/admin/dashboard/careers/applications?open=${id}` }
    );
    return NextResponse.json({ success: true, application: { id: after.id, stage: after.stage } });
  } catch (err) {
    if (err instanceof WorkflowError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("Candidate withdraw error:", err);
    return NextResponse.json({ error: err.message || "Failed to withdraw." }, { status: 500 });
  }
}
