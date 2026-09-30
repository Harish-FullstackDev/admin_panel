import { NextResponse } from "next/server";
import { createCandidateAdminClient, CANDIDATE_RESUME_BUCKET } from "@/lib/candidateSupabase";
import { getCandidateFromRequest } from "@/lib/candidateAuth";

// GET: short-lived signed URL for the candidate's saved profile resume.
export async function GET(request) {
  const candidate = await getCandidateFromRequest(request);
  if (!candidate) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const supabase = createCandidateAdminClient();
    const { data: profile } = await supabase
      .from("candidate_profiles")
      .select("resume_path")
      .eq("id", candidate.id)
      .maybeSingle();
    if (!profile?.resume_path) {
      return NextResponse.json({ error: "No resume uploaded." }, { status: 404 });
    }

    const { data, error } = await supabase.storage
      .from(CANDIDATE_RESUME_BUCKET)
      .createSignedUrl(profile.resume_path, 60 * 10);
    if (error) throw error;

    return NextResponse.json({ success: true, url: data.signedUrl });
  } catch (err) {
    console.error("Candidate resume GET error:", err);
    return NextResponse.json({ error: err.message || "Failed to load resume." }, { status: 500 });
  }
}
