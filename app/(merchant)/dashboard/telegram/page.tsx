import { Metadata } from "next";
import { Send } from "lucide-react";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { prisma } from "@/lib/prisma";
import DashboardSectionHeader from "@/app/(merchant)/_components/main/DashboardSectionHeader";
import TelegramConnect from "./_components/TelegramConnect";
import { FeatureGate } from "@/components/entitlements/FeatureGate";
import { FEATURE_KEYS } from "@/lib/entitlements";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
  title: tr("ربط تيليجرام"),
  description: tr("احصل على إشعارات الطلبات فوراً عبر تيليجرام"),
};
}

export default async function TelegramPage() {
  await loadDashboardLocale();
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: {
      id: true,
      settings: {
        select: {
          telegramChatId: true,
          telegramLinkToken: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6" dir={tdir()}>
      <DashboardSectionHeader
        icon={Send}
        title={tr("ربط تيليجرام")}
        description={tr("احصل على إشعارات فورية لكل طلب جديد مباشرة على تيليجرام")}
      />
      {store ? (
        <FeatureGate
          storeId={store.id}
          feature={FEATURE_KEYS.TELEGRAM}
          title={tr("ربط تيليجرام")}
          description={tr("تكامل تيليجرام غير متاح في باقتك الحالية.")}
        >
          <TelegramConnect
            linked={!!store.settings?.telegramChatId}
            chatId={store.settings?.telegramChatId ?? null}
            linkToken={store.settings?.telegramLinkToken ?? null}
          />
        </FeatureGate>
      ) : (
        <TelegramConnect linked={false} chatId={null} linkToken={null} />
      )}
    </div>
  );
}
