import { createCandidateAdminClient } from "@/lib/candidateSupabase";

/**
 * Resolves the signed-in candidate from an `Authorization: Bearer <token>`
 * header, verified against the candidate Supabase project.
 * @param {Request} request
 * @returns {Promise<import('@supabase/supabase-js').User | null>}
 */
export async function getCandidateFromRequest(request) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;

  try {
    const { data, error } = await createCandidateAdminClient().auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user;
  } catch (err) {
    console.warn("getCandidateFromRequest: rejected token:", err);
    return null;
  }
}

const MAX_RESUME_SIZE = 5 * 1024 * 1024;

/** Returns an error message, or null if the file is an acceptable resume. */
export function validateResumeFile(file) {
  if (!file || typeof file === "string") return "A resume file is required.";
  if (!/\.(pdf|doc|docx)$/i.test(file.name || "")) {
    return "Resume must be a PDF or Word document (.pdf, .doc, .docx).";
  }
  if (file.size > MAX_RESUME_SIZE) return "Resume file exceeds the 5MB limit.";
  return null;
}

export async function uploadResume(supabase, bucket, candidateId, file) {
  const ext = file.name.split(".").pop();
  const path = `${candidateId}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(`Failed to upload resume: ${error.message}`);
  return path;
}
