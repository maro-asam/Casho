"use client";

import { useState, useTransition } from "react";
import { Check, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useBuilder } from "../BuilderContext";
import { UpdateThemeLayoutAction } from "@/actions/settings/theme.actions";
import type { ThemeLayout } from "@/types/store-theme.types";
import { tdir, tr, trv } from "@/lib/i18n/dashboard";

// ─── Generic option picker ────────────────────────────────────────────────────

function OptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string; preview?: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-foreground/70">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-all duration-150",
              value === opt.value
                ? "border-primary bg-primary/10 text-primary font-medium"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {opt.preview && <span className="shrink-0">{opt.preview}</span>}
            {value === opt.value && <Check className="size-3 shrink-0" />}
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Visual previews ──────────────────────────────────────────────────────────

const HeroPreviews = {
  fullscreen: <div className="h-5 w-8 rounded-sm bg-gradient-to-r from-muted to-primary/30 relative"><div className="absolute inset-x-1 bottom-0.5 h-1 bg-white/60 rounded-sm" /></div>,
  split: <div className="h-5 w-8 rounded-sm bg-muted flex gap-px"><div className="flex-1 bg-primary/20" /><div className="flex-1 bg-muted-foreground/10" /></div>,
  compact: <div className="h-5 w-8 rounded-sm bg-muted"><div className="mx-1 mt-1 h-2.5 bg-primary/20 rounded-sm" /></div>,
  minimal: <div className="h-5 w-8 rounded-sm bg-background border flex flex-col items-center justify-center gap-0.5"><div className="h-1 w-5 bg-muted-foreground/30" /><div className="h-1.5 w-4 bg-foreground/50" /></div>,
};

const GridPreviews = {
  "3": <div className="h-5 w-8 grid grid-cols-3 gap-px p-px rounded-sm bg-muted">{[0,1,2].map(i=><div key={i} className="bg-primary/20 rounded-sm" />)}</div>,
  "4": <div className="h-5 w-8 grid grid-cols-4 gap-px p-px rounded-sm bg-muted">{[0,1,2,3].map(i=><div key={i} className="bg-primary/20 rounded-sm" />)}</div>,
  "5": <div className="h-5 w-8 grid grid-cols-5 gap-px p-px rounded-sm bg-muted">{[0,1,2,3,4].map(i=><div key={i} className="bg-primary/20 rounded-sm" />)}</div>,
};

// ─── Panel ────────────────────────────────────────────────────────────────────

export default function LayoutPanel() {
  const { storeId, currentLayout, reloadPreview } = useBuilder();
  const [isPending, startTransition] = useTransition();
  const [layout, setLayout] = useState<ThemeLayout>({ ...currentLayout });

  function update<K extends keyof ThemeLayout>(key: K, value: ThemeLayout[K]) {
    setLayout((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    startTransition(async () => {
      const result = await UpdateThemeLayoutAction({ storeId, overrides: layout });
      if (result.success) {
        toast.success(tr("تم حفظ إعدادات التصميم"));
        reloadPreview();
      } else {
        toast.error(trv(result.message));
      }
    });
  }

  return (
    <div className="flex flex-col h-full" dir={tdir()}>
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-4 py-3 bg-background">
        <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
          <LayoutGrid className="size-3.5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">{tr("التصميم")}</h2>
          <p className="text-[10px] text-muted-foreground">{tr("تخصيص الهيكل والمظهر العام")}</p>
        </div>
      </div>

      {/* Options */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Hero style */}
        <OptionGroup
          label={tr("نمط البانر الرئيسي")}
          value={layout.heroStyle}
          onChange={(v) => update("heroStyle", v)}
          options={[
            { value: "fullscreen", label: tr("كامل الشاشة"), preview: HeroPreviews.fullscreen },
            { value: "split",      label: tr("منقسم"),        preview: HeroPreviews.split },
            { value: "compact",    label: tr("مضغوط"),         preview: HeroPreviews.compact },
            { value: "minimal",    label: tr("بسيط"),          preview: HeroPreviews.minimal },
          ]}
        />

        {/* Product card style */}
        <OptionGroup
          label={tr("نمط بطاقة المنتج")}
          value={layout.productCardStyle}
          onChange={(v) => update("productCardStyle", v)}
          options={[
            { value: "default", label: tr("افتراضي") },
            { value: "minimal", label: tr("بسيط") },
            { value: "bold",    label: tr("جريء") },
            { value: "elegant", label: tr("أنيق") },
          ]}
        />

        {/* Category card style */}
        <OptionGroup
          label={tr("نمط بطاقة التصنيف")}
          value={layout.categoryCardStyle}
          onChange={(v) => update("categoryCardStyle", v)}
          options={[
            { value: "square", label: tr("مربع") },
            { value: "circle", label: tr("دائري") },
            { value: "pill",   label: tr("ممتد") },
          ]}
        />

        {/* Grid columns */}
        <OptionGroup
          label={tr("أعمدة المنتجات (سطح المكتب)")}
          value={String(layout.desktopGridCols) as "3" | "4" | "5"}
          onChange={(v) => update("desktopGridCols", Number(v) as 3|4|5)}
          options={[
            { value: "3", label: tr("3 أعمدة"), preview: GridPreviews["3"] },
            { value: "4", label: tr("4 أعمدة"), preview: GridPreviews["4"] },
            { value: "5", label: tr("5 أعمدة"), preview: GridPreviews["5"] },
          ]}
        />

        {/* Density */}
        <OptionGroup
          label={tr("كثافة المحتوى")}
          value={layout.density}
          onChange={(v) => update("density", v)}
          options={[
            { value: "compact",  label: tr("مضغوط") },
            { value: "default",  label: tr("عادي") },
            { value: "spacious", label: tr("مريح") },
          ]}
        />

        {/* Animations */}
        <OptionGroup
          label={tr("الحركات والتأثيرات")}
          value={layout.animations}
          onChange={(v) => update("animations", v)}
          options={[
            { value: "none",    label: tr("بدون") },
            { value: "subtle",  label: tr("خفيف") },
            { value: "dynamic", label: tr("حيوي") },
          ]}
        />

        {/* Button style */}
        <OptionGroup
          label={tr("شكل الأزرار")}
          value={layout.buttonStyle}
          onChange={(v) => update("buttonStyle", v)}
          options={[
            { value: "sharp",   label: tr("حاد") },
            { value: "rounded", label: tr("ناعم") },
            { value: "pill",    label: tr("دائري") },
          ]}
        />

        {/* Image ratio */}
        <OptionGroup
          label={tr("نسبة صورة المنتج")}
          value={layout.imageAspectRatio}
          onChange={(v) => update("imageAspectRatio", v)}
          options={[
            { value: "square",    label: tr("مربع 1:1") },
            { value: "portrait",  label: tr("طولي 3:4") },
            { value: "landscape", label: tr("عرضي 4:3") },
          ]}
        />
      </div>

      {/* Footer */}
      <div className="border-t bg-background px-4 py-3">
        <Button size="sm" className="w-full h-8 text-xs" onClick={handleSave} disabled={isPending}>
          {isPending ? tr("جاري الحفظ…") : tr("حفظ التصميم")}
        </Button>
      </div>
    </div>
  );
}
