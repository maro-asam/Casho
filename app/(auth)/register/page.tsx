import type { Metadata } from "next";
import { cookies } from "next/headers";
import { SIGNUP_REF_COOKIE, resolveFirstReferral } from "@/lib/sales/attribution";
import { FREE_TRIAL_DAYS } from "@/lib/subscriptions";
import { RegisterForm } from "../_components/forms/register-form";

export const metadata: Metadata = { title: "اعمل متجرك مجانًا | كاشو" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ ref?: string; store?: string }> }) {
  const { ref, store } = await searchParams;
  // The link's code first, then one remembered from an earlier visit — only a
  // code that resolves is shown as "you're signing up with code X".
  const referral = await resolveFirstReferral(ref, (await cookies()).get(SIGNUP_REF_COOKIE)?.value);
  return (
    <RegisterForm
      refCode={referral?.code}
      // The landing hero's "claim your store name" bar hands the name over.
      initialStoreName={store?.trim().slice(0, 60) || undefined}
      trialDays={FREE_TRIAL_DAYS}
    />
  );
}
