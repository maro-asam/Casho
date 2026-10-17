import type { Metadata } from "next";
import Link from "next/link";
import { SearchX, Users } from "lucide-react";
import { Prisma, UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  DataCard,
  EmptyState,
  FilterTabs,
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
import { th, theadRow } from "../_components/admin-ui";
import { ROLE_META, fmtDate, fmtRelative, pickEnum } from "../_lib/format";

export const metadata: Metadata = { title: "المستخدمين" };

const PAGE_SIZE = 25;
const BASE_PATH = "/admin/users";
const STORE_FILTER = { with: "عنده متجر", without: "من غير متجر", unverified: "بريد مش متأكد" } as const;

export default async function AdminUsersPage({ searchParams }: { searchParams?: Promise<SearchParamsRecord> }) {
  const params = await searchParams;
  const q = readParam(params, "q");
  const role = pickEnum(UserRole, readParam(params, "role"));
  const facetParam = readParam(params, "has");
  const facet = facetParam && facetParam in STORE_FILTER ? (facetParam as keyof typeof STORE_FILTER) : undefined;

  const baseWhere: Prisma.UserWhereInput = {
    ...(facet === "with" && { stores: { some: {} } }),
    ...(facet === "without" && { stores: { none: {} } }),
    ...(facet === "unverified" && { emailVerified: false }),
    ...(q && {
      OR: [
        { email: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
        { phone_number: { contains: q } },
        { stores: { some: { OR: [{ name: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }] } } },
      ],
    }),
  };
  const where = { ...baseWhere, ...(role && { role }) };

  const [grouped, total] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], where: baseWhere, _count: { _all: true } }),
    prisma.user.count({ where }),
  ]);
  const counts = Object.fromEntries(grouped.map((g) => [g.role, g._count._all])) as Partial<Record<UserRole, number>>;
  const page = Math.min(readPage(params), Math.max(1, Math.ceil(total / PAGE_SIZE)));

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      name: true,
      email: true,
      phone_number: true,
      role: true,
      emailVerified: true,
      googleId: true,
      createdAt: true,
      stores: { select: { name: true, slug: true }, take: 2, orderBy: { createdAt: "asc" } },
      _count: { select: { stores: true } },
      sessions: { select: { lastUsedAt: true }, orderBy: { lastUsedAt: "desc" }, take: 1 },
    },
  });

  const now = new Date();
  const filtered = !!(q || role || facet);

  return (
    <div className="space-y-6">
      <PageHeader title="المستخدمين" description="كل الحسابات على المنصة: تجار، أدمن، ومندوبين. افتح الحساب عشان تشوف جلساته ونشاطه." />

      <div className="space-y-4">
        <FilterTabs
          label="الدور"
          param="role"
          basePath={BASE_PATH}
          searchParams={params}
          tabs={[
            { label: "الكل", count: grouped.reduce((s, g) => s + g._count._all, 0) },
            ...(Object.keys(ROLE_META) as UserRole[]).map((r) => ({ label: ROLE_META[r].label, value: r, count: counts[r] ?? 0 })),
          ]}
        />

        <DataCard
          toolbar={
            <>
              <SearchInput placeholder="ابحث بالاسم أو البريد أو الموبايل أو المتجر" className="sm:max-w-sm" />
              <SelectFilter param="has" allLabel="كل الحسابات" label="فلتر الحساب" options={Object.entries(STORE_FILTER).map(([value, label]) => ({ value, label }))} />
            </>
          }
          footer={total > 0 && <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath={BASE_PATH} searchParams={params} noun="مستخدم" />}
        >
          {users.length === 0 ? (
            filtered ? (
              <EmptyState
                icon={SearchX}
                title="مفيش مستخدمين بالفلاتر دي"
                action={
                  <Link href={BASE_PATH} className="text-sm text-primary hover:underline">
                    مسح الفلاتر
                  </Link>
                }
              />
            ) : (
              <EmptyState icon={Users} title="مفيش مستخدمين لسه" />
            )
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={theadRow}>
                      <th className={cn(th, "ps-4")}>المستخدم</th>
                      <th className={cn(th, "hidden lg:table-cell")}>الموبايل</th>
                      <th className={th}>الدور</th>
                      <th className={th}>المتاجر</th>
                      <th className={cn(th, "hidden xl:table-cell")}>آخر نشاط</th>
                      <th className={cn(th, "pe-4 text-left")}>سجّل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((u) => (
                      <tr key={u.id} className="relative transition-colors hover:bg-muted/40">
                        <td className="max-w-72 py-3 ps-4">
                          <Link href={`${BASE_PATH}/${u.id}`} className="block truncate font-medium after:absolute after:inset-0">
                            {u.name ?? "بدون اسم"}
                          </Link>
                          <p className="truncate text-xs text-muted-foreground" dir="ltr">
                            {u.email}
                            {!u.emailVerified && <span className="ms-1 text-amber-600 dark:text-amber-400">• غير متأكد</span>}
                          </p>
                        </td>
                        <td className="hidden py-3 text-muted-foreground lg:table-cell" dir="ltr">
                          <span className="block text-right">{u.phone_number ?? "—"}</span>
                        </td>
                        <td className="py-3">
                          <StatusPill tone={ROLE_META[u.role].tone}>{ROLE_META[u.role].label}</StatusPill>
                        </td>
                        <td className="max-w-48 py-3">
                          {u.stores.length === 0 ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <span className="block truncate">
                              {u.stores[0].name}
                              {u._count.stores > 1 && <span className="text-xs text-muted-foreground"> +{u._count.stores - 1}</span>}
                            </span>
                          )}
                        </td>
                        <td className="hidden py-3 text-muted-foreground xl:table-cell">{u.sessions[0] ? fmtRelative(u.sessions[0].lastUsedAt, now) : "—"}</td>
                        <td className="py-3 pe-4 text-left text-muted-foreground">{fmtDate(u.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="divide-y divide-border md:hidden">
                {users.map((u) => (
                  <li key={u.id} className="relative px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <Link href={`${BASE_PATH}/${u.id}`} className="min-w-0 truncate font-medium after:absolute after:inset-0">
                        {u.name ?? "بدون اسم"}
                      </Link>
                      <StatusPill tone={ROLE_META[u.role].tone}>{ROLE_META[u.role].label}</StatusPill>
                    </div>
                    <p className="truncate text-xs text-muted-foreground" dir="ltr">
                      {u.email}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {u.stores[0]?.name ?? "من غير متجر"} · سجّل {fmtDate(u.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </DataCard>
      </div>
    </div>
  );
}
