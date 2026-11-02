"use client";

import { Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";
import { APPEARANCE_SCRIPT, useAppearance, type Appearance } from "../lib/appearance";

/** Blocks a white flash on a dark device's first visit. Render once. */
export function AppearanceScript() {
  return <script dangerouslySetInnerHTML={{ __html: APPEARANCE_SCRIPT }} />;
}

/** One tap between light and dark. */
export function AppearanceToggle({ className }: { className?: string }) {
  const { dark, set, ready } = useAppearance();
  return (
    <button type="button" onClick={() => set(dark ? "light" : "dark")} aria-label={dark ? "الوضع الفاتح" : "الوضع الغامق"} className={cn("sg-icon", className)}>
      {ready && dark ? <Sun /> : <Moon />}
    </button>
  );
}

const OPTIONS: { value: Appearance; label: string }[] = [
  { value: "system", label: "تلقائي" },
  { value: "light", label: "فاتح" },
  { value: "dark", label: "غامق" },
];

/** Segmented control for the footer: automatic, light or dark. */
export function AppearanceSegments() {
  const { appearance, set, ready } = useAppearance();
  return (
    <div role="radiogroup" aria-label="مظهر المتجر" className="sg-segments">
      {OPTIONS.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={ready && appearance === o.value} onClick={() => set(o.value)} className="sg-segment">
          {o.label}
        </button>
      ))}
    </div>
  );
}
