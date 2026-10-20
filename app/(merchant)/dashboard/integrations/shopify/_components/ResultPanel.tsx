"use client";

import Link from "next/link";
import { AlertTriangle, ChevronLeft, Loader2 } from "lucide-react";
import { appleButton } from "@/components/saas-page";
import type { ImportableEntity, SkipReason } from "@/lib/integrations/import/types";
import type { JobView } from "@/lib/integrations/import/views";
import { cn } from "@/lib/utils";
import { tr, trv } from "@/lib/i18n/dashboard";
import { Group, IconTile } from "../../../settings/_components/settings-ui";
import { ENTITY_META, ITEM_ENTITY_LABEL, SKIP_REASON_LABEL, dateTime, nf } from "./import-meta";
import { ENTITY_TILE, MigrationGlyph } from "./import-ui";

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
    <div className="space-y-6">
      <section className="apple-card flex flex-col items-center px-6 pt-10 pb-8 text-center">
        <MigrationGlyph done={!warnings} />
        <h2 className="mt-6 text-[28px] leading-[34px] font-bold ltr:tracking-[-0.015em]">
          {warnings ? tr("الاستيراد اكتمل مع بعض المشاكل") : tr("الاستيراد اكتمل بنجاح")}
        </h2>
        <p className="mt-1.5 text-[15px] text-muted-foreground">
          {job.completedAt ? tr("خلص {0}", dateTime.format(new Date(job.completedAt))) : null}
          {warnings && <span className="text-(--sys-orange)">{tr(" · {0} عنصر محتاج مراجعة", nf.format(job.unresolvedFailures))}</span>}
        </p>
        <button type="button" onClick={onNewImport} disabled={busy} className={cn(appleButton.tinted, "mt-6 h-11 px-5")}>
          {tr("استيراد مرة تانية")}
        </button>
      </section>

      <Group title={tr("اللي اتنقل")} inset={58}>
        {job.entities.map((entity) => {
          const p = job.progress[entity];
          if (!p) return null;
          const meta = ENTITY_META[entity];
          const tile = ENTITY_TILE[entity];
          const skipReasons = Object.entries(p.skipReasons) as [SkipReason, number][];
          const details = [
            p.updated > 0 && tr("{0} كان موجود واتحدّث", nf.format(p.updated)),
            p.unchanged > 0 && tr("{0} اتنقل قبل كده (من غير تكرار)", nf.format(p.unchanged)),
            ...skipReasons.map(([reason, count]) => tr("{0} اتجاهل: {1}", nf.format(count), SKIP_REASON_LABEL[reason] ?? reason)),
          ].filter(Boolean) as string[];
          return (
            <Link key={entity} href={LINKS[entity]} className="group flex items-center gap-3.5 px-4 py-3 hover:bg-(--fill-3)/50">
              <IconTile icon={tile.icon} tint={tile.tint} />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2 text-[15px] leading-5">
                  <span className="font-medium">{meta.label}</span>
                  {p.failed > 0 && (
                    <span className="inline-flex items-center gap-1 text-[13px] text-(--sys-orange)">
                      <AlertTriangle className="size-3" />
                      {tr("{0} فشل", nf.format(p.failed))}
                    </span>
                  )}
                </span>
                {details.length > 0 && <span className="mt-0.5 block text-[13px] leading-[18px] text-muted-foreground">{details.join(" · ")}</span>}
              </span>
              <span className="text-end">
                <span className="block text-[20px] leading-6 font-semibold tabular-nums">{nf.format(p.imported)}</span>
                <span className="block text-[12px] text-muted-foreground">{tr("{0} اتنقل", meta.noun)}</span>
              </span>
              <ChevronLeft className="size-4 shrink-0 text-(--label-3) ltr:-scale-x-100" />
            </Link>
          );
        })}
      </Group>

      {job.unresolvedFailures > 0 && (
        <Group
          title={tr("العناصر اللي فشلت ({0})", nf.format(job.unresolvedFailures))}
          action={
            <button type="button" onClick={onRetry} disabled={busy} className={cn(appleButton.plain, "h-7 text-[13px] font-semibold")}>
              {busy && <Loader2 className="size-3.5 animate-spin" />}
              {tr("إعادة محاولة العناصر الفاشلة")}
            </button>
          }
          footer={job.unresolvedFailures > job.failures.length ? tr("بنعرض أول {0} بس.", nf.format(job.failures.length)) : undefined}
        >
          <div className="apple-rows max-h-96 overflow-y-auto [--row-inset:16px]">
            {job.failures.map((f) => (
              <div key={`${f.entityType}-${f.externalId}`} className="flex flex-col gap-0.5 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <span className="min-w-0 truncate text-[15px]">
                  <span className="text-[13px] text-muted-foreground">{ITEM_ENTITY_LABEL[f.entityType] ?? f.entityType} · </span>
                  {f.label ?? f.externalId.split("/").pop()}
                </span>
                <span className="shrink-0 text-[13px] text-(--sys-orange)">{trv(f.message)}</span>
              </div>
            ))}
          </div>
        </Group>
      )}
    </div>
  );
}
