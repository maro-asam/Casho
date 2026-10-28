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

// macOS sidebar rows: monochrome glyphs, tinted glyph + soft fill on the current page.
const itemBase =
  "apple-press flex h-9 items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring";
const itemIdle = "text-sidebar-foreground/80 hover:bg-sidebar-accent";
const itemActive = "bg-sidebar-accent font-semibold text-sidebar-foreground";

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
              <Icon className={cn("size-[18px] shrink-0", isActive && "text-sidebar-primary")} strokeWidth={1.8} />
              {count > 0 && <span aria-hidden className="absolute inset-e-2 top-1.5 size-2 rounded-full bg-(--sys-red)" />}
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
        <Icon className={cn("size-[18px] shrink-0", isActive && "text-sidebar-primary")} strokeWidth={1.8} />
        <span className="flex-1 truncate">{item.name}</span>
        {/* Work waiting on an admin: the one place red is used in the chrome. */}
        {count > 0 && (
          <span className="min-w-5 rounded-full bg-(--sys-red) px-1.5 text-center text-[11px] leading-5 font-semibold text-white tabular-nums">
            {nf.format(count)}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="apple-glass flex h-full flex-col overflow-hidden rounded-[22px] text-sidebar-foreground">
      {/* Brand */}
      <div className={cn("flex h-16 shrink-0 items-center gap-2.5", collapsed ? "justify-center px-2" : "px-3.5")}>
        <div className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-linear-to-b from-sidebar-primary/85 to-sidebar-primary text-sidebar-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,.3)]">
          <ShieldCheck className="size-[18px]" strokeWidth={1.8} />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">كاشو</p>
            <p className="truncate text-[11px] font-normal text-muted-foreground">لوحة الإدارة</p>
          </div>
        )}
        {onToggleCollapsed && !collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapsed}
            aria-label="طي القائمة"
            className="size-8 shrink-0 rounded-full text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <PanelRightClose className="size-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav
        aria-label="قائمة الإدارة"
        className="scrollbar-hide flex-1 overflow-y-auto px-2 pt-1 pb-3 mask-[linear-gradient(to_bottom,transparent,black_12px,black_calc(100%-16px),transparent)]"
      >
        {onToggleCollapsed && collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapsed}
            aria-label="توسيع القائمة"
            className="mb-2 h-9 w-full rounded-[10px] text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <PanelRightOpen className="size-4" />
          </Button>
        )}

        <div className={cn(collapsed ? "space-y-2" : "space-y-5")}>
          {ADMIN_NAV.map((section, i) => (
            <div key={section.title ?? i}>
              {section.title &&
                (collapsed ? (
                  <div className="mx-3 mb-2 border-t-[0.5px] border-sidebar-border" />
                ) : (
                  <p className="mb-1 px-2.5 text-[11px] font-semibold text-muted-foreground">{section.title}</p>
                ))}
              <div className="space-y-0.5">{section.items.map(renderItem)}</div>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="mx-2 shrink-0 border-t-[0.5px] border-sidebar-border py-2">
        {/* Absolute: on the app host "/" is the merchant dashboard. */}
        {renderItem({ name: "الموقع الرئيسي", href: process.env.NEXT_PUBLIC_APP_URL || "https://casho.store", icon: ExternalLink })}
      </div>
    </div>
  );
}
