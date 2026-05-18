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
// import { StoreVisitTracker } from "@/components/tracking/store-visit-tracker";
import StoreThemeRenderer from "./_themes/StoreThemeRenderer";

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
        },
      },

      categories: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
        },
      },

      banners: {
        where: {
          isActive: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          title: true,
          image: true,
          isActive: true,
        },
      },

      products: {
        where: {
          isActive: true,
        },
        orderBy: {
          createdAt: "desc",
        },
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
    <>
      {/* <StoreVisitTracker storeId={store.id} /> */}
      <StoreThemeRenderer themeId={store.settings?.themeId} store={store} />
    </>
  );
}