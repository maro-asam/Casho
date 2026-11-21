import Link from "next/link";
import { Download, Inbox, SearchX } from "lucide-react";
import { requireAdminPage } from "@/lib/admin/page-guard";
import { assertLeadAdmin } from "@/lib/leads/access";
import { ListCard, Pager, Segmented, Unavailable, appleButton, hrefWith, type SearchParamsRecord } from "@/components/saas-page";
import { LeadFiltersBar } from "@/components/leads/leads-filters";
import { LeadsTable } from "@/components/leads/leads-table";
import { toTableRow } from "@/components/leads/to-row";
import { LEAD_STATUSES, STATUS_META } from "@/lib/leads/constants";
import { hasNarrowingFilters, readLeadFilters } from "@/lib/leads/filters";
import { countLeadsByStatus, leadFilterOptions, listLeads } from "@/lib/leads/queries";
import { cn } from "@/lib/utils";

const BASE = "/admin/leads/list";


export default async function AllLeadsPage({ searchParams }: { searchParams?: Promise<SearchParamsRecord> }) {
  const admin = assertLeadAdmin(await requireAdminPage());
  const params = await searchParams;
  const f = readLeadFilters(params);
  const now = new Date();

  const [list, counts, options] = await Promise.all([listLeads(admin, f), countLeadsByStatus(admin, f), leadFilterOptions()]);
  const filtered = hasNarrowingFilters(f);
  const exportQuery = new URLSearchParams(Object.entries(params ?? {}).flatMap(([k, v]) => (typeof v === "string" && v && k !== "page" ? [[k, v]] : []))).toString();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative -mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
          <Segmented
            label="المرحلة"
            param="status"
            basePath={BASE}
            searchParams={params}
            segments={[{ label: "الكل", count: counts.all }, ...LEAD_STATUSES.map((s) => ({ label: STATUS_META[s].label, value: s, count: counts[s] }))]}
          />
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Segmented
            label="العرض"
            param="view"
            basePath={BASE}
            searchParams={params}
            segments={[
              { label: "شغالة" },
              { label: "الأرشيف", value: "archived" },
              { label: "المحذوفة", value: "deleted" },
            ]}
          />
        </div>
      </div>

      <ListCard
        toolbar={
          <LeadFiltersBar
            mode="admin"
            reps={options.reps}
            categories={options.categories}
            cities={options.cities}
          />
        }
        footer={
          <div className="flex flex-col items-stretch justify-between gap-2 sm:flex-row sm:items-center">
            <Pager page={list.page} pageSize={list.pageSize} total={list.total} basePath={BASE} searchParams={params} noun="ليد" />
            {list.total > 0 && (
              <div className="flex items-center justify-center gap-1 px-5 pb-4 sm:pb-0">
                <span className="text-[13px] text-muted-foreground">صدّر النتيجة:</span>
                <a href={`/api/admin/leads/export?${exportQuery}&format=csv`} className={appleButton.plain}>
                  <Download className="size-4" />
                  CSV
                </a>
                <a href={`/api/admin/leads/export?${exportQuery}&format=xlsx`} className={appleButton.plain}>
                  <Download className="size-4" />
                  Excel
                </a>
              </div>
            )}
          </div>
        }
      >
        {list.rows.length === 0 ? (
          filtered || f.view !== "active" ? (
            <Unavailable
              icon={SearchX}
              title={f.view === "deleted" ? "مفيش ليدز ممسوحة" : f.view === "archived" ? "الأرشيف فاضي" : "مفيش ليدز بالفلاتر دي"}
              action={
                filtered ? (
                  <Link href={hrefWith(BASE, { view: f.view === "active" ? undefined : f.view }, {})} className={appleButton.plain}>
                    مسح الفلاتر
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <Unavailable
              icon={Inbox}
              title="مفيش ليدز لسه"
              description="ضيف ليد أو ارفع ملف — وبعدين اسندهم للمندوبين من هنا."
              action={
                <Link href="/admin/leads/new" className={cn(appleButton.filled)}>
                  ليد جديد
                </Link>
              }
            />
          )
        ) : (
          <LeadsTable
            rows={list.rows.map(toTableRow)}
            mode="admin"
            reps={options.reps}
            detailBase="/admin/leads"
            basePath={BASE}
            searchParams={params}
            sort={f.sort}
            dir={f.dir}
            now={now}
          />
        )}
      </ListCard>
    </div>
  );
}
