import { Metadata } from "next";
import Link from "next/link";
import {
  Camera,
  MessageSquare,
  ShoppingBag,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Info,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import DashboardSectionHeader from "@/app/(merchant)/_components/main/DashboardSectionHeader";
import { GetInstagramStatsAction } from "@/actions/instagram/instagram.actions";
import { ConnectionStatus } from "./_components/ConnectionStatus";
import { ConnectButton } from "./_components/ConnectButton";
import { intlLocale, tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
  title: tr("ربط انستجرام"),
};
}

const HOW_IT_WORKS = [
  {
    step: "1",
    get title() { return tr("اربط حساب انستجرام"); },
    get desc() { return tr("اتصل بحسابك التجاري على انستجرام بنقرة واحدة"); },
  },
  {
    step: "2",
    get title() { return tr("الذكاء الاصطناعي يحلل محادثاتك"); },
    get desc() { return tr("يقرأ النظام رسائلك ويكتشف المحادثات التي تحتوي على طلبات شراء"); },
  },
  {
    step: "3",
    get title() { return tr("راجع الطلبات المقترحة"); },
    get desc() { return tr("ستصلك إشعارات بالطلبات المكتشفة وتقدر تراجعها وتعتمدها"); },
  },
  {
    step: "4",
    get title() { return tr("تحويل إلى طلب حقيقي"); },
    get desc() { return tr("بعد موافقتك ينشأ الطلب تلقائياً في لوحة الطلبات"); },
  },
];

export default async function InstagramIntegrationPage() {
  await loadDashboardLocale();
  const stats      = await GetInstagramStatsAction();
  const connection = stats?.connection ?? null;

  const statCards = [
    {
      label: tr("المحادثات"),
      value: stats?.totalConversations ?? 0,
      icon: MessageSquare,
      className: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    },
    {
      label: tr("طلبات قيد المراجعة"),
      value: stats?.pendingCount ?? 0,
      icon: ShoppingBag,
      className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    {
      label: tr("طلبات معتمدة"),
      value: stats?.approvedCount ?? 0,
      icon: CheckCircle2,
      className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
  ];

  return (
    <div className="space-y-6" dir={tdir()}>
      <DashboardSectionHeader
        icon={Camera}
        title={tr("طلبات انستجرام AI")}
        description={tr("اكتشاف الطلبات من محادثات انستجرام تلقائياً بالذكاء الاصطناعي")}
        {...(connection && stats && (stats.pendingCount ?? 0) > 0
          ? {
              actionLabel: tr("{0} طلب قيد المراجعة", stats.pendingCount),
              actionHref: "/suggested-orders",
            }
          : {})}
      />

      {/* Connection Card */}
      {connection ? (
        <ConnectionStatus connection={connection} />
      ) : (
        <ConnectPrompt />
      )}

      {/* Stats — only when connected */}
      {connection && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="border-border shadow-sm">
                <div className="p-5">
                  <div
                    className={cn(
                      "mb-3 grid size-9 place-items-center rounded-xl",
                      stat.className,
                    )}
                  >
                    <Icon className="size-4.5" />
                  </div>
                  <p className="text-2xl font-bold">
                    {new Intl.NumberFormat(intlLocale()).format(stat.value)}
                  </p>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quick link to suggested orders */}
      {connection && (stats?.pendingCount ?? 0) > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
                <Sparkles className="size-4.5" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {tr("لديك {0} طلب مقترح جديد", stats?.pendingCount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {tr("اكتشفها الذكاء الاصطناعي من محادثاتك")}
                </p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <Link href="/suggested-orders">
                {tr("مراجعة")}
                <ArrowLeft className="ms-1.5 size-4 ltr:-scale-x-100" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* How it works */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-muted-foreground">{tr("كيف يعمل؟")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((item) => (
            <Card key={item.step} className="border-border shadow-sm">
              <CardContent className="p-4">
                <div className="mb-3 flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                  {item.step}
                </div>
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Meta Business account note */}
      <div className="flex items-start gap-3 rounded-xl border border-sky-500/30 bg-sky-500/5 px-4 py-3">
        <Info className="mt-0.5 size-4 shrink-0 text-sky-600" />
        <p className="text-sm text-sky-700 dark:text-sky-400">
          <strong>{tr("ملاحظة:")}</strong>{" "}{tr("لاستخدام هذه الميزة، يجب أن يكون حسابك على انستجرام")}{" "}
          <strong>{tr("حساباً تجارياً أو Creator")}</strong>{" "}{tr("مرتبطاً بصفحة Facebook.")}
        </p>
      </div>
    </div>
  );
}

function ConnectPrompt() {
  return (
    <Card className="border-dashed border-border/40">
      <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
        <div className="mb-4 grid size-16 place-items-center rounded-2xl bg-primary/10 text-muted-foreground">
          <Camera className="size-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold">{tr("اربط حساب انستجرام")}</h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
          {tr("وصّل حسابك التجاري على انستجرام واترك الذكاء الاصطناعي يكتشف طلبات الشراء من محادثاتك تلقائياً")}
        </p>
        <div className="mt-6">
          <ConnectButton />
        </div>
      </CardContent>
    </Card>
  );
}
