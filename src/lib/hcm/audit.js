import { createHcmAdminClient } from "@/lib/candidateSupabase";

function clientIp(request) {
  if (!request) return null;
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    null
  );
}

// Never throws: an audit failure is logged but must not break the action.
export async function logAudit({ actor, action, entityType, entityId, before = null, after = null, request }) {
  try {
    const { error } = await createHcmAdminClient().from("audit_logs").insert({
      actor_id: actor?.id ?? null,
      actor_email: actor?.email ?? null,
      action,
      entity_type: entityType,
      entity_id: entityId ? String(entityId) : null,
      before,
      after,
      ip: clientIp(request),
    });
    if (error) console.error("logAudit insert failed:", error);
  } catch (err) {
    console.error("logAudit failed:", err);
  }
}
