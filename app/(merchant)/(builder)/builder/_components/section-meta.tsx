import {
  AlignLeft,
  Calculator,
  ListChecks,
  Clock,
  Focus,
  FolderOpen,
  Gift,
  Image as ImageIcon,
  LayoutGrid,
  Mail,
  Megaphone,
  MessageSquare,
  Sparkles,
  Star,
  Store,
  ThumbsUp,
  Timer,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { SectionKey, ThemePresetId } from "@/types/store-theme.types";
import { cn } from "@/lib/utils";
import { tr } from "@/lib/i18n/dashboard";
import type { PanelId } from "./BuilderContext";

export type SectionGroup = "core" | "sales" | "story";

type SectionMeta = {
  icon: LucideIcon;
  /** Settings-style icon tile color. */
  tint: string;
  label: string;
  description: string;
  group: SectionGroup;
  /** Where its data lives when it isn't edited here (banners, categories…). */
  source?: { label: string; href: string };
  /** Offered only with these themes; omitted = every theme. */
  themes?: ThemePresetId[];
};

export const SECTION_META: Record<SectionKey, SectionMeta> = {
  showHero: {
    icon: ImageIcon,
    tint: "bg-(--sys-indigo)",
    get label() { return tr("البانر الرئيسي"); },
    get description() { return tr("الصورة الكبيرة أول الصفحة — بتتملي من البانرز."); },
    group: "core",
    source: { get label() { return tr("إدارة البانرز"); }, href: "/banners" },
  },
  showCategories: {
    icon: LayoutGrid,
    tint: "bg-(--sys-teal)",
    get label() { return tr("التصنيفات"); },
    get description() { return tr("تصنيفات متجرك كبطاقات تتصفّح منها."); },
    group: "core",
    source: { get label() { return tr("إدارة التصنيفات"); }, href: "/categories" },
  },
  showFeaturedProducts: {
    icon: Star,
    tint: "bg-(--sys-orange)",
    get label() { return tr("المنتجات المميزة"); },
    get description() { return tr("المنتجات اللي علّمتها كمميزة."); },
    group: "core",
    source: { get label() { return tr("المنتجات"); }, href: "/products" },
  },
  showLatestProducts: {
    icon: Clock,
    tint: "bg-(--sys-gray)",
    get label() { return tr("أحدث المنتجات"); },
    get description() { return tr("شبكة بآخر المنتجات اللي ضفتها."); },
    group: "core",
  },
  showOfferStrip: {
    icon: Megaphone,
    tint: "bg-(--sys-red)",
    get label() { return tr("شريط العروض"); },
    get description() { return tr("شريط متحرك بعروضك ومميزات الشراء."); },
    group: "sales",
  },
  showSocialProof: {
    icon: Users,
    tint: "bg-primary",
    get label() { return tr("أرقام الثقة"); },
    get description() { return tr("أرقام بتطمّن الزائر: عملاء، تقييم، توصيل."); },
    group: "sales",
  },
  showBestSellers: {
    icon: TrendingUp,
    tint: "bg-(--sys-green)",
    get label() { return tr("الأكثر مبيعًا"); },
    get description() { return tr("أقوى منتجاتك مبيعًا، بتتحدّث لوحدها."); },
    group: "sales",
  },
  showCollections: {
    icon: FolderOpen,
    tint: "bg-(--sys-teal)",
    get label() { return tr("معرض المجموعات"); },
    get description() { return tr("مجموعات منتجات بشكل بصري."); },
    group: "sales",
  },
  showWhyChooseUs: {
    icon: ThumbsUp,
    tint: "bg-primary",
    get label() { return tr("ليه تشتري مننا؟"); },
    get description() { return tr("بطاقات بمميزات متجرك."); },
    group: "sales",
  },
  showTestimonials: {
    icon: MessageSquare,
    tint: "bg-(--sys-orange)",
    get label() { return tr("آراء العملاء"); },
    get description() { return tr("تقييمات عملائك في كاروسيل."); },
    group: "sales",
  },
  showUrgency: {
    icon: Timer,
    tint: "bg-(--sys-red)",
    get label() { return tr("عرض لفترة محدودة"); },
    get description() { return tr("عداد تنازلي وشارات بتسرّع قرار الشراء."); },
    group: "sales",
  },
  showAboutBrand: {
    icon: Store,
    tint: "bg-(--sys-indigo)",
    get label() { return tr("عن المتجر"); },
    get description() { return tr("قصة قصيرة عن البراند بتبني الثقة."); },
    group: "story",
  },
  showNewsletter: {
    icon: Mail,
    tint: "bg-(--sys-green)",
    get label() { return tr("الاشتراك في العروض"); },
    get description() { return tr("اجمع إيميلات بخصم على أول طلب."); },
    group: "story",
  },
  showHeroBanner: {
    icon: Sparkles,
    tint: "bg-(--sys-indigo)",
    get label() { return tr("بانر مخصص"); },
    get description() { return tr("بانر بصورتك وكلامك وزرارك."); },
    group: "story",
  },
  showRichText: {
    icon: AlignLeft,
    tint: "bg-(--sys-gray)",
    get label() { return tr("نص"); },
    get description() { return tr("عنوان وفقرة — لأي رسالة عايز توصلها."); },
    group: "story",
  },
  showCalculator: {
    icon: Calculator,
    tint: "bg-(--sys-red)",
    get label() { return tr("حاسبة البروتين"); },
    get description() { return tr("وزن وهدف، والعميل يعرف احتياجه ويدخل على قسم البروتين."); },
    group: "sales",
    themes: ["gym"],
  },
  showShoppingList: {
    icon: ListChecks,
    tint: "bg-(--sys-orange)",
    get label() { return tr("قايمة المشتريات"); },
    get description() { return tr("العميل يكتب طلباته زي الورقة ويبعتها للمتجر على واتساب."); },
    group: "sales",
    themes: ["market"],
  },
  showSpotlight: {
    icon: Focus,
    tint: "bg-(--sys-indigo)",
    get label() { return tr("منتج تحت الأضواء"); },
    get description() { return tr("منتج واحد مميز على خلفية سودا، بيكبر ويظهر مع السكرول زي إعلانات Apple."); },
    group: "sales",
    themes: ["stage"],
  },
  showGiftFinder: {
    icon: Gift,
    tint: "bg-(--sys-orange)",
    get label() { return tr("مساعد الهدايا"); },
    get description() { return tr("العميل يختار الميزانية ونوع القطعة ويوصل للهدية المناسبة، أو يسألك على واتساب."); },
    group: "sales",
    themes: ["qirat"],
  },
};

export const SECTION_GROUP_LABELS: Record<SectionGroup, string> = {
  get core() { return tr("أساسية"); },
  get sales() { return tr("بتزوّد المبيعات"); },
  get story() { return tr("محتوى وقصة"); },
};

/** Every home section the Studio offers with this theme. */
export const allSectionKeys = (presetId: ThemePresetId) =>
  (Object.keys(SECTION_META) as SectionKey[]).filter((k) => !SECTION_META[k].themes || SECTION_META[k].themes.includes(presetId));

export const isSectionKey = (v: unknown): v is SectionKey => typeof v === "string" && v in SECTION_META;

/** Label shown on a hovered region in the canvas. */
export function regionLabel(id: string) {
  if (id === "header") return tr("الهيدر · اللوجو والإعلان");
  if (id === "footer") return tr("الفوتر · وصف المتجر");
  return isSectionKey(id) ? SECTION_META[id].label : "";
}

/** Which settings a click on a canvas region opens. */
export function regionTarget(id: string): { panel: PanelId; section: string | null } | null {
  if (id === "header" || id === "footer") return { panel: "identity", section: null };
  if (isSectionKey(id)) return { panel: "sections", section: id };
  return null;
}

// ─── Library thumbnails ──────────────────────────────────────────────────────
// Schematic, color-neutral sketches (render instantly, no images).

const bar = "rounded-full bg-foreground/15";
const tile = "rounded-[5px] bg-foreground/10";
const accent = "bg-primary/70";

export function SectionThumb({ id, className }: { id: SectionKey; className?: string }) {
  return (
    <div aria-hidden className={cn("relative aspect-16/10 overflow-hidden rounded-[10px] bg-card p-2 ring-1 ring-foreground/8", className)}>
      {thumb(id)}
    </div>
  );
}

function grid(n: number, cls = "aspect-square") {
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="space-y-1">
          <div className={cn(tile, cls)} />
          <div className={cn(bar, "h-1 w-3/4")} />
        </div>
      ))}
    </div>
  );
}

