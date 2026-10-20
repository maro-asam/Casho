import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { Plus, SearchX, Store, Tags } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import {
  LargeTitle,
  Pager,
  Segmented,
  SearchInput,
  SelectFilter,
  Unavailable,
  appleButton,
  hrefWith,
  readPage,
  readParam,
  type SearchParamsRecord,
} from "@/components/saas-page";
import { prisma } from "@/lib/prisma";
import { CategoriesTable, type CategoryRow } from "./_components/categories-table";
import { UrlCategoryDialog } from "./_components/category-form-dialog";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
  title: tr("التصنيفات"),
};
}

const PAGE_SIZE = 20;
const BASE_PATH = "/categories";

const VIEWS = {
  with: { get label() { return tr("فيها منتجات"); }, where: { products: { some: {} } } },
  empty: { get label() { return tr("فاضية"); }, where: { products: { none: {} } } },
} satisfies Record<string, { label: string; where: Prisma.CategoryWhereInput }>;
type View = keyof typeof VIEWS;

const SORTS = {
  oldest: { get label() { return tr("الأقدم الأول"); }, orderBy: { createdAt: "asc" } },
  name: { get label() { return tr("الاسم (أ-ي)"); }, orderBy: { name: "asc" } },
  products: { get label() { return tr("الأكتر منتجات"); }, orderBy: { products: { _count: "desc" } } },
} satisfies Record<string, { label: string; orderBy: Prisma.CategoryOrderByWithRelationInput }>;
type Sort = keyof typeof SORTS;

const isView = (v: string | undefined): v is View => !!v && v in VIEWS;
const isSort = (v: string | undefined): v is Sort => !!v && v in SORTS;

type CategoriesRouteProps = {
  searchParams?: Promise<SearchParamsRecord>;
};

export default async function CategoriesRoute({ searchParams }: CategoriesRouteProps) {
  await loadDashboardLocale();
  const userId = await requireUserId();
  const params = await searchParams;

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, slug: true },
  });

  if (!store) {
    return (
      <div className="apple-card" dir={tdir()}>
        <Unavailable
          icon={Store}
          title={tr("لسه معندكش متجر")}
          description={tr("أنشئ متجرك الأول عشان تقدر ترتّب منتجاتك في تصنيفات.")}
        />
      </div>
    );
  }

  // ── Filters (all in the URL so every view is shareable) ──────────────
  const q = readParam(params, "q");
  const viewParam = readParam(params, "view");
  const view = isView(viewParam) ? viewParam : undefined;
  const sortParam = readParam(params, "sort");
  const sort = isSort(sortParam) ? sortParam : undefined;
  const editId = readParam(params, "edit");
  const dialogMode = editId ? "edit" : readParam(params, "new") ? "new" : null;

  const baseWhere: Prisma.CategoryWhereInput = {
    storeId: store.id,
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
      ],
    }),
  };

  // Tab counts respect search, so each number matches what its tab shows.
  const [allCount, emptyCount, allCategories, editCategory] = await Promise.all([
    prisma.category.count({ where: baseWhere }),
    prisma.category.count({ where: { ...baseWhere, ...VIEWS.empty.where } }),
    // Small list (id + name) — used as "move products to" targets when deleting.
    prisma.category.findMany({
      where: { storeId: store.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    editId
      ? prisma.category.findFirst({
          where: { id: editId, storeId: store.id },
          select: { id: true, name: true, slug: true, image: true },
        })
      : Promise.resolve(null),
  ]);
  const withCount = allCount - emptyCount;
  const total = view === "with" ? withCount : view === "empty" ? emptyCount : allCount;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(readPage(params), totalPages);

  const categories = await prisma.category.findMany({
    where: { ...baseWhere, ...(view && VIEWS[view].where) },
    orderBy: [sort ? SORTS[sort].orderBy : { createdAt: "desc" }, { id: "asc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
      createdAt: true,
      _count: { select: { products: true } },
    },
  });

  const activeCounts = categories.length
    ? await prisma.product.groupBy({
        by: ["categoryId"],
        where: { categoryId: { in: categories.map((c) => c.id) }, isActive: true },
        _count: { _all: true },
      })
    : [];

  const rows: CategoryRow[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    image: c.image,
    createdAt: c.createdAt,
    productCount: c._count.products,
    activeCount: activeCounts.find((a) => a.categoryId === c.id)?._count._all ?? 0,
  }));

  const storeHasCategories = allCategories.length > 0;
  const hasFilters = Boolean(q || view);
  const newHref = hrefWith(BASE_PATH, params, { new: 1, edit: null, page: readParam(params, "page") });
  const editHref = (id: string) => hrefWith(BASE_PATH, params, { edit: id, new: null, page: readParam(params, "page") });

  return (
    <div className="space-y-6" dir={tdir()}>
      <LargeTitle
        title={tr("التصنيفات")}
        subtitle={tr("رتّب منتجاتك في مجموعات عشان العميل يلاقي اللي عايزه بسرعة.")}
        actions={
          storeHasCategories && (
            // The one prominent action on the page.
            <Link href={newHref} scroll={false} className={appleButton.filled}>
              <Plus className="size-4" strokeWidth={2.4} />
              {tr("تصنيف جديد")}
            </Link>
          )
        }
      />

      {!storeHasCategories ? (
        <div className="apple-card">
          <Unavailable
            icon={Tags}
            title={tr("لسه مفيش تصنيفات")}
            description={tr("ابدأ بأول تصنيف (زي: ملابس، إكسسوارات) وبعدها ضيف منتجاتك جوّاه.")}
            action={
              <Link href={newHref} scroll={false} className={`${appleButton.filled} h-9 px-4`}>
                <Plus className="size-4" strokeWidth={2.4} />
                {tr("ضيف أول تصنيف")}
              </Link>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          <Segmented
            label={tr("عرض التصنيفات")}
            param="view"
            basePath={BASE_PATH}
            searchParams={params}
            segments={[
              { label: tr("الكل"), count: allCount },
              { label: VIEWS.with.label, value: "with", count: withCount },
              { label: VIEWS.empty.label, value: "empty", count: emptyCount },
            ]}
          />

          <section className="apple-card overflow-hidden">
            <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <SearchInput
                placeholder={tr("ابحث باسم التصنيف أو الرابط")}
                className="sm:max-w-sm"
                inputClassName="h-9 rounded-[10px] border-0 bg-muted text-[15px] focus-visible:ring-primary/40"
              />
              <SelectFilter
                label={tr("الترتيب")}
                param="sort"
                allLabel={tr("الأحدث الأول")}
                className="h-9 rounded-full border-0 bg-muted text-[15px] shadow-none sm:w-44"
                options={Object.entries(SORTS).map(([value, { label }]) => ({ value, label }))}
              />
            </div>

            {rows.length > 0 ? (
              <CategoriesTable
                categories={rows}
                storeId={store.id}
                storeSlug={store.slug}
                allCategories={allCategories}
                editHref={editHref}
              />
            ) : (
              <Unavailable
                icon={SearchX}
                title={tr("مفيش تصنيفات بالفلاتر دي")}
                description={q ? tr("مفيش نتايج لـ \"{0}\". جرّب اسم تاني.", q) : tr("جرّب تبويب تاني.")}
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
                <Pager page={page} pageSize={PAGE_SIZE} total={total} basePath={BASE_PATH} searchParams={params} noun={tr("تصنيف")} />
              </div>
            )}
          </section>
        </div>
      )}

      <UrlCategoryDialog storeId={store.id} mode={dialogMode} category={editCategory} />
    </div>
  );
}
