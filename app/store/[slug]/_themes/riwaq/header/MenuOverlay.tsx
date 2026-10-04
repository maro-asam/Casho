"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Mail, MessageCircle, ShoppingBag, X } from "lucide-react";
import { Dialog } from "radix-ui";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { StoreShell } from "../../types";
import { getSocialLinks, whatsappHref } from "../../shared/social";
import { isActivePath } from "../../shared/store-path";
import { Arrow, RQ_PORTAL, btn, idx, monogram, num } from "../ui";
import ThemeToggle from "./ThemeToggle";
import StoreMark from "./StoreMark";

const PRIMARY = [
  { href: "/", label: "الرئيسية" },
  { href: "/products", label: "كل المنتجات" },
  { href: "/categories", label: "التصنيفات" },
  { href: "/about", label: "عن المتجر" },
  { href: "/contact", label: "تواصل معنا" },
] as const;

/** Phones/tablets: a full-screen paper index — big numbered links first,
 *  then every category, then ways to reach the store. */
export default function MenuOverlay({ shell, count, path }: { shell: StoreShell; count: number; path: string }) {
  const [open, setOpen] = useState(false);
  const wa = whatsappHref(shell.contact.whatsapp);
  const socials = getSocialLinks(shell.contact);
  const url = (p: string) => buildStoreUrl(shell.slug, p === "/" ? "" : p);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="-ms-2 inline-flex min-h-11 items-center gap-2.5 px-2 text-sm font-semibold" aria-label="فتح القائمة">
        <span aria-hidden className="flex w-5 flex-col gap-[5px]">
          <span className="h-[1.5px] w-5 bg-current" />
          <span className="h-[1.5px] w-3 bg-current" />
        </span>
        <span aria-hidden className="max-[379px]:hidden">
          القائمة
        </span>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Content
          dir={shell.dir}
          aria-describedby={undefined}
          className={cn(
            RQ_PORTAL,
            "fixed inset-0 z-50 flex flex-col outline-none data-[state=open]:animate-[rq-fade_200ms_ease-out]",
          )}
        >
          <div className="rq-wrap grid h-(--rq-bar-h) shrink-0 grid-cols-[1fr_auto] items-center gap-3 border-b border-(--rq-rule)">
            <Dialog.Title asChild>
              <div className="min-w-0">
                <StoreMark shell={shell} />
              </div>
            </Dialog.Title>
            <Dialog.Close className="-me-2 inline-flex min-h-11 items-center gap-2 px-2 text-sm font-semibold">
              إغلاق
              <X className="size-5" />
            </Dialog.Close>
          </div>

          <nav aria-label="القائمة الرئيسية" className="flex-1 overflow-y-auto overscroll-contain">
            <ol className="rq-wrap rq-stagger pt-4">
              {PRIMARY.map((link, i) => {
                const active = isActivePath(path, link.href);
                return (
                  <li key={link.href} style={{ "--i": i } as React.CSSProperties} className="border-b border-(--rq-rule)">
                    <Dialog.Close asChild>
                      <Link
                        href={url(link.href)}
                        aria-current={active ? "page" : undefined}
                        className="flex min-h-16 items-baseline gap-4 py-3"
                      >
                        <span className="rq-num w-6 shrink-0 text-xs text-(--rq-accent)">{idx(i + 1)}</span>
                        <span className={cn("rq-face text-[1.75rem] font-semibold leading-tight", active && "text-(--rq-accent)")}>
                          {link.label}
                        </span>
                      </Link>
                    </Dialog.Close>
                  </li>
                );
              })}
            </ol>

            {shell.categories.length > 0 && (
              <section className="rq-wrap pt-9">
                <h2 className="rq-label mb-2">التصنيفات</h2>
                <ul>
                  {shell.categories.map((c) => {
                    const active = isActivePath(path, `/categories/${c.slug}`);
                    return (
                      <li key={c.id} className="border-b border-(--rq-rule)">
                        <Dialog.Close asChild>
                          <Link
                            href={url(`/categories/${c.slug}`)}
                            aria-current={active ? "page" : undefined}
                            className="group flex min-h-14 items-center gap-3.5 py-2"
                          >
                            <span className="rq-arch relative grid h-11 w-8 shrink-0 place-items-center pt-1.5">
                              {c.image ? (
                                <Image src={c.image} alt="" fill sizes="32px" className="object-cover" />
                              ) : (
                                <span className="rq-face text-sm font-semibold text-(--rq-accent)">{monogram(c.name)}</span>
                              )}
                            </span>
                            <span className={cn("min-w-0 flex-1 truncate text-base", active && "font-semibold text-(--rq-accent)")}>
                              {c.name}
                            </span>
                            <span className="rq-num text-xs text-(--rq-quiet)">{num(c.productCount)}</span>
                            <Arrow className="text-(--rq-quiet)" />
                          </Link>
                        </Dialog.Close>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {(wa || shell.contact.email || socials.length > 0) && (
              <section className="rq-wrap pb-8 pt-9">
                <h2 className="rq-label mb-2">كلّمنا</h2>
                <ul className="space-y-1">
                  {wa && (
                    <li>
                      <a href={wa} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center gap-3 text-[0.9375rem]">
                        <MessageCircle className="size-5 text-(--rq-quiet)" />
                        واتساب
                      </a>
                    </li>
                  )}
                  {shell.contact.email && (
                    <li>
                      <a href={`mailto:${shell.contact.email}`} className="flex min-h-12 items-center gap-3 text-[0.9375rem]">
                        <Mail className="size-5 text-(--rq-quiet)" />
                        <span dir="ltr" className="truncate">
                          {shell.contact.email}
                        </span>
                      </a>
                    </li>
                  )}
                </ul>
                {socials.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-x-6">
                    {socials.map((s) => (
                      <li key={s.label}>
                        <a href={s.href} target="_blank" rel="noopener noreferrer" className="rq-link inline-flex min-h-11 items-center text-sm font-semibold">
                          {s.label} ↗
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </nav>

          <div
            className="rq-wrap flex shrink-0 items-center gap-3 border-t border-(--rq-rule) py-3"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            <Dialog.Close asChild>
              <Link href={url("/cart")} className={btn({ size: "lg", className: "flex-1" })}>
                <ShoppingBag />
                السلة
                {count > 0 && <span className="rq-num">({num(count)})</span>}
              </Link>
            </Dialog.Close>
            <ThemeToggle className="size-14 border border-(--rq-rule-strong)" />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
