"use client";

/**
 * Content editors for home sections. Each edits one SectionContentMap entry and
 * autosaves it to the draft (UpdateSectionContentAction), so the canvas follows.
 */

import { useState } from "react";
import { AlignCenter, AlignLeft, AlignRight, ImagePlus, Loader2, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { UpdateSectionContentAction } from "@/actions/settings/theme.actions";
import { SegmentedButtons, appleButton } from "@/components/saas-page";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { uploadImageToCloudinary } from "@/lib/cloudinary-upload";
import { cn } from "@/lib/utils";
import type { SectionContentMap, SectionKey } from "@/types/store-theme.types";
import { useBuilder } from "./BuilderContext";
import { Field, Group, Row, SwitchRow, useAutosave } from "./studio-ui";
import { tr } from "@/lib/i18n/dashboard";

type ContentKey = keyof SectionContentMap;

/** Which content entry each editable section owns. */
const CONTENT_KEY: Partial<Record<SectionKey, ContentKey>> = {
  showOfferStrip: "offerStrip",
  showSocialProof: "socialProof",
  showBestSellers: "bestSellers",
  showWhyChooseUs: "whyChooseUs",
  showTestimonials: "testimonials",
  showAboutBrand: "aboutBrand",
  showNewsletter: "newsletter",
  showUrgency: "urgency",
  showHeroBanner: "heroBanner",
  showRichText: "richText",
};

export const hasContentEditor = (key: SectionKey) => key in CONTENT_KEY;

/** What the storefront shows when nothing was saved yet (kept in sync with the section components). */
function defaults(): Required<Pick<SectionContentMap, "offerStrip" | "socialProof" | "bestSellers" | "whyChooseUs" | "testimonials" | "aboutBrand" | "newsletter" | "urgency" | "heroBanner" | "richText">> {
  return {
    offerStrip: { items: [tr("🚚 توصيل سريع لجميع المحافظات"), tr("✅ ضمان الاسترجاع 30 يوم"), tr("💳 الدفع عند الاستلام متاح")] },
    socialProof: {
      headline: tr("لماذا يثق بنا آلاف العملاء؟"),
      stats: [
        { icon: "😊", value: "10,000+", label: tr("عميل سعيد") },
        { icon: "⭐", value: "4.9", label: tr("متوسط التقييم") },
        { icon: "🚚", value: "24h", label: tr("متوسط التوصيل") },
        { icon: "🔄", value: tr("30 يوم"), label: tr("ضمان الاسترجاع") },
      ],
    },
    bestSellers: { headline: "", maxProducts: 8 },
    whyChooseUs: {
      headline: tr("لماذا تتسوق معنا؟"),
      cards: [
        { icon: "🛡️", title: tr("ضمان الجودة"), description: tr("كل منتج يمر بفحص دقيق قبل الشحن") },
        { icon: "🚀", title: tr("شحن سريع"), description: tr("توصيل خلال 24-48 ساعة لجميع المحافظات") },
        { icon: "💬", title: tr("دعم متواصل"), description: tr("فريق الدعم جاهز للرد في أي وقت") },
        { icon: "🔄", title: tr("إرجاع مجاني"), description: tr("ارجع المنتج خلال 30 يوم") },
      ],
    },
    testimonials: {
      headline: tr("ماذا يقول عملاؤنا؟"),
      items: [
        { name: tr("أحمد محمد"), text: tr("منتجات ممتازة وجودة عالية جدًا"), rating: 5 },
        { name: tr("سارة أحمد"), text: tr("أفضل متجر تسوقت منه على الإطلاق"), rating: 5 },
      ],
    },
    aboutBrand: { headline: "", text: "", image: "", ctaText: tr("اعرف أكثر عنّا"), ctaLink: "/about" },
    newsletter: {
      headline: tr("اشترك واحصل على خصم 15% على أول طلب 🎁"),
      subheadline: tr("كن أول من يعرف عن العروض الحصرية"),
      ctaText: tr("اشترك الآن"),
    },
    urgency: { headline: tr("⚡ عرض محدود الوقت — لا تفوّته!"), timerEndDate: "", showStockBadge: true, showViewersBadge: true },
    heroBanner: {
      backgroundImage: "",
      headline: tr("مرحباً بك في متجرنا"),
      subheadline: tr("اكتشف أفضل المنتجات بأسعار تنافسية"),
      buttonText: tr("تسوق الآن"),
      buttonLink: "/products",
      textAlign: "center",
      overlayOpacity: 50,
    },
    richText: { heading: "", paragraph: "", width: "normal", textAlign: "center" },
  };
}

// ─── Small inputs ─────────────────────────────────────────────────────────────

const inputSm = "h-10! px-3 text-[15px]";
const removeBtn =
  "apple-press grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-(--sys-red)/10 hover:text-(--sys-red) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function AddButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={cn(appleButton.plain, "mx-0 h-11 w-full justify-start rounded-none px-4")}>
      <Plus className="size-4" strokeWidth={2.4} />
      {children}
    </button>
  );
}

