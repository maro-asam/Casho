"use client";

import { Check, Loader2 } from "lucide-react";
import { currentLocale, tr, type Locale } from "@/lib/i18n/dashboard";
import { useSwitchLocale } from "@/lib/i18n/dashboard/use-switch-locale";
import { Group } from "./settings-ui";

// Language names are always shown in their own language. i18n-ignore
const OPTIONS: { value: Locale; label: string; sample: string }[] = [
  { value: "ar", label: "العربية", sample: "لوحة التحكم من اليمين لليسار" },
  { value: "en", label: "English", sample: "Dashboard, left to right" },
];

export default function LanguageSettings() {
  const active = currentLocale();
  const { switchTo, pending } = useSwitchLocale();

  return (
    <Group
      id="language"
      title={tr("لغة لوحة التحكم")}
      footer={tr("اختار اللغة اللي تشوف بيها لوحة التحكم. الاختيار ده ليك إنت بس، ومش بيغيّر لغة متجرك.")}
    >
      <div role="radiogroup" aria-label={tr("لغة لوحة التحكم")} className="contents">
        {OPTIONS.map((opt) => {
          const selected = opt.value === active;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={pending}
              onClick={() => !selected && switchTo(opt.value)}
              className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-2.5 text-start transition-colors hover:bg-(--fill-3)/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset disabled:opacity-60"
            >
              <span dir={opt.value === "ar" ? "rtl" : "ltr"}>
                <span className="block text-[15px]">{opt.label}</span>
                <span className="block text-[13px] text-muted-foreground">{opt.sample}</span>
              </span>
              {selected ? (
                <Check className="size-5 shrink-0 text-primary" strokeWidth={2.6} />
              ) : pending ? (
                <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
              ) : null}
            </button>
          );
        })}
      </div>
    </Group>
  );
}
