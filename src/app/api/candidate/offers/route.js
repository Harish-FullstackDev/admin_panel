import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { getCandidateFromRequest } from "@/lib/candidateAuth";
import { moveApplication, WorkflowError } from "@/lib/hcm/workflow";
import { queueEmail, notifyUsers, usersWithPermission } from "@/lib/hcm/notify";
import { logAudit } from "@/lib/hcm/audit";
import { expireOffers } from "@/lib/hcm/offers";
import { createJoiner } from "@/lib/hcm/onboarding";

const VISIBLE = ["Sent", "Accepted", "Declined", "Discussion requested", "Expired"];

export async function GET(request) {
  const candidate = await getCandidateFromRequest(request);
  if (!candidate) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    await expireOffers();
    const { data, error } = await createHcmAdminClient()
      .from("offers")
      .select("id, application_id, salary, currency, breakdown, joining_date, expires_at, letter_body, status, candidate_note, accepted_name, responded_at, sent_at, applications!inner(candidate_id, position, first_name, last_name)")
      .eq("applications.candidate_id", candidate.id)
      .in("status", VISIBLE)
      .order("sent_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({
      success: true,
      offers: data.map(({ applications, ...o }) => ({ ...o, position: applications.position })),
    });
  } catch (err) {
    console.error("Candidate offers GET error:", err);
    return NextResponse.json({ error: err.message || "Failed to load offers." }, { status: 500 });
  }
}

// POST { id, action: "accept" | "decline" | "discuss", name?, note? }
export async function POST(request) {
  const candidate = await getCandidateFromRequest(request);
  if (!candidate) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    await expireOffers();
    const { id, action, name, note } = await request.json();
    const supabase = createHcmAdminClient();
    const { data: offer } = await supabase
      .from("offers")
      .select("*, applications!inner(id, candidate_id, position, first_name, last_name, job_id, stage)")
      .eq("id", id)
      .maybeSingle();
    if (!offer || offer.applications.candidate_id !== candidate.id) {
      return NextResponse.json({ error: "Offer not found." }, { status: 404 });
    }
    if (offer.status !== "Sent") {
      return NextResponse.json({ error: `This offer is ${offer.status.toLowerCase()} and can no longer be answered.` }, { status: 400 });
    }

    const app = offer.applications;
    const fullName = `${app.first_name} ${app.last_name}`.trim();
    const text = String(note || "").trim();
    const actor = { id: candidate.id, email: candidate.email };
    const now = new Date().toISOString();
    let status;
    let update;

    if (action === "accept") {
      // E-signature placeholder: typed full name as acknowledgement.
      const typed = String(name || "").trim();
      if (!typed || typed.toLowerCase() !== fullName.toLowerCase()) {
        return NextResponse.json({ error: `Type your full name exactly as "${fullName}" to accept.` }, { status: 400 });
      }
      status = "Accepted";
      update = { status, accepted_name: typed, responded_at: now, candidate_note: text || null };
    } else if (action === "decline") {
      if (!text) return NextResponse.json({ error: "Please share a reason for declining." }, { status: 400 });
      status = "Declined";
      update = { status, responded_at: now, candidate_note: text };
    } else if (action === "discuss") {
      if (!text) return NextResponse.json({ error: "Tell us what you would like to discuss." }, { status: 400 });
      status = "Discussion requested";
      update = { status, responded_at: now, candidate_note: text };
    } else {
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }

    const { data: updated, error } = await supabase.from("offers").update(update).eq("id", id).eq("status", "Sent").select().maybeSingle();
    if (error) throw error;
    if (!updated) return NextResponse.json({ error: "This offer was just updated. Refresh the page." }, { status: 409 });

    if (action === "accept") {
      await moveApplication(app.id, "Hired", { actor, request, reason: "Offer accepted" });
      if (app.job_id) {
        const { data: job } = await supabase.from("jobs").select("id, openings, requisition_id").eq("id", app.job_id).maybeSingle();
        const { count } = await supabase.from("applications").select("id", { count: "exact", head: true }).eq("job_id", app.job_id).eq("stage", "Hired");
        if (job?.requisition_id && count >= job.openings) {
          await supabase.from("requisitions").update({ status: "Filled" }).eq("id", job.requisition_id).eq("status", "Posted");
        }
      }
      // HR can start onboarding by hand if this fails.
      await createJoiner(app.id, actor, request).catch((err) => console.error("createJoiner after accept failed:", err));
    }
    if (action === "decline") {
      await moveApplication(app.id, "Rejected", { actor, request, reason: `Offer declined: ${text}` });
    }

    await logAudit({ actor, action: `offer.candidate_${action}`, entityType: "offer", entityId: id, before: { status: "Sent" }, after: update, request });
    const verb = { accept: "accepted", decline: "declined", discuss: "wants to discuss" }[action];
    const hr = await usersWithPermission("offer.create");
    const recipients = [...hr.map((u) => u.id)];
    if (app.job_id) {
      const { data: job } = await supabase.from("jobs").select("hiring_manager_id").eq("id", app.job_id).maybeSingle();
      if (job?.hiring_manager_id) recipients.push(job.hiring_manager_id);
    }
    await notifyUsers(recipients, { title: `${fullName} ${verb} the offer`, body: `${app.position}${text ? `: ${text}` : ""}`, link: "/admin/dashboard/offers" });
    await queueEmail(
      "offer_responded",
      hr.map((u) => u.email),
      { candidate_name: fullName, response: verb, job_title: app.position, note: text || "—" },
      { entity: "application", id: app.id }
    );

    return NextResponse.json({ success: true, offer: { id, status } });
  } catch (err) {
    if (err instanceof WorkflowError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("Candidate offers POST error:", err);
    return NextResponse.json({ error: err.message || "Failed to respond to offer." }, { status: 500 });
  }
}
