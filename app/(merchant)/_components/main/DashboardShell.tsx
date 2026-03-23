"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ImageIcon,
  Menu,
  X,
  Store,
  Tag,
  Settings2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/LogoutBtn";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  store: {
    name: string;
    slug: string;
  };
  children: React.ReactNode;
}

export default function DashboardShell({
  store,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
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
  ];

  useEffect(() => {}, [pathname]);

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
      {/* Mobile Topbar */}
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
          <span className="max-w-45 truncate text-base">{store.name}</span>
        </Link>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)] md:min-h-screen">
        {/* Overlay - Mobile */}
        <div
          onClick={() => setIsOpen(false)}
          className={cn(
            "fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden",
            isOpen
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0",
          )}
        />

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed right-0 top-0 z-50 h-screen w-[85%] max-w-72 border-l bg-secondary p-4 text-secondary-foreground shadow-xl transition-transform duration-300 md:sticky md:top-0 md:z-30 md:w-64 md:max-w-none md:translate-x-0 md:border-l md:shadow-none",
            isOpen ? "translate-x-0" : "translate-x-full",
            "md:flex md:flex-col",
          )}
        >
          {/* Mobile Sidebar Header */}
          <div className="mb-4 flex items-center justify-between md:hidden">
            <Link
              href="/dashboard"
              className="text-xl font-bold text-primary"
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

          {/* Desktop Brand */}
          <div className="hidden md:block">
            <h2 className="py-3 text-center text-3xl font-bold text-primary">
              <Link href="/dashboard">{store.name}</Link>
            </h2>
            <hr className="my-3" />
          </div>

          {/* Mobile Brand Divider */}
          <div className="md:hidden">
            <hr className="my-3" />
          </div>

          <nav className="flex flex-col gap-3">
            {links.map((link) => {
              const isActive =
                link.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(link.href);

              const Icon = link.icon;

              return (
                <Button
                  key={link.href}
                  asChild
                  variant={isActive ? "default" : "outline"}
                  className={cn(
                    "w-full justify-start gap-3 text-sm",
                    "h-11 ",
                  )}
                >
                  <Link href={link.href}>
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{link.name}</span>
                  </Link>
                </Button>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 flex flex-col gap-2">
            <Button
              asChild
              variant="outline"
              className="h-11 w-full justify-start gap-3 "
            >
              <Link href="/dashboard/settings">
                <Settings2 className="h-4 w-4 shrink-0" />
                <span>إعدادات المتجر</span>
              </Link>
            </Button>

            <LogoutButton />
          </div>
        </aside>

        {/* Desktop spacer */}

        {/* Main Content */}
        <main className="min-w-0 flex-1 p-4 sm:p-5 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
