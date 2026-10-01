import { SaasPageSkeleton } from "@/components/saas-page";

export default function CategoriesLoading() {
  return (
    <div dir="rtl">
      <SaasPageSkeleton tabs={3} columns={4} />
    </div>
  );
}
