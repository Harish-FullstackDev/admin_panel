import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { requirePermission, serverError } from "@/lib/hcm/auth";

const PAGE_SIZE = 50;

// GET ?entity_type=&action=&actor=&from=&to=&page=&format=csv
export async function GET(request) {
  const auth = await requirePermission(request, "audit.view");
  if (auth.error) return auth.error;
  try {
    const params = new URL(request.url).searchParams;
    const page = Math.max(1, Number(params.get("page")) || 1);
    const csv = params.get("format") === "csv";

    let query = createHcmAdminClient()
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });
    if (params.get("entity_type")) query = query.eq("entity_type", params.get("entity_type"));
    if (params.get("action")) query = query.ilike("action", `%${params.get("action")}%`);
    if (params.get("actor")) query = query.ilike("actor_email", `%${params.get("actor")}%`);
    if (params.get("from")) query = query.gte("created_at", params.get("from"));
    if (params.get("to")) query = query.lte("created_at", `${params.get("to")}T23:59:59`);
    query = csv ? query.limit(5000) : query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    if (csv) {
      const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const lines = [["time", "actor", "action", "entity_type", "entity_id", "ip", "before", "after"].join(",")];
      for (const r of data) {
        lines.push(
          [r.created_at, r.actor_email, r.action, r.entity_type, r.entity_id, r.ip, JSON.stringify(r.before), JSON.stringify(r.after)]
            .map(esc)
            .join(",")
        );
      }
      return new NextResponse(lines.join("\n"), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="audit-log-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({ success: true, logs: data, total: count || 0, page, pageSize: PAGE_SIZE });
  } catch (err) {
    return serverError("Audit GET", err);
  }
}
