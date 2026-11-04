"use client";

// Light, dark or follow the device. Shoppers get "follow the device" until they
// choose. Inside the Studio canvas the choice stays in the frame, so previewing
// dark never touches the merchant's dashboard.

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

export type Appearance = "system" | "light" | "dark";

const framed = () => typeof window !== "undefined" && window.self !== window.top;
const noSubscribe = () => () => {};

/** Runs before first paint, so a dark device never flashes white on a first visit. */
export const APPEARANCE_SCRIPT = `try{if(window.self===window.top&&!localStorage.getItem("theme")&&matchMedia("(prefers-color-scheme: dark)").matches){var r=document.documentElement;r.classList.remove("light");r.classList.add("dark");r.style.colorScheme="dark"}}catch(e){}`;

export function useAppearance() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
  const [frameChoice, setFrameChoice] = useState<Appearance | null>(null);

  useEffect(() => {
    if (framed()) return;
    try {
      if (!localStorage.getItem("theme")) setTheme("system");
    } catch {
      // Storage blocked: the provider's default stands.
    }
  }, [setTheme]);

  const set = useCallback(
    (next: Appearance) => {
      if (!framed()) return setTheme(next);
      setFrameChoice(next);
      const dark = next === "dark" || (next === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.style.colorScheme = dark ? "dark" : "light";
    },
    [setTheme],
  );

  const appearance = (frameChoice ?? theme ?? "system") as Appearance;
  const dark = frameChoice ? frameChoice === "dark" : resolvedTheme === "dark";
  return { appearance, dark, set, ready: mounted };
}
