"use client";

import { useTransition } from "react";
import { Check, Loader2, Type } from "lucide-react";
import { toast } from "sonner";

import { ARABIC_FONT_LIST, type ArabicFontId } from "@/constants/arabic-fonts";
import { UpdateStoreFontAction } from "@/actions/store/update-store-font.actions";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Props = {
  storeId: string;
  currentFontId?: string | null;
};

export default function StoreFontPicker({ storeId, currentFontId }: Props) {
  const [isPending, startTransition] = useTransition();
  const activeId = (currentFontId ?? "cairo") as ArabicFontId;

  function selectFont(fontId: ArabicFontId) {
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

        {/* Load all Arabic fonts for preview */}
        {ARABIC_FONT_LIST.map((font) => (
          <link key={font.id} rel="stylesheet" href={font.googleUrl} />
        ))}

        {/* Font Grid */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {ARABIC_FONT_LIST.map((font) => {
            const isActive = font.id === activeId;
            return (
              <button
                key={font.id}
                type="button"
                disabled={isPending}
                onClick={() => selectFont(font.id as ArabicFontId)}
                className={cn(
                  "group relative flex flex-col gap-2 rounded-2xl border p-4 text-right transition-all duration-200",
                  "disabled:pointer-events-none disabled:opacity-60",
                  isActive
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-md"
                    : "border-border bg-card hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5",
                )}
              >
                {/* Font sample */}
                <span
                  className="text-xl leading-relaxed text-foreground"
                  style={{ fontFamily: font.family }}
                >
                  {font.sample}
                </span>

                {/* Footer row */}
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

                {/* Pending overlay */}
                {isPending && isActive && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-background/60 backdrop-blur-sm">
                    <Loader2 className="size-5 animate-spin text-primary" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
