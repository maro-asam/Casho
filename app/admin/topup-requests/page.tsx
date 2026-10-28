import type { Metadata } from "next";
import Link from "next/link";
import { ImageIcon, SearchX, Wallet } from "lucide-react";
import { Prisma, TopupMethod, TopupRequestStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  ListCard,
  Unavailable,
  Segmented,
  PageHeader,
  Pager,
  SearchInput,
  SelectFilter,
  StatusText,
  readPage,
  readParam,
  type SearchParamsRecord,
} from "@/components/saas-page";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { th, theadRow } from "../_components/admin-ui";
import { TOPUP_METHOD_LABELS, TOPUP_STATUS_META, fmtDateTime, fmtMoney, fmtRelative, pickEnum } from "../_lib/format";
import { TopupReview } from "./_components/topup-review";

export const metadata: Metadata = { title: "طلبات الشحن" };

const PAGE_SIZE = 20;
const BASE_PATH = "/admin/topup-requests";

export default async function AdminTopupRequestsPage({ searchParams }: { searchParams?: Promise<SearchParamsRecord> }) {
  const params = await searchParams;
  const q = readParam(params, "q");
  const status = pickEnum(TopupRequestStatus, readParam(params, "status"));
  const method = pickEnum(TopupMethod, readParam(params, "method"));

  const baseWhere: Prisma.TopupRequestWhereInput = {
    ...(method && { method }),
    ...(q && {
      OR: [
        { transferRef: { contains: q, mode: "insensitive" } },
        { store: { name: { contains: q, mode: "insensitive" } } },
        { store: { slug: { contains: q, mode: "insensitive" } } },
        { store: { user: { email: { contains: q, mode: "insensitive" } } } },
      ],
    }),
  };
  const where = { ...baseWhere, ...(status && { status }) };

  const [grouped, total, pendingSum] = await Promise.all([
    prisma.topupRequest.groupBy({ by: ["status"], where: baseWhere, _count: { _all: true } }),
    prisma.topupRequest.count({ where }),
    prisma.topupRequest.aggregate({ where: { status: "PENDING" }, _sum: { amount: true } }),
  ]);
  const counts = Object.fromEntries(grouped.map((g) => [g.status, g._count._all])) as Partial<Record<TopupRequestStatus, number>>;
  const page = Math.min(readPage(params), Math.max(1, Math.ceil(total / PAGE_SIZE)));

  const requests = await prisma.topupRequest.findMany({
    where,
    // Pending first (oldest waiting longest on top), then newest decisions.
    orderBy: status === "PENDING" ? { createdAt: "asc" } : { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      amount: true,
      method: true,
      status: true,
      note: true,
      transferRef: true,
      receiptImage: true,
      createdAt: true,
      updatedAt: true,
      store: { select: { name: true, slug: true, balance: true, user: { select: { email: true } } } },
    },
  });

  const now = new Date();
  const filtered = !!(q || status || method);

  return (
    <div className="space-y-6">
      <PageHeader
        title="طلبات الشحن"
        description={
          counts.PENDING
            ? `${counts.PENDING} طلب مستني مراجعة بإجمالي ${fmtMoney(pendingSum._sum.amount ?? 0)}. اتأكد من التحويل قبل الاعتماد.`
            : "راجع تحويلات التجار واعتمدها عشان الرصيد يتضاف."
        }
      />

      <div className="space-y-4">
        <Segmented
          label="حالة الطلب"
          param="status"
          basePath={BASE_PATH}
          searchParams={params}
          segments={[
            { label: "الكل", count: grouped.reduce((s, g) => s + g._count._all, 0) },
            { label: "مستني مراجعة", value: "PENDING", count: counts.PENDING ?? 0 },
            { label: "اتعتمد", value: "APPROVED", count: counts.APPROVED ?? 0 },
            { label: "اترفض", value: "REJECTED", count: counts.REJECTED ?? 0 },
          ]}
        />

        <ListCard
          toolbar={
            <>
              <SearchInput placeholder="ابحث بالمتجر أو البريد أو رقم التحويل" />
              <SelectFilter
                param="method"
                allLabel="كل طرق الدفع"
                label="طريقة الدفع"
                options={Object.entries(TOPUP_METHOD_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </>
          }
          footer={total > 0 && <Pager page={page} pageSize={PAGE_SIZE} total={total} basePath={BASE_PATH} searchParams={params} noun="طلب" />}
        >
          {requests.length === 0 ? (
            filtered ? (
              <Unavailable
                icon={SearchX}
                title={status === "PENDING" && !q && !method ? "مفيش طلبات مستنية" : "مفيش طلبات بالفلاتر دي"}
                description={status === "PENDING" && !q && !method ? "كل طلبات الشحن اتراجعت." : undefined}
                action={
                  <Link href={BASE_PATH} className="text-sm text-primary hover:underline">
                    كل الطلبات
                  </Link>
                }
              />
            ) : (
              <Unavailable icon={Wallet} title="مفيش طلبات شحن لسه" description="لما تاجر يحوّل ويرفع الإيصال من صفحة الرصيد هيظهر هنا." />
            )
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={theadRow}>
                      <th className={cn(th, "ps-4")}>المتجر</th>
                      <th className={th}>الطريقة</th>
                      <th className={cn(th, "hidden lg:table-cell")}>رقم التحويل / ملاحظة</th>
                      <th className={cn(th, "text-left")}>المبلغ</th>
                      <th className={th}>الحالة</th>
                      <th className={cn(th, "pe-4 text-left")} />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {requests.map((r) => (
                      <tr key={r.id} className="transition-colors hover:bg-muted/40">
                        <td className="py-3 ps-4">
                          <Link href={`/admin/stores/${r.store.slug}`} className="font-medium hover:underline">
                            {r.store.name}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            رصيده {fmtMoney(r.store.balance)} · <span title={fmtDateTime(r.createdAt)}>{fmtRelative(r.createdAt, now)}</span>
                          </p>
                        </td>
                        <td className="py-3">{TOPUP_METHOD_LABELS[r.method]}</td>
                        <td className="hidden max-w-56 py-3 lg:table-cell">
                          <p className="truncate font-mono text-xs" dir="ltr">
                            {r.transferRef || "—"}
                          </p>
                          {r.note && (
                            <p className="truncate text-xs text-muted-foreground" title={r.note}>
                              {r.note}
                            </p>
                          )}
                        </td>
                        <td className="py-3 text-left font-semibold tabular-nums">{fmtMoney(r.amount)}</td>
                        <td className="py-3">
                          <StatusText tone={TOPUP_STATUS_META[r.status].tone}>{TOPUP_STATUS_META[r.status].label}</StatusText>
                          {r.status !== "PENDING" && <p className="mt-1 text-xs text-muted-foreground">{fmtRelative(r.updatedAt, now)}</p>}
                        </td>
                        <td className="py-3 pe-4">
                          <div className="flex items-center justify-end gap-1.5">
                            {r.receiptImage && (
                              <Button asChild variant="ghost" size="sm" className="h-8">
                                <a href={r.receiptImage} target="_blank" rel="noreferrer">
                                  <ImageIcon className="size-3.5" />
                                  الإيصال
                                </a>
                              </Button>
                            )}
                            {r.status === "PENDING" && <TopupReview id={r.id} amountLabel={fmtMoney(r.amount)} storeName={r.store.name} />}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="divide-y divide-border md:hidden">
                {requests.map((r) => (
                  <li key={r.id} className="space-y-2 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <Link href={`/admin/stores/${r.store.slug}`} className="min-w-0 truncate font-medium">
                        {r.store.name}
                      </Link>
                      <span className="shrink-0 font-semibold tabular-nums">{fmtMoney(r.amount)}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <StatusText tone={TOPUP_STATUS_META[r.status].tone}>{TOPUP_STATUS_META[r.status].label}</StatusText>
                      <span>{TOPUP_METHOD_LABELS[r.method]}</span>
                      <span>· {fmtRelative(r.createdAt, now)}</span>
                    </div>
                    {r.transferRef && (
                      <p className="font-mono text-xs" dir="ltr">
                        {r.transferRef}
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      {r.receiptImage ? (
                        <a href={r.receiptImage} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                          <ImageIcon className="size-3.5" />
                          الإيصال
                        </a>
                      ) : (
                        <span />
                      )}
                      {r.status === "PENDING" && <TopupReview id={r.id} amountLabel={fmtMoney(r.amount)} storeName={r.store.name} />}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </ListCard>
      </div>
    </div>
  );
}
