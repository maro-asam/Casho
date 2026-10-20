"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import QRCodeStyling, { type Options } from "qr-code-styling";
import { AlertTriangle, Check, Copy, Download, FileImage, LayoutGrid, Loader2, MessageCircle, Package, Printer, Store, Ticket } from "lucide-react";
import { toast } from "sonner";

import { SegmentedButtons, appleButton } from "@/components/saas-page";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toWhatsAppDigits } from "@/lib/conversion/conversion-config";
import { contrastRatio, hexToRgb } from "@/lib/theme/contrast";
import { cn } from "@/lib/utils";
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

  const targets: { value: Target; label: string; icon: typeof Store; tint: string }[] = [
    { value: "store", label: tr("المتجر"), icon: Store, tint: "bg-primary" },
    { value: "product", label: tr("منتج"), icon: Package, tint: "bg-(--sys-orange)" },
    { value: "category", label: tr("تصنيف"), icon: LayoutGrid, tint: "bg-(--sys-teal)" },
    { value: "coupon", label: tr("كود خصم"), icon: Ticket, tint: "bg-(--sys-red)" },
    { value: "whatsapp", label: tr("واتساب"), icon: MessageCircle, tint: "bg-(--sys-green)" },
  ];
  const spec = CARDS[cardSize];
  const safeFg = validColors ? fg : "#111111";
  const safeBg = validColors ? bg : "#ffffff";
  const shownUrl = target === "whatsapp" ? "WhatsApp" : url.replace(/^https?:\/\//, "").replace(/\?.*$/, "");

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="min-w-0 space-y-8">
        {/* ── 1. Target ────────────────────────────────────────── */}
        <Step n={1} title={tr("الكود يفتح إيه؟")} subtitle={tr("كل كود ممكن يودّي على مكان مختلف — اطبع واحد لكل استخدام.")}>
          <div className="grid grid-cols-3 gap-2 p-4 sm:grid-cols-5">
            {targets.map((t) => {
              const Icon = t.icon;
              const active = target === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTarget(t.value)}
                  className={cn(
                    "apple-press flex flex-col items-center gap-2 rounded-[14px] px-2 py-3 text-[13px] ring-inset transition-[background-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active ? "bg-primary/10 font-semibold ring-2 ring-primary" : "bg-(--fill-3) hover:bg-(--fill-3)/70",
                  )}
                >
                  <span className={cn("grid size-9 place-items-center rounded-[10px] text-white", t.tint)}>
                    <Icon className="size-5" />
                  </span>
                  {t.label}
                </button>
              );
            })}
          </div>

          {(target === "product" || target === "category" || target === "coupon" || target === "whatsapp") && (
            <div className="space-y-2 px-4 py-4">
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
                    <p className="px-1 text-[13px] text-muted-foreground">{tr("العميل يمسح ← يدخل المتجر ← الكود يتطبق لوحده في السلة.")}</p>
                  </>
                ) : (
                  <EmptyHint text={tr("معندكش أكواد خصم شغّالة.")} href="/coupons?new=1" action={tr("اعمل كود")} />
                ))}
              {target === "whatsapp" &&
                (whatsapp ? (
                  <>
                    <label htmlFor="wa-msg" className="block px-1 text-[13px] text-muted-foreground">
                      {tr("الرسالة اللي هتتكتب لوحدها")}
                    </label>
                    <Input id="wa-msg" value={waMessage} maxLength={120} onChange={(e) => setWaMessage(e.target.value)} />
                  </>
                ) : (
                  <EmptyHint text={tr("مفيش رقم واتساب في الإعدادات.")} href="/settings" action={tr("ضيف الرقم")} />
                ))}
            </div>
          )}

          <div className="flex items-center gap-2 px-4 py-3">
            <p className="min-w-0 flex-1 truncate font-mono text-[13px] text-muted-foreground" dir="ltr">
              {url}
            </p>
            <button type="button" className={cn(appleButton.more, "size-8")} onClick={copyUrl} aria-label={tr("نسخ الرابط")}>
              {copied ? <Check className="size-4 text-(--sys-green)" strokeWidth={2.6} /> : <Copy className="size-4" />}
            </button>
          </div>
        </Step>

        {/* ── 2. Design ────────────────────────────────────────── */}
        <Step n={2} title={tr("الشكل")}>
          <div className="space-y-5 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="px-1 text-[13px] text-muted-foreground">{tr("النقاط")}</p>
                <SegmentedButtons label={tr("النقاط")} value={dot} onChange={setDot} className="flex w-full flex-wrap [&>button]:flex-1 [&>button]:justify-center" options={DOTS.map((d) => [d.value, d.label] as const)} />
              </div>
              <div className="space-y-2">
                <p className="px-1 text-[13px] text-muted-foreground">{tr("الزوايا")}</p>
                <SegmentedButtons label={tr("الزوايا")} value={corner} onChange={setCorner} className="flex w-full [&>button]:flex-1 [&>button]:justify-center" options={CORNERS.map((c) => [c.value, c.label] as const)} />
              </div>
            </div>

            <div className="space-y-2.5">
              <p className="px-1 text-[13px] text-muted-foreground">{tr("الألوان")}</p>
              <div className="flex flex-wrap gap-3">
                {presets.map((p) => {
                  const on = fg === p.fg && bg === p.bg;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setFg(p.fg);
                        setBg(p.bg);
                      }}
                      aria-pressed={on}
                      className="group flex flex-col items-center gap-1.5 text-[12px] text-muted-foreground"
                    >
                      <span
                        className={cn(
                          "grid size-10 place-items-center rounded-full ring-1 ring-black/10 transition-shadow",
                          on && "shadow-[0_0_0_2px_var(--card),0_0_0_4px_var(--primary)]",
                        )}
                        style={{ background: p.bg }}
                      >
                        <span className="size-5 rounded-full" style={{ background: p.fg }} />
                      </span>
                      <span className={cn(on && "font-semibold text-foreground")}>{p.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <ColorField label={tr("لون الكود")} value={fg} onChange={setFg} />
                <ColorField label={tr("الخلفية")} value={bg} onChange={setBg} />
              </div>
            </div>
          </div>
          <label className={cn("flex cursor-pointer items-center justify-between gap-3 px-4 py-3", !logo && "cursor-default opacity-60")}>
            <span className="min-w-0">
              <span className="block text-[15px]">{tr("اللوجو في النص")}</span>
              <span className="block text-[13px] text-muted-foreground">
                {logo ? tr("بنقوّي تصحيح الأخطاء تلقائي عشان الكود يفضل يتقري.") : tr("ارفع لوجو من صفحة التخصيص الأول.")}
              </span>
            </span>
            <Switch className="apple-switch" checked={withLogo} onCheckedChange={setWithLogo} disabled={!logo} />
          </label>
        </Step>

        {/* ── 3. Print card ────────────────────────────────────── */}
        <Step n={3} title={tr("كارت جاهز للطباعة")} subtitle={tr("اللوجو واسم المتجر والكود وجملة تشجّع على المسح — بدقة طباعة.")}>
          <div className="grid grid-cols-3 gap-2 p-4">
            {(Object.keys(CARDS) as CardSize[]).map((key) => {
              const c = CARDS[key];
              const active = cardSize === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCardSize(key)}
                  aria-pressed={active}
                  className={cn(
                    "apple-press flex flex-col items-center gap-2 rounded-[14px] p-3 text-center ring-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active ? "bg-primary/10 ring-2 ring-primary" : "bg-(--fill-3) hover:bg-(--fill-3)/70",
                  )}
                >
                  <span aria-hidden className="grid h-12 place-items-center">
                    <span className={cn("block rounded-[3px] border-2", active ? "border-primary" : "border-foreground/30")} style={{ width: `${(c.w / c.h) * 40}px`, height: "40px" }} />
                  </span>
                  <span className={cn("text-[15px]", active && "font-semibold")}>{c.label}</span>
                  <span className="text-[12px] leading-4 text-muted-foreground">{c.hint}</span>
                </button>
              );
            })}
          </div>
          <div className="space-y-2 px-4 py-4">
            <label htmlFor="cta" className="block px-1 text-[13px] text-muted-foreground">
              {tr("الجملة تحت الكود")}
            </label>
            <Input id="cta" value={cta} maxLength={40} onChange={(e) => setCta(e.target.value)} />
            <div className="flex flex-wrap gap-1.5">
              {CTA_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCta(c)}
                  className={cn(
                    "apple-press rounded-full px-3 py-1 text-[13px] transition-colors",
                    cta === c ? "bg-primary text-primary-foreground" : "bg-primary/8 text-primary hover:bg-primary/12",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </Step>
      </div>

      {/* ── Live print preview + downloads ─────────────────────── */}
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="flex flex-col items-center gap-4 rounded-[28px] bg-(--fill-3) p-6">
          {/* The card, at the chosen size's proportions — same layout as the downloaded PNG. */}
          <div
            className="flex w-full max-w-[17rem] flex-col items-center justify-center overflow-hidden rounded-[10px] px-[7%] py-[8%] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.3)]"
            style={{ aspectRatio: `${spec.w} / ${spec.h}`, background: safeBg, color: safeFg }}
          >
            {cardSize !== "sticker" && logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" className="mb-[5%] h-[9%] w-auto object-contain" />
            )}
            <p className="max-w-full truncate text-center text-[15px] font-bold">{storeName}</p>
            <div ref={previewRef} className="my-[6%] aspect-square w-[78%] [&>canvas]:size-full [&>svg]:size-full" aria-label={tr("معاينة الـ QR")} role="img" />
            <span className="max-w-full truncate rounded-full px-3 py-1 text-[11px] font-bold" style={{ background: safeFg, color: safeBg }}>
              {cta}
            </span>
            <p className="mt-[4%] max-w-full truncate text-[9px] opacity-65" dir="ltr">
              {shownUrl}
            </p>
          </div>

          <p className={cn("flex items-center gap-1.5 text-[13px]", scannable ? "text-foreground/80" : "text-(--sys-red)")}>
            <span className={cn("grid size-4 place-items-center rounded-full text-white", scannable ? "bg-(--sys-green)" : "bg-(--sys-red)")}>
              {scannable ? <Check className="size-2.5" strokeWidth={4} /> : <AlertTriangle className="size-2.5" strokeWidth={3} />}
            </span>
            {scannable
              ? tr("الألوان واضحة — الكود هيتقري بسهولة")
              : inverted
                ? tr("الكود فاتح على خلفية غامقة — موبايلات كتير مش هتقراه")
                : tr("الألوان قريبة من بعض — الكاميرا ممكن متقراهوش")}
          </p>
        </div>

        <button type="button" onClick={downloadCard} disabled={!!busy || !scannable} className={cn(appleButton.filled, "h-[50px] w-full text-[17px]")}>
          {busy === "card" ? <Loader2 className="size-4 animate-spin" /> : <Printer className="size-4" />}
          {tr("حمّل {0} للطباعة", spec.label)}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => downloadCode("png")} disabled={!!busy || !scannable} className={cn(appleButton.tinted, "h-11 text-primary")}>
            {busy === "png" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            PNG
          </button>
          <button type="button" onClick={() => downloadCode("svg")} disabled={!!busy || !scannable} className={cn(appleButton.tinted, "h-11 text-primary")}>
            {busy === "svg" ? <Loader2 className="size-4 animate-spin" /> : <FileImage className="size-4" />}
            {tr("SVG للمطبعة")}
          </button>
        </div>
        <p className="px-2 text-center text-[13px] text-muted-foreground">{tr("جرّبه بكاميرا موبايلك قبل ما تطبع. أقل مقاس للطباعة ٢×٢ سم.")}</p>
      </aside>
    </div>
  );
}

/** Numbered step: header outside, Settings-style card with inset hairlines inside. */
function Step({ n, title, subtitle, children }: { n: number; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-start gap-3 px-1">
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-foreground text-[13px] font-bold text-background tabular-nums">{n}</span>
        <div className="min-w-0">
          <h2 className="text-[20px] leading-[26px] font-bold">{title}</h2>
          {subtitle && <p className="text-[15px] text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <div className="apple-card apple-rows overflow-hidden [--row-inset:16px]">{children}</div>
    </section>
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
    <p className="rounded-[12px] bg-(--fill-3) px-4 py-3 text-[15px] text-muted-foreground">
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
      <span className="block px-1 text-[13px] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <label className="relative size-11 shrink-0 cursor-pointer overflow-hidden rounded-full ring-1 ring-black/10" style={{ background: valid ? value : "#fff" }}>
          <input type="color" value={valid ? value : "#000000"} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label={label} />
        </label>
        <Input value={value} onChange={(e) => onChange(e.target.value.trim())} dir="ltr" maxLength={7} aria-invalid={!valid || undefined} className="font-mono text-[13px] uppercase" />
      </div>
    </div>
  );
}
