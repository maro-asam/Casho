import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { resolveStoreTheme } from "@/constants/store-themes";
import { readConversionConfig } from "@/lib/conversion/conversion-config";
import { isPopupType, readPopupConfig } from "@/lib/popups/popup-config";
import type { ThemeCustomization } from "@/types/store-theme.types";
import { BuilderProvider, type BuilderPopup, type PreviewDevice } from "./_components/BuilderContext";
import BuilderShell from "./_components/BuilderShell";

type BuilderPageProps = {
  searchParams?: Promise<{ device?: string; panel?: string }>;
};

export default async function BuilderPage({ searchParams }: BuilderPageProps) {
  const userId = await requireUserId();
  const params = await searchParams;

  const store = await prisma.store.findFirst({
    where: { userId },
    select: {
      id: true,
      slug: true,
      name: true,
      settings: {
        select: {
          themeId: true,
          navbarVariant: true,
          primaryColor: true,
          secondaryColor: true,
          fontId: true,
          storeLanguage: true,
          themeConfig: true,
          logo: true,
          coverImage: true,
          description: true,
          announcementText: true,
          whatsappNumber: true,
        },
      },
    },
  });

  if (!store) redirect("/dashboard");

  const themeConfig = store.settings?.themeConfig as ThemeCustomization | null;
  const resolvedTheme = resolveStoreTheme(
    themeConfig?.presetId ?? store.settings?.themeId,
    themeConfig,
    store.settings?.primaryColor,
    store.settings?.secondaryColor,
  );

  // Sales tools + a sample product for the page switcher. Guarded: never block the editor.
  const [conversionRow, popupRows, sampleProduct] = await Promise.all([
    (async () => prisma.storeSettings.findUnique({ where: { storeId: store.id }, select: { conversionConfig: true } }))().catch(
      () => null,
    ),
    (async () =>
      prisma.storePopup.findMany({
        where: { storeId: store.id },
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        select: { id: true, name: true, type: true, isActive: true, priority: true, config: true, endsAt: true },
      }))().catch(() => []),
    prisma.product
      .findFirst({ where: { storeId: store.id, isActive: true }, orderBy: { createdAt: "desc" }, select: { slug: true } })
      .catch(() => null),
  ]);

  const popups: BuilderPopup[] = popupRows
    .filter((p) => isPopupType(p.type))
    .map((p) => ({
      id: p.id,
      name: p.name,
      isActive: p.isActive,
      popup: {
        id: p.id,
        type: p.type as BuilderPopup["popup"]["type"],
        priority: p.priority,
        config: readPopupConfig(p.config),
        endsAt: p.endsAt?.toISOString() ?? null,
        couponExpiresAt: null,
      },
    }));

  const device: PreviewDevice = params?.device === "mobile" || params?.device === "tablet" ? params.device : "desktop";

  return (
    <BuilderProvider
      storeId={store.id}
      storeSlug={store.slug}
      storeName={store.name}
      currentThemeId={store.settings?.themeId ?? "default"}
      currentFontId={store.settings?.fontId ?? "cairo"}
      storeLanguage={store.settings?.storeLanguage ?? "ar"}
      primaryColor={store.settings?.primaryColor ?? null}
      secondaryColor={store.settings?.secondaryColor ?? null}
      currentLayout={resolvedTheme.layout}
      currentSections={resolvedTheme.sections}
      sectionContent={resolvedTheme.sectionContent}
      logo={store.settings?.logo ?? null}
      coverImage={store.settings?.coverImage ?? null}
      description={store.settings?.description ?? null}
      announcementText={store.settings?.announcementText ?? null}
      popups={popups}
      conversion={readConversionConfig(conversionRow?.conversionConfig)}
      whatsappFallback={store.settings?.whatsappNumber ?? null}
      sampleProductSlug={sampleProduct?.slug ?? null}
      initialDevice={device}
    >
      <BuilderShell />
    </BuilderProvider>
  );
}
