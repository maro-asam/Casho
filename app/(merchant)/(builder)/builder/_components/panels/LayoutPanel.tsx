"use client";

import { useState } from "react";
import { UpdateThemeLayoutAction } from "@/actions/settings/theme.actions";
import { SegmentedButtons } from "@/components/saas-page";
import type { ThemeLayout } from "@/types/store-theme.types";
import { cn } from "@/lib/utils";
import { useBuilder } from "../BuilderContext";
import { ChoiceTiles, Group, PanelBody, Row } from "../studio-ui";
import { tr } from "@/lib/i18n/dashboard";

// ─── Schematic previews ──────────────────────────────────────────────────────

const frame = "flex h-12 flex-col justify-center gap-1 rounded-[9px] bg-(--fill-3) px-2";
const ink = "rounded-full bg-foreground/25";
const brand = "rounded-[3px] bg-primary/60";

function NavbarPreview({ variant }: { variant: string }) {
  if (variant === "centered") {
    return (
      <div className={cn(frame, "flex-row items-center justify-between")}>
        <div className="flex gap-1">
          <div className={cn(ink, "h-1 w-4")} />
          <div className={cn(ink, "h-1 w-4")} />
        </div>
        <div className="size-4 rounded-full bg-primary/60" />
        <div className="h-3 w-4 rounded-[3px] bg-foreground/15" />
      </div>
    );
  }
  if (variant === "compact") {
    return (
      <div className={cn(frame, "flex-row items-center gap-1.5")}>
        <div className={cn(brand, "size-3.5")} />
        <div className="h-3.5 flex-1 rounded-full bg-card" />
        <div className="size-3.5 rounded-[3px] bg-foreground/15" />
      </div>
    );
  }
  return (
    <div className={cn(frame, "flex-row items-center justify-between")}>
      <div className={cn(brand, "h-2.5 w-7")} />
      <div className="flex gap-1">
        <div className={cn(ink, "h-1 w-3.5")} />
        <div className={cn(ink, "h-1 w-3.5")} />
        <div className={cn(ink, "h-1 w-3.5")} />
      </div>
      <div className="h-3 w-4 rounded-[3px] bg-foreground/15" />
    </div>
  );
}

function HeroPreview({ style }: { style: ThemeLayout["heroStyle"] }) {
  if (style === "split") {
    return (
      <div className="flex h-12 gap-1 rounded-[9px] bg-(--fill-3) p-1">
        <div className="flex flex-1 flex-col justify-center gap-1 ps-1">
          <div className={cn(ink, "h-1.5 w-full")} />
          <div className={cn(brand, "h-2 w-6 rounded-full")} />
        </div>
        <div className="flex-1 rounded-[6px] bg-primary/35" />
      </div>
    );
  }
  if (style === "minimal") {
    return (
      <div className="flex h-12 flex-col items-center justify-center gap-1 rounded-[9px] bg-(--fill-3)">
        <div className={cn(ink, "h-1.5 w-1/2")} />
        <div className={cn(ink, "h-1 w-1/3 opacity-60")} />
      </div>
    );
  }
  return (
    <div className="h-12 rounded-[9px] bg-(--fill-3) p-1">
      <div className={cn("flex h-full flex-col justify-end rounded-[6px] bg-linear-to-br from-primary/30 to-primary/60 p-1.5", style === "compact" && "mx-2")}>
        <div className="h-1 w-1/2 rounded-full bg-white/90" />
      </div>
    </div>
  );
}

