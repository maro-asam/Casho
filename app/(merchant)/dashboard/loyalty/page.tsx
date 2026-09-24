import { Metadata } from "next";
import { Gift } from "lucide-react";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { prisma } from "@/lib/prisma";
import DashboardSectionHeader from "@/app/(merchant)/_components/main/DashboardSectionHeader";
import LoyaltyDashboardClient from "./_components/LoyaltyDashboardClient";
import { FeatureGate } from "@/components/entitlements/FeatureGate";
import { FEATURE_KEYS } from "@/lib/entitlements";

export const metadata: Metadata = {
  title: "نظام النقاط والمكافآت",
  description: "إدارة نقاط العملاء وإعدادات برنامج الولاء",
};

export default async function LoyaltyPage() {
  const userId = await requireUserId();
  const store = await prisma.store.findFirst({
    where: { userId },
    select: {
      id: true,
      settings: {
        select: {
          loyaltyEnabled: true,
          loyaltyPointsPerEGP: true,
          loyaltyPointsValuePiasters: true,
          loyaltyMinRedemption: true,
        },
      },
    },
  });

  const [customers, totalCustomers] = store
    ? await Promise.all([
        prisma.customer.findMany({
          where: { storeId: store.id },
          orderBy: { points: "desc" },
          take: 20,
          select: {
            id: true,
            phone: true,
            name: true,
            points: true,
            createdAt: true,
            _count: { select: { orders: true } },
          },
        }),
        prisma.customer.count({ where: { storeId: store.id } }),
      ])
    : [[], 0];

  return (
    <div className="space-y-6" dir="rtl">
      <DashboardSectionHeader
        icon={Gift}
        title="نظام النقاط والمكافآت"
        badge={totalCustomers}
        description="فعّل برنامج الولاء وتابع نقاط عملائك"
      />
      {store ? (
        <FeatureGate
          storeId={store.id}
          feature={FEATURE_KEYS.LOYALTY}
          title="نظام النقاط والمكافآت"
          description="برنامج نقاط الولاء غير متاح في باقتك الحالية."
        >
          <LoyaltyDashboardClient settings={store.settings} customers={customers} />
        </FeatureGate>
      ) : (
        <LoyaltyDashboardClient settings={null} customers={customers} />
      )}
    </div>
  );
}
