"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { ChevronLeft, LogOut, Moon, ShieldCheck, Sun, UserRound } from "lucide-react";

import { LogoutAction } from "@/actions/auth/logout.actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminNavItem } from "./admin-nav";

export type AdminViewer = { id: string; name: string | null; email: string; role: string };

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="تبديل الوضع الداكن"
      className="relative size-9 text-muted-foreground hover:text-foreground"
    >
      <Sun className="size-4 scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute size-4 scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0" />
    </Button>
  );
}

function AccountMenu({ viewer }: { viewer: AdminViewer }) {
  const [isLoggingOut, startLogout] = useTransition();
  const display = viewer.name?.trim() || viewer.email;

  return (
    <DropdownMenu dir="rtl" modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="قائمة الحساب" className="size-9 rounded-full">
          <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {display.slice(0, 1).toUpperCase()}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-semibold">{display}</p>
          <p className="truncate text-xs text-muted-foreground" dir="ltr">
            {viewer.email}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/admin/users/${viewer.id}`}>
            <UserRound />
            حسابي
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin/security">
            <ShieldCheck />
            سجل الأمان
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* Not a <form>: selecting an item unmounts the menu before the browser submits. */}
        <DropdownMenuItem
          variant="destructive"
          disabled={isLoggingOut}
          onSelect={(e) => {
            e.preventDefault();
            startLogout(() => LogoutAction());
          }}
        >
          <LogOut />
          {isLoggingOut ? "جارٍ تسجيل الخروج…" : "تسجيل الخروج"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function AdminTopbar({
  active,
  viewer,
  menuSlot,
}: {
  active: AdminNavItem | null;
  viewer: AdminViewer;
  menuSlot?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-sm supports-backdrop-filter:bg-background/75 sm:px-6">
      {menuSlot}

      <nav aria-label="مسار الصفحة" className="min-w-0 flex-1">
        <ol className="flex min-w-0 items-center gap-1.5 text-sm">
          <li className="hidden text-muted-foreground sm:block">الإدارة</li>
          {active && active.href !== "/admin" && (
            <>
              <li aria-hidden className="hidden text-muted-foreground/50 sm:block">
                <ChevronLeft className="size-3.5" />
              </li>
              <li className="truncate font-semibold">{active.name}</li>
            </>
          )}
          {(!active || active.href === "/admin") && (
            <>
              <li aria-hidden className="hidden text-muted-foreground/50 sm:block">
                <ChevronLeft className="size-3.5" />
              </li>
              <li className="truncate font-semibold">نظرة عامة</li>
            </>
          )}
        </ol>
      </nav>

      <div className="flex shrink-0 items-center gap-1">
        <ThemeToggle />
        <span aria-hidden className="mx-1 hidden h-5 w-px bg-border sm:block" />
        <AccountMenu viewer={viewer} />
      </div>
    </header>
  );
}
