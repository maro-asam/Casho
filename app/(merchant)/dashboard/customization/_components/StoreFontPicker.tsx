"use client";

import { useTransition, useState } from "react";
import { Check, Loader2, Type, Globe } from "lucide-react";
import { toast } from "sonner";

import { ARABIC_FONT_LIST, type ArabicFontId } from "@/constants/arabic-fonts";
import { ENGLISH_FONT_LIST, type EnglishFontId } from "@/constants/english-fonts";
import { UpdateStoreFontAction } from "@/actions/store/update-store-font.actions";
import { UpdateStoreLanguageAction } from "@/actions/store/update-store-language.actions";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Props = {
  storeId: string;
  currentFontId?: string | null;
  currentLanguage?: string | null;
};

export default function StoreFontPicker({ storeId, currentFontId, currentLanguage }: Props) {
  const [isPending, startTransition] = useTransition();
  const [isLangPending, startLangTransition] = useTransition();
  const activeLanguage = (currentLanguage ?? "ar") as "ar" | "en";
  const activeId = currentFontId ?? (activeLanguage === "en" ? "inter" : "cairo");

  function selectFont(fontId: string) {
    if (fontId === activeId || isPending) return;
    startTransition(async () => {
      const result = await UpdateStoreFontAction({ storeId, fontId });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  function switchLanguage(lang: "ar" | "en") {
    if (lang === activeLanguage || isLangPending) return;
    startLangTransition(async () => {
      const result = await UpdateStoreLanguageAction({ storeId, storeLanguage: lang });
      if (result.success) {
        toast.success(result.message);
        // Auto-switch font to a sensible default for the new language
        const defaultFont = lang === "en" ? "inter" : "cairo";
        if (!currentFontId || (lang === "en" && activeLanguage === "ar") || (lang === "ar" && activeLanguage === "en")) {
          await UpdateStoreFontAction({ storeId, fontId: defaultFont });
        }
      } else {
        toast.error(result.message);
      }
    });
  }

  const [tab, setTab] = useState<"arabic" | "english">(
    ENGLISH_FONT_LIST.some(f => f.id === activeId) ? "english" : "arabic"
  );

  return (
    <Card dir="rtl">
      <CardContent className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Type className="size-4" />
          </div>
          <div>
            <h2 className="font-semibold">خط المتجر</h2>
            <p className="text-xs text-muted-foreground">
              اختر الخط المناسب لهوية متجرك — يُطبَّق على كل النصوص تلقائياً
            </p>
          </div>
        </div>

        {/* Language Toggle */}
        <div className="flex items-center justify-between rounded-xl border bg-muted/40 p-3">
          <div className="flex items-center gap-2">
            <Globe className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">لغة المتجر واتجاهه</span>
          </div>
          <div className="flex items-center gap-1 rounded-lg border bg-background p-1">
            <button
              type="button"
              disabled={isLangPending}
              onClick={() => switchLanguage("ar")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                "disabled:pointer-events-none disabled:opacity-60",
                activeLanguage === "ar"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {isLangPending && activeLanguage === "en" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : null}
              عربي ←
            </button>
            <button
              type="button"
              disabled={isLangPending}
              onClick={() => switchLanguage("en")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                "disabled:pointer-events-none disabled:opacity-60",
                activeLanguage === "en"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {isLangPending && activeLanguage === "ar" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : null}
              → English
            </button>
          </div>
        </div>

        {/* Font Tabs */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as "arabic" | "english")}>
          <TabsList className="w-full">
            <TabsTrigger value="arabic" className="flex-1">خطوط عربية</TabsTrigger>
            <TabsTrigger value="english" className="flex-1" dir="ltr">English Fonts</TabsTrigger>
          </TabsList>

          {/* Preload all font stylesheets */}
          {ARABIC_FONT_LIST.map((font) => (
            <link key={font.id} rel="stylesheet" href={font.googleUrl} />
          ))}
          {ENGLISH_FONT_LIST.map((font) => (
            <link key={font.id} rel="stylesheet" href={font.googleUrl} />
          ))}

          {/* Arabic fonts */}
          <TabsContent value="arabic">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 mt-3">
              {ARABIC_FONT_LIST.map((font) => {
                const isActive = font.id === activeId;
                return (
                  <button
                    key={font.id}
                    type="button"
                    disabled={isPending}
                    onClick={() => selectFont(font.id)}
                    className={cn(
                      "group relative flex flex-col gap-2 rounded-2xl border p-4 text-right transition-all duration-200",
                      "disabled:pointer-events-none disabled:opacity-60",
                      isActive
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-md"
                        : "border-border bg-card hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5",
                    )}
                  >
                    <span
                      className="text-xl leading-relaxed text-foreground"
                      style={{ fontFamily: font.family }}
                    >
                      {font.sample}
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground" dir="ltr">
                        {font.name}
                      </span>
                      {isActive ? (
                        <Badge className="gap-1 bg-primary/10 px-2 py-0 text-[11px] text-primary hover:bg-primary/10">
                          <Check className="size-2.5" />
                          مُفعّل
                        </Badge>
                      ) : (
                        <span className="text-[11px] text-muted-foreground transition-colors group-hover:text-primary">
                          تفعيل ←
                        </span>
                      )}
                    </div>
                    {isPending && isActive && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-background/60 backdrop-blur-sm">
                        <Loader2 className="size-5 animate-spin text-primary" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </TabsContent>

          {/* English fonts */}
          <TabsContent value="english">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 mt-3" dir="ltr">
              {ENGLISH_FONT_LIST.map((font) => {
                const isActive = font.id === activeId;
                return (
                  <button
                    key={font.id}
                    type="button"
                    disabled={isPending}
                    onClick={() => selectFont(font.id)}
                    className={cn(
                      "group relative flex flex-col gap-2 rounded-2xl border p-4 text-left transition-all duration-200",
                      "disabled:pointer-events-none disabled:opacity-60",
                      isActive
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-md"
                        : "border-border bg-card hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5",
                    )}
                  >
                    <span
                      className="text-xl leading-relaxed text-foreground"
                      style={{ fontFamily: font.family }}
                    >
                      {font.sample}
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {font.name}
                      </span>
                      {isActive ? (
                        <Badge className="gap-1 bg-primary/10 px-2 py-0 text-[11px] text-primary hover:bg-primary/10">
                          <Check className="size-2.5" />
                          Active
                        </Badge>
                      ) : (
                        <span className="text-[11px] text-muted-foreground transition-colors group-hover:text-primary">
                          → Select
                        </span>
                      )}
                    </div>
                    {isPending && isActive && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-background/60 backdrop-blur-sm">
                        <Loader2 className="size-5 animate-spin text-primary" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
