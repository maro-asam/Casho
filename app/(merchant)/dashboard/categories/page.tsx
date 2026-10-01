import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { Plus, SearchX, Store, Tags } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { Button } from "@/components/ui/button";
import {
  DataCard,
  EmptyState,
  FilterTabs,
  PageHeader,
  Pagination,
  SearchInput,
  SelectFilter,
  hrefWith,
  readPage,
  readParam,
  type SearchParamsRecord,
} from "@/components/saas-page";
import { prisma } from "@/lib/prisma";
import { CategoriesTable, type CategoryRow } from "./_components/categories-table";
import { UrlCategoryDialog } from "./_components/category-form-dialog";

export const metadata: Metadata = {
  title: "التصنيفات",
};

const PAGE_SIZE = 20;
const BASE_PATH = "/categories";

const VIEWS = {
  with: { label: "فيها منتجات", where: { products: { some: {} } } },
  empty: { label: "فاضية", where: { products: { none: {} } } },
} satisfies Record<string, { label: string; where: Prisma.CategoryWhereInput }>;
type View = keyof typeof VIEWS;

const SORTS = {
  oldest: { label: "الأقدم الأول", orderBy: { createdAt: "asc" } },
  name: { label: "الاسم (أ-ي)", orderBy: { name: "asc" } },
  products: { label: "الأكتر منتجات", orderBy: { products: { _count: "desc" } } },
} satisfies Record<string, { label: string; orderBy: Prisma.CategoryOrderByWithRelationInput }>;
type Sort = keyof typeof SORTS;

const isView = (v: string | undefined): v is View => !!v && v in VIEWS;
const isSort = (v: string | undefined): v is Sort => !!v && v in SORTS;

type CategoriesRouteProps = {
  searchParams?: Promise<SearchParamsRecord>;
};

export default async function CategoriesRoute({ searchParams }: CategoriesRouteProps) {
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
        description="أنشئ متجرك الأول عشان تقدر ترتّب منتجاتك في تصنيفات."
        className="rounded-xl border border-dashed border-border"
      />
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
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="التصنيفات"
        description="رتّب منتجاتك في مجموعات عشان العميل يلاقي اللي عايزه بسرعة."
        actions={
          storeHasCategories && (
            <Button asChild size="sm" className="gap-1.5">
              <Link href={newHref} scroll={false}>
                <Plus className="size-4" />
                تصنيف جديد
              </Link>
            </Button>
          )
        }
      />

      {!storeHasCategories ? (
        <div className="rounded-xl border border-dashed border-border">
          <EmptyState
            icon={Tags}
            title="لسه مفيش تصنيفات"
            description="ابدأ بأول تصنيف (زي: ملابس، إكسسوارات) وبعدها ضيف منتجاتك جوّاه."
            action={
              <Button asChild size="sm" className="gap-1.5">
                <Link href={newHref} scroll={false}>
                  <Plus className="size-4" />
                  ضيف أول تصنيف
                </Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          <FilterTabs
            label="عرض التصنيفات"
            param="view"
            basePath={BASE_PATH}
            searchParams={params}
            tabs={[
              { label: "الكل", count: allCount },
              { label: VIEWS.with.label, value: "with", count: withCount },
              { label: VIEWS.empty.label, value: "empty", count: emptyCount },
            ]}
          />

          <DataCard
            toolbar={
              <>
                <SearchInput placeholder="ابحث باسم التصنيف أو الرابط" />
                <SelectFilter
                  label="الترتيب"
                  param="sort"
                  allLabel="الأحدث الأول"
                  options={Object.entries(SORTS).map(([value, { label }]) => ({ value, label }))}
                />
              </>
            }
            footer={
              total > 0 ? (
                <Pagination
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={total}
                  basePath={BASE_PATH}
                  searchParams={params}
                  noun="تصنيف"
                />
              ) : undefined
            }
          >
            {rows.length > 0 ? (
              <CategoriesTable
                categories={rows}
                storeId={store.id}
                storeSlug={store.slug}
                allCategories={allCategories}
                editHref={editHref}
              />
            ) : (
              <EmptyState
                icon={SearchX}
                title="مفيش تصنيفات بالفلاتر دي"
                description={q ? `مفيش نتايج لـ "${q}". جرّب اسم تاني.` : "جرّب تبويب تاني."}
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

      <UrlCategoryDialog storeId={store.id} mode={dialogMode} category={editCategory} />
    </div>
  );
}
