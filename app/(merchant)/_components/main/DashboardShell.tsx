"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BanknoteArrowUp,
  ChartNoAxesCombined,
  CirclePercent,
  CreditCard,
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
        ],
      },
      {
        title: "STORE",
        links: [
          {
            name: "الكوبونات",
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
    <div className="min-h-screen ">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-black/5  px-4 backdrop-blur md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(true)}
          aria-label="فتح القائمة"
          className="border-black/10 "
        >
          <Menu className="size-5" />
        </Button>

        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl text-primary-foreground">
            <Store className="size-4" />
          </div>
          <span className="max-w-44 truncate text-sm font-semibold text-black">
            {store.name}
          </span>
        </Link>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)] md:min-h-screen">
        <div
          onClick={() => setIsOpen(false)}
          className={cn(
            "fixed inset-0 z-40  transition-opacity duration-300 md:hidden",
            isOpen
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0",
          )}
        />

        <aside
          className={cn(
            "fixed right-0 top-0 z-50 flex h-screen w-[88%] max-w-72.5 translate-x-full flex-col text-primary-foreground transition-transform duration-300 md:sticky md:top-0 md:z-30 md:w-70 md:translate-x-0",
            isOpen && "translate-x-0",
          )}
        >
          <div className="flex h-full flex-col px-4 pb-4 pt-5">
            <div className="mb-5 flex items-center justify-between md:hidden">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl  text-black">
                  <Store className="size-4" />
                </div>
                <span className="text-sm font-semibold">{store.name}</span>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                aria-label="إغلاق القائمة"
                className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
              >
                <X className="size-5" />
              </Button>
            </div>

            <div className="mb-5 rounded-xl bg-primary/8 p-2">
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-right transition "
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-white text-primary">
                  <Store className="size-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium dark:text-primary-foreground text-black">
                    {store.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground dark:text-primary-foreground/55">
                    Merchant Store
                  </p>
                </div>
              </button>
            </div>

            <div className="scrollbar-hide flex-1 overflow-y-auto pr-1">
              <div className="space-y-6">
                {sections.map((section) => (
                  <div key={section.title}>
                    <p className="mb-2 px-2 text-[10px] font-medium uppercase tracking-[0.18em] text-primary dark:text-primary-foreground/35">
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
                              className="flex h-11 items-center justify-between rounded-xl px-3 text-zinc-400 dark:text-primary-foreground/40"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <Icon className="size-4 shrink-0" />
                                <span className="truncate text-sm">
                                  {link.name}
                                </span>
                              </div>

                              {link.badge && (
                                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] dark:text-primary-foreground/45">
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
                              "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition",
                              active
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-zinc-700 dark:text-primary-foreground/70 hover:bg-black/5 dark:hover:bg-white/5 dark:hover:text-primary-foreground",
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

            <div className="mt-5 border-t border-white/10 ">
              <div className="space-y-2 ">
                <div className="overflow-hidden rounded-xl bg-white/6 mt-2">
                  <ModeToggle className="w-full" />
                </div>
                <Link
                  href="/dashboard/settings"
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition",
                    pathname.startsWith("/dashboard/settings")
                      ? "bg-white text-black "
                      : "text-black dark:text-primary-foreground/70 bg-black/6 dark:bg-white/7 hover:bg-white/7 dark:hover:text-primary-foreground",
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

        <div className="w-full">
          <main className="flex-1 p-3 md:p-5 lg:p-6">
            <div className="min-h-[calc(100vh-2rem)] max-w-375 mx-auto ">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
