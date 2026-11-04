"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Dialog } from "radix-ui";

import { cn } from "@/lib/utils";
import type { StoreShell } from "../../types";
import { SEARCH_EVENT } from "../lib/events";
import { QR_PORTAL } from "../ui";
import SearchBar from "./SearchBar";

/** Search drops from the top over a softened page. Every search button in the
 *  theme (and ⌘K) opens this one. */
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
        <Dialog.Overlay className={cn(QR_PORTAL, "qr-scrim qr-scrim--soft fixed inset-0 z-50")} />
        <Dialog.Content dir={shell.dir} aria-describedby={undefined} className={cn(QR_PORTAL, "qr-searchsheet fixed inset-x-0 top-0 z-50 outline-none")}>
          <Dialog.Title className="sr-only">البحث في المتجر</Dialog.Title>
          <div className="qr-wrap relative pt-5 pb-8">
            <SearchBar shell={shell} autoFocus onDone={() => setOpen(false)} className="min-w-0" />
            <Dialog.Close aria-label="إغلاق البحث" className="qr-icon absolute end-(--qr-gutter) top-6">
              <X />
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
