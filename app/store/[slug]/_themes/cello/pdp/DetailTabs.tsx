"use client";

import { Tabs } from "radix-ui";
import { useSyncExternalStore, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const noop = () => () => {};

/** Cello's product information tabs ("Description · Specifications ·
 *  Shipping and return") with an underlined active tab. Arrow keys move
 *  between tabs (Radix). */
export default function DetailTabs({ tabs }: { tabs: { id: string; label: string; content: ReactNode }[] }) {
  // Radix maps arrow keys by direction; read it from the store root after mount.
  const dir = useSyncExternalStore(
    noop,
    () => (document.querySelector(".theme-cello")?.getAttribute("dir") === "ltr" ? "ltr" : "rtl"),
    () => "rtl" as const,
  );
  if (tabs.length === 0) return null;
  return (
    <Tabs.Root defaultValue={tabs[0].id} dir={dir}>
      <Tabs.List aria-label="معلومات المنتج" className="ce-rail gap-7 border-b border-(--ce-line)">
        {tabs.map((t) => (
          <Tabs.Trigger
            key={t.id}
            value={t.id}
            className={cn(
              "-mb-px min-h-12 shrink-0 border-b-2 border-transparent text-base font-medium text-(--ce-quiet) transition-colors hover:text-(--ce-ink) sm:text-lg",
              "data-[state=active]:border-(--ce-ink) data-[state=active]:text-(--ce-ink) ltr:uppercase",
            )}
          >
            {t.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {tabs.map((t) => (
        <Tabs.Content key={t.id} value={t.id} className="ce-tab-panel pt-6 outline-none">
          {t.content}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
