"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import {
  Menu,
  Search,
  ShoppingCart,
  Store,
  LayoutGrid,
  Info,
  Phone,
  X,
  Megaphone,
  House,
  PanelTop,
} from "lucide-react";
import { useRouter } from "next/navigation";

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
  className?: string;
};

function NavSheetButton({ storeSlug, className }: NavSheetButtonProps) {
  const links = navLinks(storeSlug);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn("h-11 w-11 shrink-0 rounded-xl", className)}
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
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showAnnouncement, setShowAnnouncement] = useState(true);

  const hasAnnouncement = Boolean(announcementText?.trim()) && showAnnouncement;

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
    });
  };

  return (
    <div
      className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur"
      dir="rtl"
    >
      {hasAnnouncement && (
        <div className="bg-primary/10 text-primary">
          <div className="wrapper">
            <div className="relative flex min-h-10 items-center justify-center px-10 py-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Megaphone className="h-4 w-4" />
                <p className="line-clamp-1">{announcementText}</p>
              </div>

              <button
                type="button"
                onClick={() => setShowAnnouncement(false)}
                className="absolute left-0 inline-flex h-8 w-8 items-center justify-center rounded-xl text-primary/80 transition hover:bg-white/10 hover:text-primary"
                aria-label="إغلاق الإعلان"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="wrapper py-3">
        <div className="hidden lg:grid lg:grid-cols-[auto_1fr_auto] lg:items-center lg:gap-4">
          <div className="flex items-center gap-2">
            <NavSheetButton storeSlug={storeSlug} />
            <ModeToggle />
          </div>

          <Link
            href={buildStoreUrl(storeSlug)}
            className="flex min-w-0 items-center justify-center gap-3"
          >
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl">
              {logo ? (
                <Image
                  src={logo}
                  alt={storeName}
                  width={56}
                  height={56}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Store className="h-5 w-5 text-primary" />
                </div>
              )}
            </div>

            <div className="text-center">
              <p className="truncate text-base font-extrabold">{storeName}</p>
            </div>
          </Link>

          <div className="flex items-center justify-end gap-2">
            <form onSubmit={handleSearch} className="relative w-full max-w-sm">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن منتج..."
                className="h-11 pl-12 pr-11"
              />
              <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </form>

            <Button asChild variant="outline" className="h-11 px-4 rounded-xl">
              <Link
                href={buildStoreUrl(storeSlug, "cart")}
                className="flex items-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>العربة</span>
                <span className="inline-flex min-w-5 items-center justify-center rounded-xl bg-primary px-1.5 text-[11px] font-bold text-white">
                  {cartCount}
                </span>
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 lg:hidden">
          <NavSheetButton storeSlug={storeSlug} />

          <Link
            href={buildStoreUrl(storeSlug)}
            className="flex min-w-0 items-center gap-2"
          >
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl">
              {logo ? (
                <Image
                  src={logo}
                  alt={storeName}
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Store className="h-4 w-4 text-primary" />
                </div>
              )}
            </div>
            <span className="truncate font-bold">{storeName}</span>
          </Link>

          <Button asChild variant="outline" className="h-11 px-3 rounded-xl">
            <Link
              href={buildStoreUrl(storeSlug, "cart")}
              className="flex items-center gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="inline-flex min-w-5 items-center justify-center rounded-xl bg-primary px-1.5 text-[11px] font-bold text-white">
                {cartCount}
              </span>
            </Link>
          </Button>
        </div>

        <div className="mt-3 lg:hidden">
          <form onSubmit={handleSearch} className="relative">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن منتج..."
              className="h-11 pl-12 pr-11"
            />
            <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Button
              type="submit"
              size="sm"
              className="absolute left-1 top-1/2 h-9 -translate-y-1/2 px-4"
              disabled={isPending}
            >
              بحث
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}