function CardPreview({ style }: { style: ThemeLayout["productCardStyle"] }) {
  return (
    <div className="grid h-12 grid-cols-2 gap-1 rounded-[9px] bg-(--fill-3) p-1">
      {[0, 1].map((i) => (
        <div
          key={i}
          className={cn(
            "flex flex-col gap-0.5 overflow-hidden",
            style === "bold" && "rounded-[5px] bg-card p-0.5 shadow-sm",
            style === "elegant" && "items-center",
          )}
        >
          <div className={cn("flex-1 bg-foreground/12", style === "minimal" ? "rounded-none" : "rounded-[4px]")} />
          <div className={cn(ink, "h-1", style === "elegant" ? "w-2/3" : "w-full")} />
          {style !== "minimal" && <div className="h-1 w-1/2 rounded-full bg-primary/60" />}
        </div>
      ))}
    </div>
  );
}

function CategoryPreview({ style }: { style: ThemeLayout["categoryCardStyle"] }) {
  return (
    <div className="flex h-12 items-center justify-center gap-1.5 rounded-[9px] bg-(--fill-3) px-2">
      {[0, 1, 2].map((i) =>
        style === "pill" ? (
          <div key={i} className="h-4 flex-1 rounded-full bg-foreground/15" />
        ) : (
          <div key={i} className={cn("size-6 bg-foreground/15", style === "circle" ? "rounded-full" : "rounded-[5px]")} />
        ),
      )}
    </div>
  );
}

function ButtonPreview({ style }: { style: ThemeLayout["buttonStyle"] }) {
  return (
    <div className="grid h-12 place-items-center rounded-[9px] bg-(--fill-3)">
      <div className={cn("h-5 w-16 bg-primary/70", style === "sharp" ? "rounded-none" : style === "pill" ? "rounded-full" : "rounded-[6px]")} />
    </div>
  );
}

function AspectPreview({ ratio }: { ratio: ThemeLayout["imageAspectRatio"] }) {
  return (
    <div className="flex h-12 items-center justify-center rounded-[9px] bg-(--fill-3)">
      <div className={cn("rounded-[4px] bg-foreground/15", ratio === "portrait" ? "h-9 w-7" : ratio === "landscape" ? "h-6 w-9" : "size-8")} />
    </div>
  );
}

