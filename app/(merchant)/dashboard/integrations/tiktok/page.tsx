import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Music2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return { title: tr("تيك توك") };
}

export default async function TikTokIntegrationPage() {
  await loadDashboardLocale();
  return (
    <div className="space-y-6" dir={tdir()}>
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="rounded-xl">
          <Link href="/integrations">
            <ArrowRight className="size-5 ltr:-scale-x-100" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{tr("تيك توك")}</h1>
            <Badge variant="secondary" className="rounded-full border-0 bg-zinc-500/10 text-zinc-600 text-xs">
              {tr("قريباً")}
            </Badge>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {tr("اكتشاف الطلبات من تعليقات ورسائل TikTok Shop")}
          </p>
        </div>
      </div>

      <Card className="border-border">
        <CardContent className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
          <div className="mb-5 grid size-20 place-items-center rounded-2xl bg-linear-to-br from-zinc-500/10 to-slate-500/10">
            <Music2 className="size-9 text-zinc-600" />
          </div>

          <Badge className="mb-3 rounded-full border-0 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400">
            {tr("قريباً")}
          </Badge>

          <h2 className="text-xl font-bold">TikTok Shop</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            {tr("ربط حسابك التجاري على تيك توك لاكتشاف طلبات الشراء من التعليقات والرسائل تلقائياً.")}
          </p>

          <ul className="mt-4 space-y-1.5 text-start">
            {[
              tr("تحليل تعليقات الفيديوهات"),
              tr("اكتشاف الطلبات من TikTok DM"),
              tr("تكامل مع TikTok Shop"),
              tr("تتبع المنتجات الأكثر طلباً"),
            ].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                {f}
              </li>
            ))}
          </ul>

          <Button disabled className="mt-6 rounded-xl" size="lg">
            {tr("ربط تيك توك")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
