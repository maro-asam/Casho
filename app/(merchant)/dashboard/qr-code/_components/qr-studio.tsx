"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import QRCodeStyling, { type Options } from "qr-code-styling";
import { AlertTriangle, Check, Copy, Download, FileImage, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toWhatsAppDigits } from "@/lib/conversion/conversion-config";
import { contrastRatio, hexToRgb } from "@/lib/theme/contrast";
import { cn } from "@/lib/utils";
import { Segmented } from "@/components/common/settings-controls";
import { lazyList, tdir, tr } from "@/lib/i18n/dashboard";

type DotType = "square" | "dots" | "rounded" | "classy-rounded" | "extra-rounded";
type CornerType = "square" | "extra-rounded" | "dot";
type Target = "store" | "product" | "category" | "coupon" | "whatsapp";
type CardSize = "sticker" | "card" | "poster";

type Props = {
  storeName: string;
  baseUrl: string;
  logo: string | null;
  brandColor: string;
  whatsapp: string | null;
  products: { slug: string; name: string }[];
  categories: { slug: string; name: string }[];
  coupons: { code: string; label: string }[];
};

const DOTS: { value: DotType; label: string }[] = [
  { value: "square", get label() { return tr("مربعات"); } },
  { value: "rounded", get label() { return tr("مدوّر"); } },
  { value: "dots", get label() { return tr("نقاط"); } },
  { value: "classy-rounded", get label() { return tr("أنيق"); } },
  { value: "extra-rounded", get label() { return tr("ناعم"); } },
];

const CORNERS: { value: CornerType; label: string }[] = [
  { value: "square", get label() { return tr("مربع"); } },
  { value: "extra-rounded", get label() { return tr("مدوّر"); } },
  { value: "dot", get label() { return tr("دائري"); } },
];

/** Card layouts in px at print-friendly resolution. */
const CARDS: Record<CardSize, { label: string; hint: string; w: number; h: number }> = {
  sticker: { get label() { return tr("ستيكر"); }, get hint() { return tr("مربع ١٠×١٠ سم — للكياس والعلب"); }, w: 1200, h: 1200 },
  card: { get label() { return tr("كارت"); }, get hint() { return tr("A6 — جوّه الأوردر أو على الكاشير"); }, w: 1240, h: 1748 },
  poster: { get label() { return tr("بوستر"); }, get hint() { return tr("A4 — على الحيطة أو الفاترينة"); }, w: 2480, h: 3508 },
};

const CTA_PRESETS = lazyList(["امسح واطلب أونلاين", "امسح وشوف كل المنتجات", "امسح وخد الخصم 🎁", "كلّمنا واتساب"]);

/** Same dots/corners as the on-screen preview, at any size. */
function buildOptions(o: {
  data: string;
  size: number;
  dot: DotType;
  corner: CornerType;
  fg: string;
  bg: string;
  logo: string | null;
  transparent?: boolean;
}): Options {
  return {
    width: o.size,
    height: o.size,
    margin: Math.round(o.size * 0.04),
    data: o.data,
    image: o.logo ?? undefined,
    imageOptions: { crossOrigin: "anonymous", margin: Math.round(o.size * 0.012), imageSize: 0.32, hideBackgroundDots: true },
    // A logo hides modules — use the strongest error correction so it still scans.
    qrOptions: { errorCorrectionLevel: o.logo ? "H" : "M" },
    dotsOptions: { type: o.dot, color: o.fg },
    cornersSquareOptions: { type: o.corner, color: o.fg },
    cornersDotOptions: { type: o.corner === "dot" ? "dot" : "square", color: o.fg },
    backgroundOptions: { color: o.transparent ? "transparent" : o.bg },
  };
}

