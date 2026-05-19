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
  CirclePercent,
  CreditCard,
  Headset,
  ImageIcon,
  Layers,
  LayoutDashboard,
  Menu,
  Package,
  PaintRoller,
  Rocket,
  ScreenShare,
  Send,
  Settings,
  ShoppingCart,
  Store,
  Tag,
  Truck,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/app/(auth)/_components/LogoutBtn";
import { ModeToggle } from "@/theme/ModeToggle";
import { cn } from "@/lib/utils";
import type { NotificationDTO } from "@/actions/notifications/notifications.actions";
import NotificationsBell from "@/app/(merchant)/_components/notifications/NotificationsBell";

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
  disabled?: boolean;
  badge?: string;
  count?: number;
};

type NavSection = {
  title: string;
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
        title: "الرئيسية",
        links: [
          { name: "نظرة عامة", href: "/dashboard", icon: LayoutDashboard },
          {
            name: "الإشعارات",
            href: "/dashboard/notifications",
            icon: Bell,
            count: initialUnreadCount,
          },
          { name: "الطلبات", href: "/dashboard/orders", icon: ShoppingCart },
          { name: "المنتجات", href: "/dashboard/products", icon: Package },
          { name: "التصنيفات", href: "/dashboard/categories", icon: Tag },
          { name: "البانر", href: "/dashboard/banners", icon: ImageIcon },
          {
            name: "الكوبونات",
            href: "/dashboard/coupons",
            icon: CirclePercent,
          },
        ],
      },
      {
        title: "إدارة المتجر",
        links: [
          {
            name: "إدارة الرصيد",
            href: "/dashboard/balance",
            icon: BanknoteArrowUp,
          },
          {
            name: "تغيير الخطة",
            href: "/dashboard/change-plan",
            icon: ChartNoAxesCombined,
          },
          {
            name: "تخصيص المتجر",
            href: "/dashboard/customization",
            icon: PaintRoller,
          },
          {
            name: "بوابات الدفع",
            href: "/dashboard/payment-methods",
            icon: CreditCard,
          },
          { name: "إعدادات SEO", href: "/dashboard/seo", icon: Rocket },
          { name: "خدمات إضافية", href: "/dashboard/services", icon: Layers },
        ],
      },
      {
        title: "المساعدة والمحتوى",
        links: [
          { name: "المدونة", href: "/dashboard/blog", icon: BookOpen },
          { name: "مركز المساعدة", href: "/dashboard/support", icon: Headset },
        ],
      },
      {
        title: "قريبًا",
        links: [
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
    return href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-background">
      <div className="relative overflow-hidden border-b px-4 py-4">
        <div className="absolute inset-0 bg-linear-to-l from-primary/10 via-primary/5 to-transparent" />

        <div className="relative flex items-center justify-between gap-3">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
            <span className="grid h-11 w-11 rounded-xl shrink-0 place-items-center  bg-primary text-sm font-black text-primary-foreground shadow-lg shadow-primary/20">
              {storeInitials || <Store className="h-5 w-5" />}
            </span>

            <span className="min-w-0">
              <span className="block truncate text-sm font-black leading-5 ">
                {store.name}
              </span>
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                لوحة تحكم التاجر
              </span>
            </span>
          </Link>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0  md:hidden"
            onClick={() => setIsOpen(false)}
            aria-label="إغلاق القائمة"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-7">
          {sections.map((section) => (
            <div key={section.title} className="space-y-2">
              <p className="px-3 text-[11px] font-black tracking-wide text-muted-foreground">
                {section.title}
              </p>

              <div className="space-y-1">
                {section.links.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.href, link.disabled);

                  if (link.disabled) {
                    return (
                      <div
                        key={link.name}
                        className="flex h-11 items-center gap-3  px-3 text-sm font-semibold text-muted-foreground opacity-70"
                      >
                        <span className="grid h-8 w-8 place-items-center  bg-muted">
                          <Icon className="h-4 w-4" />
                        </span>

                        <span className="flex-1 truncate">{link.name}</span>

                        {link.badge && (
                          <Badge
                            variant="secondary"
                            className=" px-2 text-[10px]"
                          >
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
                          : "text-foreground/80 hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {active && (
                        <span className="absolute inset-y-2 right-0 w-1 rounded-l-full bg-primary-foreground/90" />
                      )}

                      <span
                        className={cn(
                          "grid h-8 w-8 place-items-center rounded-xl transition-colors",
                          active
                            ? "bg-primary-foreground/15"
                            : "bg-muted text-muted-foreground group-hover:text-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>

                      <span className="flex-1 truncate">{link.name}</span>

                      {!!link.count && link.count > 0 && (
                        <span
                          className={cn(
                            "grid min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-black",
                            active
                              ? "bg-primary-foreground text-primary"
                              : "bg-primary text-primary-foreground",
                          )}
                        >
                          {link.count > 99 ? "99+" : link.count}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t bg-muted/30 p-3">
        <div className="rounded-3xl border bg-background p-2 shadow-sm">
          <Button
            asChild
            variant="ghost"
            className="h-11 w-full justify-start gap-3 font-bold"
          >
            <Link href="/dashboard/settings">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-muted">
                <Settings className="h-4 w-4" />
              </span>
              إعدادات المتجر
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
      className="min-h-screen bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.08),transparent_32rem),linear-gradient(to_bottom,hsl(var(--muted)/0.45),hsl(var(--background)))]"
    >
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur-xl md:hidden">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 "
          onClick={() => setIsOpen(true)}
          aria-label="فتح القائمة"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Link href="/dashboard" className="min-w-0 flex-1">
          <span className="block truncate text-sm font-black">
            {store.name}
          </span>
          <span className="block text-xs text-muted-foreground">
            لوحة التحكم
          </span>
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
          "fixed inset-0 z-40 bg-black/55 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-72 border-l bg-background shadow-2xl shadow-black/10 transition-transform duration-300 md:translate-x-0 md:shadow-none",
          isOpen ? "translate-x-0" : "translate-x-full md:translate-x-0",
        )}
      >
        {sidebar}
      </aside>

      <main className="min-h-screen md:pr-72">
        <div className="sticky top-0 z-20 hidden h-16 items-center justify-between gap-4 border-b bg-background/80 px-6 backdrop-blur-xl md:flex">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground">
              لوحة تحكم
            </p>
            <h1 className="truncate text-base font-black">{store.name}</h1>
          </div>

          <div className="flex items-center gap-2">
            <NotificationsBell
              initialNotifications={initialNotifications}
              initialUnreadCount={initialUnreadCount}
            />
            <ModeToggle />
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-10 gap-2  bg-background/70 font-bold"
            >
              <Link
                href={`/store/${store.slug}`}
                target="_blank"
                rel="noreferrer"
              >
                زيارة المتجر
                <Store className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto w-full max-w-375 px-4 py-5 md:px-6 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
