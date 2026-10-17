"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, LayoutGrid, Mail, Menu, MessageCircle, X } from "lucide-react";
import { Dialog } from "radix-ui";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { StoreShell } from "../../types";
import { BannerImage, BannerLink } from "../../shared/banner";
import { getSocialLinks, whatsappHref } from "../../shared/social";
import { isActivePath } from "../../shared/store-path";
import { Chevron, MX_PORTAL, num, stagger } from "../ui";
import StoreMark from "./StoreMark";

const ROW = "flex min-h-12 w-full items-center justify-between gap-3 rounded-(--mx-r-sm) px-3 text-[0.9375rem] font-semibold text-(--mx-ink) transition-colors hover:bg-(--mx-band) aria-[current=page]:text-(--mx-link)";

/** Maximize's drawer menu: the blue "Menu" button on desktop, the hamburger
 *  on phones. Opens from the reading start with the shop paths, every
 *  category with its photo and product count, and ways to reach the store. */
export default function DrawerMenu({ shell, path, variant }: { shell: StoreShell; path: string; variant: "button" | "icon" }) {
  const [open, setOpen] = useState(false);
  const url = (p: string) => buildStoreUrl(shell.slug, p === "/" ? "" : p);
  const wa = whatsappHref(shell.contact.whatsapp);
  const socials = getSocialLinks(shell.contact);
  const close = () => setOpen(false);

  const links = [
    { href: "/", label: "الرئيسية" },
    { href: "/products", label: "كل المنتجات" },
    { href: "/products?sort=newest", label: "وصل حديثًا" },
    { href: "/products?featured=true", label: "اختيارات المتجر" },
    { href: "/about", label: "عن المتجر" },
    { href: "/contact", label: "تواصل معنا" },
  ];

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {variant === "button" ? (
        <Dialog.Trigger className={cn("mx-btn mx-btn--solid h-11 gap-2.5 px-4 text-[0.9375rem]")}>
          <Menu />
          القائمة
        </Dialog.Trigger>
      ) : (
        <Dialog.Trigger className="mx-icon -ms-2" aria-label="فتح القائمة">
          <Menu />
        </Dialog.Trigger>
      )}
      <Dialog.Portal>
        <Dialog.Overlay className="mx-scrim fixed inset-0 z-50 bg-[rgb(16_15_15/0.5)]" />
        <Dialog.Content
          dir={shell.dir}
          aria-describedby={undefined}
          className={cn(MX_PORTAL, "mx-drawer mx-drawer--start fixed inset-y-0 start-0 z-50 flex w-[min(90vw,24rem)] flex-col bg-(--mx-surface) outline-none")}
        >
          <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-(--mx-line) px-4">
            <Dialog.Title asChild>
              <div className="min-w-0">
                <StoreMark shell={shell} onClick={close} />
              </div>
            </Dialog.Title>
            <Dialog.Close className="mx-icon -me-2" aria-label="إغلاق القائمة">
              <X />
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain px-2 pb-6 pt-3">
            <nav aria-label="القائمة الرئيسية">
              <ul className="mx-stagger">
                {links.map((l, i) => (
                  <li key={l.href} style={stagger(i)}>
                    <Link href={url(l.href)} onClick={close} aria-current={!l.href.includes("?") && isActivePath(path, l.href) ? "page" : undefined} className={ROW}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {shell.categories.length > 0 && (
              <section className="mt-4 border-t border-(--mx-line) pt-4">
                <h2 className="flex items-center gap-2 px-3 pb-2 text-xs font-semibold text-(--mx-quiet)">
                  <LayoutGrid className="size-3.5" />
                  التصنيفات
                </h2>
                <ul>
                  {shell.categories.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={url(`/categories/${c.slug}`)}
                        onClick={close}
                        aria-current={isActivePath(path, `/categories/${c.slug}`) ? "page" : undefined}
                        className="flex min-h-12 items-center gap-3 rounded-(--mx-r-sm) px-3 text-[0.9375rem] text-(--mx-ink) transition-colors hover:bg-(--mx-band) aria-[current=page]:font-semibold aria-[current=page]:text-(--mx-link)"
                      >
                        <span className="relative size-9 shrink-0 overflow-hidden rounded-(--mx-r-sm) bg-(--mx-plate)">
                          {c.image && <Image src={c.image} alt="" fill sizes="36px" className="object-cover" />}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{c.name}</span>
                        <span className="text-xs tabular-nums text-(--mx-quiet)">{num(c.productCount)}</span>
                        <ChevronLeft aria-hidden className="size-4 shrink-0 text-(--mx-quiet) ltr:rotate-180" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {shell.banner && (
              <BannerLink banner={shell.banner} storeSlug={shell.slug} onClick={close} className="group relative mx-2 mt-5 block aspect-[16/9] overflow-hidden rounded-(--mx-r-lg) bg-(--mx-dark)">
                <BannerImage banner={shell.banner} sizes="22rem" className="mx-zoom-img object-cover" />
                <span aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgb(16_15_15/0.7),transparent_60%)]" />
                <span className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <span className="mx-display line-clamp-1 block text-white">{shell.banner.title}</span>
                  {shell.banner.link && (
                    <span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold">
                      {shell.banner.cta}
                      <Chevron />
                    </span>
                  )}
                </span>
              </BannerLink>
            )}
          </div>

          {(wa || shell.contact.email || socials.length > 0) && (
            <div className="shrink-0 space-y-1 border-t border-(--mx-line) px-4 py-3" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center gap-3 text-sm text-(--mx-ink)">
                  <MessageCircle className="size-[1.125rem] text-(--mx-link)" />
                  كلّمنا على واتساب
                </a>
              )}
              {shell.contact.email && (
                <a href={`mailto:${shell.contact.email}`} className="flex min-h-11 items-center gap-3 text-sm text-(--mx-ink)">
                  <Mail className="size-[1.125rem] text-(--mx-link)" />
                  <span dir="ltr" className="truncate">
                    {shell.contact.email}
                  </span>
                </a>
              )}
              {socials.length > 0 && (
                <ul className="flex gap-1">
                  {socials.map(({ label, href, Icon }) => (
                    <li key={label}>
                      <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="mx-icon -ms-2 [&_svg]:size-5">
                        <Icon aria-hidden />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
