import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { getInternalUser, hasPermission, serverError } from "@/lib/hcm/auth";
import { managedJobIds } from "@/lib/hcm/recruitment";
import { remindDueReviews, weekStart } from "@/lib/hcm/stage";
import { balanceSummary, todayIso, isWeekend, holidayMap } from "@/lib/hcm/leave";

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

    if (hasPermission(user, "onboarding.manage")) {
      const weekEnd = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10);
      const today = now.toISOString().slice(0, 10);
      const [joinersThisWeek, docsAwaiting, bgvPending, readyToConvert, { data: upcomingJoiners }] = await Promise.all([
        count(db.from("joiners").select("id", head).in("status", ["Pre-joining", "Ready"]).gte("joining_date", today).lte("joining_date", weekEnd)),
        count(db.from("joiner_documents").select("id, joiners!inner(status)", head).eq("status", "Uploaded").in("joiners.status", ["Pre-joining", "Ready"])),
        count(db.from("joiners").select("id", head).in("status", ["Pre-joining", "Ready"]).in("bgv_status", ["Not started", "In progress"])),
        count(db.from("joiners").select("id", head).eq("status", "Ready")),
        db.from("joiners").select("id, full_name, position, joining_date, status").in("status", ["Pre-joining", "Ready"]).order("joining_date").limit(6),
      ]);
      out.onboarding = { joinersThisWeek, docsAwaiting, bgvPending, readyToConvert, upcoming: upcomingJoiners || [] };
    }

    if (hasPermission(user, "probation.manage") || hasPermission(user, "probation.review")) {
      await remindDueReviews();
      const all = hasPermission(user, "probation.manage") || user.permissions["probation.review"] === "all";
      const { data: open } = await db
        .from("stage_records")
        .select("id, type, status, end_date, mid_review_date, final_review_date, mentor_id, recommendation, employees!inner(id, full_name, manager_id), stage_reviews(type, submitted_at)")
        .in("status", ["Active", "Pending approval"])
        .order("end_date");
      const mine = (open || []).filter((r) => all || r.mentor_id === user.id || r.employees.manager_id === user.id);
      const horizon = new Date(now.getTime() + 15 * 86400000).toISOString().slice(0, 10);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
      const reviewsDue = mine.filter((r) => {
        const done = new Set((r.stage_reviews || []).filter((x) => x.submitted_at).map((x) => x.type));
        return (!done.has("mid") && r.mid_review_date && r.mid_review_date <= horizon) || (!done.has("final") && r.final_review_date && r.final_review_date <= horizon);
      });
      out.probation = {
        open: mine.length,
        interns: mine.filter((r) => r.type === "Intern").length,
        reviewsDue: reviewsDue.length,
        pendingApproval: mine.filter((r) => r.status === "Pending approval").length,
        awaitingDecision: mine.filter((r) => r.status === "Active" && r.recommendation).length,
        canDecide: hasPermission(user, "probation.manage"),
        endingThisMonth: mine.filter((r) => r.end_date <= monthEnd).length,
        upcoming: mine.slice(0, 6).map((r) => ({ id: r.id, type: r.type, status: r.status, end_date: r.end_date, full_name: r.employees.full_name })),
      };
    }

    const [myTasks, { data: me }] = await Promise.all([
      count(db.from("tasks").select("id", head).eq("assignee_id", user.id).eq("status", "Open")),
      db.from("employees")
        .select("id, employee_code, designation, stage, stage_end_date, joining_date, departments(name), locations(name), manager:internal_users!employees_manager_id_fkey(full_name, email)")
        .eq("id", user.id)
        .maybeSingle(),
    ]);
    out.myTasks = myTasks;
    out.me = me || null;

    if (hasPermission(user, "leave.approve") || hasPermission(user, "leave.manage") || hasPermission(user, "attendance.view")) {
      const hrLeave = hasPermission(user, "leave.manage");
      const allScope = hrLeave || user.permissions["leave.approve"] === "all" || user.permissions["attendance.view"] === "all";
      const today = todayIso();
      let teamIds = null;
      if (!allScope) {
        const { data: team } = await db.from("employees").select("id").eq("manager_id", user.id);
        teamIds = (team || []).map((e) => e.id);
      }
      const none = ["00000000-0000-0000-0000-000000000000"];
      const scope = (q) => (teamIds ? q.in("employee_id", teamIds.length ? teamIds : none) : q);
      const [{ data: pendingLeave }, { data: offToday }, { count: correctionsPending }] = await Promise.all([
        scope(db.from("leave_requests").select("id, status, manager_id, employee_id")).in("status", ["Pending manager", "Pending HR"]),
        scope(db.from("leave_requests").select("id, start_date, end_date, leave_type, employees!inner(full_name)"))
          .eq("status", "Approved").lte("start_date", today).gte("end_date", today),
        scope(db.from("attendance_corrections").select("id", head)).eq("status", "Pending").neq("employee_id", user.id),
      ]);
      const mine = (pendingLeave || []).filter(
        (r) => r.employee_id !== user.id && ((r.status === "Pending manager" && r.manager_id === user.id) || (r.status === "Pending HR" && hrLeave))
      );
      out.teamLeave = {
        awaitingMe: mine.length,
        offToday: (offToday || []).map((r) => ({ id: r.id, full_name: r.employees.full_name, leave_type: r.leave_type, end_date: r.end_date })),
        correctionsPending: correctionsPending || 0,
      };
    }

    if (me) {
      const { data: emp } = await db.from("employees").select("id, stage, joining_date, location_id, status, locations(timezone)").eq("id", user.id).single();
      const tz = emp.locations?.timezone || "Asia/Kolkata";
      const today = todayIso(tz);
      const [balances, { data: punchToday }, holidays] = await Promise.all([
        balanceSummary(emp, Number(today.slice(0, 4))),
        db.from("attendance").select("check_in, check_out").eq("employee_id", user.id).eq("work_date", today).maybeSingle(),
        holidayMap(today, today, emp.location_id),
      ]);
      out.myLeave = { balances: balances.filter((b) => !b.unlimited) };
      out.myAttendance = { today, record: punchToday || null, offDay: Boolean(holidays[today]) || isWeekend(today), holiday: holidays[today] || null };
    }
    if (me) {
      const { data: stage } = await db
        .from("stage_records")
        .select("id, type, status, start_date, end_date, mid_review_date, final_review_date, mentor:internal_users!stage_records_mentor_id_fkey(full_name), stage_updates(week_start), stage_reviews(type, submitted_at)")
        .eq("employee_id", user.id)
        .in("status", ["Active", "Pending approval"])
        .maybeSingle();
      if (stage) {
        const { stage_updates: updates, stage_reviews: reviews, ...rest } = stage;
        out.myStage = {
          ...rest,
          updatedThisWeek: (updates || []).some((u) => u.week_start === weekStart()),
          selfSubmitted: (reviews || []).some((r) => r.type === "self" && r.submitted_at),
        };
      }
    }

    return NextResponse.json({ success: true, ...out });
  } catch (err) {
    return serverError("Dashboard GET", err);
  }
}
