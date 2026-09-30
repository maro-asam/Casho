"use client";

import Link from "next/link";
import { ChevronLeft, ExternalLink, Headset, LogOut, Moon, Settings, Sun, Wallet } from "lucide-react";
import { useTheme } from "next-themes";

import { LogoutAction } from "@/actions/auth/logout.actions";
import type { NotificationDTO } from "@/actions/notifications/notifications.actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import NotificationsBell from "../notifications/NotificationsBell";
import DashboardSearch from "./DashboardSearch";
import type { ActiveNav } from "./dashboard-nav";

type Props = {
  store: { name: string; slug: string };
  active: ActiveNav | null;
  initialNotifications: NotificationDTO[];
  initialUnreadCount: number;
  /** Mobile menu trigger, rendered at the start of the bar. */
  menuSlot?: React.ReactNode;
};

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

function AccountMenu({ store }: { store: Props["store"] }) {
  const initials = store.name.trim().slice(0, 1).toUpperCase();

  return (
    <DropdownMenu dir="rtl" modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="قائمة الحساب" className="size-9 rounded-full">
          <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {initials}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-semibold">{store.name}</p>
          <p className="truncate text-xs text-muted-foreground" dir="ltr">
            {buildStoreUrl(store.slug).replace(/^https?:\/\//, "")}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={buildStoreUrl(store.slug)} target="_blank" rel="noreferrer">
            <ExternalLink />
            زيارة المتجر
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings />
            إعدادات المتجر
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/balance">
            <Wallet />
            الرصيد والاشتراك
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/support">
            <Headset />
            مركز المساعدة
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={LogoutAction}>
          <DropdownMenuItem asChild variant="destructive">
            <button type="submit" className="w-full">
              <LogOut />
              تسجيل الخروج
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function DashboardTopbar({ store, active, initialNotifications, initialUnreadCount, menuSlot }: Props) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-sm supports-backdrop-filter:bg-background/75 sm:px-6">
      {menuSlot}

      {/* Where am I */}
      <nav aria-label="مسار الصفحة" className="min-w-0 flex-1">
        {active ? (
          <ol className="flex min-w-0 items-center gap-1.5 text-sm">
            {active.child && (
              <>
                <li className="hidden truncate text-muted-foreground sm:block">{active.item.name}</li>
                <li aria-hidden className="hidden text-muted-foreground/50 sm:block">
                  <ChevronLeft className="size-3.5" />
                </li>
              </>
            )}
            <li className="truncate font-semibold">{active.child?.name ?? active.item.name}</li>
          </ol>
        ) : (
          <span className="truncate text-sm font-semibold">{store.name}</span>
        )}
      </nav>

      <div className="flex shrink-0 items-center gap-1">
        <DashboardSearch />
        <Button asChild variant="ghost" size="sm" className="hidden h-9 gap-1.5 text-muted-foreground hover:text-foreground lg:inline-flex">
          <Link href={buildStoreUrl(store.slug)} target="_blank" rel="noreferrer">
            <ExternalLink className="size-4" />
            زيارة المتجر
          </Link>
        </Button>
        <NotificationsBell initialNotifications={initialNotifications} initialUnreadCount={initialUnreadCount} />
        <ThemeToggle />
        <span aria-hidden className="mx-1 hidden h-5 w-px bg-border sm:block" />
        <AccountMenu store={store} />
      </div>
    </header>
  );
}
