import Link from "next/link";
import { SearchX, Telescope } from "lucide-react";
import { Prisma, SharksApplicationStatus, SharksTrack } from "@prisma/client";

import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import { prisma } from "@/lib/prisma";
import {
  ListCard,
  Unavailable,
  Segmented,
  Pager,
  SearchInput,
  SelectFilter,
  StatusText,
  readPage,
  readParam,
  type SearchParamsRecord,
} from "@/components/saas-page";
import { APPLICATION_STATUS, TRACKS } from "@/lib/sharks/catalog";
import { fmtDateTime, fmtRelative, pickEnum } from "../_lib/format";

const PAGE_SIZE = 20;
const BASE_PATH = "/admin/sharks";
const STATUSES = Object.keys(APPLICATION_STATUS) as SharksApplicationStatus[];

export default async function AdminSharksApplicationsPage({ searchParams }: { searchParams?: Promise<SearchParamsRecord> }) {
  await requireAdmin();
  const params = await searchParams;
  const q = readParam(params, "q");
  const status = pickEnum(SharksApplicationStatus, readParam(params, "status"));
  const track = pickEnum(SharksTrack, readParam(params, "track"));

  const baseWhere: Prisma.SharksApplicationWhereInput = {
    ...(track && { requestedTracks: { has: track } }),
    ...(q && {
      OR: [
        { businessName: { contains: q, mode: "insensitive" } },
        { industry: { contains: q, mode: "insensitive" } },
        { store: { name: { contains: q, mode: "insensitive" } } },
        { store: { slug: { contains: q, mode: "insensitive" } } },
        { store: { user: { email: { contains: q, mode: "insensitive" } } } },
      ],
    }),
  };
  const where = { ...baseWhere, ...(status && { status }) };

  const [grouped, total] = await Promise.all([
    prisma.sharksApplication.groupBy({ by: ["status"], where: baseWhere, _count: { _all: true } }),
    prisma.sharksApplication.count({ where }),
  ]);
  const counts = Object.fromEntries(grouped.map((g) => [g.status, g._count._all])) as Partial<Record<SharksApplicationStatus, number>>;
  const page = Math.min(readPage(params), Math.max(1, Math.ceil(total / PAGE_SIZE)));

  const rows = await prisma.sharksApplication.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      businessName: true,
      industry: true,
      status: true,
      requestedTracks: true,
      investmentInterest: true,
      createdAt: true,
      updatedAt: true,
      store: { select: { name: true, slug: true } },
      evaluations: { select: { total: true } },
    },
  });

  const now = new Date();
  const filtered = !!(q || status || track);

  return (
    <div className="space-y-4">
      <Segmented
        label="حالة الطلب"
        param="status"
        basePath={BASE_PATH}
        searchParams={params}
        segments={[
          { label: "الكل", count: grouped.reduce((s, g) => s + g._count._all, 0) },
          ...STATUSES.map((s) => ({ label: APPLICATION_STATUS[s].ar, value: s, count: counts[s] ?? 0 })),
        ]}
      />
      <ListCard
        toolbar={
          <>
            <SearchInput placeholder="ابحث باسم البيزنس أو المتجر أو إيميل التاجر" />
            <SelectFilter
              param="track"
              allLabel="كل المسارات"
              label="المسار المطلوب"
              options={(Object.keys(TRACKS) as SharksTrack[]).map((t) => ({ value: t, label: TRACKS[t].name.en }))}
              className="sm:w-48"
            />
          </>
        }
        footer={total > 0 && <Pager page={page} pageSize={PAGE_SIZE} total={total} basePath={BASE_PATH} searchParams={params} noun="طلب" />}
      >
        {rows.length === 0 ? (
          filtered ? (
            <Unavailable
              icon={SearchX}
              title="مفيش طلبات بالفلاتر دي"
              action={
                <Link href={BASE_PATH} className="text-sm text-primary hover:underline">
                  مسح الفلاتر
                </Link>
              }
            />
          ) : (
            <Unavailable icon={Telescope} title="مفيش طلبات لسه" description="لما تاجر يقدّم من لوحة التحكم (Casho Sharks) هيظهر طلبه هنا." />
          )
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r) => {
              const avg = r.evaluations.length ? Math.round(r.evaluations.reduce((s, e) => s + e.total, 0) / r.evaluations.length) : null;
              return (
                <li key={r.id} className="relative grid gap-2 px-4 py-4 hover:bg-muted/30 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto_auto] md:items-center md:gap-6">
                  <div className="min-w-0">
                    <Link href={`${BASE_PATH}/${r.id}`} className="font-semibold after:absolute after:inset-0 hover:underline">
                      {r.businessName}
                    </Link>
                    <p className="truncate text-sm text-muted-foreground">
                      {r.industry} · {r.store.name}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground" dir="ltr">
                    {r.requestedTracks.map((t) => TRACKS[t].name.en).join(" · ")}
                    {r.investmentInterest && <span className="ms-1 text-xs">(+ investment interest)</span>}
                  </p>
                  <div className="text-sm tabular-nums">
                    {avg !== null ? (
                      <span title={`${r.evaluations.length} تقييم`}>{avg} / 100</span>
                    ) : (
                      <span className="text-muted-foreground">بدون تقييم</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 md:justify-end">
                    <span className="text-xs text-muted-foreground" title={fmtDateTime(r.createdAt)}>
                      {fmtRelative(r.createdAt, now)}
                    </span>
                    <StatusText tone={APPLICATION_STATUS[r.status].tone}>{APPLICATION_STATUS[r.status].ar}</StatusText>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </ListCard>
    </div>
  );
}
