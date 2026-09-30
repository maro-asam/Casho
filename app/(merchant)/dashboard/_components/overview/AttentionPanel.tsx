import Link from "next/link";
import { AlertTriangle, CheckCircle2, ChevronLeft, Clock3, PackageX, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatNumber } from "./format";

export type AttentionItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  tone: "warning" | "danger" | "neutral";
  icon: LucideIcon;
};

const TONE_CLASSES: Record<AttentionItem["tone"], string> = {
  danger: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  neutral: "bg-muted text-foreground",
};

export function buildAttentionItems({
  pendingOrders,
  lowStockCount,
  subscription,
}: {
  pendingOrders: number;
  lowStockCount: number;
  subscription: "active" | "grace" | "inactive";
}): AttentionItem[] {
  const items: AttentionItem[] = [];

  if (subscription === "inactive") {
    items.push({
      id: "subscription",
      title: "الاشتراك مش مفعّل",
      description: "المتجر مش ظاهر للعملاء لحد ما تجدد الاشتراك.",
      href: "/balance",
      tone: "danger",
      icon: AlertTriangle,
    });
  } else if (subscription === "grace") {
    items.push({
      id: "subscription",
      title: "الاشتراك في فترة السماح",
      description: "جدّد قبل ما الفترة تخلص عشان المتجر ميقفش.",
      href: "/balance",
      tone: "warning",
      icon: AlertTriangle,
    });
  }

  if (pendingOrders > 0) {
    items.push({
      id: "pending",
      title: `${formatNumber(pendingOrders)} طلب مستني مراجعة`,
      description: "أكّد الطلبات الجديدة عشان تبدأ تجهيزها.",
      href: "/orders",
      tone: "warning",
      icon: Clock3,
    });
  }

  if (lowStockCount > 0) {
    items.push({
      id: "stock",
      title: `${formatNumber(lowStockCount)} منتج مخزونه قليل`,
      description: "زوّد الكمية قبل ما المنتج يخلص أونلاين وفي المحل.",
      href: "/inventory",
      tone: "neutral",
      icon: PackageX,
    });
  }

  return items;
}

export default function AttentionPanel({ items }: { items: AttentionItem[] }) {
  return (
    <Card className="gap-0 rounded-xl py-0 shadow-none">
      <CardHeader className="p-5 pb-3">
        <CardTitle className="text-base font-semibold">محتاج انتباهك</CardTitle>
      </CardHeader>
      <CardContent className="p-2 pt-0">
        {items.length > 0 ? (
          <ul>
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="group flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", TONE_CLASSES[item.tone])}>
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{item.title}</span>
                      <span className="block text-xs leading-5 text-muted-foreground">{item.description}</span>
                    </span>
                    <ChevronLeft className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex items-center gap-3 p-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
            </span>
            <div>
              <p className="text-sm font-medium">كله تمام</p>
              <p className="text-xs text-muted-foreground">مفيش طلبات متأخرة ولا منتجات قربت تخلص.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
