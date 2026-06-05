"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Layers,
  Image as ImageIcon,
  LayoutGrid,
  Star,
  Clock,
  GripVertical,
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
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  UpdateThemeSectionsAction,
  UpdateSectionOrderAction,
  UpdateSectionContentAction,
} from "@/actions/settings/theme.actions";
import type {
  ThemeSections,
  SectionKey,
  HomePageSections,
  SectionContentMap,
} from "@/types/store-theme.types";
import { DEFAULT_SECTION_ORDER } from "@/types/store-theme.types";

// ─── Section metadata ──────────────────────────────────────────────────────────

type SectionCategory = "core" | "funnel";

type SectionMeta = {
  icon: React.ElementType;
  label: string;
  description: string;
  category: SectionCategory;
  badge?: string;
};

const SECTION_META: Record<SectionKey, SectionMeta> = {
  // ── Core ──────────────────────────────────────────────────────────────────
  showHero: {
    icon: ImageIcon,
    label: "قسم الهيرو / البانر",
    description: "الصورة الرئيسية الكبيرة في أعلى الصفحة",
    category: "core",
  },
  showCategories: {
    icon: LayoutGrid,
    label: "قسم التصنيفات",
    description: "عرض تصنيفات المتجر بشكل بطاقات",
    category: "core",
  },
  showFeaturedProducts: {
    icon: Star,
    label: "المنتجات المميزة",
    description: "المنتجات التي تم تمييزها يدويًا",
    category: "core",
  },
  showLatestProducts: {
    icon: Clock,
    label: "أحدث المنتجات",
    description: "شبكة المنتجات الأحدث إضافةً",
    category: "core",
  },
  // ── Sales Funnel ──────────────────────────────────────────────────────────
  showOfferStrip: {
    icon: Megaphone,
    label: "شريط العروض",
    description: "شريط متحرك يعرض عروض وميزات المتجر",
    category: "funnel",
    badge: "جديد",
  },
  showSocialProof: {
    icon: Users,
    label: "إثبات الثقة",
    description: "أرقام وإحصاءات تُقنع الزائر بجودة المتجر",
    category: "funnel",
    badge: "جديد",
  },
  showBestSellers: {
    icon: TrendingUp,
    label: "الأكثر مبيعًا",
    description: "أقوى المنتجات مبيعًا مع شارات Trending",
    category: "funnel",
    badge: "جديد",
  },
  showCollections: {
    icon: FolderOpen,
    label: "معرض المجموعات",
    description: "عرض مجموعات منتجات بشكل بصري جذاب",
    category: "funnel",
    badge: "جديد",
  },
  showWhyChooseUs: {
    icon: ThumbsUp,
    label: "لماذا تختارنا؟",
    description: "بطاقات تُبرز مزايا المتجر وأسباب الثقة",
    category: "funnel",
    badge: "جديد",
  },
  showTestimonials: {
    icon: MessageSquare,
    label: "آراء العملاء",
    description: "كاروسيل تقييمات العملاء الحقيقيين",
    category: "funnel",
    badge: "جديد",
  },
  showUrgency: {
    icon: Timer,
    label: "قسم الإلحاح",
    description: "عداد تنازلي + شارات مخزون محدود لتسريع الشراء",
    category: "funnel",
    badge: "جديد",
  },
  showAboutBrand: {
    icon: Store,
    label: "نبذة عن المتجر",
    description: "قصة قصيرة عن البراند تبني الثقة",
    category: "funnel",
    badge: "جديد",
  },
  showNewsletter: {
    icon: Mail,
    label: "الاشتراك البريدي",
    description: "جمع الإيميلات بخصم أول طلب",
    category: "funnel",
    badge: "جديد",
  },
};

// ─── Inline content editors per section ───────────────────────────────────────

