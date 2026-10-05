// Internal pipeline stage -> label shown to candidates (plan §10.2, §11).
export const CANDIDATE_STAGE_LABELS = {
  Applied: "Applied",
  Screening: "Under review",
  Hold: "Under review",
  Shortlisted: "Shortlisted",
  Interview: "Interview",
  Selected: "Selected",
  Offer: "Offer made",
  Hired: "Hired",
  Rejected: "Not selected",
  Withdrawn: "Withdrawn",
};

export const CANDIDATE_TRACKER = ["Applied", "Under review", "Shortlisted", "Interview", "Selected"];

export function candidateLabel(stage) {
  return CANDIDATE_STAGE_LABELS[stage] || stage;
}

export const STAGE_STYLES = {
  Applied: "bg-blue-50 text-blue-700 border-blue-200",
  Screening: "bg-slate-100 text-slate-700 border-slate-200",
  Hold: "bg-orange-50 text-orange-700 border-orange-200",
  Shortlisted: "bg-amber-50 text-amber-700 border-amber-200",
  Interview: "bg-purple-50 text-purple-700 border-purple-200",
  Selected: "bg-teal-50 text-teal-700 border-teal-200",
  Offer: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Hired: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
  Withdrawn: "bg-slate-100 text-slate-500 border-slate-200",
};

export const LABEL_STYLES = {
  Applied: STAGE_STYLES.Applied,
  "Under review": STAGE_STYLES.Screening,
  Shortlisted: STAGE_STYLES.Shortlisted,
  Interview: STAGE_STYLES.Interview,
  Selected: STAGE_STYLES.Selected,
  "Offer made": STAGE_STYLES.Offer,
  Hired: STAGE_STYLES.Hired,
  "Not selected": STAGE_STYLES.Rejected,
  Withdrawn: STAGE_STYLES.Withdrawn,
};
