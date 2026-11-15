"use client";

import { Suspense, use, useEffect, type ReactNode } from "react";
import { Direction } from "radix-ui";
import { StoreLocaleContext } from "./context";
import { ensureStoreEnglish } from "./load-english";
import { hasStoreEnglish, setBrowserStoreLocale, storeDir, type StoreLocale } from "./runtime";

/**
 * Wraps the storefront (store layout). Sets the runtime locale, Radix
 * direction, and the <html> dir/lang so portalled content (sheets, dialogs,
 * toasts) follows the store's language.
 */
export default function StorefrontI18nProvider({ locale, children }: { locale: StoreLocale; children: ReactNode }) {
  if (typeof window !== "undefined") setBrowserStoreLocale(locale);

  const dir = storeDir(locale);

  useEffect(() => {
    const html = document.documentElement;
    const prev = { dir: html.dir, lang: html.lang };
    html.dir = dir;
    html.lang = locale;
    return () => {
      html.dir = prev.dir;
      html.lang = prev.lang;
    };
  }, [dir, locale]);

  return (
    <StoreLocaleContext.Provider value={locale}>
      <Direction.Provider dir={dir}>
        {locale === "en" ? (
          // While hydrating, React keeps the server-rendered English HTML
          // inside this boundary until the dictionary chunk has loaded.
          <Suspense fallback={null}>
            <EnglishReady>{children}</EnglishReady>
          </Suspense>
        ) : (
          children
        )}
      </Direction.Provider>
    </StoreLocaleContext.Provider>
  );
}

/** English strings load on demand, so Arabic stores never download them. */
function EnglishReady({ children }: { children: ReactNode }) {
  if (!hasStoreEnglish()) use(ensureStoreEnglish());
  return children;
}
