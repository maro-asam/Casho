import { ReactNode } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { GetCartItemsAction } from "@/actions/store/cart.actions";
import StoreFrontHeader from "./_components/NAVBARS/StoreHeader";
import StoreFooter from "./_components/shared/StoreFooter";
import { resolveStoreTheme } from "@/constants/store-themes";
import { buildThemeCSSString } from "@/lib/theme/build-css-vars";
import { StoreThemeProvider } from "./_context/StoreThemeContext";
import { getStoreFont } from "@/constants/arabic-fonts";
import type { StoreNavbarVariant } from "@/constants/store-navbar";
import type { ThemeCustomization } from "@/types/store-theme.types";
import { StoreBuilderBridge } from "./_components/StoreBuilderBridge";

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ slug: string }>;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildStoreUrl(slug: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://casho.store";
  try {
    const url = new URL(appUrl);
    return `https://${slug}.${url.host}`;
  } catch {
    return `https://${slug}.casho.store`;
  }
}

function getAbsoluteImageUrl(image: string | null | undefined) {
  if (!image) return undefined;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://casho.store";
  try {
    return new URL(image, appUrl).toString();
  } catch {
    return undefined;
  }
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!slug) return {};

  const store = await prisma.store.findUnique({
    where: { slug },
    select: {
      name: true,
      slug: true,
      settings: {
        select: {
          seoTitle: true,
          seoDescription: true,
          seoKeywords: true,
          ogTitle: true,
          ogDescription: true,
          ogImage: true,
          isIndexed: true,
          logo: true,
        },
      },
    },
  });

  if (!store) return {};

  const title = store.settings?.seoTitle || store.name;
  const description =
    store.settings?.seoDescription ||
    `تصفح منتجات ${store.name} واطلب بسهولة من خلال المتجر الإلكتروني.`;

  const url = buildStoreUrl(store.slug);
  const image =
    getAbsoluteImageUrl(store.settings?.ogImage) ||
    getAbsoluteImageUrl(store.settings?.logo);

  const isIndexed = store.settings?.isIndexed ?? true;

  return {
    title,
    description,
    icons: {
      icon: image || "/favicon.ico",
      shortcut: image || "/favicon.ico",
      apple: image || "/favicon.ico",
    },
    keywords: store.settings?.seoKeywords ?? [],
    alternates: { canonical: url },
    robots: isIndexed
      ? { index: true, follow: true }
      : { index: false, follow: false, nocache: true },
    openGraph: {
      title: store.settings?.ogTitle || title,
      description: store.settings?.ogDescription || description,
      url,
      siteName: store.name,
      type: "website",
      locale: "ar_EG",
      images: image ? [{ url: image, width: 1200, height: 630, alt: store.name }] : [],
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: store.settings?.ogTitle || title,
      description: store.settings?.ogDescription || description,
      images: image ? [image] : [],
    },
  };
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default async function StoreLayout({ children, params }: LayoutProps) {
  const { slug } = await params;
  if (!slug) return notFound();

  const store = await prisma.store.findUnique({
    where: { slug },
    select: {
      name: true,
      slug: true,
      showPoweredByCasho: true,
      poweredByRemovalEnabled: true,
      settings: {
        select: {
          logo: true,
          logoRadius: true,
          themeId: true,
          fontId: true,
          storeLanguage: true,
          primaryColor: true,
          secondaryColor: true,
          navbarVariant: true,
          announcementText: true,
          themeConfig: true,
          showStoreName: true,
        },
      },
    },
  });

  if (!store) return notFound();

  const { items } = await GetCartItemsAction(slug);
  const cartCount = items.reduce((total, item) => total + item.quantity, 0);

  // ── Resolve theme ──────────────────────────────────────────────────────
  // Priority (highest → lowest):
  //   1. themeConfig JSON (full merchant customization)
  //   2. Legacy primaryColor / secondaryColor overrides
  //   3. themeId preset defaults
  const themeConfig = store.settings?.themeConfig as ThemeCustomization | null;

  const resolvedTheme = resolveStoreTheme(
    themeConfig?.presetId ?? store.settings?.themeId,
    themeConfig,
    store.settings?.primaryColor,
    store.settings?.secondaryColor,
  );

  // ── Navbar ─────────────────────────────────────────────────────────────
  // Merchant can override via navbarVariant in StoreSettings, otherwise
  // falls back to the theme preset's default.
  const navbarVariant = (
    store.settings?.navbarVariant || resolvedTheme.layout.navbar
  ) as StoreNavbarVariant;

  // ── Language & Font ────────────────────────────────────────────────────
  const storeLanguage = store.settings?.storeLanguage ?? "ar";
  const storeDir = storeLanguage === "en" ? "ltr" : "rtl";
  const font = getStoreFont(store.settings?.fontId);

  // ── CSS custom properties ──────────────────────────────────────────────
  const themeCSS = buildThemeCSSString(resolvedTheme, font.family, resolvedTheme.darkTokens);

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={font.googleUrl} />

      {/*
        Inject theme CSS vars + grid rules as a stylesheet rule instead of inline
        styles. Using a <style> block allows the `.dark .store-theme-root` selector
        to override the base `.store-theme-root` vars when next-themes adds the
        `.dark` class, which inline styles cannot do (inline specificity is highest).
      */}
      <style>{themeCSS}</style>

      {/*
        StoreThemeProvider is a Client Component, but it receives a serializable
        ResolvedTheme object from this Server Component — this is valid in Next.js.
        CSS vars are injected via the <style> block above; the class wires it up.
      */}
      <StoreThemeProvider theme={resolvedTheme}>
        <StoreBuilderBridge />
        <div dir={storeDir} className="store-theme-root min-h-screen">
          <StoreFrontHeader
            storeName={store.name}
            storeSlug={store.slug}
            logo={store.settings?.logo}
            logoRadius={store.settings?.logoRadius}
            cartCount={cartCount}
            announcementText={store.settings?.announcementText}
            showStoreName={store.settings?.showStoreName ?? true}
            variant={navbarVariant}
          />

          <main className="min-h-screen">{children}</main>

          <StoreFooter
            storeName={store.name}
            storeSlug={store.slug}
            showPoweredByCasho={
              store.poweredByRemovalEnabled ? store.showPoweredByCasho : true
            }
          />
        </div>
      </StoreThemeProvider>
    </>
  );
}
