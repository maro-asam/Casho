import { SaasPageSkeleton } from "@/components/saas-page";

export default function ProductsLoading() {
  return (
    <div dir="rtl">
      <SaasPageSkeleton tabs={5} columns={6} />
    </div>
  );
}
