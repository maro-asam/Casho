import { redirect } from "next/navigation";

/**
 * Permanent redirect — Instagram integration moved to /dashboard/integrations/instagram
 * Old bookmarks and any cached links still work.
 */
export default function InstagramPageRedirect() {
  redirect("/dashboard/integrations/instagram");
}
