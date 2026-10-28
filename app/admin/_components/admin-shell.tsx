"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { findAdminNav, type AdminBadges } from "./admin-nav";
import AdminSidebar from "./admin-sidebar";
import AdminTopbar, { type AdminViewer } from "./admin-topbar";

const COLLAPSED_KEY = "casho-admin-sidebar-collapsed";

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

export default function AdminShell({ viewer, badges, children }: { viewer: AdminViewer; badges: AdminBadges; children: ReactNode }) {
  const pathname = usePathname();
  const active = findAdminNav(pathname);
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
        <Button variant="ghost" size="icon" aria-label="فتح القائمة" className="-ms-2 size-10 rounded-full md:hidden">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="apple-ui w-72 border-none bg-transparent p-3 shadow-none [&>button]:hidden">
        <SheetTitle className="sr-only">قائمة الإدارة</SheetTitle>
        <AdminSidebar activeHref={active?.href ?? null} badges={badges} onNavigate={() => setMobileOpen(false)} />
      </SheetContent>
    </Sheet>
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div dir="rtl" className="apple-ui min-h-screen bg-background text-foreground">
        {/* Desktop sidebar — a floating glass island; content scrolls beside it. */}
        <aside
          className={cn(
            "fixed inset-y-3 start-3 z-40 hidden overflow-hidden rounded-[22px] transition-[width] duration-300 ease-(--ease-apple) md:block",
            isCollapsed ? "w-16" : "w-64",
          )}
        >
          <AdminSidebar activeHref={active?.href ?? null} badges={badges} collapsed={isCollapsed} onToggleCollapsed={toggleCollapsed} />
        </aside>

        <div className={cn("flex min-h-screen flex-col transition-[padding] duration-300 ease-(--ease-apple)", isCollapsed ? "md:ps-22" : "md:ps-70")}>
          <AdminTopbar active={active} viewer={viewer} menuSlot={mobileMenu} />
          <main id="main-content" className="admin-ui apple-auto apple-form mx-auto w-full max-w-385 flex-1 px-4 pt-4 pb-10 sm:px-6 md:px-8 md:pt-6">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
