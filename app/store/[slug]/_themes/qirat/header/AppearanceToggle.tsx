"use client";

import { Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";
import { APPEARANCE_SCRIPT, useAppearance, type Appearance } from "../lib/appearance";

/** Blocks a white flash on a dark device's first visit. Render once. */
export function AppearanceScript() {
  return <script dangerouslySetInnerHTML={{ __html: APPEARANCE_SCRIPT }} />;
}

/** One tap between the pearl day and the velvet night. */
export function AppearanceToggle({ className }: { className?: string }) {
  const { dark, set, ready } = useAppearance();
  // Until hydration ends the server's guess (light) stands, so the markup matches.
  const isDark = ready && dark;
  return (
    <button type="button" onClick={() => set(dark ? "light" : "dark")} aria-label={isDark ? "الوضع الفاتح" : "الوضع الغامق"} className={cn("qr-icon", className)}>
      {isDark ? <Sun /> : <Moon />}
    </button>
  );
}

const OPTIONS: { value: Appearance; label: string }[] = [
  { value: "system", label: "تلقائي" },
  { value: "light", label: "فاتح" },
  { value: "dark", label: "غامق" },
];

/** Segmented control: automatic, light or dark. */
export function AppearanceSegments({ className }: { className?: string }) {
  const { appearance, set, ready } = useAppearance();
  return (
    <div role="radiogroup" aria-label="مظهر المتجر" className={cn("qr-segments", className)}>
      {OPTIONS.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={ready && appearance === o.value} onClick={() => set(o.value)} className="qr-segment">
          {o.label}
        </button>
      ))}
    </div>
  );
}
