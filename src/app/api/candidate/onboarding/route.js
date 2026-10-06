import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { getCandidateFromRequest } from "@/lib/candidateAuth";

// GET: the candidate's pre-joining record (documents + Day-1 details).
// `joiner` is null when there is no onboarding in progress.
export async function GET(request) {
  const candidate = await getCandidateFromRequest(request);
  if (!candidate) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const db = createHcmAdminClient();
    const { data: joiner } = await db
      .from("joiners")
      .select(
        "id, position, joining_date, reporting_time, reporting_location, day1_notes, status, employment_type, join_stage, locations(name), manager:internal_users!joiners_manager_id_fkey(full_name), buddy:internal_users!joiners_buddy_id_fkey(full_name)"
      )
      .eq("candidate_id", candidate.id)
      .neq("status", "Cancelled")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!joiner) return NextResponse.json({ success: true, joiner: null, documents: [] });

    const { data: documents } = await db
      .from("joiner_documents")
      .select("id, type_code, name, required, status, file_name, rejection_reason, uploaded_at, document_types(description, sort)")
      .eq("joiner_id", joiner.id);
    const sorted = (documents || []).sort((a, b) => (a.document_types?.sort ?? 999) - (b.document_types?.sort ?? 999));
    return NextResponse.json({ success: true, joiner, documents: sorted });
  } catch (err) {
    console.error("Candidate onboarding GET error:", err);
    return NextResponse.json({ error: err.message || "Failed to load joining details." }, { status: 500 });
  }
}
