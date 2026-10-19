import { redirect } from "next/navigation";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

// Adding happens in a dialog on the list page; keep old links working.
export default async function NewBannerPage() {
  await loadDashboardLocale();
  redirect("/banners?new=1");
}
