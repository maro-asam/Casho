"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import {
  GripVertical,
  Image as ImageIcon,
  LayoutGrid,
  Star,
  Clock,
  Megaphone,
  Users,
  TrendingUp,
  ThumbsUp,
  MessageSquare,
  Store,
  Mail,
  Timer,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  Save,
  Plus,
  Trash2,
  Layers,
  RefreshCw,
  Sparkles,
  FileText,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useBuilder } from "../BuilderContext";
import {
  UpdateThemeSectionsAction,
  UpdateSectionOrderAction,
} from "@/actions/settings/theme.actions";
import { UpdateSectionContentAction } from "@/actions/settings/theme.actions";
import type {
  SectionKey,
  HomePageSections,
  SectionContentMap,
} from "@/types/store-theme.types";
import { DEFAULT_SECTION_ORDER } from "@/types/store-theme.types";
import { tdir, tr, trv } from "@/lib/i18n/dashboard";

// ─── Section metadata ─────────────────────────────────────────────────────────

type SectionMeta = {
  icon: React.ElementType;
  label: string;
  category: "core" | "funnel";
  badge?: string;
};

const SECTION_META: Record<SectionKey, SectionMeta> = {
  showHero:            { icon: ImageIcon,     get label() { return tr("البانر الرئيسي"); },    category: "core" },
  showCategories:      { icon: LayoutGrid,    get label() { return tr("التصنيفات"); },          category: "core" },
  showFeaturedProducts:{ icon: Star,          get label() { return tr("المنتجات المميزة"); },   category: "core" },
  showLatestProducts:  { icon: Clock,         get label() { return tr("أحدث المنتجات"); },      category: "core" },
  showOfferStrip:      { icon: Megaphone,     get label() { return tr("شريط العروض"); },        category: "funnel", get badge() { return tr("جديد"); } },
  showSocialProof:     { icon: Users,         get label() { return tr("إثبات الثقة"); },        category: "funnel", get badge() { return tr("جديد"); } },
  showBestSellers:     { icon: TrendingUp,    get label() { return tr("الأكثر مبيعًا"); },      category: "funnel", get badge() { return tr("جديد"); } },
  showCollections:     { icon: FolderOpen,    get label() { return tr("المجموعات"); },           category: "funnel", get badge() { return tr("جديد"); } },
  showWhyChooseUs:     { icon: ThumbsUp,      get label() { return tr("لماذا تختارنا؟"); },     category: "funnel", get badge() { return tr("جديد"); } },
  showTestimonials:    { icon: MessageSquare, get label() { return tr("آراء العملاء"); },        category: "funnel", get badge() { return tr("جديد"); } },
  showUrgency:         { icon: Timer,         get label() { return tr("عرض عاجل"); },            category: "funnel", get badge() { return tr("جديد"); } },
  showAboutBrand:      { icon: Store,         get label() { return tr("نبذة عن المتجر"); },     category: "funnel", get badge() { return tr("جديد"); } },
  showNewsletter:      { icon: Mail,          get label() { return tr("الاشتراك البريدي"); },   category: "funnel", get badge() { return tr("جديد"); } },
  // ── Visual Builder ──────────────────────────────────────────────────────
  showHeroBanner:      { icon: Sparkles,      get label() { return tr("بانر مخصص"); },          category: "funnel", badge: "Builder" },
  showRichText:        { icon: FileText,      get label() { return tr("نص غني"); },              category: "funnel", badge: "Builder" },
};

const FUNNEL_KEYS: SectionKey[] = [
  "showOfferStrip","showSocialProof","showBestSellers","showCollections",
  "showWhyChooseUs","showTestimonials","showUrgency","showAboutBrand","showNewsletter",
  // ── Visual Builder ────────────────────────────────────────────────────────
  "showHeroBanner","showRichText",
];

// ─── Inline editors (compact versions for the builder panel) ─────────────────

