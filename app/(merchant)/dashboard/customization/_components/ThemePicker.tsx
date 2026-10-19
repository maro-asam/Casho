"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, Palette } from "lucide-react";

import { STORE_THEMES, type StoreThemeId } from "@/constants/store-themes";
import { cn } from "@/lib/utils";
import { UpdateThemeAction } from "@/actions/settings/theme.actions";
import { Card, CardContent } from "@/components/ui/card";
import ThemeCategoryFilter, {
  filterThemesByCategory,
  type ThemeCategoryFilterValue,
} from "@/components/common/ThemeCategoryFilter";
import { tdir, tr, trv } from "@/lib/i18n/dashboard";

type ThemePickerProps = {
  storeId: string;
  currentThemeId?: string | null;
};

// ─── 1. Default ───────────────────────────────────────────────────
function DefaultThemePreview() {
  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <div className="flex h-7 items-center justify-between border-b bg-white px-2.5">
        <div className="h-3 w-10 rounded-sm bg-blue-500/30" />
        <div className="flex gap-1.5">
          <div className="h-1.5 w-7 rounded-full bg-gray-200" />
          <div className="h-1.5 w-7 rounded-full bg-gray-200" />
        </div>
        <div className="h-5 w-6 rounded-md bg-gray-100" />
      </div>
      <div className="mx-2 mt-2 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700" />
      <div className="grid grid-cols-3 gap-1.5 p-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="aspect-square rounded-xl bg-gray-100" />
            <div className="h-1.5 rounded-full bg-gray-200" />
            <div className="h-1.5 w-2/3 rounded-full bg-blue-400/40" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 2. Riwaq ─────────────────────────────────────────────────────
function RiwaqThemePreview() {
  return (
    <div className="overflow-hidden rounded-xl border bg-[#f2ece1]">
      <div className="flex h-7 items-center justify-between border-b border-[#1d1a16] px-2.5">
        <div className="h-1.5 w-7 rounded-full bg-[#1d1a16]/30" />
        <div className="h-2.5 w-12 bg-[#1d1a16]" />
        <div className="h-1.5 w-7 rounded-full bg-[#1d1a16]/30" />
      </div>
      <div className="grid grid-cols-[1fr_auto] items-end gap-2 px-2.5 pt-2">
        <div className="space-y-1 pb-1">
          <div className="h-2.5 w-4/5 bg-[#1d1a16]" />
          <div className="h-2.5 w-3/5 bg-[#1d1a16]" />
          <div className="mt-1.5 h-2.5 w-8 bg-[#a8432a]" />
        </div>
        <div className="h-14 w-10 rounded-t-full bg-[#d8c7b0]" />
      </div>
      <div className="mt-2 grid grid-cols-3 border-t border-[#d6ccbb]">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-1 border-s border-[#d6ccbb] p-1.5 first:border-s-0">
            <div className="aspect-[3/4] bg-[#eae3d6]" />
            <div className="h-1 w-3/4 bg-[#1d1a16]/40" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 3. Mada ──────────────────────────────────────────────────────
function MadaThemePreview() {
  return (
    <div className="overflow-hidden rounded-xl border bg-[#f7f7f4]">
      <div className="flex h-7 items-center justify-between bg-white px-2.5">
        <div className="h-2.5 w-10 rounded-full bg-[#123b30]" />
        <div className="flex gap-1">
          <div className="h-1.5 w-6 rounded-full bg-gray-300" />
          <div className="h-1.5 w-6 rounded-full bg-gray-300" />
        </div>
        <div className="h-4 w-8 rounded-full bg-[#123b30]" />
      </div>
      <div className="relative mx-2 mt-2 h-14 overflow-hidden rounded-xl bg-[#2c4a40]">
        <div className="absolute bottom-2 start-2 h-2 w-14 rounded-full bg-white/90" />
        <div className="absolute bottom-2 end-2 h-3 w-8 rounded-full bg-[#d5ee6a]" />
      </div>
      <div className="grid grid-cols-3 gap-1.5 p-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="relative aspect-[3/4] rounded-lg bg-[#eceee8]">
              {i === 0 && <div className="absolute start-1 top-1 h-1.5 w-4 rounded-full bg-[#d5ee6a]" />}
            </div>
            <div className="h-1.5 w-3/4 rounded-full bg-gray-300" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 4. Casho Dune ────────────────────────────────────────────────
function DuneThemePreview() {
  return (
    <div className="overflow-hidden rounded-xl border bg-[#f7f7f7]">
      <div className="h-2 bg-[#785c43]" />
      <div className="relative h-16 bg-[#5d5248]">
        <div className="absolute inset-x-2.5 top-1.5 flex items-center justify-between">
          <div className="h-2 w-8 rounded-sm bg-white/90" />
          <div className="flex gap-1">
            <div className="h-1 w-5 rounded-full bg-white/70" />
            <div className="h-1 w-5 rounded-full bg-white/70" />
          </div>
          <div className="size-2 rounded-full bg-white/80" />
        </div>
        <div className="absolute inset-x-0 bottom-2 flex flex-col items-center gap-1">
          <div className="h-2 w-16 bg-white/90" />
          <div className="h-2.5 w-9 rounded-full bg-white" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5 p-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="relative aspect-square w-full bg-[#f0eee9]">
              {i === 0 && <div className="absolute start-0 top-0 h-1.5 w-4 bg-[#8b6f47]" />}
            </div>
            <div className="h-1 w-3/4 rounded-full bg-[#2a2a28]/40" />
            <div className="h-1 w-1/3 rounded-full bg-[#5a4a42]/50" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 5. Maximize ──────────────────────────────────────────────────
function MaximizeThemePreview() {
  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <div className="h-2 bg-gradient-to-l from-[#0b7f6f] to-[#075e52]" />
      <div className="flex items-center gap-1.5 px-2.5 pt-2">
        <div className="h-3 w-6 rounded-sm bg-[#0b7f6f]" />
        <div className="h-2 w-8 rounded-sm bg-[#100f0f]/80" />
        <div className="h-3 flex-1 rounded-sm border border-[#e7e7ea] bg-[#f4f4f5]" />
        <div className="size-2 rounded-full bg-[#100f0f]/70" />
      </div>
      <div className="grid grid-cols-3 gap-1.5 p-2.5 pb-1.5">
        <div className="relative col-span-2 h-12 rounded-md bg-[#171a22]">
          <div className="absolute bottom-2 start-2 h-1.5 w-10 rounded-full bg-white/90" />
          <div className="absolute end-2 top-0 h-4 w-3 rounded-b-full bg-[#b3232c]" />
        </div>
        <div className="h-12 rounded-md bg-[#e3f4f1]" />
      </div>
      <div className="grid grid-cols-4 gap-1.5 px-2.5 pb-2.5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className="relative aspect-square rounded-md bg-[#f4f4f5]">
              {i === 1 && <div className="absolute start-0.5 top-0.5 h-1.5 w-3 rounded-sm bg-[#fde7ea]" />}
            </div>
            <div className="h-1 w-3/4 rounded-full bg-[#100f0f]/40" />
            <div className={`h-1 w-1/2 rounded-full ${i === 1 ? "bg-[#d0202e]/70" : "bg-[#100f0f]/60"}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function CelloThemePreview() {
  return (
    <div className="overflow-hidden rounded-xl border bg-[#f8f8f8]">
      <div className="h-2 bg-[#0a2a6e]" />
      <div className="flex items-center gap-1.5 bg-white px-2.5 py-2">
        <div className="h-2.5 w-7 rounded-sm bg-[#1447e6]" />
        <div className="h-3 flex-1 rounded-sm bg-[#eceef1]" />
        <div className="h-3 w-5 rounded-sm bg-[#fdc500]" />
      </div>
      <div className="h-12 bg-gradient-to-l from-[#0a2a6e] to-[#1447e6]" />
      <div className="grid grid-cols-4 gap-1.5 p-2.5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col gap-1 rounded-md bg-white p-1">
            <div className="relative aspect-square rounded-sm bg-[#f1f2f4]">
              {i < 2 && <div className={`absolute start-0.5 top-0.5 h-1.5 w-3 rounded-sm ${i === 0 ? "bg-[#d92d20]" : "bg-[#1447e6]"}`} />}
            </div>
            <div className="h-1 w-3/4 rounded-full bg-[#202020]/40" />
            <div className="h-1 w-1/2 rounded-full bg-[#202020]/60" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
const THEME_PREVIEWS: Record<StoreThemeId, React.FC> = {
  default: DefaultThemePreview,
  riwaq: RiwaqThemePreview,
  mada: MadaThemePreview,
  dune: DuneThemePreview,
  maximize: MaximizeThemePreview,
  cello: CelloThemePreview,
};

export default function ThemePicker({ storeId, currentThemeId }: ThemePickerProps) {
  const [isPending, startTransition] = useTransition();
  const [category, setCategory] = useState<ThemeCategoryFilterValue>("all");
  const activeTheme = (currentThemeId as StoreThemeId) || "default";

  const handleChange = (themeId: StoreThemeId) => {
    if (themeId === activeTheme) return;
    startTransition(async () => {
      const result = await UpdateThemeAction({ storeId, themeId });
      if (result.success) {
        toast.success(trv(result.message));
      } else {
        toast.error(trv(result.message));
      }
    });
  };

  const allThemes = Object.values(STORE_THEMES);
  const themes = filterThemesByCategory(allThemes, category);

  return (
    <Card dir={tdir()}>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Palette className="size-4" />
          </div>
          <div>
            <h2 className="font-semibold">{tr("ثيم المتجر")}</h2>
            <p className="text-xs text-muted-foreground">{tr("اختر التصميم المناسب لهوية متجرك")}</p>
          </div>
        </div>

        <ThemeCategoryFilter themes={allThemes} value={category} onChange={setCategory} />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {themes.map((theme) => {
            const isActive = activeTheme === theme.id;
            const Preview = THEME_PREVIEWS[theme.id];

            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleChange(theme.id)}
                disabled={isPending}
                className={cn(
                  "relative overflow-hidden rounded-2xl border p-4 text-start transition-all duration-200",
                  "disabled:pointer-events-none disabled:opacity-60",
                  isActive
                    ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20"
                    : "border-border bg-background hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
                )}
              >
                {isActive && (
                  <div className="absolute end-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow-sm">
                    <Check className="h-3 w-3" />
                  </div>
                )}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">{theme.name}</h4>
                      {isActive && (
                        <span className="text-[10px] font-medium text-primary">{tr("مُفعّل")}</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{theme.description}</p>
                  </div>
                  <Preview />
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
