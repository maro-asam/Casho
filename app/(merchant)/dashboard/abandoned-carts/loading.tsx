import { ListPageSkeleton } from "@/components/saas-page";
import { tdir } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export default async function AbandonedCartsLoading() {
  await loadDashboardLocale();
  return (
    <div dir={tdir()}>
      <ListPageSkeleton thumb="square" actions={0} />
    </div>
  );
}
