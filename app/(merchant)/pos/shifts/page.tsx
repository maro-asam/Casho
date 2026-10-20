import Link from "next/link";
import { ChevronLeft, Clock } from "lucide-react";
import { GetShiftsAction } from "@/actions/pos/shift.actions";
import { BranchSwitcher } from "@/components/branch/BranchSwitcher";
import { StatusText, Tag } from "@/components/saas-page";
import { PosSubpage } from "../_components/pos-ui";
import { intlLocale, tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

function egp(p: number) {
  return (p / 100).toLocaleString(intlLocale(), { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

/** "2 س 15 د" style duration. */
function duration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? tr("{0} س {1} د", h, m) : tr("{0} د", m);
}

export default async function ShiftsPage() {
  await loadDashboardLocale();
  const { shifts, scope, branches, canSeeAll } = await GetShiftsAction(50);
  const multiBranch = branches.length > 1;
  const now = Date.now();

  const open = shifts.filter((s) => s.status === "OPEN");
  const closed = shifts.filter((s) => s.status !== "OPEN");
  const totalSales = shifts.reduce((s, x) => s + x.totalSales, 0);
  const totalTx = shifts.reduce((s, x) => s + x.transactionCount, 0);
  const shortages = closed.filter((s) => (s.cashDifference ?? 0) < 0).length;

  const row = (shift: (typeof shifts)[number]) => {
    const isOpen = shift.status === "OPEN";
    const minutes = Math.floor(((shift.closedAt ? new Date(shift.closedAt).getTime() : now) - new Date(shift.openedAt).getTime()) / 60000);
    const name = shift.cashier?.name ?? shift.cashier?.email ?? "—";
    const diff = shift.cashDifference;
    return (
      <li key={shift.id}>
        <Link href={`/pos/shifts/${shift.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-(--fill-3)/50">
          <span
            aria-hidden
            className={
              isOpen
                ? "grid size-10 shrink-0 place-items-center rounded-full bg-(--sys-green) text-[15px] font-semibold text-white"
                : "grid size-10 shrink-0 place-items-center rounded-full bg-(--sys-gray)/25 text-[15px] font-semibold text-foreground/70"
            }
          >
            {name.trim().slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <p className="truncate text-[15px] font-semibold">{name}</p>
              <p className="shrink-0 text-[15px] font-semibold tabular-nums">{tr("{0} ج", egp(shift.totalSales))}</p>
            </div>
            <div className="mt-0.5 flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-[13px] text-muted-foreground">
                {new Date(shift.openedAt).toLocaleString(intlLocale(), { dateStyle: "medium", timeStyle: "short" })} · {duration(minutes)}
                {multiBranch && shift.branch && ` · ${shift.branch.name}`}
              </p>
              <span className="shrink-0 text-[13px] text-muted-foreground tabular-nums">{tr("{0} فاتورة", shift.transactionCount)}</span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <StatusText tone={isOpen ? "success" : "neutral"}>{isOpen ? tr("مفتوحة") : tr("مغلقة")}</StatusText>
              {!isOpen && diff != null && diff !== 0 && (
                <Tag tone={diff > 0 ? "success" : "danger"}>
                  {diff > 0 ? tr("زيادة {0} ج", egp(diff)) : tr("عجز {0} ج", egp(-diff))}
                </Tag>
              )}
            </div>
          </div>
          <ChevronLeft className="size-4 shrink-0 text-(--label-3) ltr:-scale-x-100" />
        </Link>
      </li>
    );
  };

  return (
    <div className="h-full" dir={tdir()}>
      <PosSubpage
        back="/pos"
        backLabel={tr("نقطة البيع")}
        title={tr("تقارير الورديات")}
        subtitle={
          <>
            {tr("{0} وردية", shifts.length)}
            {canSeeAll ? (multiBranch ? ` · ${scope.branch ? scope.branch.name : tr("كل الفروع")}` : "") : tr(" · وردياتك")}
          </>
        }
        actions={
          canSeeAll && (
            <BranchSwitcher surface="pos" className="rounded-full border-0 bg-card" branches={branches} value={scope.branch?.id ?? "all"} allowAll />
          )
        }
      >
        {shifts.length === 0 ? (
          <div className="apple-card flex flex-col items-center gap-2 px-6 py-16 text-center">
            <Clock className="mb-2 size-11 text-(--label-3)" strokeWidth={1.5} />
            <p className="text-[20px] font-semibold">{tr("لا توجد ورديات بعد")}</p>
            <p className="text-[15px] text-muted-foreground">{tr("أول ما تفتح وردية من نقطة البيع هتظهر هنا بتقريرها.")}</p>
          </div>
        ) : (
          <>
            <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-[22px] bg-border/60">
              {[
                { label: tr("المبيعات"), value: tr("{0} ج", egp(totalSales)) },
                { label: tr("الفواتير"), value: String(totalTx) },
                { label: tr("ورديات فيها عجز"), value: String(shortages), warn: shortages > 0 },
              ].map((m) => (
                <div key={m.label} className="flex flex-col-reverse bg-card px-5 py-4">
                  <dt className="text-[13px] text-muted-foreground">{m.label}</dt>
                  <dd className={m.warn ? "text-[24px] font-bold text-(--sys-red) tabular-nums" : "text-[24px] font-bold tabular-nums"}>{m.value}</dd>
                </div>
              ))}
            </dl>

            {open.length > 0 && (
              <section className="space-y-2">
                <h2 className="px-4 text-[13px] font-semibold text-muted-foreground">{tr("مفتوحة دلوقتي")}</h2>
                <ul className="apple-card apple-rows overflow-hidden rounded-[14px] [--row-inset:68px]">{open.map(row)}</ul>
              </section>
            )}
            {closed.length > 0 && (
              <section className="space-y-2">
                <h2 className="px-4 text-[13px] font-semibold text-muted-foreground">{tr("ورديات سابقة")}</h2>
                <ul className="apple-card apple-rows overflow-hidden rounded-[14px] [--row-inset:68px]">{closed.map(row)}</ul>
              </section>
            )}
          </>
        )}
      </PosSubpage>
    </div>
  );
}
