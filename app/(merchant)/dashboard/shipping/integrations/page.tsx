import Link from "next/link";
import type { Metadata } from "next";
import { PackageCheck } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { LargeTitle, appleButton } from "@/components/saas-page";
import { ShippingTabs } from "../_components/shipping-tabs";
import { prisma } from "@/lib/prisma";
import { getStoreCarriers } from "@/lib/shipping/store-carriers";
import { ACTIVE_SHIPMENT_STATUSES } from "@/lib/shipping/shipment-status";
import ShippingIntegrationsClient, { type CarrierStats } from "./_components/ShippingIntegrationsClient";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
  title: tr("شركات الشحن"),
  description: tr("اربط شركات الشحن المصرية واشحن طلباتك وتابع التحصيل من مكان واحد"),
};
}

export default async function ShippingIntegrationsPage() {
  await loadDashboardLocale();
  const userId = await requireUserId();
  const store = await prisma.store.findFirst({ where: { userId }, select: { id: true } });

  const [connected, active, delivered, codOutstanding] = store
    ? await Promise.all([
        getStoreCarriers(store.id),
        prisma.shipment.groupBy({
          by: ["provider"],
          where: { storeId: store.id, status: { in: ACTIVE_SHIPMENT_STATUSES } },
          _count: { _all: true },
        }),
        prisma.shipment.groupBy({
          by: ["provider"],
          where: { storeId: store.id, status: "DELIVERED" },
          _count: { _all: true },
        }),
        prisma.shipment.groupBy({
          by: ["provider"],
          where: { storeId: store.id, status: "DELIVERED", codAmount: { gt: 0 }, codCollectedAt: null },
          _sum: { codAmount: true },
        }),
      ])
    : [[], [], [], []];

  const stats: Record<string, CarrierStats> = {};
  const statFor = (provider: string) => (stats[provider.toUpperCase()] ??= { active: 0, delivered: 0, codOutstanding: 0 });
  for (const row of active) statFor(row.provider).active += row._count._all;
  for (const row of delivered) statFor(row.provider).delivered += row._count._all;
  for (const row of codOutstanding) statFor(row.provider).codOutstanding += row._sum.codAmount ?? 0;

  return (
    <div className="space-y-8" dir={tdir()}>
      <div className="space-y-6">
        <LargeTitle
          title={tr("شركات الشحن")}
          subtitle={tr("اربط شركات الشحن اللي بتتعامل معاها، واشحن أي طلب منها بضغطة من صفحة الطلب.")}
          actions={
            <Link href="/shipping/shipments" className={appleButton.gray}>
              <PackageCheck className="size-4" />
              {tr("الشحنات")}
            </Link>
          }
        />
        <ShippingTabs active="integrations" />
      </div>
      <ShippingIntegrationsClient connected={connected} stats={stats} />
    </div>
  );
}
