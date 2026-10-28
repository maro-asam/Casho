import { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { PageHeader, StatusText } from "@/components/saas-page";
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import { KpiStrip, Panel, PanelEmpty } from "../_components/admin-ui";
import { fmtDateTime, fmtNum } from "../_lib/format";

export const metadata: Metadata = { title: "Instagram AI" };

export const dynamic = "force-dynamic";

export default async function AdminInstagramPage() {
  await requireAdmin();

  const now   = new Date();
  const h24   = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const h1    = new Date(now.getTime() - 60 * 60 * 1000);
  const d14   = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const today = now.toISOString().slice(0, 10);

  const [
    totalConnections,
    activeConnections,
    expiredConnections,
    expiringConnections,
    pendingSuggested,
    approvedSuggested,
    rejectedSuggested,
    queuedJobs,
    failedJobs24h,
    doneJobs24h,
    rawFailedJobs,
    topAiUsageToday,
    recentWebhookEvents,
    totalWebhookEvents,
  ] = await Promise.all([
    prisma.instagramConnection.count(),
    prisma.instagramConnection.count({ where: { status: "ACTIVE" } }),
    prisma.instagramConnection.count({ where: { status: "EXPIRED" } }),
    prisma.instagramConnection.count({
      where: { status: "ACTIVE", tokenExpiresAt: { lte: d14 } },
    }),
    prisma.suggestedOrder.count({ where: { status: "PENDING" } }),
    prisma.suggestedOrder.count({ where: { status: "APPROVED" } }),
    prisma.suggestedOrder.count({ where: { status: "REJECTED" } }),
    prisma.igProcessingJob.count({ where: { status: "QUEUED" } }),
    prisma.igProcessingJob.count({ where: { status: "FAILED", updatedAt: { gte: h24 } } }),
    prisma.igProcessingJob.count({ where: { status: "DONE",   updatedAt: { gte: h24 } } }),
    // Last 10 failed jobs — fetch storeId via conversation
    prisma.igProcessingJob.findMany({
      where: { status: "FAILED" },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true,
        updatedAt: true,
        attempts: true,
        errorMessage: true,
        conversation: {
          select: {
            storeId: true,
            igConversationId: true,
          },
        },
      },
    }),
    // Top AI usage today — store relation exists on IgAiUsageLog
    prisma.igAiUsageLog.findMany({
      where: { date: today },
      orderBy: { jobCount: "desc" },
      take: 10,
      select: {
        jobCount: true,
        storeId: true,
        store: { select: { name: true, slug: true } },
      },
    }),
    prisma.igProcessedWebhookEvent.count({ where: { processedAt: { gte: h1 } } }),
    prisma.igProcessedWebhookEvent.count(),
  ]);

  // Enrich failed jobs with store names (separate query avoids broken relation)
  const storeIds = [...new Set(rawFailedJobs.map((j) => j.conversation.storeId))];
  const stores   = await prisma.store.findMany({
    where: { id: { in: storeIds } },
    select: { id: true, name: true, slug: true },
  });
  const storeMap = Object.fromEntries(stores.map((s) => [s.id, s]));

  const recentFailedJobs = rawFailedJobs.map((j) => ({
    ...j,
    store: storeMap[j.conversation.storeId] ?? { name: j.conversation.storeId.slice(0, 8), slug: "—" },
  }));

  const DAILY_AI_LIMIT = 100;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Instagram AI"
        description="مراقبة ربط إنستجرام، الطلبات المقترحة من الرسايل، ووظائف الذكاء الاصطناعي."
        actions={<StatusText tone="neutral">داخلي</StatusText>}
      />

      {expiringConnections > 0 && (
        <div className="flex items-start gap-3 rounded-[22px] bg-(--sys-orange)/12 px-5 py-4">
          <Clock className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <p className="text-sm leading-6 text-amber-800 dark:text-amber-300">
            <span className="font-semibold">{fmtNum(expiringConnections)} اتصال</span> التوكن بتاعه بينتهي خلال ١٤ يوم. التحديث بيشتغل من{" "}
            <code className="rounded bg-amber-500/10 px-1 py-0.5 font-mono text-xs" dir="ltr">
              GET /api/instagram/token-refresh/run
            </code>{" "}
            بالـ Authorization header.
          </p>
        </div>
      )}

      <KpiStrip
        items={[
          { label: "اتصالات شغالة", value: fmtNum(activeConnections), hint: `من ${fmtNum(totalConnections)} · ${fmtNum(expiredConnections)} منتهي` },
          { label: "طلبات مقترحة مستنية", value: fmtNum(pendingSuggested), hint: `${fmtNum(approvedSuggested)} اتقبل · ${fmtNum(rejectedSuggested)} اترفض` },
          { label: "وظائف في الطابور", value: fmtNum(queuedJobs), hint: `${fmtNum(doneJobs24h)} خلصت آخر ٢٤ ساعة` },
          { label: "وظائف فشلت (٢٤ ساعة)", value: fmtNum(failedJobs24h), hint: `Webhook: ${fmtNum(recentWebhookEvents)} حدث آخر ساعة · ${fmtNum(totalWebhookEvents)} إجمالًا` },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel
          title="آخر الوظائف الفاشلة"
          className="lg:col-span-3"
          flush
          actions={failedJobs24h > 0 ? <StatusText tone="danger">{fmtNum(failedJobs24h)} آخر ٢٤ ساعة</StatusText> : undefined}
        >
          {recentFailedJobs.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-8 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 text-emerald-600" />
              مفيش وظائف فاشلة.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recentFailedJobs.map((job) => (
                <li key={job.id} className="space-y-1 px-4 py-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {job.store.slug !== "—" ? (
                        <Link href={`/admin/stores/${job.store.slug}`} className="font-medium hover:underline">
                          {job.store.name}
                        </Link>
                      ) : (
                        <span className="font-medium">{job.store.name}</span>
                      )}
                      <p className="font-mono text-xs text-muted-foreground" dir="ltr">
                        <span className="block text-right">{job.id.slice(0, 12)}…</span>
                      </p>
                    </div>
                    <div className="shrink-0 text-left text-xs text-muted-foreground">
                      <p>{fmtNum(job.attempts)} محاولة</p>
                      <p>{fmtDateTime(job.updatedAt)}</p>
                    </div>
                  </div>
                  {job.errorMessage && (
                    <p className="flex items-start gap-1.5 rounded-md bg-rose-500/5 px-2 py-1.5 font-mono text-xs text-rose-700 dark:text-rose-400" dir="ltr">
                      <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                      <span className="break-all">{job.errorMessage}</span>
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="استهلاك الذكاء الاصطناعي النهارده" description={`الحد اليومي ${fmtNum(DAILY_AI_LIMIT)} وظيفة لكل متجر · ${today}`} className="lg:col-span-2" flush>
          {topAiUsageToday.length === 0 ? (
            <PanelEmpty>مفيش استهلاك النهارده لسه.</PanelEmpty>
          ) : (
            <ul className="divide-y divide-border">
              {topAiUsageToday.map((log) => {
                const pct = Math.min(100, (log.jobCount / DAILY_AI_LIMIT) * 100);
                return (
                  <li key={log.storeId} className="space-y-1.5 px-4 py-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <Link href={`/admin/stores/${log.store.slug}`} className="min-w-0 truncate font-medium hover:underline">
                        {log.store.name}
                      </Link>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {fmtNum(log.jobCount)} / {fmtNum(DAILY_AI_LIMIT)}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${Math.round(pct)}٪ من الحد`}>
                      <div className={cn("h-full rounded-full", pct >= 80 ? "bg-rose-500" : pct >= 50 ? "bg-amber-500" : "bg-primary")} style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
