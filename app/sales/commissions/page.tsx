import Link from "next/link";
import { BadgeDollarSign, SearchX } from "lucide-react";
import { SalesCommissionKind, SalesCommissionStatus } from "@prisma/client";
import {
  DataCard,
  EmptyState,
  FilterTabs,
  PageHeader,
  Pagination,
  SearchInput,
  SelectFilter,
  readPage,
  readParam,
  type SearchParamsRecord,
} from "@/components/saas-page";
import { CommissionsTable } from "@/components/sales/commissions-table";
import { Panel } from "@/components/sales/sales-summary";
import { prisma } from "@/lib/prisma";
import { COMMISSION_STATUS_META, KIND_LABELS, fmtDate, fmtMoney } from "@/lib/sales/format";
import { requireSalesRep } from "@/lib/sales/guard";
import { PAGE_SIZE, getPayableItems, listCommissions, listPayouts } from "@/lib/sales/queries";

const BASE_PATH = "/sales/commissions";
const STATUSES = Object.values(SalesCommissionStatus);
const KINDS = Object.values(SalesCommissionKind);

export default async function SalesCommissionsPage({ searchParams }: { searchParams?: Promise<SearchParamsRecord> }) {
  const rep = await requireSalesRep();
  const params = await searchParams;
  const q = readParam(params, "q");
  const status = STATUSES.find((s) => s === readParam(params, "status"));
  const kind = KINDS.find((k) => k === readParam(params, "kind"));

  const scope = { salesRepId: rep.salesRepId };
  const [list, statusCounts, payable, payouts] = await Promise.all([
    listCommissions(scope, { q, status, kind, page: readPage(params) }),
    prisma.salesCommission.groupBy({
      by: ["status"],
      where: { salesRepId: rep.salesRepId, ...(kind && { kind }) },
      _count: { _all: true },
    }),
    getPayableItems(prisma, rep.salesRepId),
    listPayouts(scope, 50),
  ]);
  const countOf = (s?: SalesCommissionStatus) =>
    statusCounts.filter((g) => !s || g.status === s).reduce((sum, g) => sum + g._count._all, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="عمولاتي"
        description="كل عمولة متسجلة بنسبتها ومبلغ الدفعة اللي اتحسبت منه وقت الدفع، ومبتتغيرش بعد كده."
      />

      <div className="space-y-4">
        <FilterTabs
          label="حالة العمولة"
          param="status"
          basePath={BASE_PATH}
          searchParams={params}
          tabs={[{ label: "الكل", count: countOf() }, ...STATUSES.map((s) => ({ label: COMMISSION_STATUS_META[s].label, value: s, count: countOf(s) }))]}
        />

        <DataCard
          toolbar={
            <>
              <SearchInput placeholder="ابحث باسم العميل أو المتجر" />
              <SelectFilter param="kind" allLabel="كل الأنواع" label="النوع" options={KINDS.map((k) => ({ value: k, label: KIND_LABELS[k] }))} />
            </>
          }
          footer={<Pagination page={list.page} pageSize={PAGE_SIZE} total={list.total} basePath={BASE_PATH} searchParams={params} noun="عمولة" />}
        >
          {list.rows.length === 0 ? (
            q || status || kind ? (
              <EmptyState
                icon={SearchX}
                title="مفيش عمولات بالفلاتر دي"
                action={
                  <Link href={BASE_PATH} className="text-sm text-primary hover:underline">
                    مسح الفلاتر
                  </Link>
                }
              />
            ) : (
              <EmptyState icon={BadgeDollarSign} title="مفيش عمولات لسه" description="أول ما عميل من عملائك يدفع اشتراكه هتظهر العمولة هنا." />
            )
          ) : (
            <CommissionsTable rows={list.rows} />
          )}
        </DataCard>
      </div>

      <Panel title="الصرف" description={`مستحق ليك الآن: ${fmtMoney(payable.total)} — بيتصرف بعد ما الإدارة تحوّل وتسجل التحويل.`}>
        {payouts.length === 0 ? (
          <p className="text-sm text-muted-foreground">مفيش صرف متسجل لسه.</p>
        ) : (
          <ul className="divide-y text-sm">
            {payouts.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  {fmtDate(p.paidAt)} · {p.method}
                  {p.reference && (
                    <span dir="ltr" className="ms-2 font-mono text-xs text-muted-foreground">
                      {p.reference}
                    </span>
                  )}
                </span>
                <span className="font-medium tabular-nums">{fmtMoney(p.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
