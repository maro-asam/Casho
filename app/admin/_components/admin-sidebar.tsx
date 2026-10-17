"use client";

import Link from "next/link";
import { ExternalLink, PanelRightClose, PanelRightOpen, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ADMIN_NAV, type AdminBadges, type AdminNavItem } from "./admin-nav";

type Props = {
  activeHref: string | null;
  badges: AdminBadges;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  /** Called after following a link (closes the mobile sheet). */
  onNavigate?: () => void;
};

const nf = new Intl.NumberFormat("ar-EG");

const itemBase =
  "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring";
const itemIdle = "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
const itemActive = "bg-sidebar-accent font-medium text-sidebar-accent-foreground";

export default function AdminSidebar({ activeHref, badges, collapsed = false, onToggleCollapsed, onNavigate }: Props) {
  const renderItem = (item: AdminNavItem) => {
    const Icon = item.icon;
    const isActive = activeHref === item.href;
    const count = item.badge ? (badges[item.badge] ?? 0) : 0;

    if (collapsed) {
      return (
        <Tooltip key={item.href}>
          <TooltipTrigger asChild>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-label={count ? `${item.name} (${nf.format(count)})` : item.name}
              aria-current={isActive ? "page" : undefined}
              className={cn(itemBase, "relative justify-center px-0", isActive ? itemActive : itemIdle)}
            >
              <Icon className={cn("size-4 shrink-0", isActive && "text-sidebar-primary")} />
              {count > 0 && <span aria-hidden className="absolute inset-e-2 top-1.5 size-1.5 rounded-full bg-amber-500" />}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="left">
            {item.name}
            {count > 0 && ` · ${nf.format(count)}`}
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        aria-current={isActive ? "page" : undefined}
        className={cn(itemBase, isActive ? itemActive : itemIdle)}
      >
        <Icon className={cn("size-4 shrink-0", isActive && "text-sidebar-primary")} />
        <span className="flex-1 truncate">{item.name}</span>
        {count > 0 && (
          <span className="min-w-5 rounded-md bg-amber-500/15 px-1.5 py-px text-center text-[11px] font-semibold tabular-nums text-amber-700 dark:text-amber-400">
            {nf.format(count)}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className={cn("flex h-16 shrink-0 items-center gap-2.5 border-b border-sidebar-border", collapsed ? "justify-center px-2" : "px-3")}>
        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <ShieldCheck className="size-4" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">كاشو</p>
            <p className="truncate text-xs text-sidebar-foreground/60">لوحة الإدارة</p>
          </div>
        )}
        {onToggleCollapsed && !collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapsed}
            aria-label="طي القائمة"
            className="size-8 shrink-0 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <PanelRightClose className="size-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav aria-label="قائمة الإدارة" className="flex-1 overflow-y-auto px-2 py-3">
        {onToggleCollapsed && collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapsed}
            aria-label="توسيع القائمة"
            className="mb-2 h-9 w-full text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <PanelRightOpen className="size-4" />
          </Button>
        )}

        <div className={cn(collapsed ? "space-y-2" : "space-y-5")}>
          {ADMIN_NAV.map((section, i) => (
            <div key={section.title ?? i}>
              {section.title &&
                (collapsed ? (
                  <div className="mx-2 mb-2 h-px bg-sidebar-border" />
                ) : (
                  <p className="mb-1 px-2.5 text-xs font-medium text-sidebar-foreground/50">{section.title}</p>
                ))}
              <div className="space-y-0.5">{section.items.map(renderItem)}</div>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-sidebar-border p-2">
        {/* Absolute: on the app host "/" is the merchant dashboard. */}
        {renderItem({ name: "الموقع الرئيسي", href: process.env.NEXT_PUBLIC_APP_URL || "https://casho.store", icon: ExternalLink })}
      </div>
    </div>
  );
}
