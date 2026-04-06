"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  LayoutDashboard,
  LucideIcon,
  Store,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

type IconName = "dashboard" | "store" | "wallet" | "briefcase";

type NavItem = {
  title: string;
  href: string;
  icon: IconName;
};

const iconMap: Record<IconName, LucideIcon> = {
  dashboard: LayoutDashboard,
  store: Store,
  wallet: Wallet,
  briefcase: BriefcaseBusiness,
};

export default function AdminSidebarNav({
  links,
}: {
  links: readonly NavItem[];
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {links.map((link) => {
        const Icon = iconMap[link.icon];

        const isActive =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon
              className={cn(
                "size-4 transition",
                isActive
                  ? "opacity-100"
                  : "opacity-70 group-hover:opacity-100",
              )}
            />
            <span>{link.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}