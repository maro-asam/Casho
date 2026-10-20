"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, Loader2, RotateCcw, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { ResetThemeColorsAction, UpdateStoreColorsAction, UpdateThemeTokensAction } from "@/actions/settings/theme.actions";
import { appleButton } from "@/components/saas-page";
import { Input } from "@/components/ui/input";
import { contrastRatio, hexToRgb, readableOn, rgbToHex } from "@/lib/theme/contrast";
import { cn } from "@/lib/utils";
import { useBuilder } from "../BuilderContext";
import { Group, PanelBody, Row } from "../studio-ui";
import { tr } from "@/lib/i18n/dashboard";

const PALETTES = [
  { get name() { return tr("أزرق ثقة"); }, primary: "#2563eb", secondary: "#eff6ff" },
  { get name() { return tr("أسود فاخر"); }, primary: "#111111", secondary: "#f5f5f4" },
  { get name() { return tr("زيتوني"); }, primary: "#4d7c0f", secondary: "#f7fee7" },
  { get name() { return tr("تيراكوتا"); }, primary: "#c2410c", secondary: "#fff7ed" },
  { get name() { return tr("وردي ناعم"); }, primary: "#db2777", secondary: "#fdf2f8" },
  { get name() { return tr("بنفسجي"); }, primary: "#7c3aed", secondary: "#f5f3ff" },
  { get name() { return tr("نيلي"); }, primary: "#0f766e", secondary: "#f0fdfa" },
  { get name() { return tr("ذهبي"); }, primary: "#a16207", secondary: "#fefce8" },
];

const isHex = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v);
const SAVE_DELAY = 700;

/** Dominant, reasonably saturated colors from an image (simple 4-bit bucket quantization). */
async function extractPalette(src: string): Promise<string[]> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  await img.decode();
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  const buckets = new Map<string, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (a < 200) continue;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    // Skip near-white / near-black / grey backgrounds — they're rarely the brand color.
    if ((max > 240 && min > 225) || max < 25 || max - min < 28) continue;
    const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
    const bucket = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    bucket.n += 1;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    buckets.set(key, bucket);
  }

  const sorted = [...buckets.values()].sort((a, b) => b.n - a.n).map((b) => rgbToHex(b.r / b.n, b.g / b.n, b.b / b.n));
  const picked: string[] = [];
  for (const hex of sorted) {
    const [r, g, b] = hexToRgb(hex)!;
    const close = picked.some((p) => {
      const [pr, pg, pb] = hexToRgb(p)!;
      return Math.abs(pr - r) + Math.abs(pg - g) + Math.abs(pb - b) < 90;
    });
    if (!close) picked.push(hex);
    if (picked.length === 5) break;
  }
  return picked;
}

/** A very light tint of the brand color — a safe "secondary" surface. */
function tint(hex: string, amount = 0.92) {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#f4f4f5";
  return rgbToHex(...(rgb.map((v) => v + (255 - v) * amount) as [number, number, number]));
}

/** Round swatch that opens the system color picker, plus the hex field. */
function ColorField({ id, label, hint, value, onChange }: { id: string; label: string; hint?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <label
        className="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)] focus-within:ring-2 focus-within:ring-primary/50"
        style={{ background: isHex(value) ? value : "#fff" }}
      >
        <input
          type="color"
          value={isHex(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label={label}
        />
      </label>
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="block text-[15px] leading-5">
          {label}
        </label>
        {hint && <p className="text-[12px] leading-4 text-muted-foreground">{hint}</p>}
      </div>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value.trim())}
        dir="ltr"
        maxLength={7}
        aria-invalid={!isHex(value) || undefined}
        className="h-9! w-24 px-2.5 text-center font-mono text-[13px] uppercase"
      />
    </div>
  );
}

