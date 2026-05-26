import Link from "next/link";
import Image from "next/image";
import { ImageIcon, Plus, Eye, EyeOff, LayoutPanelTop } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { GetBannersAction } from "@/actions/admin/banner.actions";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DashboardSectionHeader from "../../_components/main/DashboardSectionHeader";
import DeleteBannerButton from "./_components/DeleteBannerButton";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "إدارة البانرز",
};

type StatCardProps = {
  icon: React.ElementType;
  label: string;
  value: number;
  variant: "default" | "success" | "warning";
};

function StatCard({ icon: Icon, label, value, variant }: StatCardProps) {
  const iconClass = {
    default: "bg-muted text-muted-foreground",
    success:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    warning:
      "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
  }[variant];

  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
        >
          <Icon className="size-4.5" />
        </div>
        <div className="min-w-0">
          <p className="text-xl font-bold leading-none">{value}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {label}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

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
            <h2 className="text-xl font-semibold">لم يتم العثور على متجر</h2>
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
  const activeBanners = banners.filter((b) => b.isActive).length;
  const inactiveBanners = totalBanners - activeBanners;

  return (
    <div className="space-y-6" dir="rtl">
      <DashboardSectionHeader
        icon={LayoutPanelTop}
        title="إدارة البانرز"
        badge={totalBanners}
        description={
          <>
            بانرز متجر{" "}
            <span className="font-semibold text-foreground">{store.name}</span>
          </>
        }
        actionLabel="إضافة بانر"
        actionHref="/dashboard/banners/new"
      />

      {totalBanners > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard
            icon={LayoutPanelTop}
            label="إجمالي البانرز"
            value={totalBanners}
            variant="default"
          />
          <StatCard
            icon={Eye}
            label="بانرز نشطة"
            value={activeBanners}
            variant="success"
          />
          <StatCard
            icon={EyeOff}
            label="بانرز مخفية"
            value={inactiveBanners}
            variant={inactiveBanners > 0 ? "warning" : "default"}
          />
        </div>
      )}

      {banners.length === 0 ? (
        <Card className="rounded-xl border-dashed shadow-sm">
          <CardContent className="flex min-h-80 flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-muted">
              <LayoutPanelTop className="size-7 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">لا توجد بانرز بعد</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              أضف أول بانر لعرض العروض أو الإعلانات أو الرسائل المهمة بشكل
              واضح وجذاب داخل متجرك.
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
              className="group overflow-hidden rounded-xl border bg-background p-0 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Image */}
              <div className="relative aspect-video w-full overflow-hidden bg-muted">
                <Image
                  src={banner.image}
                  alt={banner.title}
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  fill
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />

                {/* Index badge */}
                <div className="absolute inset-s-3 top-3">
                  <Badge className="rounded-lg bg-black/50 text-white backdrop-blur-sm hover:bg-black/50">
                    #{index + 1}
                  </Badge>
                </div>

                {/* Status badge */}
                <div className="absolute inset-e-3 top-3">
                  {banner.isActive ? (
                    <Badge className="rounded-lg bg-emerald-500/90 text-white backdrop-blur-sm hover:bg-emerald-500/90">
                      <Eye className="me-1 size-3" />
                      نشط
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="rounded-lg backdrop-blur-sm"
                    >
                      <EyeOff className="me-1 size-3" />
                      مخفي
                    </Badge>
                  )}
                </div>
              </div>

              {/* Content */}
              <CardContent className="p-4">
                <div className="mb-3 space-y-1">
                  <h3 className="truncate font-semibold">{banner.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    أُضيف في{" "}
                    {new Date(banner.createdAt).toLocaleDateString("ar-EG", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                <DeleteBannerButton
                  bannerId={banner.id}
                  storeId={store.id}
                  bannerTitle={banner.title}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
