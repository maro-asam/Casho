"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play, X } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { appleButton } from "@/components/saas-page";
import { cancelLeadImportAction, runLeadImportBatchAction } from "@/actions/leads/lead-import.actions";

const nf = new Intl.NumberFormat("ar-EG");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Runs an import batch by batch. Each call is one server transaction; closing
 * the page just pauses — opening it again resumes where it stopped.
 */
export function ImportRunner({ importId, toProcess, canStart }: { importId: string; toProcess: number; canStart: boolean }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [canceling, setCanceling] = useState(false);

  async function start() {
    setRunning(true);
    let processed = 0;
    let busyTries = 0;
    try {
      for (;;) {
        const res = await runLeadImportBatchAction({ importId });
        if (!res.success) {
          toast.error(res.message);
          break;
        }
        if (res.busy) {
          // Another tab is running a batch of this import: wait for it.
          if (++busyTries > 20) {
            toast.error("في صفحة تانية شغّالة على نفس الاستيراد");
            break;
          }
          await sleep(1500);
          continue;
        }
        busyTries = 0;
        processed += res.processed;
        setDone(processed);
        if (res.done) {
          toast.success("خلص الاستيراد");
          break;
        }
      }
    } catch {
      toast.error("الاتصال وقف — افتح الصفحة تاني وكمّل من مكانك");
    } finally {
      setRunning(false);
      router.refresh();
    }
  }

  async function cancel() {
    setCanceling(true);
    const res = await cancelLeadImportAction({ importId });
    setCanceling(false);
    if (res.success) toast.success(res.message);
    else toast.error(res.message);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {running ? (
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-[14px]">
            بنضيف الليدز… <span className="tabular-nums text-muted-foreground">{nf.format(done)} / {nf.format(toProcess)}</span>
          </p>
          <Progress value={(100 * done) / Math.max(1, toProcess)} />
        </div>
      ) : (
        <p className="min-w-0 flex-1 text-[14px] text-muted-foreground">
          {toProcess > 0 ? `هيتعالج ${nf.format(toProcess)} صف على دفعات. تقدر تقفل الصفحة وترجع تكمّل.` : "مفيش صفوف تتضاف."}
        </p>
      )}
      <div className="flex shrink-0 gap-2">
        <button type="button" onClick={cancel} disabled={running || canceling} className={appleButton.tinted}>
          {canceling ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
          الغي
        </button>
        {canStart && toProcess > 0 && (
          <button type="button" onClick={start} disabled={running} className={appleButton.filled}>
            {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
            {running ? "شغّال…" : "أكّد وابدأ الاستيراد"}
          </button>
        )}
      </div>
    </div>
  );
}
