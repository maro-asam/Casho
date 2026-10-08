"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  CancelImportJobAction,
  GetImportJobStatusAction,
  LoadShopifyPreviewAction,
  ResumeImportJobAction,
  RetryFailedItemsAction,
  StartShopifyImportAction,
} from "@/actions/integrations/shopify-import.actions";
import { deriveViewState } from "@/lib/integrations/import/progress";
import { IMPORTABLE_ENTITIES, type ImportableEntity } from "@/lib/integrations/import/types";
import type { ConnectionView, JobView } from "@/lib/integrations/import/views";
import type { ShopifyPreviewCounts } from "@/lib/integrations/shopify/source";
import { ConnectPanel } from "./ConnectPanel";
import { CONNECT_ERRORS } from "./import-meta";
import { PreviewPanel, PreviewSkeleton } from "./PreviewPanel";
import { ProgressPanel } from "./ProgressPanel";
import { ResultPanel } from "./ResultPanel";
import { ShopCard } from "./ShopCard";

const POLL_MS = 3000;

type Preview =
  | { status: "idle" | "loading" }
  | { status: "ready"; counts: ShopifyPreviewCounts }
  | { status: "error"; error: string };

type Props = {
  configured: boolean;
  connection: ConnectionView | null;
  job: JobView | null;
  flash: { connected: boolean; error: string | null };
};

export function ShopifyImportClient({ configured, connection: initialConnection, job: initialJob, flash }: Props) {
  const router = useRouter();
  const [connection, setConnection] = useState(initialConnection);
  const [job, setJob] = useState(initialJob);
  // Just came back from Shopify → go straight to the preview.
  const justConnected = flash.connected && initialConnection?.status === "ACTIVE";
  const [preview, setPreview] = useState<Preview>({ status: justConnected ? "loading" : "idle" });
  const [selected, setSelected] = useState<ImportableEntity[]>([...IMPORTABLE_ENTITIES]);
  const [connecting, setConnecting] = useState(false);
  const [resultDismissed, setResultDismissed] = useState(justConnected);
  const [busy, startTransition] = useTransition();
  const autoPreviewed = useRef(false);

  // Server re-renders (router.refresh) bring fresh props — adopt them.
  const [serverProps, setServerProps] = useState({ initialConnection, initialJob });
  if (serverProps.initialConnection !== initialConnection || serverProps.initialJob !== initialJob) {
    setServerProps({ initialConnection, initialJob });
    setConnection(initialConnection);
    setJob(initialJob);
  }

  const view = deriveViewState({
    connectionStatus: connection?.status ?? null,
    job,
    preview: preview.status,
    connecting,
    resultDismissed,
  });

  const fetchPreview = useCallback(() => {
    LoadShopifyPreviewAction()
      .then((result) => {
        if (result.ok) {
          setConnection(result.connection);
          setPreview({ status: "ready", counts: result.counts });
        } else {
          setPreview({ status: "error", error: result.error });
          router.refresh();
        }
      })
      .catch(() => setPreview({ status: "error", error: "تعذّر تحميل المعاينة — جرّب تاني" }));
  }, [router]);

  function loadPreview() {
    setPreview({ status: "loading" });
    fetchPreview();
  }

  useEffect(() => {
    if (autoPreviewed.current || !justConnected) return;
    autoPreviewed.current = true;
    toast.success(`تم الربط مع ${initialConnection?.shopName ?? "Shopify"}`);
    fetchPreview();
  }, [justConnected, initialConnection, fetchPreview]);

  // Keep the progress live while importing (the poll also nudges the job forward).
  const jobId = job?.id;
  const polling = view === "importing";
  useEffect(() => {
    if (!polling || !jobId) return;
    let stopped = false;
    const timer = setInterval(async () => {
      try {
        const result = await GetImportJobStatusAction(jobId);
        if (stopped || !result.ok) return;
        setJob(result.job);
        if (result.job.status !== "QUEUED" && result.job.status !== "RUNNING") router.refresh();
      } catch {
        // Offline for a moment — the next tick tries again.
      }
    }, POLL_MS);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [polling, jobId, router]);

  function run(action: () => Promise<{ ok: true; job: JobView } | { ok: false; error: string }>, success?: string) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        toast.error(result.error);
        router.refresh();
        return;
      }
      setJob(result.job);
      setPreview({ status: "idle" });
      setResultDismissed(false);
      if (success) toast.success(success);
      router.refresh();
    });
  }

  const flashError = flash.error ? (CONNECT_ERRORS[flash.error] ?? CONNECT_ERRORS.server_error) : null;

  return (
    <div className="space-y-4">
      {flashError && view !== "importing" && (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-2.5 text-sm text-rose-700 dark:text-rose-400">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {flashError}
        </p>
      )}

      {connection && connection.status === "ACTIVE" && view !== "connecting" && (
        <ShopCard connection={connection} busy={view === "importing" || view === "paused"} />
      )}

      {(view === "not_connected" || view === "connecting") && (
        <ConnectPanel configured={configured} connecting={connecting} onConnecting={() => setConnecting(true)} />
      )}

      {view === "needs_reconnect" && (
        <ConnectPanel
          configured={configured}
          reconnect
          shopDomain={connection?.shopDomain}
          connecting={connecting}
          onConnecting={() => setConnecting(true)}
        />
      )}

      {view === "connected" && (
        <section className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">جاهز ننقل بياناتك</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {preview.status === "error"
                ? preview.error
                : "هنعدّ اللي في متجرك على Shopify ونوريك هينقل إيه قبل ما نبدأ أي حاجة."}
            </p>
          </div>
          <Button onClick={loadPreview}>
            <Search className="size-4" />
            {preview.status === "error" ? "جرّب تاني" : "معاينة البيانات"}
          </Button>
        </section>
      )}

      {view === "loading_preview" && <PreviewSkeleton />}

      {view === "preview_ready" && preview.status === "ready" && connection && (
        <PreviewPanel
          counts={preview.counts}
          connection={connection}
          selected={selected}
          starting={busy}
          onToggle={(entity, checked) =>
            setSelected((current) => (checked ? [...new Set([...current, entity])] : current.filter((e) => e !== entity)))
          }
          onStart={() => run(() => StartShopifyImportAction(selected), "بدأ الاستيراد")}
        />
      )}

      {(view === "importing" || view === "paused") && job && (
        <>
          {view === "paused" && connection?.status !== "ACTIVE" && (
            <ConnectPanel
              configured={configured}
              reconnect
              shopDomain={connection?.shopDomain}
              connecting={connecting}
              onConnecting={() => setConnecting(true)}
            />
          )}
          <ProgressPanel
            job={job}
            busy={busy}
            needsReconnect={connection?.status !== "ACTIVE"}
            onResume={() => run(() => ResumeImportJobAction(job.id), "رجعنا نكمّل الاستيراد")}
            onCancel={() => run(() => CancelImportJobAction(job.id), "تم إلغاء الاستيراد")}
          />
        </>
      )}

      {(view === "completed" || view === "completed_with_warnings") && job && (
        <ResultPanel
          job={job}
          busy={busy}
          onRetry={() => run(() => RetryFailedItemsAction(job.id), "بدأنا نعيد محاولة العناصر الفاشلة")}
          onNewImport={() => {
            setResultDismissed(true);
            loadPreview();
          }}
        />
      )}
    </div>
  );
}
