import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import {
  ChevronRight, ChevronLeft, Phone, MessageCircle,
  Store, ExternalLink, BriefcaseBusiness, ListChecks, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ServiceRequestStatusSelect from "../_components/ServiceRequestStatusSelect";
import PoweredByCashoRequestActions from "../_components/PoweredByCashoRequestActions";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;
type SearchParams = Promise<{ page?: string }>;

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(d);
}
function pageHref(p: number) { return `/admin/service-requests?page=${p}`; }
function getPages(cur: number, total: number) {
  const s = new Set([1, total]);
  for (let i = cur - 1; i <= cur + 1; i++) if (i > 1 && i < total) s.add(i);
  return Array.from(s).sort((a, b) => a - b);
}

export default async function AdminServiceRequestsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const params   = await searchParams;
  const curPage  = Math.max(1, Number(params.page) || 1);
  const skip     = (curPage - 1) * PAGE_SIZE;

  const [total, pending, contacted, inProgress, completed, requests] = await Promise.all([
    prisma.serviceRequest.count(),
    prisma.serviceRequest.count({ where: { status: "PENDING" } }),
    prisma.serviceRequest.count({ where: { status: "CONTACTED" } }),
    prisma.serviceRequest.count({ where: { status: "IN_PROGRESS" } }),
    prisma.serviceRequest.count({ where: { status: "COMPLETED" } }),
    prisma.serviceRequest.findMany({
      orderBy: { createdAt: "desc" },
      skip, take: PAGE_SIZE,
      include: {
        store: { select: { id: true, name: true, slug: true, showPoweredByCasho: true, poweredByRemovalEnabled: true } },
      },
    }),
  ]);

  const totalPages  = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage    = Math.min(curPage, totalPages);
  const pageNumbers = getPages(safePage, totalPages);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">طلبات الخدمات</h1>
        <p className="mt-1 text-sm text-muted-foreground">تابع كل طلبات الخدمات الواردة من العملاء</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "إجمالي الطلبات",       value: total,                   icon: ListChecks,       cls: "text-primary      bg-primary/10"      },
          { label: "جديدة",                 value: pending,                 icon: BriefcaseBusiness,cls: "text-amber-600    bg-amber-500/10"    },
          { label: "تم التواصل",            value: contacted,               icon: Phone,            cls: "text-sky-600      bg-sky-500/10"      },
          { label: "جاري / مكتمل",          value: inProgress + completed,  icon: CheckCircle2,     cls: "text-emerald-600  bg-emerald-500/10"  },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-background p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-2xl font-semibold">{s.value}</p>
              </div>
              <div className={cn("flex size-10 items-center justify-center rounded-lg", s.cls)}>
                <s.icon className="size-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-background shadow-sm">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="font-semibold">قائمة الطلبات</h2>
            <p className="text-sm text-muted-foreground">صفحة {safePage} من {totalPages} — {total} طلب</p>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="p-10 text-center">
            <BriefcaseBusiness className="mx-auto size-8 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">لا توجد طلبات خدمات بعد</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-right text-xs text-muted-foreground">
                    <th className="px-5 py-3 font-medium">الخدمة</th>
                    <th className="px-5 py-3 font-medium">العميل</th>
                    <th className="px-5 py-3 font-medium">المتجر</th>
                    <th className="px-5 py-3 font-medium">الحالة</th>
                    <th className="px-5 py-3 font-medium">الملاحظات</th>
                    <th className="px-5 py-3 font-medium">إجراء خاص</th>
                    <th className="px-5 py-3 font-medium">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {requests.map((req) => (
                    <tr key={req.id} className="transition hover:bg-muted/30">
                      <td className="px-5 py-4 align-top font-medium">{req.serviceTitle}</td>

                      <td className="px-5 py-4 align-top">
                        <p className="font-medium">{req.fullName}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <a href={`tel:${req.phone}`} className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs hover:bg-muted">
                            <Phone className="size-3" />{req.phone}
                          </a>
                          {req.whatsapp && (
                            <a href={`https://wa.me/${req.whatsapp.replace(/[^\d]/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs hover:bg-muted">
                              <MessageCircle className="size-3" />{req.whatsapp}
                            </a>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        {req.store ? (
                          <div className="space-y-1">
                            <Link href={`/admin/stores/${req.store.slug}`} className="inline-flex items-center gap-1.5 font-medium hover:underline">
                              <Store className="size-3.5" />{req.store.name}
                            </Link>
                            {req.storeLink && (
                              <a href={req.storeLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                                <ExternalLink className="size-3" />رابط المتجر
                              </a>
                            )}
                          </div>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>

                      <td className="px-5 py-4 align-top">
                        <ServiceRequestStatusSelect requestId={req.id} value={req.status} />
                      </td>

                      <td className="px-5 py-4 align-top">
                        <p className="max-w-[200px] whitespace-pre-wrap break-words text-xs text-muted-foreground">{req.notes || "—"}</p>
                      </td>

                      <td className="px-5 py-4 align-top">
                        {req.serviceId === "remove_powered_by_casho" && req.status !== "COMPLETED" && req.status !== "CANCELED" ? (
                          <PoweredByCashoRequestActions requestId={req.id} />
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </td>

                      <td className="px-5 py-4 align-top text-xs text-muted-foreground">{fmtDate(req.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y lg:hidden">
              {requests.map((req) => (
                <div key={req.id} className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <ServiceRequestStatusSelect requestId={req.id} value={req.status} />
                    <p className="font-medium text-right">{req.serviceTitle}</p>
                  </div>
                  <div>
                    <p className="font-medium">{req.fullName}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <a href={`tel:${req.phone}`} className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs hover:bg-muted">
                        <Phone className="size-3" />{req.phone}
                      </a>
                      {req.whatsapp && (
                        <a href={`https://wa.me/${req.whatsapp.replace(/[^\d]/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs hover:bg-muted">
                          <MessageCircle className="size-3" />{req.whatsapp}
                        </a>
                      )}
                    </div>
                  </div>
                  {req.store && (
                    <Link href={`/admin/stores/${req.store.slug}`} className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline">
                      <Store className="size-3.5" />{req.store.name}
                    </Link>
                  )}
                  {req.notes && <p className="text-xs text-muted-foreground">{req.notes}</p>}
                  {req.serviceId === "remove_powered_by_casho" && req.status !== "COMPLETED" && req.status !== "CANCELED" && (
                    <PoweredByCashoRequestActions requestId={req.id} />
                  )}
                  <p className="text-xs text-muted-foreground">{fmtDate(req.createdAt)}</p>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-6 py-4">
                <p className="text-sm text-muted-foreground">عرض {requests.length} من {total}</p>
                <div className="flex items-center gap-1.5">
                  <Link href={pageHref(Math.max(1, safePage - 1))} className={cn("inline-flex h-9 items-center gap-1 rounded-lg border px-3 text-sm transition hover:bg-muted", safePage <= 1 && "pointer-events-none opacity-40")}>
                    <ChevronRight className="size-4" />السابق
                  </Link>
                  {pageNumbers.map((p, i) => (
                    <span key={p} className="flex items-center gap-1.5">
                      {i > 0 && p - pageNumbers[i - 1] > 1 && <span className="text-xs text-muted-foreground">…</span>}
                      <Link href={pageHref(p)} className={cn("inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm transition", p === safePage ? "bg-primary text-primary-foreground" : "border hover:bg-muted")}>
                        {p}
                      </Link>
                    </span>
                  ))}
                  <Link href={pageHref(Math.min(totalPages, safePage + 1))} className={cn("inline-flex h-9 items-center gap-1 rounded-lg border px-3 text-sm transition hover:bg-muted", safePage >= totalPages && "pointer-events-none opacity-40")}>
                    التالي<ChevronLeft className="size-4" />
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
