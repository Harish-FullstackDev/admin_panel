import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { requirePermission, jsonError, serverError } from "@/lib/hcm/auth";
import { logAudit } from "@/lib/hcm/audit";
import { queueEmail, notifyUsers } from "@/lib/hcm/notify";
import { inviteInternalUser, InviteError } from "@/lib/hcm/users";
import { joinerReadiness, addDays, JOIN_STAGES } from "@/lib/hcm/onboarding";

// POST: Day 1. Creates the official account (role: employee), the employee
// record and the join event. Returns the one-time invite link to share.
export async function POST(request, { params }) {
  const auth = await requirePermission(request, "onboarding.manage");
  if (auth.error) return auth.error;
  const { id } = await params;

  try {
    const db = createHcmAdminClient();
    const { data: joiner } = await db.from("joiners").select("*").eq("id", id).maybeSingle();
    if (!joiner) return jsonError("Joiner not found.", 404);
    if (joiner.status === "Joined") return jsonError("This joiner has already been converted to an employee.", 409);
    if (joiner.status === "Cancelled") return jsonError("Onboarding was cancelled for this joiner.");

    const { data: docs } = await db.from("joiner_documents").select("required, status").eq("joiner_id", id);
    const readiness = joinerReadiness(joiner, docs || []);
    if (!readiness.ready) return jsonError(`Not ready to convert: ${readiness.blockers.join("; ")}.`);

    const body = await request.json();
    const stage = body.stage || joiner.join_stage;
    if (!JOIN_STAGES.includes(stage)) return jsonError("Invalid stage.");
    const joiningDate = body.joining_date || joiner.joining_date;
    let stageEnd = body.stage_end_date || null;
    if (stage === "Probation" && !stageEnd) stageEnd = addDays(joiningDate, 182);
    if (stage === "Intern" && !stageEnd) return jsonError("Internship end date is required.");
    if (stage === "Full-time") stageEnd = null;
    if (stageEnd && stageEnd <= joiningDate) return jsonError("Stage end date must be after the joining date.");

    const designation = String(body.designation || joiner.position || "").trim();
    const departmentId = body.department_id ?? joiner.department_id;

    const { userId, inviteLink } = await inviteInternalUser({
      fullName: joiner.full_name,
      email: body.official_email,
      roles: ["employee"],
      departmentId,
      designation,
      actor: auth.user,
    });

    const employee = {
      id: userId,
      candidate_id: joiner.candidate_id,
      application_id: joiner.application_id,
      joiner_id: joiner.id,
      full_name: joiner.full_name,
      official_email: String(body.official_email).trim().toLowerCase(),
      personal_email: joiner.personal_email,
      phone: joiner.phone,
      designation,
      department_id: departmentId,
      location_id: body.location_id ?? joiner.location_id,
      grade_id: body.grade_id ?? joiner.grade_id,
      manager_id: body.manager_id ?? joiner.manager_id,
      employment_type: joiner.employment_type,
      stage,
      stage_end_date: stageEnd,
      joining_date: joiningDate,
    };
    const { data: created, error } = await db.from("employees").insert(employee).select().single();
    if (error) throw error;

    await db.from("employee_events").insert({
      employee_id: userId,
      type: "join",
      effective_date: joiningDate,
      after: { stage, designation, department_id: departmentId, manager_id: employee.manager_id, stage_end_date: stageEnd },
      actor_id: auth.user.id,
    });
    await db.from("joiners").update({ status: "Joined", employee_id: userId, joining_date: joiningDate }).eq("id", id);

    await logAudit({
      actor: auth.user,
      action: "onboarding.convert",
      entityType: "joiner",
      entityId: id,
      after: { employee_id: userId, employee_code: created.employee_code, official_email: employee.official_email, stage },
      request,
    });
    await logAudit({ actor: auth.user, action: "employee.create", entityType: "employee", entityId: userId, after: created, request });

    await queueEmail(
      "employee_account_created",
      joiner.personal_email,
      { name: joiner.full_name, employee_code: created.employee_code, official_email: employee.official_email, invite_link: inviteLink },
      { entity: "employee", id: userId }
    );
    if (employee.manager_id) {
      await notifyUsers([employee.manager_id], {
        title: `${joiner.full_name} has joined your team`,
        body: `${designation} · ${created.employee_code}`,
        link: `/admin/dashboard/employees/${userId}`,
      });
    }

    return NextResponse.json({ success: true, employee: created, inviteLink }, { status: 201 });
  } catch (err) {
    if (err instanceof InviteError) return jsonError(err.message, err.status);
    return serverError("Joiner convert", err);
  }
}
