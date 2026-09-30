import { NextResponse } from "next/server";
import { createCandidateAdminClient, CANDIDATE_RESUME_BUCKET } from "@/lib/candidateSupabase";
import { getCandidateFromRequest, uploadResume, validateResumeFile } from "@/lib/candidateAuth";

const EDITABLE_FIELDS = [
  "full_name",
  "phone",
  "city",
  "country",
  "linkedin",
  "portfolio",
  "key_skills",
  "experience",
];

async function loadProfile(supabase, candidate) {
  const { data, error } = await supabase
    .from("candidate_profiles")
    .select("*")
    .eq("id", candidate.id)
    .maybeSingle();
  if (error) throw error;
  if (data) return data;

  // Accounts created before the signup trigger existed have no row yet.
  const { data: created, error: insertError } = await supabase
    .from("candidate_profiles")
    .insert({
      id: candidate.id,
      email: candidate.email,
      full_name: candidate.user_metadata?.full_name || null,
    })
    .select("*")
    .single();
  if (insertError) throw insertError;
  return created;
}

export async function GET(request) {
  const candidate = await getCandidateFromRequest(request);
  if (!candidate) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const profile = await loadProfile(createCandidateAdminClient(), candidate);
    return NextResponse.json({ success: true, profile });
  } catch (err) {
    console.error("Candidate profile GET error:", err);
    return NextResponse.json({ error: err.message || "Failed to load profile." }, { status: 500 });
  }
}

export async function PUT(request) {
  const candidate = await getCandidateFromRequest(request);
  if (!candidate) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const body = await request.json();
    const updates = {};
    for (const field of EDITABLE_FIELDS) {
      if (field in body) updates[field] = String(body[field] ?? "").trim() || null;
    }

    const supabase = createCandidateAdminClient();
    await loadProfile(supabase, candidate);
    const { data, error } = await supabase
      .from("candidate_profiles")
      .update(updates)
      .eq("id", candidate.id)
      .select("*")
      .single();
    if (error) throw error;

    return NextResponse.json({ success: true, profile: data });
  } catch (err) {
    console.error("Candidate profile PUT error:", err);
    return NextResponse.json({ error: err.message || "Failed to update profile." }, { status: 500 });
  }
}

// multipart/form-data with `resume`: replaces the saved profile resume.
export async function POST(request) {
  const candidate = await getCandidateFromRequest(request);
  if (!candidate) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const formData = await request.formData();
    const resumeFile = formData.get("resume");
    const resumeError = validateResumeFile(resumeFile);
    if (resumeError) return NextResponse.json({ error: resumeError }, { status: 400 });

    const supabase = createCandidateAdminClient();
    const previous = await loadProfile(supabase, candidate);
    const path = await uploadResume(supabase, CANDIDATE_RESUME_BUCKET, candidate.id, resumeFile);

    const { data, error } = await supabase
      .from("candidate_profiles")
      .update({ resume_path: path, resume_filename: resumeFile.name })
      .eq("id", candidate.id)
      .select("*")
      .single();
    if (error) throw error;

    // Old file may still back a submitted application; only delete if unused.
    if (previous.resume_path) {
      const { count } = await supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("resume_path", previous.resume_path);
      if (!count) {
        await supabase.storage.from(CANDIDATE_RESUME_BUCKET).remove([previous.resume_path]);
      }
    }

    return NextResponse.json({ success: true, profile: data });
  } catch (err) {
    console.error("Candidate profile resume upload error:", err);
    return NextResponse.json({ error: err.message || "Failed to upload resume." }, { status: 500 });
  }
}
