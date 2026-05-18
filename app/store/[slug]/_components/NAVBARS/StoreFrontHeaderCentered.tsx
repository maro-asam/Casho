"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  Menu,
  Search,
  ShoppingCart,
  LayoutGrid,
  Info,
  Phone,
  X,
  Megaphone,
  House,
  PanelTop,
} from "lucide-react";

import type { StoreFrontHeaderProps } from "../shared/store-header.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetDescription,
} from "@/components/ui/sheet";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/theme/ModeToggle";

const navLinks = (storeSlug: string) => [
  {
    href: buildStoreUrl(storeSlug),
    label: "الرئيسية",
    icon: House,
  },
  {
    href: buildStoreUrl(storeSlug, "products"),
    label: "المنتجات",
    icon: PanelTop,
  },
  {
    href: buildStoreUrl(storeSlug, "categories"),
    label: "التصنيفات",
    icon: LayoutGrid,
  },
  {
    href: buildStoreUrl(storeSlug, "about"),
    label: "عن المتجر",
    icon: Info,
  },
  {
    href: buildStoreUrl(storeSlug, "contact"),
    label: "تواصل معنا",
    icon: Phone,
  },
];

type NavSheetButtonProps = {
  storeSlug: string;
  isOverlay: boolean;
  className?: string;
};

