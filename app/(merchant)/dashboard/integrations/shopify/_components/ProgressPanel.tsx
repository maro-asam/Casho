"use client";

import { AlertTriangle, Check, Loader2, Pause } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { StatusText, appleButton } from "@/components/saas-page";
import { cn } from "@/lib/utils";
import { entityPercent, overallPercent, totalFailed, totalRemaining } from "@/lib/integrations/import/progress";
import type { JobView } from "@/lib/integrations/import/views";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { IconTile } from "../../../settings/_components/settings-ui";
import { ENTITY_META, JOB_STATUS_META, nf } from "./import-meta";
import { Bar, ENTITY_TILE, Ring } from "./import-ui";

type Props = {
  job: JobView;
  onResume: () => void;
  onCancel: () => void;
  busy: boolean;
  /** Paused because the Shopify connection must be renewed (resume is disabled). */
  needsReconnect: boolean;
};

export function ProgressPanel({ job, onResume, onCancel, busy, needsReconnect }: Props) {
  const paused = job.status === "PAUSED";
  const percent = overallPercent(job.progress);
  const failed = totalFailed(job.progress);
  const remaining = totalRemaining(job.progress);
  const status = JOB_STATUS_META[job.status];

  return (
    <div className="space-y-6" aria-live="polite">
      <section className="apple-card px-6 py-7">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-start">
          <Ring value={percent} warn={paused} />
          <div className="min-w-0 flex-1 space-y-1.5">
            {status && <StatusText tone={status.tone}>{status.label}</StatusText>}
            <h2 className="text-[22px] leading-7 font-bold">
              {paused ? tr("الاستيراد متوقف") : job.kind === "RETRY" ? tr("بنعيد محاولة العناصر الفاشلة…") : tr("بننقل بيانات متجرك من Shopify…")}
            </h2>
            <p className="text-[15px] leading-[21px] text-muted-foreground">
              {paused
                ? tr("كل اللي اتنقل محفوظ. لما تستكمل هنكمل من نفس المكان من غير تكرار.")
                : tr("تقدر تقفل الصفحة دي — الاستيراد شغال في الخلفية وهيوصلك إشعار لما يخلص.")}
            </p>
            <p className="flex flex-wrap justify-center gap-x-4 text-[13px] text-muted-foreground sm:justify-start">
              {remaining > 0 && <span className="tabular-nums">{tr("متبقي تقريباً {0} عنصر", nf.format(remaining))}</span>}
              {failed > 0 && <span className="text-(--sys-orange) tabular-nums">{tr("{0} عنصر فشل لحد دلوقتي", nf.format(failed))}</span>}
            </p>
          </div>
        </div>

        {job.lastError && (
          <p className={cn("mt-6 flex items-start gap-2.5 rounded-[12px] px-4 py-3 text-[13px] leading-[19px]", paused ? "bg-(--sys-orange)/12" : "bg-primary/8")}>
            {paused ? (
              <Pause className="mt-px size-4 shrink-0 text-(--sys-orange)" />
            ) : (
              <Loader2 className="mt-px size-4 shrink-0 animate-spin text-primary" />
            )}
            <span>
              {job.lastError}
              {!paused && tr(" — بنعيد المحاولة تلقائياً.")}
            </span>
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button type="button" disabled={busy} className={cn(appleButton.tinted, "h-11 px-5 text-(--sys-red)")}>
                {tr("إلغاء")}
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent dir={tdir()} className="max-w-[20rem] gap-0 p-0 text-center">
              <AlertDialogHeader className="items-center gap-1 px-5 pt-6 pb-5 text-center sm:text-center">
                <AlertDialogTitle className="text-[17px] font-semibold">{tr("إلغاء الاستيراد؟")}</AlertDialogTitle>
                <AlertDialogDescription className="text-[13px] leading-[18px]">
                  {tr("البيانات اللي اتنقلت لحد دلوقتي هتفضل في متجرك. تقدر تبدأ استيراد جديد بعدين ومش هيتكرر اللي اتنقل.")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="grid grid-cols-2 gap-0 border-t border-border/60 sm:space-x-0">
                <AlertDialogCancel className="m-0 h-11 rounded-none border-0 bg-transparent text-[17px] font-semibold text-primary shadow-none hover:bg-(--fill-3)/60">
                  {tr("كمّل الاستيراد")}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={onCancel}
                  className="m-0 h-11 rounded-none border-0 border-s border-border/60 bg-transparent text-[17px] text-(--sys-red) shadow-none hover:bg-(--fill-3)/60"
                >
                  {tr("إلغاء الاستيراد")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {paused && !needsReconnect && (
            <button type="button" onClick={onResume} disabled={busy} className={cn(appleButton.filled, "px-6")}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              {tr("استكمل الاستيراد")}
            </button>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="px-4 text-[13px] font-semibold text-muted-foreground">{tr("التفاصيل")}</h2>
        <ul className="apple-card apple-rows overflow-hidden rounded-[14px] [--row-inset:58px]">
          {job.entities.map((entity) => {
            const p = job.progress[entity];
            if (!p) return null;
            const meta = ENTITY_META[entity];
            const tile = ENTITY_TILE[entity];
            const pct = entityPercent(p);
            const active = job.currentEntity === entity && !paused;
            return (
              <li key={entity} className="flex items-center gap-3.5 px-4 py-3.5">
                <IconTile icon={tile.icon} tint={p.done || active ? tile.tint : "bg-(--sys-gray)"} />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-[15px] leading-5">
                    <span className="flex items-center gap-2 font-medium">
                      {meta.label}
                      {p.done ? (
                        <span className="grid size-4 place-items-center rounded-full bg-(--sys-green) text-white">
                          <Check className="size-2.5" strokeWidth={3.5} />
                        </span>
                      ) : (
                        active && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                      )}
                    </span>
                    <span className="flex items-center gap-2 text-[13px] tabular-nums text-muted-foreground">
                      {p.failed > 0 && (
                        <span className="inline-flex items-center gap-1 text-(--sys-orange)">
                          <AlertTriangle className="size-3" />
                          {nf.format(p.failed)}
                        </span>
                      )}
                      <span>
                        {nf.format(p.processed)}
                        {p.total !== null && ` / ${nf.format(p.total)}`}
                      </span>
                    </span>
                  </div>
                  <Bar value={pct} tone={p.done ? "success" : paused ? "warning" : "primary"} label={meta.label} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
