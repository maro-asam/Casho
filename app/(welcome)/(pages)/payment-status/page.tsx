import type { Metadata } from "next";
import PaymentStatus, { type PaymentStatusValue } from "./PaymentStatus";

// TEMP: where a plan bought from the pricing cards lands after Paymob
// (app/api/payments/paymob/plan). See lib/payments/plan-checkout.ts.

export const metadata: Metadata = {
  title: "حالة الدفع | كاشو",
  robots: { index: false, follow: false },
};

const STATUSES: PaymentStatusValue[] = ["success", "pending", "failed", "invalid"];

export default async function PaymentStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; plan?: string }>;
}) {
  const params = await searchParams;
  const status = STATUSES.find((s) => s === params.status) ?? "invalid";
  const planKey = typeof params.plan === "string" ? params.plan.slice(0, 40) : null;
  return <PaymentStatus status={status} planKey={planKey} />;
}
