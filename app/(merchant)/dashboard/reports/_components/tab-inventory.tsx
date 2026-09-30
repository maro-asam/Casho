import Link from "next/link";
import { Boxes, CircleSlash, Hourglass, PackageCheck, Snail, Star, Warehouse } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatMoney, formatNumber } from "../../_components/overview/format";
import type { InventoryRow, ReportsData } from "../_lib/types";
import { EmptyNote, Panel, Stat, Thumb } from "./report-ui";

const dateFormat = new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "short", timeZone: "Africa/Cairo" });
const rateFormat = new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 1 });

function daysLabel(days: number) {
  if (days < 1) return "النهارده";
  const n = Math.floor(days);
  return n === 1 ? "بكرة" : `خلال ${formatNumber(n)} يوم`;
}

function ProductList({ rows, render }: { rows: { id: string; name: string; image: string }[]; render: (i: number) => React.ReactNode }) {
  return (
    <ul className="divide-y divide-border">
      {rows.map((p, i) => (
        <li key={p.id} className="relative flex items-center gap-3 px-5 py-2.5 hover:bg-muted/40">
          <Thumb src={p.image} />
          <Link href={`/products/${p.id}/edit`} className="min-w-0 flex-1 truncate text-sm font-medium after:absolute after:inset-0">
            {p.name}
          </Link>
          {render(i)}
        </li>
      ))}
    </ul>
  );
}

export function TabInventory({ data }: { data: ReportsData }) {
  const inv = data.inventory;
  const potentialProfit = inv.valueCost > 0 ? inv.valueRetail - inv.valueCost : null;

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">
        المخزون بيتعرض زي ما هو دلوقتي، مش حسب الفترة. سرعة البيع محسوبة من آخر ٩٠ يوم.
      </p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          icon={Warehouse}
          label="قيمة المخزون بالتكلفة"
          value={formatMoney(inv.valueCost)}
          hint="الكمية × سعر التكلفة لكل منتج نشط. المنتجات اللي ملهاش تكلفة مش محسوبة."
          sub={
            inv.productsMissingCost > 0 ? (
              <span className="text-amber-600 dark:text-amber-400">{formatNumber(inv.productsMissingCost)} منتج من غير تكلفة</span>
            ) : undefined
          }
        />
        <Stat
          icon={Boxes}
          label="قيمة المخزون بسعر البيع"
          value={formatMoney(inv.valueRetail)}
          hint="الكمية × سعر البيع. ده اللي هيدخلك لو كل المخزون اتباع بالسعر الحالي."
          sub={potentialProfit !== null ? <span>ربح متوقع {formatMoney(potentialProfit)}</span> : undefined}
        />
        <Stat
          icon={PackageCheck}
          label="قطع في المخزون"
          value={formatNumber(inv.units)}
          sub={<span>{formatNumber(inv.activeProducts)} منتج نشط</span>}
        />
        <Stat
          icon={CircleSlash}
          label="نفد / قرب يخلص"
          value={`${formatNumber(inv.outOfStock)} / ${formatNumber(inv.lowStock)}`}
          hint="نفد = الكمية صفر. قرب يخلص = الكمية أقل من أو تساوي حد التنبيه بتاع المنتج."
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="هيخلص قريب"
          description="حسب معدل البيع، هيخلص خلال أسبوعين أو أقل"
          contentClassName={data.runningOut.length ? "p-0" : undefined}
        >
          {data.runningOut.length ? (
            <ProductList
              rows={data.runningOut}
              render={(i) => {
                const r = data.runningOut[i];
                return (
                  <span className="text-left text-xs tabular-nums">
                    <span className={cn("block font-medium", (r.daysLeft ?? 99) <= 3 ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400")}>
                      {daysLabel(r.daysLeft ?? 0)}
                    </span>
                    <span className="text-muted-foreground">
                      {formatNumber(r.stock)} قطعة · {rateFormat.format(r.dailyRate)}/يوم
                    </span>
                  </span>
                );
              }}
            />
          ) : (
            <EmptyNote icon={Hourglass} title="مفيش منتجات هتخلص قريب" description="بمعدل البيع الحالي، المخزون مكفي أكتر من أسبوعين." />
          )}
        </Panel>

        <Panel
          title="نفد من المخزون"
          description="مرتبة حسب اللي كان بيتباع أكتر"
          contentClassName={data.outOfStock.length ? "p-0" : undefined}
        >
          {data.outOfStock.length ? (
            <ProductList
              rows={data.outOfStock}
              render={(i) => {
                const r = data.outOfStock[i];
                return (
                  <span className="text-left text-xs text-muted-foreground tabular-nums">
                    {r.dailyRate > 0 ? `بيتباع ${rateFormat.format(r.dailyRate)}/يوم` : r.lastSoldAt ? `آخر بيع ${dateFormat.format(r.lastSoldAt)}` : "مفيش مبيعات"}
                  </span>
                );
              }}
            />
          ) : (
            <EmptyNote icon={PackageCheck} title="كل المنتجات النشطة متاحة" />
          )}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          title="بضاعة راكدة"
          description={
            inv.deadStockCount
              ? `${formatNumber(inv.deadStockCount)} منتج متباعش ولا قطعة من ٩٠ يوم · قيمتهم ${formatMoney(inv.deadStockValue)}`
              : "منتجات متباعتش ولا قطعة من ٩٠ يوم"
          }
          className="lg:col-span-2"
          contentClassName={data.deadStock.length ? "p-0" : undefined}
        >
          {data.deadStock.length ? (
            <ProductList rows={data.deadStock} render={(i) => <DeadValue row={data.deadStock[i]} />} />
          ) : (
            <EmptyNote icon={Snail} title="مفيش بضاعة راكدة" description="كل منتج عنده مخزون اتباع منه حاجة في آخر ٩٠ يوم." />
          )}
        </Panel>

        <Reviews reviews={data.reviews} />
      </div>
    </div>
  );
}

function DeadValue({ row }: { row: InventoryRow }) {
  return (
    <span className="text-left text-xs tabular-nums">
      <span className="block font-medium">{formatMoney(row.valueCost ?? row.valueRetail)}</span>
      <span className="text-muted-foreground">
        {formatNumber(row.stock)} قطعة · {row.valueCost === null ? "بسعر البيع" : "بالتكلفة"}
      </span>
    </span>
  );
}

function Reviews({ reviews }: { reviews: ReportsData["reviews"] }) {
  const max = Math.max(...reviews.distribution.map((d) => d.count), 1);
  return (
    <Panel title="التقييمات" description={`${formatNumber(reviews.periodCount)} تقييم جديد في الفترة`}>
      {reviews.total ? (
        <>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold tabular-nums">{reviews.average.toLocaleString("ar-EG", { maximumFractionDigits: 1 })}</span>
            <span className="pb-1 text-xs text-muted-foreground">من ٥ · {formatNumber(reviews.total)} تقييم</span>
          </div>
          <ul className="mt-4 space-y-1.5">
            {reviews.distribution.map((d) => (
              <li key={d.rating} className="flex items-center gap-2 text-xs">
                <span className="flex w-6 items-center gap-0.5 tabular-nums">
                  {formatNumber(d.rating)}
                  <Star className="size-3 fill-amber-400 text-amber-400" />
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-amber-400" style={{ width: `${(d.count / max) * 100}%` }} />
                </div>
                <span className="w-8 text-left text-muted-foreground tabular-nums">{formatNumber(d.count)}</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <EmptyNote icon={Star} title="لسه مفيش تقييمات" />
      )}
    </Panel>
  );
}
