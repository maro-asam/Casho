import type { Metadata } from "next";
import { Store } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { EmptyState, PageHeader } from "@/components/saas-page";
import { FEATURE_KEYS, hasFeature } from "@/lib/entitlements";
import { prisma } from "@/lib/prisma";
import { decryptSecret, maskSecret } from "@/lib/secrets";
import { PixelsForm } from "./_components/pixels-form";

export const metadata: Metadata = {
  title: "البيكسل وتتبع الإعلانات",
};

/** "••••a1b2" for a saved token, null when none (or it can't be read). */
function tokenHint(encrypted: string | null | undefined) {
  if (!encrypted) return null;
  try {
    return maskSecret(decryptSecret(encrypted));
  } catch {
    return "••••";
  }
}

export default async function PixelsRoute() {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, pixelSettings: true },
  });

  if (!store) {
    return (
      <EmptyState
        icon={Store}
        title="لسه معندكش متجر"
        description="أنشئ متجرك الأول وبعدها اربط البيكسل بتاعك."
        className="rounded-xl border border-dashed border-border"
      />
    );
  }

  const px = store.pixelSettings;
  const serverTracking = await hasFeature(store.id, FEATURE_KEYS.META_CAPI);

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="البيكسل وتتبع الإعلانات"
        description="اربط بيكسل فيسبوك وتيك توك وسناب بتوعك عشان تقيس مبيعات إعلاناتك وتخلّي الإعلانات توصل للي هيشتري."
      />
      <PixelsForm
        storeId={store.id}
        serverTracking={serverTracking}
        initial={{
          metaPixelId: px?.metaPixelId ?? "",
          tiktokPixelId: px?.tiktokPixelId ?? "",
          snapPixelId: px?.snapPixelId ?? "",
          metaTestEventCode: px?.metaTestEventCode ?? "",
          tiktokTestEventCode: px?.tiktokTestEventCode ?? "",
        }}
        tokenHints={{ meta: tokenHint(px?.metaCapiTokenEnc), tiktok: tokenHint(px?.tiktokAccessTokenEnc) }}
      />
    </div>
  );
}
