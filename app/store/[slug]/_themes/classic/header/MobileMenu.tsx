"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, Mail, Menu, MessageCircle, ShoppingBag, X } from "lucide-react";
import { Dialog as SheetPrimitive } from "radix-ui";

import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { StoreShell } from "../../types";
import { CLASSIC_PORTAL, btn } from "../ui";
import { SocialLinks, whatsappHref } from "../social";
import ThemeToggle from "./ThemeToggle";
import { NAV_LINKS } from "./nav-links";
import { isActivePath, useStorePath } from "../../shared/store-path";

export default function MobileMenu({ shell, cartCount }: { shell: StoreShell; cartCount: number }) {
  const [open, setOpen] = useState(false);
  const path = useStorePath(shell.slug);
  const rtl = shell.dir === "rtl";
  const wa = whatsappHref(shell.contact.whatsapp);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className={btn({ variant: "ghost", size: "icon", className: "-ms-2.5 lg:hidden" })} aria-label="فتح القائمة">
        <Menu />
      </SheetTrigger>

      <SheetContent
        side={rtl ? "right" : "left"}
        showCloseButton={false}
        dir={shell.dir}
        className={cn(CLASSIC_PORTAL, "w-[min(88vw,22rem)] gap-0 border-border p-0 data-[side=left]:sm:max-w-[22rem] data-[side=right]:sm:max-w-[22rem]")}
      >
        <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border ps-4 pe-2">
          <SheetTitle className="truncate text-base font-bold">{shell.name}</SheetTitle>
          <SheetDescription className="sr-only">روابط المتجر والتصنيفات</SheetDescription>
          <SheetPrimitive.Close className={btn({ variant: "ghost", size: "icon" })} aria-label="إغلاق القائمة">
            <X />
          </SheetPrimitive.Close>
        </div>

        <nav aria-label="القائمة الرئيسية" className="flex-1 overflow-y-auto overscroll-contain">
          <ul className="px-2 py-2">
            {NAV_LINKS.map((link) => {
              const active = isActivePath(path, link.href);
              return (
                <li key={link.href}>
                  <SheetClose asChild>
                    <Link
                      href={buildStoreUrl(shell.slug, link.href === "/" ? "" : link.href)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-12 items-center rounded-(--c-radius-sm) px-3 text-[0.9375rem] font-medium transition-colors hover:bg-(--c-subtle)",
                        active && "bg-(--c-subtle) font-bold",
                      )}
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                </li>
              );
            })}
          </ul>

          {shell.categories.length > 0 && (
            <div className="border-t border-border px-2 pb-3 pt-4">
              <p className="px-3 pb-2 text-xs font-semibold text-muted-foreground">تسوق حسب التصنيف</p>
              <ul>
                {shell.categories.map((category) => {
                  const active = isActivePath(path, `/categories/${category.slug}`);
                  return (
                    <li key={category.id}>
                      <SheetClose asChild>
                        <Link
                          href={buildStoreUrl(shell.slug, `/categories/${category.slug}`)}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex min-h-13 items-center gap-3 rounded-(--c-radius-sm) px-3 py-1.5 transition-colors hover:bg-(--c-subtle)",
                            active && "bg-(--c-subtle)",
                          )}
                        >
                          <span className="c-img-bg relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-(--c-radius-sm) text-sm font-bold text-muted-foreground">
                            {category.image ? (
                              <Image src={category.image} alt="" fill sizes="40px" className="object-cover" />
                            ) : (
                              category.name.charAt(0)
                            )}
                          </span>
                          <span className={cn("min-w-0 flex-1 truncate text-[0.9375rem]", active && "font-bold")}>
                            {category.name}
                          </span>
                          <span className="text-xs tabular-nums text-muted-foreground">{category.productCount}</span>
                          <ChevronLeft aria-hidden className="size-4 shrink-0 text-muted-foreground ltr:rotate-180" />
                        </Link>
                      </SheetClose>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {(wa || shell.contact.email) && (
            <div className="space-y-1 border-t border-border px-2 py-3">
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center gap-3 rounded-(--c-radius-sm) px-3 text-[0.9375rem] hover:bg-(--c-subtle)">
                  <MessageCircle className="size-5 text-muted-foreground" />
                  تواصل على واتساب
                </a>
              )}
              {shell.contact.email && (
                <a href={`mailto:${shell.contact.email}`} className="flex min-h-12 items-center gap-3 rounded-(--c-radius-sm) px-3 text-[0.9375rem] hover:bg-(--c-subtle)">
                  <Mail className="size-5 text-muted-foreground" />
                  <span className="truncate" dir="ltr">{shell.contact.email}</span>
                </a>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
            <SocialLinks contact={shell.contact} />
            <ThemeToggle />
          </div>
        </nav>

        <div className="shrink-0 border-t border-border p-3" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
          <SheetClose asChild>
            <Link href={buildStoreUrl(shell.slug, "/cart")} className={btn({ size: "lg", full: true })}>
              <ShoppingBag />
              السلة
              {cartCount > 0 && (
                <span className="rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs tabular-nums">{cartCount}</span>
              )}
            </Link>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
