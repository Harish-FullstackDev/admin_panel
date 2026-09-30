import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseClient";
import { createCandidateAdminClient, CANDIDATE_RESUME_BUCKET } from "@/lib/candidateSupabase";
import { getCandidateFromRequest, uploadResume, validateResumeFile } from "@/lib/candidateAuth";

const LIST_COLUMNS = "id, job_id, job_slug, position, status, created_at, updated_at";

export async function GET(request) {
  const candidate = await getCandidateFromRequest(request);
  if (!candidate) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const { data, error } = await createCandidateAdminClient()
      .from("applications")
      .select(LIST_COLUMNS)
      .eq("candidate_id", candidate.id)
      .order("created_at", { ascending: false });
    if (error) throw error;

    return NextResponse.json({ success: true, applications: data || [] });
  } catch (err) {
    console.error("Candidate applications GET error:", err);
    return NextResponse.json({ error: err.message || "Failed to load applications." }, { status: 500 });
  }
}

// multipart/form-data. Either a `resume` file or `useProfileResume=true`.
export async function POST(request) {
  const candidate = await getCandidateFromRequest(request);
  if (!candidate) return NextResponse.json({ error: "Please sign in to apply." }, { status: 401 });

  try {
    const formData = await request.formData();
    const get = (key) => formData.get(key)?.toString().trim() || "";
    const getBool = (key) =>
      ["true", "on", "1", "yes"].includes(formData.get(key)?.toString().toLowerCase());

    const jobSlug = get("jobSlug");
    const firstName = get("firstName");
    const lastName = get("lastName");

    if (!jobSlug || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Job, first name and last name are required." },
        { status: 400 }
      );
    }
    if (!getBool("consentGiven")) {
      return NextResponse.json(
        { error: "Consent to process your application data is required." },
        { status: 400 }
      );
    }

    // Job comes from the admin project; only Open jobs accept applications.
    const { data: job } = await createAdminClient()
      .from("jobs")
      .select("id, slug, title, status")
      .eq("slug", jobSlug)
      .maybeSingle();
    if (!job || job.status !== "Open") {
      return NextResponse.json({ error: "This job is no longer accepting applications." }, { status: 404 });
    }

    const supabase = createCandidateAdminClient();

    const { data: existing } = await supabase
      .from("applications")
      .select("id")
      .eq("candidate_id", candidate.id)
      .eq("job_id", job.id)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ error: "You have already applied for this job." }, { status: 409 });
    }

    let resumePath;
    let resumeFilename;
    if (getBool("useProfileResume")) {
      const { data: profile } = await supabase
        .from("candidate_profiles")
        .select("resume_path, resume_filename")
        .eq("id", candidate.id)
        .maybeSingle();
      if (!profile?.resume_path) {
        return NextResponse.json({ error: "No saved resume on your profile." }, { status: 400 });
      }
      resumePath = profile.resume_path;
      resumeFilename = profile.resume_filename;
    } else {
      const resumeFile = formData.get("resume");
      const resumeError = validateResumeFile(resumeFile);
      if (resumeError) return NextResponse.json({ error: resumeError }, { status: 400 });
      resumePath = await uploadResume(supabase, CANDIDATE_RESUME_BUCKET, candidate.id, resumeFile);
      resumeFilename = resumeFile.name;
    }

    const { data: application, error: insertError } = await supabase
      .from("applications")
      .insert({
        candidate_id: candidate.id,
        job_id: job.id,
        job_slug: job.slug,
        position: job.title,
        first_name: firstName,
        last_name: lastName,
        email: candidate.email.toLowerCase(),
        phone: get("phone") || null,
        address_line1: get("addressLine1") || null,
        address_line2: get("addressLine2") || null,
        city: get("city") || null,
        state: get("state") || null,
        zip: get("zip") || null,
        country: get("country") || null,
        experience: get("experience") || null,
        job_title: get("jobTitle") || null,
        employer: get("employer") || null,
        key_skills: get("keySkills") || null,
        cover_letter: get("coverLetter") || null,
        resume_path: resumePath,
        resume_filename: resumeFilename,
        start_date: get("startDate") || null,
        current_salary: get("currentSalary") || null,
        expected_salary: get("expectedSalary") || null,
        linkedin: get("linkedin") || null,
        portfolio: get("portfolio") || null,
        ref_name: get("refName") || null,
        ref_relationship: get("refRelationship") || null,
        ref_email: get("refEmail") || null,
        ref_phone: get("refPhone") || null,
        hear_about: get("hearAbout") || null,
        consent_given: true,
      })
      .select(LIST_COLUMNS)
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json({ error: "You have already applied for this job." }, { status: 409 });
      }
      throw insertError;
    }

    return NextResponse.json({ success: true, application }, { status: 201 });
  } catch (err) {
    console.error("Candidate applications POST error:", err);
    return NextResponse.json({ error: err.message || "Failed to submit application." }, { status: 500 });
  }
}
