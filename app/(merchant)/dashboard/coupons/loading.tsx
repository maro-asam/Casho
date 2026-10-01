import { SaasPageSkeleton } from "@/components/saas-page";

export default function CouponsLoading() {
  return (
    <div dir="rtl">
      <SaasPageSkeleton tabs={6} columns={5} />
    </div>
  );
}
