"use client";

import { useState, useTransition } from "react";
import { Check, Palette } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useBuilder } from "../BuilderContext";
import { STORE_THEMES, type StoreThemeId } from "@/constants/store-themes";
import { UpdateThemeAction } from "@/actions/settings/theme.actions";
import ThemeCategoryFilter, {
  filterThemesByCategory,
  type ThemeCategoryFilterValue,
} from "@/components/common/ThemeCategoryFilter";

// ─── Inline previews (compact 80px cards) ────────────────────────────────────

function DefaultPreview() {
  return (
    <div className="overflow-hidden rounded-lg border bg-white h-20">
      <div className="flex h-5 items-center border-b bg-white px-1.5 gap-1">
        <div className="h-2 w-6 rounded-sm bg-blue-500/30" />
        <div className="flex-1" />
        <div className="h-3 w-4 rounded-sm bg-gray-100" />
      </div>
      <div className="mx-1.5 mt-1.5 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700" />
      <div className="grid grid-cols-3 gap-1 px-1.5 pt-1">
        {[0,1,2].map(i => <div key={i} className="aspect-square rounded-md bg-gray-100" />)}
      </div>
    </div>
  );
}

function RiwaqPreview() {
  return (
    <div className="h-20 overflow-hidden rounded-lg border bg-[#f2ece1]">
      <div className="flex h-5 items-center justify-center border-b border-[#1d1a16]">
        <div className="h-2 w-8 bg-[#1d1a16]" />
      </div>
      <div className="flex items-end justify-between gap-1 px-1.5 pt-1.5">
        <div className="space-y-0.5 pb-0.5">
          <div className="h-1.5 w-10 bg-[#1d1a16]" />
          <div className="h-1.5 w-7 bg-[#a8432a]" />
        </div>
        <div className="h-9 w-6 rounded-t-full bg-[#d8c7b0]" />
      </div>
      <div className="mt-1 grid grid-cols-3 border-t border-[#d6ccbb]">
        {[0,1,2].map(i => <div key={i} className="m-1 aspect-square bg-[#eae3d6]" />)}
      </div>
    </div>
  );
}

function MadaPreview() {
  return (
    <div className="h-20 overflow-hidden rounded-lg border bg-[#f7f7f4]">
      <div className="flex h-5 items-center justify-between bg-white px-1.5">
        <div className="h-2 w-7 rounded-full bg-[#123b30]" />
        <div className="h-3 w-5 rounded-full bg-[#123b30]" />
      </div>
      <div className="relative mx-1.5 mt-1 h-7 rounded-md bg-[#2c4a40]">
        <div className="absolute bottom-1 end-1 h-2 w-5 rounded-full bg-[#d5ee6a]" />
      </div>
      <div className="grid grid-cols-3 gap-1 px-1.5 pt-1">
        {[0,1,2].map(i => <div key={i} className="aspect-square rounded-md bg-[#eceee8]" />)}
      </div>
    </div>
  );
}

const PREVIEWS: Record<StoreThemeId, React.FC> = {
  default: DefaultPreview,
  riwaq: RiwaqPreview,
  mada: MadaPreview,
};

// ─── Panel ────────────────────────────────────────────────────────────────────

export default function ThemePanel() {
  const { storeId, currentThemeId, reloadPreview } = useBuilder();
  const [isPending, startTransition] = useTransition();
  const [category, setCategory] = useState<ThemeCategoryFilterValue>("all");
  const activeTheme = (currentThemeId as StoreThemeId) || "default";
  const allThemes = Object.values(STORE_THEMES);

  const handleChange = (themeId: StoreThemeId) => {
    if (themeId === activeTheme) return;
    startTransition(async () => {
      const result = await UpdateThemeAction({ storeId, themeId });
      if (result.success) { toast.success("تم تغيير الثيم"); reloadPreview(); }
      else toast.error(result.message);
    });
  };

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-4 py-3 bg-background">
        <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
          <Palette className="size-3.5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">الثيم</h2>
          <p className="text-[10px] text-muted-foreground">اختر التصميم الأساسي للمتجر</p>
        </div>
      </div>

      {/* Theme grid */}
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        <ThemeCategoryFilter themes={allThemes} value={category} onChange={setCategory} compact />
        <div className="grid grid-cols-2 gap-2">
          {filterThemesByCategory(allThemes, category).map((theme) => {
            const isActive = activeTheme === theme.id;
            const Preview = PREVIEWS[theme.id];
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleChange(theme.id)}
                disabled={isPending}
                className={cn(
                  "relative overflow-hidden rounded-xl border p-2 text-right transition-all duration-200",
                  "disabled:pointer-events-none disabled:opacity-60",
                  isActive
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border bg-background hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5",
                )}
              >
                {isActive && (
                  <div className="absolute left-2 top-2 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm z-10">
                    <Check className="size-2.5" />
                  </div>
                )}
                <Preview />
                <div className="mt-1.5 flex items-center justify-between">
                  <p className="text-xs font-semibold">{theme.name}</p>
                  {isActive && <span className="text-[10px] font-medium text-primary">مُفعّل</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
