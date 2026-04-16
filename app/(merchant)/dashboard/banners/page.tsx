import Link from "next/link";
import Image from "next/image";
import { ImageIcon, Plus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import {
  DeleteBannerAction,
  GetBannersAction,
} from "@/actions/admin/banner.actions";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DashboardSectionHeader from "../../_components/main/DashboardSectionHeader";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "إدارة البانرز",
};

export default async function BannersPage() {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, name: true },
  });

  if (!store) {
    return (
      <div className="p-6" dir="rtl">
        <Card className="rounded-xl border-dashed">
          <CardContent className="flex min-h-55 flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
              <ImageIcon className="size-6 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold">لم يتم العثور على متجر</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              يجب إنشاء متجر أولًا حتى تتمكن من إدارة البانرز وعرض العروض
              والإعلانات داخل متجرك.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const banners = await GetBannersAction(store.id);
  const totalBanners = banners.length;

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <DashboardSectionHeader
        icon={ImageIcon}
        title="إدارة البانرز"
        badge={totalBanners}
        description={
          <>
            إدارة بانرز متجر{" "}
            <span className="font-semibold text-foreground">{store.name}</span>
          </>
        }
        actionLabel="إضافة بانر جديد"
        actionHref="/dashboard/banners/new"
      />

      {banners.length === 0 ? (
        <Card className="rounded-xl border-dashed shadow-sm">
          <CardContent className="flex min-h-80 flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-muted">
              <ImageIcon className="size-7 text-muted-foreground" />
            </div>

            <h2 className="text-xl font-bold">لا توجد بانرز بعد</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              أضف أول بانر لعرض العروض أو الإعلانات أو الرسائل المهمة بشكل واضح
              وجذاب داخل متجرك.
            </p>

            <Button asChild className="mt-6 rounded-xl">
              <Link href="/dashboard/banners/new">
                <Plus className="me-2 size-4" />
                إضافة أول بانر
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {banners.map((banner, index) => (
            <Card
              key={banner.id}
              className="p-0 overflow-hidden rounded-xl border bg-background shadow-sm transition hover:shadow-md"
            >
              <div className="relative aspect-16/8 w-full overflow-hidden">
                <Image
                  src={banner.image}
                  alt={banner.title}
                  className="object-cover "
                  fill
                />
              </div>

              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-base font-semibold">
                        {banner.title}
                      </h3>
                      <Badge variant="secondary" className="rounded-xl">
                        #{index + 1}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span className="truncate rounded-xl bg-muted px-2 py-1 font-mono text-xs">
                        Banner
                      </span>
                      <Badge variant="outline" className="rounded-xl">
                        صورة عرض
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-5 pt-0">
                <form
                  action={async () => {
                    "use server";
                    await DeleteBannerAction(banner.id, store.id);
                  }}
                  className="w-full"
                >
                  <Button
                    type="submit"
                    variant="destructive"
                    className="w-full rounded-xl"
                  >
                    حذف البانر
                  </Button>
                </form>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
