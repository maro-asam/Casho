import { SaasPageSkeleton } from "@/components/saas-page";

export default function AbandonedCartsLoading() {
  return (
    <div dir="rtl">
      <SaasPageSkeleton tabs={5} columns={5} />
    </div>
  );
}
