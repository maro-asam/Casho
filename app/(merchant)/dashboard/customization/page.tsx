import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import DashboardSectionHeader from "../../_components/main/DashboardSectionHeader";
import { PaintRoller, Wand2 } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { resolveStoreTheme } from "@/constants/store-themes";
import type { ThemeCustomization } from "@/types/store-theme.types";
import CustomizationTabs from "./_components/CustomizationTabs";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "تخصيص المتجر",
};

export default async function CustomizationRoute() {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: {
      id: true,
      slug: true,
      settings: {
        select: {
          themeId: true,
          navbarVariant: true,
          primaryColor: true,
          secondaryColor: true,
          fontId: true,
          themeConfig: true,
          logo: true,
          coverImage: true,
          description: true,
          announcementText: true,
        },
      },
    },
  });

  if (!store) {
    return <div>المتجر غير موجود</div>;
  }

  // Resolve full theme (preset + any saved overrides)
  const themeConfig = store.settings?.themeConfig as ThemeCustomization | null;
  const resolvedTheme = resolveStoreTheme(
    themeConfig?.presetId ?? store.settings?.themeId,
    themeConfig,
    store.settings?.primaryColor,
    store.settings?.secondaryColor,
  );

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-start justify-between gap-4">
        <DashboardSectionHeader
          icon={PaintRoller}
          title="تخصيص المتجر"
          description="صمّم متجرك بالكامل — اختر الثيم والألوان والخطوط وتحكم في كل قسم"
        />
        <Button asChild className="gap-2 shrink-0">
          <Link href="/builder">
            <Wand2 className="size-4" />
            المحرر المرئي
          </Link>
        </Button>
      </div>

      <CustomizationTabs
        storeId={store.id}
        storeSlug={store.slug}
        currentThemeId={store.settings?.themeId}
        currentFontId={store.settings?.fontId}
        primaryColor={store.settings?.primaryColor}
        secondaryColor={store.settings?.secondaryColor}
        navbarVariant={store.settings?.navbarVariant}
        currentLayout={resolvedTheme.layout}
        currentSections={resolvedTheme.sections}
        sectionContent={resolvedTheme.sectionContent}
        logo={store.settings?.logo}
        coverImage={store.settings?.coverImage}
        description={store.settings?.description}
        announcementText={store.settings?.announcementText}
      />
    </div>
  );
}
