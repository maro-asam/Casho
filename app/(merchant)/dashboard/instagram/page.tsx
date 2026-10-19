import { redirect } from "next/navigation";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

/**
 * Permanent redirect — Instagram integration moved to /dashboard/integrations/instagram
 * Old bookmarks and any cached links still work.
 */
export default async function InstagramPageRedirect() {
  await loadDashboardLocale();
  redirect("/integrations/instagram");
}