const luminance = (hex: string) => {
  const rgb = hexToRgb(hex);
  return rgb ? (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255 : 0;
};

export function QrStudio({ storeName, baseUrl, logo, brandColor, whatsapp, products, categories, coupons }: Props) {
  // ── What it opens ────────────────────────────────────────────────
  const [target, setTarget] = useState<Target>("store");
  const [product, setProduct] = useState(products[0]?.slug ?? "");
  const [category, setCategory] = useState(categories[0]?.slug ?? "");
  const [coupon, setCoupon] = useState(coupons[0]?.code ?? "");
  const [waMessage, setWaMessage] = useState(tr("أهلاً، عايز أطلب"));

  // ── How it looks ─────────────────────────────────────────────────
  const [dot, setDot] = useState<DotType>("rounded");
  const [corner, setCorner] = useState<CornerType>("extra-rounded");
  const [fg, setFg] = useState("#111111");
  const [bg, setBg] = useState("#ffffff");
  const [withLogo, setWithLogo] = useState(Boolean(logo));

  // ── Print card ───────────────────────────────────────────────────
  const [cardSize, setCardSize] = useState<CardSize>("card");
  const [cta, setCta] = useState(CTA_PRESETS[0]);
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const qr = useRef<QRCodeStyling | null>(null);

  const url = useMemo(() => {
    switch (target) {
      case "product":
        return product ? `${baseUrl}/products/${product}` : baseUrl;
      case "category":
        return category ? `${baseUrl}/categories/${category}` : baseUrl;
      case "coupon":
        return coupon ? `${baseUrl}/?coupon=${encodeURIComponent(coupon)}` : baseUrl;
      case "whatsapp":
        return whatsapp ? `https://wa.me/${toWhatsAppDigits(whatsapp)}?text=${encodeURIComponent(waMessage)}` : baseUrl;
      default:
        return baseUrl;
    }
  }, [target, product, category, coupon, whatsapp, waMessage, baseUrl]);

  const validColors = Boolean(hexToRgb(fg) && hexToRgb(bg));
  const contrast = validColors ? contrastRatio(fg, bg) : 1;
  const inverted = validColors && luminance(fg) > luminance(bg);
  const scannable = contrast >= 3 && !inverted;
  const opts = useMemo(
    () => buildOptions({ data: url, size: 280, dot, corner, fg: validColors ? fg : "#111111", bg: validColors ? bg : "#ffffff", logo: withLogo ? logo : null }),
    [url, dot, corner, fg, bg, withLogo, logo, validColors],
  );

  useEffect(() => {
    if (!qr.current) {
      qr.current = new QRCodeStyling(opts);
      if (previewRef.current) {
        previewRef.current.innerHTML = "";
        qr.current.append(previewRef.current);
      }
    } else {
      qr.current.update(opts);
    }
  }, [opts]);

  const fileName = `${storeName}-qr`.replace(/[\\/:*?"<>|\s]+/g, "-");

  async function downloadCode(ext: "png" | "svg") {
    setBusy(ext);
    try {
      const big = new QRCodeStyling({ ...opts, ...buildOptions({ data: url, size: 1024, dot, corner, fg, bg, logo: withLogo ? logo : null }) });
      await big.download({ name: fileName, extension: ext });
    } finally {
      setBusy(null);
    }
  }

  /** Composes logo + name + QR + CTA + URL onto a canvas and downloads it. */
  async function downloadCard() {
    setBusy("card");
    try {
      const spec = CARDS[cardSize];
      const unit = spec.w / 1240;
      const qrSize = Math.round(Math.min(spec.w * 0.62, spec.h * 0.5));
      const raw = await new QRCodeStyling(buildOptions({ data: url, size: qrSize, dot, corner, fg, bg, logo: withLogo ? logo : null })).getRawData("png");
      if (!raw || !(raw instanceof Blob)) throw new Error("qr");
      const qrImg = await createImageBitmap(raw);

      const canvas = document.createElement("canvas");
      canvas.width = spec.w;
      canvas.height = spec.h;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, spec.w, spec.h);
      ctx.direction = "rtl";
      ctx.textAlign = "center";
      const font = getComputedStyle(document.body).fontFamily || "sans-serif";

      let y = spec.h * (cardSize === "sticker" ? 0.07 : 0.08);
      // Brand band
      ctx.fillStyle = fg;
      ctx.font = `700 ${Math.round(64 * unit)}px ${font}`;
      if (cardSize !== "sticker" && logo) {
        try {
          const res = await fetch(logo, { mode: "cors" });
          const logoImg = await createImageBitmap(await res.blob());
          const lh = Math.round(150 * unit);
          const lw = Math.round((logoImg.width / logoImg.height) * lh);
          ctx.drawImage(logoImg, (spec.w - lw) / 2, y, lw, lh);
          y += lh + 40 * unit;
        } catch {
          // logo blocked by CORS — name alone is fine
        }
      }
      ctx.textBaseline = "top";
      ctx.fillText(storeName, spec.w / 2, y, spec.w * 0.9);
      y += 64 * unit + 24 * unit;

      // QR
      const qrY = cardSize === "sticker" ? spec.h * 0.2 : Math.max(y + 30 * unit, spec.h * 0.22);
      ctx.drawImage(qrImg, (spec.w - qrSize) / 2, qrY, qrSize, qrSize);

      // CTA pill
      let ty = qrY + qrSize + 50 * unit;
      ctx.font = `700 ${Math.round(56 * unit)}px ${font}`;
      const pad = 40 * unit;
      const tw = Math.min(ctx.measureText(cta).width + pad * 2, spec.w * 0.9);
      const th = 96 * unit;
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.roundRect((spec.w - tw) / 2, ty, tw, th, th / 2);
      ctx.fill();
      ctx.fillStyle = bg;
      ctx.textBaseline = "middle";
      ctx.fillText(cta, spec.w / 2, ty + th / 2, tw - pad);
      ty += th + 36 * unit;

      // URL
      ctx.fillStyle = fg;
      ctx.globalAlpha = 0.65;
      ctx.direction = "ltr";
      ctx.textBaseline = "top";
      ctx.font = `500 ${Math.round(34 * unit)}px ${font}`;
      const shown = target === "whatsapp" ? "WhatsApp" : url.replace(/^https?:\/\//, "").replace(/\?.*$/, "");
      ctx.fillText(shown, spec.w / 2, ty, spec.w * 0.9);
      ctx.globalAlpha = 1;

      const link = document.createElement("a");
      link.download = `${fileName}-${cardSize}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      toast.error(tr("مقدرناش نجهّز الكارت. جرّب تشيل اللوجو من جوّه الكود."));
    } finally {
      setBusy(null);
    }
  }

  function copyUrl() {
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const presets = [
    { label: tr("أسود"), fg: "#111111", bg: "#ffffff" },
    { label: tr("لون متجرك"), fg: brandColor, bg: "#ffffff" },
    { label: tr("كحلي"), fg: "#1e3a8a", bg: "#eff6ff" },
    { label: tr("أخضر"), fg: "#166534", bg: "#f0fdf4" },
    { label: tr("ذهبي"), fg: "#78350f", bg: "#fffbeb" },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-4">
        {/* ── Target ───────────────────────────────────────────── */}
        <section className="space-y-4 rounded-xl border border-border bg-card p-4">
          <div>
            <h2 className="font-semibold">{tr("الكود يفتح إيه؟")}</h2>
            <p className="text-sm text-muted-foreground">{tr("كل كود ممكن يودّي على مكان مختلف — اطبع واحد لكل استخدام.")}</p>
          </div>
          <Segmented
            value={target}
            onChange={setTarget}
            options={[
              { value: "store", label: tr("المتجر") },
              { value: "product", label: tr("منتج") },
              { value: "category", label: tr("تصنيف") },
              { value: "coupon", label: tr("كود خصم") },
              { value: "whatsapp", label: tr("واتساب") },
            ]}
          />

          {target === "product" &&
            (products.length ? (
              <PickerSelect value={product} onChange={setProduct} items={products.map((p) => ({ value: p.slug, label: p.name }))} />
            ) : (
              <EmptyHint text={tr("مفيش منتجات ظاهرة لسه.")} href="/products/new" action={tr("ضيف منتج")} />
            ))}
          {target === "category" &&
            (categories.length ? (
              <PickerSelect value={category} onChange={setCategory} items={categories.map((c) => ({ value: c.slug, label: c.name }))} />
            ) : (
              <EmptyHint text={tr("مفيش تصنيفات فيها منتجات.")} href="/categories" action={tr("التصنيفات")} />
            ))}
          {target === "coupon" &&
            (coupons.length ? (
              <>
                <PickerSelect value={coupon} onChange={setCoupon} items={coupons.map((c) => ({ value: c.code, label: `${c.code} · ${c.label}` }))} />
                <p className="text-xs text-muted-foreground">{tr("العميل يمسح ← يدخل المتجر ← الكود يتطبق لوحده في السلة.")}</p>
              </>
            ) : (
              <EmptyHint text={tr("معندكش أكواد خصم شغّالة.")} href="/coupons?new=1" action={tr("اعمل كود")} />
            ))}
          {target === "whatsapp" &&
            (whatsapp ? (
              <div className="space-y-2">
                <Label htmlFor="wa-msg" className="text-xs">
                  {tr("الرسالة اللي هتتكتب لوحدها")}
                </Label>
                <Input id="wa-msg" value={waMessage} maxLength={120} onChange={(e) => setWaMessage(e.target.value)} />
              </div>
            ) : (
              <EmptyHint text={tr("مفيش رقم واتساب في الإعدادات.")} href="/settings" action={tr("ضيف الرقم")} />
            ))}

          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
            <p className="min-w-0 flex-1 truncate font-mono text-xs" dir="ltr">
              {url}
            </p>
            <Button type="button" variant="ghost" size="icon" className="size-7 shrink-0" onClick={copyUrl} aria-label={tr("نسخ الرابط")}>
              {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
            </Button>
          </div>
        </section>

        {/* ── Design ───────────────────────────────────────────── */}
        <section className="space-y-5 rounded-xl border border-border bg-card p-4">
          <h2 className="font-semibold">{tr("الشكل")}</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs">{tr("النقاط")}</Label>
              <Segmented value={dot} onChange={setDot} options={DOTS} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">{tr("الزوايا")}</Label>
              <Segmented value={corner} onChange={setCorner} options={CORNERS} />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">{tr("الألوان")}</Label>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setFg(p.fg);
                    setBg(p.bg);
                  }}
                  aria-pressed={fg === p.fg && bg === p.bg}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
                    fg === p.fg && bg === p.bg ? "border-foreground" : "border-border hover:border-foreground/30",
                  )}
                >
                  <span className="flex size-5 items-center justify-center rounded border border-black/10" style={{ background: p.bg }}>
                    <span className="size-2.5 rounded-sm" style={{ background: p.fg }} />
                  </span>
                  {p.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ColorField label={tr("لون الكود")} value={fg} onChange={setFg} />
              <ColorField label={tr("الخلفية")} value={bg} onChange={setBg} />
            </div>
          </div>

          <label className={cn("flex items-center justify-between gap-3 rounded-lg border border-border p-3", !logo && "opacity-60")}>
            <span>
              <span className="block text-sm font-medium">{tr("اللوجو في النص")}</span>
              <span className="block text-xs text-muted-foreground">
                {logo ? tr("بنقوّي تصحيح الأخطاء تلقائي عشان الكود يفضل يتقري.") : tr("ارفع لوجو من صفحة التخصيص الأول.")}
              </span>
            </span>
            <Switch checked={withLogo} onCheckedChange={setWithLogo} disabled={!logo} />
          </label>
        </section>

        {/* ── Print card ───────────────────────────────────────── */}
        <section className="space-y-4 rounded-xl border border-border bg-card p-4">
          <div>
            <h2 className="font-semibold">{tr("كارت جاهز للطباعة")}</h2>
            <p className="text-sm text-muted-foreground">{tr("اللوجو واسم المتجر والكود وجملة تشجّع على المسح — بدقة طباعة.")}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {(Object.keys(CARDS) as CardSize[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setCardSize(key)}
                aria-pressed={cardSize === key}
                className={cn(
                  "rounded-lg border p-3 text-start transition-colors",
                  cardSize === key ? "border-primary bg-primary/5" : "border-border hover:border-foreground/30",
                )}
              >
                <span className="block text-sm font-medium">{CARDS[key].label}</span>
                <span className="block text-xs text-muted-foreground">{CARDS[key].hint}</span>
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="cta" className="text-xs">
              {tr("الجملة تحت الكود")}
            </Label>
            <Input id="cta" value={cta} maxLength={40} onChange={(e) => setCta(e.target.value)} />
            <div className="flex flex-wrap gap-1.5">
              {CTA_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCta(c)}
                  className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ── Preview + downloads ─────────────────────────────────── */}
      <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-5">
          <div className="rounded-2xl p-3 shadow-sm ring-1 ring-black/5" style={{ background: validColors ? bg : "#fff" }}>
            <div ref={previewRef} className="size-[280px] [&>canvas]:size-full [&>svg]:size-full" aria-label={tr("معاينة الـ QR")} role="img" />
          </div>
          <p className={cn("flex items-center gap-1.5 text-xs", scannable ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400")}>
            {scannable ? <Check className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
            {scannable
              ? tr("الألوان واضحة — الكود هيتقري بسهولة")
              : inverted
                ? tr("الكود فاتح على خلفية غامقة — موبايلات كتير مش هتقراه")
                : tr("الألوان قريبة من بعض — الكاميرا ممكن متقراهوش")}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => downloadCode("png")} disabled={!!busy || !scannable} className="gap-1.5">
            {busy === "png" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            PNG
          </Button>
          <Button variant="outline" onClick={() => downloadCode("svg")} disabled={!!busy || !scannable} className="gap-1.5">
            {busy === "svg" ? <Loader2 className="size-4 animate-spin" /> : <FileImage className="size-4" />}
            {tr("SVG للمطبعة")}
          </Button>
          <Button variant="secondary" onClick={downloadCard} disabled={!!busy || !scannable} className="col-span-2 gap-1.5">
            {busy === "card" ? <Loader2 className="size-4 animate-spin" /> : <Printer className="size-4" />}
            {tr("حمّل {0} للطباعة", CARDS[cardSize].label)}
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          {tr("جرّبه بكاميرا موبايلك قبل ما تطبع. أقل مقاس للطباعة ٢×٢ سم.")}
        </p>
      </aside>
    </div>
  );
}

function PickerSelect({ value, onChange, items }: { value: string; onChange: (v: string) => void; items: { value: string; label: string }[] }) {
  return (
    <Select value={value} onValueChange={onChange} dir={tdir()}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((i) => (
          <SelectItem key={i.value} value={i.value}>
            {i.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function EmptyHint({ text, href, action }: { text: string; href: string; action: string }) {
  return (
    <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
      {text}{" "}
      <Link href={href} className="font-medium text-primary hover:underline">
        {action}
      </Link>
    </p>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const valid = Boolean(hexToRgb(value));
  return (
    <div className="space-y-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <label className="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-lg ring-1 ring-black/10" style={{ background: valid ? value : "#fff" }}>
          <input type="color" value={valid ? value : "#000000"} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label={label} />
        </label>
        <Input value={value} onChange={(e) => onChange(e.target.value.trim())} dir="ltr" maxLength={7} aria-invalid={!valid || undefined} className="h-9 font-mono text-xs uppercase" />
      </div>
    </div>
  );
}
