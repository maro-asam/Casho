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
} from "@/components/ui/sheet";

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
    startTransition(() => {
      router.push(
        q
          ? `/store/${storeSlug}/products?search=${encodeURIComponent(q)}`
          : `/store/${storeSlug}/products`,
      );
    });
  };

  return (
    <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur" dir="rtl">
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
        <div className="hidden lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-6">
          <nav className="flex items-center gap-1">
            <Link
              href={`/store/${storeSlug}`}
              className="rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-muted"
            >
              الرئيسية
            </Link>
            <Link
              href={`/store/${storeSlug}/products`}
              className="rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-muted"
            >
              المنتجات
            </Link>
            <Link
              href={`/store/${storeSlug}/categories`}
              className="rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-muted"
            >
              التصنيفات
            </Link>
          </nav>

          <Link
            href={`/store/${storeSlug}`}
            className="flex items-center justify-center gap-3"
          >
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden">
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
              <p className="text-base font-extrabold">{storeName}</p>
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

            <Button asChild variant="outline" className="h-11 px-4">
              <Link href={`/store/${storeSlug}/cart`} className="flex items-center gap-2">
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
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-11 w-11">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-80 p-0" dir="rtl">
              <div className="flex h-full flex-col">
                <SheetHeader className="border-b px-5 py-4">
                  <SheetTitle className="text-right">القائمة</SheetTitle>
                </SheetHeader>

                <div className="space-y-2 px-5 py-5">
                  <SheetClose asChild>
                    <Link href={`/store/${storeSlug}`} className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-muted">
                      <Store className="h-4 w-4 text-primary" />
                      الرئيسية
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href={`/store/${storeSlug}/products`} className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-muted">
                      <Search className="h-4 w-4 text-primary" />
                      المنتجات
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href={`/store/${storeSlug}/categories`} className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-muted">
                      <LayoutGrid className="h-4 w-4 text-primary" />
                      التصنيفات
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href={`/store/${storeSlug}/about`} className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-muted">
                      <Info className="h-4 w-4 text-primary" />
                      عن المتجر
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href={`/store/${storeSlug}/contact`} className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-muted">
                      <Phone className="h-4 w-4 text-primary" />
                      تواصل معنا
                    </Link>
                  </SheetClose>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Link href={`/store/${storeSlug}`} className="flex min-w-0 items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden">
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

          <Button asChild variant="outline" className="h-11 px-3">
            <Link href={`/store/${storeSlug}/cart`} className="flex items-center gap-2">
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