import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseBusiness, Check, ExternalLink, MessageCircle, Phone, SearchX, X } from "lucide-react";
import { Prisma, ServiceRequestStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { setServiceRequestStatusAction } from "@/actions/admin/service-requests.actions";
import { ApproveRemovePoweredByRequestAction, RejectRemovePoweredByRequestAction } from "@/actions/admin/powered-by-casho.actions";
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
import { ActionButton } from "../_components/action-button";
import { StatusMenu } from "../_components/status-menu";
import { SERVICE_STATUS_META, fmtDateTime, fmtRelative, pickEnum } from "../_lib/format";

export const metadata: Metadata = { title: "طلبات الخدمات" };

const PAGE_SIZE = 15;
const BASE_PATH = "/admin/service-requests";
const POWERED_BY = "remove_powered_by_casho";
const STATUS_OPTIONS = (Object.keys(SERVICE_STATUS_META) as ServiceRequestStatus[]).map((value) => ({ value, ...SERVICE_STATUS_META[value] }));

function waLink(n: string) {
  return `https://wa.me/${n.replace(/[^\d]/g, "")}`;
}

export default async function AdminServiceRequestsPage({ searchParams }: { searchParams?: Promise<SearchParamsRecord> }) {
  const params = await searchParams;
  const q = readParam(params, "q");
  const status = pickEnum(ServiceRequestStatus, readParam(params, "status"));
  const serviceParam = readParam(params, "service");

  const services = await prisma.serviceRequest.groupBy({ by: ["serviceId", "serviceTitle"], _count: { _all: true }, orderBy: { serviceTitle: "asc" } });
  const serviceId = services.some((s) => s.serviceId === serviceParam) ? serviceParam : undefined;

  const baseWhere: Prisma.ServiceRequestWhereInput = {
    ...(serviceId && { serviceId }),
    ...(q && {
      OR: [
        { fullName: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { whatsapp: { contains: q } },
        { serviceTitle: { contains: q, mode: "insensitive" } },
        { store: { name: { contains: q, mode: "insensitive" } } },
        { store: { slug: { contains: q, mode: "insensitive" } } },
      ],
    }),
  };
  const where = { ...baseWhere, ...(status && { status }) };

  const [grouped, total] = await Promise.all([
    prisma.serviceRequest.groupBy({ by: ["status"], where: baseWhere, _count: { _all: true } }),
    prisma.serviceRequest.count({ where }),
  ]);
  const counts = Object.fromEntries(grouped.map((g) => [g.status, g._count._all])) as Partial<Record<ServiceRequestStatus, number>>;
  const page = Math.min(readPage(params), Math.max(1, Math.ceil(total / PAGE_SIZE)));

  const requests = await prisma.serviceRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: { store: { select: { name: true, slug: true } } },
  });

  const now = new Date();
  const filtered = !!(q || status || serviceId);
  // Unique titles per serviceId for the facet (titles can drift between requests).
  const serviceOptions = [...new Map(services.map((s) => [s.serviceId, s.serviceTitle])).entries()].map(([value, label]) => ({ value, label }));

  return (
    <div className="space-y-6">
      <PageHeader title="طلبات الخدمات" description="طلبات الخدمات المدفوعة والإضافات من التجار. غيّر الحالة بعد كل تواصل عشان التاجر يتابع." />

      <div className="space-y-4">
        <FilterTabs
          label="حالة الطلب"
          param="status"
          basePath={BASE_PATH}
          searchParams={params}
          tabs={[
            { label: "الكل", count: grouped.reduce((s, g) => s + g._count._all, 0) },
            ...STATUS_OPTIONS.map((o) => ({ label: o.label, value: o.value, count: counts[o.value] ?? 0 })),
          ]}
        />

        <DataCard
          toolbar={
            <>
              <SearchInput placeholder="ابحث بالاسم أو الموبايل أو المتجر أو الخدمة" />
              <SelectFilter param="service" allLabel="كل الخدمات" label="الخدمة" options={serviceOptions} className="sm:w-52" />
            </>
          }
          footer={total > 0 && <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath={BASE_PATH} searchParams={params} noun="طلب" />}
        >
          {requests.length === 0 ? (
            filtered ? (
              <EmptyState
                icon={SearchX}
                title="مفيش طلبات بالفلاتر دي"
                action={
                  <Link href={BASE_PATH} className="text-sm text-primary hover:underline">
                    مسح الفلاتر
                  </Link>
                }
              />
            ) : (
              <EmptyState icon={BriefcaseBusiness} title="مفيش طلبات خدمات لسه" description="لما تاجر يطلب خدمة من صفحة الخدمات هتظهر هنا." />
            )
          ) : (
            <ul className="divide-y divide-border">
              {requests.map((r) => {
                const isPoweredBy = r.serviceId === POWERED_BY && r.status !== "COMPLETED" && r.status !== "CANCELED";
                return (
                  <li key={r.id} className="grid gap-3 px-4 py-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto] lg:items-start lg:gap-6">
                    {/* What + who */}
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{r.serviceTitle}</p>
                        <span className="text-xs text-muted-foreground" title={fmtDateTime(r.createdAt)}>
                          {fmtRelative(r.createdAt, now)}
                        </span>
                      </div>
                      <p className="text-sm">
                        {r.fullName}
                        {r.store && (
                          <>
                            {" · "}
                            <Link href={`/admin/stores/${r.store.slug}`} className="text-primary hover:underline">
                              {r.store.name}
                            </Link>
                          </>
                        )}
                      </p>
                      {r.notes && <p className="whitespace-pre-wrap wrap-break-word text-sm leading-6 text-muted-foreground">{r.notes}</p>}
                      {r.adminNote && <p className="text-xs text-muted-foreground">ملاحظة الأدمن: {r.adminNote}</p>}
                    </div>

                    {/* Contact */}
                    <div className="flex flex-wrap items-start gap-1.5">
                      <a href={`tel:${r.phone}`} className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-xs hover:bg-muted" dir="ltr">
                        <Phone className="size-3" />
                        {r.phone}
                      </a>
                      {r.whatsapp && (
                        <a href={waLink(r.whatsapp)} target="_blank" rel="noreferrer" className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-xs hover:bg-muted">
                          <MessageCircle className="size-3" />
                          واتساب
                        </a>
                      )}
                      {r.storeLink && (
                        <a href={r.storeLink} target="_blank" rel="noreferrer" className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-xs hover:bg-muted">
                          <ExternalLink className="size-3" />
                          رابط المتجر
                        </a>
                      )}
                    </div>

                    {/* Workflow */}
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      {isPoweredBy ? (
                        <>
                          <ActionButton
                            action={ApproveRemovePoweredByRequestAction.bind(null, r.id)}
                            variant="default"
                            successMessage="اتشالت العلامة من المتجر"
                            confirm={{ title: "توافق على إزالة العلامة؟", description: "علامة Powered by Casho هتختفي من فوتر المتجر والطلب هيتقفل كمكتمل." }}
                          >
                            <Check className="size-3.5" />
                            وافق
                          </ActionButton>
                          <ActionButton
                            action={RejectRemovePoweredByRequestAction.bind(null, r.id)}
                            successMessage="اترفض الطلب"
                            confirm={{ title: "ترفض الطلب؟", description: "التاجر هيوصله إشعار إن الطلب اترفض.", destructive: true, confirmLabel: "ارفض" }}
                          >
                            <X className="size-3.5" />
                            ارفض
                          </ActionButton>
                        </>
                      ) : (
                        <StatusMenu value={r.status} options={STATUS_OPTIONS} action={setServiceRequestStatusAction.bind(null, r.id)} />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </DataCard>
      </div>
    </div>
  );
}