function OfferStripEditor({ storeId, content }: { storeId: string; content?: SectionContentMap["offerStrip"] }) {
  const [items, setItems] = useState<string[]>(content?.items ?? [tr("🚚 توصيل سريع"), tr("✅ ضمان 30 يوم"), tr("💳 الدفع عند الاستلام")]);
  const [isPending, startTransition] = useTransition();
  const { reloadPreview } = useBuilder();
  const save = () => startTransition(async () => {
    const res = await UpdateSectionContentAction({ storeId, updates: { offerStrip: { items: items.filter(Boolean) } } });
    if (res.success) { toast.success(tr("تم الحفظ")); reloadPreview(); }
    else toast.error(trv(res.message));
  });
  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex gap-1.5">
          <Input value={item} onChange={(e) => { const n=[...items]; n[i]=e.target.value; setItems(n); }} className="h-8 text-xs flex-1" />
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setItems(items.filter((_,j)=>j!==i))}>
            <Trash2 className="size-3 text-destructive" />
          </Button>
        </div>
      ))}
      <div className="flex gap-1.5">
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setItems([...items,""])}>
          <Plus className="size-3" />{tr("إضافة")}
        </Button>
        <Button size="sm" className="h-7 text-xs gap-1" onClick={save} disabled={isPending}>
          <Save className="size-3" />{tr("حفظ")}
        </Button>
      </div>
    </div>
  );
}

function SocialProofEditor({ storeId, content }: { storeId: string; content?: SectionContentMap["socialProof"] }) {
  const [headline, setHeadline] = useState(content?.headline ?? tr("لماذا يثق بنا آلاف العملاء؟"));
  const [stats, setStats] = useState(content?.stats ?? [
    { icon: "😊", value: "10,000+", label: tr("عميل سعيد") },
    { icon: "⭐", value: "4.9", label: tr("متوسط التقييم") },
    { icon: "🚚", value: "24h", label: tr("متوسط التوصيل") },
    { icon: "🔄", value: tr("30 يوم"), label: tr("ضمان الاسترجاع") },
  ]);
  const [isPending, startTransition] = useTransition();
  const { reloadPreview } = useBuilder();
  const save = () => startTransition(async () => {
    const res = await UpdateSectionContentAction({ storeId, updates: { socialProof: { headline, stats } } });
    if (res.success) { toast.success(tr("تم الحفظ")); reloadPreview(); }
    else toast.error(trv(res.message));
  });
  return (
    <div className="space-y-2">
      <Input value={headline} onChange={(e)=>setHeadline(e.target.value)} placeholder={tr("عنوان القسم")} className="h-8 text-xs" />
      <div className="space-y-1.5">
        {stats.map((stat, i) => (
          <div key={i} className="grid grid-cols-[1.75rem_1fr_1fr] gap-1">
            <Input value={stat.icon} onChange={(e)=>{const n=[...stats];n[i]={...n[i],icon:e.target.value};setStats(n);}} className="h-8 text-center text-xs px-1" maxLength={4} />
            <Input value={stat.value} onChange={(e)=>{const n=[...stats];n[i]={...n[i],value:e.target.value};setStats(n);}} placeholder={tr("القيمة")} className="h-8 text-xs" />
            <Input value={stat.label} onChange={(e)=>{const n=[...stats];n[i]={...n[i],label:e.target.value};setStats(n);}} placeholder={tr("التسمية")} className="h-8 text-xs" />
          </div>
        ))}
      </div>
      <Button size="sm" className="h-7 text-xs gap-1 w-full" onClick={save} disabled={isPending}>
        <Save className="size-3" />{tr("حفظ")}
      </Button>
    </div>
  );
}

