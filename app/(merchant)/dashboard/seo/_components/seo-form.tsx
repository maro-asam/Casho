"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Copy, ExternalLink, FileCode2, ImagePlus, Loader2, Map, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { SaveStoreSeoAction, type SeoInput } from "@/actions/settings/seo.actions";
import { appleButton } from "@/components/saas-page";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { uploadImageToCloudinary } from "@/lib/cloudinary-upload";
import { cn } from "@/lib/utils";
import { tr, trv } from "@/lib/i18n/dashboard";

type Values = Required<{ [K in keyof SeoInput]: NonNullable<SeoInput[K]> }>;

type Props = {
  storeId: string;
  storeName: string;
  storeUrl: string;
  logo: string | null;
  initial: Values;
  /** Fallbacks the store actually uses when a field is empty. */
  fallbacks: { title: string; description: string; image: string | null };
  suggestions: { titles: string[]; descriptions: string[] };
};

const TITLE_RANGE: [number, number] = [30, 60];
const DESC_RANGE: [number, number] = [70, 160];

function lengthTone(len: number, [min, max]: [number, number]) {
  if (len === 0) return "text-muted-foreground";
  if (len < min) return "text-(--sys-orange)";
  if (len > max) return "text-(--sys-red)";
  return "text-(--sys-green)";
}

function Counter({ value, range }: { value: string; range: [number, number] }) {
  const len = value.trim().length;
  return (
    <span className={cn("text-[13px] font-semibold tabular-nums", lengthTone(len, range))}>
      {len} <span className="font-normal text-muted-foreground">/ {range[0]}–{range[1]}</span>
    </span>
  );
}

function CopyRow({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Map }) {
  const [done, setDone] = useState(false);
  return (
    <div className="flex min-h-14 items-center gap-3 px-4 py-2.5">
      <span aria-hidden className="grid size-[29px] shrink-0 place-items-center rounded-[7px] bg-(--sys-gray) text-white">
        <Icon className="size-[17px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px]">{label}</p>
        <p className="truncate font-mono text-[12px] text-muted-foreground" dir="ltr">
          {value}
        </p>
      </div>
      <button
        type="button"
        className={cn(appleButton.more, "size-8")}
        aria-label={tr("نسخ {0}", label)}
        onClick={() => {
          navigator.clipboard?.writeText(value).catch(() => {});
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        }}
      >
        {done ? <Check className="size-4 text-(--sys-green)" strokeWidth={2.6} /> : <Copy className="size-4" />}
      </button>
      <a href={value} target="_blank" rel="noreferrer" className={cn(appleButton.more, "size-8")} aria-label={tr("افتح {0}", label)}>
        <ExternalLink className="size-4" />
      </a>
    </div>
  );
}

/** Editor + live preview, side by side: the fields on a card, the preview on the canvas. */
function Studio({ id, title, subtitle, fields, preview, previewLabel }: { id: string; title: string; subtitle: string; fields: React.ReactNode; preview: React.ReactNode; previewLabel: string }) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <div className="px-1">
        <h2 id={id} className="text-[22px] leading-[28px] font-bold ltr:tracking-[-0.01em]">
          {title}
        </h2>
        <p className="text-[15px] text-muted-foreground">{subtitle}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="apple-card space-y-5 p-5">{fields}</div>
        <div className="flex flex-col gap-2 rounded-[22px] bg-(--fill-3) p-5">
          <p className="text-[13px] font-semibold text-muted-foreground">{previewLabel}</p>
          <div className="flex flex-1 items-center">{preview}</div>
        </div>
      </div>
    </section>
  );
}

function FieldHead({ htmlFor, label, extra }: { htmlFor?: string; label: string; extra?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-1">
      <Label htmlFor={htmlFor} className="text-[13px] font-normal text-muted-foreground">
        {label}
      </Label>
      {extra}
    </div>
  );
}

