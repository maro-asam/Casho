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
      className="relative size-10 rounded-full text-foreground/80 hover:bg-muted hover:text-foreground"
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
        <Button variant="ghost" size="icon" aria-label="قائمة الحساب" className="size-10 rounded-full">
          <span className="grid size-8 place-items-center rounded-full bg-linear-to-b from-[#a1a1a6] to-[#8e8e93] text-xs font-semibold text-white">
            {display.slice(0, 1).toUpperCase()}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className="w-64 rounded-2xl p-1.5">
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
  const title = active && active.href !== "/admin" ? active.name : "نظرة عامة";

  return (
    <div className="sticky top-0 z-30 px-3 pt-3 sm:px-5">
      {/* Scroll edge effect: content softens as it slides under the floating bar. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-background/80 to-transparent backdrop-blur-md mask-[linear-gradient(to_bottom,black_40%,transparent)]"
      />
      <header className="apple-glass relative flex h-14 items-center gap-2 rounded-full ps-4 pe-2 sm:ps-5">
        {menuSlot}

        <nav aria-label="مسار الصفحة" className="min-w-0 flex-1">
          <ol className="flex min-w-0 items-center gap-1.5 text-sm">
            <li className="hidden text-muted-foreground sm:block">الإدارة</li>
            <li aria-hidden className="hidden text-muted-foreground/50 sm:block">
              <ChevronLeft className="size-3.5" />
            </li>
            <li className="truncate text-[15px] font-semibold">{title}</li>
          </ol>
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggle />
          <span aria-hidden className="mx-1 hidden h-5 border-s-[0.5px] border-border sm:block" />
          <AccountMenu viewer={viewer} />
        </div>
      </header>
    </div>
  );
}
