"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { UpdateStoreFontAction } from "@/actions/settings/theme.actions";
import { appleButton } from "@/components/saas-page";
import { ARABIC_FONT_LIST } from "@/constants/arabic-fonts";
import { ENGLISH_FONT_LIST } from "@/constants/english-fonts";
import { cn } from "@/lib/utils";
import { tr, trv } from "@/lib/i18n/dashboard";

export default function FontsAppClient({ storeId, activeId, language }: { storeId: string; activeId: string; language: "ar" | "en" }) {
  const router = useRouter();
  const [installing, setInstalling] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const english = language === "en";
  // Only the store language's fonts: an English face can't draw Arabic text.
  const fonts = english ? ENGLISH_FONT_LIST : ARABIC_FONT_LIST;

  function install(id: string, name: string) {
    setInstalling(id);
    startTransition(async () => {
      const res = await UpdateStoreFontAction({ storeId, fontId: id });
      if (res.success) {
        toast.success(tr("خط {0} اتثبت على متجرك", name));
        router.refresh();
      } else {
        toast.error(trv(res.message));
      }
      setInstalling(null);
    });
  }

  return (
    <div className="space-y-3">
      {/* Every candidate, so each card previews in its own face. */}
      {fonts.map((f) => (
        <link key={f.id} rel="stylesheet" href={f.googleUrl} />
      ))}

      <p className="px-1 text-[13px] text-muted-foreground">
        {english
          ? tr("متجرك بالإنجليزي، فدي الخطوط الإنجليزي. الخط بيتطبق على كل كلام المتجر.")
          : tr("متجرك بالعربي، فدي الخطوط العربي. الخط بيتطبق على كل كلام المتجر.")}
      </p>

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {fonts.map((f) => {
          const installed = f.id === activeId;
          return (
            <li key={f.id} className={cn("apple-card flex flex-col gap-4 p-5", installed && "ring-2 ring-primary")}>
              <div className="min-w-0 flex-1 space-y-2" dir={english ? "ltr" : "rtl"}>
                <p className="truncate text-[26px] leading-[38px]" style={{ fontFamily: f.family }}>
                  {f.sample}
                </p>
                <p className="text-[15px] leading-6 text-muted-foreground" style={{ fontFamily: f.family }}>
                  {/* i18n-ignore: sample text in the store's own language */}
                  {english ? "0123456789 · Free shipping on all orders" : "٠١٢٣٤٥٦٧٨٩ · شحن مجاني لكل الطلبات"}
                </p>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold" dir="ltr">
                  {f.name}
                </span>
                {installed ? (
                  <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary/10 px-3.5 text-[15px] font-semibold text-primary">
                    <Check className="size-4" strokeWidth={3} />
                    {tr("مثبت")}
                  </span>
                ) : (
                  <button type="button" disabled={pending} onClick={() => install(f.id, f.name)} className={appleButton.tinted}>
                    {installing === f.id && <Loader2 className="size-4 animate-spin" />}
                    {tr("تثبيت")}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
