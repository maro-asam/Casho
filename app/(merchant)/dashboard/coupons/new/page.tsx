import { Metadata } from "next";
import { TicketPercent } from "lucide-react";
import DashboardSectionHeader from "@/app/(merchant)/_components/main/DashboardSectionHeader";
import NewCouponForm from "@/app/(merchant)/_components/NewCouponForm";

export const metadata: Metadata = {
  title: "إضافة كوبون جديد",
  description: "إنشاء كوبون خصم جديد لمتجرك",
};

const NewCouponPage = () => {
  return (
    <div className="space-y-6 p-6" dir="rtl">
      <DashboardSectionHeader
        icon={TicketPercent}
        title="إضافة كوبون جديد"
        description="أنشئ كوبون خصم جديد وحدد نوعه ومدة صلاحيته وشروطه"
      />

      <NewCouponForm />
    </div>
  );
};

export default NewCouponPage;
