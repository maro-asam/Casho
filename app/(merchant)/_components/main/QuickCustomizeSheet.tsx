"use client";

import { useState, useTransition, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Loader2,
  PaintRoller,
  Save,
} from "lucide-react";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { STORE_THEMES, type StoreThemeId } from "@/constants/store-themes";
import { ARABIC_FONT_LIST, type ArabicFontId } from "@/constants/arabic-fonts";
import { STORE_NAVBAR_VARIANTS, type StoreNavbarVariant } from "@/constants/store-navbar";

import { UpdateStoreThemeAction } from "@/actions/themes/update-store-theme.actions";
import { UpdateStoreFontAction } from "@/actions/store/update-store-font.actions";
import { UpdateNavbarVariantAction } from "@/actions/settings/update-navbar-variant.actions";
import { UpdateStoreColorsAction } from "@/actions/store/update-store-colors.actions";
import { cn } from "@/lib/utils";

type Settings = {
  themeId: string | null;
  fontId: string | null;
  navbarVariant: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
} | null;

type Props = {
  storeId: string;
  settings: Settings;
};

const DEFAULT_PRIMARY = "#2563eb";
const DEFAULT_SECONDARY = "#f3f4f6";

export default function QuickCustomizeSheet({ storeId, settings }: Props) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
          <PaintRoller className="size-3.5" />
          <span className="hidden sm:inline">تخصيص المتجر</span>
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        dir="rtl"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-lg"
      >
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <PaintRoller className="size-4 text-primary" />
            تخصيص المتجر
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="theme" className="flex min-h-0 flex-1 flex-col">
          <TabsList className="mx-4 mt-4 grid h-9 w-auto grid-cols-4 shrink-0 rounded-lg">
            <TabsTrigger value="theme" className="text-xs">ثيم</TabsTrigger>
            <TabsTrigger value="font" className="text-xs">خطوط</TabsTrigger>
            <TabsTrigger value="navbar" className="text-xs">قائمة</TabsTrigger>
            <TabsTrigger value="colors" className="text-xs">ألوان</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            {/* ── Theme Tab ── */}
            <TabsContent value="theme" className="m-0 p-4">
              <ThemeSection storeId={storeId} currentThemeId={settings?.themeId} />
            </TabsContent>

            {/* ── Font Tab ── */}
            <TabsContent value="font" className="m-0 p-4">
              <FontSection storeId={storeId} currentFontId={settings?.fontId} />
            </TabsContent>

            {/* ── Navbar Tab ── */}
            <TabsContent value="navbar" className="m-0 p-4">
              <NavbarSection storeId={storeId} currentVariant={settings?.navbarVariant as StoreNavbarVariant | null} />
            </TabsContent>

            {/* ── Colors Tab ── */}
            <TabsContent value="colors" className="m-0 p-4">
              <ColorsSection
                storeId={storeId}
                primaryColor={settings?.primaryColor}
                secondaryColor={settings?.secondaryColor}
              />
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <div className="shrink-0 border-t px-5 py-3">
          <Button asChild variant="ghost" size="sm" className="w-full justify-between text-xs text-muted-foreground">
            <Link href="/dashboard/customization">
              عرض كل خيارات التخصيص
              <ArrowLeft className="size-3.5" />
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ──────────────────── Theme ──────────────────── */

