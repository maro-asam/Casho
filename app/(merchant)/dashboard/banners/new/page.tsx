import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { BannerForm } from "../_components/banner-form";
import { loadBannerFormContext } from "../_lib/banner-form-data";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return { title: tr("بانر جديد") };
}

export default async function NewBannerPage() {
  await loadDashboardLocale();
  const userId = await requireUserId();
  const context = await loadBannerFormContext(userId);
  if (!context) redirect("/banners");

  return (
    <div dir={tdir()}>
      <BannerForm {...context} />
    </div>
  );
}
