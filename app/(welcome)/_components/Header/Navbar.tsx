import Link from "next/link";
import Image from "next/image";
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

import { getCurrentUser } from "@/actions/auth/auth-helpers.actions";
import { LogoutAction } from "@/actions/auth/logout.actions";
import MobileNavMenu from "./MobileNavMenu";
import AnimatedNavbarShell from "./AnimatedNavbarShell";
import NavbarDesktopLinks from "./NavbarDesktopLinks";
import { ModeToggle } from "@/theme/ModeToggle";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";

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

const Navbar = async () => {
  const user = await getCurrentUser();
  const store = user?.stores?.[0];
  const displayName = store?.name || user?.email?.split("@")[0] || "حسابي";

  return (
    <header className="sticky top-4 z-50 mx-auto px-4">
      <AnimatedNavbarShell>
        <div className="flex w-full items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="flex size-9 items-center justify-center">
              <Image
                src="/logo.svg"
                width={36}
                height={36}
                alt="Casho"
                className="rounded-lg"
              />
            </div>
            <span className="text-xl font-black tracking-tight">
              <span className="text-primary">C</span>ASHO
            </span>
          </Link>

          {/* Desktop nav */}
          <NavbarDesktopLinks />

          {/* Desktop actions */}
          <div className="hidden items-center gap-2 md:flex">
            <ModeToggle />

            {user ? (
              <DropdownMenu dir="rtl" modal={false}>
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
                  <div className="px-2.5 py-2 text-right">
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
                      <span>لوحة التحكم</span>
                      <LayoutDashboard className="size-4 text-muted-foreground" />
                    </Link>
                  </DropdownMenuItem>

                  {store?.slug && (
                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                      <Link
                        href={buildStoreUrl(store.slug)}
                        className="flex items-center justify-between py-2"
                      >
                        <span>عرض المتجر</span>
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
                      <span>تسجيل الخروج</span>
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
                  <Link href="/login">تسجيل دخول</Link>
                </Button>

                <Button
                  asChild
                  className="group h-9 rounded-lg bg-gradient-to-l from-primary to-primary/80 px-4 text-sm font-semibold shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/30 hover:opacity-95"
                >
                  <Link href="/register" className="flex items-center gap-1.5">
                    ابدأ مجانًا
                    <ArrowLeft className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile */}
          <div className="md:hidden">
            <MobileNavMenu
              user={
                user
                  ? {
                      email: user.email,
                      storeName: store?.name ?? null,
                      storeSlug: store?.slug ?? null,
                    }
                  : null
              }
            />
          </div>
        </div>
      </AnimatedNavbarShell>
    </header>
  );
};

export default Navbar;
