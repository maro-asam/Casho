import { SaasPageSkeleton } from "@/components/saas-page";

export default function BalanceHistoryLoading() {
  return (
    <div dir="rtl">
      <SaasPageSkeleton tabs={4} columns={5} />
    </div>
  );
}
