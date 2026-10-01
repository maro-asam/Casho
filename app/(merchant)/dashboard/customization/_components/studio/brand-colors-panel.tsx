"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Loader2, RotateCcw, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { UpdateStoreColorsAction } from "@/actions/settings/theme.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { contrastRatio, hexToRgb, readableOn, rgbToHex } from "@/lib/theme/contrast";
import { cn } from "@/lib/utils";

const PALETTES = [
  { name: "أزرق ثقة", primary: "#2563eb", secondary: "#eff6ff" },
  { name: "أسود فاخر", primary: "#111111", secondary: "#f5f5f4" },
  { name: "زيتوني", primary: "#4d7c0f", secondary: "#f7fee7" },
  { name: "تيراكوتا", primary: "#c2410c", secondary: "#fff7ed" },
  { name: "وردي ناعم", primary: "#db2777", secondary: "#fdf2f8" },
  { name: "بنفسجي", primary: "#7c3aed", secondary: "#f5f3ff" },
  { name: "نيلي", primary: "#0f766e", secondary: "#f0fdfa" },
  { name: "ذهبي", primary: "#a16207", secondary: "#fefce8" },
];

const isHex = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v);

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
    if (max > 240 && min > 225) continue;
    if (max < 25) continue;
    if (max - min < 28) continue;
    const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
    const bucket = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    bucket.n += 1;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    buckets.set(key, bucket);
  }

  const sorted = [...buckets.values()].sort((a, b) => b.n - a.n).map((b) => rgbToHex(b.r / b.n, b.g / b.n, b.b / b.n));
  // Drop colors too close to one already picked.
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

type Props = {
  storeId: string;
  storeName: string;
  logo: string | null;
  primaryColor: string;
  secondaryColor: string;
  themeDefaults: { primary: string; secondary: string };
};

