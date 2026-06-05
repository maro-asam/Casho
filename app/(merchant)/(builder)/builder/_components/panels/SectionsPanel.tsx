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
} from "lucide-react";
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

// ─── Section metadata ─────────────────────────────────────────────────────────

type SectionMeta = {
  icon: React.ElementType;
  label: string;
  category: "core" | "funnel";
  badge?: string;
};

const SECTION_META: Record<SectionKey, SectionMeta> = {
  showHero:            { icon: ImageIcon,     label: "البانر الرئيسي",    category: "core" },
  showCategories:      { icon: LayoutGrid,    label: "التصنيفات",          category: "core" },
  showFeaturedProducts:{ icon: Star,          label: "المنتجات المميزة",   category: "core" },
  showLatestProducts:  { icon: Clock,         label: "أحدث المنتجات",      category: "core" },
  showOfferStrip:      { icon: Megaphone,     label: "شريط العروض",        category: "funnel", badge: "جديد" },
  showSocialProof:     { icon: Users,         label: "إثبات الثقة",        category: "funnel", badge: "جديد" },
  showBestSellers:     { icon: TrendingUp,    label: "الأكثر مبيعًا",      category: "funnel", badge: "جديد" },
  showCollections:     { icon: FolderOpen,    label: "المجموعات",           category: "funnel", badge: "جديد" },
  showWhyChooseUs:     { icon: ThumbsUp,      label: "لماذا تختارنا؟",     category: "funnel", badge: "جديد" },
  showTestimonials:    { icon: MessageSquare, label: "آراء العملاء",        category: "funnel", badge: "جديد" },
  showUrgency:         { icon: Timer,         label: "عرض عاجل",            category: "funnel", badge: "جديد" },
  showAboutBrand:      { icon: Store,         label: "نبذة عن المتجر",     category: "funnel", badge: "جديد" },
  showNewsletter:      { icon: Mail,          label: "الاشتراك البريدي",   category: "funnel", badge: "جديد" },
};

const FUNNEL_KEYS: SectionKey[] = [
  "showOfferStrip","showSocialProof","showBestSellers","showCollections",
  "showWhyChooseUs","showTestimonials","showUrgency","showAboutBrand","showNewsletter",
];

// ─── Inline editors (compact versions for the builder panel) ─────────────────

