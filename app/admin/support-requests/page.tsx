import type { Metadata } from "next";
import Link from "next/link";
import { Headset, Mail, SearchX, UserX } from "lucide-react";
import { Prisma, SupportRequestStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { isAccountDeletionRequest } from "@/lib/account-deletion";
import { setSupportRequestStatusAction } from "@/actions/admin/admin-support.actions";
import {
  ListCard,
  Unavailable,
  Segmented,
  PageHeader,
  Pager,
  SearchInput,
  readPage,
  readParam,
  type SearchParamsRecord,
} from "@/components/saas-page";
import { StatusMenu } from "../_components/status-menu";
import { SUPPORT_STATUS_META, fmtDateTime, fmtRelative, pickEnum } from "../_lib/format";

export const metadata: Metadata = { title: "الدعم الفني" };

const PAGE_SIZE = 15;
const BASE_PATH = "/admin/support-requests";
const STATUS_OPTIONS = (Object.keys(SUPPORT_STATUS_META) as SupportRequestStatus[]).map((value) => ({ value, ...SUPPORT_STATUS_META[value] }));

export default async function AdminSupportPage({ searchParams }: { searchParams?: Promise<SearchParamsRecord> }) {
  const params = await searchParams;
  const q = readParam(params, "q");
  const status = pickEnum(SupportRequestStatus, readParam(params, "status"));

  const baseWhere: Prisma.SupportRequestWhereInput = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { message: { contains: q, mode: "insensitive" } },
          { user: { email: { contains: q, mode: "insensitive" } } },
          { store: { name: { contains: q, mode: "insensitive" } } },
          { store: { slug: { contains: q, mode: "insensitive" } } },
        ],
      }
    : {};
  const where = { ...baseWhere, ...(status && { status }) };

  const [grouped, total] = await Promise.all([
    prisma.supportRequest.groupBy({ by: ["status"], where: baseWhere, _count: { _all: true } }),
    prisma.supportRequest.count({ where }),
  ]);
  const counts = Object.fromEntries(grouped.map((g) => [g.status, g._count._all])) as Partial<Record<SupportRequestStatus, number>>;
  const page = Math.min(readPage(params), Math.max(1, Math.ceil(total / PAGE_SIZE)));

  const tickets = await prisma.supportRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: {
      store: { select: { name: true, slug: true } },
      user: { select: { id: true, name: true, email: true, phone_number: true } },
    },
  });

  const now = new Date();
  const filtered = !!(q || status);

  return (
    <div className="space-y-6">
      <PageHeader title="الدعم الفني" description="تذاكر الدعم من التجار. التاجر بيوصله إشعار لما التذكرة تبقى قيد المتابعة أو تتحل." />

      <div className="space-y-4">
        <Segmented
          label="حالة التذكرة"
          param="status"
          basePath={BASE_PATH}
          searchParams={params}
          segments={[
            { label: "الكل", count: grouped.reduce((s, g) => s + g._count._all, 0) },
            ...STATUS_OPTIONS.map((o) => ({ label: o.label, value: o.value, count: counts[o.value] ?? 0 })),
          ]}
        />

        <ListCard
          toolbar={<SearchInput placeholder="ابحث في العنوان أو الرسالة أو البريد أو المتجر" className="sm:max-w-sm" />}
          footer={total > 0 && <Pager page={page} pageSize={PAGE_SIZE} total={total} basePath={BASE_PATH} searchParams={params} noun="تذكرة" />}
        >
          {tickets.length === 0 ? (
            filtered ? (
              <Unavailable
                icon={SearchX}
                title="مفيش تذاكر بالفلاتر دي"
                action={
                  <Link href={BASE_PATH} className="text-sm text-primary hover:underline">
                    مسح الفلاتر
                  </Link>
                }
              />
            ) : (
              <Unavailable icon={Headset} title="مفيش تذاكر دعم" description="لما تاجر يبعت طلب من صفحة الدعم هيظهر هنا." />
            )
          ) : (
            <ul className="divide-y divide-border">
              {tickets.map((t) => (
                <li key={t.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{t.title}</p>
                      {isAccountDeletionRequest(t.title) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                          <UserX className="size-3" />
                          حذف حساب
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground" title={fmtDateTime(t.createdAt)}>
                        {fmtRelative(t.createdAt, now)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap wrap-break-word text-sm leading-6 text-muted-foreground">{t.message}</p>
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      {t.user && (
                        <Link href={`/admin/users/${t.user.id}`} className="hover:text-foreground hover:underline">
                          {t.user.name ?? t.user.email}
                        </Link>
                      )}
                      {t.store && (
                        <>
                          <span aria-hidden>·</span>
                          <Link href={`/admin/stores/${t.store.slug}`} className="hover:text-foreground hover:underline">
                            {t.store.name}
                          </Link>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {/* The delete itself (with its money-history checks) lives on the account page. */}
                    {t.user && isAccountDeletionRequest(t.title) && (
                      <Link
                        href={`/admin/users/${t.user.id}`}
                        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-destructive/30 px-2.5 text-xs text-destructive hover:bg-destructive/5"
                      >
                        <UserX className="size-3.5" />
                        مراجعة الحذف
                      </Link>
                    )}
                    {t.user && (
                      <a
                        href={`mailto:${t.user.email}?subject=${encodeURIComponent(`بخصوص: ${t.title}`)}`}
                        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs hover:bg-muted"
                      >
                        <Mail className="size-3.5" />
                        رد بالبريد
                      </a>
                    )}
                    <StatusMenu value={t.status} options={STATUS_OPTIONS} action={setSupportRequestStatusAction.bind(null, t.id)} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ListCard>
      </div>
    </div>
  );
}
