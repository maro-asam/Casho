"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Wallet,
  BriefcaseBusiness,
  HeadphonesIcon,
  FileText,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

const NAV: NavItem[] = [
  { title: "الرئيسية",        href: "/admin",                   icon: LayoutDashboard },
  { title: "المتاجر",          href: "/admin/stores",             icon: Store           },
  { title: "طلبات الشحن",     href: "/admin/topup-requests",     icon: Wallet          },
  { title: "طلبات الخدمات",   href: "/admin/service-requests",   icon: BriefcaseBusiness},
  { title: "طلبات الدعم",     href: "/admin/support-requests",   icon: HeadphonesIcon  },
  { title: "المقالات",         href: "/admin/blog",               icon: FileText        },
];

export default function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map((item) => {
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            <span>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
