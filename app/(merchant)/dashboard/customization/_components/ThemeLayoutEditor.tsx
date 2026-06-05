"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, LayoutGrid } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  UpdateThemeLayoutAction,
  UpdateNavbarVariantAction,
} from "@/actions/settings/theme.actions";
import type { ThemeLayout, NavbarVariant, ButtonStyle, ImageAspectRatio, AnimationStyle } from "@/types/store-theme.types";

type Props = {
  storeId: string;
  currentLayout: ThemeLayout;
};

// ─── Reusable option card ─────────────────────────────────────────────────────

function OptionCard({
  isActive,
  onClick,
  disabled,
  preview,
  label,
  description,
}: {
  isActive: boolean;
  onClick: () => void;
  disabled: boolean;
  preview: React.ReactNode;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative flex flex-col gap-3 rounded-2xl border p-4 text-right transition-all duration-200",
        "disabled:pointer-events-none disabled:opacity-60",
        isActive
          ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
          : "border-border bg-card hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
      )}
    >
      {isActive && (
        <div className="absolute left-3 top-3 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
          <Check className="size-3" />
        </div>
      )}
      {preview}
      <div>
        <p className="text-sm font-semibold">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </button>
  );
}

// ─── Sub-section wrapper ─────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground/80">{title}</h3>
      {children}
    </div>
  );
}

// ─── Navbar Previews ─────────────────────────────────────────────────────────

function NavbarPreview({ variant }: { variant: NavbarVariant }) {
  if (variant === "centered") {
    return (
      <div className="flex h-8 items-center justify-center gap-2 rounded-lg border bg-muted/40 px-2">
        <div className="h-1.5 w-7 rounded-full bg-muted-foreground/30" />
        <div className="h-3 w-8 rounded-md bg-primary/30" />
        <div className="h-1.5 w-7 rounded-full bg-muted-foreground/30" />
      </div>
    );
  }
  if (variant === "compact") {
    return (
      <div className="flex h-8 items-center gap-2 rounded-lg border bg-muted/40 px-2">
        <div className="size-4 rounded-md bg-primary/30" />
        <div className="h-4 flex-1 rounded-md bg-muted-foreground/15" />
        <div className="size-4 rounded-md bg-muted-foreground/20" />
      </div>
    );
  }
  // default
  return (
    <div className="flex h-8 items-center justify-between rounded-lg border bg-muted/40 px-2">
      <div className="h-3 w-10 rounded-md bg-primary/30" />
      <div className="flex gap-1">
        <div className="h-1.5 w-6 rounded-full bg-muted-foreground/25" />
        <div className="h-1.5 w-6 rounded-full bg-muted-foreground/25" />
        <div className="h-1.5 w-6 rounded-full bg-muted-foreground/25" />
      </div>
      <div className="size-5 rounded-md bg-muted-foreground/15" />
    </div>
  );
}

// ─── Button Style Previews ────────────────────────────────────────────────────

function ButtonPreview({ style }: { style: ButtonStyle }) {
  const radius = style === "sharp" ? "rounded-none" : style === "pill" ? "rounded-full" : "rounded-lg";
  return (
    <div className="flex items-center gap-2">
      <div className={cn("h-7 w-16 border-2 border-primary/60 bg-primary/10 text-[9px] font-bold text-primary flex items-center justify-center", radius)}>
        اضف للسلة
      </div>
      <div className={cn("h-7 w-10 border border-border bg-card flex items-center justify-center", radius)}>
        <div className="h-1 w-6 rounded-full bg-muted-foreground/40" />
      </div>
    </div>
  );
}

// ─── Image Aspect Previews ────────────────────────────────────────────────────

function AspectPreview({ ratio }: { ratio: ImageAspectRatio }) {
  const dims =
    ratio === "portrait" ? "w-10 h-[52px]" : ratio === "landscape" ? "w-[60px] h-10" : "w-10 h-10";
  return (
    <div className="flex items-end justify-center">
      <div className={cn("rounded-lg bg-primary/20 border border-primary/30", dims)} />
    </div>
  );
}

// ─── Grid Cols Preview ────────────────────────────────────────────────────────

function GridColsPreview({ cols }: { cols: 3 | 4 | 5 }) {
  return (
    <div className={cn("grid gap-1", cols === 3 ? "grid-cols-3" : cols === 4 ? "grid-cols-4" : "grid-cols-5")}>
      {Array.from({ length: cols * 2 }).map((_, i) => (
        <div key={i} className="aspect-square rounded-md bg-primary/20 border border-primary/20" />
      ))}
    </div>
  );
}

// ─── Animation Preview ────────────────────────────────────────────────────────

