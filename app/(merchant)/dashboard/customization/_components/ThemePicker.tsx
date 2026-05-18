"use client";

import type { CSSProperties } from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { STORE_THEMES, type StoreThemeId } from "@/constants/store-themes";
import { UpdateStoreThemeAction } from "@/actions/themes/update-store-theme.actions";
import { cn } from "@/lib/utils";

type ThemePickerProps = {
  storeId: string;
  currentThemeId?: string | null;
};

export default function ThemePicker({
  storeId,
  currentThemeId,
}: ThemePickerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function selectTheme(themeId: StoreThemeId) {
    startTransition(async () => {
      const result = await UpdateStoreThemeAction({
        storeId,
        themeId,
      });

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
        const active = (currentThemeId || "classic") === theme.id;

        const previewStyle = {
          "--preview-primary": theme.tokens.primaryColor,
          "--preview-secondary": theme.tokens.secondaryColor,
          "--preview-bg": theme.tokens.background,
          "--preview-card": theme.tokens.card,
        } as CSSProperties;

        return (
          <button
            key={theme.id}
            type="button"
            disabled={isPending}
            onClick={() => selectTheme(theme.id)}
            className={cn(
              "group text-right transition disabled:pointer-events-none disabled:opacity-60",
              active && "scale-[0.99]",
            )}
          >
            <Card
              className={cn(
                "overflow-hidden rounded-2xl border bg-card shadow-sm transition group-hover:-translate-y-1 group-hover:shadow-lg",
                active && "border-primary ring-2 ring-primary/20",
              )}
            >
              <div
                style={previewStyle}
                className="relative aspect-[4/3] overflow-hidden bg-[var(--preview-bg)]"
              >
                <div className="absolute inset-x-0 top-0 h-10 bg-[var(--preview-card)]/90" />

                <div className="absolute right-4 top-3 h-4 w-24 rounded-full bg-[var(--preview-primary)]" />

                <div className="absolute inset-x-5 top-16 h-24 rounded-2xl bg-[var(--preview-primary)]/90" />

                <div className="absolute bottom-5 right-5 grid w-[calc(100%-2.5rem)] grid-cols-3 gap-3">
                  <div className="h-16 rounded-xl bg-[var(--preview-card)] shadow-sm" />
                  <div className="h-16 rounded-xl bg-[var(--preview-card)] shadow-sm" />
                  <div className="h-16 rounded-xl bg-[var(--preview-secondary)] shadow-sm" />
                </div>

                {active && (
                  <div className="absolute left-3 top-3 flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                    <Check className="size-4" />
                  </div>
                )}

                {isPending && active && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm">
                    <Loader2 className="size-6 animate-spin" />
                  </div>
                )}
              </div>

              <CardContent className="space-y-2 p-5">
                <h3 className="text-lg font-bold">{theme.name}</h3>

                <p className="text-sm leading-6 text-muted-foreground">
                  {theme.description}
                </p>

                <p className="text-xs font-medium text-primary">
                  {active ? "الثيم الحالي" : "اختيار هذا الثيم"}
                </p>
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );
}
