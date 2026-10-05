import { createHcmAdminClient } from "@/lib/candidateSupabase";

export const OFFER_SELECT =
  "*, applications!inner(id, first_name, last_name, email, position, stage, job_id, candidate_id)";

/** Upper salary limit for the application's job: job range, then requisition budget, then grade band. */
export async function salaryBand(jobId) {
  if (!jobId) return null;
  const supabase = createHcmAdminClient();
  const { data: job } = await supabase
    .from("jobs")
    .select("salary_min, salary_max, currency, requisition_id, requisitions(budget_min, budget_max, grade_id, grades(band_min, band_max))")
    .eq("id", jobId)
    .maybeSingle();
  if (!job) return null;
  const req = job.requisitions;
  const max = job.salary_max ?? req?.budget_max ?? req?.grades?.band_max ?? null;
  const min = job.salary_min ?? req?.budget_min ?? req?.grades?.band_min ?? null;
  return { min, max, currency: job.currency };
}

/** Marks Sent offers past their expiry date as Expired (lazy expiry, no cron yet). */
export async function expireOffers() {
  const today = new Date().toISOString().slice(0, 10);
  await createHcmAdminClient().from("offers").update({ status: "Expired" }).eq("status", "Sent").lt("expires_at", today);
}

export function offerFields(body) {
  const salary = Number(body.salary);
  if (!Number.isFinite(salary) || salary <= 0) return { error: "Enter a valid annual salary." };
  if (!body.joining_date) return { error: "Joining date is required." };
  if (!body.expires_at) return { error: "Offer expiry date is required." };
  const today = new Date().toISOString().slice(0, 10);
  if (body.expires_at < today) return { error: "Expiry date must be today or later." };
  if (body.joining_date < body.expires_at) return { error: "Joining date should be after the offer expiry date." };
  const breakdown = Array.isArray(body.breakdown)
    ? body.breakdown
        .map((b) => ({ label: String(b?.label || "").trim(), amount: Number(b?.amount) }))
        .filter((b) => b.label && Number.isFinite(b.amount))
    : [];
  const letter = String(body.letter_body || "").trim();
  if (!letter) return { error: "Offer letter text is required." };
  return {
    value: {
      salary,
      currency: body.currency || "INR",
      breakdown,
      joining_date: body.joining_date,
      expires_at: body.expires_at,
      letter_body: letter,
    },
  };
}
