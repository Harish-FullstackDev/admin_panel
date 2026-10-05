import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { getInternalUser, hasPermission, serverError } from "@/lib/hcm/auth";
import { managedJobIds } from "@/lib/hcm/recruitment";

const count = async (query) => {
  const { count: n } = await query;
  return n || 0;
};

// GET: numbers for the dashboard cards the user is allowed to see.
export async function GET(request) {
  const user = await getInternalUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const db = createHcmAdminClient();
    const head = { count: "exact", head: true };
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
    const out = {};

    if (hasPermission(user, "user.manage")) {
      const { data: users } = await db.from("internal_users").select("status, user_roles(role_code)");
      out.admin = {
        byStatus: (users || []).reduce((acc, u) => ({ ...acc, [u.status]: (acc[u.status] || 0) + 1 }), {}),
        byRole: (users || []).flatMap((u) => u.status === "Active" ? u.user_roles : []).reduce((acc, r) => ({ ...acc, [r.role_code]: (acc[r.role_code] || 0) + 1 }), {}),
        pendingInvites: (users || []).filter((u) => u.status === "Invited").length,
      };
      const { data: recent } = await db
        .from("audit_logs")
        .select("id, action, actor_email, entity_type, entity_id, created_at")
        .or("action.like.role.%,action.like.user.%")
        .order("created_at", { ascending: false })
        .limit(8);
      out.admin.recentAccessChanges = recent || [];
    }

    const perms = Object.keys(user.permissions);
    out.pendingApprovals = await count(
      db.from("approvals").select("id", head).eq("status", "Pending").in("approver_permission", perms.length ? perms : ["__none__"])
    );

    if (hasPermission(user, "application.move") || hasPermission(user, "dashboard.org")) {
      const [openJobs, newToday, interviewsToday, offersPending, approvedReqs, stages] = await Promise.all([
        count(db.from("jobs").select("id", head).eq("status", "Open").eq("archived", false)),
        count(db.from("applications").select("id", head).gte("created_at", startOfDay)),
        count(db.from("interviews").select("id", head).eq("status", "Scheduled").gte("scheduled_at", startOfDay).lt("scheduled_at", endOfDay)),
        count(db.from("offers").select("id", head).in("status", ["Sent", "Discussion requested"])),
        count(db.from("requisitions").select("id", head).eq("status", "Approved")),
        db.from("applications").select("stage"),
      ]);
      const funnel = {};
      for (const a of stages.data || []) funnel[a.stage] = (funnel[a.stage] || 0) + 1;
      const { data: hires } = await db.from("application_events").select("application_id, created_at").eq("to_stage", "Hired");
      let avgTimeToHire = null;
      if (hires?.length) {
        const { data: apps } = await db.from("applications").select("id, created_at").in("id", hires.map((h) => h.application_id));
        const created = Object.fromEntries((apps || []).map((a) => [a.id, a.created_at]));
        const days = hires.map((h) => (new Date(h.created_at) - new Date(created[h.application_id])) / 86400000).filter((d) => d >= 0);
        if (days.length) avgTimeToHire = Math.round(days.reduce((a, b) => a + b, 0) / days.length);
      }
      const { data: offerOutcomes } = await db.from("offers").select("status").in("status", ["Accepted", "Declined", "Expired"]);
      const decided = offerOutcomes?.length || 0;
      out.recruitment = {
        openJobs,
        newToday,
        interviewsToday,
        offersPending,
        approvedRequisitionsToPost: approvedReqs,
        funnel,
        avgTimeToHire,
        offerAcceptanceRate: decided ? Math.round((offerOutcomes.filter((o) => o.status === "Accepted").length / decided) * 100) : null,
      };
    }

    if (user.permissions["requisition.create"] === "own" || user.permissions["application.decide"] === "own") {
      const jobIds = await managedJobIds(user.id);
      const { data: reqs } = await db.from("requisitions").select("status").eq("raised_by", user.id);
      out.manager = {
        requisitions: (reqs || []).reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1 }), {}),
        openings: jobIds.length,
        awaitingReview: jobIds.length
          ? await count(db.from("applications").select("id", head).in("job_id", jobIds).eq("stage", "Shortlisted").is("manager_interest", null))
          : 0,
        awaitingDecision: jobIds.length
          ? await count(db.from("applications").select("id", head).in("job_id", jobIds).eq("stage", "Interview"))
          : 0,
      };
    }

    if (user.permissions["interview.view"]) {
      const { data: panel } = await db.from("interview_panel").select("interview_id").eq("interviewer_id", user.id);
      const ids = (panel || []).map((p) => p.interview_id);
      const weekAhead = new Date(now.getTime() + 7 * 86400000).toISOString();
      let upcoming = [];
      let feedbackDue = 0;
      if (ids.length) {
        const [{ data: iv }, { data: cards }] = await Promise.all([
          db
            .from("interviews")
            .select("id, round_name, scheduled_at, mode, applications(first_name, last_name, position)")
            .in("id", ids)
            .eq("status", "Scheduled")
            .gte("scheduled_at", now.toISOString())
            .lte("scheduled_at", weekAhead)
            .order("scheduled_at"),
          db.from("scorecards").select("interview_id, submitted_at").eq("interviewer_id", user.id),
        ]);
        upcoming = iv || [];
        const submitted = new Set((cards || []).filter((c) => c.submitted_at).map((c) => c.interview_id));
        const { data: past } = await db.from("interviews").select("id").in("id", ids).neq("status", "Cancelled").lt("scheduled_at", now.toISOString());
        feedbackDue = (past || []).filter((p) => !submitted.has(p.id)).length;
      }
      out.interviewer = { upcoming, feedbackDue };
    }

    return NextResponse.json({ success: true, ...out });
  } catch (err) {
    return serverError("Dashboard GET", err);
  }
}
