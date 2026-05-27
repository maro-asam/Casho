import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Store as StoreIcon } from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { SubscriptionStatus } from "@prisma/client";
import StoreHome from "./_components/StoreHome";
import { resolveStoreTheme } from "@/constants/store-themes";
import type { ThemeCustomization } from "@/types/store-theme.types";

type StoreHomeRouteProps = {
  params: Promise<{ slug: string }>;
};

export default async function StoreHomeRoute({ params }: StoreHomeRouteProps) {
  const { slug } = await params;

  if (!slug) return notFound();

  const store = await prisma.store.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      subscriptionStatus: true,

      settings: {
        select: {
          themeId: true,
          description: true,
          coverImage: true,
          logo: true,
          primaryColor: true,
          secondaryColor: true,
          themeConfig: true,
        },
      },

      categories: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
        },
      },

      banners: {
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          image: true,
          isActive: true,
        },
      },

      products: {
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          price: true,
          compareAtPrice: true,
          image: true,
          isFeatured: true,
          isActive: true,
          category: {
            select: {
              name: true,
              slug: true,
              image: true,
            },
          },
        },
      },
    },
  });

  if (!store) return notFound();

  // ── Resolve theme + sections ──────────────────────────────────────────────
  const themeConfig = store.settings?.themeConfig as ThemeCustomization | null;
  const resolvedTheme = resolveStoreTheme(
    themeConfig?.presetId ?? store.settings?.themeId,
    themeConfig,
    store.settings?.primaryColor,
    store.settings?.secondaryColor,
  );
  const sections = resolvedTheme.sections.home;
  const sectionContent = resolvedTheme.sectionContent;

  // ── Best sellers query (only if section is enabled) ───────────────────────
  let bestSellers: Array<{
    id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice: number | null;
    image: string;
    isFeatured: boolean;
    isActive: boolean;
    salesCount: number;
    category: { name: string; slug: string; image: string | null } | null;
  }> = [];

  if (sections.showBestSellers) {
    const maxProducts = sectionContent.bestSellers?.maxProducts ?? 8;

    // Count sold units per product in this store's orders
    const topItems = await prisma.orderItem.groupBy({
      by: ["productId"],
      where: {
        order: { storeId: store.id },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: maxProducts,
    });

    if (topItems.length > 0) {
      const productIds = topItems.map((t) => t.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds }, isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          compareAtPrice: true,
          image: true,
          isFeatured: true,
          isActive: true,
          category: {
            select: { name: true, slug: true, image: true },
          },
        },
      });

      // Re-order by sales count and attach count
      bestSellers = productIds
        .map((id) => {
          const product = products.find((p) => p.id === id);
          if (!product) return null;
          const salesCount =
            topItems.find((t) => t.productId === id)?._sum.quantity ?? 0;
          return { ...product, salesCount };
        })
        .filter(Boolean) as typeof bestSellers;
    }
  }

  if (store.subscriptionStatus !== SubscriptionStatus.ACTIVE) {
    return (
      <div
        className="flex min-h-[70vh] items-center justify-center px-4"
        dir="rtl"
      >
        <Card className="w-full max-w-lg rounded-xl shadow-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-xl bg-muted">
              <StoreIcon className="size-7 text-muted-foreground" />
            </div>

            <CardTitle className="text-2xl">هذا المتجر غير مُفعّل</CardTitle>

            <CardDescription className="text-sm leading-6">
              يحتاج صاحب المتجر إلى تفعيل الاشتراك حتى يظهر المتجر للزوار بشكل
              كامل.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <StoreHome
      store={{
        ...store,
        bestSellers,
        // Override themeId with the resolved preset so StoreHome always uses
        // the same theme that the layout used for CSS vars (themeConfig.presetId
        // takes priority over the legacy themeId field).
        settings: store.settings
          ? { ...store.settings, themeId: resolvedTheme.id }
          : null,
      }}
      sections={sections}
      sectionContent={sectionContent}
    />
  );
}
