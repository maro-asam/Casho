import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { GalleryHorizontal, Plus, SearchX, Store } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import {
  LargeTitle,
  Pager,
  Segmented,
  SearchInput,
  Unavailable,
  appleButton,
  readPage,
  readParam,
  type SearchParamsRecord,
} from "@/components/saas-page";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { prisma } from "@/lib/prisma";
import {
  BANNER_LINK_TYPES,
  BANNER_PAGES,
  bannerStatus,
  isBannerPageKey,
  liveBannerWhere,
  type BannerStatus,
} from "@/lib/banners/banner-link";
import { BannersTable, type BannerRow } from "./_components/banners-table";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
  title: tr("البانرز"),
};
}

const PAGE_SIZE = 20;
const BASE_PATH = "/banners";

const STATUS_LABELS: Record<BannerStatus, string> = {
  get live() { return tr("ظاهرة الآن"); },
  get scheduled() { return tr("مجدولة"); },
  get expired() { return tr("منتهية"); },
  get hidden() { return tr("مخفية"); },
};
const isStatus = (v: string | undefined): v is BannerStatus => !!v && v in STATUS_LABELS;

/** Same split as `bannerStatus()`, as Prisma filters. */
function statusWhere(status: BannerStatus, now: Date): Prisma.BannerWhereInput {
  switch (status) {
    case "live":
      return liveBannerWhere(now);
    case "scheduled":
      return { isActive: true, startsAt: { gt: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] };
    case "expired":
      return { isActive: true, endsAt: { lte: now } };
    case "hidden":
      return { isActive: false };
  }
}

type BannersRouteProps = {
  searchParams?: Promise<SearchParamsRecord>;
};

