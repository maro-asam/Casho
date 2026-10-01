import Link from "next/link";
import { ArrowLeft, MessageCircle, ShoppingBag, Sparkles, type LucideIcon } from "lucide-react";
import { StatusPill } from "@/components/saas-page";

type Tool = {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  on: boolean;
  stat?: string;
};

const nf = new Intl.NumberFormat("ar-EG");

export function GrowthTools({
  popups,
  whatsappOn,
  toastsOn,
  recentOrders,
}: {
  popups: { active: number; views: number; conversions: number };
  whatsappOn: boolean;
  toastsOn: boolean;
  recentOrders: number;
}) {
  const rate = popups.views ? Math.round((popups.conversions / popups.views) * 1000) / 10 : 0;
  const tools: Tool[] = [
    {
      href: "/customization?tab=popups",
      icon: Sparkles,
      title: "النوافذ المنبثقة",
      description: "كود خصم، جمع أرقام، أو إعلان — يظهر في الوقت الصح.",
      on: popups.active > 0,
      stat: popups.views ? `${nf.format(popups.views)} مشاهدة · ${nf.format(rate)}٪ تحويل` : undefined,
    },
    {
      href: "/customization?tab=whatsapp",
      icon: MessageCircle,
      title: "زر واتساب العائم",
      description: "العميل يسألك عن المنتج اللي قدامه بضغطة — والرسالة فيها لينكه.",
      on: whatsappOn,
    },
    {
      href: "/customization?tab=social-proof",
      icon: ShoppingBag,
      title: "إشعارات الشراء الحية",
      description: "\"محمد طلب …\" من طلباتك الحقيقية — ثقة من غير أي فبركة.",
      on: toastsOn,
      stat: `${nf.format(recentOrders)} طلب في آخر ٧ أيام`,
    },
  ];

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <h3 className="font-semibold">زوّد مبيعاتك</h3>
          <p className="text-sm text-muted-foreground">أدوات بتحوّل الزائر لعميل — شغّلها من غير أي كود.</p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/20 hover:bg-muted/30"
          >
            <div className="flex items-center justify-between">
              <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <tool.icon className="size-4" />
              </span>
              <StatusPill tone={tool.on ? "success" : "neutral"}>{tool.on ? "شغّال" : "متوقف"}</StatusPill>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">{tool.title}</p>
              <p className="text-xs leading-5 text-muted-foreground">{tool.description}</p>
            </div>
            <div className="mt-auto flex items-center justify-between text-xs">
              <span className="text-muted-foreground tabular-nums">{tool.stat ?? ""}</span>
              <span className="inline-flex items-center gap-1 font-medium text-primary">
                {tool.on ? "إدارة" : "شغّله"}
                <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
