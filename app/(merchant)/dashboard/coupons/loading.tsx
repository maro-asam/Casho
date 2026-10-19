import { SaasPageSkeleton } from "@/components/saas-page";
import { tdir } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export default async function CouponsLoading() {
  await loadDashboardLocale();
  return (
    <div dir={tdir()}>
      <SaasPageSkeleton tabs={6} columns={5} />
    </div>
  );
}
