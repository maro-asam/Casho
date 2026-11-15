"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { UpdateStoreLanguageAction } from "@/actions/settings/theme.actions";
import { tr, trv } from "@/lib/i18n/dashboard";
import { Group } from "./settings-ui";

type StoreLanguage = "ar" | "en";

// Language names are always shown in their own language. i18n-ignore
const OPTIONS: { value: StoreLanguage; label: string; sample: string }[] = [
  { value: "ar", label: "العربية", sample: "أضف للسلة · من اليمين لليسار" },
  { value: "en", label: "English", sample: "Add to cart · left to right" },
];

/**
 * The language shoppers see the storefront in (text, direction, digits and the
 * default font). Applied live — an open Studio draft gets the same change.
 */
export default function StoreLanguageSettings({ storeId, initial }: { storeId: string; initial: StoreLanguage }) {
  const [language, setLanguage] = useState<StoreLanguage>(initial);
  const [pending, startTransition] = useTransition();

  function pick(next: StoreLanguage) {
    if (next === language || pending) return;
    const previous = language;
    setLanguage(next);
    startTransition(async () => {
      // Each language has its own font list, so switch to its default font too (like the Studio).
      const result = await UpdateStoreLanguageAction({ storeId, storeLanguage: next, withDefaultFont: true, target: "live" });
      if (!result.success) {
        setLanguage(previous);
        toast.error(trv(result.message));
        return;
      }
      toast.success(tr("لغة المتجر اتغيرت"));
    });
  }

  return (
    <Group
      id="store-language"
      title={tr("لغة المتجر")}
      footer={tr("اللغة اللي عملاءك بيشوفوا بيها المتجر: كل نصوص الثيم، والاتجاه، والأرقام، وصفحات السياسات الجاهزة. الخط بيرجع للخط الافتراضي للغة، وتقدر تغيّره من الاستوديو. أسماء منتجاتك وأوصافها بتفضل زي ما كتبتها.")}
    >
      <div role="radiogroup" aria-label={tr("لغة المتجر")} className="contents">
        {OPTIONS.map((opt) => {
          const selected = opt.value === language;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={pending}
              onClick={() => pick(opt.value)}
              className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-2.5 text-start transition-colors hover:bg-(--fill-3)/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset disabled:opacity-60"
            >
              <span dir={opt.value === "ar" ? "rtl" : "ltr"}>
                <span className="block text-[15px]">{opt.label}</span>
                <span className="block text-[13px] text-muted-foreground">{opt.sample}</span>
              </span>
              {pending && selected ? (
                <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
              ) : selected ? (
                <Check className="size-5 shrink-0 text-primary" strokeWidth={2.6} />
              ) : null}
            </button>
          );
        })}
      </div>
    </Group>
  );
}
