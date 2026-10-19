"use client";

import { Check, Languages, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { currentLocale, tr, type Locale } from "@/lib/i18n/dashboard";
import { useSwitchLocale } from "@/lib/i18n/dashboard/use-switch-locale";

// Language names are always shown in their own language. i18n-ignore
const OPTIONS: { value: Locale; label: string; sample: string }[] = [
  { value: "ar", label: "العربية", sample: "لوحة التحكم من اليمين لليسار" },
  { value: "en", label: "English", sample: "Dashboard, left to right" },
];

export default function LanguageSettings() {
  const active = currentLocale();
  const { switchTo, pending } = useSwitchLocale();

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-semibold text-primary">
          <Languages className="size-5" />
          {tr("لغة لوحة التحكم")}
        </CardTitle>
        <CardDescription>{tr("اختار اللغة اللي تشوف بيها لوحة التحكم. الاختيار ده ليك إنت بس، ومش بيغيّر لغة متجرك.")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div role="radiogroup" aria-label={tr("لغة لوحة التحكم")} className="grid gap-3 sm:grid-cols-2">
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
                dir={opt.value === "ar" ? "rtl" : "ltr"}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl border p-4 text-start transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60",
                  selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                )}
              >
                <span>
                  <span className="block text-base font-semibold">{opt.label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{opt.sample}</span>
                </span>
                {selected ? (
                  <span className="grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3.5" />
                  </span>
                ) : pending ? (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                ) : null}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
