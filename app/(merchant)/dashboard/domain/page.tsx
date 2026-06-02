import { Metadata } from "next";
import { Globe } from "lucide-react";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import DashboardSectionHeader from "../../_components/main/DashboardSectionHeader";
import CustomDomainClient from "./_components/CustomDomainClient";

export const metadata: Metadata = {
  title: "النطاق الخاص",
  description: "اربط نطاقك الخاص بمتجرك على كاشو",
};

export default async function CustomDomainPage() {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: {
      slug: true,
      customDomain: true,
      customDomainStatus: true,
      customDomainConnectedAt: true,
    },
  });

  if (!store) redirect("/");

  return (
    <div dir="rtl" className="space-y-6">
      <DashboardSectionHeader
        icon={Globe}
        title="النطاق الخاص"
        description="اربط نطاقك الخاص لتقديم تجربة احترافية لعملائك"
      />

      <CustomDomainClient
        storeSlug={store.slug}
        initialDomain={store.customDomain}
        initialStatus={
          store.customDomain
            ? (store.customDomainStatus as "PENDING" | "ACTIVE" | "FAILED")
            : null
        }
        initialConnectedAt={store.customDomainConnectedAt}
      />
    </div>
  );
}
