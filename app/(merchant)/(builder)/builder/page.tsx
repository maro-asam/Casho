import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { resolveStoreTheme } from "@/constants/store-themes";
import type { ThemeCustomization } from "@/types/store-theme.types";
import { BuilderProvider } from "./_components/BuilderContext";
import BuilderShell from "./_components/BuilderShell";

export default async function BuilderPage() {
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

  if (!store) redirect("/dashboard");

  const themeConfig = store.settings?.themeConfig as ThemeCustomization | null;
  const resolvedTheme = resolveStoreTheme(
    themeConfig?.presetId ?? store.settings?.themeId,
    themeConfig,
    store.settings?.primaryColor,
    store.settings?.secondaryColor,
  );

  return (
    <BuilderProvider
      storeId={store.id}
      storeSlug={store.slug}
      currentThemeId={store.settings?.themeId ?? "default"}
      currentFontId={store.settings?.fontId ?? "cairo"}
      primaryColor={store.settings?.primaryColor ?? null}
      secondaryColor={store.settings?.secondaryColor ?? null}
      currentLayout={resolvedTheme.layout}
      currentSections={resolvedTheme.sections}
      sectionContent={resolvedTheme.sectionContent}
      logo={store.settings?.logo ?? null}
      coverImage={store.settings?.coverImage ?? null}
      description={store.settings?.description ?? null}
      announcementText={store.settings?.announcementText ?? null}
    >
      <BuilderShell />
    </BuilderProvider>
  );
}
