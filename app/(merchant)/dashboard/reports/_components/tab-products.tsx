import Link from "next/link";
import { ArrowDown, Package, PackageX } from "lucide-react";

import { hrefWith, type SearchParamsRecord } from "@/components/saas-page";
import { cn } from "@/lib/utils";
import { formatMoney, formatNumber, formatPercent } from "../../_components/overview/format";
import type { ProductRow, ReportsData } from "../_lib/types";
import { EmptyNote, Panel, ReportTable, ShareBar, Thumb } from "./report-ui";

export const PRODUCT_SORTS = ["sales", "units", "profit", "margin"] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

const SORTERS: Record<ProductSort, (a: ProductRow, b: ProductRow) => number> = {
  sales: (a, b) => b.netSales - a.netSales,
  units: (a, b) => b.units - a.units,
  profit: (a, b) => (b.profit ?? -Infinity) - (a.profit ?? -Infinity),
  margin: (a, b) => (b.margin ?? -Infinity) - (a.margin ?? -Infinity),
};

function SortHead({
  label,
  sort,
  current,
  params,
}: {
  label: string;
  sort: ProductSort;
  current: ProductSort;
  params?: SearchParamsRecord;
}) {
  const active = sort === current;
  return (
    <th className="text-left!">
      <Link
        href={hrefWith("/reports", params, { sort: sort === "sales" ? undefined : sort })}
        scroll={false}
        className={cn("inline-flex items-center gap-1 hover:text-foreground", active && "text-foreground")}
      >
        {label}
        {active && <ArrowDown className="size-3" />}
      </Link>
    </th>
  );
}

export function TabProducts({ data, sort, params }: { data: ReportsData; sort: ProductSort; params?: SearchParamsRecord }) {
  const rows = [...data.products].sort(SORTERS[sort]).slice(0, 20);

  return (
    <div className="space-y-6">
      <Panel
        title="أداء المنتجات"
        description={
          data.productsSoldCount
            ? `${formatNumber(data.productsSoldCount)} منتج اتباع في الفترة${
                data.concentration
                  ? ` · ${formatNumber(data.concentration.products)} منهم بيعملوا ${formatPercent(data.concentration.share * 100)} من المبيعات`
                  : ""
              }`
            : undefined
        }
        contentClassName={rows.length ? "p-0" : undefined}
      >
        {rows.length ? (
          <ReportTable
            head={
              <>
                <th className="w-8">#</th>
                <th>المنتج</th>
                <SortHead label="القطع" sort="units" current={sort} params={params} />
                <SortHead label="صافي المبيعات" sort="sales" current={sort} params={params} />
                <th className="hidden md:table-cell">النسبة</th>
                <SortHead label="الربح" sort="profit" current={sort} params={params} />
                <SortHead label="الهامش" sort="margin" current={sort} params={params} />
                <th className="hidden text-left! lg:table-cell">المخزون</th>
              </>
            }
          >
            {rows.map((p, i) => (
              <tr key={p.id} className="relative hover:bg-muted/40">
                <td className="text-xs text-muted-foreground tabular-nums">{formatNumber(i + 1)}</td>
                <td>
                  <Link
                    href={`/products/${p.id}/edit`}
                    className="flex items-center gap-3 after:absolute after:inset-0 focus-visible:outline-none"
                  >
                    <Thumb src={p.image} />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{p.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{p.category}</span>
                    </span>
                  </Link>
                </td>
                <td className="text-left tabular-nums">{formatNumber(p.units)}</td>
                <td className="text-left font-medium tabular-nums">{formatMoney(p.netSales)}</td>
                <td className="hidden w-32 md:table-cell">
                  <div className="flex items-center gap-2">
                    <ShareBar value={p.share} className="flex-1" />
                    <span className="w-10 text-xs text-muted-foreground tabular-nums">{formatPercent(p.share * 100)}</span>
                  </div>
                </td>
                <td className={cn("text-left tabular-nums", p.profit !== null && p.profit < 0 && "text-rose-600 dark:text-rose-400")}>
                  {p.profit === null ? <span className="text-xs text-muted-foreground">بدون تكلفة</span> : formatMoney(p.profit)}
                </td>
                <td className="text-left tabular-nums">{p.margin === null ? "—" : formatPercent(p.margin)}</td>
                <td className={cn("hidden text-left tabular-nums lg:table-cell", p.stock <= 0 && "text-rose-600 dark:text-rose-400")}>
                  {p.stock <= 0 ? "نفد" : formatNumber(p.stock)}
                </td>
              </tr>
            ))}
          </ReportTable>
        ) : (
          <EmptyNote icon={Package} title="مفيش منتجات اتباعت في الفترة دي" description="جرّب فترة أطول من فوق." />
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="التصنيفات" description="نصيب كل تصنيف من صافي المبيعات">
          {data.categories.length ? (
            <ul className="space-y-4">
              {data.categories.slice(0, 10).map((c) => (
                <li key={c.name} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate font-medium">{c.name}</span>
                    <span className="font-semibold tabular-nums">{formatMoney(c.netSales)}</span>
                  </div>
                  <ShareBar value={c.share} />
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {formatPercent(c.share * 100)} · {formatNumber(c.units)} قطعة
                    {c.profit !== null && ` · ربح ${formatMoney(c.profit)}`}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">مفيش مبيعات في الفترة دي.</p>
          )}
        </Panel>

        <Panel
          title="منتجات متباعتش"
          description={
            data.unsoldCount
              ? `${formatNumber(data.unsoldCount)} منتج نشط وعنده مخزون ومتباعش ولا قطعة في الفترة`
              : "منتجات نشطة وعندها مخزون ومتباعتش في الفترة"
          }
          contentClassName={data.unsold.length ? "p-0" : undefined}
        >
          {data.unsold.length ? (
            <ul className="divide-y divide-border">
              {data.unsold.map((p) => (
                <li key={p.id} className="relative flex items-center gap-3 px-5 py-2.5 hover:bg-muted/40">
                  <Thumb src={p.image} />
                  <Link href={`/products/${p.id}/edit`} className="min-w-0 flex-1 after:absolute after:inset-0">
                    <span className="block truncate text-sm font-medium">{p.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {p.category} · {formatNumber(p.stock)} في المخزون
                    </span>
                  </Link>
                  <span className="text-xs text-muted-foreground tabular-nums">{formatMoney(p.valueRetail)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyNote icon={PackageX} title="كل منتجاتك اتباع منها في الفترة دي" />
          )}
        </Panel>
      </div>
    </div>
  );
}
