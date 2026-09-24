import { Metadata } from "next";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { hasFeature, checkLimit, FEATURE_KEYS } from "@/lib/entitlements";
import { UpgradeRequiredCard } from "@/components/entitlements/UpgradeRequiredCard";

export const metadata: Metadata = {
  title: "نقطة البيع | كاشو",
  description: "نظام نقطة البيع لإدارة المبيعات المباشرة",
};

export default async function PosLayout({ children }: { children: ReactNode }) {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, name: true, slug: true },
  });

  if (!store) redirect("/");

  const posEnabled = await hasFeature(store.id, FEATURE_KEYS.POS);

  if (!posEnabled) {
    const { requiredPlan } = await checkLimit(store.id, FEATURE_KEYS.POS);
    return (
      <div dir="rtl" className="flex h-screen items-center justify-center bg-background p-6 text-foreground">
        <UpgradeRequiredCard
          title="نقطة البيع (POS)"
          description="نظام نقطة البيع غير متاح في باقتك الحالية."
          requiredPlanSlug={requiredPlan}
          className="max-w-md"
        />
      </div>
    );
  }

  return (
    <div dir="rtl" className="h-screen overflow-hidden bg-background text-foreground">
      {children}
    </div>
  );
}
