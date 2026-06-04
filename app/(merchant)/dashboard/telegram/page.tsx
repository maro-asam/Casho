import { Metadata } from "next";
import { Send } from "lucide-react";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { prisma } from "@/lib/prisma";
import DashboardSectionHeader from "@/app/(merchant)/_components/main/DashboardSectionHeader";
import TelegramConnect from "./_components/TelegramConnect";

export const metadata: Metadata = {
  title: "ربط تيليجرام",
  description: "احصل على إشعارات الطلبات فوراً عبر تيليجرام",
};

export default async function TelegramPage() {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: {
      settings: {
        select: {
          telegramChatId: true,
          telegramLinkToken: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6" dir="rtl">
      <DashboardSectionHeader
        icon={Send}
        title="ربط تيليجرام"
        description="احصل على إشعارات فورية لكل طلب جديد مباشرة على تيليجرام"
      />
      <TelegramConnect
        linked={!!store?.settings?.telegramChatId}
        chatId={store?.settings?.telegramChatId ?? null}
        linkToken={store?.settings?.telegramLinkToken ?? null}
      />
    </div>
  );
}