export default async function BannersRoute({ searchParams }: BannersRouteProps) {
  await loadDashboardLocale();
  const userId = await requireUserId();
  const params = await searchParams;

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, slug: true, settings: { select: { whatsappNumber: true } } },
  });

  if (!store) {
    return (
      <div className="apple-card" dir={tdir()}>
        <Unavailable
          icon={Store}
          title={tr("لسه معندكش متجر")}
          description={tr("أنشئ متجرك الأول عشان تقدر تضيف بانرز للصفحة الرئيسية.")}
        />
      </div>
    );
  }

  // ── Filters (all in the URL so every view is shareable) ──────────────
  const q = readParam(params, "q");
  const statusParam = readParam(params, "status");
  const status = isStatus(statusParam) ? statusParam : undefined;
  // Add / edit used to be a dialog on this page; keep those links working.
  const legacyEdit = readParam(params, "edit");
  if (legacyEdit) redirect(`/banners/${encodeURIComponent(legacyEdit)}/edit`);
  if (readParam(params, "new")) redirect("/banners/new");

  const now = new Date();
  const baseWhere: Prisma.BannerWhereInput = {
    storeId: store.id,
    ...(q && { title: { contains: q, mode: "insensitive" } }),
  };
  const statuses = Object.keys(STATUS_LABELS) as BannerStatus[];

  // Tab counts respect search, so each number matches what its tab shows.
  const [statusCounts, allCount, storeBannerCount] = await Promise.all([
    Promise.all(statuses.map((st) => prisma.banner.count({ where: { ...baseWhere, ...statusWhere(st, now) } }))),
    prisma.banner.count({ where: baseWhere }),
    prisma.banner.count({ where: { storeId: store.id } }),
  ]);
  const countFor = (st: BannerStatus) => statusCounts[statuses.indexOf(st)];
  const total = status ? countFor(status) : allCount;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(readPage(params), totalPages);

  const rows = await prisma.banner.findMany({
    where: { ...baseWhere, ...(status && statusWhere(status, now)) },
    // Same order as the storefront slider.
    orderBy: [{ position: "asc" }, { createdAt: "desc" }, { id: "asc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      title: true,
      image: true,
      isActive: true,
      startsAt: true,
      endsAt: true,
      clicks: true,
      createdAt: true,
      linkType: true,
      linkValue: true,
      linkCategory: { select: { name: true } },
      linkProduct: { select: { name: true, isActive: true } },
    },
  });
  const banners: BannerRow[] = rows.map((b) => ({
    ...b,
    status: bannerStatus(b, now),
    destination: describeDestination(b, Boolean(store.settings?.whatsappNumber)),
  }));

  const hasFilters = Boolean(q || status);
  const storefrontUrl = buildStoreUrl(store.slug);
  const newHref = "/banners/new";
  const editHref = (id: string) => `/banners/${id}/edit`;

  return (
    <div className="space-y-6" dir={tdir()}>
      <LargeTitle
        title={tr("البانرز")}
        subtitle={tr("الصور اللي بتظهر أعلى الصفحة الرئيسية لمتجرك — اختار كل بانر يودّي العميل فين، ورتّبها وجدولها للعروض.")}
        actions={
          storeBannerCount > 0 && (
            // The one prominent action on the page.
            <Link href={newHref} className={appleButton.filled}>
              <Plus className="size-4" strokeWidth={2.4} />
              {tr("بانر جديد")}
            </Link>
          )
        }
      />

      {storeBannerCount === 0 ? (
        <div className="apple-card">
          <Unavailable
            icon={GalleryHorizontal}
            title={tr("لسه مفيش بانرز")}
            description={tr("ضيف بانر لعرض أو خصم، وهيظهر أول حاجة في الصفحة الرئيسية لمتجرك.")}
            action={
              <Link href={newHref} className={`${appleButton.filled} h-9 px-4`}>
                <Plus className="size-4" strokeWidth={2.4} />
                {tr("ضيف أول بانر")}
              </Link>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          <Segmented
            label={tr("حالة البانر")}
            param="status"
            basePath={BASE_PATH}
            searchParams={params}
            segments={[
              { label: tr("الكل"), count: allCount },
              ...statuses.map((value) => ({ label: STATUS_LABELS[value], value, count: countFor(value) })),
            ]}
          />

          <section className="apple-card overflow-hidden">
            <div className="p-4 sm:px-5">
              <SearchInput
                placeholder={tr("ابحث بعنوان البانر")}
                className="sm:max-w-sm"
                inputClassName="h-9 rounded-[10px] border-0 bg-muted text-[15px] focus-visible:ring-primary/40"
              />
            </div>

            {banners.length > 0 ? (
              <BannersTable
                banners={banners}
                storeId={store.id}
                storefrontUrl={storefrontUrl}
                editHref={editHref}
                reorderable={!hasFilters}
                firstId={!hasFilters && page === 1 ? banners[0]?.id : undefined}
                lastId={!hasFilters && page === totalPages ? banners.at(-1)?.id : undefined}
              />
            ) : (
              <Unavailable
                icon={SearchX}
                title={tr("مفيش بانرز بالفلاتر دي")}
                description={q ? tr("مفيش نتايج لـ \"{0}\". جرّب عنوان تاني.", q) : tr("جرّب تبويب تاني.")}
                className="border-t-[0.5px] border-border"
                action={
                  hasFilters && (
                    <Link href={BASE_PATH} className={appleButton.tinted}>
                      {tr("مسح الفلاتر")}
                    </Link>
                  )
                }
              />
            )}

            {total > 0 && (
              <div className="border-t-[0.5px] border-border">
                <Pager page={page} pageSize={PAGE_SIZE} total={total} basePath={BASE_PATH} searchParams={params} noun={tr("بانر")} />
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

/** One-line "where does it go" for the table, flagging targets that went missing. */
function describeDestination(
  b: {
    linkType: BannerRow["linkType"];
    linkValue: string | null;
    linkCategory: { name: string } | null;
    linkProduct: { name: string; isActive: boolean } | null;
  },
  hasWhatsapp: boolean,
): BannerRow["destination"] {
  const label = BANNER_LINK_TYPES[b.linkType].label;
  switch (b.linkType) {
    case "CATEGORY":
      return b.linkCategory ? { label, detail: b.linkCategory.name } : { label, warning: tr("القسم اتمسح — بيودّي على كل المنتجات") };
    case "PRODUCT":
      if (!b.linkProduct) return { label, warning: tr("المنتج اتمسح — بيودّي على كل المنتجات") };
      return b.linkProduct.isActive
        ? { label, detail: b.linkProduct.name }
        : { label, detail: b.linkProduct.name, warning: tr("المنتج مخفي — بيودّي على كل المنتجات") };
    case "SEARCH":
      return { label, detail: `"${b.linkValue ?? ""}"` };
    case "PAGE":
      return { label, detail: isBannerPageKey(b.linkValue) ? BANNER_PAGES[b.linkValue].label : undefined };
    case "WHATSAPP":
      return hasWhatsapp ? { label } : { label, warning: tr("مفيش رقم واتساب — بيودّي على كل المنتجات") };
    case "URL":
      return { label, detail: b.linkValue?.replace(/^https?:\/\//, "") };
    default:
      return { label };
  }
}
