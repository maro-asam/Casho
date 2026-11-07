"use client";

import { useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LayoutGrid, Link2, LogOut, Moon, Sun, Users, Wallet, type LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { LogoutAction } from "@/actions/auth/logout.actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/sales", label: "الرئيسية", icon: LayoutGrid },
  { href: "/sales/customers", label: "عملائي", icon: Users },
  { href: "/sales/commissions", label: "عمولاتي", icon: Wallet },
];

function useActiveTab() {
  const pathname = usePathname();
  return (href: string) => (href === "/sales" ? pathname === href : pathname.startsWith(href));
}

const initialOf = (name: string) => name.trim().slice(0, 1).toUpperCase() || "#";

/** The rep's monogram — the same brand-tinted tile the merchant sidebar gives a store. */
export function RepAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full bg-linear-to-b from-primary/80 to-primary text-[15px] font-bold text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,.3)]",
        className,
      )}
    >
      {initialOf(name)}
    </span>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="تبديل الوضع الداكن"
      className="apple-press relative grid size-10 place-items-center rounded-full text-foreground/80 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Sun className="size-[18px] scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute size-[18px] scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0" />
    </button>
  );
}

/** Tapping your name opens the account menu (macOS account-switcher style). */
function AccountMenu({ name, email, referralLink }: { name: string; email: string; referralLink: string }) {
  const [isLoggingOut, startLogout] = useTransition();

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success("اتنسخ رابط الإحالة");
    } catch {
      toast.error("مقدرناش ننسخ — انسخه يدويًا");
    }
  }

  return (
    <DropdownMenu dir="rtl" modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="قائمة الحساب"
          className="apple-press flex min-w-0 items-center gap-2.5 rounded-full py-1 ps-1 pe-3 text-start hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-muted"
        >
          <RepAvatar name={name} />
          <span className="min-w-0 leading-tight">
            <span className="block max-w-[11rem] truncate text-[15px] font-semibold sm:max-w-[14rem]">{name}</span>
            <span className="block text-[11px] text-muted-foreground">فريق مبيعات كاشو</span>
          </span>
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={2.4} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={10} className="w-64 rounded-2xl p-1.5">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p dir="ltr" className="truncate text-right text-xs text-muted-foreground">
            {email}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={copyLink}>
          <Link2 />
          نسخ رابط الإحالة
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* Not a <form>: the menu unmounts on select, which would cancel the submit. */}
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

/** Floating glass bar: who you are (leading), where you are (center, desktop), appearance (trailing). */
export function SalesTopbar({ name, email, referralLink }: { name: string; email: string; referralLink: string }) {
  const isActive = useActiveTab();
  return (
    <div className="sticky top-0 z-30 px-3 pt-3 sm:px-5">
      {/* Scroll edge effect: content softens as it slides under the bar. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-background/80 to-transparent backdrop-blur-md mask-[linear-gradient(to_bottom,black_40%,transparent)]"
      />
      <header className="apple-glass relative mx-auto flex h-14 max-w-7xl items-center gap-2 rounded-full px-1.5 md:grid md:grid-cols-[1fr_auto_1fr]">
        <div className="min-w-0 flex-1">
          <AccountMenu name={name} email={email} referralLink={referralLink} />
        </div>

        <nav aria-label="أقسام المبيعات" className="hidden md:block">
          <ul className="flex items-center gap-0.5 rounded-full bg-(--sys-gray)/14 p-[3px]">
            {TABS.map((tab) => {
              const active = isActive(tab.href);
              return (
                <li key={tab.href}>
                  <Link
                    href={tab.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-8 items-center rounded-full px-4 text-[14px] transition-[background-color,color,box-shadow] duration-200 ease-(--ease-apple) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active
                        ? "bg-card font-semibold text-foreground shadow-[0_3px_8px_rgba(0,0,0,0.12),0_1px_1px_rgba(0,0,0,0.04)]"
                        : "text-foreground/70 hover:text-foreground",
                    )}
                  >
                    {tab.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center justify-end">
          <ThemeToggle />
        </div>
      </header>
    </div>
  );
}

/** Phones: a floating glass tab bar, icons monochrome, the current tab tinted. */
export function SalesTabBar() {
  const isActive = useActiveTab();
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 h-28 bg-linear-to-t from-background/85 to-transparent md:hidden"
      />
      <nav
        aria-label="أقسام المبيعات"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(14px,env(safe-area-inset-bottom))] md:hidden"
      >
        <ul className="apple-glass pointer-events-auto flex items-center gap-1 rounded-full p-1.5">
          {TABS.map((tab) => {
            const active = isActive(tab.href);
            const Icon = tab.icon;
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "apple-press flex h-[52px] w-[84px] flex-col items-center justify-center gap-0.5 rounded-full text-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active ? "bg-(--fill-3) font-semibold text-primary" : "text-foreground/70",
                  )}
                >
                  <Icon className="size-[22px]" strokeWidth={active ? 2.2 : 1.8} />
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
