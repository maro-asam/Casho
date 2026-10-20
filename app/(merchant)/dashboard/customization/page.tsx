import { redirect } from "next/navigation";
import { readParam, type SearchParamsRecord } from "@/components/saas-page";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

/** Old customization tabs → Studio panels. */
const TAB_TO_PANEL: Record<string, string> = {
  theme: "theme",
  colors: "colors",
  fonts: "fonts",
  design: "layout",
  identity: "identity",
  sections: "sections",
  popups: "popups",
  whatsapp: "whatsapp",
  "social-proof": "social-proof",
};
const PASS_THROUGH = ["popup", "template", "name", "starts", "ends", "section"];

/**
 * Customization lives in the Studio (/builder) now — one place for the look of
 * the store, with live preview, drafts and publishing. Old links keep working.
 */
export default async function CustomizationRoute({ searchParams }: { searchParams?: Promise<SearchParamsRecord> }) {
  await loadDashboardLocale();
  const params = await searchParams;
  const query = new URLSearchParams();
  const panel = TAB_TO_PANEL[readParam(params, "tab") ?? ""];
  if (panel) query.set("panel", panel);
  for (const key of PASS_THROUGH) {
    const value = readParam(params, key);
    if (value) query.set(key, value);
  }
  const qs = query.toString();
  redirect(qs ? `/builder?${qs}` : "/builder");
}
