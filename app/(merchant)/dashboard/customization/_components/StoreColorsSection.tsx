"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Save, Loader2, Palette } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { UpdateStoreColorsAction } from "@/actions/settings/theme.actions";

type StoreColorsProps = {
  store: {
    id: string;
    settings: {
      primaryColor: string | null;
      secondaryColor: string | null;
    } | null;
  };
};

const DEFAULT_PRIMARY = "#2563eb";
const DEFAULT_SECONDARY = "#f3f4f6";

export default function StoreColorsSection({ store }: StoreColorsProps) {
  const [primary, setPrimary] = useState(
    store.settings?.primaryColor ?? DEFAULT_PRIMARY,
  );
  const [secondary, setSecondary] = useState(
    store.settings?.secondaryColor ?? DEFAULT_SECONDARY,
  );
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await UpdateStoreColorsAction({
        storeId: store.id,
        primaryColor: primary,
        secondaryColor: secondary,
      });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Card dir="rtl">
      <CardContent className="space-y-6">
        {/* Section Header */}
        <div className="flex items-center gap-3">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Palette className="size-4" />
          </div>
          <div>
            <h2 className="font-semibold">ألوان المتجر</h2>
            <p className="text-xs text-muted-foreground">
              خصص ألوان متجرك لتعكس هويته البصرية
            </p>
          </div>
        </div>

        {/* Color Pickers */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>اللون الأساسي</Label>
            <div className="flex items-center gap-3">
              <div
                className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-xl shadow-sm ring-1 ring-black/10 transition hover:scale-105"
                style={{ background: primary }}
              >
                <input
                  type="color"
                  value={primary}
                  onChange={(e) => setPrimary(e.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </div>
              <Input
                value={primary}
                onChange={(e) => setPrimary(e.target.value)}
                dir="ltr"
                className="font-mono text-sm uppercase"
                placeholder="#000000"
                maxLength={7}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>اللون الثانوي</Label>
            <div className="flex items-center gap-3">
              <div
                className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-xl shadow-sm ring-1 ring-black/10 transition hover:scale-105"
                style={{ background: secondary }}
              >
                <input
                  type="color"
                  value={secondary}
                  onChange={(e) => setSecondary(e.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </div>
              <Input
                value={secondary}
                onChange={(e) => setSecondary(e.target.value)}
                dir="ltr"
                className="font-mono text-sm uppercase"
                placeholder="#ffffff"
                maxLength={7}
              />
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="overflow-hidden rounded-2xl border">
          <div
            className="flex h-14 items-center justify-between px-5"
            style={{ background: primary }}
          >
            <div className="h-3 w-20 rounded-full" style={{ background: "rgba(255,255,255,.75)" }} />
            <div className="flex gap-2">
              <div className="h-1.5 w-12 rounded-full" style={{ background: "rgba(255,255,255,.4)" }} />
              <div className="h-1.5 w-12 rounded-full" style={{ background: "rgba(255,255,255,.4)" }} />
            </div>
            <div
              className="flex h-8 w-20 items-center justify-center rounded-xl text-xs font-bold shadow-sm"
              style={{ background: secondary, color: primary }}
            >
              تسوق الآن
            </div>
          </div>
          <div className="flex items-center justify-between bg-muted/40 px-5 py-2.5">
            <span className="text-xs text-muted-foreground">معاينة مباشرة</span>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-3 w-3 rounded-full ring-1 ring-black/10"
                  style={{ background: primary }}
                />
                <span className="font-mono">{primary}</span>
              </span>
              <span className="text-border">·</span>
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-3 w-3 rounded-full ring-1 ring-black/10"
                  style={{ background: secondary }}
                />
                <span className="font-mono">{secondary}</span>
              </span>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={isPending} className="gap-2">
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          حفظ الألوان
        </Button>
      </CardContent>
    </Card>
  );
}
