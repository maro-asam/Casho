"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BanknoteArrowUp,
  ChartNoAxesCombined,
  ChevronLeft,
  ChevronRight,
  CirclePercent,
  Coins,
  CreditCard,
  ImageIcon,
  Layers,
  LayoutDashboard,
  Menu,
  Package,
  ScreenShare,
  Send,
  Settings,
  Ship,
  ShoppingCart,
  Store,
  Tag,
  Truck,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/LogoutBtn";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/theme/ModeToggle";

interface DashboardShellProps {
  store: {
    name: string;
    slug: string;
  };
  children: React.ReactNode;
}

type DashboardLink = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  badge?: string;
};

export default function DashboardShell({
  store,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const links: DashboardLink[] = [
    {
      name: "نظرة عامة",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "الطلبات",
      href: "/dashboard/orders",
      icon: ShoppingCart,
    },
    {
      name: "المنتجات",
      href: "/dashboard/products",
      icon: Package,
    },
    {
      name: "التصنيفات",
      href: "/dashboard/categories",
      icon: Tag,
    },
    {
      name: "البانر",
      href: "/dashboard/banners",
      icon: ImageIcon,
    },
    {
      name: "أكواد الخصم",
      href: "/dashboard/coupons",
      icon: CirclePercent,
    },
    {
      name: "ادارة الرصيد",
      href: "/dashboard/balance",
      icon: BanknoteArrowUp,
    },
    {
      name: "تغيير الخطة",
      href: "/dashboard/change-plan",
      icon: ChartNoAxesCombined,
    },
    {
      name: "خدمات اضافية",
      href: "/dashboard/services",
      icon: Layers,
    },
    {
      name: "ربط المتجر مع تيليجرام",
      href: "/dashboard/telegram",
      icon: Send,
    },
    {
      name: "بوابات الدفع",
      href: "/dashboard/payment-gateways",
      icon: CreditCard,
      disabled: true,
      badge: "قريبًا",
    },
    {
      name: "الحملات التسويقية",
      href: "/dashboard/marketing-campaigns",
      icon: ScreenShare,
      disabled: true,
      badge: "قريبًا",
    },
    {
      name: "شركات الشحن",
      href: "/dashboard/shipping-companies",
      icon: Truck,
      disabled: true,
      badge: "قريبًا",
    },
  ];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(true)}
          aria-label="فتح القائمة"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-bold text-primary"
        >
          <Store className="h-5 w-5" />
          <span className="max-w-[180px] truncate text-base">{store.name}</span>
        </Link>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)] md:min-h-screen">
        <div
          onClick={() => setIsOpen(false)}
          className={cn(
            "fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden",
            isOpen
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0",
          )}
        />

        <aside
          className={cn(
            "fixed right-0 top-0 z-50 h-screen border-l border-border/60 bg-background text-secondary-foreground shadow-xl transition-all duration-300",
            "md:sticky md:top-0 md:z-30 md:flex md:flex-col md:shadow-none",
            "px-4 py-6",
            isOpen ? "translate-x-0" : "translate-x-full",
            "w-[85%] max-w-72 md:translate-x-0",
            isCollapsed ? "md:w-20" : "md:w-64",
          )}
        >
          <div className="mb-4 flex items-center justify-between md:hidden">
            <Link
              href="/dashboard"
              className="text-2xl font-bold text-primary"
              onClick={() => setIsOpen(false)}
            >
              {store.name}
            </Link>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              aria-label="إغلاق القائمة"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="hidden md:block">
            <div
              className={cn(
                "flex items-center",
                isCollapsed ? "justify-center" : "justify-between",
              )}
            >
              {!isCollapsed && (
                <Link
                  href="/dashboard"
                  className="truncate text-xl font-bold text-primary"
                >
                  {store.name}
                </Link>
              )}

              <div className="space-x-2 space-y-2">
                <ModeToggle />
                <Button
                  variant="default"
                  size="icon"
                  onClick={() => setIsCollapsed((prev) => !prev)}
                  aria-label={isCollapsed ? "توسيع القائمة" : "تصغير القائمة"}
                >
                  {isCollapsed ? (
                    <ChevronLeft className="size-3.5" />
                  ) : (
                    <ChevronRight className="size-3.5" />
                  )}
                </Button>
              </div>
            </div>

            <hr className="my-4" />
          </div>

          <div className="md:hidden">
            <hr className="my-3" />
          </div>

          <nav className="flex flex-col gap-1">
            {links.map((link) => {
              const isActive =
                !link.disabled &&
                (link.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(link.href));

              const Icon = link.icon;

              if (link.disabled) {
                return (
                  <Button
                    key={link.href}
                    disabled
                    variant={`ghost`}
                    title={
                      isCollapsed ? `${link.name} - ${link.badge}` : undefined
                    }
                    className={cn(
                      "flex h-11 w-full",
                      isCollapsed
                        ? "justify-center px-0"
                        : "justify-start gap-3 px-3",
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />

                    {!isCollapsed && (
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate">{link.name}</span>
                        {link.badge && (
                          <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary">
                            {link.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </Button>
                );
              }

              return (
                <Button
                  key={link.href}
                  asChild
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "h-11 w-full",
                    isCollapsed
                      ? "justify-center px-0"
                      : "justify-start gap-3 px-3",
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <Link
                    href={link.href}
                    title={isCollapsed ? link.name : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!isCollapsed && <span>{link.name}</span>}
                  </Link>
                </Button>
              );
            })}
          </nav>

          <div className="mt-auto flex flex-col gap-2 pt-6">
            <hr />
            <Button
              asChild
              variant="ghost"
              className={cn(
                "h-11 w-full",
                isCollapsed
                  ? "justify-center px-0"
                  : "justify-start gap-3 px-3",
              )}
              onClick={() => setIsOpen(false)}
            >
              <Link
                href="/dashboard/settings"
                title={isCollapsed ? "إعدادات المتجر" : undefined}
              >
                <Settings className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>إعدادات المتجر</span>}
              </Link>
            </Button>

            <div className={cn(isCollapsed && "flex justify-center")}>
              <LogoutButton collapsed={isCollapsed} />
            </div>
          </div>
        </aside>

        <main className="max-w-375 mx-auto flex-1 p-3 md:p-4">{children}</main>
      </div>
    </div>
  );
}