function OfferStripEditor({
  storeId,
  content,
}: {
  storeId: string;
  content?: SectionContentMap["offerStrip"];
}) {
  const [items, setItems] = useState<string[]>(
    content?.items ?? [
      "🚚 توصيل سريع لجميع المحافظات",
      "✅ ضمان الاسترجاع 30 يوم",
      "💳 الدفع عند الاستلام متاح",
    ],
  );
  const [isPending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const res = await UpdateSectionContentAction({
        storeId,
        updates: { offerStrip: { items: items.filter(Boolean) } },
      });
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <Input
            value={item}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              setItems(next);
            }}
            placeholder="مثال: 🚚 توصيل مجاني"
            className="flex-1 text-sm"
          />
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setItems(items.filter((_, j) => j !== i))}
          >
            <Trash2 className="size-3.5 text-destructive" />
          </Button>
        </div>
      ))}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => setItems([...items, ""])}
        >
          <Plus className="size-3" />
          إضافة عنصر
        </Button>
        <Button size="sm" className="gap-1.5 text-xs" onClick={save} disabled={isPending}>
          <Save className="size-3" />
          حفظ
        </Button>
      </div>
    </div>
  );
}

function SocialProofEditor({
  storeId,
  content,
}: {
  storeId: string;
  content?: SectionContentMap["socialProof"];
}) {
  const [headline, setHeadline] = useState(content?.headline ?? "لماذا يثق بنا آلاف العملاء؟");
  const [stats, setStats] = useState(
    content?.stats ?? [
      { icon: "😊", value: "10,000+", label: "عميل سعيد" },
      { icon: "⭐", value: "4.9", label: "متوسط التقييم" },
      { icon: "🚚", value: "24h", label: "متوسط التوصيل" },
      { icon: "🔄", value: "30 يوم", label: "ضمان الاسترجاع" },
    ],
  );
  const [isPending, startTransition] = useTransition();

  const updateStat = (i: number, field: "icon" | "value" | "label", val: string) => {
    const next = [...stats];
    next[i] = { ...next[i], [field]: val };
    setStats(next);
  };

  const save = () => {
    startTransition(async () => {
      const res = await UpdateSectionContentAction({
        storeId,
        updates: { socialProof: { headline, stats } },
      });
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  return (
    <div className="space-y-3">
      <Input
        value={headline}
        onChange={(e) => setHeadline(e.target.value)}
        placeholder="عنوان القسم"
        className="text-sm"
      />
      <div className="space-y-2">
        {stats.map((stat, i) => (
          <div key={i} className="grid grid-cols-[2rem_1fr_1fr] gap-2">
            <Input value={stat.icon} onChange={(e) => updateStat(i, "icon", e.target.value)} className="text-center text-sm px-1" maxLength={4} />
            <Input value={stat.value} onChange={(e) => updateStat(i, "value", e.target.value)} placeholder="10,000+" className="text-sm" />
            <Input value={stat.label} onChange={(e) => updateStat(i, "label", e.target.value)} placeholder="عميل سعيد" className="text-sm" />
          </div>
        ))}
      </div>
      <Button size="sm" className="gap-1.5 text-xs" onClick={save} disabled={isPending}>
        <Save className="size-3" />
        حفظ
      </Button>
    </div>
  );
}

function WhyChooseUsEditor({
  storeId,
  content,
}: {
  storeId: string;
  content?: SectionContentMap["whyChooseUs"];
}) {
  const [headline, setHeadline] = useState(content?.headline ?? "لماذا تتسوق معنا؟");
  const [cards, setCards] = useState(
    content?.cards ?? [
      { icon: "🛡️", title: "ضمان الجودة", description: "كل منتج يمر بفحص دقيق قبل الشحن" },
      { icon: "🚀", title: "شحن سريع", description: "توصيل خلال 24-48 ساعة لجميع المحافظات" },
      { icon: "💬", title: "دعم متواصل", description: "فريق الدعم جاهز للرد في أي وقت" },
      { icon: "🔄", title: "إرجاع مجاني", description: "ارجع المنتج خلال 30 يوم" },
    ],
  );
  const [isPending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const res = await UpdateSectionContentAction({
        storeId,
        updates: { whyChooseUs: { headline, cards } },
      });
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  return (
    <div className="space-y-3">
      <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="عنوان القسم" className="text-sm" />
      <div className="space-y-2">
        {cards.map((card, i) => (
          <div key={i} className="rounded-xl border p-3 space-y-2">
            <div className="flex gap-2">
              <Input value={card.icon} onChange={(e) => { const n=[...cards]; n[i]={...n[i],icon:e.target.value}; setCards(n); }} className="w-16 text-center text-sm px-1" maxLength={4} />
              <Input value={card.title} onChange={(e) => { const n=[...cards]; n[i]={...n[i],title:e.target.value}; setCards(n); }} placeholder="العنوان" className="flex-1 text-sm" />
            </div>
            <Input value={card.description} onChange={(e) => { const n=[...cards]; n[i]={...n[i],description:e.target.value}; setCards(n); }} placeholder="الوصف" className="text-sm" />
          </div>
        ))}
      </div>
      <Button size="sm" className="gap-1.5 text-xs" onClick={save} disabled={isPending}>
        <Save className="size-3" />
        حفظ
      </Button>
    </div>
  );
}

function TestimonialsEditor({
  storeId,
  content,
}: {
  storeId: string;
  content?: SectionContentMap["testimonials"];
}) {
  const [headline, setHeadline] = useState(content?.headline ?? "ماذا يقول عملاؤنا؟");
  const [items, setItems] = useState(
    content?.items ?? [
      { name: "أحمد محمد", text: "منتجات ممتازة وجودة عالية جدًا", rating: 5, avatar: undefined },
      { name: "سارة أحمد", text: "أفضل متجر تسوقت منه على الإطلاق", rating: 5, avatar: undefined },
    ],
  );
  const [isPending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const res = await UpdateSectionContentAction({ storeId, updates: { testimonials: { headline, items } } });
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  return (
    <div className="space-y-3">
      <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="عنوان القسم" className="text-sm" />
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="rounded-xl border p-3 space-y-2">
            <div className="flex gap-2">
              <Input value={item.name} onChange={(e) => { const n=[...items]; n[i]={...n[i],name:e.target.value}; setItems(n); }} placeholder="الاسم" className="flex-1 text-sm" />
              <Input type="number" min={1} max={5} value={item.rating ?? 5} onChange={(e) => { const n=[...items]; n[i]={...n[i],rating:Number(e.target.value)}; setItems(n); }} className="w-16 text-center text-sm" />
              <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setItems(items.filter((_, j) => j !== i))}>
                <Trash2 className="size-3.5 text-destructive" />
              </Button>
            </div>
            <Textarea value={item.text} onChange={(e) => { const n=[...items]; n[i]={...n[i],text:e.target.value}; setItems(n); }} placeholder="التقييم..." className="text-sm resize-none" rows={2} />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setItems([...items, { name: "", text: "", rating: 5 }])}>
          <Plus className="size-3" />
          إضافة تقييم
        </Button>
        <Button size="sm" className="gap-1.5 text-xs" onClick={save} disabled={isPending}>
          <Save className="size-3" />
          حفظ
        </Button>
      </div>
    </div>
  );
}

function AboutBrandEditor({
  storeId,
  content,
}: {
  storeId: string;
  content?: SectionContentMap["aboutBrand"];
}) {
  const [headline, setHeadline] = useState(content?.headline ?? "");
  const [text, setText] = useState(content?.text ?? "");
  const [ctaText, setCtaText] = useState(content?.ctaText ?? "اعرف أكثر عنّا");
  const [ctaLink, setCtaLink] = useState(content?.ctaLink ?? "/about");
  const [isPending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const res = await UpdateSectionContentAction({ storeId, updates: { aboutBrand: { headline, text, ctaText, ctaLink } } });
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  return (
    <div className="space-y-2">
      <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="العنوان الرئيسي" className="text-sm" />
      <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="نبذة قصيرة عن المتجر..." className="text-sm resize-none" rows={3} />
      <div className="flex gap-2">
        <Input value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder="نص الزر" className="flex-1 text-sm" />
        <Input value={ctaLink} onChange={(e) => setCtaLink(e.target.value)} placeholder="/about" className="flex-1 text-sm" />
      </div>
      <Button size="sm" className="gap-1.5 text-xs" onClick={save} disabled={isPending}>
        <Save className="size-3" />
        حفظ
      </Button>
    </div>
  );
}

function NewsletterEditor({
  storeId,
  content,
}: {
  storeId: string;
  content?: SectionContentMap["newsletter"];
}) {
  const [headline, setHeadline] = useState(content?.headline ?? "اشترك واحصل على خصم 15% على أول طلب 🎁");
  const [subheadline, setSubheadline] = useState(content?.subheadline ?? "كن أول من يعرف عن العروض الحصرية");
  const [ctaText, setCtaText] = useState(content?.ctaText ?? "اشترك الآن");
  const [isPending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const res = await UpdateSectionContentAction({ storeId, updates: { newsletter: { headline, subheadline, ctaText } } });
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  return (
    <div className="space-y-2">
      <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="العنوان" className="text-sm" />
      <Input value={subheadline} onChange={(e) => setSubheadline(e.target.value)} placeholder="العنوان الفرعي" className="text-sm" />
      <Input value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder="نص الزر" className="text-sm" />
      <Button size="sm" className="gap-1.5 text-xs" onClick={save} disabled={isPending}>
        <Save className="size-3" />
        حفظ
      </Button>
    </div>
  );
}

function UrgencyEditor({
  storeId,
  content,
}: {
  storeId: string;
  content?: SectionContentMap["urgency"];
}) {
  const [headline, setHeadline] = useState(content?.headline ?? "⚡ عرض محدود الوقت — لا تفوّته!");
  const [timerEndDate, setTimerEndDate] = useState(content?.timerEndDate ?? "");
  const [showStockBadge, setShowStockBadge] = useState(content?.showStockBadge ?? true);
  const [showViewersBadge, setShowViewersBadge] = useState(content?.showViewersBadge ?? true);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const res = await UpdateSectionContentAction({
        storeId,
        updates: { urgency: { headline, timerEndDate: timerEndDate || undefined, showStockBadge, showViewersBadge } },
      });
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  return (
    <div className="space-y-2">
      <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="العنوان" className="text-sm" />
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">تاريخ انتهاء العرض (اختياري)</label>
        <Input type="datetime-local" value={timerEndDate} onChange={(e) => setTimerEndDate(e.target.value)} className="text-sm" />
      </div>
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <Switch checked={showStockBadge} onCheckedChange={setShowStockBadge} />
          <span>شارة المخزون</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Switch checked={showViewersBadge} onCheckedChange={setShowViewersBadge} />
          <span>عدد المتصفحين</span>
        </label>
      </div>
      <Button size="sm" className="gap-1.5 text-xs" onClick={save} disabled={isPending}>
        <Save className="size-3" />
        حفظ
      </Button>
    </div>
  );
}

// Map section key to its content editor
function SectionContentEditor({
  sectionKey,
  storeId,
  sectionContent,
}: {
  sectionKey: SectionKey;
  storeId: string;
  sectionContent: SectionContentMap;
}) {
  switch (sectionKey) {
    case "showOfferStrip":
      return <OfferStripEditor storeId={storeId} content={sectionContent.offerStrip} />;
    case "showSocialProof":
      return <SocialProofEditor storeId={storeId} content={sectionContent.socialProof} />;
    case "showWhyChooseUs":
      return <WhyChooseUsEditor storeId={storeId} content={sectionContent.whyChooseUs} />;
    case "showTestimonials":
      return <TestimonialsEditor storeId={storeId} content={sectionContent.testimonials} />;
    case "showAboutBrand":
      return <AboutBrandEditor storeId={storeId} content={sectionContent.aboutBrand} />;
    case "showNewsletter":
      return <NewsletterEditor storeId={storeId} content={sectionContent.newsletter} />;
    case "showUrgency":
      return <UrgencyEditor storeId={storeId} content={sectionContent.urgency} />;
    default:
      return null;
  }
}

const FUNNEL_SECTION_KEYS: SectionKey[] = [
  "showOfferStrip", "showSocialProof", "showBestSellers", "showCollections",
  "showWhyChooseUs", "showTestimonials", "showUrgency", "showAboutBrand", "showNewsletter",
];

// ─── Sortable Row ──────────────────────────────────────────────────────────────

function SortableRow({
  sectionKey,
  isOn,
  isPending,
  onToggle,
  storeId,
  sectionContent,
}: {
  sectionKey: SectionKey;
  isOn: boolean;
  isPending: boolean;
  onToggle: (key: SectionKey, value: boolean) => void;
  storeId: string;
  sectionContent: SectionContentMap;
}) {
  const meta = SECTION_META[sectionKey];
  const Icon = meta.icon;
  const hasEditor = SectionContentEditor({ sectionKey, storeId, sectionContent }) !== null;
  const [expanded, setExpanded] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sectionKey });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    position: isDragging ? ("relative" as const) : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`transition-colors ${
        isDragging
          ? "rounded-2xl border border-primary/30 bg-primary/5 shadow-lg"
          : ""
      }`}
    >
      {/* Main row */}
      <div
        className={`flex items-center gap-4 px-4 py-3.5 ${
          isOn ? "bg-background" : "bg-muted/30"
        }`}
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground transition-colors active:cursor-grabbing"
          aria-label="اسحب لإعادة الترتيب"
          tabIndex={-1}
        >
          <GripVertical className="size-4" />
        </button>

        {/* Icon */}
        <div
          className={`grid size-8 shrink-0 place-items-center rounded-lg transition-colors ${
            isOn
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <Icon className="size-4" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p
              className={`text-sm font-medium transition-colors ${
                isOn ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {meta.label}
            </p>
            {meta.badge && (
              <Badge variant="default" className="h-4 px-1.5 text-[9px] font-bold">
                {meta.badge}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {meta.description}
          </p>
        </div>

        {/* Status badge */}
        <span
          className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold sm:inline-block ${
            isOn
              ? "bg-green-500/10 text-green-600 dark:text-green-400"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {isOn ? "مُفعّل" : "مُخفي"}
        </span>

        {/* Expand button (for funnel sections with editors) */}
        {hasEditor && isOn && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label={expanded ? "طي" : "تخصيص"}
          >
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        )}

        {/* Toggle */}
        <Switch
          checked={isOn}
          onCheckedChange={(val) => onToggle(sectionKey, val)}
          disabled={isPending}
          aria-label={meta.label}
        />
      </div>

      {/* Inline content editor */}
      {hasEditor && isOn && expanded && (
        <div className="border-t bg-muted/20 px-4 py-4">
          <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            تخصيص المحتوى
          </p>
          <SectionContentEditor
            sectionKey={sectionKey}
            storeId={storeId}
            sectionContent={sectionContent}
          />
        </div>
      )}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  storeId: string;
  currentSections: ThemeSections;
  sectionContent?: SectionContentMap;
};

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ThemeSectionsEditor({
  storeId,
  currentSections,
  sectionContent = {},
}: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const initialOrder: SectionKey[] =
    currentSections.home.sectionOrder ?? DEFAULT_SECTION_ORDER;

  const [order, setOrder] = useState<SectionKey[]>(initialOrder);
  const [visibility, setVisibility] = useState<Omit<HomePageSections, "sectionOrder">>({
    showHero: currentSections.home.showHero,
    showCategories: currentSections.home.showCategories,
    showFeaturedProducts: currentSections.home.showFeaturedProducts,
    showLatestProducts: currentSections.home.showLatestProducts,
    showOfferStrip: currentSections.home.showOfferStrip ?? false,
    showSocialProof: currentSections.home.showSocialProof ?? false,
    showBestSellers: currentSections.home.showBestSellers ?? false,
    showWhyChooseUs: currentSections.home.showWhyChooseUs ?? false,
    showTestimonials: currentSections.home.showTestimonials ?? false,
    showAboutBrand: currentSections.home.showAboutBrand ?? false,
    showNewsletter: currentSections.home.showNewsletter ?? false,
    showUrgency: currentSections.home.showUrgency ?? false,
    showCollections: currentSections.home.showCollections ?? false,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function toggle(key: SectionKey, value: boolean) {
    setVisibility((prev) => ({ ...prev, [key]: value }));
    startTransition(async () => {
      try {
        const result = await UpdateThemeSectionsAction({
          storeId,
          page: "home",
          updates: { [key]: value },
        });
        if (result.success) {
          toast.success(result.message);
          router.refresh();
        } else {
          setVisibility((prev) => ({ ...prev, [key]: !value }));
          toast.error(result.message);
        }
      } catch {
        setVisibility((prev) => ({ ...prev, [key]: !value }));
        toast.error("حصل خطأ غير متوقع، حاول تاني");
      }
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = order.indexOf(active.id as SectionKey);
    const newIndex = order.indexOf(over.id as SectionKey);
    const newOrder = arrayMove(order, oldIndex, newIndex);
    setOrder(newOrder);
    startTransition(async () => {
      try {
        const result = await UpdateSectionOrderAction({ storeId, order: newOrder });
        if (result.success) {
          toast.success(result.message);
          router.refresh();
        } else {
          setOrder(order);
          toast.error(result.message);
        }
      } catch {
        setOrder(order);
        toast.error("حصل خطأ أثناء حفظ الترتيب");
      }
    });
  }

  const coreSectionKeys = order.filter((k) => !FUNNEL_SECTION_KEYS.includes(k));
  const funnelSectionKeys = order.filter((k) => FUNNEL_SECTION_KEYS.includes(k));
  // Add any funnel keys that might be missing from the saved order
  const missingFunnelKeys = FUNNEL_SECTION_KEYS.filter((k) => !order.includes(k));
  const allFunnelKeys = [...funnelSectionKeys, ...missingFunnelKeys];

  const renderRow = (key: SectionKey) => (
    <SortableRow
      key={key}
      sectionKey={key}
      isOn={visibility[key as keyof typeof visibility]}
      isPending={isPending}
      onToggle={toggle}
      storeId={storeId}
      sectionContent={sectionContent}
    />
  );

  return (
    <Card dir="rtl">
      <CardContent className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Layers className="size-4" />
          </div>
          <div>
            <h2 className="font-semibold">إدارة أقسام المتجر</h2>
            <p className="text-xs text-muted-foreground">
              اسحب لإعادة الترتيب • فعّل أو أخفِ كل قسم • خصّص المحتوى
            </p>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={order} strategy={verticalListSortingStrategy}>
            {/* Core Sections */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                الأقسام الأساسية
              </h3>
              <div className="divide-y divide-border rounded-2xl border overflow-hidden">
                {coreSectionKeys.map(renderRow)}
              </div>
            </div>

            {/* Sales Funnel Sections */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  أقسام Sales Funnel
                </h3>
                <Badge variant="default" className="h-4 px-1.5 text-[9px] font-bold">
                  جديد
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground -mt-1">
                فعّل هذه الأقسام لتحويل متجرك إلى محرك مبيعات حقيقي 🔥
              </p>
              <div className="divide-y divide-border rounded-2xl border overflow-hidden">
                {allFunnelKeys.map(renderRow)}
              </div>
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
}
