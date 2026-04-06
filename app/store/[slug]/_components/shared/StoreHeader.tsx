"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import {
  Menu,
  Search,
  ShoppingCart,
  Store,
  Phone,
  Info,
  PackageSearch,
  X,
  LayoutGrid,
  Megaphone,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type StoreFrontHeaderProps = {
  storeName: string;
  storeSlug: string;
  logo?: string | null;
  cartCount?: number;
  announcementText?: string | null;
};

export default function StoreFrontHeader({
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
    const url = q
      ? `/store/${storeSlug}/products?search=${encodeURIComponent(q)}`
      : `/store/${storeSlug}/products`;

    startTransition(() => {
      router.push(url);
    });
  };

  return (
    <>
      <div className="sticky top-0 z-50" dir="rtl">
        {hasAnnouncement && (
          <div className=" bg-primary/10 rounded-bl-md rounded-br-md text-primary">
            <div className="wrapper">
              <div className="relative flex min-h-10 items-center justify-center px-10 py-2">
                <div className="flex items-center gap-2 text-center text-sm font-medium">
                  <Megaphone className="h-4 w-4 shrink-0" />
                  <p className="line-clamp-1">{announcementText}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAnnouncement(false)}
                  className="absolute left-0 inline-flex h-8 w-8 items-center justify-center rounded-md text-primary/80 transition hover:bg-white/10 hover:text-primary"
                  aria-label="إغلاق الإعلان"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        <header className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
          <div className="wrapper">
            <div
              className={cn(
                logo
                  ? "flex h-22 items-center justify-between gap-3 md:gap-4"
                  : "flex h-16 items-center justify-between gap-3 md:gap-4",
              )}
            >
              <Link
                href={`/store/${storeSlug}`}
                className="group flex min-w-0 items-center gap-2"
              >
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden">
                  {logo ? (
                    <Image
                      src={logo}
                      alt={storeName}
                      width={100}
                      height={100}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="rounded-lg bg-primary/15 p-2">
                      <Store className="h-6 w-6 text-primary" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 hidden sm:block">
                  <h1 className="truncate text-base font-bold text-primary md:text-lg">
                    {storeName}
                  </h1>
                </div>
              </Link>

              <div className="hidden flex-1 lg:flex lg:max-w-xl">
                <form onSubmit={handleSearch} className="relative w-full">
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="دور على منتج..."
                    className="h-11 rounded-lg border bg-background pl-12 pr-11 text-sm shadow-none"
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
                    className="absolute left-1 top-1/2 h-9 -translate-y-1/2 rounded-lg px-4"
                    disabled={isPending}
                  >
                    بحث
                  </Button>
                </form>
              </div>

              <nav className="hidden items-center gap-1 lg:flex">
                <Link
                  href={`/store/${storeSlug}/products`}
                  className="rounded-lg px-4 py-2 text-sm font-medium transition hover:bg-muted"
                >
                  كل المنتجات
                </Link>

                <Link
                  href={`/store/${storeSlug}/categories`}
                  className="rounded-lg px-4 py-2 text-sm font-medium transition hover:bg-muted"
                >
                  التصنيفات
                </Link>

                <Link
                  href={`/store/${storeSlug}/about`}
                  className="rounded-lg px-4 py-2 text-sm font-medium transition hover:bg-muted"
                >
                  عن المتجر
                </Link>
              </nav>

              <div className="flex items-center gap-2">
                <Button
                  asChild
                  variant="outline"
                  className="relative h-11 rounded-lg px-4"
                >
                  <Link
                    href={`/store/${storeSlug}/cart`}
                    className="flex items-center gap-2"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span className="hidden sm:inline">العربة</span>

                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white">
                      {cartCount}
                    </span>
                  </Link>
                </Button>

                <div className="lg:hidden">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 rounded-lg"
                      >
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">فتح القائمة</span>
                      </Button>
                    </SheetTrigger>

                    <SheetContent side="right" className="w-85 p-0" dir="rtl">
                      <div className="flex h-full flex-col">
                        <SheetHeader className="border-b px-5 py-4">
                          <SheetTitle className="text-right">القائمة</SheetTitle>
                        </SheetHeader>

                        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
                          <Link
                            href={`/store/${storeSlug}`}
                            className="flex items-center gap-3 rounded-lg border bg-card p-3 transition hover:bg-muted/40"
                          >
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                              {logo ? (
                                <Image
                                  src={logo}
                                  alt={storeName}
                                  width={48}
                                  height={48}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Store className="h-5 w-5 text-primary" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">
                                اهلا بيك في
                              </p>
                              <h3 className="truncate font-bold">{storeName}</h3>
                            </div>
                          </Link>

                          {hasAnnouncement && (
                            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                              <div className="mb-1 flex items-center gap-2 font-semibold text-primary">
                                <Megaphone className="h-4 w-4" />
                                إعلان
                              </div>
                              <p className="leading-6 text-foreground">
                                {announcementText}
                              </p>
                            </div>
                          )}

                          <form onSubmit={handleSearch} className="relative">
                            <Input
                              value={search}
                              onChange={(e) => setSearch(e.target.value)}
                              placeholder="دور على منتج..."
                              className="h-11 rounded-lg pl-12 pr-11"
                            />
                            <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Button
                              type="submit"
                              size="sm"
                              className="absolute left-1 top-1/2 h-9 -translate-y-1/2 rounded-lg px-4"
                              disabled={isPending}
                            >
                              بحث
                            </Button>
                          </form>

                          <Separator />

                          <div className="space-y-2">
                            <SheetClose asChild>
                              <Link
                                href={`/store/${storeSlug}/products`}
                                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition hover:bg-muted"
                              >
                                <PackageSearch className="h-4 w-4 text-primary" />
                                كل المنتجات
                              </Link>
                            </SheetClose>

                            <SheetClose asChild>
                              <Link
                                href={`/store/${storeSlug}/categories`}
                                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition hover:bg-muted"
                              >
                                <LayoutGrid className="h-4 w-4 text-primary" />
                                التصنيفات
                              </Link>
                            </SheetClose>

                            <SheetClose asChild>
                              <Link
                                href={`/store/${storeSlug}/about`}
                                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition hover:bg-muted"
                              >
                                <Info className="h-4 w-4 text-primary" />
                                عن المتجر
                              </Link>
                            </SheetClose>

                            <SheetClose asChild>
                              <Link
                                href={`/store/${storeSlug}/contact`}
                                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition hover:bg-muted"
                              >
                                <Phone className="h-4 w-4 text-primary" />
                                تواصل معنا
                              </Link>
                            </SheetClose>
                          </div>
                        </div>

                        <div className="border-t p-5">
                          <SheetClose asChild>
                            <Button asChild className="h-11 w-full rounded-lg">
                              <Link
                                href={`/store/${storeSlug}/cart`}
                                className="flex items-center justify-center gap-2"
                              >
                                <ShoppingCart className="h-4 w-4" />
                                عرض العربة
                                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-bold text-primary">
                                  {cartCount}
                                </span>
                              </Link>
                            </Button>
                          </SheetClose>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
            </div>

            <div className="pb-3 lg:hidden">
              <form onSubmit={handleSearch} className="relative">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="دور على منتج..."
                  className="h-11 rounded-lg pl-12 pr-11"
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
                  className="absolute left-1 top-1/2 h-9 -translate-y-1/2 rounded-lg px-4"
                  disabled={isPending}
                >
                  بحث
                </Button>
              </form>
            </div>
          </div>
        </header>
      </div>
    </>
  );
}