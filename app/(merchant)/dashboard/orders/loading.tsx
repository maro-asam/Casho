import { SaasPageSkeleton } from "@/components/saas-page";

export default function OrdersLoading() {
  return (
    <div dir="rtl">
      <SaasPageSkeleton tabs={6} columns={6} />
    </div>
  );
}
