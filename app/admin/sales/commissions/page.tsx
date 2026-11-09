import Link from "next/link";
import { BadgeDollarSign, SearchX } from "lucide-react";
import { SalesCommissionKind, SalesCommissionStatus } from "@prisma/client";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import {
  ListCard,
  Unavailable,
  Segmented,
  appleButton,
  Pager,
  SearchInput,
  SelectFilter,
  readPage,
  readParam,
  type SearchParamsRecord,
} from "@/components/saas-page";
import { CommissionsTable } from "@/components/sales/commissions-table";
import { prisma } from "@/lib/prisma";
import { COMMISSION_STATUS_META, KIND_LABELS, fmtCohort, fmtMoney } from "@/lib/sales/format";
import { PAGE_SIZE, listCommissions, type SalesScope } from "@/lib/sales/queries";
import { cairoMonthStart, cohortMonthOf } from "@/lib/sales/rules";
import { CommissionActions } from "../_components/sales-dialogs";

const BASE_PATH = "/admin/sales/commissions";
const STATUSES = Object.values(SalesCommissionStatus);
const KINDS = Object.values(SalesCommissionKind);

/** "YYYY-MM" → [start, end) in Cairo. */
function monthRange(value: string | undefined): { from?: Date; to?: Date } {
  const m = value?.match(/^(\d{4})-(\d{2})$/);
  if (!m) return {};
  const y = Number(m[1]);
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) return {};
  return { from: cairoMonthStart(y, mo), to: cairoMonthStart(y, mo + 1) };
}

/** The last 18 Cairo months, newest first, as "YYYY-MM". */
function recentMonths(count = 18): string[] {
  const [y, m] = cohortMonthOf(new Date()).split("-").map(Number);
  return Array.from({ length: count }, (_, i) => cohortMonthOf(new Date(cairoMonthStart(y, m - i).getTime() + 12 * 3_600_000)));
}

export default async function AdminSalesCommissionsPage({ searchParams }: { searchParams?: Promise<SearchParamsRecord> }) {
  await requireAdmin();
  const params = await searchParams;
  const q = readParam(params, "q");
  const status = STATUSES.find((s) => s === readParam(params, "status"));
  const kind = KINDS.find((k) => k === readParam(params, "kind"));
  const month = readParam(params, "month");
  const { from, to } = monthRange(month);

  const reps = await prisma.salesRep.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, user: { select: { name: true, email: true } } } });
  const repParam = readParam(params, "rep");
  const repId = reps.some((r) => r.id === repParam) ? repParam : undefined;
  const scope: SalesScope = repId ? { salesRepId: repId } : { all: true };

  const tabWhere = {
    ...(repId && { salesRepId: repId }),
    ...(kind && { kind }),
    ...((from || to) && { paymentAt: { gte: from, lt: to } }),
  };
  const [list, statusCounts] = await Promise.all([
    listCommissions(scope, { q, status, kind, from, to, page: readPage(params) }),
    prisma.salesCommission.groupBy({ by: ["status"], where: tabWhere, _count: { _all: true } }),
  ]);
  const countOf = (s?: SalesCommissionStatus) =>
    statusCounts.filter((g) => !s || g.status === s).reduce((sum, g) => sum + g._count._all, 0);
  const filtered = !!(q || status || kind || repId || month);

  return (
    <div className="space-y-5">
      <Segmented
        label="حالة العمولة"
        param="status"
        basePath={BASE_PATH}
        searchParams={params}
        segments={[
          { label: "الكل", count: countOf() },
          ...STATUSES.map((s) => ({ label: COMMISSION_STATUS_META[s].label, value: s, count: countOf(s) })),
        ]}
      />

      <ListCard
        toolbar={
          <>
            <SearchInput placeholder="ابحث باسم العميل أو بريده أو المتجر" />
            <div className="flex flex-col gap-2 sm:flex-row">
              <SelectFilter param="rep" allLabel="كل المندوبين" label="المندوب" options={reps.map((r) => ({ value: r.id, label: r.user.name ?? r.user.email }))} />
              <SelectFilter param="kind" allLabel="كل الأنواع" label="النوع" options={KINDS.map((k) => ({ value: k, label: KIND_LABELS[k] }))} />
              <SelectFilter
                param="month"
                allLabel="كل الشهور"
                label="شهر الدفع"
                options={recentMonths().map((m) => ({ value: m, label: fmtCohort(m) }))}
              />
            </div>
          </>
        }
        footer={
          <>
            {list.total > 0 && (
              <div className="flex items-baseline justify-between gap-3 border-b-[0.5px] border-border px-5 py-3">
                <span className="text-[13px] text-muted-foreground">
                  إجمالي النتيجة على أساس {fmtMoney(list.sumBasis)} — قبل التسويات
                </span>
                <span className="text-[17px] font-bold tabular-nums">{fmtMoney(list.sumAmount)}</span>
              </div>
            )}
            <Pager page={list.page} pageSize={PAGE_SIZE} total={list.total} basePath={BASE_PATH} searchParams={params} noun="عمولة" />
          </>
        }
      >
        {list.rows.length === 0 ? (
          filtered ? (
            <Unavailable
              icon={SearchX}
              title="مفيش عمولات بالفلاتر دي"
              action={
                <Link href={BASE_PATH} className={appleButton.plain}>
                  مسح الفلاتر
                </Link>
              }
            />
          ) : (
            <Unavailable icon={BadgeDollarSign} title="مفيش عمولات لسه" description="أول ما عميل منسوب يدفع اشتراكه هتتسجل العمولة هنا تلقائيًا." />
          )
        ) : (
          <div className="border-t-[0.5px] border-border">
            <CommissionsTable
              rows={list.rows}
              showRep
              actions={(row) => (
                <CommissionActions commissionId={row.id} status={row.status} net={row.amount + row.adjustments.reduce((s, a) => s + a.amount, 0)} />
              )}
            />
          </div>
        )}
      </ListCard>

      <p className="-mt-2 px-5 text-[13px] leading-[18px] text-muted-foreground">
        كل عمولة صورة ثابتة وقت الدفع: الأساس مبلغ خصم الاشتراك، والنسبة والمستوى والقاعدة محفوظين معاها. العمولات بتتعتمد تلقائيًا، والتصحيح
        بتعليق أو إلغاء أو تسوية مسجلة.
      </p>
    </div>
  );
}
