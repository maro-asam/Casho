import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireAuth } from "@/actions/auth/require.actions";
import { AFTER_VERIFY_PATH, getCodeStatus, maskEmail } from "@/lib/auth/email-verification";
import { prisma } from "@/lib/prisma";
import { AuthSplit } from "../_components/auth-split";
import { VerifyEmailAside } from "./_components/verify-email-aside";
import { VerifyEmailForm } from "./_components/verify-email-form";

export const metadata: Metadata = { title: "أكّد إيميلك | كاشو", robots: { index: false, follow: false } };

export default async function VerifyEmailPage() {
  const user = await requireAuth();
  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { email: true, emailVerified: true, mustVerifyEmail: true },
  });
  if (!account) redirect("/login");

  // New signups continue to onboarding; older accounts came from the dashboard banner.
  const nextPath = account.mustVerifyEmail ? AFTER_VERIFY_PATH : "/dashboard";
  if (account.emailVerified) redirect(nextPath);

  const { hasActiveCode, retryIn } = await getCodeStatus(user.id);

  return (
    <AuthSplit aside={<VerifyEmailAside />}>
      <VerifyEmailForm
        maskedEmail={maskEmail(account.email)}
        hasActiveCode={hasActiveCode}
        initialRetryIn={retryIn}
        nextPath={nextPath}
        canSkip={!account.mustVerifyEmail}
      />
    </AuthSplit>
  );
}
