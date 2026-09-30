import { notFound } from "next/navigation";
import PortalShell from "@/components/CandidatePortal/PortalShell";
import ApplyForm from "@/components/CandidatePortal/ApplyForm";
import { getOpenJobBySlug } from "@/lib/publicJobs";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const job = await getOpenJobBySlug(slug);
  return { title: job ? `Apply: ${job.title} | Ascendus Careers` : "Ascendus Careers" };
}

export default async function ApplyPage({ params }) {
  const { slug } = await params;
  const job = await getOpenJobBySlug(slug);
  if (!job) notFound();

  return (
    <PortalShell>
      <ApplyForm job={job} />
    </PortalShell>
  );
}
