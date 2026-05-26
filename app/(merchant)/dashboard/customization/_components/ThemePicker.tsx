"use client";

import type { CSSProperties } from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { STORE_THEMES, type StoreThemeId } from "@/constants/store-themes";
import { UpdateStoreThemeAction } from "@/actions/themes/update-store-theme.actions";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type ThemePickerProps = {
  storeId: string;
  currentThemeId?: string | null;
};

export default function ThemePicker({ storeId, currentThemeId }: ThemePickerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function selectTheme(themeId: StoreThemeId) {
    startTransition(async () => {
      const result = await UpdateStoreThemeAction({ storeId, themeId });
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Object.values(STORE_THEMES).map((theme) => {
        const active = (currentThemeId ?? "classic") === theme.id;

        const vars = {
          "--tp": theme.tokens.primaryColor,
          "--ts": theme.tokens.secondaryColor,
          "--tb": theme.tokens.background,
          "--tc": theme.tokens.card,
          "--tm": theme.tokens.muted,
          "--tbo": theme.tokens.border,
        } as CSSProperties;

        return (
          <button
            key={theme.id}
            type="button"
            disabled={isPending}
            onClick={() => !active && selectTheme(theme.id)}
            style={vars}
            className={cn(
              "group relative flex flex-col overflow-hidden rounded-2xl border text-right transition-all duration-300",
              "disabled:pointer-events-none disabled:opacity-60",
              active
                ? "border-primary shadow-lg shadow-primary/10 ring-2 ring-primary/20"
                : "border-border bg-card hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-xl",
            )}
          >
            {/* ── Mini Store Preview ── */}
            <div className="relative h-44 overflow-hidden" style={{ background: "var(--tb)" }}>

              {/* Navbar */}
              <div
                className="absolute inset-x-0 top-0 flex h-10 items-center justify-between px-3"
                style={{ background: "var(--tp)" }}
              >
                <div className="h-2.5 w-16 rounded-full" style={{ background: "rgba(255,255,255,.75)" }} />
                <div className="flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-1.5 w-8 rounded-full" style={{ background: "rgba(255,255,255,.4)" }} />
                  ))}
                </div>
                <div className="h-6 w-10 rounded-md" style={{ background: "var(--ts)" }} />
              </div>

              {/* Hero */}
              <div
                className="absolute inset-x-0 top-10 flex h-[82px] flex-col justify-center gap-2 overflow-hidden px-4"
                style={{ background: "var(--tp)" }}
              >
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative h-3 w-28 rounded-full" style={{ background: "rgba(255,255,255,.9)" }} />
                <div className="relative h-2 w-20 rounded-full" style={{ background: "rgba(255,255,255,.55)" }} />
                <div
                  className="relative mt-0.5 flex h-6 w-16 items-center justify-center rounded-md text-[9px] font-bold"
                  style={{ background: "var(--ts)", color: "var(--tp)" }}
                >
                  تسوق الآن
                </div>
              </div>

              {/* Product Cards */}
              <div className="absolute bottom-3 inset-x-3 grid grid-cols-3 gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-xl"
                    style={{ background: "var(--tc)", border: "1px solid var(--tbo)" }}
                  >
                    <div
                      className="h-8"
                      style={{ background: i === 2 ? "var(--ts)" : "var(--tm)" }}
                    />
                    <div className="space-y-1.5 p-1.5">
                      <div className="h-1.5 w-4/5 rounded-full" style={{ background: "var(--tm)" }} />
                      <div className="h-1.5 w-1/2 rounded-full" style={{ background: "var(--tp)", opacity: .55 }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Active check overlay badge */}
              {active && (
                <div
                  className="absolute left-2.5 top-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow"
                  style={{ background: "var(--tp)", color: "white", outline: "1.5px solid rgba(255,255,255,.6)" }}
                >
                  <Check className="size-2.5" />
                  مُفعّل
                </div>
              )}

              {/* Loading overlay */}
              {isPending && active && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/25 backdrop-blur-sm">
                  <Loader2 className="size-6 animate-spin text-white" />
                </div>
              )}
            </div>

            {/* ── Card Footer ── */}
            <div className="flex flex-1 flex-col gap-2.5 bg-card p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold tracking-tight">{theme.name}</h3>
                {active ? (
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

              <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                {theme.description}
              </p>

              {/* Palette swatches */}
              <div className="mt-auto flex items-center gap-1.5 pt-1">
                {[
                  { c: theme.tokens.primaryColor, label: "أساسي" },
                  { c: theme.tokens.secondaryColor, label: "ثانوي" },
                  { c: theme.tokens.background, label: "خلفية" },
                  { c: theme.tokens.muted, label: "muted" },
                ].map(({ c, label }) => (
                  <div
                    key={label}
                    title={label}
                    className="h-3.5 w-3.5 rounded-full shadow-sm ring-1 ring-black/10"
                    style={{ background: c }}
                  />
                ))}
                <div
                  className="mr-auto h-1.5 w-14 rounded-full opacity-70"
                  style={{ background: `linear-gradient(to left, ${theme.tokens.primaryColor}, ${theme.tokens.secondaryColor})` }}
                />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
