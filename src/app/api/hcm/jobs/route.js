import { NextResponse } from "next/server";
import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { requirePermission, jsonError, serverError } from "@/lib/hcm/auth";
import { logAudit } from "@/lib/hcm/audit";

const JOB_SELECT = "*, departments(name), locations(name), hiring_manager:internal_users!jobs_hiring_manager_id_fkey(id, full_name, email)";
const STATUSES = ["Draft", "Open", "Paused", "Closed"];
const MODES = ["Remote", "Hybrid", "On-site"];
const TYPES = ["Full-time", "Part-time", "Contract", "Freelancer", "Internship"];
const ROUND_TYPES = ["hr", "technical", "managerial", "culture", "other"];

function slugify(text) {
  return String(text).toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]+/g, "").replace(/--+/g, "-").replace(/^-+|-+$/g, "");
}

function list(value) {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  return String(value || "").split(",").map((v) => v.trim()).filter(Boolean);
}

function jobFields(body) {
  const num = (v) => (v === "" || v === null || v === undefined ? null : Number(v));
  const rounds = Array.isArray(body.interview_rounds)
    ? body.interview_rounds
        .map((r) => ({ name: String(r?.name || "").trim(), type: ROUND_TYPES.includes(r?.type) ? r.type : "other" }))
        .filter((r) => r.name)
    : undefined;
  const out = {
    title: String(body.title || "").trim(),
    company: String(body.company || "").trim(),
    location: String(body.location || "").trim(),
    location_id: body.location_id || null,
    department_id: body.department_id || null,
    hiring_manager_id: body.hiring_manager_id || null,
    mode_of_work: MODES.includes(body.mode_of_work) ? body.mode_of_work : "On-site",
    type_of_work: TYPES.includes(body.type_of_work) ? body.type_of_work : "Full-time",
    experience_level: String(body.experience_level || "").trim(),
    categories: list(body.categories),
    skills: list(body.skills),
    about_job: String(body.about_job || "").trim(),
    responsibilities: list(body.responsibilities),
    qualifications: list(body.qualifications),
    openings: Math.max(1, parseInt(body.openings, 10) || 1),
    visibility: ["external", "internal", "both"].includes(body.visibility) ? body.visibility : "external",
    closing_date: body.closing_date || null,
    salary_min: num(body.salary_min),
    salary_max: num(body.salary_max),
    currency: body.currency || "INR",
    show_salary: Boolean(body.show_salary),
    status: STATUSES.includes(body.status) ? body.status : "Draft",
  };
  if (rounds) out.interview_rounds = rounds;
  if (body.requisition_id !== undefined) out.requisition_id = body.requisition_id || null;
  return out;
}

// Drafts only need a title; everything shown publicly is required to publish.
function validate(job) {
  if (!job.title) return "Title is required.";
  if (job.salary_min !== null && job.salary_max !== null && job.salary_min > job.salary_max) return "Salary minimum must not exceed maximum.";
  if (job.status === "Draft") return null;
  if (!job.location) return "Location is required.";
  if (!job.experience_level) return "Experience level is required.";
  if (!job.about_job) return "Add a job description before publishing.";
  return null;
}

async function uniqueSlug(supabase, title, excludeId) {
  const base = slugify(title) || "job";
  let query = supabase.from("jobs").select("id").eq("slug", base);
  if (excludeId) query = query.neq("id", excludeId);
  const { data } = await query;
  return data?.length ? `${base}-${Math.random().toString(36).slice(2, 7)}` : base;
}

async function markRequisitionPosted(supabase, job) {
  if (job.status !== "Open" || !job.requisition_id) return;
  await supabase.from("requisitions").update({ status: "Posted" }).eq("id", job.requisition_id).eq("status", "Approved");
}

export async function GET(request) {
  const auth = await requirePermission(request, "job.view");
  if (auth.error) return auth.error;
  try {
    const params = new URL(request.url).searchParams;
    const supabase = createHcmAdminClient();
    let query = supabase.from("jobs").select(JOB_SELECT).order("created_at", { ascending: false });
    if (auth.scope === "own") query = query.eq("hiring_manager_id", auth.user.id);
    if (params.get("id")) query = query.eq("id", params.get("id"));
    if (params.get("archived") !== "1") query = query.eq("archived", false);
    const { data: jobs, error } = await query;
    if (error) throw error;

    const ids = jobs.map((j) => j.id);
    const counts = {};
    if (ids.length) {
      const { data: apps } = await supabase.from("applications").select("job_id, stage").in("job_id", ids);
      for (const a of apps || []) {
        counts[a.job_id] ??= { total: 0, active: 0 };
        counts[a.job_id].total += 1;
        if (!["Rejected", "Withdrawn", "Hired"].includes(a.stage)) counts[a.job_id].active += 1;
      }
    }
    return NextResponse.json({
      success: true,
      jobs: jobs.map((j) => ({ ...j, applicant_count: counts[j.id]?.total || 0, active_count: counts[j.id]?.active || 0 })),
    });
  } catch (err) {
    return serverError("Jobs GET", err);
  }
}

