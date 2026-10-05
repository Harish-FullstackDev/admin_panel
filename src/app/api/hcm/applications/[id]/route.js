import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { getInternalUser, hasPermission, jsonError, serverError } from "@/lib/hcm/auth";
import { logAudit } from "@/lib/hcm/audit";
import { moveApplication, WorkflowError, canMoveApplication } from "@/lib/hcm/workflow";
import { applicationAccess, stripSalary, signedResumeUrl, afterStageChange } from "@/lib/hcm/recruitment";

async function namesById(supabase, ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return {};
  const { data } = await supabase.from("internal_users").select("id, full_name").in("id", unique);
  return Object.fromEntries((data || []).map((u) => [u.id, u.full_name]));
}

export async function GET(request, { params }) {
  const user = await getInternalUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;

  try {
    const supabase = createHcmAdminClient();
    const { data: app } = await supabase.from("applications").select("*").eq("id", id).maybeSingle();
    if (!app) return jsonError("Application not found.", 404);
    const access = await applicationAccess(user, app);
    if (!access) return jsonError("Application not found.", 404);

    const [job, events, notes, interviews, offers, emails] = await Promise.all([
      app.job_id
        ? supabase.from("jobs").select("id, title, slug, interview_rounds, salary_min, salary_max, currency, hiring_manager_id").eq("id", app.job_id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from("application_events").select("*").eq("application_id", id).order("created_at"),
      access === "full" ? supabase.from("application_notes").select("*").eq("application_id", id).order("created_at") : Promise.resolve({ data: [] }),
      supabase.from("interviews").select("*, interview_panel(interviewer_id)").eq("application_id", id).order("round"),
      access === "full" && hasPermission(user, "offer.view_salary")
        ? supabase.from("offers").select("*").eq("application_id", id).order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
      access === "full"
        ? supabase.from("email_outbox").select("id, template_code, subject, status, created_at").eq("related_id", id).order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
    ]);

    const interviewIds = (interviews.data || []).map((i) => i.id);
    let scorecards = [];
    if (interviewIds.length) {
      const { data } = await supabase.from("scorecards").select("*").in("interview_id", interviewIds);
      scorecards = data || [];
    }
    // Blind review: without scorecard.view_all, others' submitted scorecards stay
    // hidden until this user has submitted their own for that interview.
    const viewAll = hasPermission(user, "scorecard.view_all") && access === "full";
    const visible = scorecards.filter((s) => {
      if (s.interviewer_id === user.id) return true;
      if (!s.submitted_at) return false;
      if (viewAll) return true;
      return scorecards.some((own) => own.interview_id === s.interview_id && own.interviewer_id === user.id && own.submitted_at);
    });

    const names = await namesById(supabase, [
      ...(events.data || []).map((e) => e.actor_id),
      ...(notes.data || []).map((n) => n.author_id),
      ...(interviews.data || []).flatMap((i) => i.interview_panel.map((p) => p.interviewer_id)),
      ...visible.map((s) => s.interviewer_id),
    ]);

    const detail = { ...stripSalary(user, app) };
    if (access === "interviewer") {
      delete detail.current_salary;
      delete detail.expected_salary;
      delete detail.ref_name;
      delete detail.ref_email;
      delete detail.ref_phone;
      delete detail.ref_relationship;
    }

    return NextResponse.json({
      success: true,
      access,
      application: { ...detail, resume_signed_url: await signedResumeUrl(app.resume_path) },
      job: job.data,
      events: (events.data || []).map((e) => ({ ...e, actor_name: names[e.actor_id] || (e.actor_id === app.candidate_id ? "Candidate" : null) })),
      notes: (notes.data || []).map((n) => ({ ...n, author_name: names[n.author_id] || null })),
      interviews: (interviews.data || []).map((i) => ({
        ...i,
        panel: i.interview_panel.map((p) => ({ id: p.interviewer_id, name: names[p.interviewer_id] || "—" })),
        scorecards: visible.filter((s) => s.interview_id === i.id).map((s) => ({ ...s, interviewer_name: names[s.interviewer_id] || "—" })),
      })),
      offers: offers.data || [],
      emails: emails.data || [],
    });
  } catch (err) {
    return serverError("Application GET", err);
  }
}

// POST { action: "move", to, reason } | { action: "note", body } | { action: "interest", value } | { action: "tags", tags }
export async function POST(request, { params }) {
  const user = await getInternalUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;

  try {
    const body = await request.json();
    const supabase = createHcmAdminClient();
    const { data: app } = await supabase.from("applications").select("*").eq("id", id).maybeSingle();
    if (!app) return jsonError("Application not found.", 404);
    if ((await applicationAccess(user, app)) !== "full") return jsonError("Application not found.", 404);

    if (body.action === "move") {
      const to = body.to;
      const hrMove = hasPermission(user, "application.move");
      // Hiring managers make the final decision after interviews (plan §9).
      const decisionMove = hasPermission(user, "application.decide") && app.stage === "Interview" && ["Selected", "Rejected"].includes(to);
      if (!hrMove && !decisionMove) return jsonError("You do not have permission to do this.", 403);
      if (to === "Offer" || to === "Hired") return jsonError("Offer and Hired stages are set by the offer workflow.");
      if (to === "Interview" && app.stage !== "Interview") return jsonError("Schedule an interview to move a candidate to Interview.");
      if (!canMoveApplication(app.stage, to)) return jsonError(`Cannot move an application from ${app.stage} to ${to}.`);

      const { after } = await moveApplication(id, to, { actor: user, reason: body.reason, request });
      const { data: job } = app.job_id ? await supabase.from("jobs").select("title").eq("id", app.job_id).maybeSingle() : { data: null };
      await afterStageChange(after, to, { job });
      return NextResponse.json({ success: true, application: stripSalary(user, after) });
    }

    if (body.action === "note") {
      const text = String(body.body || "").trim();
      if (!text) return jsonError("Note cannot be empty.");
      const { data, error } = await supabase
        .from("application_notes")
        .insert({ application_id: id, author_id: user.id, body: text })
        .select()
        .single();
      if (error) throw error;
      await logAudit({ actor: user, action: "application.note", entityType: "application", entityId: id, after: { note_id: data.id }, request });
      return NextResponse.json({ success: true, note: { ...data, author_name: user.fullName } });
    }

    if (body.action === "interest") {
      if (!hasPermission(user, "application.decide")) return jsonError("You do not have permission to do this.", 403);
      const value = body.value === null ? null : ["Interested", "Not interested"].includes(body.value) ? body.value : undefined;
      if (value === undefined) return jsonError("Invalid value.");
      const { error } = await supabase.from("applications").update({ manager_interest: value }).eq("id", id);
      if (error) throw error;
      await logAudit({ actor: user, action: "application.interest", entityType: "application", entityId: id, before: { manager_interest: app.manager_interest }, after: { manager_interest: value }, request });
      return NextResponse.json({ success: true });
    }

    if (body.action === "tags") {
      if (!hasPermission(user, "application.move")) return jsonError("You do not have permission to do this.", 403);
      const tags = [...new Set((body.tags || []).map((t) => String(t).trim()).filter(Boolean))].slice(0, 20);
      const { error } = await supabase.from("applications").update({ tags }).eq("id", id);
      if (error) throw error;
      return NextResponse.json({ success: true, tags });
    }

    return jsonError("Unknown action.");
  } catch (err) {
    if (err instanceof WorkflowError) return jsonError(err.message, err.status);
    return serverError("Application action", err);
  }
}
