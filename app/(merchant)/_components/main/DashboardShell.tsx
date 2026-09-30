"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import type { NotificationDTO } from "@/actions/notifications/notifications.actions";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import DashboardSidebar from "./DashboardSidebar";
import DashboardTopbar from "./DashboardTopbar";
import { findActiveNav } from "./dashboard-nav";

interface DashboardShellProps {
  store: {
    id: string;
    name: string;
    slug: string;
  };
  initialNotifications: NotificationDTO[];
  initialUnreadCount: number;
  children: ReactNode;
}

const COLLAPSED_KEY = "casho-sidebar-collapsed";

function subscribeStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

export default function DashboardShell({
  store,
  initialNotifications,
  initialUnreadCount,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const active = findActiveNav(pathname);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isCollapsed = useSyncExternalStore(subscribeStorage, readCollapsed, () => false);

  const toggleCollapsed = () => {
    try {
      localStorage.setItem(COLLAPSED_KEY, String(!readCollapsed()));
    } catch {
      // Storage blocked — nothing to persist.
    }
    window.dispatchEvent(new Event("storage"));
  };

  const mobileMenu = (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="فتح القائمة" className="-ms-2 size-9 md:hidden">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72 border-sidebar-border p-0 [&>button]:hidden">
        <SheetTitle className="sr-only">قائمة التنقل</SheetTitle>
        {/* Keyed by path so expanded groups follow the page that's open. */}
        <DashboardSidebar key={pathname} store={store} active={active} onNavigate={() => setMobileOpen(false)} />
      </SheetContent>
    </Sheet>
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div dir="rtl" className="min-h-screen bg-background text-foreground">
        {/* Desktop sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 start-0 z-40 hidden overflow-hidden border-e border-sidebar-border transition-[width] duration-200 ease-out md:block",
            isCollapsed ? "w-16" : "w-64",
          )}
        >
          <DashboardSidebar
            store={store}
            active={active}
            collapsed={isCollapsed}
            onToggleCollapsed={toggleCollapsed}
          />
        </aside>

        <div
          className={cn(
            "flex min-h-screen flex-col transition-[padding] duration-200 ease-out",
            isCollapsed ? "md:ps-16" : "md:ps-64",
          )}
        >
          <DashboardTopbar
            store={store}
            active={active}
            initialNotifications={initialNotifications}
            initialUnreadCount={initialUnreadCount}
            menuSlot={mobileMenu}
          />

          <main id="main-content" className="mx-auto w-full max-w-385 flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