function WhyChooseUsEditor({ storeId, content }: { storeId: string; content?: SectionContentMap["whyChooseUs"] }) {
  const [headline, setHeadline] = useState(content?.headline ?? tr("لماذا تتسوق معنا؟"));
  const [cards, setCards] = useState(content?.cards ?? [
    { icon: "🛡️", title: tr("ضمان الجودة"), description: tr("فحص دقيق قبل الشحن") },
    { icon: "🚀", title: tr("شحن سريع"), description: tr("24-48 ساعة لجميع المحافظات") },
    { icon: "💬", title: tr("دعم متواصل"), description: tr("فريق الدعم جاهز في أي وقت") },
    { icon: "🔄", title: tr("إرجاع مجاني"), description: tr("ارجع المنتج خلال 30 يوم") },
  ]);
  const [isPending, startTransition] = useTransition();
  const { reloadPreview } = useBuilder();
  const save = () => startTransition(async () => {
    const res = await UpdateSectionContentAction({ storeId, updates: { whyChooseUs: { headline, cards } } });
    if (res.success) { toast.success(tr("تم الحفظ")); reloadPreview(); }
    else toast.error(trv(res.message));
  });
  return (
    <div className="space-y-2">
      <Input value={headline} onChange={(e)=>setHeadline(e.target.value)} placeholder={tr("عنوان القسم")} className="h-8 text-xs" />
      <div className="space-y-1.5">
        {cards.map((card, i) => (
          <div key={i} className="rounded-lg border p-2 space-y-1.5">
            <div className="flex gap-1.5">
              <Input value={card.icon} onChange={(e)=>{const n=[...cards];n[i]={...n[i],icon:e.target.value};setCards(n);}} className="h-7 w-12 text-center text-xs px-1" maxLength={4} />
              <Input value={card.title} onChange={(e)=>{const n=[...cards];n[i]={...n[i],title:e.target.value};setCards(n);}} placeholder={tr("العنوان")} className="h-7 flex-1 text-xs" />
            </div>
            <Input value={card.description} onChange={(e)=>{const n=[...cards];n[i]={...n[i],description:e.target.value};setCards(n);}} placeholder={tr("الوصف")} className="h-7 text-xs" />
          </div>
        ))}
      </div>
      <Button size="sm" className="h-7 text-xs gap-1 w-full" onClick={save} disabled={isPending}>
        <Save className="size-3" />{tr("حفظ")}
      </Button>
    </div>
  );
}

function TestimonialsEditor({ storeId, content }: { storeId: string; content?: SectionContentMap["testimonials"] }) {
  const [headline, setHeadline] = useState(content?.headline ?? tr("ماذا يقول عملاؤنا؟"));
  const [items, setItems] = useState(content?.items ?? [
    { name: tr("أحمد محمد"), text: tr("منتجات ممتازة وجودة عالية"), rating: 5 },
    { name: tr("سارة أحمد"), text: tr("أفضل متجر تسوقت منه"), rating: 5 },
  ]);
  const [isPending, startTransition] = useTransition();
  const { reloadPreview } = useBuilder();
  const save = () => startTransition(async () => {
    const res = await UpdateSectionContentAction({ storeId, updates: { testimonials: { headline, items } } });
    if (res.success) { toast.success(tr("تم الحفظ")); reloadPreview(); }
    else toast.error(trv(res.message));
  });
  return (
    <div className="space-y-2">
      <Input value={headline} onChange={(e)=>setHeadline(e.target.value)} placeholder={tr("عنوان القسم")} className="h-8 text-xs" />
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="rounded-lg border p-2 space-y-1.5">
            <div className="flex gap-1.5">
              <Input value={item.name} onChange={(e)=>{const n=[...items];n[i]={...n[i],name:e.target.value};setItems(n);}} placeholder={tr("الاسم")} className="h-7 flex-1 text-xs" />
              <Input type="number" min={1} max={5} value={item.rating??5} onChange={(e)=>{const n=[...items];n[i]={...n[i],rating:Number(e.target.value)};setItems(n);}} className="h-7 w-12 text-center text-xs" />
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={()=>setItems(items.filter((_,j)=>j!==i))}>
                <Trash2 className="size-3 text-destructive" />
              </Button>
            </div>
            <Textarea value={item.text} onChange={(e)=>{const n=[...items];n[i]={...n[i],text:e.target.value};setItems(n);}} placeholder={tr("التقييم...")} className="text-xs resize-none" rows={2} />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5">
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1 flex-1" onClick={()=>setItems([...items,{name:"",text:"",rating:5}])}>
          <Plus className="size-3" />{tr("إضافة")}
        </Button>
        <Button size="sm" className="h-7 text-xs gap-1 flex-1" onClick={save} disabled={isPending}>
          <Save className="size-3" />{tr("حفظ")}
        </Button>
      </div>
    </div>
  );
}

