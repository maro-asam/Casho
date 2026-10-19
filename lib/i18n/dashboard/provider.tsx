"use client";

import { Suspense, use, useEffect, type ReactNode } from "react";
import { Direction } from "radix-ui";
import { LocaleContext } from "./context";
import { ensureEnglish } from "./load-english";
import { hasEnglish, setBrowserLocale, type Locale } from "./runtime";

/**
 * Wraps every merchant workspace (dashboard, POS, onboarding, print).
 * Sets the runtime locale, Radix direction, and the <html> dir/lang so
 * portalled content (dialogs, sheets, menus) follows the dashboard language.
 */
export default function DashboardI18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  if (typeof window !== "undefined") setBrowserLocale(locale);

  const dir = locale === "ar" ? "rtl" : "ltr";

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
    <LocaleContext.Provider value={locale}>
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
    </LocaleContext.Provider>
  );
}

/** English strings load on demand, so Arabic users never download them. */
function EnglishReady({ children }: { children: ReactNode }) {
  if (!hasEnglish()) use(ensureEnglish());
  return children;
}
