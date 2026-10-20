import {
  AlignLeft,
  Clock,
  FolderOpen,
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
import type { SectionKey } from "@/types/store-theme.types";
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
};

export const SECTION_GROUP_LABELS: Record<SectionGroup, string> = {
  get core() { return tr("أساسية"); },
  get sales() { return tr("بتزوّد المبيعات"); },
  get story() { return tr("محتوى وقصة"); },
};

/** Every home section the Studio knows. */
export const allSectionKeys = () => Object.keys(SECTION_META) as SectionKey[];

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
