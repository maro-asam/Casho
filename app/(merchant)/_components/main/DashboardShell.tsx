"use client";

import {
  useMemo,
  useState,
  useSyncExternalStore,
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
  ChevronRight,
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
  Send,
  Settings,
  ShoppingCart,
  Store,
  Tag,
  Truck,
} from "lucide-react";

import { LogoutButton } from "@/app/(auth)/_components/LogoutBtn";
import DashboardSearch from "@/app/(merchant)/_components/main/DashboardSearch";
import NotificationsBell from "@/app/(merchant)/_components/notifications/NotificationsBell";
// import QuickCustomizeSheet from "@/app/(merchant)/_components/main/QuickCustomizeSheet";
import type { NotificationDTO } from "@/actions/notifications/notifications.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/theme/ModeToggle";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";

interface DashboardShellProps {
  store: {
    id: string;
    name: string;
    slug: string;
    settings: {
      themeId: string | null;
      fontId: string | null;
      navbarVariant: string | null;
      primaryColor: string | null;
      secondaryColor: string | null;
    } | null;
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
  links: DashboardLink[];
};

const COLLAPSED_KEY = "casho-sidebar-collapsed";

export default function DashboardShell({
  store,
  initialNotifications,
  initialUnreadCount,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isCollapsed = useSyncExternalStore(
    (cb) => {
      window.addEventListener("storage", cb);
      return () => window.removeEventListener("storage", cb);
    },
    () => localStorage.getItem(COLLAPSED_KEY) === "true",
    () => false,
  );

  const toggle = () => {
    const next = !(localStorage.getItem(COLLAPSED_KEY) === "true");
    localStorage.setItem(COLLAPSED_KEY, String(next));
    window.dispatchEvent(new Event("storage"));
  };

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
        title: "التشغيل",
        links: [
          { name: "نظرة عامة", href: "/dashboard", icon: LayoutDashboard },
          {
            name: "الإشعارات",
            href: "/dashboard/notifications",
            icon: Bell,
            count: initialUnreadCount,
          },
          { name: "الطلبات", href: "/dashboard/orders", icon: ShoppingCart },
          {
            name: "التقارير",
            href: "/dashboard/reports",
            icon: ChartNoAxesCombined,
          },
        ],
      },
      {
        title: "المتجر",
        links: [
          { name: "المنتجات", href: "/dashboard/products", icon: Package },
          { name: "التصنيفات", href: "/dashboard/categories", icon: Tag },
          { name: "البانرات", href: "/dashboard/banners", icon: ImageIcon },
          {
            name: "الكوبونات",
            href: "/dashboard/coupons",
            icon: CirclePercent,
          },
        ],
      },
      {
        title: "النمو",
        links: [
          {
            name: "تخصيص المتجر",
            href: "/dashboard/customization",
            icon: PaintRoller,
          },
          { name: "إعدادات SEO", href: "/dashboard/seo", icon: Rocket },
          { name: "المدونة", href: "/dashboard/blog", icon: BookOpen },
          { name: "خدمات إضافية", href: "/dashboard/services", icon: Layers },
        ],
      },
      {
        title: "المالية",
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
            name: "بوابات الدفع",
            href: "/dashboard/payment-methods",
            icon: CreditCard,
          },
          { name: "الإعدادات", href: "/dashboard/settings", icon: Settings },
        ],
      },
      {
        title: "الدعم",
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

  const isActive = (href: string, disabled?: boolean) => {
    if (disabled) return false;
    return href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);
  };

  const sidebarContent = (collapsed: boolean) => (
    <div className="flex h-full flex-col bg-card">
      {/* Store header */}
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b border-border",
          collapsed ? "justify-center px-2" : "gap-3 px-4",
        )}
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
          {storeInitials || <Store className="size-4" />}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">
              {store.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {store.slug}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 overflow-y-auto py-3"
        style={{ padding: collapsed ? "12px 8px" : "12px 8px" }}
      >
        <div className={cn("space-y-5", collapsed && "space-y-2")}>
          {sections.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <p className="mb-1 px-2 text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {section.title}
                </p>
              )}
              {collapsed && <div className="my-2 h-px bg-border/50" />}
              <div className="space-y-0.5">
                {section.links.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.href, link.disabled);

                  if (link.disabled) {
                    return (
                      <div
                        key={link.name}
                        title={link.name}
                        className={cn(
                          "flex cursor-not-allowed items-center rounded-md px-2 py-1.5 text-sm text-muted-foreground/40",
                          collapsed ? "justify-center" : "gap-2.5",
                        )}
                      >
                        <Icon className="size-4 shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate">{link.name}</span>
                            {link.badge && (
                              <Badge
                                variant="secondary"
                                className="px-1.5 py-0 text-[10px] font-medium"
                              >
                                {link.badge}
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      title={collapsed ? link.name : undefined}
                      className={cn(
                        "relative flex items-center rounded-md px-2 py-1.5 text-[15px] font-medium transition-colors",
                        collapsed ? "justify-center" : "gap-2.5",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{link.name}</span>
                          {!!link.count && link.count > 0 && (
                            <span
                              className={cn(
                                "flex min-w-4.5 items-center justify-center rounded-lg px-1.5 text-[10px] font-bold",
                                active
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-primary/10 text-primary",
                              )}
                            >
                              {link.count > 99 ? "99+" : link.count}
                            </span>
                          )}
                        </>
                      )}
                      {collapsed && !!link.count && link.count > 0 && (
                        <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-border p-2 space-y-0.5">
        {!collapsed && (
          <>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-9 w-full justify-start gap-2.5 px-2 text-muted-foreground hover:text-foreground"
            >
              <Link href="/dashboard/settings">
                <Settings className="size-4" />
                إعدادات المتجر
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-9 w-full justify-start gap-2.5 px-2 text-muted-foreground hover:text-foreground"
            >
              <Link
                href={`/store/${store.slug}`}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="size-4" />
                زيارة المتجر
              </Link>
            </Button>
          </>
        )}
        <LogoutButton collapsed={collapsed} />
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          title={collapsed ? "توسيع القائمة" : "طي القائمة"}
          className={cn(
            "h-9 w-full px-2 text-muted-foreground hover:text-foreground",
            collapsed ? "justify-center" : "justify-start gap-2.5",
          )}
        >
          {collapsed ? (
            <ChevronLeft className="size-4" />
          ) : (
            <>
              <ChevronRight className="size-4" />
              <span className="text-sm">طي القائمة</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background px-4 md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="size-9">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-65 p-0 [&>button]:hidden">
            <SheetTitle className="sr-only">قائمة التنقل</SheetTitle>
            <div onClick={() => setMobileOpen(false)}>
              {sidebarContent(false)}
            </div>
          </SheetContent>
        </Sheet>

        <Link href="/dashboard" className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">
            {store.name}
          </span>
        </Link>

        <NotificationsBell
          initialNotifications={initialNotifications}
          initialUnreadCount={initialUnreadCount}
        />
        <ModeToggle />
      </header>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-20 hidden border-l border-border md:block transition-all duration-300 ease-in-out overflow-hidden",
          isCollapsed ? "w-16" : "w-65",
        )}
      >
        {sidebarContent(isCollapsed)}
      </aside>

      {/* Main content */}
      <main
        className={cn(
          "flex min-h-screen flex-col transition-all duration-300 ease-in-out",
          isCollapsed ? "md:pr-16" : "md:pr-65",
        )}
      >
        {/* Desktop topbar */}
        <header className="sticky top-0 z-10 hidden h-14 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur-sm md:flex">
          <p className="text-sm font-semibold text-muted-foreground">
            {store.name}
          </p>

          <div className="flex items-center gap-2">
            <DashboardSearch />

            <NotificationsBell
              initialNotifications={initialNotifications}
              initialUnreadCount={initialUnreadCount}
            />
            <ModeToggle />

            {/* <QuickCustomizeSheet storeId={store.id} settings={store.settings} /> */}

            <Button
              asChild
              variant="outline"
              className="gap-1.5 text-xs"
            >
              <Link
                href={buildStoreUrl(store.slug)}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="size-3.5" />
                زيارة المتجر
              </Link>
            </Button>
          </div>
        </header>

        {/* Page content */}
        <div className="mx-auto w-full max-w-385 flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
