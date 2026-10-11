import { createHcmAdminClient } from "@/lib/candidateSupabase";
import { renderTemplate } from "@/lib/hcm/notify";

export function letterDate(date = new Date()) {
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Renders the `letter_<type>` template and stores it against the employee.
 * `links` ties the letter to the stage record or exit case it came from.
 */
export async function issueLetterFor(employee, type, vars, { stageRecordId = null, exitCaseId = null } = {}, actor) {
  const db = createHcmAdminClient();
  const { data: template } = await db.from("email_templates").select("subject, body").eq("code", `letter_${type}`).maybeSingle();
  const all = {
    date: letterDate(),
    name: employee.full_name,
    designation: employee.designation || "—",
    employee_code: employee.employee_code,
    signatory: "Human Resources",
    note: "",
    ...vars,
  };
  const title = template ? renderTemplate(template.subject, all) : type;
  const body = template ? renderTemplate(template.body, all) : "";
  const { data, error } = await db
    .from("letters")
    .insert({
      employee_id: employee.id,
      type,
      title,
      body,
      stage_record_id: stageRecordId,
      ...(exitCaseId ? { exit_case_id: exitCaseId } : {}),
      issued_by: actor?.id ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
