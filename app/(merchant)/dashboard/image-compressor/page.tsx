import type { Metadata } from "next";

import { LargeTitle } from "@/components/saas-page";
import { ImageCompressor } from "./_components/image-compressor";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
    title: tr("ضغط الصور"),
  };
}

export default async function ImageCompressorPage() {
  await loadDashboardLocale();
  return (
    <div className="space-y-6" dir={tdir()}>
      <LargeTitle
        title={tr("ضغط الصور")}
        subtitle={tr("صغّر صور منتجاتك لـ 1 ميجا أو أقل من غير ما الجودة تبان — المتجر يفتح أسرع.")}
      />
      <ImageCompressor />
    </div>
  );
}
