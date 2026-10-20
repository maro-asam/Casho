import { History, RotateCcw } from "lucide-react";
import { StatusText, Unavailable } from "@/components/saas-page";
import type { JobView } from "@/lib/integrations/import/views";
import { tr } from "@/lib/i18n/dashboard";
import { ENTITY_META, JOB_STATUS_META, dateTime, nf } from "./import-meta";
import { ShopifyMark } from "./import-ui";

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
    <section className="space-y-2">
      <h2 className="px-4 text-[13px] font-semibold text-muted-foreground">{tr("سجل الاستيراد")}</h2>
      <div className="apple-card overflow-hidden rounded-[14px]">
        {history.length === 0 ? (
          <Unavailable
            icon={History}
            className="py-12"
            title={tr("مفيش عمليات استيراد لسه")}
            description={tr("أول ما تبدأ استيراد هتلاقي تفاصيله هنا: بدأ امتى، خلص امتى، واتنقل كام عنصر.")}
          />
        ) : (
          <ul className="apple-rows [--row-inset:58px]">
            {history.map((job) => {
              const status = JOB_STATUS_META[job.status];
              const failed = failedCount(job);
              const retry = job.kind === "RETRY";
              return (
                <li key={job.id} className="flex items-center gap-3.5 px-4 py-3">
                  {retry ? (
                    <span aria-hidden className="grid size-[29px] shrink-0 place-items-center rounded-[7px] bg-(--sys-gray) text-white">
                      <RotateCcw className="size-[17px]" />
                    </span>
                  ) : (
                    <ShopifyMark size="sm" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate text-[15px] font-medium">{retry ? tr("إعادة محاولة العناصر الفاشلة") : tr("استيراد من Shopify")}</p>
                      <time className="shrink-0 text-[13px] text-muted-foreground" dateTime={job.startedAt ?? job.createdAt}>
                        {dateTime.format(new Date(job.startedAt ?? job.createdAt))}
                      </time>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <p className="min-w-0 truncate text-[13px] tabular-nums text-muted-foreground">
                        {summary(job) || "—"}
                        {failed > 0 && <span className="text-(--sys-orange)"> · {tr("{0} فشل", nf.format(failed))}</span>}
                      </p>
                      {status && <StatusText tone={status.tone}>{status.label}</StatusText>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