function ThemeSection({ storeId, currentThemeId }: { storeId: string; currentThemeId?: string | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const activeId = (currentThemeId ?? "classic") as StoreThemeId;

  function select(themeId: StoreThemeId) {
    if (themeId === activeId || isPending) return;
    startTransition(async () => {
      const res = await UpdateStoreThemeAction({ storeId, themeId });
      if (res.success) { toast.success(res.message); router.refresh(); }
      else toast.error(res.message);
    });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Object.values(STORE_THEMES).map((theme) => {
        const active = activeId === theme.id;
        const vars = {
          "--tp": theme.tokens.primaryColor,
          "--ts": theme.tokens.secondaryColor,
          "--tb": theme.tokens.background,
          "--tc": theme.tokens.card,
          "--tm": theme.tokens.muted,
        } as CSSProperties;

        return (
          <button
            key={theme.id}
            type="button"
            disabled={isPending}
            onClick={() => select(theme.id)}
            style={vars}
            className={cn(
              "relative overflow-hidden rounded-xl border text-right transition-all duration-200 disabled:pointer-events-none disabled:opacity-60",
              active
                ? "border-primary ring-2 ring-primary/20 shadow-md"
                : "border-border hover:border-primary/50 hover:shadow-md",
            )}
          >
            {/* Mini preview */}
            <div className="h-24 overflow-hidden" style={{ background: "var(--tb)" }}>
              <div className="flex h-7 items-center justify-between px-2" style={{ background: "var(--tp)" }}>
                <div className="h-2 w-10 rounded-full" style={{ background: "rgba(255,255,255,.75)" }} />
                <div className="h-4 w-7 rounded-md" style={{ background: "var(--ts)" }} />
              </div>
              <div className="flex h-[60px] flex-col justify-center gap-1.5 px-3" style={{ background: "var(--tp)" }}>
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative h-2 w-20 rounded-full" style={{ background: "rgba(255,255,255,.9)" }} />
                <div className="relative h-1.5 w-14 rounded-full" style={{ background: "rgba(255,255,255,.55)" }} />
              </div>
            </div>
            {/* Label */}
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs font-semibold">{theme.name}</span>
              {active ? (
                <span className="flex items-center gap-1 text-[10px] font-medium text-primary">
                  <Check className="size-3" /> مُفعّل
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground">تفعيل ←</span>
              )}
            </div>
            {/* Loading overlay */}
            {isPending && active && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                <Loader2 className="size-5 animate-spin text-white" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ──────────────────── Font ──────────────────── */

function FontSection({ storeId, currentFontId }: { storeId: string; currentFontId?: string | null }) {
  const [isPending, startTransition] = useTransition();
  const activeId = (currentFontId ?? "cairo") as ArabicFontId;

  function select(fontId: ArabicFontId) {
    if (fontId === activeId || isPending) return;
    startTransition(async () => {
      const res = await UpdateStoreFontAction({ storeId, fontId });
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  }

  return (
    <>
      {/* Load preview fonts */}
      {ARABIC_FONT_LIST.map((f) => (
        <link key={f.id} rel="stylesheet" href={f.googleUrl} />
      ))}

      <div className="grid gap-2 sm:grid-cols-2">
        {ARABIC_FONT_LIST.map((font) => {
          const active = font.id === activeId;
          return (
            <button
              key={font.id}
              type="button"
              disabled={isPending}
              onClick={() => select(font.id as ArabicFontId)}
              className={cn(
                "relative flex flex-col gap-1.5 rounded-xl border p-3 text-right transition-all duration-200",
                "disabled:pointer-events-none disabled:opacity-60",
                active
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-md"
                  : "border-border hover:border-primary/50 hover:shadow-md",
              )}
            >
              <span className="text-lg leading-snug" style={{ fontFamily: font.family }}>
                {font.sample}
              </span>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground" dir="ltr">{font.name}</span>
                {active ? (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-primary">
                    <Check className="size-3" /> مُفعّل
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">تفعيل ←</span>
                )}
              </div>
              {isPending && active && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/60 backdrop-blur-sm">
                  <Loader2 className="size-4 animate-spin text-primary" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ──────────────────── Navbar ──────────────────── */

function NavbarSection({ storeId, currentVariant }: { storeId: string; currentVariant?: StoreNavbarVariant | null }) {
  const [isPending, startTransition] = useTransition();
  const active = (currentVariant ?? "default") as StoreNavbarVariant;

  function select(variant: StoreNavbarVariant) {
    if (variant === active || isPending) return;
    startTransition(async () => {
      const res = await UpdateNavbarVariantAction({ storeId, variant });
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  }

  return (
    <div className="grid gap-3">
      {STORE_NAVBAR_VARIANTS.map((item) => {
        const isActive = active === item.value;
        return (
          <button
            key={item.value}
            type="button"
            disabled={isPending}
            onClick={() => select(item.value)}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-4 text-right transition-all duration-200",
              "disabled:pointer-events-none disabled:opacity-60",
              isActive
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-border hover:border-primary/50 hover:shadow-md",
            )}
          >
            <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
              {isActive ? <Check className="size-4" /> : <span className="text-xs font-bold">{item.label[0]}</span>}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
            {isActive && <span className="text-[10px] font-medium text-primary">مُفعّل</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ──────────────────── Colors ──────────────────── */

function ColorsSection({ storeId, primaryColor, secondaryColor }: { storeId: string; primaryColor?: string | null; secondaryColor?: string | null }) {
  const [primary, setPrimary] = useState(primaryColor ?? DEFAULT_PRIMARY);
  const [secondary, setSecondary] = useState(secondaryColor ?? DEFAULT_SECONDARY);
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const res = await UpdateStoreColorsAction({ storeId, primaryColor: primary, secondaryColor: secondary });
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  }

  return (
    <div className="space-y-5">
      {/* Preview bar */}
      <div className="overflow-hidden rounded-xl border">
        <div className="flex h-10 items-center justify-between px-4" style={{ background: primary }}>
          <div className="h-2.5 w-14 rounded-full" style={{ background: "rgba(255,255,255,.75)" }} />
          <div className="flex h-6 w-16 items-center justify-center rounded-lg text-[10px] font-bold" style={{ background: secondary, color: primary }}>
            تسوق الآن
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Primary */}
        <div className="space-y-2">
          <Label className="text-xs">اللون الأساسي</Label>
          <div className="flex items-center gap-2">
            <div className="relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-lg shadow-sm ring-1 ring-black/10" style={{ background: primary }}>
              <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="absolute inset-0 size-full cursor-pointer opacity-0" />
            </div>
            <Input value={primary} onChange={(e) => setPrimary(e.target.value)} dir="ltr" className="h-8 font-mono text-xs uppercase" maxLength={7} />
          </div>
        </div>

        {/* Secondary */}
        <div className="space-y-2">
          <Label className="text-xs">اللون الثانوي</Label>
          <div className="flex items-center gap-2">
            <div className="relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-lg shadow-sm ring-1 ring-black/10" style={{ background: secondary }}>
              <input type="color" value={secondary} onChange={(e) => setSecondary(e.target.value)} className="absolute inset-0 size-full cursor-pointer opacity-0" />
            </div>
            <Input value={secondary} onChange={(e) => setSecondary(e.target.value)} dir="ltr" className="h-8 font-mono text-xs uppercase" maxLength={7} />
          </div>
        </div>
      </div>

      <Button onClick={save} disabled={isPending} size="sm" className="w-full gap-2">
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        حفظ الألوان
      </Button>
    </div>
  );
}
