"use client";

import { Tabs } from "radix-ui";
import { useSyncExternalStore, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const noop = () => () => {};

/** Product information tabs (description · details · delivery) as solid
 *  blocks; the active one turns the store color. Arrow keys move between tabs (Radix). */
export default function DetailTabs({ tabs }: { tabs: { id: string; label: string; content: ReactNode }[] }) {
  // Radix maps arrow keys by direction; read it from the store root after mount.
  const dir = useSyncExternalStore(
    noop,
    () => (document.querySelector(".theme-market")?.getAttribute("dir") === "ltr" ? "ltr" : "rtl"),
    () => "rtl" as const,
  );
  if (tabs.length === 0) return null;
  return (
    <Tabs.Root defaultValue={tabs[0].id} dir={dir}>
      <Tabs.List aria-label="معلومات المنتج" className="mk-rail gap-1.5 sm:w-fit">
        {tabs.map((t) => (
          <Tabs.Trigger
            key={t.id}
            value={t.id}
            className={cn(
              "min-h-11 shrink-0 rounded-(--mk-r-sm) bg-(--mk-cell) px-5 text-sm font-extrabold text-(--mk-label-2) transition-colors hover:text-(--mk-ink)",
              "data-[state=active]:bg-(--mk-btn) data-[state=active]:text-(--mk-btn-ink)",
            )}
          >
            {t.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {tabs.map((t) => (
        <Tabs.Content key={t.id} value={t.id} className="mk-tab-panel pt-6 outline-none">
          {t.content}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
