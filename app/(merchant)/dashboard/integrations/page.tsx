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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import DashboardSectionHeader from "@/app/(merchant)/_components/main/DashboardSectionHeader";
import { GetInstagramStatsAction } from "@/actions/instagram/instagram.actions";

export const metadata: Metadata = {
  title: "التكاملات",
};

const PLATFORMS = [
  {
    id: "instagram",
    name: "انستجرام",
    description: "اكتشاف الطلبات من محادثات DM تلقائياً بالذكاء الاصطناعي",
    icon: Camera,
    href: "/integrations/instagram",
    available: true,
    badge: "متاح",
    badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    gradient: "from-purple-500/10 to-pink-500/10 text-pink-500",
  },
  {
    id: "facebook",
    name: "Facebook Messenger",
    description: "ربط حسابك التجاري على Facebook لاستقبال وتحليل طلبات الرسائل",
    icon: MessageSquare,
    href: "/integrations/facebook",
    available: false,
    badge: "قريباً",
    badgeClass: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
    gradient: "from-blue-500/10 to-sky-500/10 text-blue-500",
  },
  {
    id: "whatsapp",
    name: "واتساب",
    description: "تحويل محادثات واتساب التجاري إلى طلبات تلقائياً",
    icon: Phone,
    href: "/integrations/whatsapp",
    available: false,
    badge: "قريباً",
    badgeClass: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
    gradient: "from-green-500/10 to-emerald-500/10 text-green-500",
  },
  {
    id: "tiktok",
    name: "تيك توك",
    description: "اكتشاف الطلبات من تعليقات ورسائل TikTok Shop",
    icon: Music2,
    href: "/integrations/tiktok",
    available: false,
    badge: "قريباً",
    badgeClass: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
    gradient: "from-zinc-500/10 to-slate-500/10 text-zinc-600",
  },
];

export default async function IntegrationsPage() {
  const stats = await GetInstagramStatsAction();
  const igConnected = !!stats?.connection;
  const pendingCount = stats?.pendingCount ?? 0;

  return (
    <div className="space-y-6" dir="rtl">
      <DashboardSectionHeader
        icon={Sparkles}
        title="التكاملات"
        description="ربط قنوات التواصل الاجتماعي لاكتشاف الطلبات تلقائياً بالذكاء الاصطناعي"
      />

      {/* Pending suggestion alert */}
      {igConnected && pendingCount > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Sparkles className="size-5 text-amber-600" />
              <div>
                <p className="text-sm font-semibold">
                  {pendingCount} طلب مقترح من انستجرام يحتاج مراجعة
                </p>
                <p className="text-xs text-muted-foreground">
                  اكتشفها الذكاء الاصطناعي تلقائياً
                </p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <Link href="/suggested-orders">
                مراجعة
                <ArrowLeft className="mr-1.5 size-4" />
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
                        {isConnected ? "الإعدادات" : "ابدأ الآن"}
                        <ArrowLeft className="mr-1.5 size-3.5" />
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      disabled
                      variant="outline"
                      size="sm"
                      className="w-full rounded-xl"
                    >
                      قريباً
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
          <strong className="text-foreground">الرؤية: </strong>
          Casho يتطور ليصبح نظام تشغيل للتجارة الاجتماعية عبر جميع منصات التواصل الاجتماعي —
          انستجرام، Facebook، واتساب، وتيك توك — كلها في مكان واحد بالذكاء الاصطناعي.
        </p>
      </div>
    </div>
  );
}