function Contrast({ label, ratio, good, ok }: { label: string; ratio: number; good: number; ok: number }) {
  const level = ratio >= good ? "good" : ratio >= ok ? "ok" : "bad";
  return (
    <Row
      label={label}
      value={
        <span className="flex items-center gap-1.5 text-[13px]">
          {level === "good" ? (
            <Check className="size-3.5 text-(--sys-green)" strokeWidth={3} />
          ) : (
            <AlertTriangle className={cn("size-3.5", level === "ok" ? "text-(--sys-orange)" : "text-(--sys-red)")} />
          )}
          <span className="text-foreground/85">{level === "good" ? tr("واضح") : level === "ok" ? tr("مقبول") : tr("صعب يتقري")}</span>
          <span className="font-mono text-[12px] tabular-nums text-muted-foreground" dir="ltr">
            {ratio.toFixed(1)}:1
          </span>
        </span>
      }
    />
  );
}

export default function ColorsPanel() {
  const { storeId, appearance, theme, save, sendThemeUpdate } = useBuilder();
  const [primary, setPrimary] = useState(theme.tokens.primary);
  const [secondary, setSecondary] = useState(theme.tokens.secondary);
  const [background, setBackground] = useState(theme.tokens.background);
  const [foreground, setForeground] = useState(theme.tokens.foreground);
  const [accent, setAccent] = useState(theme.tokens.accent);
  const [logoColors, setLogoColors] = useState<string[] | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSave = useRef<(() => void) | null>(null);
  // Leaving the panel mid-pick still saves the last color.
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      pendingSave.current?.();
    },
    [],
  );

  const valid = isHex(primary) && isHex(secondary);
  const onButtons = valid ? contrastRatio(primary, readableOn(primary)) : 1;
  const onWhite = valid ? contrastRatio(primary, "#ffffff") : 1;

  /** Instant in the canvas; saved to the draft once the merchant stops picking. */
  function schedule(run: () => void) {
    if (timer.current) clearTimeout(timer.current);
    pendingSave.current = run;
    timer.current = setTimeout(() => {
      pendingSave.current = null;
      run();
    }, SAVE_DELAY);
  }

  function setBrand(nextPrimary: string, nextSecondary: string) {
    setPrimary(nextPrimary);
    setSecondary(nextSecondary);
    if (!isHex(nextPrimary) || !isHex(nextSecondary)) return;
    sendThemeUpdate({
      "--store-primary": nextPrimary,
      "--primary": nextPrimary,
      "--ring": nextPrimary,
      "--store-primary-foreground": readableOn(nextPrimary),
      "--primary-foreground": readableOn(nextPrimary),
      "--store-secondary": nextSecondary,
      "--secondary": nextSecondary,
      "--store-secondary-foreground": readableOn(nextSecondary),
      "--secondary-foreground": readableOn(nextSecondary),
    });
    schedule(() => void save(() => UpdateStoreColorsAction({ storeId, primaryColor: nextPrimary, secondaryColor: nextSecondary, target: "draft" })));
  }

  function setSurface(key: "background" | "foreground" | "accent", value: string) {
    ({ background: setBackground, foreground: setForeground, accent: setAccent })[key](value);
    if (!isHex(value)) return;
    sendThemeUpdate({ [`--store-${key}`]: value, [`--${key}`]: value });
    schedule(() => void save(() => UpdateThemeTokensAction({ storeId, overrides: { [key]: value }, target: "draft" })));
  }

  async function fromLogo() {
    if (!appearance.logo) return;
    setExtracting(true);
    try {
      const colors = await extractPalette(appearance.logo);
      if (!colors.length) {
        toast.error(tr("اللوجو مفيهوش ألوان واضحة — جرّب الباليتات الجاهزة."));
        return;
      }
      setLogoColors(colors);
      setBrand(colors[0], tint(colors[0]));
    } catch {
      toast.error(tr("مقدرناش نقرا ألوان اللوجو. ارفعه تاني من الهوية."));
    } finally {
      setExtracting(false);
    }
  }

  async function resetToTheme() {
    if (timer.current) clearTimeout(timer.current);
    pendingSave.current = null;
    setResetting(true);
    const ok = await save(() => ResetThemeColorsAction({ storeId, target: "draft" }));
    setResetting(false);
    if (ok) {
      setPrimary(theme.presetTokens.primary);
      setSecondary(theme.presetTokens.secondary);
    }
  }

  return (
    <PanelBody>
      <Group title={tr("من اللوجو")} footer={!appearance.logo ? tr("ارفع اللوجو الأول من «الهوية واللوجو».") : undefined}>
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-(--fill-3)">
            {appearance.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={appearance.logo} alt="" className="size-full object-contain" />
            ) : (
              <Wand2 className="size-4 text-muted-foreground" />
            )}
          </div>
          <p className="min-w-0 flex-1 text-[13px] leading-[18px] text-muted-foreground">
            {tr("بنطلع ألوان علامتك من اللوجو ونظبط الباقي تلقائي.")}
          </p>
          <button type="button" className={cn(appleButton.tinted, "h-9 text-[13px] text-primary")} onClick={fromLogo} disabled={!appearance.logo || extracting}>
            {extracting ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
            {tr("استخرج")}
          </button>
        </div>
        {logoColors && (
          <div className="flex flex-wrap gap-2 px-4 pb-3">
            {logoColors.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={c}
                onClick={() => setBrand(c, tint(c))}
                className={cn(
                  "apple-press size-9 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)] ring-offset-2 ring-offset-card",
                  primary === c && "ring-2 ring-primary",
                )}
                style={{ background: c }}
              />
            ))}
          </div>
        )}
      </Group>

      <Group title={tr("باليتات جاهزة")} plain>
        <div className="grid grid-cols-4 gap-2">
          {PALETTES.map((p) => {
            const active = p.primary === primary && p.secondary === secondary;
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => setBrand(p.primary, p.secondary)}
                aria-pressed={active}
                className={cn(
                  "apple-press flex flex-col items-center gap-1.5 rounded-[14px] bg-card px-1 py-2.5 transition-shadow",
                  active ? "ring-2 ring-primary" : "ring-1 ring-transparent hover:ring-foreground/10",
                )}
              >
                <span className="relative size-8 overflow-hidden rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)]">
                  <span className="absolute inset-0" style={{ background: p.primary }} />
                  <span className="absolute inset-y-0 end-0 w-1/2" style={{ background: p.secondary }} />
                </span>
                <span className="w-full truncate text-center text-[11px] leading-[14px]">{p.name}</span>
              </button>
            );
          })}
        </div>
      </Group>

      <Group title={tr("ألوانك")} footer={tr("بتشوف التغيير في المعاينة على طول، وبيتحفظ في المسودة لوحده.")}>
        <ColorField id="color-primary" label={tr("اللون الأساسي")} hint={tr("الزراير والروابط والأسعار")} value={primary} onChange={(v) => setBrand(v, secondary)} />
        <ColorField id="color-secondary" label={tr("اللون الثانوي")} hint={tr("الخلفيات الخفيفة والشارات")} value={secondary} onChange={(v) => setBrand(primary, v)} />
      </Group>

      {valid && (
        <Group title={tr("سهولة القراية")}>
          <Contrast label={tr("الكلام على الزراير")} ratio={onButtons} good={4.5} ok={3} />
          <Contrast label={tr("الأسعار على الأبيض")} ratio={onWhite} good={3} ok={2} />
        </Group>
      )}

      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 text-[13px] text-muted-foreground [&::-webkit-details-marker]:hidden">
          {tr("ألوان متقدمة")}
          <span className="text-primary group-open:hidden">{tr("عرض")}</span>
          <span className="hidden text-primary group-open:inline">{tr("إخفاء")}</span>
        </summary>
        <div className="mt-1.5 apple-rows overflow-hidden rounded-[14px] bg-card [--row-inset:64px]">
          <ColorField id="color-bg" label={tr("خلفية الصفحة")} value={background} onChange={(v) => setSurface("background", v)} />
          <ColorField id="color-fg" label={tr("لون الكلام")} value={foreground} onChange={(v) => setSurface("foreground", v)} />
          <ColorField id="color-accent" label={tr("لون التمييز")} hint={tr("تأثيرات الـ hover والتفاصيل")} value={accent} onChange={(v) => setSurface("accent", v)} />
        </div>
      </details>

      <button type="button" className={cn(appleButton.plain, "mx-0 w-full justify-center")} onClick={resetToTheme} disabled={resetting}>
        {resetting ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
        {tr("رجّع ألوان الثيم الأصلية")}
      </button>
    </PanelBody>
  );
}
