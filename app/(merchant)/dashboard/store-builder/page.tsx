import { redirect } from "next/navigation";

/**
 * /dashboard/store-builder → /builder
 *
 * The Visual Store Builder lives at the dedicated /builder route (app/(merchant)/(builder)/builder/).
 * This page is the dashboard-accessible entry point that merchants can bookmark or navigate to
 * from within the dashboard; it simply forwards them to the full-screen builder experience.
 */
export default function StoreBuilderPage() {
  redirect("/builder");
}
