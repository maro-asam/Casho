import Link from "next/link";
import { ChevronDown, LogIn, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/actions/auth/auth-helpers.actions";
import { LogoutAction } from "@/actions/auth/logout.actions";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MobileHeaderMenu from "./MobileHeaderMenu";
import Image from "next/image";
import { ModeToggle } from "@/theme/ModeToggle";

const links = [
  { name: "الرئيسية", href: "/" },
  { name: "المميزات", href: "#features" },
  { name: "الأسعار", href: "#pricing" },
  { name: "الأسئلة", href: "#faq" },
];

const Header = async () => {
  const user = await getCurrentUser();

  const storeName = user?.stores?.[0]?.name;
  const storeSlug = user?.stores?.[0]?.slug;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="flex items-center justify-between p-6">
        <Link href="/" className="flex items-center gap-3 text-3xl font-black">
          {/* <div className="flex items-center justify-center rounded-22xl bg-primary/10 p-3 text-primary">
            <Store className="h-7 w-7" />
          </div> */}
          <Image
            src={`/logo.svg`}
            alt={storeName || "كاشو"}
            width={45}
            height={45}
            className="rounded-md"
          />
          <div>
            <span className="text-primary ">C</span>ASHO
          </div>
        </Link>

        <ModeToggle />

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-medium transition hover:text-primary"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {!user ? (
            <>
              <Button className="rounded-xl" asChild>
                <Link href="/register" className="flex items-center gap-2">
                  ابدأ متجرك دلوقتي <Store />
                </Link>
              </Button>

              <Button className="rounded-xl" variant="outline" asChild>
                <Link href="/login" className="flex items-center gap-2">
                  تسجيل الدخول <LogIn />
                </Link>
              </Button>
            </>
          ) : (
            <DropdownMenu dir="rtl" modal={false}>
              <DropdownMenuTrigger asChild className="w-full">
                <Button variant="outline" className="rounded-xl">
                  {storeName || user.email} <ChevronDown />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold">
                    {storeName || "الحساب"}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link href="/dashboard">لوحة التحكم</Link>
                </DropdownMenuItem>

                {storeSlug && (
                  <DropdownMenuItem asChild>
                    <Link href={`/store/${storeSlug}`}>عرض المتجر</Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild variant="destructive">
                  <form action={LogoutAction}>
                    <button type="submit">تسجيل الخروج</button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <MobileHeaderMenu user={user} links={links} />
      </div>
    </header>
  );
};

export default Header;
