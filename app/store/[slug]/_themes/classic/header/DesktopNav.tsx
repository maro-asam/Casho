"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { StoreShell } from "../../types";
import { CLASSIC_PORTAL } from "../ui";
import { isActivePath, useStorePath } from "./use-store-path";

/** Inline categories: 4 on laptop widths, 6 from xl. The rest go in "المزيد". */
const INLINE_LG = 4;
const INLINE_XL = 6;

const ITEM =
  "relative inline-flex h-11 shrink-0 items-center px-3 text-sm font-medium text-foreground/75 transition-colors hover:text-foreground " +
  "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:scale-x-0 after:rounded-full after:bg-foreground after:transition-transform after:duration-(--c-motion) " +
  "hover:after:scale-x-100 aria-[current=page]:font-bold aria-[current=page]:text-foreground aria-[current=page]:after:scale-x-100";

export default function DesktopNav({ shell, className }: { shell: StoreShell; className?: string }) {
  const path = useStorePath(shell.slug);
  const href = (p: string) => buildStoreUrl(shell.slug, p === "/" ? "" : p);
  const current = (p: string) => (isActivePath(path, p) ? "page" : undefined);

  const categories = shell.categories;
  const overflow = categories.slice(INLINE_LG);

  return (
    <nav aria-label="القائمة الرئيسية" className={cn("flex min-w-0 items-center", className)}>
      <ul className="-ms-3 flex min-w-0 items-center">
        <li>
          <Link href={href("/")} aria-current={current("/")} className={ITEM}>
            الرئيسية
          </Link>
        </li>
        <li>
          <Link href={href("/products")} aria-current={current("/products")} className={ITEM}>
            كل المنتجات
          </Link>
        </li>

        {categories.slice(0, INLINE_XL).map((c, i) => (
          <li key={c.id} className={cn(i >= INLINE_LG && "hidden xl:block")}>
            <Link
              href={href(`/categories/${c.slug}`)}
              aria-current={current(`/categories/${c.slug}`)}
              className={cn(ITEM, "max-w-44")}
            >
              <span className="truncate">{c.name}</span>
            </Link>
          </li>
        ))}

        {overflow.length > 0 && (
          <li className={cn(categories.length <= INLINE_XL && "xl:hidden")}>
            <DropdownMenu dir={shell.dir} modal={false}>
              <DropdownMenuTrigger className={cn(ITEM, "gap-1 data-[state=open]:text-foreground")}>
                المزيد
                <ChevronDown className="size-4 transition-transform duration-(--c-motion) [[data-state=open]>&]:rotate-180" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                sideOffset={4}
                className={cn(CLASSIC_PORTAL, "max-h-[min(70vh,26rem)] min-w-56 overflow-y-auto rounded-(--c-radius) p-1.5")}
              >
                {overflow.map((c, i) => (
                  <DropdownMenuItem
                    key={c.id}
                    asChild
                    className={cn("min-h-10 cursor-pointer justify-between gap-6 rounded-(--c-radius-sm) px-3", i < INLINE_XL - INLINE_LG && "xl:hidden")}
                  >
                    <Link href={href(`/categories/${c.slug}`)}>
                      <span className="truncate">{c.name}</span>
                      <span className="text-xs tabular-nums text-muted-foreground">{c.productCount}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="min-h-10 cursor-pointer rounded-(--c-radius-sm) px-3 font-semibold">
                  <Link href={href("/categories")}>كل التصنيفات</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        )}
      </ul>

      <ul className="ms-auto flex shrink-0 items-center ps-4">
        <li>
          <Link href={href("/about")} aria-current={current("/about")} className={ITEM}>
            عن المتجر
          </Link>
        </li>
        <li>
          <Link href={href("/contact")} aria-current={current("/contact")} className={cn(ITEM, "-me-3")}>
            تواصل معنا
          </Link>
        </li>
      </ul>
    </nav>
  );
}
