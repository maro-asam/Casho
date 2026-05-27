import { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  ShoppingBag,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";

export const metadata: Metadata = { title: "Instagram AI — Admin Debug" };

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

  const statsTop = [
    { label: "اتصالات نشطة",        value: activeConnections,  total: totalConnections, icon: Camera,       color: "text-emerald-600 bg-emerald-500/10" },
    { label: "منتهية الصلاحية",      value: expiredConnections,                          icon: XCircle,      color: "text-rose-600 bg-rose-500/10" },
    { label: "تنتهي خلال 14 يوم",   value: expiringConnections,                         icon: Clock,        color: "text-amber-600 bg-amber-500/10" },
    { label: "طلبات معلقة",          value: pendingSuggested,                            icon: ShoppingBag,  color: "text-sky-600 bg-sky-500/10" },
    { label: "طلبات معتمدة",         value: approvedSuggested,                           icon: CheckCircle2, color: "text-emerald-600 bg-emerald-500/10" },
    { label: "طلبات مرفوضة",         value: rejectedSuggested,                           icon: XCircle,      color: "text-zinc-600 bg-zinc-500/10" },
    { label: "وظائف في الانتظار",    value: queuedJobs,                                  icon: Clock,        color: "text-blue-600 bg-blue-500/10" },
    { label: "وظائف فاشلة (24h)",   value: failedJobs24h, icon: AlertTriangle,           color: failedJobs24h > 0 ? "text-rose-600 bg-rose-500/10" : "text-zinc-500 bg-zinc-500/10" },
    { label: "وظائف مكتملة (24h)",  value: doneJobs24h,   icon: CheckCircle2,            color: "text-emerald-600 bg-emerald-500/10" },
  ];

  return (
    <div className="space-y-8 p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-xl bg-pink-500/10 text-pink-600">
          <Camera className="size-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Instagram AI — لوحة المراقبة</h1>
          <p className="text-sm text-muted-foreground">
            حالة الوظائف، استخدام AI، وأداء نظام الطلبات
          </p>
        </div>
        <Badge variant="outline" className="mr-auto rounded-full">Internal</Badge>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {statsTop.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border-border shadow-sm">
              <CardContent className="p-4">
                <div className={cn("mb-2 grid size-8 place-items-center rounded-lg text-sm", s.color)}>
                  <Icon className="size-4" />
                </div>
                <p className="text-2xl font-bold">{s.value.toLocaleString("ar-EG")}</p>
                {"total" in s && (
                  <p className="text-xs text-muted-foreground">من {s.total}</p>
                )}
                <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Webhook Activity */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Activity className="size-4 text-muted-foreground" />
            نشاط Webhook
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-8">
            <div>
              <p className="text-2xl font-bold">{recentWebhookEvents.toLocaleString("ar-EG")}</p>
              <p className="text-xs text-muted-foreground">أحداث في آخر ساعة</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{totalWebhookEvents.toLocaleString("ar-EG")}</p>
              <p className="text-xs text-muted-foreground">إجمالي الأحداث (بدون تكرار)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Failed Jobs */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="size-4 text-rose-500" />
            وظائف فاشلة
            {failedJobs24h > 0 && (
              <Badge className="rounded-full border-0 bg-rose-500/10 text-rose-700 text-xs">
                {failedJobs24h} في 24h
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentFailedJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد وظائف فاشلة حالياً ✅</p>
          ) : (
            <div className="space-y-3">
              {recentFailedJobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-muted-foreground">{job.id.slice(0, 12)}…</p>
                      <p className="mt-0.5 font-medium">
                        {job.store.name}
                        <span className="mr-1 text-xs font-normal text-muted-foreground">
                          ({job.store.slug})
                        </span>
                      </p>
                      {job.errorMessage && (
                        <p className="mt-1 font-mono text-xs text-rose-700 dark:text-rose-400">
                          {job.errorMessage}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <Badge variant="outline" className="text-xs">{job.attempts} محاولة</Badge>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Intl.DateTimeFormat("ar-EG", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "numeric",
                          month: "short",
                        }).format(job.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Usage Today */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="size-4 text-amber-500" />
            استخدام AI اليوم
            <span className="text-xs font-normal text-muted-foreground">({today})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topAiUsageToday.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا يوجد استخدام AI اليوم بعد</p>
          ) : (
            <div className="space-y-2">
              {topAiUsageToday.map((log) => (
                <div key={log.storeId} className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {log.store.name}
                    <span className="mr-1 text-xs text-muted-foreground">({log.store.slug})</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          log.jobCount >= 80 ? "bg-rose-500" :
                          log.jobCount >= 50 ? "bg-amber-500" : "bg-emerald-500",
                        )}
                        style={{ width: `${Math.min(100, log.jobCount)}%` }}
                      />
                    </div>
                    <span className="w-14 text-right font-mono text-xs">
                      {log.jobCount} / 100
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Token Expiry Warning */}
      {expiringConnections > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <Clock className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            <strong>{expiringConnections} اتصال</strong> لديه رمز وصول ينتهي خلال 14 يوماً.
            يمكن تشغيل التحديث يدوياً:{" "}
            <code className="rounded bg-amber-500/10 px-1 py-0.5 font-mono text-xs">
              GET /api/instagram/token-refresh/run
            </code>{" "}
            مع Authorization header.
          </p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline" size="sm" className="rounded-xl">
          <Link href="/admin/stores">عرض المتاجر</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="rounded-xl">
          <Link href="/dashboard/suggested-orders">الطلبات المقترحة</Link>
        </Button>
      </div>
    </div>
  );
}
