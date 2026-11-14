"use client";

import { useCallback, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { appleButton } from "@/components/saas-page";
import type { ImportProvider } from "@prisma/client";
import {
  CancelImportJobAction,
  GetImportJobStatusAction,
  LoadImportPreviewAction,
  ResumeImportJobAction,
  RetryFailedItemsAction,
  StartImportAction,
} from "@/actions/integrations/store-import.actions";
import { deriveViewState } from "@/lib/integrations/import/progress";
import { IMPORTABLE_ENTITIES, type ImportableEntity, type PreviewCounts } from "@/lib/integrations/import/types";
import type { ConnectionView, JobView } from "@/lib/integrations/import/views";
import { cn } from "@/lib/utils";
import { ConnectPanel } from "./ConnectPanel";
import { MigrationGlyph, Steps, type StepId } from "./import-ui";
import { providerCopy } from "./provider-ui";
import { NotImportedCard, PreviewPanel, PreviewSkeleton } from "./PreviewPanel";
import { ProgressPanel } from "./ProgressPanel";
import { ResultPanel } from "./ResultPanel";
import { ShopCard } from "./ShopCard";
import { tr, trv } from "@/lib/i18n/dashboard";

const POLL_MS = 3000;

type Preview =
  | { status: "idle" | "loading" }
  | { status: "ready"; counts: PreviewCounts }
  | { status: "error"; error: string };

type Props = {
  provider: ImportProvider;
  configured: boolean;
  connection: ConnectionView | null;
  job: JobView | null;
  flash: { connected: boolean; error: string | null };
  /** Import history (server-rendered), shown under the current step. */
  history: ReactNode;
};

export function ImportClient({ provider, configured, connection: initialConnection, job: initialJob, flash, history }: Props) {
  const router = useRouter();
  const copy = providerCopy(provider);
  const [connection, setConnection] = useState(initialConnection);
  const [job, setJob] = useState(initialJob);
  // Just came back from the source's approval screen → go straight to the preview.
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
    LoadImportPreviewAction(provider)
      .then((result) => {
        if (result.ok) {
          setConnection(result.connection);
          setPreview({ status: "ready", counts: result.counts });
        } else {
          setPreview({ status: "error", error: result.error });
          router.refresh();
        }
      })
      .catch(() => setPreview({ status: "error", error: tr("تعذّر تحميل المعاينة — جرّب تاني") }));
  }, [router, provider]);

  function loadPreview() {
    setPreview({ status: "loading" });
    fetchPreview();
  }

  useEffect(() => {
    if (autoPreviewed.current || !justConnected) return;
    autoPreviewed.current = true;
    toast.success(tr("تم الربط مع {0}", initialConnection?.shopName ?? copy.label));
    fetchPreview();
  }, [justConnected, initialConnection, fetchPreview, copy.label]);

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
        toast.error(trv(result.error));
        router.refresh();
        return;
      }
      setJob(result.job);
      setPreview({ status: "idle" });
      setResultDismissed(false);
      if (success) toast.success(trv(success));
      router.refresh();
    });
  }

  const flashError = flash.error ? (copy.connectErrors[flash.error] ?? copy.connectErrors.server_error) : null;

  const step: StepId =
    view === "importing" || view === "paused"
      ? "import"
      : view === "completed" || view === "completed_with_warnings"
        ? "done"
        : view === "connected" || view === "loading_preview" || view === "preview_ready"
          ? "preview"
          : "connect";
  const showShop = !!connection && connection.status === "ACTIVE" && view !== "connecting";

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0 space-y-6">
        {flashError && view !== "importing" && (
          <p role="alert" className="flex items-start gap-2.5 rounded-[14px] bg-(--sys-red)/10 px-4 py-3 text-[15px] leading-[21px]">
            <AlertCircle className="mt-0.5 size-[18px] shrink-0 text-(--sys-red)" />
            {flashError}
          </p>
        )}

        {(view === "not_connected" || view === "connecting") && (
          <ConnectPanel provider={provider} configured={configured} connecting={connecting} onConnecting={() => setConnecting(true)} />
        )}

        {view === "needs_reconnect" && (
          <ConnectPanel
            provider={provider}
            configured={configured}
            reconnect
            shopDomain={connection?.shopDomain}
            connecting={connecting}
            onConnecting={() => setConnecting(true)}
          />
        )}

        {view === "connected" && (
          <section className="apple-card flex flex-col items-center px-6 pt-10 pb-8 text-center">
            <MigrationGlyph provider={provider} />
            <h2 className="mt-6 text-[28px] leading-[34px] font-bold ltr:tracking-[-0.015em]">{tr("جاهز ننقل بياناتك")}</h2>
            <p className={cn("mt-2 max-w-md text-[15px] leading-[22px]", preview.status === "error" ? "text-(--sys-red)" : "text-muted-foreground")}>
              {preview.status === "error"
                ? trv(preview.error)
                : copy.connectedHint}
            </p>
            <button type="button" onClick={loadPreview} className={cn(appleButton.filled, "mt-7 h-[50px] w-full max-w-xs text-[17px]")}>
              {preview.status === "error" ? tr("جرّب تاني") : tr("معاينة البيانات")}
            </button>
          </section>
        )}

        {view === "loading_preview" && <PreviewSkeleton provider={provider} />}

        {view === "preview_ready" && preview.status === "ready" && connection && (
          <PreviewPanel
            provider={provider}
            counts={preview.counts}
            connection={connection}
            selected={selected}
            starting={busy}
            onToggle={(entity, checked) =>
              setSelected((current) => (checked ? [...new Set([...current, entity])] : current.filter((e) => e !== entity)))
            }
            onStart={() => run(() => StartImportAction(provider, selected), tr("بدأ الاستيراد"))}
          />
        )}

        {(view === "importing" || view === "paused") && job && (
          <>
            {view === "paused" && connection?.status !== "ACTIVE" && (
              <ConnectPanel
                provider={provider}
                configured={configured}
                reconnect
                shopDomain={connection?.shopDomain}
                connecting={connecting}
                onConnecting={() => setConnecting(true)}
              />
            )}
            <ProgressPanel
              provider={provider}
              job={job}
              busy={busy}
              needsReconnect={connection?.status !== "ACTIVE"}
              onResume={() => run(() => ResumeImportJobAction(job.id), tr("رجعنا نكمّل الاستيراد"))}
              onCancel={() => run(() => CancelImportJobAction(job.id), tr("تم إلغاء الاستيراد"))}
            />
          </>
        )}

        {(view === "completed" || view === "completed_with_warnings") && job && (
          <ResultPanel
            provider={provider}
            job={job}
            busy={busy}
            onRetry={() => run(() => RetryFailedItemsAction(job.id), tr("بدأنا نعيد محاولة العناصر الفاشلة"))}
            onNewImport={() => {
              setResultDismissed(true);
              loadPreview();
            }}
          />
        )}

        {history}
      </div>

      <aside className="space-y-6 xl:sticky xl:top-6">
        <Steps current={step} provider={provider} />
        {showShop && <ShopCard provider={provider} connection={connection} busy={view === "importing" || view === "paused"} />}
        {step !== "done" && step !== "import" && <NotImportedCard provider={provider} />}
      </aside>
    </div>
  );
}
