import type { Metadata } from "next";
import Link from "next/link";
import { SearchX, ShieldAlert } from "lucide-react";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  DataCard,
  EmptyState,
  PageHeader,
  Pagination,
  SearchInput,
  SelectFilter,
  StatusPill,
  readPage,
  readParam,
  type SearchParamsRecord,
} from "@/components/saas-page";
import { cn } from "@/lib/utils";
import { KpiStrip, th, theadRow } from "../_components/admin-ui";
import { SECURITY_EVENT_META, deviceLabel, fmtDateTime, fmtNum, securityEventMeta } from "../_lib/format";

export const metadata: Metadata = { title: "سجل الأمان" };

const PAGE_SIZE = 40;
const BASE_PATH = "/admin/security";
const DAY = 86_400_000;

export default async function AdminSecurityPage({ searchParams }: { searchParams?: Promise<SearchParamsRecord> }) {
  const params = await searchParams;
  const q = readParam(params, "q");
  const eventParam = readParam(params, "event");
  const event = eventParam && eventParam in SECURITY_EVENT_META ? eventParam : undefined;

  const where: Prisma.SecurityLogWhereInput = {
    ...(event && { event }),
    ...(q && {
      OR: [
        { ipAddress: { contains: q } },
        { user: { email: { contains: q, mode: "insensitive" } } },
        { user: { name: { contains: q, mode: "insensitive" } } },
      ],
    }),
  };

  const since24h = new Date(new Date().getTime() - DAY);
  const [total, failures24h, blocked24h, logins24h, topFailingIps] = await Promise.all([
    prisma.securityLog.count({ where }),
    prisma.loginAttempt.count({ where: { success: false, createdAt: { gte: since24h } } }),
    prisma.securityLog.count({ where: { event: { in: ["LOGIN_BLOCKED", "ACCOUNT_LOCKED"] }, createdAt: { gte: since24h } } }),
    prisma.loginAttempt.count({ where: { success: true, createdAt: { gte: since24h } } }),
    prisma.loginAttempt.groupBy({
      by: ["ipAddress"],
      where: { success: false, createdAt: { gte: since24h }, ipAddress: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { ipAddress: "desc" } },
      take: 1,
    }),
  ]);
  const page = Math.min(readPage(params), Math.max(1, Math.ceil(total / PAGE_SIZE)));

  const logs = await prisma.securityLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: { id: true, event: true, ipAddress: true, userAgent: true, createdAt: true, user: { select: { id: true, name: true, email: true } } },
  });

  const topIp = topFailingIps[0];
  const filtered = !!(q || event);

  return (
    <div className="space-y-6">
      <PageHeader title="سجل الأمان" description="عمليات الدخول والخروج وتغييرات الحسابات على المنصة كلها. مفيد لما حد يبلّغ عن حسابه." />

      <KpiStrip
        items={[
          { label: "دخول ناجح (٢٤ ساعة)", value: fmtNum(logins24h) },
          { label: "محاولات فاشلة (٢٤ ساعة)", value: fmtNum(failures24h), href: `${BASE_PATH}?event=LOGIN_FAILURE` },
          { label: "حظر وقفل حسابات (٢٤ ساعة)", value: fmtNum(blocked24h), href: `${BASE_PATH}?event=LOGIN_BLOCKED` },
          {
            label: "أكتر IP فشل (٢٤ ساعة)",
            value: topIp?.ipAddress ? <span dir="ltr" className="font-mono text-lg">{topIp.ipAddress}</span> : "—",
            hint: topIp ? `${fmtNum(topIp._count._all)} محاولة فاشلة` : "مفيش محاولات فاشلة",
            href: topIp?.ipAddress ? `${BASE_PATH}?q=${encodeURIComponent(topIp.ipAddress)}` : undefined,
          },
        ]}
      />

      <DataCard
        toolbar={
          <>
            <SearchInput placeholder="ابحث بالبريد أو الاسم أو الـ IP" />
            <SelectFilter
              param="event"
              allLabel="كل الأحداث"
              label="الحدث"
              className="sm:w-52"
              options={Object.entries(SECURITY_EVENT_META).map(([value, meta]) => ({ value, label: meta.label }))}
            />
          </>
        }
        footer={total > 0 && <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath={BASE_PATH} searchParams={params} noun="حدث" />}
      >
        {logs.length === 0 ? (
          filtered ? (
            <EmptyState
              icon={SearchX}
              title="مفيش أحداث بالفلاتر دي"
              action={
                <Link href={BASE_PATH} className="text-sm text-primary hover:underline">
                  مسح الفلاتر
                </Link>
              }
            />
          ) : (
            <EmptyState icon={ShieldAlert} title="السجل فاضي" />
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={theadRow}>
                  <th className={cn(th, "ps-4")}>الحدث</th>
                  <th className={th}>المستخدم</th>
                  <th className={cn(th, "hidden md:table-cell")}>الـ IP</th>
                  <th className={cn(th, "hidden lg:table-cell")}>الجهاز</th>
                  <th className={cn(th, "pe-4 text-left")}>الوقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => {
                  const meta = securityEventMeta(log.event);
                  return (
                    <tr key={log.id} className="transition-colors hover:bg-muted/40">
                      <td className="py-3 ps-4">
                        <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                      </td>
                      <td className="max-w-60 py-3">
                        {log.user ? (
                          <Link href={`/admin/users/${log.user.id}`} className="block truncate hover:underline" dir="ltr">
                            <span className="block text-right">{log.user.email}</span>
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="hidden py-3 font-mono text-xs md:table-cell" dir="ltr">
                        <span className="block text-right">{log.ipAddress ?? "—"}</span>
                      </td>
                      <td className="hidden py-3 text-xs text-muted-foreground lg:table-cell">{deviceLabel(log.userAgent)}</td>
                      <td className="py-3 pe-4 text-left text-xs text-muted-foreground">{fmtDateTime(log.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DataCard>
    </div>
  );
}
