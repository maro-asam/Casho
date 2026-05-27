"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Check, Palette } from "lucide-react";

import { STORE_THEMES, type StoreThemeId } from "@/constants/store-themes";
import { cn } from "@/lib/utils";
import { UpdateThemeAction } from "@/actions/settings/update-theme-config.actions";
import { Card, CardContent } from "@/components/ui/card";

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

// ─── 2. Bold ──────────────────────────────────────────────────────
function BoldThemePreview() {
  return (
    <div className="overflow-hidden rounded-sm border bg-[#fafaf8]">
      <div className="flex h-7 items-center justify-between border-b border-[#e5e0d9] bg-[#fafaf8] px-2.5">
        <div className="h-3 w-10 bg-black/20" />
        <div className="flex gap-1.5">
          <div className="h-1.5 w-7 bg-black/10" />
          <div className="h-1.5 w-7 bg-black/10" />
        </div>
        <div className="h-5 w-6 bg-black/10" />
      </div>
      <div className="relative h-20 bg-black">
        <div className="absolute bottom-2 right-2 space-y-1">
          <div className="h-3 w-16 bg-white/80" />
          <div className="h-1.5 w-10 bg-white/50" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1 p-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="bg-gray-200" style={{ aspectRatio: "4/5" }} />
            <div className="h-1.5 bg-gray-300" />
            <div className="h-1.5 w-2/3 bg-black/30" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 3. Elegant ───────────────────────────────────────────────────
function ElegantThemePreview() {
  return (
    <div className="overflow-hidden border border-[#e8e0d5] bg-[#faf9f7]">
      <div className="flex h-7 items-center justify-center gap-3 border-b border-[#e8e0d5] bg-[#faf9f7] px-2.5">
        <div className="h-1.5 w-6 bg-[#c8b89a]/40" />
        <div className="h-3 w-12 bg-[#9b7d5a]/50" />
        <div className="h-1.5 w-6 bg-[#c8b89a]/40" />
      </div>
      <div className="relative flex h-20 items-center justify-center bg-[#d6cfc4]">
        <div className="space-y-1 text-center">
          <div className="mx-auto h-1.5 w-14 bg-[#9b7d5a]/60" />
          <div className="mx-auto h-3 w-20 bg-[#5a4535]/70" />
        </div>
      </div>
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        <div className="h-px flex-1 bg-[#e8e0d5]" />
        <div className="h-1.5 w-10 bg-[#9b7d5a]/40" />
        <div className="h-px flex-1 bg-[#e8e0d5]" />
      </div>
      <div className="grid grid-cols-3 gap-1.5 px-2 pb-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="bg-[#ede8e1]" style={{ aspectRatio: "3/4" }} />
            <div className="mx-auto h-1.5 w-full bg-[#c8b89a]/60" />
            <div className="mx-auto h-1.5 w-2/3 bg-[#9b7d5a]/40" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 4. Modern ────────────────────────────────────────────────────
function ModernThemePreview() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-[#f8f9fb]">
      <div className="flex h-7 items-center justify-between border-b bg-white px-2.5">
        <div className="h-3 w-10 rounded-full bg-indigo-400/40" />
        <div className="flex gap-1.5">
          <div className="h-1.5 w-7 rounded-full bg-gray-200" />
          <div className="h-1.5 w-7 rounded-full bg-gray-200" />
        </div>
        <div className="h-5 w-6 rounded-xl bg-indigo-100" />
      </div>
      <div className="relative mx-2 mt-2 h-14 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600">
        <div className="absolute bottom-2 right-2.5 space-y-1">
          <div className="h-1.5 w-10 rounded-full bg-white/70" />
          <div className="h-2.5 w-14 rounded-full bg-white/90" />
        </div>
        <div className="absolute bottom-2 left-2 h-3.5 w-10 rounded-full bg-white/95" />
      </div>
      <div className="flex gap-1.5 overflow-hidden px-2 py-1.5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="size-6 shrink-0 rounded-full border-2 border-indigo-200 bg-indigo-50" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1.5 px-2 pb-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-1 overflow-hidden rounded-xl border border-gray-100 bg-white p-1">
            <div className="aspect-square rounded-lg bg-indigo-50" />
            <div className="h-1.5 rounded-full bg-gray-200" />
            <div className="h-1.5 w-2/3 rounded-full bg-indigo-400/50" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 5. Minimal ───────────────────────────────────────────────────
function MinimalThemePreview() {
  return (
    <div className="overflow-hidden border border-neutral-200 bg-white">
      {/* Compact navbar */}
      <div className="flex h-7 items-center justify-between border-b border-neutral-200 bg-white px-2.5">
        <div className="h-2 w-12 bg-neutral-800/40" />
        <div className="flex gap-1.5">
          <div className="h-1.5 w-6 bg-neutral-200" />
          <div className="h-1.5 w-6 bg-neutral-200" />
          <div className="h-1.5 w-6 bg-neutral-200" />
        </div>
        <div className="h-4 w-5 bg-neutral-100" />
      </div>
      {/* Typographic hero */}
      <div className="flex flex-col items-center justify-center gap-1.5 py-5">
        <div className="h-1.5 w-16 bg-neutral-300" />
        <div className="h-4 w-24 bg-neutral-800/80" />
        <div className="h-1.5 w-12 bg-neutral-300" />
      </div>
      {/* Thin divider */}
      <div className="h-px bg-neutral-100" />
      {/* Category pills */}
      <div className="flex gap-1 overflow-hidden px-2 py-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="shrink-0 border border-neutral-200 px-2 py-0.5">
            <div className="h-1.5 w-8 bg-neutral-300" />
          </div>
        ))}
      </div>
      {/* Products */}
      <div className="grid grid-cols-4 gap-1.5 px-2 pb-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="aspect-square bg-neutral-100" />
            <div className="h-1.5 bg-neutral-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 6. Dark ──────────────────────────────────────────────────────
function DarkThemePreview() {
  return (
    <div className="overflow-hidden rounded-xl border border-[#2e2e45] bg-[#0d0d14]">
      {/* Navbar */}
      <div className="flex h-7 items-center justify-between border-b border-[#2e2e45] bg-[#13131f] px-2.5">
        <div className="h-3 w-10 rounded-sm bg-[#a78bfa]/40" />
        <div className="flex gap-1.5">
          <div className="h-1.5 w-7 rounded-full bg-[#2e2e45]" />
          <div className="h-1.5 w-7 rounded-full bg-[#2e2e45]" />
        </div>
        <div className="h-5 w-6 rounded-md bg-[#1e1e30]" />
      </div>
      {/* Hero — neon glow */}
      <div className="relative h-20 bg-[#0d0d14]">
        <div
          className="absolute inset-x-0 top-0 h-px opacity-70"
          style={{ background: "linear-gradient(to right, transparent, #a78bfa, transparent)" }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(167,139,250,0.18), transparent)" }}
        />
        <div className="absolute bottom-3 right-3 space-y-1.5">
          <div className="h-2 w-8 rounded-full bg-[#a78bfa]/50" />
          <div className="h-3.5 w-16 rounded-sm bg-[#f1f5f9]/80" />
          <div className="h-5 w-14 rounded-lg bg-[#a78bfa]" />
        </div>
      </div>
      {/* Products */}
      <div className="grid grid-cols-3 gap-1.5 p-2">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="space-y-1 overflow-hidden rounded-xl border border-[#2e2e45] bg-[#16162a] p-1"
          >
            <div className="aspect-square rounded-lg bg-[#1e1e30]" />
            <div className="h-1.5 rounded-full bg-[#2e2e45]" />
            <div className="h-1.5 w-2/3 rounded-full bg-[#a78bfa]/50" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
const THEME_PREVIEWS: Record<StoreThemeId, React.FC> = {
  default: DefaultThemePreview,
  bold: BoldThemePreview,
  elegant: ElegantThemePreview,
  modern: ModernThemePreview,
  minimal: MinimalThemePreview,
  dark: DarkThemePreview,
};

export default function ThemePicker({ storeId, currentThemeId }: ThemePickerProps) {
  const [isPending, startTransition] = useTransition();
  const activeTheme = (currentThemeId as StoreThemeId) || "default";

  const handleChange = (themeId: StoreThemeId) => {
    if (themeId === activeTheme) return;
    startTransition(async () => {
      const result = await UpdateThemeAction({ storeId, themeId });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  const themes = Object.values(STORE_THEMES);

  return (
    <Card dir="rtl">
      <CardContent className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Palette className="size-4" />
          </div>
          <div>
            <h2 className="font-semibold">ثيم المتجر</h2>
            <p className="text-xs text-muted-foreground">اختر التصميم المناسب لهوية متجرك</p>
          </div>
        </div>

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
                  "relative overflow-hidden rounded-2xl border p-4 text-right transition-all duration-200",
                  "disabled:pointer-events-none disabled:opacity-60",
                  isActive
                    ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20"
                    : "border-border bg-background hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
                )}
              >
                {isActive && (
                  <div className="absolute left-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow-sm">
                    <Check className="h-3 w-3" />
                  </div>
                )}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">{theme.name}</h4>
                      {isActive && (
                        <span className="text-[10px] font-medium text-primary">مُفعّل</span>
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
