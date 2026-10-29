"use client";

import Link from "next/link";
import { useState } from "react";
import { ClipboardPlus, Mail, Menu, MessageCircle, PackageSearch, X } from "lucide-react";
import { Dialog } from "radix-ui";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { StoreShell } from "../../types";
import { getSocialLinks, whatsappHref } from "../../shared/social";
import { isActivePath } from "../../shared/store-path";
import { RX_MESSAGE, waWith } from "../lib/rx";
import { CategoryArt, Chevron, RX_PORTAL, num, stagger } from "../ui";
import StoreMark from "./StoreMark";

const ROW =
  "flex min-h-12 w-full items-center justify-between gap-3 rounded-(--rx-r-sm) px-3 text-[0.9375rem] font-semibold text-(--rx-ink) transition-colors hover:bg-(--rx-band) aria-[current=page]:bg-(--rx-tint) aria-[current=page]:text-(--rx-tint-ink)";

/** Phone menu: opens from the reading start with the shop paths, every shelf
 *  with its icon and count, the prescription shortcut and contact. */
export default function DrawerMenu({ shell, path }: { shell: StoreShell; path: string }) {
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
    { href: "/track", label: "تتبّع طلبك" },
    { href: "/contact", label: "تواصل معنا" },
  ];

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="rx-icon -ms-2" aria-label="فتح القائمة">
        <Menu />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className={cn(RX_PORTAL, "rx-scrim fixed inset-0 z-50")} />
        <Dialog.Content
          dir={shell.dir}
          aria-describedby={undefined}
          className={cn(RX_PORTAL, "rx-drawer rx-drawer--start fixed inset-y-0 start-0 z-50 flex w-[min(90vw,23rem)] flex-col bg-(--rx-surface) outline-none")}
        >
          <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-(--rx-line) px-4">
            <Dialog.Title asChild>
              <div className="min-w-0">
                <StoreMark shell={shell} onClick={close} />
              </div>
            </Dialog.Title>
            <Dialog.Close className="rx-icon -me-2" aria-label="إغلاق القائمة">
              <X />
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain px-2 pb-6 pt-3">
            {wa && (
              <a
                href={waWith(wa, RX_MESSAGE)}
                target="_blank"
                rel="noopener noreferrer"
                className="rx-pluses mx-2 mb-3 flex items-center gap-3 rounded-(--rx-r) bg-(--rx-tint) p-3.5 text-(--rx-btn)"
              >
                <ClipboardPlus className="size-7 shrink-0" strokeWidth={1.5} />
                <span className="min-w-0 flex-1 text-(--rx-tint-ink)">
                  <span className="block text-sm font-bold">ابعت روشتة على واتساب</span>
                  <span className="block text-xs opacity-80">صوّرها واسأل عن المتاح والسعر</span>
                </span>
                <Chevron />
              </a>
            )}

            <nav aria-label="القائمة الرئيسية">
              <ul className="rx-stagger">
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
              <section className="mt-4 border-t border-(--rx-line) pt-4">
                <h2 className="px-3 pb-2 text-xs font-bold text-(--rx-quiet)">الأقسام</h2>
                <ul>
                  {shell.categories.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={url(`/categories/${c.slug}`)}
                        onClick={close}
                        aria-current={isActivePath(path, `/categories/${c.slug}`) ? "page" : undefined}
                        className="flex min-h-12 items-center gap-3 rounded-(--rx-r-sm) px-3 text-[0.9375rem] text-(--rx-ink) transition-colors hover:bg-(--rx-band) aria-[current=page]:font-bold aria-[current=page]:text-(--rx-btn)"
                      >
                        <span className="relative size-9 shrink-0 overflow-hidden rounded-full">
                          <CategoryArt name={c.name} image={c.image} sizes="36px" />
                        </span>
                        <span className="min-w-0 flex-1 truncate">{c.name}</span>
                        <span className="text-xs tabular-nums text-(--rx-quiet)">{num(c.productCount)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <div className="shrink-0 space-y-1 border-t border-(--rx-line) px-4 py-3" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
            <Link href={url("/track")} onClick={close} className="flex min-h-11 items-center gap-3 text-sm text-(--rx-ink)">
              <PackageSearch className="size-[1.125rem] text-(--rx-btn)" />
              تتبّع طلبك برقم الطلب
            </Link>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center gap-3 text-sm text-(--rx-ink)">
                <MessageCircle className="size-[1.125rem] text-(--rx-wa)" />
                كلّمنا على واتساب
              </a>
            )}
            {shell.contact.email && (
              <a href={`mailto:${shell.contact.email}`} className="flex min-h-11 items-center gap-3 text-sm text-(--rx-ink)">
                <Mail className="size-[1.125rem] text-(--rx-btn)" />
                <span dir="ltr" className="truncate">
                  {shell.contact.email}
                </span>
              </a>
            )}
            {socials.length > 0 && (
              <ul className="flex gap-1">
                {socials.map(({ label, href, Icon }) => (
                  <li key={label}>
                    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="rx-icon -ms-2 [&_svg]:size-5">
                      <Icon aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
