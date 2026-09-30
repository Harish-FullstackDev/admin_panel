import { Suspense } from "react";
import PortalShell from "@/components/CandidatePortal/PortalShell";
import AuthForm from "@/components/CandidatePortal/AuthForm";

export const metadata = { title: "Create account | Ascendus Careers" };

export default function CandidateSignupPage() {
  return (
    <PortalShell>
      <Suspense>
        <AuthForm mode="signup" />
      </Suspense>
    </PortalShell>
  );
}
