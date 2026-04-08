import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import NavbarVariantPicker from "./_components/NavbarVariantPicker";
import DashboardSectionHeader from "../../_components/main/DashboardSectionHeader";
import { PaintRoller } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "تخصيص المتجر",
};
  
export default async function CustomziationRoute() {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: {
      id: true,
      settings: {
        select: {
          navbarVariant: true,
        },
      },
    },
  });

  if (!store) {
    return <div>المتجر غير موجود</div>;
  }

  return (
    <div className="space-y-6" dir="rtl">
      <DashboardSectionHeader
        icon={PaintRoller}
        title="تخصيص المتجر"
        description={
          <>
            تخصيص متجرك بالشكل اللي يعجبك، من اختيار ألوان المتجر، لحد شكل
            النافبار وحتى إضافة شعار المتجر. كل ده عشان تقدر تقدم تجربة فريدة
            لعملائك وتعكس هوية متجرك بشكل أفضل.
          </>
        }
      />

      <NavbarVariantPicker
        storeId={store.id}
        currentVariant={
          store.settings?.navbarVariant as
            | "default"
            | "centered"
            | "compact"
            | null
        }
      />
    </div>
  );
}
