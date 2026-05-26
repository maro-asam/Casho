"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BanknoteArrowUp,
  Bell,
  BookOpen,
  ChartNoAxesCombined,
  CheckCircle2,
  CirclePercent,
  CreditCard,
  Headset,
  ImageIcon,
  LayoutDashboard,
  Package,
  PackagePlus,
  PaintRoller,
  Plus,
  Rocket,
  Settings,
  ShoppingCart,
  Tag,
  TagsIcon,
} from "lucide-react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

type SearchItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  group: string;
  shortcut?: string;
};

const items: SearchItem[] = [
  // التشغيل
  { label: "نظرة عامة", href: "/dashboard", icon: LayoutDashboard, group: "التشغيل" },
  { label: "الإشعارات", href: "/dashboard/notifications", icon: Bell, group: "التشغيل" },
  { label: "الطلبات", href: "/dashboard/orders", icon: ShoppingCart, group: "التشغيل" },
  { label: "التقارير", href: "/dashboard/reports", icon: ChartNoAxesCombined, group: "التشغيل" },
  // المتجر
  { label: "المنتجات", href: "/dashboard/products", icon: Package, group: "المتجر" },
  { label: "التصنيفات", href: "/dashboard/categories", icon: Tag, group: "المتجر" },
  { label: "البانرات", href: "/dashboard/banners", icon: ImageIcon, group: "المتجر" },
  { label: "الكوبونات", href: "/dashboard/coupons", icon: CirclePercent, group: "المتجر" },
  // النمو
  { label: "تخصيص المتجر", href: "/dashboard/customization", icon: PaintRoller, group: "النمو" },
  { label: "إعدادات SEO", href: "/dashboard/seo", icon: Rocket, group: "النمو" },
  { label: "المدونة", href: "/dashboard/blog", icon: BookOpen, group: "النمو" },
  // المالية
  { label: "إدارة الرصيد", href: "/dashboard/balance", icon: BanknoteArrowUp, group: "المالية" },
  { label: "تغيير الخطة", href: "/dashboard/change-plan", icon: ChartNoAxesCombined, group: "المالية" },
  { label: "بوابات الدفع", href: "/dashboard/payment-methods", icon: CreditCard, group: "المالية" },
  { label: "الإعدادات", href: "/dashboard/settings", icon: Settings, group: "المالية" },
  // الدعم
  { label: "مركز المساعدة", href: "/dashboard/support", icon: Headset, group: "الدعم" },
];

const quickActions: SearchItem[] = [
  { label: "إضافة منتج جديد", href: "/dashboard/products/new", icon: PackagePlus, group: "إجراءات سريعة" },
  { label: "إضافة تصنيف", href: "/dashboard/categories/new", icon: TagsIcon, group: "إجراءات سريعة" },
  { label: "إضافة كوبون", href: "/dashboard/coupons/new", icon: Plus, group: "إجراءات سريعة" },
  { label: "الطلبات المكتملة", href: "/dashboard/orders?status=DELIVERED", icon: CheckCircle2, group: "إجراءات سريعة" },
];

const groups = [...new Set(items.map((i) => i.group))];

export default function DashboardSearch() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const run = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-8 min-w-50 items-center gap-2 rounded-md border border-input bg-muted/40 px-3 text-xs text-muted-foreground transition-colors hover:bg-muted lg:min-w-60"
      >
        <span className="flex-1 text-right">بحث سريع...</span>
        <kbd className="rounded border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} title="بحث سريع" description="ابحث عن صفحة أو إجراء">
        <Command>
        <CommandInput placeholder="ابحث عن صفحة أو إجراء..." />
        <CommandList>
          <CommandEmpty>لا توجد نتائج.</CommandEmpty>

          <CommandGroup heading="إجراءات سريعة">
            {quickActions.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem key={item.href} onSelect={() => run(item.href)}>
                  <Icon />
                  {item.label}
                </CommandItem>
              );
            })}
          </CommandGroup>

          <CommandSeparator />

          {groups.map((group) => (
            <CommandGroup key={group} heading={group}>
              {items
                .filter((i) => i.group === group)
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <CommandItem key={item.href} onSelect={() => run(item.href)}>
                      <Icon />
                      {item.label}
                      {item.shortcut && <CommandShortcut>{item.shortcut}</CommandShortcut>}
                    </CommandItem>
                  );
                })}
            </CommandGroup>
          ))}
        </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
