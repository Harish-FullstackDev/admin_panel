import { Suspense } from "react";
import PortalShell from "@/components/CandidatePortal/PortalShell";
import AuthForm from "@/components/CandidatePortal/AuthForm";

export const metadata = { title: "Sign in | Ascendus Careers" };

export default function CandidateLoginPage() {
  return (
    <PortalShell>
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </PortalShell>
  );
}
