import Image from "next/image";
import Link from "next/link";
import { Tag } from "lucide-react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { CategoryRowActions } from "./category-row-actions";

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  productCount: number;
  activeCount: number;
  createdAt: Date;
};

const nf = new Intl.NumberFormat("ar-EG");
const dateFormat = new Intl.DateTimeFormat("ar-EG", {
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
    <div className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
      {category.image ? (
        <Image src={category.image} alt="" fill sizes="40px" className="object-cover" />
      ) : (
        <Tag className="absolute inset-0 m-auto size-4 text-muted-foreground/60" />
      )}
    </div>
  );
}

function ProductCount({ category }: { category: CategoryRow }) {
  if (category.productCount === 0) return <span className="text-sm text-muted-foreground">فاضي</span>;
  const hidden = category.productCount - category.activeCount;
  return (
    <Link
      href={`/products?category=${category.id}`}
      className="relative z-10 inline-flex flex-col text-sm hover:underline"
    >
      <span className="tabular-nums">{nf.format(category.productCount)} منتج</span>
      {hidden > 0 && <span className="text-xs text-muted-foreground">{nf.format(hidden)} مخفي</span>}
    </Link>
  );
}

/** Desktop: table. Mobile: stacked rows — same data, same row link. */
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
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="h-10 ps-4 text-right text-xs font-medium text-muted-foreground">التصنيف</TableHead>
              <TableHead className="h-10 text-right text-xs font-medium text-muted-foreground">المنتجات</TableHead>
              <TableHead className="hidden h-10 text-right text-xs font-medium text-muted-foreground lg:table-cell">
                الرابط
              </TableHead>
              <TableHead className="hidden h-10 text-right text-xs font-medium text-muted-foreground xl:table-cell">
                اتضاف في
              </TableHead>
              <TableHead className="h-10 w-12 pe-4">
                <span className="sr-only">إجراءات</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              // The edit link stretches over the row; product link + menu sit above it (z-10).
              <TableRow key={category.id} className="relative">
                <TableCell className="py-3 ps-4">
                  <div className="flex items-center gap-3">
                    <Thumb category={category} />
                    <Link
                      href={editHref(category.id)}
                      scroll={false}
                      className="max-w-64 truncate text-sm font-medium after:absolute after:inset-0 hover:underline focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-ring"
                    >
                      {category.name}
                    </Link>
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <ProductCount category={category} />
                </TableCell>
                <TableCell className="hidden py-3 lg:table-cell">
                  <span className="block max-w-56 truncate font-mono text-xs text-muted-foreground" dir="ltr">
                    /categories/{category.slug}
                  </span>
                </TableCell>
                <TableCell className="hidden py-3 text-sm text-muted-foreground xl:table-cell">
                  {dateFormat.format(category.createdAt)}
                </TableCell>
                <TableCell className="py-3 pe-4 text-left">{actionsFor(category)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y divide-border md:hidden">
        {categories.map((category) => (
          <li key={category.id} className="relative flex items-center gap-3 p-4">
            <Thumb category={category} />
            <div className="min-w-0 flex-1">
              <Link
                href={editHref(category.id)}
                scroll={false}
                className="block truncate text-sm font-medium after:absolute after:inset-0 focus-visible:outline-none"
              >
                {category.name}
              </Link>
              <p className="text-xs text-muted-foreground">
                {category.productCount > 0 ? `${nf.format(category.productCount)} منتج` : "فاضي"} ·{" "}
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
