import type { Metadata } from "next";
import { FREE_TRIAL_DAYS } from "@/lib/subscriptions";
import { RegisterForm } from "../_components/forms/register-form";

export const metadata: Metadata = { title: "اعمل متجرك مجانًا | كاشو" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  return <RegisterForm refCode={ref?.trim() || undefined} trialDays={FREE_TRIAL_DAYS} />;
}
