"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Dialog } from "radix-ui";

import { cn } from "@/lib/utils";
import type { StoreShell } from "../../types";
import { SEARCH_EVENT } from "../lib/events";
import { MK_PORTAL } from "../ui";
import SearchBar from "./SearchBar";

/** Spotlight-style search: a floating panel on desktop, a full sheet on phones.
 *  Every search button in the theme opens this one. */
export default function SearchSheet({ shell }: { shell: StoreShell }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener(SEARCH_EVENT, onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(SEARCH_EVENT, onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className={cn(MK_PORTAL, "mk-scrim fixed inset-0 z-50")} />
        <Dialog.Content dir={shell.dir} aria-describedby={undefined} className={cn(MK_PORTAL, "mk-spotlight fixed z-50 outline-none")}>
          <Dialog.Title className="sr-only">البحث في المتجر</Dialog.Title>
          <div className="flex items-start gap-2">
            <SearchBar shell={shell} size="lg" autoFocus onDone={() => setOpen(false)} className="min-w-0 flex-1" />
            <Dialog.Close aria-label="إغلاق البحث" className="mk-icon mt-1.5 shrink-0 lg:hidden">
              <X />
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
