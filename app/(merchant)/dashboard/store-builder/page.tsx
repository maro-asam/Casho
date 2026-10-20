import { redirect } from "next/navigation";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

/** Old bookmark for the visual editor → the Studio. */
export default async function StoreBuilderPage() {
  await loadDashboardLocale();
  redirect("/builder");
}
