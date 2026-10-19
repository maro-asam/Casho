import { History } from "lucide-react";
import { DataCard, EmptyState, StatusPill } from "@/components/saas-page";
import type { JobView } from "@/lib/integrations/import/views";
import { ENTITY_META, JOB_STATUS_META, dateTime, nf } from "./import-meta";
import { tr } from "@/lib/i18n/dashboard";

function summary(job: JobView) {
  return job.entities
    .map((entity) => {
      const p = job.progress[entity];
      if (!p) return null;
      const count = p.imported + p.updated + p.unchanged;
      return `${nf.format(count)} ${ENTITY_META[entity].noun}`;
    })
    .filter(Boolean)
    .join(" · ");
}

function failedCount(job: JobView) {
  return Object.values(job.progress).reduce((sum, p) => sum + (p?.failed ?? 0), 0);
}

/** Every import of this store, newest first. */
export function ImportHistory({ history }: { history: JobView[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground">{tr("سجل الاستيراد")}</h2>
      <DataCard>
        {history.length === 0 ? (
          <EmptyState icon={History} title={tr("مفيش عمليات استيراد لسه")} description={tr("أول ما تبدأ استيراد هتلاقي تفاصيله هنا: بدأ امتى، خلص امتى، واتنقل كام عنصر.")} />
        ) : (
          <ul className="divide-y divide-border">
            {history.map((job) => {
              const status = JOB_STATUS_META[job.status];
              const failed = failedCount(job);
              return (
                <li key={job.id} className="flex flex-col gap-1.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="min-w-0 space-y-0.5">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      {job.kind === "RETRY" ? tr("إعادة محاولة العناصر الفاشلة") : tr("استيراد من Shopify")}
                      {status && <StatusPill tone={status.tone}>{status.label}</StatusPill>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tr("بدأ {0}", dateTime.format(new Date(job.startedAt ?? job.createdAt)))}
                      {job.completedAt && tr(" · انتهى {0}", dateTime.format(new Date(job.completedAt)))}
                    </p>
                  </div>
                  <div className="shrink-0 text-xs text-muted-foreground sm:text-end">
                    <p className="tabular-nums">{summary(job) || "—"}</p>
                    {failed > 0 && <p className="text-amber-700 tabular-nums dark:text-amber-400">{tr("{0} فشل", nf.format(failed))}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </DataCard>
    </section>
  );
}
