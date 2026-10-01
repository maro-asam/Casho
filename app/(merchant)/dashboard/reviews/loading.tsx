import { SaasPageSkeleton } from "@/components/saas-page";

export default function ReviewsLoading() {
  return (
    <div dir="rtl">
      <SaasPageSkeleton tabs={6} columns={4} />
    </div>
  );
}
