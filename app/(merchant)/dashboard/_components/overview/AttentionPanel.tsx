import Link from "next/link";
import { AlertTriangle, Check, ChevronLeft, Clock3, PackageX, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import CardHeading from "./CardHeading";
import { formatNumber } from "./format";
import { tr } from "@/lib/i18n/dashboard";

export type AttentionItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  tone: "warning" | "danger" | "neutral";
  icon: LucideIcon;
};

// Settings-style icon tiles: white glyph on a flat system color.
const TONE_CLASSES: Record<AttentionItem["tone"], string> = {
  danger: "bg-(--sys-red)",
  warning: "bg-(--sys-orange)",
  neutral: "bg-(--sys-gray)",
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
      title: tr("الاشتراك مش مفعّل"),
      description: tr("المتجر مش ظاهر للعملاء لحد ما تجدد الاشتراك."),
      href: "/balance",
      tone: "danger",
      icon: AlertTriangle,
    });
  } else if (subscription === "grace") {
    items.push({
      id: "subscription",
      title: tr("الاشتراك في فترة السماح"),
      description: tr("جدّد قبل ما الفترة تخلص عشان المتجر ميقفش."),
      href: "/balance",
      tone: "warning",
      icon: AlertTriangle,
    });
  }

  if (pendingOrders > 0) {
    items.push({
      id: "pending",
      title: tr("{0} طلب مستني مراجعة", formatNumber(pendingOrders)),
      description: tr("أكّد الطلبات الجديدة عشان تبدأ تجهيزها."),
      href: "/orders",
      tone: "warning",
      icon: Clock3,
    });
  }

  if (lowStockCount > 0) {
    items.push({
      id: "stock",
      title: tr("{0} منتج مخزونه قليل", formatNumber(lowStockCount)),
      description: tr("زوّد الكمية قبل ما المنتج يخلص أونلاين وفي المحل."),
      href: "/inventory",
      tone: "neutral",
      icon: PackageX,
    });
  }

  return items;
}

export default function AttentionPanel({ items }: { items: AttentionItem[] }) {
  return (
    <section className="apple-card overflow-hidden">
      <CardHeading title={tr("محتاج انتباهك")} />
      {items.length > 0 ? (
        <ul className="apple-rows pb-2 [--row-inset:61px]">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="group flex min-h-14 items-center gap-3.5 px-4 py-2.5 transition-colors hover:bg-muted/60 active:bg-muted focus-visible:bg-muted/60 focus-visible:outline-none"
                >
                  <span className={cn("grid size-[29px] shrink-0 place-items-center rounded-[7px] text-white", TONE_CLASSES[item.tone])}>
                    <Icon className="size-4" strokeWidth={2.2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] leading-5">{item.title}</span>
                    <span className="block text-[13px] leading-[18px] text-muted-foreground">{item.description}</span>
                  </span>
                  <ChevronLeft className="size-4 shrink-0 text-(--label-3) ltr:-scale-x-100" strokeWidth={2.4} />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex items-center gap-3.5 px-4 pt-1 pb-5">
          <span className="grid size-[29px] shrink-0 place-items-center rounded-[7px] bg-(--sys-green) text-white">
            <Check className="size-4" strokeWidth={2.6} />
          </span>
          <div>
            <p className="text-[15px]">{tr("كله تمام")}</p>
            <p className="text-[13px] text-muted-foreground">{tr("مفيش طلبات متأخرة ولا منتجات قربت تخلص.")}</p>
          </div>
        </div>
      )}
    </section>
  );
}
