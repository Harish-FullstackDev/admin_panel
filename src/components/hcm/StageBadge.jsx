"use client";

import { Badge } from "@/components/hcm/ui";
import { STAGE_STYLES } from "@/lib/hcm/labels";

export default function StageBadge({ stage }) {
  if (!stage) return null;
  return <Badge className={STAGE_STYLES[stage] || undefined}>{stage}</Badge>;
}
