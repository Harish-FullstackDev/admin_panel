"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { hcmJson } from "@/lib/hcm/session";
import { useInternalUser } from "@/components/hcm/InternalUserContext";
import { PageHeader, Spinner, EmptyState } from "@/components/hcm/ui";
import RequisitionForm from "@/components/hcm/RequisitionForm";

export default function NewRequisitionPage() {
  const router = useRouter();
  const { user, can } = useInternalUser();

  const save = async (payload, submit) => {
    const data = await hcmJson("/api/hcm/requisitions", { method: "POST", body: { ...payload, submit } });
    router.push(`/admin/dashboard/requisitions/${data.requisition.id}`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {!user ? (
        <Spinner />
      ) : !can("requisition.create") ? (
        <EmptyState icon={Lock} title="You don't have access to this page" description="Raising requisitions needs the requisition.create permission." />
      ) : (
        <>
          <Link
            href="/admin/dashboard/requisitions"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> Back to requisitions
          </Link>
          <PageHeader title="Raise requisition" description="Request approval to hire. Save a draft anytime, then submit for HR and CHRO approval." />
          <RequisitionForm onSave={save} onCancel={() => router.push("/admin/dashboard/requisitions")} />
        </>
      )}
    </div>
  );
}
