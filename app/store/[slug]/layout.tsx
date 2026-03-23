import { ReactNode, CSSProperties } from "react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

import { GetCartItemsAction } from "@/actions/store/cart.actions";
import StoreFrontHeader from "./_components/shared/StoreHeader";
import StoreFooter from "./_components/shared/StoreFooter";

type LayoutProps = {
  children: ReactNode;
  params: Promise<{
    slug: string;
  }>;
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

export default async function StoreLayout({ children, params }: LayoutProps) {
  const { slug } = await params;

  if (!slug) return notFound();

  const store = await prisma.store.findUnique({
    where: { slug },
    select: {
      name: true,
      slug: true,
      settings: {
        select: {
          logo: true,
          primaryColor: true,
          secondaryColor: true,
        },
      },
    },
  });

  if (!store) return notFound();

  const { items } = await GetCartItemsAction(slug);

  const primaryColor = store.settings?.primaryColor || "#6366f1";
  const secondaryColor = store.settings?.secondaryColor || "#f3f4f6";

  const storeThemeStyle = {
    "--store-primary": primaryColor,
    "--store-primary-foreground": getContrastColor(primaryColor),
    "--store-secondary": secondaryColor,
    "--store-secondary-foreground": getContrastColor(secondaryColor),
    "--primary": "var(--store-primary)",
    "--primary-foreground": "var(--store-primary-foreground)",
    "--secondary": "var(--store-secondary)",
    "--secondary-foreground": "var(--store-secondary-foreground)",
  } as CSSProperties;

  return (
    <div
      style={storeThemeStyle}
      className="min-h-screen max-w-screen-2xl mx-auto flex flex-col bg-background text-foreground px-6"
    >
      <StoreFrontHeader
        storeName={store.name}
        storeSlug={store.slug}
        logo={store.settings?.logo}
        cartCount={items.length}
      />

      <main className="flex-1">{children}</main>

      <StoreFooter storeName={store.name} storeSlug={store.slug} />
    </div>
  );
}