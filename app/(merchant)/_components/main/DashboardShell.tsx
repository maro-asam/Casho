"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BanknoteArrowUp,
  Bell,
  BookOpen,
  ChartNoAxesCombined,
  ChevronLeft,
  CirclePercent,
  CreditCard,
  ExternalLink,
  Headset,
  ImageIcon,
  Layers,
  LayoutDashboard,
  Menu,
  Package,
  PaintRoller,
  Rocket,
  ScreenShare,
  Search,
  Send,
  Settings,
  ShoppingCart,
  Sparkles,
  Store,
  Tag,
  Truck,
  X,
} from "lucide-react";

import { LogoutButton } from "@/app/(auth)/_components/LogoutBtn";
import NotificationsBell from "@/app/(merchant)/_components/notifications/NotificationsBell";
import type { NotificationDTO } from "@/actions/notifications/notifications.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/theme/ModeToggle";

interface DashboardShellProps {
  store: {
    name: string;
    slug: string;
  };
  initialNotifications: NotificationDTO[];
  initialUnreadCount: number;
  children: ReactNode;
}

type DashboardLink = {
  name: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  count?: number;
  disabled?: boolean;
  badge?: string;
};

type NavSection = {
  title: string;
  caption: string;
  links: DashboardLink[];
};

export default function DashboardShell({
  store,
  initialNotifications,
  initialUnreadCount,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const storeInitials = useMemo(() => {
    return store.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  }, [store.name]);

  const sections: NavSection[] = useMemo(
    () => [
      {
        title: "Command",
        caption: "لوحة التشغيل",
        links: [
          { name: "نظرة عامة", href: "/dashboard", icon: LayoutDashboard },
          {
            name: "الإشعارات",
            href: "/dashboard/notifications",
            icon: Bell,
            count: initialUnreadCount,
          },
          { name: "الطلبات", href: "/dashboard/orders", icon: ShoppingCart },
          { name: "التقارير", href: "/dashboard/reports", icon: ChartNoAxesCombined },
        ],
      },
      {
        title: "Commerce",
        caption: "الكتالوج والمبيعات",
        links: [
          { name: "المنتجات", href: "/dashboard/products", icon: Package },
          { name: "التصنيفات", href: "/dashboard/categories", icon: Tag },
          { name: "البانرات", href: "/dashboard/banners", icon: ImageIcon },
          { name: "الكوبونات", href: "/dashboard/coupons", icon: CirclePercent },
        ],
      },
      {
        title: "Growth",
        caption: "النمو والتحسين",
        links: [
          { name: "تخصيص المتجر", href: "/dashboard/customization", icon: PaintRoller },
          { name: "إعدادات SEO", href: "/dashboard/seo", icon: Rocket },
          { name: "المدونة", href: "/dashboard/blog", icon: BookOpen },
          { name: "خدمات إضافية", href: "/dashboard/services", icon: Layers },
        ],
      },
      {
        title: "Finance",
        caption: "الدفع والاشتراك",
        links: [
          { name: "إدارة الرصيد", href: "/dashboard/balance", icon: BanknoteArrowUp },
          { name: "تغيير الخطة", href: "/dashboard/change-plan", icon: ChartNoAxesCombined },
          { name: "بوابات الدفع", href: "/dashboard/payment-methods", icon: CreditCard },
          { name: "الإعدادات", href: "/dashboard/settings", icon: Settings },
        ],
      },
      {
        title: "Support",
        caption: "المساعدة والأتمتة",
        links: [
          { name: "مركز المساعدة", href: "/dashboard/support", icon: Headset },
          {
            name: "ربط تيليجرام",
            href: "/dashboard/telegram",
            icon: Send,
            disabled: true,
            badge: "Soon",
          },
          {
            name: "الحملات التسويقية",
            href: "/dashboard/marketing-campaigns",
            icon: ScreenShare,
            disabled: true,
            badge: "Soon",
          },
          {
            name: "شركات الشحن",
            href: "/dashboard/shipping-companies",
            icon: Truck,
            disabled: true,
            badge: "Soon",
          },
        ],
      },
    ],
    [initialUnreadCount],
  );

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOpen(false);
  }, [pathname]);

  const isActive = (href: string, disabled?: boolean) => {
    if (disabled) return false;

    return href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
  };

  const sidebar = (
    <div className="flex h-full flex-col border-l border-border/70 bg-background/95 backdrop-blur-2xl">
      <div className="relative overflow-hidden px-4 pb-4 pt-5">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-bl from-primary/15 via-primary/5 to-transparent" />
        <div className="relative flex items-center justify-between gap-3">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-xl shadow-primary/20 ring-1 ring-primary-foreground/15">
              {storeInitials || <Store className="size-5" />}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold leading-5">
                {store.name}
              </span>
              <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="size-3.5 text-primary" />
                Casho Merchant OS
              </span>
            </span>
          </Link>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 shrink-0 rounded-2xl md:hidden"
            onClick={() => setIsOpen(false)}
            aria-label="إغلاق القائمة"
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="relative mt-5 rounded-[1.7rem] border border-border/70 bg-background/70 p-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Workspace
              </p>
              <p className="mt-1 truncate text-sm font-bold">{store.slug}</p>
            </div>
            <Badge className="rounded-full border-0 bg-primary/10 text-primary hover:bg-primary/10">
              SaaS
            </Badge>
          </div>
        </div>
      </div>

      <Separator className="bg-border/70" />

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.title} className="space-y-2">
              <div className="flex items-center justify-between px-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  {section.title}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground/70">
                  {section.caption}
                </p>
              </div>

              <div className="space-y-1">
                {section.links.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.href, link.disabled);

                  if (link.disabled) {
                    return (
                      <div
                        key={link.name}
                        className="flex h-11 items-center gap-3 rounded-2xl px-3 text-sm font-bold text-muted-foreground opacity-70"
                      >
                        <span className="grid size-8 place-items-center rounded-xl bg-muted">
                          <Icon className="size-4" />
                        </span>
                        <span className="flex-1 truncate">{link.name}</span>
                        {link.badge && (
                          <Badge variant="secondary" className="rounded-full px-2 text-[10px]">
                            {link.badge}
                          </Badge>
                        )}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={cn(
                        "group relative flex h-11 items-center gap-3 rounded-2xl px-3 text-sm font-bold transition-all duration-200",
                        active
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                          : "text-foreground/75 hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {active && (
                        <span className="absolute inset-y-2 right-0 w-1 rounded-l-full bg-primary-foreground/90" />
                      )}
                      <span
                        className={cn(
                          "grid size-8 place-items-center rounded-xl transition-colors",
                          active
                            ? "bg-primary-foreground/15"
                            : "bg-muted text-muted-foreground group-hover:text-foreground",
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="flex-1 truncate">{link.name}</span>
                      {!!link.count && link.count > 0 && (
                        <span
                          className={cn(
                            "grid min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-bold",
                            active
                              ? "bg-primary-foreground text-primary"
                              : "bg-primary text-primary-foreground",
                          )}
                        >
                          {link.count > 99 ? "99+" : link.count}
                        </span>
                      )}
                      {active && <ChevronLeft className="size-4 opacity-80" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-border/70 bg-muted/30 p-3">
        <div className="rounded-[1.7rem] border border-border/70 bg-background/85 p-2 shadow-sm">
          <Button
            asChild
            variant="ghost"
            className="h-11 w-full justify-start gap-3 rounded-2xl font-bold"
          >
            <Link href="/dashboard/settings">
              <span className="grid size-8 place-items-center rounded-xl bg-muted">
                <Settings className="size-4" />
              </span>
              إعدادات المتجر
            </Link>
          </Button>

          <Button
            asChild
            variant="ghost"
            className="h-11 w-full justify-start gap-3 rounded-2xl font-bold"
          >
            <Link href={`/store/${store.slug}`} target="_blank" rel="noreferrer">
              <span className="grid size-8 place-items-center rounded-xl bg-muted">
                <ExternalLink className="size-4" />
              </span>
              زيارة المتجر
            </Link>
          </Button>

          <div className="mt-1">
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-muted/35 text-foreground"
    >
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute right-[18rem] top-[-16rem] size-[38rem] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute left-[-18rem] top-[16rem] size-[32rem] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_left,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:44px_44px] opacity-15" />
      </div>

      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/70 bg-background/85 px-4 backdrop-blur-2xl md:hidden">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 rounded-2xl bg-background/70"
          onClick={() => setIsOpen(true)}
          aria-label="فتح القائمة"
        >
          <Menu className="size-5" />
        </Button>

        <Link href="/dashboard" className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold">{store.name}</span>
          <span className="block text-xs text-muted-foreground">Merchant OS</span>
        </Link>

        <NotificationsBell
          initialNotifications={initialNotifications}
          initialUnreadCount={initialUnreadCount}
        />
        <ModeToggle />
      </header>

      <div
        role="presentation"
        onClick={() => setIsOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-[304px] border-l border-border/70 shadow-2xl shadow-black/15 transition-transform duration-300 md:translate-x-0 md:shadow-none",
          isOpen ? "translate-x-0" : "translate-x-full md:translate-x-0",
        )}
      >
        {sidebar}
      </aside>

      <main className="min-h-screen md:pr-[304px]">
        <div className="sticky top-0 z-20 hidden h-16 items-center justify-between gap-4 border-b border-border/70 bg-background/75 px-6 backdrop-blur-2xl md:flex">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Dashboard
            </p>
            <h1 className="truncate text-base font-bold">{store.name}</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="hidden h-10 min-w-64 items-center gap-2 rounded-2xl border border-border/70 bg-background/70 px-3 text-right text-sm font-semibold text-muted-foreground shadow-sm lg:flex"
            >
              <Search className="size-4" />
              بحث سريع داخل لوحة التحكم
              <span className="mr-auto rounded-lg border bg-muted px-1.5 py-0.5 text-[10px]">⌘K</span>
            </button>

            <NotificationsBell
              initialNotifications={initialNotifications}
              initialUnreadCount={initialUnreadCount}
            />
            <ModeToggle />
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-10 gap-2 rounded-2xl bg-background/70 font-bold"
            >
              <Link href={`/store/${store.slug}`} target="_blank" rel="noreferrer">
                زيارة المتجر
                <Store className="size-4" />
              </Link>
            </Button>
          </div>
        </div>

        <section className="mx-auto flex w-full max-w-[1540px] flex-col gap-6 px-4 pb-10 pt-5 sm:px-5 md:px-7 md:pb-14 md:pt-7">
          {children}
        </section>
      </main>
    </div>
  );
}
