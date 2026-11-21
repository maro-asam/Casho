import { requireAdminPage } from "@/lib/admin/page-guard";
import { assertLeadAdmin } from "@/lib/leads/access";
import { SearchInput, SelectFilter, type SearchParamsRecord } from "@/components/saas-page";
import { PipelineBoard } from "@/components/leads/pipeline-board";
import { readLeadFilters } from "@/lib/leads/filters";
import { getPipeline, leadFilterOptions, PIPELINE_COLUMN_SIZE, repLabel } from "@/lib/leads/queries";
import { PRIORITIES, PRIORITY_META } from "@/lib/leads/constants";

export default async function PipelinePage({ searchParams }: { searchParams?: Promise<SearchParamsRecord> }) {
  const admin = assertLeadAdmin(await requireAdminPage());
  const params = await searchParams;
  const f = readLeadFilters(params);
  const now = new Date();
  const [columns, options] = await Promise.all([getPipeline(admin, { ...f, view: "active" }), leadFilterOptions()]);

  return (
    <div className="space-y-4">
      <div className="apple-card flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <SearchInput placeholder="ابحث بالاسم أو الموبايل" />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
          <SelectFilter param="rep" allLabel="كل المندوبين" label="المندوب" className="sm:w-44" options={[{ value: "none", label: "مش متسند" }, ...options.reps.map((r) => ({ value: r.id, label: r.label }))]} />
          <SelectFilter param="priority" allLabel="كل الأولويات" label="الأولوية" className="sm:w-40" options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_META[p].label }))} />
        </div>
      </div>
      <p className="px-1 text-[13px] text-muted-foreground">
        اسحب الكارت من المقبض لمرحلة تانية. كل عمود بيعرض أعلى {PIPELINE_COLUMN_SIZE} حسب الأولوية. عمود «اتحوّل» بيتملى لوحده.
      </p>
      <PipelineBoard
        now={now}
        columns={columns.map((c) => ({
          status: c.status,
          count: c.count,
          leads: c.leads.map((l) => ({
            id: l.id,
            businessName: l.businessName,
            ownerName: l.ownerName,
            city: l.city,
            priority: l.priority,
            score: l.score,
            nextFollowUpAt: l.nextFollowUpAt,
            repName: repLabel(l.assignedRep),
            hasRep: !!l.assignedRep,
          })),
        }))}
      />
    </div>
  );
}
