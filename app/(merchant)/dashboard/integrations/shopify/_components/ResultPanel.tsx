"use client";

import Link from "next/link";
import { AlertTriangle, CircleCheck, Loader2, RefreshCw, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ImportableEntity, SkipReason } from "@/lib/integrations/import/types";
import type { JobView } from "@/lib/integrations/import/views";
import { ENTITY_META, ITEM_ENTITY_LABEL, SKIP_REASON_LABEL, dateTime, nf } from "./import-meta";

const LINKS: Record<ImportableEntity, string> = {
  COLLECTION: "/categories",
  PRODUCT: "/products",
  CUSTOMER: "/crm/customers",
  ORDER: "/orders",
};

type Props = {
  job: JobView;
  onRetry: () => void;
  onNewImport: () => void;
  busy: boolean;
};

export function ResultPanel({ job, onRetry, onNewImport, busy }: Props) {
  const warnings = job.status === "COMPLETED_WITH_ERRORS";

  return (
    <section className="space-y-5 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span
            className={
              warnings
                ? "grid size-10 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400"
                : "grid size-10 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            }
          >
            {warnings ? <AlertTriangle className="size-5" /> : <CircleCheck className="size-5" />}
          </span>
          <div>
            <h2 className="text-base font-semibold">{warnings ? "الاستيراد اكتمل مع بعض المشاكل" : "الاستيراد اكتمل بنجاح"}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {job.completedAt ? `خلص ${dateTime.format(new Date(job.completedAt))}` : null}
              {warnings && ` · ${nf.format(job.unresolvedFailures)} عنصر محتاج مراجعة`}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onNewImport} disabled={busy} className="self-start">
          <RefreshCw className="size-4" />
          استيراد مرة تانية
        </Button>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {job.entities.map((entity) => {
          const p = job.progress[entity];
          if (!p) return null;
          const meta = ENTITY_META[entity];
          const skipReasons = Object.entries(p.skipReasons) as [SkipReason, number][];
          return (
            <li key={entity} className="rounded-lg border border-border px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{meta.label}</span>
                <Link href={LINKS[entity]} className="text-xs text-primary hover:underline">
                  عرض
                </Link>
              </div>
              <ul className="mt-2 space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <CircleCheck className="size-3.5 text-emerald-600" />
                  <span className="tabular-nums">{nf.format(p.imported)}</span> {meta.noun} اتنقل
                </li>
                {p.updated > 0 && (
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <RefreshCw className="size-3.5" />
                    <span className="tabular-nums">{nf.format(p.updated)}</span> كان موجود واتحدّث
                  </li>
                )}
                {p.unchanged > 0 && (
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <CircleCheck className="size-3.5" />
                    <span className="tabular-nums">{nf.format(p.unchanged)}</span> اتنقل قبل كده (من غير تكرار)
                  </li>
                )}
                {skipReasons.map(([reason, count]) => (
                  <li key={reason} className="flex items-start gap-2 text-muted-foreground">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground" aria-hidden />
                    <span>
                      <span className="tabular-nums">{nf.format(count)}</span> اتجاهل: {SKIP_REASON_LABEL[reason] ?? reason}
                    </span>
                  </li>
                ))}
                {p.failed > 0 && (
                  <li className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="size-3.5" />
                    <span className="tabular-nums">{nf.format(p.failed)}</span> فشل
                  </li>
                )}
              </ul>
            </li>
          );
        })}
      </ul>

      {job.unresolvedFailures > 0 && (
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="flex flex-col gap-2 border-b border-border bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold">
              العناصر اللي فشلت ({nf.format(job.unresolvedFailures)})
              {job.unresolvedFailures > job.failures.length && (
                <span className="ms-1 text-xs font-normal text-muted-foreground">— أول {nf.format(job.failures.length)}</span>
              )}
            </p>
            <Button size="sm" onClick={onRetry} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
              إعادة محاولة العناصر الفاشلة
            </Button>
          </div>
          <ul className="max-h-80 divide-y divide-border overflow-y-auto">
            {job.failures.map((f) => (
              <li key={`${f.entityType}-${f.externalId}`} className="flex flex-col gap-0.5 px-4 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <span className="min-w-0 truncate">
                  <span className="text-xs text-muted-foreground">{ITEM_ENTITY_LABEL[f.entityType] ?? f.entityType} · </span>
                  <span className="font-medium">{f.label ?? f.externalId.split("/").pop()}</span>
                </span>
                <span className="shrink-0 text-xs text-amber-700 dark:text-amber-400">{f.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
