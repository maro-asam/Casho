import { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  Phone,
  Mail,
  ArrowLeft,
  Search,
  ShoppingBag,
  Wallet,
  Gift,
} from "lucide-react";

import DashboardSectionHeader from "@/app/(merchant)/_components/main/DashboardSectionHeader";
import { GetCRMCustomersAction, computeHealthScore } from "@/actions/crm/customers.actions";
import { GetTagsAction } from "@/actions/crm/customer-tags.actions";
import { GetSegmentsAction } from "@/actions/crm/customer-segments.actions";
import { CreateCustomerDialog } from "../_components/CreateCustomerDialog";
import { CustomerHealthBadge, CustomerStatusBadge } from "../_components/CustomerHealthBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoneyFromPiasters } from "@/lib/subscriptions";
import { CustomerStatus } from "@prisma/client";

export const metadata: Metadata = { title: "العملاء — CRM" };

const PAGE_SIZE = 20;

export default async function CustomersListPage({
  searchParams,
}: {
  searchParams?: Promise<{
    page?: string;
    q?: string;
    status?: string;
    tag?: string;
    segment?: string;
  }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp?.page ?? 1));
  const search = sp?.q ?? "";
  const status = sp?.status as CustomerStatus | undefined;
  const tagId = sp?.tag;
  const segmentId = sp?.segment;

  const [{ customers, total, totalPages }, tags, segments] = await Promise.all([
    GetCRMCustomersAction({ page, search, status, tagId, segmentId }),
    GetTagsAction(),
    GetSegmentsAction(),
  ]);

  const buildHref = (params: Record<string, string | undefined>) => {
    const merged = { page: String(page), q: search, status: sp?.status, tag: tagId, segment: segmentId, ...params };
    const qs = Object.entries(merged)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
      .join("&");
    return `/dashboard/crm/customers${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-6" dir="rtl">
      <DashboardSectionHeader
        icon={Users}
        title="العملاء"
        description="جميع عملاء متجرك مع بياناتهم وتحليلاتهم"
        badge={total}
      />

      {/* Search & Filters bar */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          {/* Search */}
          <form method="GET" action="/dashboard/crm/customers" className="flex-1">
            <input type="hidden" name="status" value={status ?? ""} />
            <input type="hidden" name="tag" value={tagId ?? ""} />
            <input type="hidden" name="segment" value={segmentId ?? ""} />
            <div className="relative">
              <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="q"
                defaultValue={search}
                placeholder="بحث بالاسم أو الهاتف أو البريد..."
                className="h-9 w-full rounded-md border border-input bg-background px-3 pr-9 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </form>

          {/* Status filter */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "الكل", value: "" },
              { label: "نشط", value: "ACTIVE" },
              { label: "VIP", value: "VIP" },
              { label: "غير نشط", value: "INACTIVE" },
              { label: "محظور", value: "BLOCKED" },
            ].map((s) => (
              <Link
                key={s.value}
                href={buildHref({ status: s.value || undefined, page: "1" })}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  (status ?? "") === s.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-primary/10"
                }`}
              >
                {s.label}
              </Link>
            ))}
          </div>

          <div className="mr-auto">
            <CreateCustomerDialog />
          </div>
        </CardContent>
      </Card>

      {/* Tags filter */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <Link
            href={buildHref({ tag: undefined, page: "1" })}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              !tagId ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-primary/10"
            }`}
          >
            كل العلامات
          </Link>
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={buildHref({ tag: tag.id, page: "1" })}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                tagId === tag.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-primary/10"
              }`}
              style={tag.color && tagId !== tag.id ? { borderColor: tag.color } : undefined}
            >
              {tag.name}
              <span className="mr-1 text-muted-foreground">({tag._count.assignments})</span>
            </Link>
          ))}
        </div>
      )}

      {/* Customer Table */}
      {customers.length === 0 ? (
        <Card className="py-16">
          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <Users className="size-12 text-muted-foreground/30" />
            <p className="text-base font-medium">لا يوجد عملاء</p>
            <p className="text-sm text-muted-foreground">
              {search ? "لا توجد نتائج لهذا البحث" : "أضف أول عميل لمتجرك"}
            </p>
            <CreateCustomerDialog />
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">العميل</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground hidden sm:table-cell">جهة التواصل</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">الطلبات</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground hidden md:table-cell">إجمالي الإنفاق</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground hidden lg:table-cell">النقاط</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground hidden lg:table-cell">الصحة</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">الحالة</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customers.map((c) => {
                  const lastOrderDaysAgo = c.lastOrder
                    ? Math.floor(
                        (Date.now() - new Date(c.lastOrder.createdAt).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    : null;

                  const health = computeHealthScore({
                    lastOrderDate: c.lastOrder?.createdAt ? new Date(c.lastOrder.createdAt) : null,
                    orderCount: c.orderCount,
                    totalSpend: c.totalSpend,
                  });

                  return (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      {/* Customer */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                            {(c.name ?? c.phone)[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{c.name ?? "—"}</p>
                            <p className="text-xs text-muted-foreground">{c.phone}</p>
                            {/* Tags */}
                            {c.tags.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {c.tags.slice(0, 2).map((t) => (
                                  <span
                                    key={t.tag.id}
                                    className="rounded-sm px-1.5 py-0 text-[10px] font-medium"
                                    style={{
                                      backgroundColor: t.tag.color ? `${t.tag.color}20` : undefined,
                                      color: t.tag.color ?? undefined,
                                    }}
                                  >
                                    {t.tag.name}
                                  </span>
                                ))}
                                {c.tags.length > 2 && (
                                  <span className="text-[10px] text-muted-foreground">
                                    +{c.tags.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <div className="space-y-0.5">
                          {c.email && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Mail className="size-3" />
                              <span className="truncate max-w-32">{c.email}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="size-3" />
                            <span dir="ltr">{c.phone}</span>
                          </div>
                        </div>
                      </td>

                      {/* Orders */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-semibold">{c.orderCount}</span>
                          {lastOrderDaysAgo !== null && (
                            <span className="text-[10px] text-muted-foreground">
                              آخره قبل {lastOrderDaysAgo}د
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Spend */}
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-primary">
                            {formatMoneyFromPiasters(c.totalSpend)}
                          </p>
                          {c.walletBalance > 0 && (
                            <div className="flex items-center gap-1 text-[10px] text-emerald-600">
                              <Wallet className="size-2.5" />
                              {formatMoneyFromPiasters(c.walletBalance)}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Points */}
                      <td className="px-4 py-3.5 text-center hidden lg:table-cell">
                        {c.points > 0 ? (
                          <div className="flex items-center justify-center gap-1">
                            <Gift className="size-3 text-violet-500" />
                            <span className="text-sm font-medium">{c.points.toLocaleString("ar-EG")}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Health */}
                      <td className="px-4 py-3.5 text-center hidden lg:table-cell">
                        <CustomerHealthBadge category={health.category} score={health.score} />
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center">
                        <CustomerStatusBadge status={c.status} />
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/dashboard/crm/customers/${c.id}`}
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <span>تفاصيل</span>
                          <ArrowLeft className="size-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            عرض {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} من {total}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildHref({ page: String(page - 1) })}
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent"
              >
                السابق
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildHref({ page: String(page + 1) })}
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent"
              >
                التالي
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
