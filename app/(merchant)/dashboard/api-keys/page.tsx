import { Metadata } from "next";
import { Code2 } from "lucide-react";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { prisma } from "@/lib/prisma";
import DashboardSectionHeader from "@/app/(merchant)/_components/main/DashboardSectionHeader";
import ApiKeysClient from "./_components/ApiKeysClient";

export const metadata: Metadata = {
  title: "مفاتيح API",
};

export default async function ApiKeysPage() {
  const userId = await requireUserId();

  const store = await prisma.store.findFirstOrThrow({
    where: { userId },
    select: { id: true },
  });

  const keys = await prisma.apiKey.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      keyHint: true,
      status: true,
      scopes: true,
      ipWhitelist: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
      revokedAt: true,
    },
  });

  return (
    <div className="space-y-6" dir="rtl">
      <DashboardSectionHeader
        icon={Code2}
        title="مفاتيح API"
        description="أنشئ وأدر مفاتيح الوصول إلى API العام لمتجرك"
        badge={keys.filter((k) => k.status === "ACTIVE").length}
      />

      <ApiKeysClient storeId={store.id} initialKeys={keys} />
    </div>
  );
}
