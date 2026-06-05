"use client";

import { useTransition } from "react";
import { Check, Palette } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useBuilder } from "../BuilderContext";
import { STORE_THEMES, type StoreThemeId } from "@/constants/store-themes";
import { UpdateThemeAction } from "@/actions/settings/theme.actions";

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

function BoldPreview() {
  return (
    <div className="overflow-hidden rounded-sm border bg-[#fafaf8] h-20">
      <div className="flex h-5 items-center border-b border-[#e5e0d9] px-1.5 gap-1">
        <div className="h-2 w-6 bg-black/20" />
        <div className="flex-1" />
        <div className="h-3 w-4 bg-black/10" />
      </div>
      <div className="relative h-9 bg-black">
        <div className="absolute bottom-1 right-1.5 space-y-0.5">
          <div className="h-1.5 w-8 bg-white/80" />
          <div className="h-1 w-5 bg-white/50" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-0.5 p-1">
        {[0,1,2].map(i => <div key={i} style={{aspectRatio:"4/5"}} className="bg-gray-200" />)}
      </div>
    </div>
  );
}

function ElegantPreview() {
  return (
    <div className="overflow-hidden border border-[#e8e0d5] bg-[#faf9f7] h-20">
      <div className="flex h-5 items-center justify-center border-b border-[#e8e0d5] gap-2 px-1.5">
        <div className="h-1 w-4 bg-[#c8b89a]/40" />
        <div className="h-2 w-8 bg-[#9b7d5a]/50" />
        <div className="h-1 w-4 bg-[#c8b89a]/40" />
      </div>
      <div className="flex h-9 items-center justify-center bg-[#d6cfc4]">
        <div className="space-y-0.5 text-center">
          <div className="mx-auto h-1 w-8 bg-[#9b7d5a]/60" />
          <div className="mx-auto h-2 w-12 bg-[#5a4535]/70" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1 px-1 pb-1 pt-0.5">
        {[0,1,2].map(i => <div key={i} style={{aspectRatio:"3/4"}} className="bg-[#ede8e1]" />)}
      </div>
    </div>
  );
}

function ModernPreview() {
  return (
    <div className="overflow-hidden rounded-xl border bg-[#f8f9fb] h-20">
      <div className="flex h-5 items-center border-b bg-white px-1.5 gap-1">
        <div className="h-2 w-6 rounded-full bg-indigo-400/40" />
        <div className="flex-1" />
        <div className="h-3 w-4 rounded-lg bg-indigo-100" />
      </div>
      <div className="relative mx-1.5 mt-1 h-8 overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600">
        <div className="absolute bottom-1 left-1 h-2.5 w-7 rounded-full bg-white/95" />
      </div>
      <div className="grid grid-cols-3 gap-1 px-1.5 pb-1 pt-0.5">
        {[0,1,2].map(i => <div key={i} className="aspect-square rounded-lg border border-gray-100 bg-white p-0.5"><div className="aspect-square rounded-md bg-indigo-50" /></div>)}
      </div>
    </div>
  );
}

function MinimalPreview() {
  return (
    <div className="overflow-hidden border border-neutral-200 bg-white h-20">
      <div className="flex h-5 items-center border-b border-neutral-200 px-1.5 gap-1">
        <div className="h-1.5 w-7 bg-neutral-800/40" />
        <div className="flex-1" />
        <div className="h-3 w-3 bg-neutral-100" />
      </div>
      <div className="flex flex-col items-center justify-center gap-0.5 py-2.5">
        <div className="h-1 w-10 bg-neutral-300" />
        <div className="h-3 w-14 bg-neutral-800/80" />
      </div>
      <div className="grid grid-cols-4 gap-1 px-1.5 pb-1">
        {[0,1,2,3].map(i => <div key={i} className="aspect-square bg-neutral-100" />)}
      </div>
    </div>
  );
}

function DarkPreview() {
  return (
    <div className="overflow-hidden rounded-lg border border-[#2e2e45] bg-[#0d0d14] h-20">
      <div className="flex h-5 items-center border-b border-[#2e2e45] bg-[#13131f] px-1.5 gap-1">
        <div className="h-2 w-6 rounded-sm bg-[#a78bfa]/40" />
        <div className="flex-1" />
        <div className="h-3 w-4 rounded-md bg-[#1e1e30]" />
      </div>
      <div className="relative h-9 bg-[#0d0d14]" style={{background:"radial-gradient(ellipse 80% 70% at 50% 0%, rgba(167,139,250,0.15), #0d0d14)"}}>
        <div className="absolute bottom-1.5 right-2 space-y-0.5">
          <div className="h-1.5 w-8 rounded-sm bg-[#f1f5f9]/80" />
          <div className="h-3.5 w-8 rounded-md bg-[#a78bfa]" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1 p-1">
        {[0,1,2].map(i => <div key={i} className="aspect-square rounded-lg border border-[#2e2e45] bg-[#16162a]" />)}
      </div>
    </div>
  );
}

const PREVIEWS: Record<StoreThemeId, React.FC> = {
  default: DefaultPreview,
  bold: BoldPreview,
  elegant: ElegantPreview,
  modern: ModernPreview,
  minimal: MinimalPreview,
  dark: DarkPreview,
};

// ─── Panel ────────────────────────────────────────────────────────────────────

export default function ThemePanel() {
  const { storeId, currentThemeId, reloadPreview } = useBuilder();
  const [isPending, startTransition] = useTransition();
  const activeTheme = (currentThemeId as StoreThemeId) || "default";

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
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-2">
          {Object.values(STORE_THEMES).map((theme) => {
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