function thumb(id: SectionKey) {
  switch (id) {
    case "showHero":
    case "showHeroBanner":
      return (
        <div className="flex h-full flex-col justify-end rounded-[6px] bg-linear-to-br from-primary/35 to-primary/70 p-2">
          <div className="h-1.5 w-1/2 rounded-full bg-white/90" />
          <div className="mt-1 h-1 w-1/3 rounded-full bg-white/60" />
          <div className="mt-1.5 h-2.5 w-8 rounded-full bg-white" />
        </div>
      );
    case "showCategories":
    case "showCollections":
      return (
        <div className="flex h-full items-center gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className={cn("aspect-square w-full", id === "showCategories" ? "rounded-full bg-foreground/10" : tile)} />
              <div className={cn(bar, "h-1 w-2/3")} />
            </div>
          ))}
        </div>
      );
    case "showFeaturedProducts":
    case "showLatestProducts":
    case "showBestSellers":
      return (
        <div className="space-y-1.5">
          <div className={cn(bar, "h-1.5 w-1/3")} />
          {grid(4)}
        </div>
      );
    case "showOfferStrip":
      return (
        <div className="flex h-full items-center">
          <div className={cn("flex h-4 w-full items-center gap-2 rounded-[4px] px-2", accent)}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-1 flex-1 rounded-full bg-white/80" />
            ))}
          </div>
        </div>
      );
    case "showSocialProof":
      return (
        <div className="grid h-full grid-cols-4 items-center gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="size-3 rounded-full bg-primary/40" />
              <div className="h-1.5 w-full rounded-full bg-foreground/25" />
              <div className={cn(bar, "h-1 w-2/3")} />
            </div>
          ))}
        </div>
      );
    case "showWhyChooseUs":
      return (
        <div className="grid h-full grid-cols-3 gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className={cn(tile, "space-y-1 p-1.5")}>
              <div className="size-2.5 rounded-full bg-primary/50" />
              <div className={cn(bar, "h-1 w-full")} />
              <div className={cn(bar, "h-1 w-2/3")} />
            </div>
          ))}
        </div>
      );
    case "showTestimonials":
      return (
        <div className="flex h-full gap-1.5">
          {[0, 1].map((i) => (
            <div key={i} className={cn(tile, "flex-1 space-y-1 p-1.5")}>
              <div className="flex gap-0.5">
                {[0, 1, 2, 3, 4].map((s) => (
                  <div key={s} className="size-1 rounded-full bg-(--sys-orange)" />
                ))}
              </div>
              <div className={cn(bar, "h-1 w-full")} />
              <div className={cn(bar, "h-1 w-4/5")} />
              <div className="mt-1 size-2.5 rounded-full bg-foreground/20" />
            </div>
          ))}
        </div>
      );
    case "showUrgency":
      return (
        <div className="flex h-full flex-col items-center justify-center gap-1.5">
          <div className={cn(bar, "h-1.5 w-1/2")} />
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="grid size-4 place-items-center rounded-[4px] bg-(--sys-red)/70">
                <div className="h-1 w-2 rounded-full bg-white/90" />
              </div>
            ))}
          </div>
        </div>
      );
    case "showAboutBrand":
      return (
        <div className="flex h-full gap-1.5">
          <div className={cn(tile, "w-2/5")} />
          <div className="flex flex-1 flex-col justify-center gap-1">
            <div className={cn(bar, "h-1.5 w-2/3")} />
            <div className={cn(bar, "h-1 w-full")} />
            <div className={cn(bar, "h-1 w-5/6")} />
            <div className={cn("mt-1 h-2.5 w-8 rounded-full", accent)} />
          </div>
        </div>
      );
    case "showNewsletter":
      return (
        <div className="flex h-full flex-col items-center justify-center gap-1.5 rounded-[6px] bg-primary/10">
          <div className={cn(bar, "h-1.5 w-1/2")} />
          <div className="flex w-3/4 gap-1">
            <div className="h-3 flex-1 rounded-full bg-card" />
            <div className={cn("h-3 w-6 rounded-full", accent)} />
          </div>
        </div>
      );
    case "showCalculator":
      return (
        <div className="flex h-full gap-1.5">
          <div className={cn(tile, "flex flex-1 flex-col justify-center gap-1 p-1.5")}>
            <div className={cn(bar, "h-1 w-2/3")} />
            <div className={cn("h-1 w-full rounded-full", accent)} />
            <div className={cn(bar, "h-2 w-full")} />
          </div>
          <div className={cn("grid flex-1 place-items-center rounded-[5px]", accent)}>
            <div className="h-2.5 w-3/5 rounded-full bg-white/90" />
          </div>
        </div>
      );
    case "showShoppingList":
      return (
        <div className={cn(tile, "flex h-full flex-col justify-center gap-1 p-1.5")}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-1">
              <div className={cn("size-1.5 shrink-0 rounded-full", i === 0 ? accent : "bg-foreground/20")} />
              <div className={cn(bar, "h-1", i === 1 ? "w-3/5" : "w-4/5")} />
            </div>
          ))}
        </div>
      );
    case "showSpotlight":
      return (
        <div className="flex h-full flex-col items-center justify-center gap-1 rounded-[6px] bg-[#000]">
          <div className="h-1 w-1/3 rounded-full bg-white/80" />
          <div className="h-5 w-2/5 rounded-[4px] bg-white/25 shadow-[0_0_12px_rgba(255,255,255,.35)]" />
          <div className={cn("h-1.5 w-6 rounded-full", accent)} />
        </div>
      );
    case "showGiftFinder":
      return (
        <div className="flex h-full flex-col justify-center gap-1.5 rounded-[6px] bg-[#16120e] px-2">
          <div className="h-1 w-1/3 rounded-full bg-[#c9a66b]" />
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className={cn("h-2.5 flex-1 rounded-full border border-[#c9a66b]/60", i === 1 && "bg-[#c9a66b]/70")} />
            ))}
          </div>
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-[3/4] flex-1 rounded-[3px] bg-white/15" />
            ))}
          </div>
        </div>
      );
    case "showRichText":
      return (
        <div className="flex h-full flex-col items-center justify-center gap-1">
          <div className="h-1.5 w-1/2 rounded-full bg-foreground/30" />
          <div className={cn(bar, "h-1 w-4/5")} />
          <div className={cn(bar, "h-1 w-3/4")} />
          <div className={cn(bar, "h-1 w-2/3")} />
        </div>
      );
  }
}
