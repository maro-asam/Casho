"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { Droplets, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useBuilder } from "../BuilderContext";
import { UpdateThemeTokensAction } from "@/actions/settings/theme.actions";
import { resolveStoreTheme } from "@/constants/store-themes";

// ─── Color swatch picker ──────────────────────────────────────────────────────

function ColorSwatch({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 group">
      <div className="relative shrink-0">
        <div
          className="size-8 rounded-lg border-2 border-border shadow-sm transition-transform group-hover:scale-105"
          style={{ backgroundColor: value }}
        />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium">{label}</p>
        {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
      </div>
      <span className="font-mono text-[10px] text-muted-foreground uppercase">{value}</span>
    </label>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export default function ColorsPanel() {
  const { storeId, currentThemeId, sendThemeUpdate, reloadPreview } = useBuilder();
  const [isPending, startTransition] = useTransition();

  // Resolve default colors from current theme preset
  const resolved = resolveStoreTheme(currentThemeId, null, null, null);
  const tokens = resolved.tokens;

  const [primary, setPrimary] = useState(tokens.primary);
  const [primaryFg, setPrimaryFg] = useState(tokens.primaryForeground);
  const [secondary, setSecondary] = useState(tokens.secondary);
  const [background, setBackground] = useState(tokens.background);
  const [foreground, setForeground] = useState(tokens.foreground);
  const [accent, setAccent] = useState(tokens.accent);

  // Debounce instant CSS variable updates via postMessage
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function broadcastColors(overrides: Record<string, string>) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      sendThemeUpdate(overrides);
    }, 80);
  }

  function handlePrimary(v: string) {
    setPrimary(v);
    broadcastColors({ "--store-primary": v, "--primary": v });
  }
  function handleSecondary(v: string) {
    setSecondary(v);
    broadcastColors({ "--store-secondary": v, "--secondary": v });
  }
  function handleBackground(v: string) {
    setBackground(v);
    broadcastColors({ "--store-background": v, "--background": v });
  }
  function handleForeground(v: string) {
    setForeground(v);
    broadcastColors({ "--store-foreground": v, "--foreground": v });
  }
  function handleAccent(v: string) {
    setAccent(v);
    broadcastColors({ "--store-accent": v, "--accent": v });
  }

  // Cleanup on unmount
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  function handleSave() {
    startTransition(async () => {
      const result = await UpdateThemeTokensAction({
        storeId,
        overrides: { primary, primaryForeground: primaryFg, secondary, background, foreground, accent },
      });
      if (result.success) {
        toast.success("تم حفظ الألوان");
        reloadPreview();
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleReset() {
    setPrimary(tokens.primary);
    setPrimaryFg(tokens.primaryForeground);
    setSecondary(tokens.secondary);
    setBackground(tokens.background);
    setForeground(tokens.foreground);
    setAccent(tokens.accent);
    startTransition(async () => {
      await UpdateThemeTokensAction({ storeId, overrides: {} });
      toast.success("تمت إعادة تعيين الألوان");
      reloadPreview();
    });
  }

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-4 py-3 bg-background">
        <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
          <Droplets className="size-3.5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">الألوان</h2>
          <p className="text-[10px] text-muted-foreground">التغييرات تظهر فورًا في المعاينة</p>
        </div>
      </div>

      {/* Color pickers */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">ألوان رئيسية</p>
          <div className="space-y-3 rounded-xl border bg-muted/10 p-3">
            <ColorSwatch label="اللون الأساسي" value={primary} onChange={handlePrimary} hint="الأزرار والروابط والعناصر المميزة" />
            <ColorSwatch label="نص الأساسي" value={primaryFg} onChange={setPrimaryFg} hint="النص على اللون الأساسي" />
            <ColorSwatch label="اللون الثانوي" value={secondary} onChange={handleSecondary} />
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">الخلفية والنصوص</p>
          <div className="space-y-3 rounded-xl border bg-muted/10 p-3">
            <ColorSwatch label="خلفية الصفحة" value={background} onChange={handleBackground} />
            <ColorSwatch label="لون النصوص" value={foreground} onChange={handleForeground} />
            <ColorSwatch label="لون التمييز" value={accent} onChange={handleAccent} hint="تأثيرات الـ hover والتفاصيل" />
          </div>
        </div>

        {/* Live update indicator */}
        <div className="rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2">
          <p className="text-[10px] text-green-700 dark:text-green-400 flex items-center gap-1.5">
            <span className="inline-block size-1.5 rounded-full bg-green-500 animate-pulse" />
            تحديث فوري في المعاينة
          </p>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex gap-2 border-t bg-background px-4 py-3">
        <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={handleReset} disabled={isPending}>
          <RefreshCw className="size-3" />
          إعادة التعيين
        </Button>
        <Button size="sm" className="gap-1.5 h-8 text-xs flex-1" onClick={handleSave} disabled={isPending}>
          {isPending ? "جاري الحفظ…" : "حفظ الألوان"}
        </Button>
      </div>
    </div>
  );
}
