"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, PanelRightClose, PanelRightOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import { NAV_FOOTER, NAV_SECTIONS, type ActiveNav, type NavItem } from "./dashboard-nav";

type Props = {
  store: { name: string; slug: string };
  active: ActiveNav | null;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  /** Called after following a link (closes the mobile sheet). */
  onNavigate?: () => void;
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

const itemBase =
  "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring";
const itemIdle = "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
const itemActive = "bg-sidebar-accent font-medium text-sidebar-accent-foreground";

export default function DashboardSidebar({ store, active, collapsed = false, onToggleCollapsed, onNavigate }: Props) {
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

    // Collapsed rail: icon only, groups jump to their first page.
    if (collapsed) {
      return (
        <Tooltip key={item.href}>
          <TooltipTrigger asChild>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-label={item.name}
              aria-current={isActive ? "page" : undefined}
              className={cn(itemBase, "justify-center px-0", isActive ? itemActive : itemIdle)}
            >
              <Icon className={cn("size-4 shrink-0", isActive && "text-sidebar-primary")} />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="left">{item.name}</TooltipContent>
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
            <Icon className={cn("size-4 shrink-0", isActive && "text-sidebar-primary")} />
            <span className="flex-1 truncate text-start">{item.name}</span>
            <ChevronDown className={cn("size-3.5 opacity-60 transition-transform", open && "rotate-180")} />
          </button>

          {open && (
            <ul id={panelId} className="my-0.5 ms-[1.1rem] space-y-0.5 border-s border-sidebar-border ps-2">
              {item.children.map((child) => {
                const childActive = active?.child?.href === child.href;
                return (
                  <li key={child.href}>
                    <Link
                      href={child.href}
                      onClick={onNavigate}
                      aria-current={childActive ? "page" : undefined}
                      className={cn(itemBase, "h-8 text-[13px]", childActive ? itemActive : itemIdle)}
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
        aria-current={isActive ? "page" : undefined}
        className={cn(itemBase, isActive ? itemActive : itemIdle)}
      >
        <Icon className={cn("size-4 shrink-0", isActive && "text-sidebar-primary")} />
        <span className="flex-1 truncate">{item.name}</span>
        {item.badge && (
          <span className="rounded bg-sidebar-primary/10 px-1.5 py-px text-[10px] font-semibold text-sidebar-primary">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Store */}
      <div className={cn("flex h-16 shrink-0 items-center gap-2.5 border-b border-sidebar-border", collapsed ? "justify-center px-2" : "px-3")}>
        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
          {initialsOf(store.name)}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">{store.name}</p>
            <p className="truncate text-xs text-sidebar-foreground/60" dir="ltr">
              {buildStoreUrl(store.slug).replace(/^https?:\/\//, "")}
            </p>
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
      <nav aria-label="القائمة الرئيسية" className="flex-1 overflow-y-auto px-2 py-3">
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
          {NAV_SECTIONS.map((section, i) => (
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
      <div className="shrink-0 space-y-0.5 border-t border-sidebar-border p-2">{NAV_FOOTER.map(renderItem)}</div>
    </div>
  );
}
