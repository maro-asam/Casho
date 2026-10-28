"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, PanelRightClose, PanelRightOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import { NAV_FOOTER, NAV_SECTIONS, type ActiveNav, type NavBadges, type NavItem } from "./dashboard-nav";
import { isRtl, tr } from "@/lib/i18n/dashboard";

type Props = {
  store: { name: string; slug: string };
  active: ActiveNav | null;
  /** Live counts (orders waiting…), keyed by item href. */
  badges?: NavBadges;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  /** Called after following a link (closes the mobile sheet). */
  onNavigate?: () => void;
  /** Off for the landing page's inert demo, where these routes don't exist. */
  prefetch?: boolean;
};

function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

const countLabel = (count: number) => (count > 99 ? "99+" : String(count));

// macOS sidebar rows: monochrome glyphs, tinted glyph + soft fill on the current page.
const itemBase =
  "apple-press flex h-9 items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring";
const itemIdle = "text-sidebar-foreground/80 hover:bg-sidebar-accent";
const itemActive = "bg-sidebar-accent font-semibold text-sidebar-foreground";

export default function DashboardSidebar({ store, active, badges, collapsed = false, onToggleCollapsed, onNavigate, prefetch }: Props) {
  // Groups start open when they contain the current page; the user can toggle freely after.
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(active?.child ? [active.item.href] : []),
  );

  const toggleGroup = (href: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(href)) next.delete(href);
      else next.add(href);
      return next;
    });

  const renderItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = active?.item.href === item.href;
    const count = badges?.[item.href] ?? 0;

    // Collapsed rail: icon only, groups jump to their first page.
    if (collapsed) {
      return (
        <Tooltip key={item.href}>
          <TooltipTrigger asChild>
            <Link
              href={item.href}
              onClick={onNavigate}
              prefetch={prefetch}
              aria-label={count > 0 ? `${item.name} (${count})` : item.name}
              aria-current={isActive ? "page" : undefined}
              className={cn(itemBase, "relative justify-center px-0", isActive ? itemActive : itemIdle)}
            >
              <Icon className={cn("size-[18px] shrink-0", isActive && "text-sidebar-primary")} strokeWidth={1.8} />
              {count > 0 && <span aria-hidden className="absolute top-1.5 end-3 size-2 rounded-full bg-(--sys-red) ring-2 ring-sidebar" />}
            </Link>
          </TooltipTrigger>
          <TooltipContent side={isRtl() ? "left" : "right"}>{count > 0 ? `${item.name} · ${countLabel(count)}` : item.name}</TooltipContent>
        </Tooltip>
      );
    }

    if (item.children) {
      const open = openGroups.has(item.href);
      const panelId = `nav-group-${item.href.replace(/\W/g, "")}`;

      return (
        <div key={item.href}>
          <button
            type="button"
            onClick={() => toggleGroup(item.href)}
            aria-expanded={open}
            aria-controls={panelId}
            className={cn(itemBase, "w-full", isActive && !open ? itemActive : itemIdle)}
          >
            <Icon className={cn("size-[18px] shrink-0", isActive && "text-sidebar-primary")} strokeWidth={1.8} />
            <span className="flex-1 truncate text-start">{item.name}</span>
            <ChevronDown
              className={cn("size-3.5 text-(--label-3) transition-transform duration-300 ease-(--ease-apple)", open && "rotate-180")}
            />
          </button>

          {open && (
            <ul id={panelId} className="my-0.5 space-y-0.5 ps-7">
              {item.children.map((child) => {
                const childActive = active?.child?.href === child.href;
                return (
                  <li key={child.href}>
                    <Link
                      href={child.href}
                      onClick={onNavigate}
                      prefetch={prefetch}
                      aria-current={childActive ? "page" : undefined}
                      className={cn(itemBase, "h-8 text-[13px]", childActive ? cn(itemActive, "text-sidebar-primary") : itemIdle)}
                    >
                      <span className="truncate">{child.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        prefetch={prefetch}
        aria-current={isActive ? "page" : undefined}
        className={cn(itemBase, isActive ? itemActive : itemIdle)}
      >
        <Icon className={cn("size-[18px] shrink-0", isActive && "text-sidebar-primary")} strokeWidth={1.8} />
        <span className="flex-1 truncate">{item.name}</span>
        {count > 0 && (
          <span
            aria-label={tr("{0} مستني", countLabel(count))}
            className="min-w-5 rounded-full bg-(--sys-red) px-1.5 py-px text-center text-[11px] font-semibold text-white tabular-nums"
          >
            {countLabel(count)}
          </span>
        )}
        {!count && item.badge && (
          <span className="rounded-full bg-sidebar-accent px-1.5 py-px text-[10px] font-semibold text-sidebar-foreground/70">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="apple-glass flex h-full flex-col overflow-hidden rounded-[22px] text-sidebar-foreground">
      {/* Store */}
      <div className={cn("flex h-16 shrink-0 items-center gap-2.5", collapsed ? "justify-center px-2" : "px-3.5")}>
        <div className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-linear-to-b from-sidebar-primary/85 to-sidebar-primary text-xs font-bold text-sidebar-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,.3)]">
          {initialsOf(store.name)}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">{store.name}</p>
            <p className="truncate text-[11px] font-normal text-muted-foreground" dir="ltr">
              {buildStoreUrl(store.slug).replace(/^https?:\/\//, "")}
            </p>
          </div>
        )}
        {onToggleCollapsed && !collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapsed}
            aria-label={tr("طي القائمة")}
            className="size-8 shrink-0 rounded-full text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <PanelRightClose className="size-4 ltr:-scale-x-100" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav
        aria-label={tr("القائمة الرئيسية")}
        className="scrollbar-hide flex-1 overflow-y-auto px-2 pt-1 pb-3 mask-[linear-gradient(to_bottom,transparent,black_12px,black_calc(100%-16px),transparent)]"
      >
        {onToggleCollapsed && collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapsed}
            aria-label={tr("توسيع القائمة")}
            className="mb-2 h-9 w-full rounded-[10px] text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <PanelRightOpen className="size-4 ltr:-scale-x-100" />
          </Button>
        )}

        <div className={cn(collapsed ? "space-y-2" : "space-y-5")}>
          {NAV_SECTIONS.map((section, i) => (
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
      <div className="mx-2 shrink-0 space-y-0.5 border-t-[0.5px] border-sidebar-border py-2">{NAV_FOOTER.map(renderItem)}</div>
    </div>
  );
}
