import Link from "next/link";
import {
  Store,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  StoreIcon,
  LogIn,
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
import Image from "next/image";
import MobileNavMenu from "./MobileNavMenu";
import AnimatedNavbarShell from "./AnimatedNavbarShell";
import NavbarDesktopLinks from "./NavbarDesktopLinks";

const Navbar = async () => {
  const user = await getCurrentUser();
  const store = user?.stores?.[0];

  return (
    <header className="sticky top-4 z-100 mx-auto">
      <div className="mx-auto">
        <AnimatedNavbarShell>
          <div className="flex items-center justify-between rounded-xl border border-border/10 bg-card/80 px-4 py-3 backdrop-blur-2xl shadow-lg md:px-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Link href="/" className="group flex items-center gap-3">
                <div className="flex size-11 items-center justify-center transition-all duration-300">
                  <Image
                    src="/logo.svg"
                    width={55}
                    height={55}
                    alt="Casho logo"
                    className="rounded-lg"
                  />
                </div>

                <div className="flex flex-col leading-none">
                  <span className="text-xl font-extrabold">
                    <span className="text-primary">C</span>ASHO
                  </span>
                  <span className="text-xs text-muted-foreground">
                    <span className="text-primary">كاشو</span> منصتك للبيع
                    أونلاين
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop links */}
            <NavbarDesktopLinks />

            {/* Desktop actions */}
            <div className="hidden items-center gap-2 md:flex">
              {user ? (
                <DropdownMenu dir="rtl" modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-11 rounded-lg border-border/10 px-3 transition-all duration-300"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-300">
                          <StoreIcon className="size-4" />
                        </div>

                        <div className="hidden text-right sm:block">
                          <p className="max-w-35 truncate text-sm font-semibold">
                            {store?.name || "حسابي"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>

                        <ChevronDown className="size-4 text-muted-foreground transition-transform duration-300 group-data-[state=open]:rotate-180" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="start"
                    className="w-64 rounded-lg border-border/60 bg-background/95 p-2 shadow-xl backdrop-blur-xl"
                  >
                    <div className="px-2 py-2 text-right">
                      <p className="text-sm font-bold">
                        {store?.name || "حسابي"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      asChild
                      className="cursor-pointer rounded-lg"
                    >
                      <Link
                        href="/dashboard"
                        className="flex items-center justify-between"
                      >
                        <span>لوحة التحكم</span>
                        <LayoutDashboard className="size-4" />
                      </Link>
                    </DropdownMenuItem>

                    {store?.slug && (
                      <DropdownMenuItem
                        asChild
                        className="cursor-pointer rounded-lg"
                      >
                        <Link
                          href={`/store/${store.slug}`}
                          className="flex items-center justify-between"
                        >
                          <span>عرض المتجر</span>
                          <Store className="size-4" />
                        </Link>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    <form action={LogoutAction}>
                      <button
                        type="submit"
                        className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm outline-none transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <span>تسجيل الخروج</span>
                        <LogOut className="size-4" />
                      </button>
                    </form>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="space-x-1">
                  <Button
                    asChild
                    className="h-11 rounded-lg px-5 text-sm font-bold shadow-md shadow-primary/20 transition-all duration-300 "
                  >
                    <Link href="/register" className="group">
                      ابدأ دلوقتي
                      <Store className="ms-2 size-4 transition-transform duration-300 group-hover:-translate-x-0.5 group-hover:scale-105" />
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant={`outline`}
                    className="h-11 rounded-lg px-5 text-sm transition-all duration-300 "
                  >
                    <Link href="/login" className="group">
                      تسجيل دخول
                      <LogIn className="ms-2 size-4 transition-transform duration-300 " />
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
      </div>
    </header>
  );
};

export default Navbar;
