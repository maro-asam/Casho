"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition, useEffect, useRef } from "react";
import {
  Search,
  ShoppingBag,
  Store,
  X,
  Menu,
  ChevronDown,
  LayoutGrid,
  PackageSearch,
  Info,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { useRouter } from "next/navigation";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { StoreFrontHeaderProps } from "../shared/store-header.types";

export default function StoreFrontHeaderAllaia({
  storeName,
  storeSlug,
  logo,
  logoRadius = 8,
  logoSize = 80,
  cartCount = 0,
  announcementText,
}: StoreFrontHeaderProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const hasAnnouncement = Boolean(announcementText?.trim()) && showAnnouncement;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    const params = new URLSearchParams();
    if (q) params.set("search", q);
    const url = buildStoreUrl(
      storeSlug,
      `/products${params.toString() ? `?${params}` : ""}`,
    );
    setSearchOpen(false);
    startTransition(() => router.push(url));
  }

  const navLinks = [
    { label: "الرئيسية", href: buildStoreUrl(storeSlug) },
    { label: "المنتجات", href: buildStoreUrl(storeSlug, "/products") },
    { label: "التصنيفات", href: buildStoreUrl(storeSlug, "/categories") },
    { label: "عن المتجر", href: buildStoreUrl(storeSlug, "/about") },
  ];

  return (
    <div className="sticky top-0 z-50 w-full" dir="rtl">
      {/* ── Announcement bar ── */}
      {hasAnnouncement && (
        <div className="relative flex h-9 items-center justify-center bg-black px-10 text-center">
          <p className="text-xs font-medium tracking-wide text-white/80">
            {announcementText}
          </p>
          <button
            onClick={() => setShowAnnouncement(false)}
            className="absolute left-4 text-white/50 transition hover:text-white"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* ── Main navbar ── */}
      <header
        className="border-b bg-background transition-shadow duration-300"
        style={{
          borderColor: "#e8e8e8",
          boxShadow: scrolled ? "0 2px 12px rgba(0,0,0,.06)" : "none",
        }}
      >
        <div className="mx-auto flex h-16 max-w-screen-2xl items-center gap-4 px-5 md:px-8">
          {/* ── Right side: nav links (desktop) + hamburger (mobile) ── */}
          <div className="flex flex-1 items-center gap-0">
            {/* Mobile hamburger */}
            <div className="lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <button className="flex size-10 items-center justify-center rounded-full transition hover:bg-gray-100">
                    <Menu className="size-5" />
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 p-0" dir="rtl">
                  <div className="flex h-full flex-col">
                    <SheetHeader
                      className="border-b px-5 py-4"
                      style={{ borderColor: "#e8e8e8" }}
                    >
                      <SheetTitle className="text-right text-sm font-medium">
                        القائمة
                      </SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto">
                      {navLinks.map((link) => (
                        <SheetClose key={link.label} asChild>
                          <Link
                            href={link.href}
                            className="flex items-center gap-3 border-b px-5 py-4 text-sm font-medium transition hover:bg-gray-50"
                            style={{ borderColor: "#f0f0f0" }}
                          >
                            {link.label}
                          </Link>
                        </SheetClose>
                      ))}
                    </div>
                    <div
                      className="border-t p-4"
                      style={{ borderColor: "#e8e8e8" }}
                    >
                      <SheetClose asChild>
                        <Link
                          href={buildStoreUrl(storeSlug, "/cart")}
                          className="flex h-11 w-full items-center justify-center gap-2 rounded-sm bg-black text-sm font-semibold text-white transition hover:bg-black/80"
                        >
                          <ShoppingBag className="size-4" />
                          العربة
                          {cartCount > 0 && (
                            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold ">
                              {cartCount}
                            </span>
                          )}
                        </Link>
                      </SheetClose>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop nav links */}
            <nav className="hidden items-center lg:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="relative px-4 py-5 text-sm font-medium text-gray-600 transition hover:text-black after:absolute after:bottom-0 after:left-4 after:right-4 after:h-0.5 after:scale-x-0 after:bg-black after:transition-transform hover:after:scale-x-100"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* ── Center: Logo ── */}
          <Link
            href={buildStoreUrl(storeSlug)}
            className="flex shrink-0 flex-col items-center gap-1"
          >
            {logo ? (
              <div className="overflow-hidden" style={{ height: logoSize ?? 80, width: logoSize ?? 80, borderRadius: `${logoRadius ?? 8}px` }}>
                <Image
                  src={logo}
                  alt={storeName}
                  width={logoSize ?? 80}
                  height={logoSize ?? 80}
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Store className="size-5 text-black" />
                <span className="text-lg font-bold tracking-tight text-black">
                  {storeName}
                </span>
              </div>
            )}
          </Link>

          {/* ── Left side: search + cart ── */}
          <div className="flex flex-1 items-center justify-end gap-1">
            {/* Search toggle */}
            <button
              onClick={() => setSearchOpen((v) => !v)}
              className="flex size-10 items-center justify-center rounded-full transition hover:bg-gray-100"
              aria-label="بحث"
            >
              {searchOpen ? (
                <X className="size-5" />
              ) : (
                <Search className="size-5" />
              )}
            </button>

            {/* Cart */}
            <Link
              href={buildStoreUrl(storeSlug, "/cart")}
              className="relative flex size-10 items-center justify-center rounded-full transition hover:bg-gray-100"
              aria-label="العربة"
            >
              <ShoppingBag className="size-5" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-black text-[9px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* ── Expanding search bar ── */}
        <div
          className="overflow-hidden transition-all duration-300"
          style={{ maxHeight: searchOpen ? 64 : 0 }}
        >
          <div
            className="border-t px-5 py-3 md:px-8"
            style={{ borderColor: "#e8e8e8", background: "#fafafa" }}
          >
            <form
              onSubmit={handleSearch}
              className="mx-auto flex max-w-lg items-center gap-3"
            >
              <Search className="size-4 shrink-0 text-gray-400" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`ابحث في ${storeName}...`}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-gray-400 transition hover:text-black"
                >
                  <X className="size-4" />
                </button>
              )}
              <button
                type="submit"
                disabled={isPending}
                className="rounded-sm bg-black px-5 py-2 text-xs font-semibold text-white transition hover:bg-black/80 disabled:opacity-50"
              >
                بحث
              </button>
            </form>
          </div>
        </div>
      </header>
    </div>
  );
}
