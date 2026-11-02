"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Dialog } from "radix-ui";

import { cn } from "@/lib/utils";
import type { StoreShell } from "../../types";
import { SEARCH_EVENT } from "../lib/events";
import { SG_PORTAL } from "../ui";
import SearchBar from "./SearchBar";

/** apple.com's search: a panel that drops over the bar with the page blurred
 *  behind it. Every search button in the theme (and ⌘K) opens this one. */
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
        <Dialog.Overlay className={cn(SG_PORTAL, "sg-blur-scrim fixed inset-0 z-50")} />
        <Dialog.Content dir={shell.dir} aria-describedby={undefined} className={cn(SG_PORTAL, "sg-searchsheet fixed inset-x-0 top-0 z-50 outline-none")}>
          <Dialog.Title className="sr-only">البحث في المتجر</Dialog.Title>
          <div className="sg-searchsheet-inner">
            <SearchBar shell={shell} autoFocus onDone={() => setOpen(false)} className="min-w-0 flex-1" />
            <Dialog.Close aria-label="إغلاق البحث" className="sg-gicon absolute end-(--sg-gutter) top-2">
              <X />
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
