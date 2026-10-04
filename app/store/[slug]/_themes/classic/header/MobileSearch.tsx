"use client";

import Link from "next/link";
import { useState } from "react";
import { Search } from "lucide-react";
import { Dialog as SheetPrimitive } from "radix-ui";

import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { StoreShell } from "../../types";
import { CLASSIC_PORTAL, btn } from "../ui";
import SearchCombobox from "./SearchCombobox";

/** Full-screen search for phones/tablets: opens with the keyboard up. */
export default function MobileSearch({ shell }: { shell: StoreShell }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className={btn({ variant: "ghost", size: "icon" })} aria-label="بحث">
        <Search />
      </SheetTrigger>

      <SheetContent
        side="top"
        showCloseButton={false}
        dir={shell.dir}
        className={cn(CLASSIC_PORTAL, "h-dvh max-h-dvh gap-0 border-0 p-0")}
      >
        <SheetTitle className="sr-only">البحث في {shell.name}</SheetTitle>
        <SheetDescription className="sr-only">اكتب اسم المنتج اللي بتدور عليه</SheetDescription>

        <div className="flex items-center gap-1 border-b border-border px-2 py-2">
          <SearchCombobox
            storeSlug={shell.slug}
            variant="overlay"
            autoFocus
            onNavigate={() => setOpen(false)}
            className="min-w-0 flex-1"
          />
          <SheetPrimitive.Close className={btn({ variant: "ghost", size: "sm", className: "px-3" })}>
            إلغاء
          </SheetPrimitive.Close>
        </div>

        {shell.categories.length > 0 && (
          <div className="overflow-y-auto px-4 py-5">
            <p className="mb-3 text-xs font-semibold text-muted-foreground">تصفح التصنيفات</p>
            <ul className="flex flex-wrap gap-2">
              {shell.categories.map((c) => (
                <li key={c.id}>
                  <SheetClose asChild>
                    <Link
                      href={buildStoreUrl(shell.slug, `/categories/${c.slug}`)}
                      className="inline-flex min-h-10 items-center rounded-full border border-border px-4 text-sm transition-colors hover:border-foreground/40"
                    >
                      {c.name}
                    </Link>
                  </SheetClose>
                </li>
              ))}
            </ul>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
