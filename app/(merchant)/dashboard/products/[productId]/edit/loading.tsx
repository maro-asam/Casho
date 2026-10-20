import { tdir } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";
import { FormPageSkeleton } from "@/components/saas-page";

export default async function ProductFormLoading() {
  await loadDashboardLocale();
  return (
    <div dir={tdir()}>
      <FormPageSkeleton />
    </div>
  );
}
