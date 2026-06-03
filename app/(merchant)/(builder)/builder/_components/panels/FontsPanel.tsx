"use client";

import { useTransition, useState } from "react";
import { Check, Type, Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useBuilder } from "../BuilderContext";
import { ARABIC_FONTS } from "@/constants/arabic-fonts";
import { ENGLISH_FONTS } from "@/constants/english-fonts";
import { UpdateStoreFontAction } from "@/actions/store/update-store-font.actions";
import { UpdateStoreLanguageAction } from "@/actions/store/update-store-language.actions";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function FontsPanel() {
  const { storeId, currentFontId, storeLanguage, reloadPreview } = useBuilder();
  const [isPending, startTransition] = useTransition();
  const [isLangPending, startLangTransition] = useTransition();
  const activeLanguage = (storeLanguage ?? "ar") as "ar" | "en";
  const [tab, setTab] = useState<"arabic" | "english">(
    Object.keys(ENGLISH_FONTS).includes(currentFontId) ? "english" : "arabic"
  );

  const handleFontChange = (fontId: string) => {
    if (fontId === currentFontId) return;
    startTransition(async () => {
      const result = await UpdateStoreFontAction({ storeId, fontId });
      if (result.success) {
        toast.success("تم تحديث الخط");
        reloadPreview();
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleLanguageChange = (lang: "ar" | "en") => {
    if (lang === activeLanguage || isLangPending) return;
    startLangTransition(async () => {
      const result = await UpdateStoreLanguageAction({ storeId, storeLanguage: lang });
      if (result.success) {
        toast.success(result.message);
        const defaultFont = lang === "en" ? "inter" : "cairo";
        await UpdateStoreFontAction({ storeId, fontId: defaultFont });
        reloadPreview();
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-4 py-3 bg-background">
        <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
          <Type className="size-3.5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">الخطوط</h2>
          <p className="text-[10px] text-muted-foreground">اختر خط واتجاه المتجر</p>
        </div>
      </div>

      {/* Language switcher */}
      <div className="flex items-center justify-between border-b px-3 py-2.5 bg-muted/30">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Globe className="size-3.5" />
          <span>اتجاه المتجر</span>
        </div>
        <div className="flex items-center gap-0.5 rounded-lg border bg-background p-0.5">
          <button
            type="button"
            disabled={isLangPending}
            onClick={() => handleLanguageChange("ar")}
            className={cn(
              "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all",
              "disabled:pointer-events-none disabled:opacity-60",
              activeLanguage === "ar"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {isLangPending && activeLanguage === "en" && <Loader2 className="size-3 animate-spin" />}
            عربي
          </button>
          <button
            type="button"
            disabled={isLangPending}
            onClick={() => handleLanguageChange("en")}
            className={cn(
              "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all",
              "disabled:pointer-events-none disabled:opacity-60",
              activeLanguage === "en"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {isLangPending && activeLanguage === "ar" && <Loader2 className="size-3 animate-spin" />}
            EN
          </button>
        </div>
      </div>

      {/* Font tabs */}
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "arabic" | "english")}
        className="flex flex-col flex-1 min-h-0"
      >
        <TabsList className="w-full rounded-none border-b h-9 shrink-0">
          <TabsTrigger value="arabic" className="flex-1 text-xs rounded-none">عربية</TabsTrigger>
          <TabsTrigger value="english" className="flex-1 text-xs rounded-none" dir="ltr">English</TabsTrigger>
        </TabsList>

        <TabsContent value="arabic" className="flex-1 overflow-y-auto p-3 space-y-2 mt-0">
          {Object.values(ARABIC_FONTS).map((font) => {
            const isActive = currentFontId === font.id;
            return (
              <button
                key={font.id}
                type="button"
                onClick={() => handleFontChange(font.id)}
                disabled={isPending}
                className={cn(
                  "w-full rounded-xl border p-3 text-right transition-all duration-150",
                  "disabled:pointer-events-none disabled:opacity-60",
                  isActive
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border bg-background hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-md",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isActive && <Check className="size-3.5 text-primary shrink-0" />}
                    <span className="text-xs font-medium">{font.name}</span>
                  </div>
                  {isActive && <span className="text-[10px] text-primary font-medium">مُفعّل</span>}
                </div>
                <p
                  className="mt-1.5 text-right leading-relaxed text-sm text-foreground/80"
                  style={{ fontFamily: font.family }}
                >
                  {font.sample ?? "متجرك الإلكتروني — تسوّق بكل سهولة"}
                </p>
              </button>
            );
          })}
        </TabsContent>

        <TabsContent value="english" className="flex-1 overflow-y-auto p-3 space-y-2 mt-0" dir="ltr">
          {Object.values(ENGLISH_FONTS).map((font) => {
            const isActive = currentFontId === font.id;
            return (
              <button
                key={font.id}
                type="button"
                onClick={() => handleFontChange(font.id)}
                disabled={isPending}
                className={cn(
                  "w-full rounded-xl border p-3 text-left transition-all duration-150",
                  "disabled:pointer-events-none disabled:opacity-60",
                  isActive
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border bg-background hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-md",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isActive && <Check className="size-3.5 text-primary shrink-0" />}
                    <span className="text-xs font-medium">{font.name}</span>
                  </div>
                  {isActive && <span className="text-[10px] text-primary font-medium">Active</span>}
                </div>
                <p
                  className="mt-1.5 text-left leading-relaxed text-sm text-foreground/80"
                  style={{ fontFamily: font.family }}
                >
                  {font.sample}
                </p>
              </button>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