function AboutBrandEditor({ storeId, content }: { storeId: string; content?: SectionContentMap["aboutBrand"] }) {
  const [headline, setHeadline] = useState(content?.headline ?? "");
  const [text, setText] = useState(content?.text ?? "");
  const [ctaText, setCtaText] = useState(content?.ctaText ?? tr("اعرف أكثر"));
  const [ctaLink, setCtaLink] = useState(content?.ctaLink ?? "/about");
  const [isPending, startTransition] = useTransition();
  const { reloadPreview } = useBuilder();
  const save = () => startTransition(async () => {
    const res = await UpdateSectionContentAction({ storeId, updates: { aboutBrand: { headline, text, ctaText, ctaLink } } });
    if (res.success) { toast.success(tr("تم الحفظ")); reloadPreview(); }
    else toast.error(trv(res.message));
  });
  return (
    <div className="space-y-1.5">
      <Input value={headline} onChange={(e)=>setHeadline(e.target.value)} placeholder={tr("العنوان الرئيسي")} className="h-8 text-xs" />
      <Textarea value={text} onChange={(e)=>setText(e.target.value)} placeholder={tr("نبذة قصيرة...")} className="text-xs resize-none" rows={3} />
      <div className="grid grid-cols-2 gap-1.5">
        <Input value={ctaText} onChange={(e)=>setCtaText(e.target.value)} placeholder={tr("نص الزر")} className="h-8 text-xs" />
        <Input value={ctaLink} onChange={(e)=>setCtaLink(e.target.value)} placeholder="/about" className="h-8 text-xs" />
      </div>
      <Button size="sm" className="h-7 text-xs gap-1 w-full" onClick={save} disabled={isPending}>
        <Save className="size-3" />{tr("حفظ")}
      </Button>
    </div>
  );
}

function NewsletterEditor({ storeId, content }: { storeId: string; content?: SectionContentMap["newsletter"] }) {
  const [headline, setHeadline] = useState(content?.headline ?? tr("اشترك واحصل على خصم 15% 🎁"));
  const [subheadline, setSubheadline] = useState(content?.subheadline ?? tr("كن أول من يعرف عن العروض"));
  const [ctaText, setCtaText] = useState(content?.ctaText ?? tr("اشترك الآن"));
  const [isPending, startTransition] = useTransition();
  const { reloadPreview } = useBuilder();
  const save = () => startTransition(async () => {
    const res = await UpdateSectionContentAction({ storeId, updates: { newsletter: { headline, subheadline, ctaText } } });
    if (res.success) { toast.success(tr("تم الحفظ")); reloadPreview(); }
    else toast.error(trv(res.message));
  });
  return (
    <div className="space-y-1.5">
      <Input value={headline} onChange={(e)=>setHeadline(e.target.value)} placeholder={tr("العنوان")} className="h-8 text-xs" />
      <Input value={subheadline} onChange={(e)=>setSubheadline(e.target.value)} placeholder={tr("العنوان الفرعي")} className="h-8 text-xs" />
      <Input value={ctaText} onChange={(e)=>setCtaText(e.target.value)} placeholder={tr("نص الزر")} className="h-8 text-xs" />
      <Button size="sm" className="h-7 text-xs gap-1 w-full" onClick={save} disabled={isPending}>
        <Save className="size-3" />{tr("حفظ")}
      </Button>
    </div>
  );
}

function UrgencyEditor({ storeId, content }: { storeId: string; content?: SectionContentMap["urgency"] }) {
  const [headline, setHeadline] = useState(content?.headline ?? tr("⚡ عرض محدود الوقت!"));
  const [timerEndDate, setTimerEndDate] = useState(content?.timerEndDate ?? "");
  const [showStockBadge, setShowStockBadge] = useState(content?.showStockBadge ?? true);
  const [showViewersBadge, setShowViewersBadge] = useState(content?.showViewersBadge ?? true);
  const [isPending, startTransition] = useTransition();
  const { reloadPreview } = useBuilder();
  const save = () => startTransition(async () => {
    const res = await UpdateSectionContentAction({ storeId, updates: { urgency: { headline, timerEndDate: timerEndDate||undefined, showStockBadge, showViewersBadge } } });
    if (res.success) { toast.success(tr("تم الحفظ")); reloadPreview(); }
    else toast.error(trv(res.message));
  });
  return (
    <div className="space-y-2">
      <Input value={headline} onChange={(e)=>setHeadline(e.target.value)} placeholder={tr("العنوان")} className="h-8 text-xs" />
      <Input type="datetime-local" value={timerEndDate} onChange={(e)=>setTimerEndDate(e.target.value)} className="h-8 text-xs" />
      <div className="flex gap-4 text-xs">
        <label className="flex items-center gap-2 cursor-pointer">
          <Switch checked={showStockBadge} onCheckedChange={setShowStockBadge} />
          {tr("شارة المخزون")}
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Switch checked={showViewersBadge} onCheckedChange={setShowViewersBadge} />
          {tr("عدد المتصفحين")}
        </label>
      </div>
      <Button size="sm" className="h-7 text-xs gap-1 w-full" onClick={save} disabled={isPending}>
        <Save className="size-3" />{tr("حفظ")}
      </Button>
    </div>
  );
}

