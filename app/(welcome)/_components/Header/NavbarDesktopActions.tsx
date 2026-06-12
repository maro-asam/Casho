"use client";

import Link from "next/link";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Store,
  ArrowLeft,
} from "lucide-react";

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
import { ModeToggle } from "@/theme/ModeToggle";
import LanguageToggle from "./LanguageToggle";
import { useLang } from "../../_i18n/LanguageContext";

type Props = {
  user: {
    email: string;
    storeName: string | null;
    storeSlug: string | null;
  } | null;
};

function UserAvatar({ name, email }: { name: string; email: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
      {initials || email[0].toUpperCase()}
    </div>
  );
}

export default function NavbarDesktopActions({ user }: Props) {
  const { t, lang } = useLang();
  const displayName = user?.storeName || user?.email?.split("@")[0] || t.navbar.myAccount;

  return (
    <div className="hidden items-center gap-2 md:flex">
      <LanguageToggle />
      <ModeToggle />

      {user ? (
        <DropdownMenu dir={lang === "ar" ? "rtl" : "ltr"} modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-9 gap-2 rounded-lg px-2.5 text-sm font-medium hover:bg-foreground/5"
            >
              <UserAvatar name={displayName} email={user.email} />
              <span className="hidden max-w-28 truncate sm:block">
                {displayName}
              </span>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            className="w-60 rounded-xl border-border/20 bg-background/95 p-1.5 shadow-xl backdrop-blur-xl"
          >
            <div className={`px-2.5 py-2 ${lang === "ar" ? "text-right" : "text-left"}`}>
              <p className="text-sm font-semibold">{displayName}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>

            <DropdownMenuSeparator className="my-1" />

            <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
              <Link
                href={buildStoreUrl("app")}
                className="flex items-center justify-between py-2"
              >
                <span>{t.navbar.dashboard}</span>
                <LayoutDashboard className="size-4 text-muted-foreground" />
              </Link>
            </DropdownMenuItem>

            {user.storeSlug && (
              <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                <Link
                  href={buildStoreUrl(user.storeSlug)}
                  className="flex items-center justify-between py-2"
                >
                  <span>{t.navbar.viewStore}</span>
                  <Store className="size-4 text-muted-foreground" />
                </Link>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator className="my-1" />

            <form action={LogoutAction}>
              <button
                type="submit"
                className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm outline-none transition-colors hover:bg-destructive/8 hover:text-destructive"
              >
                <span>{t.navbar.logout}</span>
                <LogOut className="size-4" />
              </button>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="flex items-center gap-1.5">
          <Button
            asChild
            variant="ghost"
            className="h-9 rounded-lg px-4 text-sm font-medium text-foreground/70 hover:text-foreground"
          >
            <Link href="/login">{t.navbar.login}</Link>
          </Button>

          <Button
            asChild
            className="group h-9 rounded-lg bg-gradient-to-l from-primary to-primary/80 px-4 text-sm font-semibold shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/30 hover:opacity-95"
          >
            <Link href="/register" className="flex items-center gap-1.5">
              {t.navbar.startFree}
              <ArrowLeft className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
