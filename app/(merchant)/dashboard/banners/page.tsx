import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { GalleryHorizontal, Plus, SearchX, Store } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { Button } from "@/components/ui/button";
import {
  DataCard,
  EmptyState,
  FilterTabs,
  PageHeader,
  Pagination,
  SearchInput,
  hrefWith,
  readPage,
  readParam,
  type SearchParamsRecord,
} from "@/components/saas-page";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { prisma } from "@/lib/prisma";
import { UrlBannerDialog } from "./_components/banner-form-dialog";
import { BannersTable } from "./_components/banners-table";

export const metadata: Metadata = {
  title: "البانرز",
};

const PAGE_SIZE = 20;
const BASE_PATH = "/banners";

const STATUSES = {
  active: { label: "ظاهرة", isActive: true },
  hidden: { label: "مخفية", isActive: false },
} as const;
type Status = keyof typeof STATUSES;
const isStatus = (v: string | undefined): v is Status => !!v && v in STATUSES;

type BannersRouteProps = {
  searchParams?: Promise<SearchParamsRecord>;
};

export default async function BannersRoute({ searchParams }: BannersRouteProps) {
  const userId = await requireUserId();
  const params = await searchParams;

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, slug: true },
  });

  if (!store) {
    return (
      <EmptyState
        icon={Store}
        title="لسه معندكش متجر"
        description="أنشئ متجرك الأول عشان تقدر تضيف بانرز للصفحة الرئيسية."
        className="rounded-xl border border-dashed border-border"
      />
    );
  }

  // ── Filters (all in the URL so every view is shareable) ──────────────
  const q = readParam(params, "q");
  const statusParam = readParam(params, "status");
  const status = isStatus(statusParam) ? statusParam : undefined;
  const editId = readParam(params, "edit");
  const dialogMode = editId ? "edit" : readParam(params, "new") ? "new" : null;

  const baseWhere: Prisma.BannerWhereInput = {
    storeId: store.id,
    ...(q && { title: { contains: q, mode: "insensitive" } }),
  };

  // Tab counts respect search, so each number matches what its tab shows.
  const [statusCounts, storeBannerCount, editBanner] = await Promise.all([
    prisma.banner.groupBy({ by: ["isActive"], where: baseWhere, _count: { _all: true } }),
    prisma.banner.count({ where: { storeId: store.id } }),
    editId
      ? prisma.banner.findFirst({
          where: { id: editId, storeId: store.id },
          select: { id: true, title: true, image: true, isActive: true },
        })
      : Promise.resolve(null),
  ]);
  const countFor = (isActive: boolean) => statusCounts.find((c) => c.isActive === isActive)?._count._all ?? 0;
  const allCount = countFor(true) + countFor(false);
  const total = status ? countFor(STATUSES[status].isActive) : allCount;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(readPage(params), totalPages);

  const banners = await prisma.banner.findMany({
    where: { ...baseWhere, ...(status && { isActive: STATUSES[status].isActive }) },
    // Same order as the storefront slider.
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: { id: true, title: true, image: true, isActive: true, createdAt: true },
  });

  const hasFilters = Boolean(q || status);
  const currentPage = readParam(params, "page");
  const newHref = hrefWith(BASE_PATH, params, { new: 1, edit: null, page: currentPage });
  const editHref = (id: string) => hrefWith(BASE_PATH, params, { edit: id, new: null, page: currentPage });

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="البانرز"
        description="الصور اللي بتظهر أعلى الصفحة الرئيسية لمتجرك — للعروض والإعلانات."
        actions={
          storeBannerCount > 0 && (
            <Button asChild size="sm" className="gap-1.5">
              <Link href={newHref} scroll={false}>
                <Plus className="size-4" />
                بانر جديد
              </Link>
            </Button>
          )
        }
      />

      {storeBannerCount === 0 ? (
        <div className="rounded-xl border border-dashed border-border">
          <EmptyState
            icon={GalleryHorizontal}
            title="لسه مفيش بانرز"
            description="ضيف بانر لعرض أو خصم، وهيظهر أول حاجة في الصفحة الرئيسية لمتجرك."
            action={
              <Button asChild size="sm" className="gap-1.5">
                <Link href={newHref} scroll={false}>
                  <Plus className="size-4" />
                  ضيف أول بانر
                </Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          <FilterTabs
            label="حالة البانر"
            param="status"
            basePath={BASE_PATH}
            searchParams={params}
            tabs={[
              { label: "الكل", count: allCount },
              ...Object.entries(STATUSES).map(([value, s]) => ({ label: s.label, value, count: countFor(s.isActive) })),
            ]}
          />

          <DataCard
            toolbar={<SearchInput placeholder="ابحث بعنوان البانر" />}
            footer={
              total > 0 ? (
                <Pagination
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={total}
                  basePath={BASE_PATH}
                  searchParams={params}
                  noun="بانر"
                />
              ) : undefined
            }
          >
            {banners.length > 0 ? (
              <BannersTable
                banners={banners}
                storeId={store.id}
                storefrontUrl={buildStoreUrl(store.slug)}
                editHref={editHref}
              />
            ) : (
              <EmptyState
                icon={SearchX}
                title="مفيش بانرز بالفلاتر دي"
                description={q ? `مفيش نتايج لـ "${q}". جرّب عنوان تاني.` : "جرّب تبويب تاني."}
                action={
                  hasFilters && (
                    <Button asChild variant="outline" size="sm">
                      <Link href={BASE_PATH}>مسح الفلاتر</Link>
                    </Button>
                  )
                }
              />
            )}
          </DataCard>
        </div>
      )}

      <UrlBannerDialog storeId={store.id} mode={dialogMode} banner={editBanner} />
    </div>
  );
}
