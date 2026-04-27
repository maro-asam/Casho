import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  ChevronLeft,
  Phone,
  MessageCircle,
  Store,
  ExternalLink,
  BriefcaseBusiness,
  Clock3,
  ListChecks,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import ServiceRequestStatusSelect from "../_components/ServiceRequestStatusSelect";
import PoweredByCashoRequestActions from "../_components/PoweredByCashoRequestActions";

const PAGE_SIZE = 10;

type SearchParams = Promise<{
  page?: string;
}>;

function getPageNumbers(currentPage: number, totalPages: number) {
  const pages = new Set<number>();

  pages.add(1);
  pages.add(totalPages);

  for (let i = currentPage - 1; i <= currentPage + 1; i++) {
    if (i > 1 && i < totalPages) {
      pages.add(i);
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

function createPageHref(page: number) {
  return `/admin/service-requests?page=${page}`;
}

function StatCard({
  title,
  value,
  icon: Icon,
  hint,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
}) {
  return (
    <Card className="border-border/20 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 text-right">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-semibold tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </div>

          <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function AdminServiceRequestsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdmin();

  const params = await searchParams;
  const currentPage = Math.max(1, Number(params.page) || 1);
  const skip = (currentPage - 1) * PAGE_SIZE;

  const [
    totalRequests,
    pendingCount,
    contactedCount,
    inProgressCount,
    completedCount,
    requests,
  ] = await Promise.all([
    prisma.serviceRequest.count(),
    prisma.serviceRequest.count({ where: { status: "PENDING" } }),
    prisma.serviceRequest.count({ where: { status: "CONTACTED" } }),
    prisma.serviceRequest.count({ where: { status: "IN_PROGRESS" } }),
    prisma.serviceRequest.count({ where: { status: "COMPLETED" } }),
    prisma.serviceRequest.findMany({
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: PAGE_SIZE,
      include: {
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            showPoweredByCasho: true,
            poweredByRemovalEnabled: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalRequests / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageNumbers = getPageNumbers(safeCurrentPage, totalPages);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col gap-3 rounded-2xl border bg-background p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="space-y-1 text-right">
          <h1 className="text-2xl font-semibold tracking-tight">طلبات الخدمات</h1>
          <p className="text-sm text-muted-foreground">
            راقب كل الطلبات اللي جاية من صفحة الخدمات بشكل منظم وواضح
          </p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-full border px-3 py-2 text-sm text-muted-foreground">
          <Clock3 className="size-4" />
          <span>{PAGE_SIZE} طلبات في الصفحة</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="إجمالي الطلبات"
          value={totalRequests}
          icon={ListChecks}
          hint="كل الطلبات المسجلة"
        />

        <StatCard
          title="طلبات جديدة"
          value={pendingCount}
          icon={BriefcaseBusiness}
          hint="لسه محتاجة متابعة"
        />

        <StatCard
          title="تم التواصل"
          value={contactedCount}
          icon={Phone}
          hint="تم بدء التواصل مع العميل"
        />

        <StatCard
          title="جاري التنفيذ / مكتمل"
          value={inProgressCount + completedCount}
          icon={CheckCircle2}
          hint="طلبات ماشية أو خلصت"
        />
      </div>

      <Card className="border-border/20 shadow-sm">
        <CardHeader className="gap-2">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1 text-right">
              <CardTitle>قائمة الطلبات</CardTitle>
              <CardDescription>
                تقدر تشوف بيانات العميل والخدمة والمتجر والحالة الحالية
              </CardDescription>
            </div>

            <div className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
              صفحة {safeCurrentPage} من {totalPages}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {requests.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/30 p-8 text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
                <BriefcaseBusiness className="size-6 text-muted-foreground" />
              </div>
              <h3 className="mb-1 text-base font-semibold">
                لا يوجد طلبات خدمات حاليًا
              </h3>
              <p className="text-sm text-muted-foreground">
                أول ما حد يبعث طلب هيظهر هنا تلقائيًا
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1350px] text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30 text-right">
                      <th className="px-4 py-3 font-medium">الخدمة</th>
                      <th className="px-4 py-3 font-medium">العميل</th>
                      <th className="px-4 py-3 font-medium">المتجر</th>
                      <th className="px-4 py-3 font-medium">الحالة</th>
                      <th className="px-4 py-3 font-medium">الملاحظات</th>
                      <th className="px-4 py-3 font-medium">الإجراء الخاص</th>
                      <th className="px-4 py-3 font-medium">التاريخ</th>
                    </tr>
                  </thead>

                  <tbody>
                    {requests.map((request) => (
                      <tr
                        key={request.id}
                        className="border-b transition-colors hover:bg-muted/20"
                      >
                        <td className="px-4 py-4 align-top">
                          <div className="space-y-1 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <p className="font-semibold">
                                {request.serviceTitle}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <div className="space-y-3 text-right">
                            <div>
                              <p className="font-medium">{request.fullName}</p>
                            </div>

                            <div className="flex flex-wrap justify-end gap-2">
                              <a
                                href={`tel:${request.phone}`}
                                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs hover:bg-muted"
                              >
                                <Phone className="size-3.5" />
                                {request.phone}
                              </a>

                              {request.whatsapp ? (
                                <a
                                  href={`https://wa.me/${request.whatsapp.replace(/[^\d]/g, "")}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs hover:bg-muted"
                                >
                                  <MessageCircle className="size-3.5" />
                                  {request.whatsapp}
                                </a>
                              ) : null}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <div className="space-y-2 text-right">
                            {request.store ? (
                              <>
                                <Link
                                  href={`/admin/stores/${request.store.slug}`}
                                  className="inline-flex items-center gap-1.5 font-medium hover:underline"
                                >
                                  <Store className="size-4" />
                                  {request.store.name}
                                </Link>

                                <div className="flex flex-wrap justify-end gap-2">
                                  <span className="rounded-full border px-2.5 py-1 text-[11px] text-muted-foreground">
                                    Powered by:{" "}
                                    {request.store.showPoweredByCasho
                                      ? "ظاهر"
                                      : "مخفي"}
                                  </span>

                                  <span className="rounded-full border px-2.5 py-1 text-[11px] text-muted-foreground">
                                    الخدمة:{" "}
                                    {request.store.poweredByRemovalEnabled
                                      ? "مفعلة"
                                      : "غير مفعلة"}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}

                            {request.storeLink ? (
                              <a
                                href={request.storeLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex max-w-[260px] items-center gap-1.5 truncate text-xs text-primary hover:underline"
                              >
                                <ExternalLink className="size-3.5 shrink-0" />
                                {request.storeLink}
                              </a>
                            ) : null}
                          </div>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <ServiceRequestStatusSelect
                            requestId={request.id}
                            value={request.status}
                          />
                        </td>

                        <td className="px-4 py-4 align-top">
                          <div className="max-w-[280px] whitespace-pre-wrap break-words text-right text-muted-foreground">
                            {request.notes || "—"}
                          </div>
                        </td>

                        <td className="px-4 py-4 align-top">
                          {request.serviceId === "remove_powered_by_casho" &&
                          request.status !== "COMPLETED" &&
                          request.status !== "CANCELED" ? (
                            <PoweredByCashoRequestActions
                              requestId={request.id}
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              لا يوجد
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4 align-top text-right text-muted-foreground">
                          {new Intl.DateTimeFormat("ar-EG", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(request.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 lg:hidden">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-2xl border bg-background p-4 shadow-sm"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <ServiceRequestStatusSelect
                        requestId={request.id}
                        value={request.status}
                      />

                      <div className="text-right">
                        <h3 className="font-semibold">
                          {request.serviceTitle}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {request.serviceId}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 text-right">
                      <div>
                        <p className="text-xs text-muted-foreground">الاسم</p>
                        <p className="font-medium">{request.fullName}</p>
                      </div>

                      <div className="flex flex-wrap justify-end gap-2">
                        <a
                          href={`tel:${request.phone}`}
                          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs hover:bg-muted"
                        >
                          <Phone className="size-3.5" />
                          {request.phone}
                        </a>

                        {request.whatsapp ? (
                          <a
                            href={`https://wa.me/${request.whatsapp.replace(/[^\d]/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs hover:bg-muted"
                          >
                            <MessageCircle className="size-3.5" />
                            {request.whatsapp}
                          </a>
                        ) : null}
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">المتجر</p>
                        {request.store ? (
                          <Link
                            href={`/admin/stores/${request.store.slug}`}
                            className="font-medium hover:underline"
                          >
                            {request.store.name}
                          </Link>
                        ) : (
                          <p className="text-muted-foreground">—</p>
                        )}
                      </div>

                      {request.store ? (
                        <div className="flex flex-wrap justify-end gap-2">
                          <span className="rounded-full border px-2.5 py-1 text-[11px] text-muted-foreground">
                            Powered by:{" "}
                            {request.store.showPoweredByCasho ? "ظاهر" : "مخفي"}
                          </span>

                          <span className="rounded-full border px-2.5 py-1 text-[11px] text-muted-foreground">
                            الخدمة:{" "}
                            {request.store.poweredByRemovalEnabled
                              ? "مفعلة"
                              : "غير مفعلة"}
                          </span>
                        </div>
                      ) : null}

                      {request.storeLink ? (
                        <div>
                          <p className="text-xs text-muted-foreground">
                            لينك المتجر
                          </p>
                          <a
                            href={request.storeLink}
                            target="_blank"
                            rel="noreferrer"
                            className="break-all text-primary hover:underline"
                          >
                            {request.storeLink}
                          </a>
                        </div>
                      ) : null}

                      <div>
                        <p className="text-xs text-muted-foreground">
                          الملاحظات
                        </p>
                        <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                          {request.notes || "—"}
                        </p>
                      </div>

                      {request.serviceId === "remove_powered_by_casho" &&
                      request.status !== "COMPLETED" &&
                      request.status !== "CANCELED" ? (
                        <PoweredByCashoRequestActions requestId={request.id} />
                      ) : null}

                      <div>
                        <p className="text-xs text-muted-foreground">التاريخ</p>
                        <p className="text-sm text-muted-foreground">
                          {new Intl.DateTimeFormat("ar-EG", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(request.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-4 border-t pt-6 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-muted-foreground">
                  عرض {requests.length} من أصل {totalRequests} طلب
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    disabled={safeCurrentPage <= 1}
                  >
                    <Link
                      href={createPageHref(Math.max(1, safeCurrentPage - 1))}
                      aria-disabled={safeCurrentPage <= 1}
                      className={
                        safeCurrentPage <= 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    >
                      <ChevronRight className="size-4" />
                      السابق
                    </Link>
                  </Button>

                  {pageNumbers.map((page, index) => {
                    const prev = pageNumbers[index - 1];
                    const showDots = index > 0 && page - prev > 1;

                    return (
                      <div key={page} className="flex items-center gap-2">
                        {showDots ? (
                          <span className="px-1 text-muted-foreground">
                            ...
                          </span>
                        ) : null}

                        <Button
                          asChild
                          size="sm"
                          variant={
                            page === safeCurrentPage ? "default" : "outline"
                          }
                        >
                          <Link href={createPageHref(page)}>{page}</Link>
                        </Button>
                      </div>
                    );
                  })}

                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    disabled={safeCurrentPage >= totalPages}
                  >
                    <Link
                      href={createPageHref(
                        Math.min(totalPages, safeCurrentPage + 1),
                      )}
                      aria-disabled={safeCurrentPage >= totalPages}
                      className={
                        safeCurrentPage >= totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    >
                      التالي
                      <ChevronLeft className="size-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
