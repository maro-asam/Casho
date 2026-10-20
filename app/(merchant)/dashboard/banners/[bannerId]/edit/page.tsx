import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { BannerForm } from "../../_components/banner-form";
import { loadBannerFormContext, loadEditableBanner } from "../../_lib/banner-form-data";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return { title: tr("تعديل البانر") };
}

export default async function EditBannerPage({ params }: { params: Promise<{ bannerId: string }> }) {
  await loadDashboardLocale();
  const { bannerId } = await params;
  const userId = await requireUserId();

  const context = await loadBannerFormContext(userId);
  if (!context) redirect("/banners");
  const banner = await loadEditableBanner(context.storeId, bannerId);
  if (!banner) redirect("/banners");

  return (
    <div dir={tdir()}>
      <BannerForm key={banner.id} {...context} banner={banner} />
    </div>
  );
}
