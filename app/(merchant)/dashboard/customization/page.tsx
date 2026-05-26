import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import NavbarVariantPicker from "./_components/NavbarVariantPicker";
import DashboardSectionHeader from "../../_components/main/DashboardSectionHeader";
import { PaintRoller, LayoutTemplate } from "lucide-react";
import { Metadata } from "next";
import StoreColorsSection from "./_components/StoreColorsSection";
import ThemePicker from "./_components/ThemePicker";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "تخصيص المتجر",
};

export default async function CustomizationRoute() {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: {
      id: true,
      settings: {
        select: {
          navbarVariant: true,
          primaryColor: true,
          secondaryColor: true,
          themeId: true,
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
        description="اختر ثيم المتجر وألوانه وشكل القائمة العلوية لتعكس هوية متجرك"
      />

      {/* ── Themes ── */}
      <Card>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <LayoutTemplate className="size-4" />
            </div>
            <div>
              <h2 className="font-semibold">ثيم المتجر</h2>
              <p className="text-xs text-muted-foreground">
                اختر الشكل العام للمتجر — كل ثيم بيجيب معاه ألوان وتصميم مختلف
              </p>
            </div>
          </div>
          <ThemePicker
            storeId={store.id}
            currentThemeId={store.settings?.themeId}
          />
        </CardContent>
      </Card>

      {/* ── Colors ── */}
      <StoreColorsSection store={store} />

      {/* ── Navbar ── */}
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