function OfferStripEditor({ storeId, content }: { storeId: string; content?: SectionContentMap["offerStrip"] }) {
  const [items, setItems] = useState<string[]>(content?.items ?? ["🚚 توصيل سريع", "✅ ضمان 30 يوم", "💳 الدفع عند الاستلام"]);
  const [isPending, startTransition] = useTransition();
  const { reloadPreview } = useBuilder();
  const save = () => startTransition(async () => {
    const res = await UpdateSectionContentAction({ storeId, updates: { offerStrip: { items: items.filter(Boolean) } } });
    if (res.success) { toast.success("تم الحفظ"); reloadPreview(); }
    else toast.error(res.message);
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
          <Plus className="size-3" />إضافة
        </Button>
        <Button size="sm" className="h-7 text-xs gap-1" onClick={save} disabled={isPending}>
          <Save className="size-3" />حفظ
        </Button>
      </div>
    </div>
  );
}

function SocialProofEditor({ storeId, content }: { storeId: string; content?: SectionContentMap["socialProof"] }) {
  const [headline, setHeadline] = useState(content?.headline ?? "لماذا يثق بنا آلاف العملاء؟");
  const [stats, setStats] = useState(content?.stats ?? [
    { icon: "😊", value: "10,000+", label: "عميل سعيد" },
    { icon: "⭐", value: "4.9", label: "متوسط التقييم" },
    { icon: "🚚", value: "24h", label: "متوسط التوصيل" },
    { icon: "🔄", value: "30 يوم", label: "ضمان الاسترجاع" },
  ]);
  const [isPending, startTransition] = useTransition();
  const { reloadPreview } = useBuilder();
  const save = () => startTransition(async () => {
    const res = await UpdateSectionContentAction({ storeId, updates: { socialProof: { headline, stats } } });
    if (res.success) { toast.success("تم الحفظ"); reloadPreview(); }
    else toast.error(res.message);
  });
  return (
    <div className="space-y-2">
      <Input value={headline} onChange={(e)=>setHeadline(e.target.value)} placeholder="عنوان القسم" className="h-8 text-xs" />
      <div className="space-y-1.5">
        {stats.map((stat, i) => (
          <div key={i} className="grid grid-cols-[1.75rem_1fr_1fr] gap-1">
            <Input value={stat.icon} onChange={(e)=>{const n=[...stats];n[i]={...n[i],icon:e.target.value};setStats(n);}} className="h-8 text-center text-xs px-1" maxLength={4} />
            <Input value={stat.value} onChange={(e)=>{const n=[...stats];n[i]={...n[i],value:e.target.value};setStats(n);}} placeholder="القيمة" className="h-8 text-xs" />
            <Input value={stat.label} onChange={(e)=>{const n=[...stats];n[i]={...n[i],label:e.target.value};setStats(n);}} placeholder="التسمية" className="h-8 text-xs" />
          </div>
        ))}
      </div>
      <Button size="sm" className="h-7 text-xs gap-1 w-full" onClick={save} disabled={isPending}>
        <Save className="size-3" />حفظ
      </Button>
    </div>
  );
}

function WhyChooseUsEditor({ storeId, content }: { storeId: string; content?: SectionContentMap["whyChooseUs"] }) {
  const [headline, setHeadline] = useState(content?.headline ?? "لماذا تتسوق معنا؟");
  const [cards, setCards] = useState(content?.cards ?? [
    { icon: "🛡️", title: "ضمان الجودة", description: "فحص دقيق قبل الشحن" },
    { icon: "🚀", title: "شحن سريع", description: "24-48 ساعة لجميع المحافظات" },
    { icon: "💬", title: "دعم متواصل", description: "فريق الدعم جاهز في أي وقت" },
    { icon: "🔄", title: "إرجاع مجاني", description: "ارجع المنتج خلال 30 يوم" },
  ]);
  const [isPending, startTransition] = useTransition();
  const { reloadPreview } = useBuilder();
  const save = () => startTransition(async () => {
    const res = await UpdateSectionContentAction({ storeId, updates: { whyChooseUs: { headline, cards } } });
    if (res.success) { toast.success("تم الحفظ"); reloadPreview(); }
    else toast.error(res.message);
  });
  return (
    <div className="space-y-2">
      <Input value={headline} onChange={(e)=>setHeadline(e.target.value)} placeholder="عنوان القسم" className="h-8 text-xs" />
      <div className="space-y-1.5">
        {cards.map((card, i) => (
          <div key={i} className="rounded-lg border p-2 space-y-1.5">
            <div className="flex gap-1.5">
              <Input value={card.icon} onChange={(e)=>{const n=[...cards];n[i]={...n[i],icon:e.target.value};setCards(n);}} className="h-7 w-12 text-center text-xs px-1" maxLength={4} />
              <Input value={card.title} onChange={(e)=>{const n=[...cards];n[i]={...n[i],title:e.target.value};setCards(n);}} placeholder="العنوان" className="h-7 flex-1 text-xs" />
            </div>
            <Input value={card.description} onChange={(e)=>{const n=[...cards];n[i]={...n[i],description:e.target.value};setCards(n);}} placeholder="الوصف" className="h-7 text-xs" />
          </div>
        ))}
      </div>
      <Button size="sm" className="h-7 text-xs gap-1 w-full" onClick={save} disabled={isPending}>
        <Save className="size-3" />حفظ
      </Button>
    </div>
  );
}

function TestimonialsEditor({ storeId, content }: { storeId: string; content?: SectionContentMap["testimonials"] }) {
  const [headline, setHeadline] = useState(content?.headline ?? "ماذا يقول عملاؤنا؟");
  const [items, setItems] = useState(content?.items ?? [
    { name: "أحمد محمد", text: "منتجات ممتازة وجودة عالية", rating: 5 },
    { name: "سارة أحمد", text: "أفضل متجر تسوقت منه", rating: 5 },
  ]);
  const [isPending, startTransition] = useTransition();
  const { reloadPreview } = useBuilder();
  const save = () => startTransition(async () => {
    const res = await UpdateSectionContentAction({ storeId, updates: { testimonials: { headline, items } } });
    if (res.success) { toast.success("تم الحفظ"); reloadPreview(); }
    else toast.error(res.message);
  });
  return (
    <div className="space-y-2">
      <Input value={headline} onChange={(e)=>setHeadline(e.target.value)} placeholder="عنوان القسم" className="h-8 text-xs" />
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="rounded-lg border p-2 space-y-1.5">
            <div className="flex gap-1.5">
              <Input value={item.name} onChange={(e)=>{const n=[...items];n[i]={...n[i],name:e.target.value};setItems(n);}} placeholder="الاسم" className="h-7 flex-1 text-xs" />
              <Input type="number" min={1} max={5} value={item.rating??5} onChange={(e)=>{const n=[...items];n[i]={...n[i],rating:Number(e.target.value)};setItems(n);}} className="h-7 w-12 text-center text-xs" />
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={()=>setItems(items.filter((_,j)=>j!==i))}>
                <Trash2 className="size-3 text-destructive" />
              </Button>
            </div>
            <Textarea value={item.text} onChange={(e)=>{const n=[...items];n[i]={...n[i],text:e.target.value};setItems(n);}} placeholder="التقييم..." className="text-xs resize-none" rows={2} />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5">
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1 flex-1" onClick={()=>setItems([...items,{name:"",text:"",rating:5}])}>
          <Plus className="size-3" />إضافة
        </Button>
        <Button size="sm" className="h-7 text-xs gap-1 flex-1" onClick={save} disabled={isPending}>
          <Save className="size-3" />حفظ
        </Button>
      </div>
    </div>
  );
}

function AboutBrandEditor({ storeId, content }: { storeId: string; content?: SectionContentMap["aboutBrand"] }) {
  const [headline, setHeadline] = useState(content?.headline ?? "");
  const [text, setText] = useState(content?.text ?? "");
  const [ctaText, setCtaText] = useState(content?.ctaText ?? "اعرف أكثر");
  const [ctaLink, setCtaLink] = useState(content?.ctaLink ?? "/about");
  const [isPending, startTransition] = useTransition();
  const { reloadPreview } = useBuilder();
  const save = () => startTransition(async () => {
    const res = await UpdateSectionContentAction({ storeId, updates: { aboutBrand: { headline, text, ctaText, ctaLink } } });
    if (res.success) { toast.success("تم الحفظ"); reloadPreview(); }
    else toast.error(res.message);
  });
  return (
    <div className="space-y-1.5">
      <Input value={headline} onChange={(e)=>setHeadline(e.target.value)} placeholder="العنوان الرئيسي" className="h-8 text-xs" />
      <Textarea value={text} onChange={(e)=>setText(e.target.value)} placeholder="نبذة قصيرة..." className="text-xs resize-none" rows={3} />
      <div className="grid grid-cols-2 gap-1.5">
        <Input value={ctaText} onChange={(e)=>setCtaText(e.target.value)} placeholder="نص الزر" className="h-8 text-xs" />
        <Input value={ctaLink} onChange={(e)=>setCtaLink(e.target.value)} placeholder="/about" className="h-8 text-xs" />
      </div>
      <Button size="sm" className="h-7 text-xs gap-1 w-full" onClick={save} disabled={isPending}>
        <Save className="size-3" />حفظ
      </Button>
    </div>
  );
}

function NewsletterEditor({ storeId, content }: { storeId: string; content?: SectionContentMap["newsletter"] }) {
  const [headline, setHeadline] = useState(content?.headline ?? "اشترك واحصل على خصم 15% 🎁");
  const [subheadline, setSubheadline] = useState(content?.subheadline ?? "كن أول من يعرف عن العروض");
  const [ctaText, setCtaText] = useState(content?.ctaText ?? "اشترك الآن");
  const [isPending, startTransition] = useTransition();
  const { reloadPreview } = useBuilder();
  const save = () => startTransition(async () => {
    const res = await UpdateSectionContentAction({ storeId, updates: { newsletter: { headline, subheadline, ctaText } } });
    if (res.success) { toast.success("تم الحفظ"); reloadPreview(); }
    else toast.error(res.message);
  });
  return (
    <div className="space-y-1.5">
      <Input value={headline} onChange={(e)=>setHeadline(e.target.value)} placeholder="العنوان" className="h-8 text-xs" />
      <Input value={subheadline} onChange={(e)=>setSubheadline(e.target.value)} placeholder="العنوان الفرعي" className="h-8 text-xs" />
      <Input value={ctaText} onChange={(e)=>setCtaText(e.target.value)} placeholder="نص الزر" className="h-8 text-xs" />
      <Button size="sm" className="h-7 text-xs gap-1 w-full" onClick={save} disabled={isPending}>
        <Save className="size-3" />حفظ
      </Button>
    </div>
  );
}

function UrgencyEditor({ storeId, content }: { storeId: string; content?: SectionContentMap["urgency"] }) {
  const [headline, setHeadline] = useState(content?.headline ?? "⚡ عرض محدود الوقت!");
  const [timerEndDate, setTimerEndDate] = useState(content?.timerEndDate ?? "");
  const [showStockBadge, setShowStockBadge] = useState(content?.showStockBadge ?? true);
  const [showViewersBadge, setShowViewersBadge] = useState(content?.showViewersBadge ?? true);
  const [isPending, startTransition] = useTransition();
  const { reloadPreview } = useBuilder();
  const save = () => startTransition(async () => {
    const res = await UpdateSectionContentAction({ storeId, updates: { urgency: { headline, timerEndDate: timerEndDate||undefined, showStockBadge, showViewersBadge } } });
    if (res.success) { toast.success("تم الحفظ"); reloadPreview(); }
    else toast.error(res.message);
  });
  return (
    <div className="space-y-2">
      <Input value={headline} onChange={(e)=>setHeadline(e.target.value)} placeholder="العنوان" className="h-8 text-xs" />
      <Input type="datetime-local" value={timerEndDate} onChange={(e)=>setTimerEndDate(e.target.value)} className="h-8 text-xs" />
      <div className="flex gap-4 text-xs">
        <label className="flex items-center gap-2 cursor-pointer">
          <Switch checked={showStockBadge} onCheckedChange={setShowStockBadge} />
          شارة المخزون
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Switch checked={showViewersBadge} onCheckedChange={setShowViewersBadge} />
          عدد المتصفحين
        </label>
      </div>
      <Button size="sm" className="h-7 text-xs gap-1 w-full" onClick={save} disabled={isPending}>
        <Save className="size-3" />حفظ
      </Button>
    </div>
  );
}

function SectionEditor({ sectionKey, storeId, sectionContent }: { sectionKey: SectionKey; storeId: string; sectionContent: SectionContentMap }) {
  switch (sectionKey) {
    case "showOfferStrip":    return <OfferStripEditor storeId={storeId} content={sectionContent.offerStrip} />;
    case "showSocialProof":   return <SocialProofEditor storeId={storeId} content={sectionContent.socialProof} />;
    case "showWhyChooseUs":   return <WhyChooseUsEditor storeId={storeId} content={sectionContent.whyChooseUs} />;
    case "showTestimonials":  return <TestimonialsEditor storeId={storeId} content={sectionContent.testimonials} />;
    case "showAboutBrand":    return <AboutBrandEditor storeId={storeId} content={sectionContent.aboutBrand} />;
    case "showNewsletter":    return <NewsletterEditor storeId={storeId} content={sectionContent.newsletter} />;
    case "showUrgency":       return <UrgencyEditor storeId={storeId} content={sectionContent.urgency} />;
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
                  تخصيص المحتوى
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
    <div className="flex items-center gap-2 rounded-xl border border-primary/40 bg-background px-3 py-2.5 shadow-2xl ring-2 ring-primary/20 w-[300px]">
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
      if (result.success) { toast.success("تم حفظ الترتيب"); reloadPreview(); }
      else { setOrder(order); toast.error(result.message); }
    });
  }

  function toggle(key: SectionKey, value: boolean) {
    setVisibility((prev) => ({ ...prev, [key]: value }));
    startTransition(async () => {
      const result = await UpdateThemeSectionsAction({ storeId, page: "home", updates: { [key]: value } });
      if (result.success) { toast.success(result.message); reloadPreview(); }
      else { setVisibility((prev) => ({ ...prev, [key]: !value })); toast.error(result.message); }
    });
  }

  const coreKeys = order.filter((k) => !FUNNEL_KEYS.includes(k));
  const funnelKeys = order.filter((k) => FUNNEL_KEYS.includes(k));
  const missingFunnel = FUNNEL_KEYS.filter((k) => !order.includes(k));
  const allFunnelKeys = [...funnelKeys, ...missingFunnel];

  const rowProps = (key: SectionKey) => ({
    key,
    sectionKey: key,
    isOn: !!visibility[key as keyof typeof visibility],
    isPending,
    onToggle: toggle,
    storeId,
    sectionContent,
  });

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3 bg-background">
        <div className="flex items-center gap-2">
          <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
            <Layers className="size-3.5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">الأقسام</h2>
            <p className="text-[10px] text-muted-foreground">اسحب لإعادة الترتيب</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground"
          onClick={reloadPreview}
          title="تحديث المعاينة"
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
                أساسية
              </p>
              <div className="divide-y divide-border rounded-xl border overflow-hidden">
                {coreKeys.map((k) => <SortableRow {...rowProps(k)} />)}
              </div>
            </div>

            {/* Funnel sections */}
            <div className="px-3 pt-3 pb-4">
              <div className="flex items-center gap-2 mb-1.5 px-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Sales Funnel
                </p>
                <Badge variant="default" className="h-3.5 px-1 text-[9px] font-bold">جديد</Badge>
              </div>
              <div className="divide-y divide-border rounded-xl border overflow-hidden">
                {allFunnelKeys.map((k) => <SortableRow {...rowProps(k)} />)}
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
