import { CalendarCheck2, SearchX } from "lucide-react";
import { requireAdminPage } from "@/lib/admin/page-guard";
import { assertLeadAdmin } from "@/lib/leads/access";
import { ListCard, Pager, Segmented, SelectFilter, Unavailable, readPage, readParam, type SearchParamsRecord } from "@/components/saas-page";
import { FollowUpRows } from "@/components/leads/follow-up-rows";
import { BUCKET_LABELS, FOLLOW_UP_BUCKETS, type FollowUpBucket } from "@/lib/leads/follow-ups";
import { countFollowUps, leadFilterOptions, listFollowUps } from "@/lib/leads/queries";

const BASE = "/admin/leads/follow-ups";

export default async function AdminFollowUpsPage({ searchParams }: { searchParams?: Promise<SearchParamsRecord> }) {
  const admin = assertLeadAdmin(await requireAdminPage());
  const params = await searchParams;
  const raw = readParam(params, "bucket");
  const bucket: FollowUpBucket = FOLLOW_UP_BUCKETS.find((b) => b === raw) ?? "today";
  const repParam = readParam(params, "rep");
  const now = new Date();

  const [{ reps }, counts] = await Promise.all([leadFilterOptions(), countFollowUps(admin, now)]);
  const repId = repParam === "none" || reps.some((r) => r.id === repParam) ? repParam : undefined;
  const list = await listFollowUps(admin, bucket, { page: readPage(params), repId, now });

  return (
    <div className="space-y-4">
      <Segmented
        label="المتابعات"
        param="bucket"
        basePath={BASE}
        searchParams={params}
        segments={FOLLOW_UP_BUCKETS.map((b) => ({ label: BUCKET_LABELS[b], value: b === "today" ? undefined : b, count: counts[b] }))}
      />
      <ListCard
        toolbar={
          <SelectFilter param="rep" allLabel="كل المندوبين" label="المندوب" options={[{ value: "none", label: "متابعات الإدارة" }, ...reps.map((r) => ({ value: r.id, label: r.label }))]} />
        }
        footer={<Pager page={list.page} pageSize={list.pageSize} total={list.total} basePath={BASE} searchParams={params} noun="متابعة" />}
      >
        {list.rows.length === 0 ? (
          <Unavailable
            icon={repId ? SearchX : CalendarCheck2}
            title={bucket === "overdue" ? "مفيش متابعات متأخرة" : bucket === "today" ? "مفيش متابعات النهارده" : bucket === "upcoming" ? "مفيش متابعات جاية" : "مفيش متابعات خلصت لسه"}
            description={bucket === "overdue" ? "كل المواعيد اتعملت في وقتها." : undefined}
          />
        ) : (
          <div className="border-t-[0.5px] border-border">
            <FollowUpRows rows={list.rows} now={now} detailBase="/admin/leads" showRep />
          </div>
        )}
      </ListCard>
    </div>
  );
}
