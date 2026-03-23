import { requireAuth } from "@/actions/auth/require.actions";
import { prisma } from "@/lib/prisma";
import { ImageIcon } from "lucide-react";

import DashboardSectionHeader from "../../../_components/main/DashboardSectionHeader";
import { Card, CardContent } from "@/components/ui/card";
import NewBannerForm from "@/app/(merchant)/_components/NewBannerForm";

export default async function NewBannerRoute() {
  const userId = await requireAuth();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, name: true },
  });

  if (!store) {
    return <div className="p-6">لم يتم العثور على متجر</div>;
  }

  return (
    <div className="space-y-6 p-6" dir="rtl">
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
