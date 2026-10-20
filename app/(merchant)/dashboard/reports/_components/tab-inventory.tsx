import Link from "next/link";
import { Boxes, CircleSlash, Hourglass, PackageCheck, Snail, Star, Warehouse } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatMoney, formatNumber } from "../../_components/overview/format";
import type { InventoryRow, ReportsData } from "../_lib/types";
import { EmptyNote, Panel, Stat, Thumb } from "./report-ui";
import { intlLocale, lazyIntl, tr } from "@/lib/i18n/dashboard";

const dateFormat = lazyIntl.date({ day: "numeric", month: "short", timeZone: "Africa/Cairo" });
const rateFormat = lazyIntl.number({ maximumFractionDigits: 1 });

function daysLabel(days: number) {
  if (days < 1) return tr("النهارده");
  const n = Math.floor(days);
  return n === 1 ? tr("بكرة") : tr("خلال {0} يوم", formatNumber(n));
}

function ProductList({ rows, render }: { rows: { id: string; name: string; image: string }[]; render: (i: number) => React.ReactNode }) {
  return (
    <ul className="apple-rows [--row-inset:72px]">
      {rows.map((p, i) => (
        <li key={p.id} className="relative flex items-center gap-3 px-5 py-3 hover:bg-muted/40">
          <Thumb src={p.image} />
          <Link href={`/products/${p.id}/edit`} className="min-w-0 flex-1 truncate text-[15px] after:absolute after:inset-0 after:content-['']">
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
    <div className="space-y-5">
      <p className="px-1 text-[13px] text-muted-foreground">
        {tr("المخزون بيتعرض زي ما هو دلوقتي، مش حسب الفترة. سرعة البيع محسوبة من آخر ٩٠ يوم.")}
      </p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          icon={Warehouse}
          label={tr("قيمة المخزون بالتكلفة")}
          value={formatMoney(inv.valueCost)}
          hint={tr("الكمية × سعر التكلفة لكل منتج نشط. المنتجات اللي ملهاش تكلفة مش محسوبة.")}
          sub={
            inv.productsMissingCost > 0 ? (
              <span className="text-[#c93400] dark:text-(--sys-orange)">{tr("{0} منتج من غير تكلفة", formatNumber(inv.productsMissingCost))}</span>
            ) : undefined
          }
        />
        <Stat
          icon={Boxes}
          label={tr("قيمة المخزون بسعر البيع")}
          value={formatMoney(inv.valueRetail)}
          hint={tr("الكمية × سعر البيع. ده اللي هيدخلك لو كل المخزون اتباع بالسعر الحالي.")}
          sub={potentialProfit !== null ? <span>{tr("ربح متوقع {0}", formatMoney(potentialProfit))}</span> : undefined}
        />
        <Stat
          icon={PackageCheck}
          label={tr("قطع في المخزون")}
          value={formatNumber(inv.units)}
          sub={<span>{tr("{0} منتج نشط", formatNumber(inv.activeProducts))}</span>}
        />
        <Stat
          icon={CircleSlash}
          label={tr("نفد / قرب يخلص")}
          value={`${formatNumber(inv.outOfStock)} / ${formatNumber(inv.lowStock)}`}
          hint={tr("نفد = الكمية صفر. قرب يخلص = الكمية أقل من أو تساوي حد التنبيه بتاع المنتج.")}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel
          title={tr("هيخلص قريب")}
          description={tr("حسب معدل البيع، هيخلص خلال أسبوعين أو أقل")}
          contentClassName={data.runningOut.length ? "p-0" : undefined}
        >
          {data.runningOut.length ? (
            <ProductList
              rows={data.runningOut}
              render={(i) => {
                const r = data.runningOut[i];
                return (
                  <span className="text-end text-[13px] tabular-nums">
                    <span className={cn("block font-medium", (r.daysLeft ?? 99) <= 3 ? "text-[#d70015] dark:text-(--sys-red)" : "text-[#c93400] dark:text-(--sys-orange)")}>
                      {daysLabel(r.daysLeft ?? 0)}
                    </span>
                    <span className="text-muted-foreground">
                      {tr("{0} قطعة · {1}/يوم", formatNumber(r.stock), rateFormat.format(r.dailyRate))}
                    </span>
                  </span>
                );
              }}
            />
          ) : (
            <EmptyNote icon={Hourglass} title={tr("مفيش منتجات هتخلص قريب")} description={tr("بمعدل البيع الحالي، المخزون مكفي أكتر من أسبوعين.")} />
          )}
        </Panel>

        <Panel
          title={tr("نفد من المخزون")}
          description={tr("مرتبة حسب اللي كان بيتباع أكتر")}
          contentClassName={data.outOfStock.length ? "p-0" : undefined}
        >
          {data.outOfStock.length ? (
            <ProductList
              rows={data.outOfStock}
              render={(i) => {
                const r = data.outOfStock[i];
                return (
                  <span className="text-end text-[13px] text-muted-foreground tabular-nums">
                    {r.dailyRate > 0 ? tr("بيتباع {0}/يوم", rateFormat.format(r.dailyRate)) : r.lastSoldAt ? tr("آخر بيع {0}", dateFormat.format(r.lastSoldAt)) : tr("مفيش مبيعات")}
                  </span>
                );
              }}
            />
          ) : (
            <EmptyNote icon={PackageCheck} title={tr("كل المنتجات النشطة متاحة")} />
          )}
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel
          title={tr("بضاعة راكدة")}
          description={
            inv.deadStockCount
              ? tr("{0} منتج متباعش ولا قطعة من ٩٠ يوم · قيمتهم {1}", formatNumber(inv.deadStockCount), formatMoney(inv.deadStockValue))
              : tr("منتجات متباعتش ولا قطعة من ٩٠ يوم")
          }
          className="lg:col-span-2"
          contentClassName={data.deadStock.length ? "p-0" : undefined}
        >
          {data.deadStock.length ? (
            <ProductList rows={data.deadStock} render={(i) => <DeadValue row={data.deadStock[i]} />} />
          ) : (
            <EmptyNote icon={Snail} title={tr("مفيش بضاعة راكدة")} description={tr("كل منتج عنده مخزون اتباع منه حاجة في آخر ٩٠ يوم.")} />
          )}
        </Panel>

        <Reviews reviews={data.reviews} />
      </div>
    </div>
  );
}

function DeadValue({ row }: { row: InventoryRow }) {
  return (
    <span className="text-end text-[13px] tabular-nums">
      <span className="block font-medium">{formatMoney(row.valueCost ?? row.valueRetail)}</span>
      <span className="text-muted-foreground">
        {tr("{0} قطعة ·", formatNumber(row.stock))}{" "}{row.valueCost === null ? tr("بسعر البيع") : tr("بالتكلفة")}
      </span>
    </span>
  );
}

function Reviews({ reviews }: { reviews: ReportsData["reviews"] }) {
  const max = Math.max(...reviews.distribution.map((d) => d.count), 1);
  return (
    <Panel title={tr("التقييمات")} description={tr("{0} تقييم جديد في الفترة", formatNumber(reviews.periodCount))}>
      {reviews.total ? (
        <>
          <div className="flex items-end gap-2">
            <span className="text-[34px] leading-[41px] font-bold tabular-nums">{reviews.average.toLocaleString(intlLocale(), { maximumFractionDigits: 1 })}</span>
            <span className="pb-1 text-[13px] text-muted-foreground">{tr("من ٥ · {0} تقييم", formatNumber(reviews.total))}</span>
          </div>
          <ul className="mt-4 space-y-1.5">
            {reviews.distribution.map((d) => (
              <li key={d.rating} className="flex items-center gap-2 text-[13px]">
                <span className="flex w-6 items-center gap-0.5 tabular-nums">
                  {formatNumber(d.rating)}
                  <Star className="size-3 fill-(--sys-orange) text-(--sys-orange)" />
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-(--sys-orange)" style={{ width: `${(d.count / max) * 100}%` }} />
                </div>
                <span className="w-8 text-end text-muted-foreground tabular-nums">{formatNumber(d.count)}</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <EmptyNote icon={Star} title={tr("لسه مفيش تقييمات")} />
      )}
    </Panel>
  );
}
