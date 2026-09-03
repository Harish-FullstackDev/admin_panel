import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseClient";
import { isAdminRequest } from "@/lib/adminAuth";

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")           // Replace spaces with -
    .replace(/[^\w\-]+/g, "")       // Remove all non-word chars
    .replace(/\-\-+/g, "-")         // Replace multiple - with single -
    .replace(/^-+/, "")             // Trim - from start
    .replace(/-+$/, "");            // Trim - from end
}

function toStringArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return [];
}

// GET all jobs (admin inventory — includes Draft/Closed postings, not just
// the ones the public site is allowed to read via RLS).
export async function GET(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, jobs: jobs || [] });
  } catch (err) {
    console.error("GET Jobs API Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to retrieve jobs collection." },
      { status: 500 }
    );
  }
}

// POST: Create a new job posting
export async function POST(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      title,
      company,
      location,
      mode_of_work,
      type_of_work,
      experience_level,
      categories,
      about_job,
      responsibilities,
      qualifications,
      status,
    } = body;

    if (!title?.trim() || !location?.trim() || !experience_level?.trim()) {
      return NextResponse.json(
        { error: "Title, location, and experience level are required." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Generate a unique slug from the title
    let slug = slugify(title);
    const { data: existingJobs } = await supabase
      .from("jobs")
      .select("id")
      .eq("slug", slug);

    if (existingJobs && existingJobs.length > 0) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
    }

    const { data: jobData, error: insertError } = await supabase
      .from("jobs")
      .insert({
        title: title.trim(),
        slug,
        company: company?.trim() || "",
        location: location.trim(),
        mode_of_work: mode_of_work || "On-site",
        type_of_work: type_of_work || "Full-time",
        experience_level: experience_level.trim(),
        categories: toStringArray(categories),
        about_job: about_job?.trim() || "",
        responsibilities: toStringArray(responsibilities),
        qualifications: toStringArray(qualifications),
        status: status || "Draft",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Job insert error:", insertError);
      return NextResponse.json(
        { error: `Failed to save job posting: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, job: jobData }, { status: 201 });
  } catch (err) {
    console.error("Jobs POST API Error:", err);
    return NextResponse.json(
      { error: err.message || "Server error during job creation." },
      { status: 500 }
    );
  }
}

// PUT: Update an existing job posting
export async function PUT(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      id,
      title,
      company,
      location,
      mode_of_work,
      type_of_work,
      experience_level,
      categories,
      about_job,
      responsibilities,
      qualifications,
      status,
    } = body;

    if (!id || !title?.trim() || !location?.trim() || !experience_level?.trim()) {
      return NextResponse.json(
        { error: "Job ID, title, location, and experience level are required." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Regenerate slug if it now collides with a different job
    let slug = slugify(title);
    const { data: duplicateJobs } = await supabase
      .from("jobs")
      .select("id")
      .eq("slug", slug)
      .neq("id", id);

    if (duplicateJobs && duplicateJobs.length > 0) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
    }

    const { data: updatedJob, error: updateError } = await supabase
      .from("jobs")
      .update({
        title: title.trim(),
        slug,
        company: company?.trim() || "",
        location: location.trim(),
        mode_of_work: mode_of_work || "On-site",
        type_of_work: type_of_work || "Full-time",
        experience_level: experience_level.trim(),
        categories: toStringArray(categories),
        about_job: about_job?.trim() || "",
        responsibilities: toStringArray(responsibilities),
        qualifications: toStringArray(qualifications),
        status: status || "Draft",
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Job update error:", updateError);
      return NextResponse.json(
        { error: `Failed to update job posting: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, job: updatedJob });
  } catch (err) {
    console.error("Jobs PUT API Error:", err);
    return NextResponse.json(
      { error: err.message || "Server error during job update." },
      { status: 500 }
    );
  }
}

// DELETE: Delete a job posting by query ID
export async function DELETE(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Job ID is required for deletion." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error: deleteError } = await supabase.from("jobs").delete().eq("id", id);

    if (deleteError) {
      console.error("Job delete error:", deleteError);
      return NextResponse.json(
        { error: `Failed to delete job posting: ${deleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Job posting successfully deleted." });
  } catch (err) {
    console.error("Jobs DELETE API Error:", err);
    return NextResponse.json(
      { error: err.message || "Server error during job deletion." },
      { status: 500 }
    );
  }
}
