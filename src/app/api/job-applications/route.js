import { NextResponse } from "next/server";
import { createCandidateAdminClient, CANDIDATE_RESUME_BUCKET } from "@/lib/candidateSupabase";
import { isAdminRequest } from "@/lib/adminAuth";

const SIGNED_URL_TTL_SECONDS = 60 * 60;
const VALID_STATUSES = ["New", "Reviewed", "Shortlisted", "Interviewing", "Rejected", "Hired"];

// Admin-only. Candidates submit through /api/candidate/applications.
export async function GET(request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    const supabase = createCandidateAdminClient();

    let query = supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter) query = query.eq("status", statusFilter);

    const { data: applications, error } = await query;
    if (error) throw error;

    const withSignedResumes = await Promise.all(
      (applications || []).map(async (application) => {
        let resumeSignedUrl = null;
        if (application.resume_path) {
          const { data: signedData } = await supabase.storage
            .from(CANDIDATE_RESUME_BUCKET)
            .createSignedUrl(application.resume_path, SIGNED_URL_TTL_SECONDS);
          resumeSignedUrl = signedData?.signedUrl || null;
        }
        return { ...application, resume_signed_url: resumeSignedUrl };
      })
    );

    return NextResponse.json({ success: true, applications: withSignedResumes });
  } catch (err) {
    console.error("GET Job Applications API Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to retrieve applications." },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id, status } = await request.json();

    if (!id || !status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Application ID and a valid status (${VALID_STATUSES.join(", ")}) are required.` },
        { status: 400 }
      );
    }

    const { data: updated, error } = await createCandidateAdminClient()
      .from("applications")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, application: updated });
  } catch (err) {
    console.error("Job Applications PATCH API Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update application status." },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Application ID is required for deletion." }, { status: 400 });
    }

    const supabase = createCandidateAdminClient();

    const { data: existing } = await supabase
      .from("applications")
      .select("resume_path, candidate_id")
      .eq("id", id)
      .single();

    const { error: deleteError } = await supabase.from("applications").delete().eq("id", id);
    if (deleteError) throw deleteError;

    // Keep the file if it is also the candidate's saved profile resume.
    if (existing?.resume_path) {
      let inUse = false;
      if (existing.candidate_id) {
        const { data: profile } = await supabase
          .from("candidate_profiles")
          .select("resume_path")
          .eq("id", existing.candidate_id)
          .maybeSingle();
        inUse = profile?.resume_path === existing.resume_path;
      }
      if (!inUse) {
        await supabase.storage.from(CANDIDATE_RESUME_BUCKET).remove([existing.resume_path]);
      }
    }

    return NextResponse.json({ success: true, message: "Application successfully deleted." });
  } catch (err) {
    console.error("Job Applications DELETE API Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete application." },
      { status: 500 }
    );
  }
}
