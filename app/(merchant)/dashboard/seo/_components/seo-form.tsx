"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Copy, ExternalLink, ImagePlus, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { SaveStoreSeoAction, type SeoInput } from "@/actions/settings/seo.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { uploadImageToCloudinary } from "@/lib/cloudinary-upload";
import { cn } from "@/lib/utils";

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
  if (len < min) return "text-amber-600";
  if (len > max) return "text-rose-600";
  return "text-emerald-600";
}

function Counter({ value, range }: { value: string; range: [number, number] }) {
  const len = value.trim().length;
  return (
    <span className={cn("text-xs tabular-nums", lengthTone(len, range))}>
      {len} <span className="text-muted-foreground">/ {range[0]}–{range[1]}</span>
    </span>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-mono text-xs" dir="ltr">
          {value}
        </p>
      </div>
      <div className="flex shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label={`نسخ ${label}`}
          onClick={() => {
            navigator.clipboard?.writeText(value).catch(() => {});
            setDone(true);
            setTimeout(() => setDone(false), 1500);
          }}
        >
          {done ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
        </Button>
        <Button asChild variant="ghost" size="icon" className="size-7" aria-label={`افتح ${label}`}>
          <a href={value} target="_blank" rel="noreferrer">
            <ExternalLink className="size-3.5" />
          </a>
        </Button>
      </div>
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
      toast.error(err instanceof Error ? err.message : "فشل رفع الصورة");
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
        toast.error(result.message);
        return;
      }
      if (result.verification !== null) setValues((v) => ({ ...v, googleSiteVerification: result.verification ?? "" }));
      toast.success("اتحفظت إعدادات الظهور في جوجل");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {/* ── Search result ───────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <h2 className="font-semibold">نتيجة البحث في جوجل</h2>
          <p className="text-sm text-muted-foreground">العنوان والوصف اللي بيظهروا للناس لما يدوّروا على متجرك.</p>
        </div>
        <div className="grid gap-5 p-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="seo-title">العنوان</Label>
                <Counter value={values.seoTitle} range={TITLE_RANGE} />
              </div>
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
              <div className="flex items-center justify-between">
                <Label htmlFor="seo-desc">الوصف</Label>
                <Counter value={values.seoDescription} range={DESC_RANGE} />
              </div>
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
          </div>

          {/* Google preview */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">كده هيظهر في جوجل</p>
            <div className="rounded-xl border border-border bg-white p-4 text-[#202124] dark:bg-[#202124] dark:text-[#e8eaed]" dir="auto">
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
            <p className="text-xs text-muted-foreground">
              صفحات المنتجات بتاخد اسم المنتج ووصفه تلقائيًا — عشان كده وصف كل منتج مهم.
            </p>
          </div>
        </div>
      </section>

      {/* ── Social share ────────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <h2 className="font-semibold">المشاركة على واتساب وفيسبوك</h2>
          <p className="text-sm text-muted-foreground">لما حد يبعت لينك متجرك. سيبها فاضية وهنستخدم بيانات جوجل اللي فوق.</p>
        </div>
        <div className="grid gap-5 p-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="og-title">عنوان المشاركة</Label>
              <Input id="og-title" value={values.ogTitle} maxLength={90} placeholder={title} onChange={(e) => set("ogTitle", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="og-desc">وصف المشاركة</Label>
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
              <Label>صورة المشاركة</Label>
              {values.ogImage ? (
                <div className="flex items-center gap-2 rounded-lg border border-border p-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={values.ogImage} alt="" className="h-10 w-20 rounded object-cover" />
                  <span className="flex-1 text-xs text-muted-foreground">صورة مخصصة</span>
                  <Button type="button" variant="ghost" size="icon" className="size-7" aria-label="شيل الصورة" onClick={() => set("ogImage", "")}>
                    <X className="size-3.5" />
                  </Button>
                </div>
              ) : (
                <label className="flex h-14 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground transition-colors hover:bg-muted/50">
                  {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
                  {uploading ? "بنرفع…" : "ارفع صورة — أفضل مقاس 1200×630"}
                  <input type="file" accept="image/*" className="sr-only" onChange={onImage} disabled={uploading} />
                </label>
              )}
            </div>
          </div>

          {/* WhatsApp-style preview */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">كده هيظهر في واتساب</p>
            <div className="rounded-xl bg-[#efeae2] p-3 dark:bg-[#0b141a]">
              <div className="ms-auto max-w-[19rem] overflow-hidden rounded-lg bg-[#d9fdd3] text-[#111b21] shadow-sm dark:bg-[#005c4b] dark:text-[#e9edef]">
                <div className="m-1 overflow-hidden rounded-md bg-black/5 dark:bg-black/20">
                  {shareImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={shareImage} alt="" className="aspect-[1.91/1] w-full object-cover" />
                  ) : (
                    <div className="grid aspect-[1.91/1] place-items-center text-xs opacity-60">مفيش صورة</div>
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
          </div>
        </div>
      </section>

      {/* ── Indexing & Search Console ───────────────────────────── */}
      <section className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <h2 className="font-semibold">الأرشفة وأدوات جوجل</h2>
          <p className="text-sm text-muted-foreground">خلّي جوجل يعرف متجرك وكل منتجاته بسرعة.</p>
        </div>
        <div className="space-y-4 p-4">
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-border p-3">
            <span>
              <span className="block text-sm font-medium">اسمح لجوجل يظهر متجرك</span>
              <span className="block text-xs text-muted-foreground">لو قفلته، المتجر مش هيظهر في أي محرك بحث — مفيد بس وانت لسه بتجهّزه.</span>
            </span>
            <Switch checked={values.isIndexed} onCheckedChange={(v) => set("isIndexed", v)} />
          </label>
          {!values.isIndexed && (
            <p className="flex items-center gap-2 rounded-lg bg-rose-500/5 px-3 py-2 text-xs text-rose-700 dark:text-rose-400">
              <AlertTriangle className="size-4 shrink-0" />
              متجرك مخفي عن جوجل دلوقتي. افتحه أول ما تجهز.
            </p>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <CopyRow label="خريطة الموقع (Sitemap)" value={`${storeUrl}/sitemap.xml`} />
            <CopyRow label="ملف robots.txt" value={`${storeUrl}/robots.txt`} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="gsc">ربط Google Search Console</Label>
              <a
                href="https://search.google.com/search-console/welcome"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                افتح Search Console
                <ExternalLink className="size-3" />
              </a>
            </div>
            <Input
              id="gsc"
              dir="ltr"
              value={values.googleSiteVerification}
              onChange={(e) => set("googleSiteVerification", e.target.value)}
              placeholder='<meta name="google-site-verification" content="…" />'
              aria-invalid={error?.field === "googleSiteVerification" || undefined}
              className="font-mono text-xs"
            />
            <ol className="list-inside list-decimal space-y-1 text-xs leading-5 text-muted-foreground">
              <li>
                في Search Console اختار <span className="font-medium text-foreground">URL prefix</span> واكتب{" "}
                <span className="font-mono" dir="ltr">
                  {storeUrl}
                </span>
                .
              </li>
              <li>
                من طرق التحقق اختار <span className="font-medium text-foreground">HTML tag</span> وانسخه هنا واحفظ، وبعدين دوس Verify هناك.
              </li>
              <li>من Sitemaps ضيف الرابط اللي فوق — وجوجل هيبدأ يأرشف كل منتجاتك.</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Sticky save bar */}
      <div
        className={cn(
          "sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-xl border border-border bg-background/95 p-3 shadow-lg backdrop-blur transition-all",
          dirty ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
        )}
      >
        <p className="text-sm text-muted-foreground">{error ? <span className="text-destructive">{error.message}</span> : "عندك تعديلات مش محفوظة"}</p>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setValues(initial)} disabled={pending}>
            تراجع
          </Button>
          <Button onClick={save} disabled={pending || uploading} className="gap-1.5">
            {pending && <Loader2 className="size-4 animate-spin" />}
            حفظ
          </Button>
        </div>
      </div>
    </div>
  );
}

function Suggestions({ items, onPick }: { items: string[]; onPick: (v: string) => void }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Sparkles className="size-3.5 text-muted-foreground" />
      {items.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onPick(s)}
          className="max-w-full truncate rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
