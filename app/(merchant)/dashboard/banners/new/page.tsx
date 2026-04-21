import { prisma } from "@/lib/prisma";
import { ImageIcon } from "lucide-react";

import DashboardSectionHeader from "../../../_components/main/DashboardSectionHeader";
import NewBannerForm from "@/app/(merchant)/dashboard/banners/_components/NewBannerForm";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "إضافة بانر جديد",
};

export default async function NewBannerRoute() {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, name: true },
  });

  if (!store) {
    return <div className="p-6">لم يتم العثور على متجر</div>;
  }

  return (
    <div className="space-y-6" dir="rtl">
      <DashboardSectionHeader
        icon={ImageIcon}
        title="إضافة بانر جديد"
        description={
          <>
            أضف بانر جديد ليظهر داخل متجر{" "}
            <span className="font-semibold text-foreground">{store.name}</span>
          </>
        }
      />

      <NewBannerForm storeId={store.id} />
    </div>
  );
}
