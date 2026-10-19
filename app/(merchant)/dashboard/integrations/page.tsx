import { Metadata } from "next";
import Link from "next/link";
import {
  Camera,
  MessageSquare,
  Phone,
  Music2,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import DashboardSectionHeader from "@/app/(merchant)/_components/main/DashboardSectionHeader";
import { GetInstagramStatsAction } from "@/actions/instagram/instagram.actions";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
  title: tr("التكاملات"),
};
}

const PLATFORMS = [
  {
    id: "instagram",
    get name() { return tr("انستجرام"); },
    get description() { return tr("اكتشاف الطلبات من محادثات DM تلقائياً بالذكاء الاصطناعي"); },
    icon: Camera,
    href: "/integrations/instagram",
    available: true,
    get badge() { return tr("متاح"); },
    badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    gradient: "from-purple-500/10 to-pink-500/10 text-pink-500",
  },
  {
    id: "shopify",
    get name() { return tr("استيراد من Shopify"); },
    get description() { return tr("انقل منتجاتك وعملاءك وطلباتك من متجرك على Shopify لـ Kasho"); },
    icon: ShoppingBag,
    href: "/integrations/shopify",
    available: true,
    get badge() { return tr("متاح"); },
    badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    gradient: "from-emerald-500/10 to-lime-500/10 text-emerald-600",
  },
  {
    id: "facebook",
    name: "Facebook Messenger",
    get description() { return tr("ربط حسابك التجاري على Facebook لاستقبال وتحليل طلبات الرسائل"); },
    icon: MessageSquare,
    href: "/integrations/facebook",
    available: false,
    get badge() { return tr("قريباً"); },
    badgeClass: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
    gradient: "from-blue-500/10 to-sky-500/10 text-blue-500",
  },
  {
    id: "whatsapp",
    get name() { return tr("واتساب"); },
    get description() { return tr("تحويل محادثات واتساب التجاري إلى طلبات تلقائياً"); },
    icon: Phone,
    href: "/integrations/whatsapp",
    available: false,
    get badge() { return tr("قريباً"); },
    badgeClass: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
    gradient: "from-green-500/10 to-emerald-500/10 text-green-500",
  },
  {
    id: "tiktok",
    get name() { return tr("تيك توك"); },
    get description() { return tr("اكتشاف الطلبات من تعليقات ورسائل TikTok Shop"); },
    icon: Music2,
    href: "/integrations/tiktok",
    available: false,
    get badge() { return tr("قريباً"); },
    badgeClass: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
    gradient: "from-zinc-500/10 to-slate-500/10 text-zinc-600",
  },
];

export default async function IntegrationsPage() {
  await loadDashboardLocale();
  const stats = await GetInstagramStatsAction();
  const igConnected = !!stats?.connection;
  const pendingCount = stats?.pendingCount ?? 0;

  return (
    <div className="space-y-6" dir={tdir()}>
      <DashboardSectionHeader
        icon={Sparkles}
        title={tr("التكاملات")}
        description={tr("ربط قنوات التواصل الاجتماعي لاكتشاف الطلبات تلقائياً بالذكاء الاصطناعي")}
      />

      {/* Pending suggestion alert */}
      {igConnected && pendingCount > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Sparkles className="size-5 text-amber-600" />
              <div>
                <p className="text-sm font-semibold">
                  {tr("{0} طلب مقترح من انستجرام يحتاج مراجعة", pendingCount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {tr("اكتشفها الذكاء الاصطناعي تلقائياً")}
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

      {/* Platform cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        {PLATFORMS.map((platform) => {
          const Icon = platform.icon;
          const isInstagram = platform.id === "instagram";
          const isConnected = isInstagram && igConnected;

          return (
            <Card
              key={platform.id}
              className={cn(
                "border-border shadow-sm transition-shadow",
                platform.available ? "hover:shadow-md" : "opacity-70",
              )}
            >
              <CardContent className="p-5">
                <div className="mb-4 flex items-start justify-between">
                  <div
                    className={cn(
                      "grid size-11 place-items-center rounded-xl bg-linear-to-br",
                      platform.gradient,
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    {isConnected && (
                      <CheckCircle2 className="size-4 text-emerald-600" />
                    )}
                    <Badge
                      variant="secondary"
                      className={cn(
                        "rounded-full border-0 text-xs",
                        platform.badgeClass,
                      )}
                    >
                      {platform.badge}
                    </Badge>
                  </div>
                </div>

                <h3 className="font-semibold">{platform.name}</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {platform.description}
                </p>

                <div className="mt-4">
                  {platform.available ? (
                    <Button
                      asChild
                      variant={isConnected ? "outline" : "default"}
                      size="sm"
                      className="w-full rounded-xl"
                    >
                      <Link href={platform.href}>
                        {isConnected ? tr("الإعدادات") : tr("ابدأ الآن")}
                        <ArrowLeft className="ms-1.5 size-3.5 ltr:-scale-x-100" />
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      disabled
                      variant="outline"
                      size="sm"
                      className="w-full rounded-xl"
                    >
                      {tr("قريباً")}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Vision note */}
      <div className="rounded-xl border border-border/50 bg-muted/30 p-4 text-sm text-muted-foreground">
        <p>
          <strong className="text-foreground">{tr("الرؤية:")}{" "}</strong>
          {tr("Casho يتطور ليصبح نظام تشغيل للتجارة الاجتماعية عبر جميع منصات التواصل الاجتماعي — انستجرام، Facebook، واتساب، وتيك توك — كلها في مكان واحد بالذكاء الاصطناعي.")}
        </p>
      </div>
    </div>
  );
}
