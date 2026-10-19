"use client";

import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "../../_i18n/LanguageContext";

export default function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLang();

  return (
    <button
      type="button"
      onClick={() => setLang(lang === "ar" ? "en" : "ar")}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-medium text-(--al-text)/70 transition-colors hover:bg-black/5 dark:hover:bg-white/10 hover:text-(--al-text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      aria-label={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
      title={lang === "ar" ? "English" : "العربية"}
    >
      <Globe className="size-4" />
      <span className="leading-none">{lang === "ar" ? "EN" : "ع"}</span>
    </button>
  );
}