function AnimationPreview({ style }: { style: AnimationStyle }) {
  return (
    <div className="flex items-end gap-1 h-8">
      {style === "none" ? (
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-3 h-4 rounded-sm bg-muted-foreground/30" />
        ))
      ) : style === "subtle" ? (
        [2, 4, 3, 5].map((h, i) => (
          <div key={i} className="w-3 rounded-sm bg-primary/50" style={{ height: `${h * 4}px` }} />
        ))
      ) : (
        [2, 5, 3, 6, 4].map((h, i) => (
          <div key={i} className="w-2.5 rounded-sm bg-primary/70" style={{ height: `${h * 4}px` }} />
        ))
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ThemeLayoutEditor({ storeId, currentLayout }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // ── Local optimistic state ─────────────────────────────────────
  const [localLayout, setLocalLayout] = useState<ThemeLayout>({ ...currentLayout });

  function saveLayout(overrides: Partial<ThemeLayout>) {
    // Optimistic update
    setLocalLayout((prev) => ({ ...prev, ...overrides }));

    startTransition(async () => {
      const result = await UpdateThemeLayoutAction({ storeId, overrides });
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        // Revert on failure
        setLocalLayout((prev) => {
          const reverted = { ...prev };
          (Object.keys(overrides) as (keyof ThemeLayout)[]).forEach((k) => {
            (reverted as Record<string, unknown>)[k] = currentLayout[k];
          });
          return reverted;
        });
        toast.error(result.message);
      }
    });
  }

  function saveNavbar(navbar: NavbarVariant) {
    // Optimistic update
    setLocalLayout((prev) => ({ ...prev, navbar }));

    startTransition(async () => {
      const [r1] = await Promise.all([
        UpdateThemeLayoutAction({ storeId, overrides: { navbar } }),
        UpdateNavbarVariantAction({ storeId, variant: navbar }),
      ]);
      if (r1.success) {
        toast.success("تم تحديث القائمة العلوية");
        router.refresh();
      } else {
        // Revert on failure
        setLocalLayout((prev) => ({ ...prev, navbar: currentLayout.navbar }));
        toast.error(r1.message);
      }
    });
  }

  const NAVBAR_OPTIONS: { value: NavbarVariant; label: string; desc: string }[] = [
    { value: "default",  label: "افتراضي",  desc: "لوجو يسار، روابط وسط، أيقونات يمين" },
    { value: "centered", label: "محوري",   desc: "لوجو في المنتصف، روابط على الجانبين" },
    { value: "compact",  label: "مضغوط",   desc: "شريط بحث كامل — مناسب للكتالوجات الكبيرة" },
  ];

  const BUTTON_OPTIONS: { value: ButtonStyle; label: string }[] = [
    { value: "sharp",   label: "حاد" },
    { value: "rounded", label: "مدور" },
    { value: "pill",    label: "دائري" },
  ];

  const ASPECT_OPTIONS: { value: ImageAspectRatio; label: string; desc: string }[] = [
    { value: "square",    label: "مربع",    desc: "1:1" },
    { value: "portrait",  label: "بورتريه", desc: "3:4" },
    { value: "landscape", label: "أفقي",    desc: "4:3" },
  ];

  const COLS_OPTIONS: { value: 3 | 4 | 5; label: string; desc: string }[] = [
    { value: 3, label: "٣ أعمدة",  desc: "بطاقات أوسع" },
    { value: 4, label: "٤ أعمدة",  desc: "التوازن المثالي" },
    { value: 5, label: "٥ أعمدة",  desc: "عرض أكثر منتجات" },
  ];

  const ANIM_OPTIONS: { value: AnimationStyle; label: string; desc: string }[] = [
    { value: "none",    label: "بدون حركة", desc: "أداء أعلى" },
    { value: "subtle",  label: "ناعمة",      desc: "تفاعل هادئ" },
    { value: "dynamic", label: "حيوية",      desc: "تجربة غامرة" },
  ];

  return (
    <Card dir="rtl">
      <CardContent className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <LayoutGrid className="size-4" />
          </div>
          <div>
            <h2 className="font-semibold">خيارات التصميم</h2>
            <p className="text-xs text-muted-foreground">تحكم في هيكل وشكل المتجر بشكل كامل</p>
          </div>
        </div>

        {/* ── Navbar ─────────────────────────────────────────────────── */}
        <Section title="القائمة العلوية (Navbar)">
          <div className="grid gap-3 sm:grid-cols-3">
            {NAVBAR_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.value}
                isActive={localLayout.navbar === opt.value}
                onClick={() => saveNavbar(opt.value)}
                disabled={isPending}
                label={opt.label}
                description={opt.desc}
                preview={<NavbarPreview variant={opt.value} />}
              />
            ))}
          </div>
        </Section>

        {/* ── Button Style ────────────────────────────────────────────── */}
        <Section title="شكل الأزرار">
          <div className="grid gap-3 sm:grid-cols-3">
            {BUTTON_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.value}
                isActive={localLayout.buttonStyle === opt.value}
                onClick={() => saveLayout({ buttonStyle: opt.value })}
                disabled={isPending}
                label={opt.label}
                preview={<ButtonPreview style={opt.value} />}
              />
            ))}
          </div>
        </Section>

        {/* ── Image Aspect ─────────────────────────────────────────────── */}
        <Section title="نسبة صور المنتجات">
          <div className="grid gap-3 sm:grid-cols-3">
            {ASPECT_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.value}
                isActive={localLayout.imageAspectRatio === opt.value}
                onClick={() => saveLayout({ imageAspectRatio: opt.value })}
                disabled={isPending}
                label={opt.label}
                description={opt.desc}
                preview={<AspectPreview ratio={opt.value} />}
              />
            ))}
          </div>
        </Section>

        {/* ── Grid Cols ────────────────────────────────────────────────── */}
        <Section title="أعمدة المنتجات (Desktop)">
          <div className="grid gap-3 sm:grid-cols-3">
            {COLS_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.value}
                isActive={localLayout.desktopGridCols === opt.value}
                onClick={() => saveLayout({ desktopGridCols: opt.value })}
                disabled={isPending}
                label={opt.label}
                description={opt.desc}
                preview={<GridColsPreview cols={opt.value} />}
              />
            ))}
          </div>
        </Section>

        {/* ── Animations ──────────────────────────────────────────────── */}
        <Section title="الحركات والتأثيرات">
          <div className="grid gap-3 sm:grid-cols-3">
            {ANIM_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.value}
                isActive={localLayout.animations === opt.value}
                onClick={() => saveLayout({ animations: opt.value })}
                disabled={isPending}
                label={opt.label}
                description={opt.desc}
                preview={<AnimationPreview style={opt.value} />}
              />
            ))}
          </div>
        </Section>
      </CardContent>
    </Card>
  );
}
