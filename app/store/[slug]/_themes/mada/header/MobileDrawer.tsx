"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, Heart, Mail, Menu, MessageCircle, Search, X } from "lucide-react";
import { Dialog } from "radix-ui";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { StoreShell } from "../../types";
import { getSocialLinks, whatsappHref } from "../../shared/social";
import { isActivePath } from "../../shared/store-path";
import { openWishlist } from "../lib/events";
import { Arrow, MD_PORTAL, PlateImage, btn, num } from "../ui";
import { StoreMark, ThemeToggle } from "./parts";

/** Phones/tablets: a start-side drawer — search entry, category tiles,
 *  shopping paths, a promo card and ways to reach the store. */
export default function MobileDrawer({ shell, path, onSearch }: { shell: StoreShell; path: string; onSearch: () => void }) {
  const [open, setOpen] = useState(false);
  const url = (p: string) => buildStoreUrl(shell.slug, p === "/" ? "" : p);
  const wa = whatsappHref(shell.contact.whatsapp);
  const socials = getSocialLinks(shell.contact);

  const links = [
    { href: "/", label: "الرئيسية" },
    { href: "/products", label: "كل المنتجات" },
    { href: "/categories", label: "التصنيفات" },
    { href: "/about", label: "عن المتجر" },
    { href: "/contact", label: "تواصل معنا" },
  ];

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className={btn({ variant: "ghost", icon: true, className: "-ms-2.5" })} aria-label="فتح القائمة">
        <Menu />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="md-scrim fixed inset-0 z-50 bg-[rgb(12_17_15/0.5)]" />
        <Dialog.Content
          dir={shell.dir}
          aria-describedby={undefined}
          className={cn(MD_PORTAL, "md-drawer md-drawer--start fixed inset-y-0 start-0 z-50 flex w-[min(92vw,24rem)] flex-col bg-(--md-bg) outline-none")}
        >
          <div className="flex h-16 shrink-0 items-center justify-between gap-3 px-4">
            <Dialog.Title asChild>
              <div className="min-w-0">
                <StoreMark shell={shell} />
              </div>
            </Dialog.Title>
            <Dialog.Close className={btn({ variant: "ghost", icon: true, className: "-me-2" })} aria-label="إغلاق القائمة">
              <X />
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onSearch();
              }}
              className="flex h-12 w-full items-center gap-3 rounded-full border border-(--md-line) bg-(--md-surface) px-4 text-start text-[0.9375rem] text-(--md-quiet)"
            >
              <Search className="size-[1.125rem]" />
              ابحث عن منتج…
            </button>

            {shell.categories.length > 0 && (
              <section className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">تسوّق حسب التصنيف</h2>
                  <Dialog.Close asChild>
                    <Link href={url("/categories")} className="inline-flex min-h-10 items-center gap-1 text-xs font-semibold text-(--md-brand)">
                      الكل
                      <ChevronLeft className="size-3.5 ltr:rotate-180" />
                    </Link>
                  </Dialog.Close>
                </div>
                <ul className="md-stagger grid grid-cols-2 gap-2.5">
                  {shell.categories.slice(0, 8).map((c, i) => (
                    <li key={c.id} style={{ "--i": i } as React.CSSProperties}>
                      <Dialog.Close asChild>
                        <Link
                          href={url(`/categories/${c.slug}`)}
                          aria-current={isActivePath(path, `/categories/${c.slug}`) ? "page" : undefined}
                          className="group block rounded-2xl bg-(--md-surface) p-2 aria-[current=page]:ring-2 aria-[current=page]:ring-(--md-brand)"
                        >
                          <span className="md-media block aspect-[4/3] rounded-xl">
                            <PlateImage src={c.image} sizes="45vw" />
                          </span>
                          <span className="mt-2 flex items-center justify-between gap-2 px-1">
                            <span className="truncate text-sm font-medium">{c.name}</span>
                            <span className="text-[0.6875rem] text-(--md-quiet)">{num(c.productCount)}</span>
                          </span>
                        </Link>
                      </Dialog.Close>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <nav aria-label="القائمة الرئيسية" className="mt-6">
              <ul className="divide-y divide-(--md-line) rounded-2xl bg-(--md-surface) px-4">
                {links.map((l) => (
                  <li key={l.href}>
                    <Dialog.Close asChild>
                      <Link
                        href={url(l.href)}
                        aria-current={isActivePath(path, l.href) ? "page" : undefined}
                        className="flex min-h-13 items-center justify-between text-[0.9375rem] font-medium aria-[current=page]:text-(--md-brand)"
                      >
                        {l.label}
                        <ChevronLeft className="size-4 text-(--md-quiet) ltr:rotate-180" />
                      </Link>
                    </Dialog.Close>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      openWishlist();
                    }}
                    className="flex min-h-13 w-full items-center justify-between text-[0.9375rem] font-medium"
                  >
                    <span className="flex items-center gap-2">
                      <Heart className="size-4" />
                      المفضلة
                    </span>
                    <ChevronLeft className="size-4 text-(--md-quiet) ltr:rotate-180" />
                  </button>
                </li>
              </ul>
            </nav>

            {shell.banner && (
              <Dialog.Close asChild>
                <Link href={url("/products")} className="group relative mt-6 block aspect-[16/9] overflow-hidden rounded-(--md-radius)">
                  <Image src={shell.banner.image} alt="" fill sizes="90vw" className="object-cover" />
                  <span className="absolute inset-0 bg-[linear-gradient(to_top,rgb(12_17_15/0.75),transparent_65%)]" />
                  <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 text-white">
                    <span className="md-face line-clamp-2 text-base font-bold">{shell.banner.title}</span>
                    <Arrow className="mb-1" />
                  </span>
                </Link>
              </Dialog.Close>
            )}

            {(wa || shell.contact.email || socials.length > 0) && (
              <section className="mt-6 space-y-1">
                {wa && (
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center gap-3 text-sm">
                    <MessageCircle className="size-5 text-(--md-quiet)" />
                    كلّمنا على واتساب
                  </a>
                )}
                {shell.contact.email && (
                  <a href={`mailto:${shell.contact.email}`} className="flex min-h-12 items-center gap-3 text-sm">
                    <Mail className="size-5 text-(--md-quiet)" />
                    <span dir="ltr" className="truncate">{shell.contact.email}</span>
                  </a>
                )}
                {socials.length > 0 && (
                  <ul className="flex gap-2 pt-2">
                    {socials.map(({ label, href, Icon }) => (
                      <li key={label}>
                        <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid size-11 place-items-center rounded-full bg-(--md-surface) [&_svg]:size-5">
                          <Icon aria-hidden />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>

          <div className="flex shrink-0 items-center justify-between border-t border-(--md-line) px-4 py-2" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
            <span className="text-xs text-(--md-quiet)">الوضع الليلي</span>
            <ThemeToggle />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