function ColsPreview({ cols }: { cols: number }) {
  return (
    <div className="grid h-12 gap-0.5 rounded-[9px] bg-(--fill-3) p-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {Array.from({ length: cols * 2 }).map((_, i) => (
        <div key={i} className="rounded-[2px] bg-foreground/15" />
      ))}
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export default function LayoutPanel() {
  const { storeId, theme, save } = useBuilder();
  const [layout, setLayout] = useState<ThemeLayout>(theme.layout);

  function set<K extends keyof ThemeLayout>(key: K, value: ThemeLayout[K]) {
    const previous = layout[key];
    setLayout((l) => ({ ...l, [key]: value }));
    void save(() => UpdateThemeLayoutAction({ storeId, overrides: { [key]: value }, target: "draft" }), {
      onError: () => setLayout((l) => ({ ...l, [key]: previous })),
    });
  }

  return (
    <PanelBody>
      <Group title={tr("القائمة العلوية")} plain>
        <ChoiceTiles
          label={tr("القائمة العلوية")}
          columns={3}
          value={layout.navbar}
          onChange={(v) => set("navbar", v)}
          options={[
            { value: "default", label: tr("افتراضي"), preview: <NavbarPreview variant="default" /> },
            { value: "centered", label: tr("لوجو في النص"), preview: <NavbarPreview variant="centered" /> },
            { value: "compact", label: tr("بحث كبير"), preview: <NavbarPreview variant="compact" /> },
          ]}
        />
      </Group>

      <Group title={tr("البانر الرئيسي")} plain>
        <ChoiceTiles
          label={tr("البانر الرئيسي")}
          value={layout.heroStyle}
          onChange={(v) => set("heroStyle", v)}
          options={[
            { value: "fullscreen", label: tr("كامل الشاشة"), preview: <HeroPreview style="fullscreen" /> },
            { value: "split", label: tr("صورة وكلام"), preview: <HeroPreview style="split" /> },
            { value: "compact", label: tr("مضغوط"), preview: <HeroPreview style="compact" /> },
            { value: "minimal", label: tr("كلام بس"), preview: <HeroPreview style="minimal" /> },
          ]}
        />
      </Group>

      <Group title={tr("كارت المنتج")} plain>
        <ChoiceTiles
          label={tr("كارت المنتج")}
          value={layout.productCardStyle}
          onChange={(v) => set("productCardStyle", v)}
          options={[
            { value: "default", label: tr("افتراضي"), preview: <CardPreview style="default" /> },
            { value: "minimal", label: tr("بسيط"), preview: <CardPreview style="minimal" /> },
            { value: "bold", label: tr("بارز"), preview: <CardPreview style="bold" /> },
            { value: "elegant", label: tr("أنيق"), preview: <CardPreview style="elegant" /> },
          ]}
        />
      </Group>

      <Group title={tr("صور المنتجات")} plain>
        <ChoiceTiles
          label={tr("نسبة الصورة")}
          columns={3}
          value={layout.imageAspectRatio}
          onChange={(v) => set("imageAspectRatio", v)}
          options={[
            { value: "square", label: tr("مربع"), description: "1:1", preview: <AspectPreview ratio="square" /> },
            { value: "portrait", label: tr("طولي"), description: "3:4", preview: <AspectPreview ratio="portrait" /> },
            { value: "landscape", label: tr("عرضي"), description: "4:3", preview: <AspectPreview ratio="landscape" /> },
          ]}
        />
      </Group>

      <Group title={tr("المنتجات في الصف (كمبيوتر)")} plain>
        <ChoiceTiles
          label={tr("المنتجات في الصف")}
          columns={3}
          value={layout.desktopGridCols}
          onChange={(v) => set("desktopGridCols", v)}
          options={[3, 4, 5].map((n) => ({ value: n as 3 | 4 | 5, label: tr("{0} منتجات", n), preview: <ColsPreview cols={n} /> }))}
        />
      </Group>

      <Group title={tr("شكل التصنيفات")} plain>
        <ChoiceTiles
          label={tr("شكل التصنيفات")}
          columns={3}
          value={layout.categoryCardStyle}
          onChange={(v) => set("categoryCardStyle", v)}
          options={[
            { value: "square", label: tr("مربع"), preview: <CategoryPreview style="square" /> },
            { value: "circle", label: tr("دائري"), preview: <CategoryPreview style="circle" /> },
            { value: "pill", label: tr("كبسولة"), preview: <CategoryPreview style="pill" /> },
          ]}
        />
      </Group>

      <Group title={tr("شكل الزراير")} plain>
        <ChoiceTiles
          label={tr("شكل الزراير")}
          columns={3}
          value={layout.buttonStyle}
          onChange={(v) => set("buttonStyle", v)}
          options={[
            { value: "sharp", label: tr("حاد"), preview: <ButtonPreview style="sharp" /> },
            { value: "rounded", label: tr("ناعم"), preview: <ButtonPreview style="rounded" /> },
            { value: "pill", label: tr("كبسولة"), preview: <ButtonPreview style="pill" /> },
          ]}
        />
      </Group>

      <Group title={tr("الإحساس العام")}>
        <Row label={tr("المسافات")}>
          <SegmentedButtons
            label={tr("المسافات")}
            value={layout.density}
            onChange={(v) => set("density", v)}
            options={[
              ["compact", tr("مضغوط")],
              ["default", tr("عادي")],
              ["spacious", tr("مريح")],
            ]}
          />
        </Row>
        <Row label={tr("الحركة")}>
          <SegmentedButtons
            label={tr("الحركة")}
            value={layout.animations}
            onChange={(v) => set("animations", v)}
            options={[
              ["none", tr("بدون")],
              ["subtle", tr("خفيفة")],
              ["dynamic", tr("حيوية")],
            ]}
          />
        </Row>
      </Group>
    </PanelBody>
  );
}