function NavSheetButton({
  storeSlug,
  isOverlay,
  className,
}: NavSheetButtonProps) {
  const links = navLinks(storeSlug);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "h-11 w-11 shrink-0 rounded-full backdrop-blur transition",
            isOverlay
              ? "border-white/30 bg-white/10 text-white hover:bg-white hover:text-black"
              : "border-border bg-background text-foreground hover:bg-muted",
            className,
          )}
          aria-label="فتح القائمة"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-80 p-0" dir="rtl">
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b px-5 py-4 text-right">
            <SheetTitle className="text-right">القائمة</SheetTitle>
            <SheetDescription className="text-right">
              تنقل سريع بين صفحات المتجر
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-2 px-5 py-5">
            {links.map((item) => {
              const Icon = item.icon;

              return (
                <SheetClose asChild key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-sm font-medium transition hover:border-border hover:bg-muted"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>{item.label}</span>
                  </Link>
                </SheetClose>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function StoreFrontHeaderCentered({
  storeName,
  storeSlug,
  logo,
  cartCount = 0,
  announcementText,
}: StoreFrontHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [search, setSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showAnnouncement, setShowAnnouncement] = useState(true);

  const hasAnnouncement = Boolean(announcementText?.trim()) && showAnnouncement;

  const normalizedPathname =
    pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;

  const isHomePage =
    normalizedPathname === "/" ||
    normalizedPathname === `/store/${storeSlug}` ||
    normalizedPathname === `/store/${storeSlug}/`;

  const isOverlay = isHomePage;

  const linkClassName = cn(
    "text-xs font-black uppercase tracking-[0.28em] transition",
    isOverlay
      ? "text-white/90 hover:text-white"
      : "text-foreground/80 hover:text-foreground",
  );

  useEffect(() => {
    if (!isSearchOpen) return;

    const timer = window.setTimeout(() => {
      document.getElementById("store-search")?.focus();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isSearchOpen]);

  const handleSearchToggle = () => {
    setIsSearchOpen((prev) => !prev);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const q = search.trim();
    const params = new URLSearchParams();

    if (q) {
      params.set("search", q);
    }

    const url = buildStoreUrl(
      storeSlug,
      `/products${params.toString() ? `?${params.toString()}` : ""}`,
    );

    startTransition(() => {
      router.push(url);
      setIsSearchOpen(false);
    });
  };

  return (
    <header
      dir="rtl"
      className={cn(
        "inset-x-0 top-0 z-50",
        isOverlay
          ? "absolute text-white"
          : "sticky border-b bg-background text-foreground",
      )}
    >
      {hasAnnouncement && (
        <div
          className={cn(
            isOverlay
              ? "bg-red-600 text-white"
              : "bg-[var(--store-primary)] text-[var(--store-primary-foreground)]",
          )}
        >
          <div className="relative mx-auto flex min-h-10 max-w-screen-2xl items-center justify-center px-12 py-2">
            <div className="flex items-center gap-2 text-center text-[11px] font-black uppercase tracking-[0.35em]">
              <Megaphone className="h-4 w-4" />
              <p className="line-clamp-1">{announcementText}</p>
            </div>

            <button
              type="button"
              onClick={() => setShowAnnouncement(false)}
              className="absolute left-4 inline-flex h-8 w-8 items-center justify-center opacity-80 transition hover:bg-white/10 hover:opacity-100"
              aria-label="إغلاق الإعلان"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div
        className={cn(
          "mx-auto max-w-screen-2xl px-4 py-5 sm:px-8 lg:px-12",
          isOverlay ? "border-b border-white/20" : "border-b border-border",
        )}
      >
        <div className="hidden lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-8">
          <nav className="flex items-center gap-8">
            <Link href={buildStoreUrl(storeSlug)} className={linkClassName}>
              الرئيسية
            </Link>

            <Link
              href={buildStoreUrl(storeSlug, "products")}
              className={linkClassName}
            >
              المنتجات
            </Link>

            <Link
              href={buildStoreUrl(storeSlug, "contact")}
              className={linkClassName}
            >
              تواصل معنا
            </Link>
          </nav>

          <Link
            href={buildStoreUrl(storeSlug)}
            className="flex min-w-0 items-center justify-center"
            aria-label={storeName}
          >
            {logo ? (
              <Image
                src={logo}
                alt={storeName}
                width={140}
                height={64}
                className={cn(
                  "max-h-14 w-auto object-contain",
                  isOverlay && "brightness-0 invert",
                )}
              />
            ) : (
              <span
                className={cn(
                  "text-4xl font-black uppercase tracking-tight",
                  isOverlay ? "text-white" : "text-foreground",
                )}
              >
                {storeName}
              </span>
            )}
          </Link>

          <div className="flex items-center justify-end gap-8">
            <Link
              href={buildStoreUrl(storeSlug, "about")}
              className={linkClassName}
            >
              عن المتجر
            </Link>

            <button
              type="button"
              onClick={handleSearchToggle}
              className={linkClassName}
              aria-expanded={isSearchOpen}
              aria-controls="store-search-form"
            >
              {isSearchOpen ? "إغلاق" : "بحث"}
            </button>

            <Link
              href={buildStoreUrl(storeSlug, "cart")}
              className={linkClassName}
            >
              العربة ({cartCount})
            </Link>

            <div className="flex items-center gap-2">
              <ModeToggle />
              <NavSheetButton storeSlug={storeSlug} isOverlay={isOverlay} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 lg:hidden">
          <NavSheetButton storeSlug={storeSlug} isOverlay={isOverlay} />

          <Link
            href={buildStoreUrl(storeSlug)}
            className="flex min-w-0 items-center justify-center"
            aria-label={storeName}
          >
            {logo ? (
              <Image
                src={logo}
                alt={storeName}
                width={110}
                height={48}
                className={cn(
                  "max-h-12 w-auto object-contain",
                  isOverlay && "brightness-0 invert",
                )}
              />
            ) : (
              <span
                className={cn(
                  "truncate text-2xl font-black uppercase",
                  isOverlay ? "text-white" : "text-foreground",
                )}
              >
                {storeName}
              </span>
            )}
          </Link>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleSearchToggle}
              className={cn(
                "h-11 w-11 rounded-full backdrop-blur",
                isOverlay
                  ? "border-white/30 bg-white/10 text-white hover:bg-white hover:text-black"
                  : "border-border bg-background text-foreground hover:bg-muted",
              )}
              aria-label={isSearchOpen ? "إغلاق البحث" : "فتح البحث"}
              aria-expanded={isSearchOpen}
              aria-controls="store-search-form"
            >
              {isSearchOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>

            <Button
              asChild
              variant="outline"
              className={cn(
                "h-11 rounded-full px-3 backdrop-blur",
                isOverlay
                  ? "border-white/30 bg-white/10 text-white hover:bg-white hover:text-black"
                  : "border-border bg-background text-foreground hover:bg-muted",
              )}
            >
              <Link
                href={buildStoreUrl(storeSlug, "cart")}
                className="flex items-center gap-2"
                aria-label="العربة"
              >
                <ShoppingCart className="h-4 w-4" />
                <span
                  className={cn(
                    "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-black",
                    isOverlay
                      ? "bg-white text-black"
                      : "bg-primary text-primary-foreground",
                  )}
                >
                  {cartCount}
                </span>
              </Link>
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "grid transition-all duration-300 ease-out",
            isSearchOpen
              ? "grid-rows-[1fr] opacity-100 translate-y-0"
              : "grid-rows-[0fr] opacity-0 -translate-y-2",
          )}
        >
          <form
            id="store-search-form"
            onSubmit={handleSearch}
            className="mx-auto mt-4 w-full max-w-md overflow-hidden"
          >
            <div className="relative">
              <Input
                id="store-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن منتج..."
                className={cn(
                  "h-11 rounded-full pl-12 pr-11 backdrop-blur lg:rounded-sm",
                  isOverlay
                    ? "border-white/30 focus:ring-0  text-white placeholder:text-white/60 "
                    : "border-border focus:ring-0  text-foreground placeholder:text-muted-foreground",
                )}
              />

              <Search
                className={cn(
                  "pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2",
                  isOverlay ? "text-white/70" : "text-muted-foreground",
                )}
              />

              <Button
                type="submit"
                size="sm"
                className={cn(
                  "absolute left-1 top-1/2 h-9 -translate-y-1/2 rounded-full px-4 font-black lg:rounded-sm",
                  isOverlay
                    ? "bg-white text-black hover:bg-white/90"
                    : "bg-primary text-primary-foreground",
                )}
                disabled={isPending}
              >
                بحث
              </Button>
            </div>
          </form>
        </div>
      </div>
    </header>
  );
}
