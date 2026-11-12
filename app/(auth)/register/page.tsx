import type { Metadata } from "next";
import { FREE_TRIAL_DAYS } from "@/lib/subscriptions";
import { RegisterForm } from "../_components/forms/register-form";

export const metadata: Metadata = { title: "اعمل متجرك مجانًا | كاشو" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ ref?: string; store?: string }> }) {
  const { ref, store } = await searchParams;
  return (
    <RegisterForm
      refCode={ref?.trim() || undefined}
      // The landing hero's "claim your store name" bar hands the name over.
      initialStoreName={store?.trim().slice(0, 60) || undefined}
      trialDays={FREE_TRIAL_DAYS}
    />
  );
}
