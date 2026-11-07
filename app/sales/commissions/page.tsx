import Link from "next/link";
import { BadgeDollarSign, Banknote, Clock, SearchX, Wallet, type LucideIcon } from "lucide-react";
import { SalesCommissionKind, SalesCommissionStatus } from "@prisma/client";
import {
  Card,
  LargeTitle,
  Pager,
  SearchInput,
  Segmented,
  SelectFilter,
  Unavailable,
  appleButton,
  readPage,
  readParam,
  type SearchParamsRecord,
} from "@/components/saas-page";
import { prisma } from "@/lib/prisma";
import { COMMISSION_STATUS_META, KIND_LABELS, fmtDate, fmtMoney, fmtNum } from "@/lib/sales/format";
import { requireSalesRep } from "@/lib/sales/guard";
import { PAGE_SIZE, getSalesSummary, listCommissions, listPayouts } from "@/lib/sales/queries";
import { cn } from "@/lib/utils";
import { CommissionRows } from "../_components/commission-rows";

const BASE_PATH = "/sales/commissions";
const STATUSES = Object.values(SalesCommissionStatus);
const KINDS = Object.values(SalesCommissionKind);

function MoneyTile({ icon: Icon, label, value, hint, prominent }: { icon: LucideIcon; label: string; value: string; hint: string; prominent?: boolean }) {
  return (
    <div className={cn("apple-card flex flex-col gap-1 px-5 py-4", prominent && "bg-primary text-primary-foreground")}>
      <p className={cn("flex items-center gap-1.5 text-[13px]", prominent ? "text-primary-foreground/80" : "text-muted-foreground")}>
        <Icon className="size-[15px] shrink-0" strokeWidth={1.8} />
        {label}
      </p>
      <p className="text-[28px] leading-[34px] font-bold tabular-nums">{value}</p>
      <p className={cn("text-[13px] leading-[18px]", prominent ? "text-primary-foreground/75" : "text-muted-foreground")}>{hint}</p>
    </div>
  );
}

export default async function SalesCommissionsPage({ searchParams }: { searchParams?: Promise<SearchParamsRecord> }) {
  const rep = await requireSalesRep();
  const params = await searchParams;
  const q = readParam(params, "q");
  const status = STATUSES.find((s) => s === readParam(params, "status"));
  const kind = KINDS.find((k) => k === readParam(params, "kind"));

  const scope = { salesRepId: rep.salesRepId };
  const [summary, list, statusCounts, payouts] = await Promise.all([
    getSalesSummary(scope),
    listCommissions(scope, { q, status, kind, page: readPage(params) }),
    prisma.salesCommission.groupBy({
      by: ["status"],
      where: { salesRepId: rep.salesRepId, ...(kind && { kind }) },
      _count: { _all: true },
    }),
    listPayouts(scope, 50),
  ]);
  const countOf = (s?: SalesCommissionStatus) =>
    statusCounts.filter((g) => !s || g.status === s).reduce((sum, g) => sum + g._count._all, 0);
  const hasFilters = Boolean(q || status || kind);
  const { byStatus, countByStatus } = summary.commissions;

  return (
    <div className="space-y-6">
      <LargeTitle
        title="عمولاتي"
        subtitle="كل عمولة متسجلة بنسبتها ومبلغ الدفعة اللي اتحسبت منه وقت الدفع، ومبتتغيرش بعد كده."
      />

      <section aria-label="ملخص الفلوس" className="grid grid-cols-2 gap-3 sm:grid-cols-3 [&>:first-child]:col-span-2 sm:[&>:first-child]:col-span-1">
        <MoneyTile prominent icon={Wallet} label="مستحق ليك دلوقتي" value={fmtMoney(summary.payable ?? 0)} hint="بيتصرف لما الإدارة تحوّل وتسجل التحويل" />
        <MoneyTile icon={Clock} label="قيد المراجعة" value={fmtMoney(byStatus.PENDING)} hint={countByStatus.PENDING > 0 ? `${fmtNum(countByStatus.PENDING)} عمولة مستنية الاعتماد` : "مفيش حاجة مستنية"} />
        <MoneyTile icon={Banknote} label="اتصرف لك" value={fmtMoney(summary.payouts.total)} hint={summary.payouts.count > 0 ? `على ${fmtNum(summary.payouts.count)} تحويل` : "لسه مفيش تحويلات"} />
      </section>

      {countOf() === 0 && !kind ? (
        <div className="apple-card">
          <Unavailable icon={BadgeDollarSign} title="مفيش عمولات لسه" description="أول ما عميل من عملائك يدفع اشتراكه هتظهر العمولة هنا." />
        </div>
      ) : (
        <div className="space-y-4">
          <Segmented
            label="حالة العمولة"
            param="status"
            basePath={BASE_PATH}
            searchParams={params}
            segments={[
              { label: "الكل", count: countOf() },
              ...STATUSES.filter((s) => countOf(s) > 0 || s === status).map((s) => ({
                label: COMMISSION_STATUS_META[s].label,
                value: s,
                count: countOf(s),
              })),
            ]}
          />

          <section className="apple-card overflow-hidden">
            <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <SearchInput
                placeholder="ابحث باسم العميل أو المتجر"
                className="sm:max-w-sm"
                inputClassName="h-10 rounded-[12px] border-0 bg-(--fill-3) text-[15px] focus-visible:ring-primary/40"
              />
              {/* Sized wrapper: .apple-form stretches select triggers to their container. */}
              <div className="w-full shrink-0 sm:w-44">
                <SelectFilter
                  param="kind"
                  allLabel="كل الأنواع"
                  label="النوع"
                  className="h-10 rounded-full border-0 bg-(--fill-3) text-[15px] shadow-none"
                  options={KINDS.map((k) => ({ value: k, label: KIND_LABELS[k] }))}
                />
              </div>
            </div>

            {list.rows.length === 0 ? (
              <Unavailable
                icon={SearchX}
                title="مفيش عمولات بالفلاتر دي"
                className="border-t-[0.5px] border-border"
                action={
                  hasFilters && (
                    <Link href={BASE_PATH} className={appleButton.tinted}>
                      مسح الفلاتر
                    </Link>
                  )
                }
              />
            ) : (
              <CommissionRows rows={list.rows} />
            )}

            {list.total > 0 && (
              <div className="border-t-[0.5px] border-border">
                <Pager page={list.page} pageSize={PAGE_SIZE} total={list.total} basePath={BASE_PATH} searchParams={params} noun="عمولة" />
              </div>
            )}
          </section>
        </div>
      )}

      <Card title="التحويلات" subtitle="كل مرة الإدارة صرفتلك فيها" icon={Banknote}>
        {payouts.length === 0 ? (
          <p className="px-5 pb-5 text-[15px] text-muted-foreground">مفيش تحويلات لسه.</p>
        ) : (
          <ul className="apple-rows pb-2 [--row-inset:20px]">
            {payouts.map((p) => (
              <li key={p.id} className="flex min-h-11 items-center justify-between gap-3 px-5 py-2.5">
                <div className="min-w-0">
                  <p className="text-[15px]">
                    {fmtDate(p.paidAt)} · {p.method}
                  </p>
                  {p.reference && (
                    <p dir="ltr" className="truncate text-right font-mono text-[12px] text-muted-foreground">
                      {p.reference}
                    </p>
                  )}
                </div>
                <span className="text-[17px] font-semibold tabular-nums">{fmtMoney(p.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
