import { FormPageSkeleton } from "@/components/saas-page";
import { tdir } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export default async function OfferFormLoading() {
  await loadDashboardLocale();
  return (
    <div dir={tdir()}>
      <FormPageSkeleton />
    </div>
  );
}
