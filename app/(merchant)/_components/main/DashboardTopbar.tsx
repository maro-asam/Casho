"use client";

import { useTransition } from "react";
import Link from "next/link";
import { ChevronLeft, ExternalLink, Headset, Languages, LogOut, Moon, Settings, Sun, Wallet } from "lucide-react";
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
import { currentLocale, tdir, tr } from "@/lib/i18n/dashboard";
import { useSwitchLocale } from "@/lib/i18n/dashboard/use-switch-locale";

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
      aria-label={tr("تبديل الوضع الداكن")}
      className="relative size-10 rounded-full text-foreground/80 hover:bg-muted hover:text-foreground"
    >
      <Sun className="size-4 scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute size-4 scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0" />
    </Button>
  );
}

function AccountMenu({ store }: { store: Props["store"] }) {
  const initials = store.name.trim().slice(0, 1).toUpperCase();
  const [isLoggingOut, startLogout] = useTransition();
  const locale = currentLocale();
  const { switchTo, pending: switching } = useSwitchLocale();

  return (
    <DropdownMenu dir={tdir()} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={tr("قائمة الحساب")} className="size-10 rounded-full">
          <span className="grid size-8 place-items-center rounded-full bg-linear-to-b from-[#a1a1a6] to-[#8e8e93] text-xs font-semibold text-white">
            {initials}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className="w-64 rounded-2xl p-1.5">
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
            {tr("زيارة المتجر")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings />
            {tr("إعدادات المتجر")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/balance">
            <Wallet />
            {tr("الرصيد والاشتراك")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/support">
            <Headset />
            {tr("مركز المساعدة")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={switching}
          onSelect={(e) => {
            e.preventDefault();
            switchTo(locale === "ar" ? "en" : "ar");
          }}
        >
          <Languages />
          {/* Always named in the target language, so it's findable either way. */}
          <span lang={locale === "ar" ? "en" : "ar"}>{locale === "ar" ? "English" : "العربية"}{/* i18n-ignore */}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* Not a <form>: selecting an item closes (unmounts) the menu before the
            browser submits, which silently cancels the submission. */}
        <DropdownMenuItem
          variant="destructive"
          disabled={isLoggingOut}
          onSelect={(e) => {
            e.preventDefault();
            startLogout(() => LogoutAction());
          }}
        >
          <LogOut />
          {isLoggingOut ? tr("جارٍ تسجيل الخروج…") : tr("تسجيل الخروج")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function DashboardTopbar({ store, active, initialNotifications, initialUnreadCount, menuSlot }: Props) {
  return (
    <div className="sticky top-0 z-30 px-3 pt-3 sm:px-5">
      {/* Scroll edge effect: content softens as it slides under the floating bar. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-background/80 to-transparent backdrop-blur-md mask-[linear-gradient(to_bottom,black_40%,transparent)]"
      />
    <header className="apple-glass relative flex h-14 items-center gap-2 rounded-full ps-4 pe-2 sm:ps-5">
      {menuSlot}

      {/* Where am I */}
      <nav aria-label={tr("مسار الصفحة")} className="min-w-0 flex-1">
        {active ? (
          <ol className="flex min-w-0 items-center gap-1.5 text-sm">
            {active.child && (
              <>
                <li className="hidden truncate font-normal text-muted-foreground sm:block">{active.item.name}</li>
                <li aria-hidden className="hidden text-muted-foreground/50 sm:block">
                  <ChevronLeft className="size-3.5 ltr:-scale-x-100" />
                </li>
              </>
            )}
            <li className="truncate text-[15px] font-semibold">{active.child?.name ?? active.item.name}</li>
          </ol>
        ) : (
          <span className="truncate text-sm font-semibold">{store.name}</span>
        )}
      </nav>

      <div className="flex shrink-0 items-center gap-1">
        <DashboardSearch />
        <Button asChild variant="ghost" size="sm" className="hidden h-9 gap-1.5 rounded-full font-normal text-foreground/80 hover:bg-muted hover:text-foreground lg:inline-flex">
          <Link href={buildStoreUrl(store.slug)} target="_blank" rel="noreferrer">
            <ExternalLink className="size-4" />
            {tr("زيارة المتجر")}
          </Link>
        </Button>
        <NotificationsBell initialNotifications={initialNotifications} initialUnreadCount={initialUnreadCount} />
        <ThemeToggle />
        <span aria-hidden className="mx-1 hidden h-5 border-s-[0.5px] border-border sm:block" />
        <AccountMenu store={store} />
      </div>
    </header>
    </div>
  );
}
