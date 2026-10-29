"use client";

import { Tabs } from "radix-ui";
import { useSyncExternalStore, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const noop = () => () => {};

/** Product information tabs (description · details · delivery) as pill
 *  tabs. Arrow keys move between tabs (Radix). */
export default function DetailTabs({ tabs }: { tabs: { id: string; label: string; content: ReactNode }[] }) {
  // Radix maps arrow keys by direction; read it from the store root after mount.
  const dir = useSyncExternalStore(
    noop,
    () => (document.querySelector(".theme-medical")?.getAttribute("dir") === "ltr" ? "ltr" : "rtl"),
    () => "rtl" as const,
  );
  if (tabs.length === 0) return null;
  return (
    <Tabs.Root defaultValue={tabs[0].id} dir={dir}>
      <Tabs.List aria-label="معلومات المنتج" className="rx-rail gap-2 rounded-full bg-(--rx-band) p-1 sm:w-fit">
        {tabs.map((t) => (
          <Tabs.Trigger
            key={t.id}
            value={t.id}
            className={cn(
              "min-h-10 shrink-0 rounded-full px-5 text-sm font-bold text-(--rx-quiet) transition-colors hover:text-(--rx-ink)",
              "data-[state=active]:bg-(--rx-card) data-[state=active]:text-(--rx-btn) data-[state=active]:shadow-(--rx-shadow-sm)",
            )}
          >
            {t.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {tabs.map((t) => (
        <Tabs.Content key={t.id} value={t.id} className="rx-tab-panel pt-6 outline-none">
          {t.content}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
