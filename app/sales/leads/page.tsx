import Link from "next/link";
import { CalendarCheck2, Inbox, SearchX } from "lucide-react";
import { KpiStrip } from "@/app/admin/_components/admin-ui";
import { LargeTitle, ListCard, Pager, Segmented, Unavailable, appleButton, readPage, readParam, type SearchParamsRecord } from "@/components/saas-page";
import { FollowUpRows } from "@/components/leads/follow-up-rows";
import { LeadFiltersBar } from "@/components/leads/leads-filters";
import { LeadsTable } from "@/components/leads/leads-table";
import { toTableRow } from "@/components/leads/to-row";
import { LEAD_STATUSES, STATUS_META } from "@/lib/leads/constants";
import { hasNarrowingFilters, readLeadFilters } from "@/lib/leads/filters";
import { BUCKET_LABELS, FOLLOW_UP_BUCKETS, type FollowUpBucket } from "@/lib/leads/follow-ups";
import { countLeadsByStatus, getRepLeadStats, listFollowUps, listLeads } from "@/lib/leads/queries";
import type { LeadActor } from "@/lib/leads/workflow";
import { requireSalesRep } from "@/lib/sales/guard";
import { fmtNum, fmtPct } from "@/lib/sales/format";

const BASE = "/sales/leads";

export default async function MyLeadsPage({ searchParams }: { searchParams?: Promise<SearchParamsRecord> }) {
  const rep = await requireSalesRep();
  // Scope comes from the session only: the rep id is never read from the URL.
  const actor: LeadActor = { kind: "rep", userId: rep.userId, salesRepId: rep.salesRepId };
  const params = await searchParams;
  const tab = readParam(params, "tab") === "followups" ? "followups" : "leads";
  const now = new Date();
  const stats = await getRepLeadStats(rep.salesRepId, now);

  const header = (
    <>
      <LargeTitle title="ليداتي" subtitle="التجار اللي الإدارة سندتهم لك ولسه مسجلوش. كلّمهم، سجّل اللي حصل، وحدّد المتابعة الجاية — وأول ما حد فيهم يدفع اشتراك بيتحسب تحويل." />
      <KpiStrip
        items={[
          { label: "شغالين", value: fmtNum(stats.open), hint: `${fmtNum(stats.untouched)} لسه متكلمتش معاهم`, href: `${BASE}?status=ASSIGNED` },
          { label: "متابعات النهارده", value: fmtNum(stats.followUps.today), hint: stats.followUps.overdue ? `${fmtNum(stats.followUps.overdue)} متأخرة` : "مفيش متأخر", href: `${BASE}?tab=followups` },
          { label: "اتحوّلوا لعملاء", value: fmtNum(stats.converted), hint: "دفعوا أول اشتراك" },
          { label: "نسبة الكسب", value: stats.winRate === null ? "—" : fmtPct(stats.winRate), hint: `${fmtNum(stats.converted)} كسب · ${fmtNum(stats.lost)} خسارة` },
        ]}
      />
      <Segmented
        label="العرض"
        param="tab"
        basePath={BASE}
        searchParams={{}}
        segments={[
          { label: "الليدز", count: stats.total },
          { label: "المتابعات", value: "followups", count: stats.followUps.overdue + stats.followUps.today + stats.followUps.upcoming },
        ]}
      />
    </>
  );

  if (stats.total === 0) {
    return (
      <div className="space-y-6">
        {header}
        <div className="apple-card">
          <Unavailable icon={Inbox} title="مفيش ليدز متسندة لك لسه" description="أول ما الإدارة تسند لك ليد هيوصلك تنبيه وهيظهر هنا." />
        </div>
      </div>
    );
  }

  if (tab === "followups") {
    const raw = readParam(params, "bucket");
    const bucket: FollowUpBucket = FOLLOW_UP_BUCKETS.find((b) => b === raw) ?? "today";
    const list = await listFollowUps(actor, bucket, { page: readPage(params), now });
    return (
      <div className="space-y-6">
        {header}
        <Segmented
          label="المتابعات"
          param="bucket"
          basePath={BASE}
          searchParams={params}
          segments={FOLLOW_UP_BUCKETS.map((b) => ({ label: BUCKET_LABELS[b], value: b === "today" ? undefined : b, count: stats.followUps[b] }))}
        />
        <ListCard footer={<Pager page={list.page} pageSize={list.pageSize} total={list.total} basePath={BASE} searchParams={params} noun="متابعة" />}>
          {list.rows.length === 0 ? (
            <Unavailable icon={CalendarCheck2} title={bucket === "overdue" ? "مفيش متأخر — عاش" : "مفيش متابعات هنا"} description="حدّد متابعة من صفحة أي ليد." />
          ) : (
            <FollowUpRows rows={list.rows} now={now} detailBase={BASE} showRep={false} />
          )}
        </ListCard>
      </div>
    );
  }

  const f = readLeadFilters(params);
  const [list, counts] = await Promise.all([listLeads(actor, f), countLeadsByStatus(actor, f)]);
  const filtered = hasNarrowingFilters(f);

  return (
    <div className="space-y-6">
      {header}
      <div className="relative -mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
        <Segmented
          label="المرحلة"
          param="status"
          basePath={BASE}
          searchParams={params}
          segments={[
            { label: "الكل", count: counts.all },
            ...LEAD_STATUSES.filter((s) => s !== "NEW").map((s) => ({ label: s === "ASSIGNED" ? "لسه متكلمتش" : STATUS_META[s].label, value: s, count: counts[s] })),
          ]}
        />
      </div>
      <ListCard
        toolbar={<LeadFiltersBar mode="rep" />}
        footer={<Pager page={list.page} pageSize={list.pageSize} total={list.total} basePath={BASE} searchParams={params} noun="ليد" />}
      >
        {list.rows.length === 0 ? (
          <Unavailable
            icon={SearchX}
            title="مفيش ليدز بالفلاتر دي"
            action={
              filtered ? (
                <Link href={BASE} className={appleButton.plain}>
                  مسح الفلاتر
                </Link>
              ) : undefined
            }
          />
        ) : (
          <LeadsTable rows={list.rows.map(toTableRow)} mode="rep" detailBase={BASE} basePath={BASE} searchParams={params} sort={f.sort} dir={f.dir} now={now} />
        )}
      </ListCard>
    </div>
  );
}
