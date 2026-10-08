"use client";

import { AlertTriangle, CircleCheck, Loader2, Pause, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { StatusPill } from "@/components/saas-page";
import { cn } from "@/lib/utils";
import { entityPercent, overallPercent, totalFailed, totalRemaining } from "@/lib/integrations/import/progress";
import type { JobView } from "@/lib/integrations/import/views";
import { ENTITY_META, JOB_STATUS_META, nf } from "./import-meta";

export function Bar({ value, tone = "primary" }: { value: number; tone?: "primary" | "warning" | "success" }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500",
          tone === "warning" ? "bg-amber-500" : tone === "success" ? "bg-emerald-500" : "bg-primary",
        )}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

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
    <section className="space-y-5 rounded-xl border border-border bg-card p-5" aria-live="polite">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">
              {paused ? "الاستيراد متوقف" : job.kind === "RETRY" ? "بنعيد محاولة العناصر الفاشلة…" : "بننقل بيانات متجرك من Shopify…"}
            </h2>
            {status && <StatusPill tone={status.tone}>{status.label}</StatusPill>}
          </div>
          <p className="text-sm text-muted-foreground">
            {paused
              ? "كل اللي اتنقل محفوظ. لما تستكمل هنكمل من نفس المكان من غير تكرار."
              : "تقدر تقفل الصفحة دي — الاستيراد شغال في الخلفية وهيوصلك إشعار لما يخلص."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {paused && !needsReconnect && (
            <Button size="sm" onClick={onResume} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
              استكمل الاستيراد
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" disabled={busy}>
                <X className="size-4" />
                إلغاء
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent dir="rtl">
              <AlertDialogHeader>
                <AlertDialogTitle>إلغاء الاستيراد؟</AlertDialogTitle>
                <AlertDialogDescription>
                  البيانات اللي اتنقلت لحد دلوقتي هتفضل في متجرك. تقدر تبدأ استيراد جديد بعدين ومش هيتكرر اللي اتنقل.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>كمّل الاستيراد</AlertDialogCancel>
                <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={onCancel}>
                  إلغاء الاستيراد
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {job.lastError && (
        <p
          className={cn(
            "flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm",
            paused ? "bg-amber-500/10 text-amber-800 dark:text-amber-300" : "bg-sky-500/10 text-sky-800 dark:text-sky-300",
          )}
        >
          {paused ? <Pause className="mt-0.5 size-4 shrink-0" /> : <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin" />}
          <span>
            {job.lastError}
            {!paused && " — بنعيد المحاولة تلقائياً."}
          </span>
        </p>
      )}

      <div className="space-y-2">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium">الإجمالي</span>
          <span className="text-2xl font-bold tabular-nums">{nf.format(percent)}٪</span>
        </div>
        <Bar value={percent} tone={paused ? "warning" : "primary"} />
        <p className="flex flex-wrap gap-x-4 text-xs text-muted-foreground">
          {remaining > 0 && <span>متبقي تقريباً {nf.format(remaining)} عنصر</span>}
          {failed > 0 && <span className="text-amber-700 dark:text-amber-400">{nf.format(failed)} عنصر فشل لحد دلوقتي</span>}
        </p>
      </div>

      <ul className="divide-y divide-border rounded-lg border border-border">
        {job.entities.map((entity) => {
          const p = job.progress[entity];
          if (!p) return null;
          const meta = ENTITY_META[entity];
          const pct = entityPercent(p);
          const active = job.currentEntity === entity && !paused;
          return (
            <li key={entity} className="space-y-2 px-3 py-3">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2 font-medium">
                  {p.done ? (
                    <CircleCheck className="size-4 text-emerald-600" />
                  ) : active ? (
                    <Loader2 className="size-4 animate-spin text-primary" />
                  ) : (
                    <span className="size-4 rounded-full border border-border" aria-hidden />
                  )}
                  {meta.label}
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {nf.format(p.processed)}
                  {p.total !== null && ` / ${nf.format(p.total)}`}
                  {p.failed > 0 && (
                    <span className="ms-2 inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="size-3" />
                      {nf.format(p.failed)}
                    </span>
                  )}
                </span>
              </div>
              <Bar value={pct} tone={p.done ? "success" : "primary"} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