// POST: create. Body may be { from_requisition: id } to prefill a Draft from an
// approved requisition, or { duplicate_of: id }.
export async function POST(request) {
  const auth = await requirePermission(request, "job.manage");
  if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const supabase = createHcmAdminClient();
    let source = body;

    if (body.from_requisition) {
      const { data: req } = await supabase
        .from("requisitions")
        .select("*, departments(name), locations(name)")
        .eq("id", body.from_requisition)
        .maybeSingle();
      if (!req) return jsonError("Requisition not found.", 404);
      if (req.status !== "Approved" && req.status !== "Posted") return jsonError("Only approved requisitions can become job postings.");
      source = {
        title: req.role_title,
        location: req.locations?.name || "",
        location_id: req.location_id,
        department_id: req.department_id,
        hiring_manager_id: req.raised_by,
        type_of_work: req.employment_type,
        experience_level: "",
        categories: req.departments?.name ? [req.departments.name] : [],
        skills: req.skills,
        about_job: req.justification || "",
        openings: req.openings,
        salary_min: req.budget_min,
        salary_max: req.budget_max,
        currency: req.currency,
        requisition_id: req.id,
        status: "Draft",
        ...body.overrides,
      };
    } else if (body.duplicate_of) {
      const { data: original } = await supabase.from("jobs").select("*").eq("id", body.duplicate_of).maybeSingle();
      if (!original) return jsonError("Job not found.", 404);
      source = { ...original, title: `${original.title} (copy)`, status: "Draft", requisition_id: original.requisition_id };
    }

    const fields = jobFields(source);
    const problem = validate(fields);
    if (problem) return jsonError(problem);

    const slug = await uniqueSlug(supabase, fields.title);
    const { data: job, error } = await supabase
      .from("jobs")
      .insert({ ...fields, slug, posted_at: fields.status === "Open" ? new Date().toISOString() : null })
      .select(JOB_SELECT)
      .single();
    if (error) throw error;
    await markRequisitionPosted(supabase, job);
    await logAudit({ actor: auth.user, action: "job.create", entityType: "job", entityId: job.id, after: job, request });
    return NextResponse.json({ success: true, job }, { status: 201 });
  } catch (err) {
    return serverError("Jobs POST", err);
  }
}

// PUT { id, ...fields } — full update; or { id, status } for a quick status change.
export async function PUT(request) {
  const auth = await requirePermission(request, "job.manage");
  if (auth.error) return auth.error;
  try {
    const body = await request.json();
    if (!body.id) return jsonError("Job id is required.");
    const supabase = createHcmAdminClient();
    const { data: before } = await supabase.from("jobs").select("*").eq("id", body.id).maybeSingle();
    if (!before) return jsonError("Job not found.", 404);

    const quick = Object.keys(body).every((k) => ["id", "status"].includes(k));
    const fields = quick ? { ...jobFields({ ...before, ...body }) } : jobFields({ ...body, requisition_id: body.requisition_id ?? before.requisition_id });
    const problem = validate(fields);
    if (problem) return jsonError(problem);

    const updates = { ...fields };
    if (!quick && fields.title !== before.title) updates.slug = await uniqueSlug(supabase, fields.title, body.id);
    if (fields.status === "Open" && !before.posted_at) updates.posted_at = new Date().toISOString();

    const { data: job, error } = await supabase.from("jobs").update(updates).eq("id", body.id).select(JOB_SELECT).single();
    if (error) throw error;
    await markRequisitionPosted(supabase, job);
    await logAudit({ actor: auth.user, action: quick ? "job.status" : "job.update", entityType: "job", entityId: job.id, before, after: job, request });
    return NextResponse.json({ success: true, job });
  } catch (err) {
    return serverError("Jobs PUT", err);
  }
}

// DELETE ?id= — hard delete only drafts without applicants; otherwise archive.
export async function DELETE(request) {
  const auth = await requirePermission(request, "job.manage");
  if (auth.error) return auth.error;
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return jsonError("Job id is required.");
    const supabase = createHcmAdminClient();
    const { data: job } = await supabase.from("jobs").select("*").eq("id", id).maybeSingle();
    if (!job) return jsonError("Job not found.", 404);
    const { count } = await supabase.from("applications").select("id", { count: "exact", head: true }).eq("job_id", id);

    if (job.status === "Draft" && !count) {
      const { error } = await supabase.from("jobs").delete().eq("id", id);
      if (error) throw error;
      await logAudit({ actor: auth.user, action: "job.delete", entityType: "job", entityId: id, before: job, request });
      return NextResponse.json({ success: true, deleted: true, message: "Draft job deleted." });
    }

    const { error } = await supabase.from("jobs").update({ archived: true, status: "Closed" }).eq("id", id);
    if (error) throw error;
    await logAudit({ actor: auth.user, action: "job.archive", entityType: "job", entityId: id, before: { status: job.status, archived: false }, after: { status: "Closed", archived: true }, request });
    return NextResponse.json({ success: true, archived: true, message: "Job has applicants, so it was closed and archived instead of deleted." });
  } catch (err) {
    return serverError("Jobs DELETE", err);
  }
}
