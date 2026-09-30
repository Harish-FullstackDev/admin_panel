const STYLES = {
  New: "bg-blue-50 text-blue-700 border-blue-200",
  Reviewed: "bg-slate-100 text-slate-700 border-slate-200",
  Shortlisted: "bg-amber-50 text-amber-700 border-amber-200",
  Interviewing: "bg-purple-50 text-purple-700 border-purple-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
  Hired: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

// Candidates see "Submitted" instead of the internal "New" label.
const CANDIDATE_LABELS = { New: "Submitted", Reviewed: "Under Review" };

export default function StatusBadge({ status, candidateView = false }) {
  const label = candidateView ? CANDIDATE_LABELS[status] || status : status;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
        STYLES[status] || STYLES.Reviewed
      }`}
    >
      {label}
    </span>
  );
}