export function SeoForm({ storeId, storeName, storeUrl, logo, initial, fallbacks, suggestions }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<Values>(initial);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<{ field?: string; message: string } | null>(null);
  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (error?.field === key) setError(null);
  };

  const dirty = JSON.stringify(values) !== JSON.stringify(initial);
  const title = values.seoTitle.trim() || fallbacks.title;
  const description = values.seoDescription.trim() || fallbacks.description;
  const shareTitle = values.ogTitle.trim() || title;
  const shareDescription = values.ogDescription.trim() || description;
  const shareImage = values.ogImage || fallbacks.image;
  const host = storeUrl.replace(/^https?:\/\//, "");

  async function onImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setUploading(true);
      set("ogImage", await uploadImageToCloudinary(file, "casho/uploads/seo"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tr("فشل رفع الصورة"));
    } finally {
      setUploading(false);
    }
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await SaveStoreSeoAction(storeId, values);
      if (!result.ok) {
        setError({ field: result.field, message: result.message });
        toast.error(trv(result.message));
        return;
      }
      if (result.verification !== null) setValues((v) => ({ ...v, googleSiteVerification: result.verification ?? "" }));
      toast.success(tr("اتحفظت إعدادات الظهور في جوجل"));
      router.refresh();
    });
  }

  return (
    <div className="space-y-10">
      {/* ── Search result ───────────────────────────────────────── */}
      <Studio
        id="search"
        title={tr("نتيجة البحث في جوجل")}
        subtitle={tr("العنوان والوصف اللي بيظهروا للناس لما يدوّروا على متجرك.")}
        previewLabel={tr("كده هيظهر في جوجل")}
        fields={
          <>
            <div className="space-y-2">
              <FieldHead htmlFor="seo-title" label={tr("العنوان")} extra={<Counter value={values.seoTitle} range={TITLE_RANGE} />} />
              <Input
                id="seo-title"
                value={values.seoTitle}
                maxLength={70}
                placeholder={fallbacks.title}
                onChange={(e) => set("seoTitle", e.target.value)}
                aria-invalid={error?.field === "seoTitle" || undefined}
              />
              <Suggestions items={suggestions.titles} onPick={(v) => set("seoTitle", v)} />
            </div>
            <div className="space-y-2">
              <FieldHead htmlFor="seo-desc" label={tr("الوصف")} extra={<Counter value={values.seoDescription} range={DESC_RANGE} />} />
              <Textarea
                id="seo-desc"
                rows={3}
                maxLength={170}
                value={values.seoDescription}
                placeholder={fallbacks.description}
                onChange={(e) => set("seoDescription", e.target.value)}
                className="resize-none"
              />
              <Suggestions items={suggestions.descriptions} onPick={(v) => set("seoDescription", v)} />
            </div>
            <p className="px-1 text-[13px] leading-[18px] text-muted-foreground">
              {tr("صفحات المنتجات بتاخد اسم المنتج ووصفه تلقائيًا — عشان كده وصف كل منتج مهم.")}
            </p>
          </>
        }
        preview={
          <div className="w-full rounded-[14px] bg-white p-4 text-[#202124] shadow-[0_1px_3px_rgba(0,0,0,0.08)] dark:bg-[#202124] dark:text-[#e8eaed]" dir="auto">
            <div className="flex items-center gap-2.5">
              <span className="grid size-7 shrink-0 place-items-center overflow-hidden rounded-full border border-black/10 bg-[#f1f3f4] dark:border-white/10 dark:bg-[#303134]">
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo} alt="" className="size-full object-cover" />
                ) : (
                  <span className="text-xs font-bold">{storeName.charAt(0)}</span>
                )}
              </span>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm">{storeName}</p>
                <p className="truncate text-xs text-[#4d5156] dark:text-[#bdc1c6]" dir="ltr">
                  https://{host}
                </p>
              </div>
            </div>
            <p className="mt-2 line-clamp-1 text-lg text-[#1a0dab] dark:text-[#99c3ff]">{title}</p>
            <p className="mt-0.5 line-clamp-2 text-sm leading-[1.58] text-[#4d5156] dark:text-[#bdc1c6]">{description}</p>
          </div>
        }
      />

      {/* ── Social share ────────────────────────────────────────── */}
      <Studio
        id="share"
        title={tr("المشاركة على واتساب وفيسبوك")}
        subtitle={tr("لما حد يبعت لينك متجرك. سيبها فاضية وهنستخدم بيانات جوجل اللي فوق.")}
        previewLabel={tr("كده هيظهر في واتساب")}
        fields={
          <>
            <div className="space-y-2">
              <FieldHead htmlFor="og-title" label={tr("عنوان المشاركة")} />
              <Input id="og-title" value={values.ogTitle} maxLength={90} placeholder={title} onChange={(e) => set("ogTitle", e.target.value)} />
            </div>
            <div className="space-y-2">
              <FieldHead htmlFor="og-desc" label={tr("وصف المشاركة")} />
              <Textarea
                id="og-desc"
                rows={2}
                maxLength={200}
                value={values.ogDescription}
                placeholder={description}
                onChange={(e) => set("ogDescription", e.target.value)}
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <FieldHead label={tr("صورة المشاركة")} />
              {values.ogImage ? (
                <div className="apple-field flex items-center gap-3 p-1.5 pe-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={values.ogImage} alt="" className="h-11 w-21 rounded-[8px] object-cover" />
                  <span className="flex-1 text-[15px] text-muted-foreground">{tr("صورة مخصصة")}</span>
                  <button type="button" className={cn(appleButton.more, "size-8")} aria-label={tr("شيل الصورة")} onClick={() => set("ogImage", "")}>
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <label className="apple-field apple-press flex h-14 cursor-pointer items-center justify-center gap-2 text-[15px] text-primary">
                  {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
                  {uploading ? tr("بنرفع…") : tr("ارفع صورة — أفضل مقاس 1200×630")}
                  <input type="file" accept="image/*" className="sr-only" onChange={onImage} disabled={uploading} />
                </label>
              )}
            </div>
          </>
        }
        preview={
          <div className="w-full rounded-[14px] bg-[#efeae2] p-3 dark:bg-[#0b141a]">
            <div className="ms-auto max-w-[19rem] overflow-hidden rounded-lg bg-[#d9fdd3] text-[#111b21] shadow-sm dark:bg-[#005c4b] dark:text-[#e9edef]">
              <div className="m-1 overflow-hidden rounded-md bg-black/5 dark:bg-black/20">
                {shareImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={shareImage} alt="" className="aspect-[1.91/1] w-full object-cover" />
                ) : (
                  <div className="grid aspect-[1.91/1] place-items-center text-xs opacity-60">{tr("مفيش صورة")}</div>
                )}
                <div className="space-y-0.5 p-2" dir="auto">
                  <p className="line-clamp-1 text-[13px] font-semibold">{shareTitle}</p>
                  <p className="line-clamp-2 text-xs opacity-75">{shareDescription}</p>
                  <p className="text-[11px] opacity-60" dir="ltr">
                    {host}
                  </p>
                </div>
              </div>
              <p className="px-2 pb-1.5 text-xs text-[#027eb5] dark:text-[#53bdeb]" dir="ltr">
                {storeUrl}
              </p>
            </div>
          </div>
        }
      />

      {/* ── Indexing & Search Console ───────────────────────────── */}
      <section aria-labelledby="indexing" className="space-y-3">
        <div className="px-1">
          <h2 id="indexing" className="text-[22px] leading-[28px] font-bold ltr:tracking-[-0.01em]">
            {tr("الأرشفة وأدوات جوجل")}
          </h2>
          <p className="text-[15px] text-muted-foreground">{tr("خلّي جوجل يعرف متجرك وكل منتجاته بسرعة.")}</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="apple-card apple-rows overflow-hidden rounded-[22px] [--row-inset:60px]">
              <label className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3">
                <span className="min-w-0">
                  <span className="block text-[15px]">{tr("اسمح لجوجل يظهر متجرك")}</span>
                  <span className="block text-[13px] leading-[18px] text-muted-foreground">
                    {tr("لو قفلته، المتجر مش هيظهر في أي محرك بحث — مفيد بس وانت لسه بتجهّزه.")}
                  </span>
                </span>
                <Switch className="apple-switch" checked={values.isIndexed} onCheckedChange={(v) => set("isIndexed", v)} />
              </label>
              <CopyRow label={tr("خريطة الموقع (Sitemap)")} value={`${storeUrl}/sitemap.xml`} icon={Map} />
              <CopyRow label={tr("ملف robots.txt")} value={`${storeUrl}/robots.txt`} icon={FileCode2} />
            </div>
            {!values.isIndexed && (
              <p className="flex items-center gap-2.5 rounded-[14px] bg-(--sys-red)/10 px-4 py-3 text-[15px]">
                <AlertTriangle className="size-[18px] shrink-0 text-(--sys-red)" />
                {tr("متجرك مخفي عن جوجل دلوقتي. افتحه أول ما تجهز.")}
              </p>
            )}
          </div>

          <div className="apple-card space-y-4 p-5">
            <FieldHead
              htmlFor="gsc"
              label={tr("ربط Google Search Console")}
              extra={
                <a href="https://search.google.com/search-console/welcome" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[13px] text-primary">
                  {tr("افتح Search Console")}
                  <ExternalLink className="size-3" />
                </a>
              }
            />
            <Input
              id="gsc"
              dir="ltr"
              value={values.googleSiteVerification}
              onChange={(e) => set("googleSiteVerification", e.target.value)}
              placeholder='<meta name="google-site-verification" content="…" />'
              aria-invalid={error?.field === "googleSiteVerification" || undefined}
              className="font-mono text-[13px]"
            />
            <ol className="space-y-2.5">
              {[
                <>
                  {tr("في Search Console اختار")}{" "}<span className="font-medium text-foreground">URL prefix</span>{" "}{tr("واكتب")}{" "}
                  <span className="font-mono" dir="ltr">
                    {storeUrl}
                  </span>
                  .
                </>,
                <>
                  {tr("من طرق التحقق اختار")}{" "}<span className="font-medium text-foreground">HTML tag</span>{" "}{tr("وانسخه هنا واحفظ، وبعدين دوس Verify هناك.")}
                </>,
                <>{tr("من Sitemaps ضيف الرابط اللي فوق — وجوجل هيبدأ يأرشف كل منتجاتك.")}</>,
              ].map((step, n) => (
                <li key={n} className="flex gap-3 text-[13px] leading-5 text-muted-foreground">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-(--fill-3) text-[11px] font-bold text-foreground tabular-nums">{n + 1}</span>
                  <span className="min-w-0">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Floating save bar (glass) — appears once something changed. */}
      <div
        className={cn(
          "sticky bottom-4 z-20 flex justify-center transition-[opacity,transform] duration-300 ease-(--ease-apple)",
          dirty ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
        )}
      >
        <div className="apple-glass flex items-center gap-2 rounded-full p-1.5 ps-5">
          <p className="me-2 text-[13px] text-muted-foreground">
            {error ? <span className="text-(--sys-red)">{trv(error.message)}</span> : tr("عندك تعديلات مش محفوظة")}
          </p>
          <button type="button" className={cn(appleButton.plain, "mx-0 h-10")} onClick={() => setValues(initial)} disabled={pending}>
            {tr("تراجع")}
          </button>
          <button type="button" className={cn(appleButton.filled, "h-10")} onClick={save} disabled={pending || uploading}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {tr("حفظ")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Suggestions({ items, onPick }: { items: string[]; onPick: (v: string) => void }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 px-1">
      <Sparkles className="size-3.5 text-primary" />
      {items.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onPick(s)}
          className="apple-press max-w-full truncate rounded-full bg-primary/8 px-3 py-1 text-[13px] text-primary transition-colors hover:bg-primary/12"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