export function BrandColorsPanel({ storeId, storeName, logo, primaryColor, secondaryColor, themeDefaults }: Props) {
  const router = useRouter();
  const [primary, setPrimary] = useState(primaryColor);
  const [secondary, setSecondary] = useState(secondaryColor);
  const [logoColors, setLogoColors] = useState<string[] | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [pending, startTransition] = useTransition();

  const dirty = primary !== primaryColor || secondary !== secondaryColor;
  const valid = isHex(primary) && isHex(secondary);
  const buttonText = valid ? readableOn(primary) : "#ffffff";
  const buttonContrast = valid ? contrastRatio(primary, buttonText) : 1;
  const onWhite = valid ? contrastRatio(primary, "#ffffff") : 1;

  async function fromLogo() {
    if (!logo) return;
    setExtracting(true);
    try {
      const colors = await extractPalette(logo);
      if (!colors.length) {
        toast.error("اللوجو مفيهوش ألوان واضحة — جرّب الباليتات الجاهزة.");
        return;
      }
      setLogoColors(colors);
      setPrimary(colors[0]);
      setSecondary(tint(colors[0]));
    } catch {
      toast.error("مقدرناش نقرا ألوان اللوجو. ارفعه تاني من تبويب الهوية.");
    } finally {
      setExtracting(false);
    }
  }

  function save() {
    if (!valid) return toast.error("اكتب اللون بصيغة ‎#RRGGBB");
    startTransition(async () => {
      const result = await UpdateStoreColorsAction({ storeId, primaryColor: primary, secondaryColor: secondary });
      if (result.success) {
        toast.success("الألوان اتحفظت واتطبقت على المتجر");
        router.refresh();
      } else toast.error(result.message);
    });
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
      <div className="space-y-4">
        {/* From logo — the fastest way to an on-brand store */}
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-muted">
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo} alt="" className="size-full object-contain" />
                ) : (
                  <Wand2 className="size-4 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold">ألوان من اللوجو</p>
                <p className="text-xs text-muted-foreground">
                  {logo ? "بنطلع ألوان علامتك من اللوجو ونظبط الباقي تلقائي." : "ارفع اللوجو الأول من تبويب الهوية."}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={fromLogo} disabled={!logo || extracting}>
              {extracting ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
              استخرج الألوان
            </Button>
          </div>
          {logoColors && (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
              {logoColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setPrimary(c);
                    setSecondary(tint(c));
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs transition-colors",
                    primary === c ? "border-foreground" : "border-border hover:border-foreground/30",
                  )}
                >
                  <span className="size-5 rounded-md ring-1 ring-black/10" style={{ background: c }} />
                  <span className="font-mono uppercase" dir="ltr">
                    {c}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Ready palettes */}
        <section className="space-y-2">
          <p className="text-sm font-medium">باليتات جاهزة</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PALETTES.map((p) => {
              const active = p.primary === primary && p.secondary === secondary;
              return (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => {
                    setPrimary(p.primary);
                    setSecondary(p.secondary);
                  }}
                  aria-pressed={active}
                  className={cn(
                    "group overflow-hidden rounded-lg border text-right transition-colors",
                    active ? "border-foreground ring-1 ring-foreground" : "border-border hover:border-foreground/30",
                  )}
                >
                  <div className="flex h-10">
                    <span className="flex-[2]" style={{ background: p.primary }} />
                    <span className="flex-1" style={{ background: p.secondary }} />
                  </div>
                  <div className="flex items-center justify-between px-2.5 py-1.5 text-xs">
                    {p.name}
                    {active && <Check className="size-3.5" />}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Manual */}
        <section className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-2">
          {(
            [
              ["primary", "اللون الأساسي", "الزراير والروابط والأسعار", primary, setPrimary],
              ["secondary", "اللون الثانوي", "الخلفيات الخفيفة والشارات", secondary, setSecondary],
            ] as const
          ).map(([id, label, hint, value, set]) => (
            <div key={id} className="space-y-2">
              <Label htmlFor={`color-${id}`}>{label}</Label>
              <div className="flex items-center gap-2">
                <label className="relative size-10 shrink-0 cursor-pointer overflow-hidden rounded-lg ring-1 ring-black/10" style={{ background: isHex(value) ? value : "#fff" }}>
                  <input
                    type="color"
                    value={isHex(value) ? value : "#000000"}
                    onChange={(e) => set(e.target.value)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    aria-label={label}
                  />
                </label>
                <Input
                  id={`color-${id}`}
                  value={value}
                  onChange={(e) => set(e.target.value.trim())}
                  dir="ltr"
                  maxLength={7}
                  aria-invalid={!isHex(value) || undefined}
                  className="h-10 font-mono uppercase"
                />
              </div>
              <p className="text-xs text-muted-foreground">{hint}</p>
            </div>
          ))}

          {valid && (
            <div className="space-y-1.5 sm:col-span-2">
              <ContrastRow ok={buttonContrast >= 4.5} warn={buttonContrast >= 3} label="الكلام على الزراير" ratio={buttonContrast} />
              <ContrastRow ok={onWhite >= 3} warn={onWhite >= 2} label="الأسعار والروابط على الخلفية البيضا" ratio={onWhite} />
            </div>
          )}
        </section>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={save} disabled={!dirty || !valid || pending} className="gap-1.5">
            {pending && <Loader2 className="size-4 animate-spin" />}
            حفظ الألوان
          </Button>
          {dirty && (
            <Button
              variant="ghost"
              onClick={() => {
                setPrimary(primaryColor);
                setSecondary(secondaryColor);
              }}
              disabled={pending}
            >
              تراجع
            </Button>
          )}
          <Button
            variant="ghost"
            className="gap-1.5 text-muted-foreground"
            onClick={() => {
              setPrimary(themeDefaults.primary);
              setSecondary(themeDefaults.secondary);
            }}
            disabled={pending}
          >
            <RotateCcw className="size-3.5" />
            ألوان الثيم الأصلية
          </Button>
        </div>
      </div>

      {/* Preview */}
      <aside className="xl:sticky xl:top-20 xl:self-start">
        <p className="mb-2 text-xs font-medium text-muted-foreground">كده هيبان متجرك</p>
        <MiniStore name={storeName} logo={logo} primary={valid ? primary : primaryColor} secondary={valid ? secondary : secondaryColor} />
      </aside>
    </div>
  );
}

function ContrastRow({ ok, warn, label, ratio }: { ok: boolean; warn: boolean; label: string; ratio: number }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs">
      <span className="flex items-center gap-1.5">
        {ok ? <Check className="size-3.5 text-emerald-600" /> : <AlertTriangle className={cn("size-3.5", warn ? "text-amber-600" : "text-rose-600")} />}
        {label}
      </span>
      <span className={cn("font-medium", ok ? "text-emerald-700 dark:text-emerald-400" : warn ? "text-amber-700 dark:text-amber-400" : "text-rose-700 dark:text-rose-400")}>
        {ok ? "واضح" : warn ? "مقبول" : "صعب يتقري"} <span className="font-mono tabular-nums opacity-70">{ratio.toFixed(1)}:1</span>
      </span>
    </div>
  );
}

function MiniStore({ name, logo, primary, secondary }: { name: string; logo: string | null; primary: string; secondary: string }) {
  const onPrimary = readableOn(primary);
  const onSecondary = readableOn(secondary);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white text-[#0a0a0a] shadow-sm" dir="rtl">
      <div className="py-1 text-center text-[10px]" style={{ background: primary, color: onPrimary }}>
        شحن مجاني للطلبات فوق ٥٠٠ جنيه
      </div>
      <div className="flex items-center justify-between border-b border-black/5 px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="size-6 rounded object-contain" />
          ) : (
            <span className="size-6 rounded" style={{ background: primary }} />
          )}
          <span className="text-xs font-bold">{name}</span>
        </div>
        <div className="flex gap-2 text-[10px] text-black/50">
          <span>الرئيسية</span>
          <span>المنتجات</span>
        </div>
      </div>
      <div className="m-3 rounded-lg p-4" style={{ background: secondary, color: onSecondary }}>
        <p className="text-sm font-bold">كولكشن جديد</p>
        <p className="mt-0.5 text-[11px] opacity-70">خصم لحد ٣٠٪ لفترة محدودة</p>
        <span className="mt-2 inline-block rounded-md px-3 py-1 text-[11px] font-semibold" style={{ background: primary, color: onPrimary }}>
          تسوّق دلوقتي
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 px-3 pb-3">
        {[0, 1].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="relative aspect-square rounded-lg bg-black/5">
              {i === 0 && (
                <span className="absolute start-1.5 top-1.5 rounded px-1.5 py-0.5 text-[9px] font-semibold" style={{ background: secondary, color: onSecondary }}>
                  جديد
                </span>
              )}
            </div>
            <div className="h-1.5 w-3/4 rounded-full bg-black/10" />
            <p className="text-[11px] font-bold" style={{ color: primary }}>
              ٤٥٠ ج.م
            </p>
            <div className="rounded-md py-1 text-center text-[10px] font-semibold" style={{ background: primary, color: onPrimary }}>
              أضف للسلة
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
