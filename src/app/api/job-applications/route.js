import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseClient";
import { isAdminRequest } from "@/lib/adminAuth";

const RESUME_BUCKET = "resumes";
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour, enough for an admin to open/download it
const MAX_RESUME_SIZE = 5 * 1024 * 1024; // 5MB, matches the front-end form's own limit
const VALID_STATUSES = ["New", "Reviewed", "Shortlisted", "Interviewing", "Rejected", "Hired"];

// GET: admin inventory of applications, newest first, with a short-lived
// signed URL to the stored resume. There is no foreign key linking
// applications back to a specific `jobs` row (applications only carry a
// free-text `position`), so filtering/joining by job is not possible here —
// only status filtering and a client-side search over name/email/position.
export async function GET(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    const supabase = createAdminClient();

    let query = supabase
      .from("job_applications")
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
            .from(RESUME_BUCKET)
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

// POST: public submission endpoint — anyone can apply, no admin session needed.
// Accepts multipart/form-data so the resume file travels with the rest of the
// application fields in a single request. Consent is mandatory: the table's
// own RLS policy requires consent_given = true for anon inserts, and this
// endpoint enforces the same rule even though the service-role client bypasses RLS.
export async function POST(request) {
  try {
    const formData = await request.formData();

    const get = (key) => formData.get(key)?.toString().trim() || "";
    const getBool = (key) => ["true", "on", "1", "yes"].includes(formData.get(key)?.toString().toLowerCase());

    const firstName = get("firstName");
    const lastName = get("lastName");
    const email = get("email");
    const position = get("position");
    const consentGiven = getBool("consentGiven");
    const resumeFile = formData.get("resume");

    if (!firstName || !lastName || !email || !position) {
      return NextResponse.json(
        { error: "First name, last name, email, and position are required." },
        { status: 400 }
      );
    }

    if (!consentGiven) {
      return NextResponse.json(
        { error: "Consent to process your application data is required." },
        { status: 400 }
      );
    }

    if (!resumeFile || typeof resumeFile === "string") {
      return NextResponse.json({ error: "A resume file is required." }, { status: 400 });
    }

    const isValidType = /\.(pdf|doc|docx)$/i.test(resumeFile.name || "");
    if (!isValidType) {
      return NextResponse.json(
        { error: "Resume must be a PDF or Word document (.pdf, .doc, .docx)." },
        { status: 400 }
      );
    }

    if (resumeFile.size > MAX_RESUME_SIZE) {
      return NextResponse.json({ error: "Resume file exceeds the 5MB limit." }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Upload resume into the private "resumes" bucket
    const ext = resumeFile.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
    const storagePath = `applications/${fileName}`;
    const buffer = Buffer.from(await resumeFile.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(RESUME_BUCKET)
      .upload(storagePath, buffer, {
        contentType: resumeFile.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Resume upload error:", uploadError);
      return NextResponse.json(
        { error: `Failed to upload resume: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: application, error: insertError } = await supabase
      .from("job_applications")
      .insert({
        position,
        first_name: firstName,
        last_name: lastName,
        email: email.toLowerCase(),
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
        resume_path: storagePath,
        resume_filename: resumeFile.name,
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
        consent_given: consentGiven,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Application insert error:", insertError);
      return NextResponse.json(
        { error: `Failed to save application: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, application }, { status: 201 });
  } catch (err) {
    console.error("Job Applications POST API Error:", err);
    return NextResponse.json(
      { error: err.message || "Server error during application submission." },
      { status: 500 }
    );
  }
}

// PATCH: admin updates an application's pipeline status
export async function PATCH(request) {
  if (!isAdminRequest(request)) {
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

    const supabase = createAdminClient();
    const { data: updated, error } = await supabase
      .from("job_applications")
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

// DELETE: admin removes an application record (and its stored resume)
export async function DELETE(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Application ID is required for deletion." }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from("job_applications")
      .select("resume_path")
      .eq("id", id)
      .single();

    const { error: deleteError } = await supabase.from("job_applications").delete().eq("id", id);
    if (deleteError) throw deleteError;

    if (existing?.resume_path) {
      await supabase.storage.from(RESUME_BUCKET).remove([existing.resume_path]);
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
