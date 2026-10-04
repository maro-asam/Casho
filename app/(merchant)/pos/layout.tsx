import { Metadata } from "next";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { requireStoreContext } from "@/lib/store/store-guard";
import { hasPermission } from "@/lib/store/permissions";
import { hasFeature, checkLimit, FEATURE_KEYS } from "@/lib/entitlements";
import { UpgradeRequiredCard } from "@/components/entitlements/UpgradeRequiredCard";

export const metadata: Metadata = {
  title: "نقطة البيع | كاشو",
  description: "نظام نقطة البيع لإدارة المبيعات المباشرة",
};

export default async function PosLayout({ children }: { children: ReactNode }) {
  // Owners and team members (cashiers) alike; branch access is checked per action.
  const ctx = await requireStoreContext({ usePicked: true });
  if (!ctx.isOwner && !hasPermission(ctx.role, "use_pos")) redirect("/dashboard");

  const store = await prisma.store.findUnique({
    where: { id: ctx.storeId },
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
