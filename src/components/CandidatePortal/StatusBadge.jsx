import { LABEL_STYLES } from "@/lib/hcm/labels";

export default function StatusBadge({ label }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${
        LABEL_STYLES[label] || LABEL_STYLES["Under review"]
      }`}
    >
      {label}
    </span>
  );
}
