"use client";

import { useLang } from "../../_i18n/LanguageContext";

export default function LanguageToggle() {
  const { lang, setLang } = useLang();

  return (
    <button
      onClick={() => setLang(lang === "ar" ? "en" : "ar")}
      className="flex h-9 items-center gap-0.5 rounded-lg border border-border/50 bg-muted/40 px-2.5 text-xs font-bold text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
      aria-label="Toggle language"
    >
      <span className={lang === "ar" ? "text-foreground" : "text-foreground/40"}>
        ع
      </span>
      <span className="mx-0.5 text-border">/</span>
      <span className={lang === "en" ? "text-foreground" : "text-foreground/40"}>
        EN
      </span>
    </button>
  );
}
