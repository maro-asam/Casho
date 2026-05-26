import { ReactNode, CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { GetCartItemsAction } from "@/actions/store/cart.actions";
import StoreFrontHeader from "./_components/NAVBARS/StoreHeader";
import StoreFooter from "./_components/shared/StoreFooter";
import { getStoreTheme } from "@/constants/store-themes";
import type { StoreNavbarVariant } from "@/constants/store-navbar";
import { getArabicFont } from "@/constants/arabic-fonts";

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ slug: string }>;
};

function getContrastColor(hex: string) {
  const cleanHex = hex.replace("#", "");

  if (cleanHex.length !== 6) return "#ffffff";

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 155 ? "#000000" : "#ffffff";
}

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

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://casho.store";

  try {
    return new URL(image, appUrl).toString();
  } catch {
    return undefined;
  }
}

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
    alternates: {
      canonical: url,
    },
    robots: isIndexed
      ? {
          index: true,
          follow: true,
        }
      : {
          index: false,
          follow: false,
          nocache: true,
        },
    openGraph: {
      title: store.settings?.ogTitle || title,
      description: store.settings?.ogDescription || description,
      url,
      siteName: store.name,
      type: "website",
      locale: "ar_EG",
      images: image
        ? [
            {
              url: image,
              width: 1200,
              height: 630,
              alt: store.name,
            },
          ]
        : [],
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: store.settings?.ogTitle || title,
      description: store.settings?.ogDescription || description,
      images: image ? [image] : [],
    },
  };
}

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
          themeId: true,
          fontId: true,
          primaryColor: true,
          secondaryColor: true,
          navbarVariant: true,
          announcementText: true,
        },
      },
    },
  });

  if (!store) return notFound();

  const { items } = await GetCartItemsAction(slug);

  const cartCount = items.reduce((total, item) => total + item.quantity, 0);

  const theme = getStoreTheme(store.settings?.themeId);
  const font = getArabicFont(store.settings?.fontId);

  const primaryColor =
    store.settings?.primaryColor || theme.tokens.primaryColor;
  const secondaryColor =
    store.settings?.secondaryColor || theme.tokens.secondaryColor;

  const navbarVariant = (store.settings?.navbarVariant ||
    theme.navbarVariant) as StoreNavbarVariant;

  const storeThemeStyle = {
    "--store-primary": primaryColor,
    "--store-primary-foreground": getContrastColor(primaryColor),

    "--store-secondary": secondaryColor,
    "--store-secondary-foreground": getContrastColor(secondaryColor),

    "--store-background": theme.tokens.background,
    "--store-surface": theme.tokens.surface,
    "--store-card": theme.tokens.card,
    "--store-muted": theme.tokens.muted,
    "--store-border": theme.tokens.border,
    "--store-radius": theme.tokens.radius,
    "--store-hero-overlay": theme.tokens.heroOverlay,

    "--primary": "var(--store-primary)",
    "--primary-foreground": "var(--store-primary-foreground)",
    "--secondary": "var(--store-secondary)",
    "--secondary-foreground": "var(--store-secondary-foreground)",
    fontFamily: font.family,
  } as CSSProperties;

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={font.googleUrl} />
    <div
      dir="rtl"
      style={storeThemeStyle}
      className="min-h-screen text-foreground"
    >
      <StoreFrontHeader
        storeName={store.name}
        storeSlug={store.slug}
        logo={store.settings?.logo}
        cartCount={cartCount}
        announcementText={store.settings?.announcementText}
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
    </>
  );
}
