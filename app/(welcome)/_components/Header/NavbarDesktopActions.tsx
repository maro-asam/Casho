"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronDown, LayoutDashboard, LogOut, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogoutAction } from "@/actions/auth/logout.actions";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import LanguageToggle from "./LanguageToggle";
import ThemeToggle from "./ThemeToggle";
import { useLang } from "../../_i18n/LanguageContext";

type Props = {
  user: {
    email: string;
    storeName: string | null;
    storeSlug: string | null;
  } | null;
};

export function UserAvatar({
  name,
  email,
  className = "size-7 text-[11px]",
}: {
  name: string;
  email: string;
  className?: string;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground",
        className,
      )}
    >
      {initials || email[0].toUpperCase()}
    </div>
  );
}

export default function NavbarDesktopActions({ user }: Props) {
  const { t, lang } = useLang();
  const displayName = user?.storeName || user?.email?.split("@")[0] || t.navbar.myAccount;
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  const nudge = lang === "ar" ? "group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5";

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <span aria-hidden className="mx-1 h-5 w-px bg-border" />

      {user ? (
        <DropdownMenu dir={lang === "ar" ? "rtl" : "ltr"} modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-9 gap-2 rounded-lg ps-1 pe-2.5 text-sm font-medium hover:bg-muted data-[state=open]:bg-muted"
            >
              <UserAvatar name={displayName} email={user.email} className="size-7 text-[11px]" />
              <span className="max-w-28 truncate">{displayName}</span>
              <ChevronDown className="size-3.5 text-muted-foreground transition-transform duration-200 in-data-[state=open]:rotate-180" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" sideOffset={8} className="w-64 rounded-xl p-1.5">
            <div className="flex items-center gap-3 px-2.5 py-2.5 text-start">
              <UserAvatar name={displayName} email={user.email} className="size-9 text-xs" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <DropdownMenuSeparator className="my-1" />

            <DropdownMenuItem asChild className="cursor-pointer gap-2.5 rounded-lg py-2">
              <Link href={buildStoreUrl("app")}>
                <LayoutDashboard className="size-4 text-muted-foreground" />
                <span>{t.navbar.dashboard}</span>
              </Link>
            </DropdownMenuItem>

            {user.storeSlug && (
              <DropdownMenuItem asChild className="cursor-pointer gap-2.5 rounded-lg py-2">
                <Link href={buildStoreUrl(user.storeSlug)}>
                  <Store className="size-4 text-muted-foreground" />
                  <span>{t.navbar.viewStore}</span>
                </Link>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator className="my-1" />

            <form action={LogoutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10 focus-visible:bg-destructive/10"
              >
                <LogOut className="size-4" />
                <span>{t.navbar.logout}</span>
              </button>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <>
          <Button asChild variant="ghost" className="h-9 rounded-lg px-3.5 text-sm font-medium">
            <Link href="/login">{t.navbar.login}</Link>
          </Button>

          <Button asChild className="group h-9 gap-1.5 rounded-lg px-4 text-sm font-semibold">
            <Link href="/register">
              {t.navbar.startFree}
              <Arrow className={cn("size-4 transition-transform duration-200", nudge)} />
            </Link>
          </Button>
        </>
      )}
    </div>
  );
}
