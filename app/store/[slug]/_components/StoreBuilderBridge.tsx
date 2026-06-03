"use client";

import { useEffect } from "react";

type ThemeUpdateMessage = {
  type: "CASHO_THEME_UPDATE";
  cssVars: Record<string, string>;
};

/**
 * Listens for postMessage events from the visual builder and applies CSS variable
 * updates directly on the document root for instant preview without a page reload.
 *
 * Only active when the page is loaded inside an iframe (i.e. the builder preview panel).
 */
export function StoreBuilderBridge() {
  useEffect(() => {
    // Only wire up the bridge when running inside an iframe
    if (typeof window === "undefined" || window === window.top) return;

    function handleMessage(event: MessageEvent<ThemeUpdateMessage>) {
      if (event.data?.type !== "CASHO_THEME_UPDATE") return;
      const { cssVars } = event.data;
      if (!cssVars || typeof cssVars !== "object") return;

      const root = document.documentElement;
      for (const [property, value] of Object.entries(cssVars)) {
        if (typeof value === "string") {
          root.style.setProperty(property, value);
        }
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}
