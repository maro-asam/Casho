import { redirect } from "next/navigation";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

// Adding happens in a dialog on the list page; keep old links working.
export default async function NewCategoryPage() {
  await loadDashboardLocale();
  redirect("/categories?new=1");
}