function AlignControl({ value, onChange }: { value: "left" | "center" | "right"; onChange: (v: "left" | "center" | "right") => void }) {
  return (
    <SegmentedButtons
      label={tr("محاذاة الكلام")}
      value={value}
      onChange={onChange}
      options={[
        ["right", <AlignRight key="r" className="size-4" aria-label={tr("يمين")} />],
        ["center", <AlignCenter key="c" className="size-4" aria-label={tr("وسط")} />],
        ["left", <AlignLeft key="l" className="size-4" aria-label={tr("شمال")} />],
      ]}
    />
  );
}

function ImageInput({ value, onChange, label }: { value: string; onChange: (url: string) => void; label: string }) {
  const [uploading, setUploading] = useState(false);
  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      onChange(await uploadImageToCloudinary(file, "casho/uploads/sections", 10));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tr("فشل رفع الصورة"));
    } finally {
      setUploading(false);
    }
  }
  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        <label className="relative grid aspect-video w-28 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-xl bg-(--fill-3) text-primary focus-within:ring-2 focus-within:ring-primary/40">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="absolute inset-0 size-full object-cover" />
          ) : uploading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <ImagePlus className="size-5" strokeWidth={1.6} />
          )}
          <input type="file" accept="image/*" className="sr-only" onChange={pick} disabled={uploading} />
        </label>
        <div className="flex flex-col items-start gap-1">
          <span className="text-[12px] text-muted-foreground">{value ? tr("اضغط على الصورة عشان تغيّرها") : tr("اضغط عشان ترفع صورة")}</span>
          {value && (
            <button type="button" className="text-[13px] text-(--sys-red)" onClick={() => onChange("")}>
              {tr("شيل الصورة")}
            </button>
          )}
        </div>
      </div>
    </Field>
  );
}

// ─── Editors ──────────────────────────────────────────────────────────────────

type EditorProps<K extends ContentKey> = {
  value: NonNullable<SectionContentMap[K]>;
  onChange: (next: NonNullable<SectionContentMap[K]>) => void;
};

function OfferStripEditor({ value, onChange }: EditorProps<"offerStrip">) {
  const items = value.items;
  return (
    <Group title={tr("العناصر")} footer={tr("كل عنصر بيتحرك في الشريط — حط إيموجي في الأول عشان يلفت النظر.")}>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 px-4 py-2">
          <Input
            value={item}
            onChange={(e) => onChange({ items: items.map((x, j) => (j === i ? e.target.value : x)) })}
            placeholder={tr("مثال: 🚚 توصيل مجاني")}
            className={inputSm}
          />
          <button type="button" aria-label={tr("حذف")} className={removeBtn} onClick={() => onChange({ items: items.filter((_, j) => j !== i) })}>
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
      <AddButton onClick={() => onChange({ items: [...items, ""] })}>{tr("إضافة عنصر")}</AddButton>
    </Group>
  );
}

