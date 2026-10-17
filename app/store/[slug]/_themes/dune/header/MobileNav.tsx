"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail, Menu, MessageCircle, X } from "lucide-react";
import { Dialog } from "radix-ui";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { StoreShell } from "../../types";
import { BannerImage, BannerLink } from "../../shared/banner";
import { getSocialLinks, whatsappHref } from "../../shared/social";
import { isActivePath } from "../../shared/store-path";
import { Arrow, DN_PORTAL, num, stagger } from "../ui";
import StoreMark from "./StoreMark";

const ROW = "flex min-h-14 w-full items-center justify-between gap-4 dn-serif text-[1.75rem] leading-tight";

/** Phones/tablets: a drawer from the reading start — large serif links, the
 *  categories as an accordion, a promo image and ways to reach the store. */
export default function MobileNav({ shell, path }: { shell: StoreShell; path: string }) {
  const [open, setOpen] = useState(false);
  const url = (p: string) => buildStoreUrl(shell.slug, p === "/" ? "" : p);
  const wa = whatsappHref(shell.contact.whatsapp);
  const socials = getSocialLinks(shell.contact);
  const close = () => setOpen(false);

  const links = [
    { href: "/", label: "الرئيسية" },
    { href: "/products?sort=newest", label: "وصل حديثًا" },
    { href: "/products?featured=true", label: "اختيارات المتجر" },
    { href: "/about", label: "عن المتجر" },
    { href: "/contact", label: "تواصل معنا" },
  ];

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="dn-icon -ms-2.5" aria-label="فتح القائمة">
        <Menu />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dn-scrim fixed inset-0 z-50 bg-[rgb(29_29_28/0.45)]" />
        <Dialog.Content
          dir={shell.dir}
          aria-describedby={undefined}
          className={cn(DN_PORTAL, "dn-drawer dn-drawer--start fixed inset-y-0 start-0 z-50 flex w-[min(92vw,26rem)] flex-col bg-(--dn-drawer) outline-none")}
        >
          <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-(--dn-line) px-5">
            <Dialog.Title asChild>
              <div className="min-w-0">
                <StoreMark shell={shell} onClick={close} />
              </div>
            </Dialog.Title>
            <Dialog.Close className="dn-icon -me-2.5" aria-label="إغلاق القائمة">
              <X />
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-8 pt-3">
            <nav aria-label="القائمة الرئيسية">
              <ul className="dn-stagger divide-y divide-(--dn-line)">
                <li style={stagger(0)}>
                  <Link href={url("/")} onClick={close} aria-current={path === "/" ? "page" : undefined} className={ROW}>
                    {links[0].label}
                  </Link>
                </li>
                <li style={stagger(1)}>
                  {shell.categories.length > 0 ? (
                    <details className="dn-details">
                      <summary className={ROW}>
                        تسوّق
                        <span className="dn-plus" aria-hidden />
                      </summary>
                      <ul className="pb-4">
                        {shell.categories.map((c) => (
                          <li key={c.id}>
                            <Link
                              href={url(`/categories/${c.slug}`)}
                              onClick={close}
                              aria-current={isActivePath(path, `/categories/${c.slug}`) ? "page" : undefined}
                              className="flex min-h-11 items-center justify-between gap-3 text-[0.9375rem] aria-[current=page]:font-semibold"
                            >
                              <span className="truncate">{c.name}</span>
                              <span className="text-xs tabular-nums text-(--dn-quiet)">{num(c.productCount)}</span>
                            </Link>
                          </li>
                        ))}
                        <li>
                          <Link href={url("/products")} onClick={close} className="dn-label mt-2 inline-flex min-h-11 items-center gap-1.5">
                            كل المنتجات
                            <Arrow />
                          </Link>
                        </li>
                      </ul>
                    </details>
                  ) : (
                    <Link href={url("/products")} onClick={close} className={ROW}>
                      تسوّق
                    </Link>
                  )}
                </li>
                {links.slice(1).map((l, n) => (
                  <li key={l.href} style={stagger(n + 2)}>
                    <Link href={url(l.href)} onClick={close} aria-current={!l.href.includes("?") && isActivePath(path, l.href) ? "page" : undefined} className={ROW}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {shell.banner && (
              <BannerLink banner={shell.banner} storeSlug={shell.slug} onClick={close} className="group mt-8 block">
                <span className="dn-media block aspect-[16/10]">
                  <BannerImage banner={shell.banner} sizes="90vw" className="dn-zoom-img object-cover" />
                </span>
                <span className="dn-h4 mt-3 line-clamp-2 block">{shell.banner.title}</span>
                {shell.banner.link && (
                  <span className="dn-label mt-1 inline-flex items-center gap-1.5 text-(--dn-quiet)">
                    {shell.banner.cta}
                    <Arrow />
                  </span>
                )}
              </BannerLink>
            )}
          </div>

          {(wa || shell.contact.email || socials.length > 0) && (
            <div className="shrink-0 space-y-1 border-t border-(--dn-line) px-5 py-4" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center gap-3 text-sm">
                  <MessageCircle className="size-[1.125rem] text-(--dn-quiet)" />
                  كلّمنا على واتساب
                </a>
              )}
              {shell.contact.email && (
                <a href={`mailto:${shell.contact.email}`} className="flex min-h-11 items-center gap-3 text-sm">
                  <Mail className="size-[1.125rem] text-(--dn-quiet)" />
                  <span dir="ltr" className="truncate">
                    {shell.contact.email}
                  </span>
                </a>
              )}
              {socials.length > 0 && (
                <ul className="flex gap-1 pt-1">
                  {socials.map(({ label, href, Icon }) => (
                    <li key={label}>
                      <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="dn-icon -ms-2.5 [&_svg]:size-5">
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