// ─── Hero Banner Editor ───────────────────────────────────────────────────────

function AlignButton({
  value, current, icon: Icon, label, onSelect,
}: { value: "left" | "center" | "right"; current: string; icon: React.ElementType; label: string; onSelect: (v: "left" | "center" | "right") => void }) {
  return (
    <button
      onClick={() => onSelect(value)}
      title={label}
      className={cn(
        "flex h-8 flex-1 items-center justify-center rounded-md border text-xs font-medium transition-colors",
        current === value
          ? "border-primary bg-primary text-primary-foreground"
          : "bg-background text-muted-foreground hover:bg-muted",
      )}
    >
      <Icon className="size-3.5" />
    </button>
  );
}

function HeroBannerEditor({ storeId, content }: { storeId: string; content?: SectionContentMap["heroBanner"] }) {
  const [bgImage, setBgImage] = useState(content?.backgroundImage ?? "");
  const [headline, setHeadline] = useState(content?.headline ?? tr("مرحباً بك في متجرنا"));
  const [subheadline, setSubheadline] = useState(content?.subheadline ?? tr("اكتشف أفضل المنتجات بأسعار تنافسية"));
  const [buttonText, setButtonText] = useState(content?.buttonText ?? tr("تسوق الآن"));
  const [buttonLink, setButtonLink] = useState(content?.buttonLink ?? "/products");
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">(content?.textAlign ?? "center");
  const [overlayOpacity, setOverlayOpacity] = useState([content?.overlayOpacity ?? 50]);
  const [isPending, startTransition] = useTransition();
  const { reloadPreview } = useBuilder();

  const save = () =>
    startTransition(async () => {
      const res = await UpdateSectionContentAction({
        storeId,
        updates: {
          heroBanner: {
            backgroundImage: bgImage.trim() || undefined,
            headline,
            subheadline,
            buttonText,
            buttonLink,
            textAlign,
            overlayOpacity: overlayOpacity[0],
          },
        },
      });
      if (res.success) { toast.success(tr("تم الحفظ")); reloadPreview(); }
      else toast.error(trv(res.message));
    });

  return (
    <div className="space-y-2.5">
      {/* Background image */}
      <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{tr("صورة الخلفية")}</p>
        <Input
          value={bgImage}
          onChange={(e) => setBgImage(e.target.value)}
          placeholder="https://..."
          className="h-8 text-xs"
          dir="ltr"
        />
      </div>

      {/* Headline */}
      <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{tr("العنوان الرئيسي")}</p>
        <Input value={headline} onChange={(e) => setHeadline(e.target.value)} className="h-8 text-xs" />
      </div>

      {/* Subheadline */}
      <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{tr("العنوان الفرعي")}</p>
        <Input value={subheadline} onChange={(e) => setSubheadline(e.target.value)} className="h-8 text-xs" />
      </div>

      {/* Button */}
      <div className="grid grid-cols-2 gap-1.5">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-muted-foreground">{tr("نص الزر")}</p>
          <Input value={buttonText} onChange={(e) => setButtonText(e.target.value)} className="h-8 text-xs" />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-muted-foreground">{tr("رابط الزر")}</p>
          <Input value={buttonLink} onChange={(e) => setButtonLink(e.target.value)} className="h-8 text-xs" dir="ltr" />
        </div>
      </div>

      {/* Text alignment */}
      <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{tr("محاذاة النص")}</p>
        <div className="flex gap-1">
          <AlignButton value="right"  current={textAlign} icon={AlignRight}  label={tr("يمين")}  onSelect={setTextAlign} />
          <AlignButton value="center" current={textAlign} icon={AlignCenter} label={tr("وسط")}   onSelect={setTextAlign} />
          <AlignButton value="left"   current={textAlign} icon={AlignLeft}   label={tr("يسار")}  onSelect={setTextAlign} />
        </div>
      </div>

      {/* Overlay opacity */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{tr("شفافية الغطاء")}</p>
          <span className="text-[10px] tabular-nums text-muted-foreground">{overlayOpacity[0]}%</span>
        </div>
        <Slider
          min={0} max={100} step={5}
          value={overlayOpacity}
          onValueChange={setOverlayOpacity}
        />
      </div>

      <Button size="sm" className="h-7 w-full gap-1 text-xs" onClick={save} disabled={isPending}>
        <Save className="size-3" />{tr("حفظ")}
      </Button>
    </div>
  );
}

// ─── Rich Text Editor ─────────────────────────────────────────────────────────

function RichTextEditor({ storeId, content }: { storeId: string; content?: SectionContentMap["richText"] }) {
  const [heading, setHeading] = useState(content?.heading ?? "");
  const [paragraph, setParagraph] = useState(content?.paragraph ?? "");
  const [width, setWidth] = useState<NonNullable<SectionContentMap["richText"]>["width"]>(content?.width ?? "normal");
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">(content?.textAlign ?? "center");
  const [isPending, startTransition] = useTransition();
  const { reloadPreview } = useBuilder();

  const WIDTHS = [
    { value: "narrow", label: tr("ضيق") },
    { value: "normal", label: tr("عادي") },
    { value: "wide",   label: tr("واسع") },
    { value: "full",   label: tr("كامل") },
  ] as const;

  const save = () =>
    startTransition(async () => {
      const res = await UpdateSectionContentAction({
        storeId,
        updates: { richText: { heading, paragraph, width, textAlign } },
      });
      if (res.success) { toast.success(tr("تم الحفظ")); reloadPreview(); }
      else toast.error(trv(res.message));
    });

  return (
    <div className="space-y-2.5">
      {/* Heading */}
      <Input value={heading} onChange={(e) => setHeading(e.target.value)} placeholder={tr("العنوان")} className="h-8 text-xs" />

      {/* Paragraph */}
      <Textarea
        value={paragraph}
        onChange={(e) => setParagraph(e.target.value)}
        placeholder={tr("الفقرة النصية…")}
        className="resize-none text-xs"
        rows={3}
      />

      {/* Width */}
      <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{tr("عرض المحتوى")}</p>
        <div className="grid grid-cols-4 gap-1">
          {WIDTHS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setWidth(value)}
              className={cn(
                "h-7 rounded-md border text-[10px] font-medium transition-colors",
                width === value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Text alignment */}
      <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{tr("محاذاة النص")}</p>
        <div className="flex gap-1">
          <AlignButton value="right"  current={textAlign} icon={AlignRight}  label={tr("يمين")}  onSelect={setTextAlign} />
          <AlignButton value="center" current={textAlign} icon={AlignCenter} label={tr("وسط")}   onSelect={setTextAlign} />
          <AlignButton value="left"   current={textAlign} icon={AlignLeft}   label={tr("يسار")}  onSelect={setTextAlign} />
        </div>
      </div>

      <Button size="sm" className="h-7 w-full gap-1 text-xs" onClick={save} disabled={isPending}>
        <Save className="size-3" />{tr("حفظ")}
      </Button>
    </div>
  );
}

// ─── Section editor dispatcher ────────────────────────────────────────────────

function SectionEditor({ sectionKey, storeId, sectionContent }: { sectionKey: SectionKey; storeId: string; sectionContent: SectionContentMap }) {
  switch (sectionKey) {
    case "showOfferStrip":    return <OfferStripEditor storeId={storeId} content={sectionContent.offerStrip} />;
    case "showSocialProof":   return <SocialProofEditor storeId={storeId} content={sectionContent.socialProof} />;
    case "showWhyChooseUs":   return <WhyChooseUsEditor storeId={storeId} content={sectionContent.whyChooseUs} />;
    case "showTestimonials":  return <TestimonialsEditor storeId={storeId} content={sectionContent.testimonials} />;
    case "showAboutBrand":    return <AboutBrandEditor storeId={storeId} content={sectionContent.aboutBrand} />;
    case "showNewsletter":    return <NewsletterEditor storeId={storeId} content={sectionContent.newsletter} />;
    case "showUrgency":       return <UrgencyEditor storeId={storeId} content={sectionContent.urgency} />;
    case "showHeroBanner":    return <HeroBannerEditor storeId={storeId} content={sectionContent.heroBanner} />;
    case "showRichText":      return <RichTextEditor storeId={storeId} content={sectionContent.richText} />;
    default:                  return null;
  }
}

// ─── Sortable row ─────────────────────────────────────────────────────────────

function SortableRow({
  sectionKey,
  isOn,
  isPending,
  onToggle,
  storeId,
  sectionContent,
  isOverlay = false,
}: {
  sectionKey: SectionKey;
  isOn: boolean;
  isPending: boolean;
  onToggle: (key: SectionKey, value: boolean) => void;
  storeId: string;
  sectionContent: SectionContentMap;
  isOverlay?: boolean;
}) {
  const meta = SECTION_META[sectionKey];
  const Icon = meta.icon;
  const hasEditor = SectionEditor({ sectionKey, storeId, sectionContent }) !== null;
  const [expanded, setExpanded] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sectionKey });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "opacity-40")}
    >
      <motion.div layout="position" transition={{ duration: 0.18, ease: "easeOut" }}>
        {/* Row */}
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2.5 transition-colors",
            isOn ? "bg-background" : "bg-muted/20",
            isOverlay && "rounded-xl border border-primary/30 bg-primary/5 shadow-xl",
          )}
        >
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none text-muted-foreground/30 hover:text-muted-foreground transition-colors active:cursor-grabbing shrink-0"
            tabIndex={-1}
          >
            <GripVertical className="size-3.5" />
          </button>

          {/* Icon */}
          <div className={cn(
            "grid size-7 shrink-0 place-items-center rounded-md transition-colors",
            isOn ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
          )}>
            <Icon className="size-3.5" />
          </div>

          {/* Label */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={cn("text-xs font-medium truncate", isOn ? "text-foreground" : "text-muted-foreground")}>
                {meta.label}
              </span>
              {meta.badge && (
                <Badge variant="default" className="h-3.5 px-1 text-[9px] font-bold leading-none shrink-0">
                  {meta.badge}
                </Badge>
              )}
            </div>
          </div>

          {/* Expand (if has editor) */}
          {hasEditor && isOn && !isOverlay && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted transition-colors"
            >
              {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>
          )}

          {/* Toggle */}
          <Switch
            checked={isOn}
            onCheckedChange={(val) => onToggle(sectionKey, val)}
            disabled={isPending}
            className="shrink-0"
          />
        </div>

        {/* Inline editor */}
        <AnimatePresence>
          {hasEditor && isOn && expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t bg-muted/20 px-3 py-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {tr("تخصيص المحتوى")}
                </p>
                <SectionEditor sectionKey={sectionKey} storeId={storeId} sectionContent={sectionContent} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ─── Ghost overlay card ───────────────────────────────────────────────────────

function DragGhost({ sectionKey }: { sectionKey: SectionKey }) {
  const meta = SECTION_META[sectionKey];
  const Icon = meta.icon;
  return (
    <div className="flex items-center gap-2 rounded-xl border border-primary/40 bg-background px-3 py-2.5 shadow-2xl ring-2 ring-primary/20 w-75">
      <GripVertical className="size-3.5 text-primary/60" />
      <div className="grid size-7 place-items-center rounded-md bg-primary/10 text-primary">
        <Icon className="size-3.5" />
      </div>
      <span className="text-xs font-medium">{meta.label}</span>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export default function SectionsPanel() {
  const { storeId, currentSections, sectionContent, reloadPreview } = useBuilder();
  const [isPending, startTransition] = useTransition();
  const [activeDragId, setActiveDragId] = useState<SectionKey | null>(null);

  const initialOrder: SectionKey[] = currentSections.home.sectionOrder ?? DEFAULT_SECTION_ORDER;
  const [order, setOrder] = useState<SectionKey[]>(initialOrder);
  const [visibility, setVisibility] = useState<Omit<HomePageSections, "sectionOrder">>({
    showHero:             currentSections.home.showHero,
    showCategories:       currentSections.home.showCategories,
    showFeaturedProducts: currentSections.home.showFeaturedProducts,
    showLatestProducts:   currentSections.home.showLatestProducts,
    showOfferStrip:       currentSections.home.showOfferStrip ?? false,
    showSocialProof:      currentSections.home.showSocialProof ?? false,
    showBestSellers:      currentSections.home.showBestSellers ?? false,
    showWhyChooseUs:      currentSections.home.showWhyChooseUs ?? false,
    showTestimonials:     currentSections.home.showTestimonials ?? false,
    showAboutBrand:       currentSections.home.showAboutBrand ?? false,
    showNewsletter:       currentSections.home.showNewsletter ?? false,
    showUrgency:          currentSections.home.showUrgency ?? false,
    showCollections:      currentSections.home.showCollections ?? false,
    showHeroBanner:       currentSections.home.showHeroBanner ?? false,
    showRichText:         currentSections.home.showRichText ?? false,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as SectionKey);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = order.indexOf(active.id as SectionKey);
    const newIndex = order.indexOf(over.id as SectionKey);
    const newOrder = arrayMove(order, oldIndex, newIndex);
    setOrder(newOrder);
    startTransition(async () => {
      const result = await UpdateSectionOrderAction({ storeId, order: newOrder });
      if (result.success) { toast.success(tr("تم حفظ الترتيب")); reloadPreview(); }
      else { setOrder(order); toast.error(trv(result.message)); }
    });
  }

  function toggle(key: SectionKey, value: boolean) {
    setVisibility((prev) => ({ ...prev, [key]: value }));
    startTransition(async () => {
      const result = await UpdateThemeSectionsAction({ storeId, page: "home", updates: { [key]: value } });
      if (result.success) { toast.success(trv(result.message)); reloadPreview(); }
      else { setVisibility((prev) => ({ ...prev, [key]: !value })); toast.error(trv(result.message)); }
    });
  }

  const coreKeys = order.filter((k) => !FUNNEL_KEYS.includes(k));
  const funnelKeys = order.filter((k) => FUNNEL_KEYS.includes(k));
  const missingFunnel = FUNNEL_KEYS.filter((k) => !order.includes(k));
  const allFunnelKeys = [...funnelKeys, ...missingFunnel];

  const rowProps = (key: SectionKey) => ({
    sectionKey: key,
    isOn: !!visibility[key as keyof typeof visibility],
    isPending,
    onToggle: toggle,
    storeId,
    sectionContent,
  });

  return (
    <div className="flex flex-col h-full" dir={tdir()}>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3 bg-background">
        <div className="flex items-center gap-2">
          <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
            <Layers className="size-3.5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">{tr("الأقسام")}</h2>
            <p className="text-[10px] text-muted-foreground">{tr("اسحب لإعادة الترتيب")}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground"
          onClick={reloadPreview}
          title={tr("تحديث المعاينة")}
        >
          <RefreshCw className="size-3.5" />
        </Button>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={order} strategy={verticalListSortingStrategy}>
            {/* Core sections */}
            <div className="px-3 pt-3 pb-1">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                {tr("أساسية")}
              </p>
              <div className="divide-y divide-border rounded-xl border overflow-hidden">
                {coreKeys.map((k) => <SortableRow key={k} {...rowProps(k)} />)}
              </div>
            </div>

            {/* Funnel sections */}
            <div className="px-3 pt-3 pb-4">
              <div className="flex items-center gap-2 mb-1.5 px-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {tr("أقسام البيع")}
                </p>
                <Badge variant="default" className="h-3.5 px-1 text-[9px] font-bold">{tr("جديد")}</Badge>
              </div>
              <div className="divide-y divide-border rounded-xl border overflow-hidden">
                {allFunnelKeys.map((k) => <SortableRow key={k} {...rowProps(k)} />)}
              </div>
            </div>
          </SortableContext>

          {/* Ghost overlay while dragging */}
          <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
            {activeDragId ? <DragGhost sectionKey={activeDragId} /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
