"use client";

import { useTransition } from "react";
import { Check, Type } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useBuilder } from "../BuilderContext";
import { ARABIC_FONTS } from "@/constants/arabic-fonts";
import { UpdateStoreFontAction } from "@/actions/store/update-store-font.actions";

export default function FontsPanel() {
  const { storeId, currentFontId, reloadPreview } = useBuilder();
  const [isPending, startTransition] = useTransition();

  const handleChange = (fontId: string) => {
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

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-4 py-3 bg-background">
        <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
          <Type className="size-3.5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">الخطوط</h2>
          <p className="text-[10px] text-muted-foreground">اختر خط المتجر</p>
        </div>
      </div>

      {/* Font list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {Object.values(ARABIC_FONTS).map((font) => {
          const isActive = currentFontId === font.id;
          return (
            <button
              key={font.id}
              type="button"
              onClick={() => handleChange(font.id)}
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
              {/* Font preview */}
              <p
                className="mt-1.5 text-right leading-relaxed text-sm text-foreground/80"
                style={{ fontFamily: font.family }}
              >
                {font.sample ?? "متجرك الإلكتروني — تسوّق بكل سهولة"}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
