import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Tag } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { CategoryRowActions } from "./category-row-actions";
import { lazyIntl, tr } from "@/lib/i18n/dashboard";

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  productCount: number;
  activeCount: number;
  createdAt: Date;
};

const nf = lazyIntl.number();
const dateFormat = lazyIntl.date({
  timeZone: "Africa/Cairo",
  day: "numeric",
  month: "short",
  year: "numeric",
});

type Props = {
  categories: CategoryRow[];
  storeId: string;
  storeSlug: string;
  allCategories: { id: string; name: string }[];
  /** Builds the `?edit=<id>` link while keeping the current filters. */
  editHref: (id: string) => string;
};

function Thumb({ category }: { category: CategoryRow }) {
  return (
    <div className="relative size-11 shrink-0 overflow-hidden rounded-[10px] bg-muted">
      {category.image ? (
        <Image src={category.image} alt="" fill sizes="44px" className="object-cover" />
      ) : (
        <Tag className="absolute inset-0 m-auto size-[18px] text-(--label-3)" strokeWidth={1.6} />
      )}
    </div>
  );
}

function ProductCount({ category }: { category: CategoryRow }) {
  if (category.productCount === 0) return <span className="text-[15px] text-muted-foreground">{tr("فاضي")}</span>;
  const hidden = category.productCount - category.activeCount;
  return (
    <Link
      href={`/products?category=${category.id}`}
      className="apple-press relative z-10 -mx-2 inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-[15px] text-primary hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="tabular-nums">{tr("{0} منتج", nf.format(category.productCount))}</span>
      {hidden > 0 && <span className="text-[13px] text-muted-foreground">· {tr("{0} مخفي", nf.format(hidden))}</span>}
      <ChevronLeft className="size-3.5 ltr:-scale-x-100" strokeWidth={2.4} />
    </Link>
  );
}

const th = "h-9 px-3 pb-2 text-start align-bottom text-[12px] font-medium whitespace-nowrap text-muted-foreground";
const td = "relative px-3 py-3 align-middle";

/** Desktop: list-view table. Mobile: grouped rows — same data, same row link. */
export function CategoriesTable({ categories, storeId, storeSlug, allCategories, editHref }: Props) {
  const actionsFor = (category: CategoryRow) => (
    <CategoryRowActions
      storeId={storeId}
      category={{ id: category.id, name: category.name, productCount: category.productCount }}
      editHref={editHref(category.id)}
      storefrontUrl={buildStoreUrl(storeSlug, `/categories/${category.slug}`)}
      otherCategories={allCategories.filter((c) => c.id !== category.id)}
    />
  );

  return (
    <>
      <div className="hidden md:block">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th className={`${th} ps-5`}>{tr("التصنيف")}</th>
              <th className={th}>{tr("المنتجات")}</th>
              <th className={`${th} hidden lg:table-cell`}>{tr("الرابط")}</th>
              <th className={`${th} hidden xl:table-cell`}>{tr("اتضاف في")}</th>
              <th className="w-14 pe-4">
                <span className="sr-only">{tr("إجراءات")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              // The edit link stretches over the row; product link + menu sit above it (z-10).
              <tr
                key={category.id}
                className="relative transition-colors hover:bg-muted/50 has-focus-visible:bg-muted/50 [&>td]:border-t-[0.5px] [&>td]:border-border"
              >
                <td className={`${td} ps-5`}>
                  <div className="flex items-center gap-3">
                    <Thumb category={category} />
                    <Link
                      href={editHref(category.id)}
                      scroll={false}
                      className="max-w-64 truncate text-[15px] leading-5 after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
                    >
                      {category.name}
                    </Link>
                  </div>
                </td>
                <td className={td}>
                  <ProductCount category={category} />
                </td>
                <td className={`${td} hidden lg:table-cell`}>
                  <span className="block max-w-56 truncate font-mono text-[13px] text-muted-foreground" dir="ltr">
                    /categories/{category.slug}
                  </span>
                </td>
                <td className={`${td} hidden text-[15px] text-muted-foreground xl:table-cell`}>{dateFormat.format(category.createdAt)}</td>
                <td className={`${td} pe-4 text-end`}>{actionsFor(category)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="apple-rows [--row-inset:72px] md:hidden">
        {categories.map((category) => (
          <li key={category.id} className="relative flex items-center gap-3 px-4 py-3">
            <Thumb category={category} />
            <div className="min-w-0 flex-1">
              <Link
                href={editHref(category.id)}
                scroll={false}
                className="block truncate text-[15px] leading-5 after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
              >
                {category.name}
              </Link>
              <p className="text-[13px] text-muted-foreground">
                {category.productCount > 0 ? tr("{0} منتج", nf.format(category.productCount)) : tr("فاضي")} ·{" "}
                {dateFormat.format(category.createdAt)}
              </p>
            </div>
            {actionsFor(category)}
          </li>
        ))}
      </ul>
    </>
  );
}
