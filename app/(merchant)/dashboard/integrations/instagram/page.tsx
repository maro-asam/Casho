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
import { GetInstagramStatsAction } from "@/actions/instagram/get-suggested-orders.actions";
import { ConnectionStatus } from "./_components/ConnectionStatus";
import { ConnectButton } from "./_components/ConnectButton";

export const metadata: Metadata = {
  title: "ربط انستجرام",
};

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "اربط حساب انستجرام",
    desc: "اتصل بحسابك التجاري على انستجرام بنقرة واحدة",
  },
  {
    step: "2",
    title: "الذكاء الاصطناعي يحلل محادثاتك",
    desc: "يقرأ النظام رسائلك ويكتشف المحادثات التي تحتوي على طلبات شراء",
  },
  {
    step: "3",
    title: "راجع الطلبات المقترحة",
    desc: "ستصلك إشعارات بالطلبات المكتشفة وتقدر تراجعها وتعتمدها",
  },
  {
    step: "4",
    title: "تحويل إلى طلب حقيقي",
    desc: "بعد موافقتك ينشأ الطلب تلقائياً في لوحة الطلبات",
  },
];

export default async function InstagramIntegrationPage() {
  const stats      = await GetInstagramStatsAction();
  const connection = stats?.connection ?? null;

  const statCards = [
    {
      label: "المحادثات",
      value: stats?.totalConversations ?? 0,
      icon: MessageSquare,
      className: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    },
    {
      label: "طلبات قيد المراجعة",
      value: stats?.pendingCount ?? 0,
      icon: ShoppingBag,
      className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    {
      label: "طلبات معتمدة",
      value: stats?.approvedCount ?? 0,
      icon: CheckCircle2,
      className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <DashboardSectionHeader
        icon={Camera}
        title="طلبات انستجرام AI"
        description="اكتشاف الطلبات من محادثات انستجرام تلقائياً بالذكاء الاصطناعي"
        {...(connection && stats && (stats.pendingCount ?? 0) > 0
          ? {
              actionLabel: `${stats.pendingCount} طلب قيد المراجعة`,
              actionHref: "/dashboard/suggested-orders",
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
                    {new Intl.NumberFormat("ar-EG").format(stat.value)}
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
                  لديك {stats?.pendingCount} طلب مقترح جديد
                </p>
                <p className="text-xs text-muted-foreground">
                  اكتشفها الذكاء الاصطناعي من محادثاتك
                </p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <Link href="/dashboard/suggested-orders">
                مراجعة
                <ArrowLeft className="mr-1.5 size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* How it works */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-muted-foreground">كيف يعمل؟</h2>
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
          <strong>ملاحظة:</strong> لاستخدام هذه الميزة، يجب أن يكون حسابك على انستجرام{" "}
          <strong>حساباً تجارياً أو Creator</strong> مرتبطاً بصفحة Facebook.
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
        <h2 className="text-xl font-bold">اربط حساب انستجرام</h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
          وصّل حسابك التجاري على انستجرام واترك الذكاء الاصطناعي يكتشف طلبات الشراء من
          محادثاتك تلقائياً
        </p>
        <div className="mt-6">
          <ConnectButton />
        </div>
      </CardContent>
    </Card>
  );
}
