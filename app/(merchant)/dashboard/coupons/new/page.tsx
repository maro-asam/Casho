import { redirect } from "next/navigation";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

// Creating happens in a dialog on the list page; keep old links working.
export default async function NewCouponPage() {
  await loadDashboardLocale();
  redirect("/coupons?new=1");
}
