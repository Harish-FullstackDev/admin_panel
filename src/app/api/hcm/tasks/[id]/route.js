import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { getInternalUser, hasPermission, jsonError, serverError } from "@/lib/hcm/auth";
import { logAudit } from "@/lib/hcm/audit";
import { announceTask, TASK_TEAMS } from "@/lib/hcm/onboarding";

const STATUSES = ["Open", "Done", "Skipped"];

// PATCH { status } by the assignee or HR; { assignee_id, due_date, title, team } by HR only.
export async function PATCH(request, { params }) {
  const user = await getInternalUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;

  try {
    const db = createHcmAdminClient();
    const { data: task } = await db.from("tasks").select("*").eq("id", id).maybeSingle();
    if (!task) return jsonError("Task not found.", 404);

    const manager = hasPermission(user, "onboarding.manage");
    if (!manager && task.assignee_id !== user.id) return jsonError("You do not have permission to do this.", 403);

    const body = await request.json();
    const update = {};
    if ("status" in body) {
      if (!STATUSES.includes(body.status)) return jsonError("Invalid status.");
      update.status = body.status;
      update.completed_by = body.status === "Open" ? null : user.id;
      update.completed_at = body.status === "Open" ? null : new Date().toISOString();
    }
    const managerFields = ["assignee_id", "due_date", "title", "team", "description"].filter((k) => k in body);
    if (managerFields.length) {
      if (!manager) return jsonError("Only HR can reassign or edit tasks.", 403);
      if ("title" in body && !String(body.title || "").trim()) return jsonError("Task title is required.");
      if ("team" in body && !TASK_TEAMS.includes(body.team)) return jsonError("Invalid team.");
      for (const key of managerFields) update[key] = typeof body[key] === "string" ? body[key].trim() || null : body[key] ?? null;
    }
    if (!Object.keys(update).length) return jsonError("Nothing to update.");

    if (task.context_type === "onboarding") {
      const { data: joiner } = await db.from("joiners").select("status").eq("id", task.context_id).maybeSingle();
      if (joiner?.status === "Cancelled") return jsonError("Onboarding was cancelled for this joiner.");
    }

    const { data: updated, error } = await db.from("tasks").update(update).eq("id", id).select().single();
    if (error) throw error;

    await logAudit({
      actor: user,
      action: "status" in body ? "task.status" : "task.update",
      entityType: task.context_type === "onboarding" ? "joiner" : "task",
      entityId: task.context_type === "onboarding" ? task.context_id : id,
      before: Object.fromEntries(Object.keys(update).map((k) => [k, task[k] ?? null])),
      after: { task_id: id, title: updated.title, ...update },
      request,
    });

    if (update.assignee_id && update.assignee_id !== task.assignee_id && task.context_type === "onboarding") {
      const { data: joiner } = await db.from("joiners").select("*").eq("id", task.context_id).maybeSingle();
      if (joiner) await announceTask(updated, joiner);
    }
    return NextResponse.json({ success: true, task: updated });
  } catch (err) {
    return serverError("Task PATCH", err);
  }
}