function SocialProofEditor({ value, onChange }: EditorProps<"socialProof">) {
  const stats = value.stats;
  const setStat = (i: number, patch: Partial<(typeof stats)[number]>) =>
    onChange({ ...value, stats: stats.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  return (
    <>
      <Group>
        <Field label={tr("العنوان")}>
          <Input value={value.headline ?? ""} onChange={(e) => onChange({ ...value, headline: e.target.value })} className={inputSm} />
        </Field>
      </Group>
      <Group title={tr("الأرقام")} footer={tr("حط أرقام حقيقية — الثقة بتتبني بالصدق.")}>
        {stats.map((stat, i) => (
          <div key={i} className="grid grid-cols-[3rem_1fr_1fr_2.25rem] items-center gap-2 px-4 py-2">
            <Input value={stat.icon} onChange={(e) => setStat(i, { icon: e.target.value })} maxLength={4} className={cn(inputSm, "px-1 text-center")} aria-label={tr("أيقونة")} />
            <Input value={stat.value} onChange={(e) => setStat(i, { value: e.target.value })} placeholder="10,000+" className={inputSm} aria-label={tr("الرقم")} />
            <Input value={stat.label} onChange={(e) => setStat(i, { label: e.target.value })} placeholder={tr("عميل سعيد")} className={inputSm} aria-label={tr("الوصف")} />
            <button type="button" aria-label={tr("حذف")} className={removeBtn} onClick={() => onChange({ ...value, stats: stats.filter((_, j) => j !== i) })}>
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
        {stats.length < 6 && <AddButton onClick={() => onChange({ ...value, stats: [...stats, { icon: "✨", value: "", label: "" }] })}>{tr("إضافة رقم")}</AddButton>}
      </Group>
    </>
  );
}

function BestSellersEditor({ value, onChange }: EditorProps<"bestSellers">) {
  const max = value.maxProducts ?? 8;
  return (
    <Group footer={tr("المنتجات بتترتّب لوحدها حسب المبيعات الحقيقية.")}>
      <Field label={tr("العنوان")}>
        <Input value={value.headline ?? ""} onChange={(e) => onChange({ ...value, headline: e.target.value })} placeholder={tr("الأكثر مبيعًا")} className={inputSm} />
      </Field>
      <Row label={tr("عدد المنتجات")} value={<span className="tabular-nums">{max}</span>} />
      <div className="px-4 pb-3">
        <Slider min={4} max={16} step={1} value={[max]} onValueChange={([v]) => onChange({ ...value, maxProducts: v })} aria-label={tr("عدد المنتجات")} />
      </div>
    </Group>
  );
}

function WhyChooseUsEditor({ value, onChange }: EditorProps<"whyChooseUs">) {
  const cards = value.cards;
  const setCard = (i: number, patch: Partial<(typeof cards)[number]>) =>
    onChange({ ...value, cards: cards.map((c, j) => (j === i ? { ...c, ...patch } : c)) });
  return (
    <>
      <Group>
        <Field label={tr("العنوان")}>
          <Input value={value.headline ?? ""} onChange={(e) => onChange({ ...value, headline: e.target.value })} className={inputSm} />
        </Field>
      </Group>
      <Group title={tr("المميزات")}>
        {cards.map((card, i) => (
          <div key={i} className="space-y-2 px-4 py-3">
            <div className="flex items-center gap-2">
              <Input value={card.icon} onChange={(e) => setCard(i, { icon: e.target.value })} maxLength={4} className={cn(inputSm, "w-12 px-1 text-center")} aria-label={tr("أيقونة")} />
              <Input value={card.title} onChange={(e) => setCard(i, { title: e.target.value })} placeholder={tr("العنوان")} className={inputSm} />
              <button type="button" aria-label={tr("حذف")} className={removeBtn} onClick={() => onChange({ ...value, cards: cards.filter((_, j) => j !== i) })}>
                <Trash2 className="size-4" />
              </button>
            </div>
            <Input value={card.description} onChange={(e) => setCard(i, { description: e.target.value })} placeholder={tr("الوصف")} className={inputSm} />
          </div>
        ))}
        {cards.length < 6 && (
          <AddButton onClick={() => onChange({ ...value, cards: [...cards, { icon: "✨", title: "", description: "" }] })}>{tr("إضافة ميزة")}</AddButton>
        )}
      </Group>
    </>
  );
}

function TestimonialsEditor({ value, onChange }: EditorProps<"testimonials">) {
  const items = value.items;
  const setItem = (i: number, patch: Partial<(typeof items)[number]>) =>
    onChange({ ...value, items: items.map((t, j) => (j === i ? { ...t, ...patch } : t)) });
  return (
    <>
      <Group>
        <Field label={tr("العنوان")}>
          <Input value={value.headline ?? ""} onChange={(e) => onChange({ ...value, headline: e.target.value })} className={inputSm} />
        </Field>
      </Group>
      <Group title={tr("التقييمات")} footer={tr("انقل آراء حقيقية من عملائك (واتساب، تعليقات…).")}>
        {items.map((item, i) => (
          <div key={i} className="space-y-2 px-4 py-3">
            <div className="flex items-center gap-2">
              <Input value={item.name} onChange={(e) => setItem(i, { name: e.target.value })} placeholder={tr("الاسم")} className={inputSm} />
              <div className="flex shrink-0" role="radiogroup" aria-label={tr("التقييم")}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" role="radio" aria-checked={(item.rating ?? 5) === n} aria-label={tr("{0} نجوم", n)} onClick={() => setItem(i, { rating: n })} className="p-0.5">
                    <Star className={cn("size-4", n <= (item.rating ?? 5) ? "fill-(--sys-orange) text-(--sys-orange)" : "text-(--label-3)")} />
                  </button>
                ))}
              </div>
              <button type="button" aria-label={tr("حذف")} className={removeBtn} onClick={() => onChange({ ...value, items: items.filter((_, j) => j !== i) })}>
                <Trash2 className="size-4" />
              </button>
            </div>
            <Textarea value={item.text} onChange={(e) => setItem(i, { text: e.target.value })} placeholder={tr("رأي العميل…")} rows={2} className="min-h-0 resize-none px-3 py-2" />
          </div>
        ))}
        <AddButton onClick={() => onChange({ ...value, items: [...items, { name: "", text: "", rating: 5 }] })}>{tr("إضافة تقييم")}</AddButton>
      </Group>
    </>
  );
}

function AboutBrandEditor({ value, onChange }: EditorProps<"aboutBrand">) {
  return (
    <>
      <Group>
        <Field label={tr("العنوان")}>
          <Input value={value.headline ?? ""} onChange={(e) => onChange({ ...value, headline: e.target.value })} placeholder={tr("قصتنا")} className={inputSm} />
        </Field>
        <Field label={tr("النبذة")}>
          <Textarea value={value.text ?? ""} onChange={(e) => onChange({ ...value, text: e.target.value })} placeholder={tr("نبذة قصيرة عن المتجر…")} rows={4} className="resize-none px-3 py-2" />
        </Field>
        <ImageInput label={tr("صورة")} value={value.image ?? ""} onChange={(image) => onChange({ ...value, image })} />
      </Group>
      <Group title={tr("الزرار")}>
        <Field label={tr("النص")}>
          <Input value={value.ctaText ?? ""} onChange={(e) => onChange({ ...value, ctaText: e.target.value })} className={inputSm} />
        </Field>
        <Field label={tr("بيودّي على")}>
          <Input value={value.ctaLink ?? ""} onChange={(e) => onChange({ ...value, ctaLink: e.target.value })} placeholder="/about" dir="ltr" className={inputSm} />
        </Field>
      </Group>
    </>
  );
}

function NewsletterEditor({ value, onChange }: EditorProps<"newsletter">) {
  return (
    <Group>
      <Field label={tr("العنوان")}>
        <Input value={value.headline ?? ""} onChange={(e) => onChange({ ...value, headline: e.target.value })} className={inputSm} />
      </Field>
      <Field label={tr("الوصف")}>
        <Input value={value.subheadline ?? ""} onChange={(e) => onChange({ ...value, subheadline: e.target.value })} className={inputSm} />
      </Field>
      <Field label={tr("نص الزرار")}>
        <Input value={value.ctaText ?? ""} onChange={(e) => onChange({ ...value, ctaText: e.target.value })} className={inputSm} />
      </Field>
    </Group>
  );
}

function UrgencyEditor({ value, onChange }: EditorProps<"urgency">) {
  return (
    <Group>
      <Field label={tr("العنوان")}>
        <Input value={value.headline ?? ""} onChange={(e) => onChange({ ...value, headline: e.target.value })} className={inputSm} />
      </Field>
      <Field label={tr("العرض بيخلص في")} hint={tr("سيبه فاضي لو مش عايز عداد تنازلي.")}>
        <Input type="datetime-local" value={value.timerEndDate ?? ""} onChange={(e) => onChange({ ...value, timerEndDate: e.target.value })} className={cn(inputSm, "text-[13px]")} />
      </Field>
      <SwitchRow label={tr("شارة المخزون المحدود")} checked={value.showStockBadge ?? true} onCheckedChange={(v) => onChange({ ...value, showStockBadge: v })} />
      <SwitchRow label={tr("عدد اللي بيتفرجوا دلوقتي")} checked={value.showViewersBadge ?? true} onCheckedChange={(v) => onChange({ ...value, showViewersBadge: v })} />
    </Group>
  );
}

function HeroBannerEditor({ value, onChange }: EditorProps<"heroBanner">) {
  const overlay = value.overlayOpacity ?? 50;
  return (
    <>
      <Group>
        <ImageInput label={tr("صورة الخلفية")} value={value.backgroundImage ?? ""} onChange={(backgroundImage) => onChange({ ...value, backgroundImage })} />
        <Field label={tr("العنوان")}>
          <Input value={value.headline ?? ""} onChange={(e) => onChange({ ...value, headline: e.target.value })} className={inputSm} />
        </Field>
        <Field label={tr("الوصف")}>
          <Input value={value.subheadline ?? ""} onChange={(e) => onChange({ ...value, subheadline: e.target.value })} className={inputSm} />
        </Field>
      </Group>
      <Group title={tr("الزرار")}>
        <Field label={tr("النص")}>
          <Input value={value.buttonText ?? ""} onChange={(e) => onChange({ ...value, buttonText: e.target.value })} className={inputSm} />
        </Field>
        <Field label={tr("بيودّي على")}>
          <Input value={value.buttonLink ?? ""} onChange={(e) => onChange({ ...value, buttonLink: e.target.value })} placeholder="/products" dir="ltr" className={inputSm} />
        </Field>
      </Group>
      <Group title={tr("الشكل")}>
        <Row label={tr("المحاذاة")}>
          <AlignControl value={value.textAlign ?? "center"} onChange={(textAlign) => onChange({ ...value, textAlign })} />
        </Row>
        <Row label={tr("تغميق الصورة")} value={<span className="tabular-nums">{tr("{0}٪", overlay)}</span>} />
        <div className="px-4 pb-3">
          <Slider min={0} max={90} step={5} value={[overlay]} onValueChange={([v]) => onChange({ ...value, overlayOpacity: v })} aria-label={tr("تغميق الصورة")} />
        </div>
      </Group>
    </>
  );
}

function RichTextEditor({ value, onChange }: EditorProps<"richText">) {
  return (
    <>
      <Group>
        <Field label={tr("العنوان")}>
          <Input value={value.heading ?? ""} onChange={(e) => onChange({ ...value, heading: e.target.value })} className={inputSm} />
        </Field>
        <Field label={tr("الفقرة")}>
          <Textarea value={value.paragraph ?? ""} onChange={(e) => onChange({ ...value, paragraph: e.target.value })} rows={5} className="resize-none px-3 py-2" />
        </Field>
      </Group>
      <Group title={tr("الشكل")}>
        <Row label={tr("العرض")}>
          <SegmentedButtons
            label={tr("العرض")}
            value={value.width ?? "normal"}
            onChange={(width) => onChange({ ...value, width })}
            options={[
              ["narrow", tr("ضيق")],
              ["normal", tr("عادي")],
              ["wide", tr("واسع")],
              ["full", tr("كامل")],
            ]}
          />
        </Row>
        <Row label={tr("المحاذاة")}>
          <AlignControl value={value.textAlign ?? "center"} onChange={(textAlign) => onChange({ ...value, textAlign })} />
        </Row>
      </Group>
    </>
  );
}

// ─── Entry ────────────────────────────────────────────────────────────────────

export function SectionContentEditor({ sectionKey }: { sectionKey: SectionKey }) {
  const contentKey = CONTENT_KEY[sectionKey];
  if (!contentKey) return null;
  return <Editor contentKey={contentKey} />;
}

function Editor({ contentKey }: { contentKey: ContentKey }) {
  const { storeId, theme, save } = useBuilder();
  const initial = { ...defaults()[contentKey as keyof ReturnType<typeof defaults>], ...(theme.sectionContent[contentKey] ?? {}) };
  const [value, setValue] = useState(initial);
  useAutosave(value, (v) => save(() => UpdateSectionContentAction({ storeId, updates: { [contentKey]: v }, target: "draft" })), 900);

  const props = { value, onChange: setValue } as unknown as EditorProps<never>;
  switch (contentKey) {
    case "offerStrip":
      return <OfferStripEditor {...(props as unknown as EditorProps<"offerStrip">)} />;
    case "socialProof":
      return <SocialProofEditor {...(props as unknown as EditorProps<"socialProof">)} />;
    case "bestSellers":
      return <BestSellersEditor {...(props as unknown as EditorProps<"bestSellers">)} />;
    case "whyChooseUs":
      return <WhyChooseUsEditor {...(props as unknown as EditorProps<"whyChooseUs">)} />;
    case "testimonials":
      return <TestimonialsEditor {...(props as unknown as EditorProps<"testimonials">)} />;
    case "aboutBrand":
      return <AboutBrandEditor {...(props as unknown as EditorProps<"aboutBrand">)} />;
    case "newsletter":
      return <NewsletterEditor {...(props as unknown as EditorProps<"newsletter">)} />;
    case "urgency":
      return <UrgencyEditor {...(props as unknown as EditorProps<"urgency">)} />;
    case "heroBanner":
      return <HeroBannerEditor {...(props as unknown as EditorProps<"heroBanner">)} />;
    case "richText":
      return <RichTextEditor {...(props as unknown as EditorProps<"richText">)} />;
    default:
      return null;
  }
}
