"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BanknoteArrowUp,
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
import { LogoutButton } from "@/app/(auth)/_components/LogoutBtn";
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

type NavSection = {
  title: string;
  links: DashboardLink[];
};

export default function DashboardShell({
  store,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const sections: NavSection[] = useMemo(
    () => [
      {
        title: "MAIN",
        links: [
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
            name: "الكوبونات",
            href: "/dashboard/coupons",
            icon: CirclePercent,
          },
        ],
      },
      {
        title: "STORE",
        links: [
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
            name: "بوابات الدفع",
            href: "/dashboard/payment-methods",
            icon: CreditCard,
          },
          {
            name: "تخصيص المتجر",
            href: "/dashboard/customization",
            icon: PaintRoller,
          },
          {
            name: "اعدادات SEO",
            href: "/dashboard/seo",
            icon: Rocket,
          },

          {
            name: "خدمات اضافية",
            href: "/dashboard/services",
            icon: Layers,
          },
        ],
      },

      {
        title: "SUPPORT",
        links: [
          {
            name: "المدونة",
            href: "/dashboard/blog",
            icon: BookOpen,
          },
          {
            name: "مركز المساعدة",
            href: "/dashboard/support",
            icon: Headset,
          },
        ],
      },
      {
        title: "COMING SOON",
        links: [
          {
            name: "ربط تيليجرام",
            href: "/dashboard/telegram",
            icon: Send,
            disabled: true,
            badge: "Soon",
          },
          {
            name: "بوابات الدفع",
            href: "/dashboard/payment-gateways",
            icon: CreditCard,
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
    [],
  );

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

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(true)}
          aria-label="فتح القائمة"
          className="border-border bg-background"
        >
          <Menu className="size-5" />
        </Button>

        <Link href="/dashboard" className="flex min-w-0 items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Store className="size-4" />
          </div>
          <span className="max-w-44 truncate text-sm font-semibold">
            {store.name}
          </span>
        </Link>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)] md:min-h-screen">
        <div
          onClick={() => setIsOpen(false)}
          className={cn(
            "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden",
            isOpen
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0",
          )}
        />

        <aside
          className={cn(
            "fixed right-0 top-0 z-50 flex h-screen w-[85%] max-w-xs translate-x-full flex-col border-l bg-background text-foreground shadow-2xl transition-transform duration-300 md:sticky md:top-0 md:z-30 md:w-72 md:max-w-none md:translate-x-0 md:border-l md:border-border md:shadow-none",
            isOpen && "translate-x-0",
          )}
        >
          <div className="flex h-full flex-col px-4 pb-4 pt-5">
            <div className="mb-5 flex items-center justify-between md:hidden">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Store className="size-4" />
                </div>
                <span className="truncate text-sm font-semibold">
                  {store.name}
                </span>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                aria-label="إغلاق القائمة"
              >
                <X className="size-5" />
              </Button>
            </div>

            <div className="mb-5 rounded-2xl border bg-muted/40 p-2">
              <div className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-right">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Store className="size-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{store.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    Merchant Store
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              <div className="space-y-6">
                {sections.map((section) => (
                  <div key={section.title}>
                    <p className="mb-2 px-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      {section.title}
                    </p>

                    <div className="space-y-1">
                      {section.links.map((link) => {
                        const Icon = link.icon;
                        const active = isActive(link.href, link.disabled);

                        if (link.disabled) {
                          return (
                            <div
                              key={link.href}
                              className="flex h-11 items-center justify-between rounded-xl px-3 text-muted-foreground opacity-60"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <Icon className="size-4 shrink-0" />
                                <span className="truncate text-sm">
                                  {link.name}
                                </span>
                              </div>

                              {link.badge && (
                                <span className="rounded-full border bg-muted px-2 py-0.5 text-[10px]">
                                  {link.badge}
                                </span>
                              )}
                            </div>
                          );
                        }

                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setIsOpen(false)}
                            className={cn(
                              "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                              active
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-foreground hover:bg-muted",
                            )}
                          >
                            <Icon className="size-4 shrink-0" />
                            <span className="truncate">{link.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 border-t pt-4">
              <div className="space-y-2">
                <div className="overflow-hidden rounded-xl border bg-muted/40">
                  <ModeToggle className="w-full" />
                </div>

                <Link
                  href="/dashboard/settings"
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                    pathname.startsWith("/dashboard/settings")
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/40 text-foreground hover:bg-muted",
                  )}
                >
                  <Settings className="size-4 shrink-0" />
                  <span>إعدادات المتجر</span>
                </Link>

                <LogoutButton collapsed={false} />
              </div>
            </div>
          </div>
        </aside>

        <div className="w-full min-w-0">
          <main className="">
            <div className="mx-auto min-h-[calc(100vh-2rem)] max-w-350 p-5 lg:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
