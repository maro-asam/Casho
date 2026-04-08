"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Menu, Search, ShoppingCart, Store, X } from "lucide-react";
import { useRouter } from "next/navigation";

import type { StoreFrontHeaderProps } from "./store-header.types";
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

export default function StoreFrontHeaderCompact({
  storeName,
  storeSlug,
  logo,
  cartCount = 0,
}: StoreFrontHeaderProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

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
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur" dir="rtl">
      <div className="wrapper py-3">
        <div className="flex items-center gap-3">
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-11 w-11">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>

              <SheetContent side="right" className="w-80 p-0" dir="rtl">
                <div className="flex h-full flex-col">
                  <SheetHeader className="border-b px-5 py-4">
                    <SheetTitle className="text-right">{storeName}</SheetTitle>
                  </SheetHeader>

                  <div className="space-y-2 px-5 py-5">
                    <SheetClose asChild>
                      <Link href={`/store/${storeSlug}`} className="block rounded-lg px-3 py-3 hover:bg-muted">
                        الرئيسية
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href={`/store/${storeSlug}/products`} className="block rounded-lg px-3 py-3 hover:bg-muted">
                        كل المنتجات
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href={`/store/${storeSlug}/categories`} className="block rounded-lg px-3 py-3 hover:bg-muted">
                        التصنيفات
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href={`/store/${storeSlug}/about`} className="block rounded-lg px-3 py-3 hover:bg-muted">
                        عن المتجر
                      </Link>
                    </SheetClose>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <Link href={`/store/${storeSlug}`} className="flex min-w-0 items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden">
              {logo ? (
                <Image
                  src={logo}
                  alt={storeName}
                  width={44}
                  height={44}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Store className="h-4 w-4 text-primary" />
                </div>
              )}
            </div>
            <span className="truncate text-sm font-bold md:text-base">{storeName}</span>
          </Link>

          <form onSubmit={handleSearch} className="relative mr-auto hidden max-w-xl flex-1 md:block">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث..."
              className="h-11 pl-12 pr-11"
            />
            <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            {search.length > 0 && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute left-20 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            <Button
              type="submit"
              size="sm"
              className="absolute left-1 top-1/2 h-9 -translate-y-1/2 px-4"
              disabled={isPending}
            >
              بحث
            </Button>
          </form>

          <nav className="hidden items-center gap-1 xl:flex">
            <Link href={`/store/${storeSlug}/products`} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">
              المنتجات
            </Link>
            <Link href={`/store/${storeSlug}/categories`} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">
              التصنيفات
            </Link>
            <Link href={`/store/${storeSlug}/about`} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">
              عن المتجر
            </Link>
          </nav>

          <Button asChild variant="outline" className="h-11 px-3">
            <Link href={`/store/${storeSlug}/cart`} className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">العربة</span>
              <span className="inline-flex min-w-5 items-center justify-center rounded-lg bg-primary px-1.5 text-[11px] font-bold text-white">
                {cartCount}
              </span>
            </Link>
          </Button>
        </div>

        <form onSubmit={handleSearch} className="relative mt-3 md:hidden">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث..."
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
    </header>
  );
}