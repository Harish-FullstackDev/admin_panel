import { NextResponse } from "next/server";
import { createHcmAdminClient, CANDIDATE_RESUME_BUCKET } from "@/lib/candidateSupabase";
import { getCandidateFromRequest, uploadResume, validateResumeFile } from "@/lib/candidateAuth";
import { candidateLabel } from "@/lib/hcm/labels";
import { queueEmail, notifyUsers, appUrl } from "@/lib/hcm/notify";

const LIST_COLUMNS = "id, job_id, job_slug, position, stage, current_round, created_at, updated_at, stage_changed_at";
const ACTIVE_OFFER_STATUSES = ["Sent", "Accepted", "Declined", "Discussion requested", "Expired"];

export async function GET(request) {
  const candidate = await getCandidateFromRequest(request);
  if (!candidate) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const supabase = createHcmAdminClient();
    const { data: apps, error } = await supabase
      .from("applications")
      .select(LIST_COLUMNS)
      .eq("candidate_id", candidate.id)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const ids = (apps || []).map((a) => a.id);
    let interviews = [];
    let offers = [];
    let joinerDocs = [];
    if (ids.length) {
      const [iv, of, jd] = await Promise.all([
        supabase
          .from("interviews")
          .select("id, application_id, round_name, scheduled_at, mode, status, candidate_confirmed_at")
          .in("application_id", ids)
          .eq("status", "Scheduled")
          .gte("scheduled_at", new Date().toISOString())
          .order("scheduled_at"),
        supabase.from("offers").select("id, application_id, status, expires_at").in("application_id", ids).in("status", ACTIVE_OFFER_STATUSES),
        supabase
          .from("joiner_documents")
          .select("status, required, joiners!inner(application_id, status)")
          .in("joiners.application_id", ids)
          .in("joiners.status", ["Pre-joining", "Ready"])
          .in("status", ["Requested", "Rejected"]),
      ]);
      interviews = iv.data || [];
      offers = of.data || [];
      joinerDocs = jd.data || [];
    }

    const applications = (apps || []).map((a) => {
      const upcoming = interviews.filter((i) => i.application_id === a.id);
      const offer = offers.find((o) => o.application_id === a.id && o.status === "Sent");
      const actions = [];
      if (upcoming.some((i) => !i.candidate_confirmed_at)) actions.push({ type: "confirm_interview", href: "/candidate/interviews" });
      if (offer) actions.push({ type: "respond_offer", href: "/candidate/offers" });
      const docsDue = joinerDocs.filter((d) => d.joiners.application_id === a.id).length;
      if (docsDue) actions.push({ type: "upload_documents", href: "/candidate/joining", count: docsDue });
      return {
        ...a,
        label: candidateLabel(a.stage),
        can_withdraw: !["Hired", "Rejected", "Withdrawn"].includes(a.stage),
        next_interview: upcoming[0] || null,
        pending_actions: actions,
      };
    });

    return NextResponse.json({ success: true, applications });
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
    const getBool = (key) => ["true", "on", "1", "yes"].includes(formData.get(key)?.toString().toLowerCase());

    const jobSlug = get("jobSlug");
    const firstName = get("firstName");
    const lastName = get("lastName");
    if (!jobSlug || !firstName || !lastName) {
      return NextResponse.json({ error: "Job, first name and last name are required." }, { status: 400 });
    }
    if (!getBool("consentGiven")) {
      return NextResponse.json({ error: "Consent to process your application data is required." }, { status: 400 });
    }

    const supabase = createHcmAdminClient();
    const { data: job } = await supabase
      .from("jobs")
      .select("id, slug, title, status, visibility, archived, closing_date")
      .eq("slug", jobSlug)
      .maybeSingle();
    const today = new Date().toISOString().slice(0, 10);
    const open =
      job && job.status === "Open" && !job.archived && job.visibility !== "internal" && (!job.closing_date || job.closing_date >= today);
    if (!open) {
      return NextResponse.json({ error: "This job is no longer accepting applications." }, { status: 404 });
    }

    const { data: existing } = await supabase
      .from("applications")
      .select("id")
      .eq("candidate_id", candidate.id)
      .eq("job_id", job.id)
      .maybeSingle();
    if (existing) return NextResponse.json({ error: "You have already applied for this job." }, { status: 409 });

    let resumePath;
    let resumeFilename;
    if (getBool("useProfileResume")) {
      const { data: profile } = await supabase
        .from("candidate_profiles")
        .select("resume_path, resume_filename")
        .eq("id", candidate.id)
        .maybeSingle();
      if (!profile?.resume_path) return NextResponse.json({ error: "No saved resume on your profile." }, { status: 400 });
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
        stage: "Applied",
        source: "Careers site",
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

    await supabase.from("application_events").insert({
      application_id: application.id,
      from_stage: null,
      to_stage: "Applied",
      actor_id: candidate.id,
    });
    await queueEmail(
      "application_received",
      candidate.email,
      { candidate_name: `${firstName} ${lastName}`, job_title: job.title, link: appUrl("/candidate/dashboard") },
      { entity: "application", id: application.id }
    );
    await notifyUsers(
      { permission: "application.move" },
      { title: `New application: ${job.title}`, body: `${firstName} ${lastName}`, link: `/admin/dashboard/careers/${job.id}` }
    );

    return NextResponse.json({ success: true, application }, { status: 201 });
  } catch (err) {
    console.error("Candidate applications POST error:", err);
    return NextResponse.json({ error: err.message || "Failed to submit application." }, { status: 500 });
  }
}
