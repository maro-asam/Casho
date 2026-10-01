import Link from "next/link";
import {
  Droplets,
  Gauge,
  Layers,
  LayoutGrid,
  type LucideIcon,
  MessageCircle,
  Palette,
  ShoppingBag,
  Sparkles,
  Type,
  UserSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const STUDIO_TABS = [
  "overview",
  "theme",
  "colors",
  "fonts",
  "design",
  "identity",
  "sections",
  "popups",
  "whatsapp",
  "social-proof",
] as const;
export type StudioTab = (typeof STUDIO_TABS)[number];
export const isStudioTab = (v: string | undefined): v is StudioTab => !!v && STUDIO_TABS.includes(v as StudioTab);

type NavItem = { tab: StudioTab; label: string; icon: LucideIcon; badge?: string };

const GROUPS: { label: string | null; items: NavItem[] }[] = [
  { label: null, items: [{ tab: "overview", label: "نظرة عامة", icon: Gauge }] },
  {
    label: "المظهر",
    items: [
      { tab: "theme", label: "الثيم", icon: Palette },
      { tab: "colors", label: "الألوان", icon: Droplets },
      { tab: "fonts", label: "الخطوط واللغة", icon: Type },
      { tab: "design", label: "شكل العرض", icon: LayoutGrid },
    ],
  },
  {
    label: "المحتوى",
    items: [
      { tab: "identity", label: "الهوية واللوجو", icon: UserSquare },
      { tab: "sections", label: "أقسام الرئيسية", icon: Layers },
    ],
  },
  {
    label: "زوّد مبيعاتك",
    items: [
      { tab: "popups", label: "النوافذ المنبثقة", icon: Sparkles, badge: "جديد" },
      { tab: "whatsapp", label: "زر واتساب", icon: MessageCircle },
      { tab: "social-proof", label: "إشعارات الشراء", icon: ShoppingBag },
    ],
  },
];

export const STUDIO_LABELS = Object.fromEntries(GROUPS.flatMap((g) => g.items.map((i) => [i.tab, i.label]))) as Record<
  StudioTab,
  string
>;

export const studioHref = (tab: StudioTab) => (tab === "overview" ? "/customization" : `/customization?tab=${tab}`);

/** Desktop: grouped vertical nav. Mobile: one scrollable row of chips. */
export function StudioNav({
  active,
  status,
  hidden = [],
}: {
  active: StudioTab;
  status: Partial<Record<StudioTab, boolean>>;
  hidden?: StudioTab[];
}) {
  const groups = GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => !hidden.includes(i.tab)) })).filter((g) => g.items.length);
  return (
    <>
      <nav aria-label="أقسام التخصيص" className="-mx-4 overflow-x-auto px-4 lg:hidden">
        <ul className="flex w-max gap-1.5 pb-1">
          {groups.flatMap((g) => g.items).map((item) => (
            <li key={item.tab}>
              <Link
                href={studioHref(item.tab)}
                scroll={false}
                aria-current={active === item.tab ? "page" : undefined}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors",
                  active === item.tab
                    ? "border-foreground bg-foreground font-medium text-background"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon className="size-3.5" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <nav aria-label="أقسام التخصيص" className="sticky top-20 hidden space-y-5 lg:block">
        {groups.map((group, i) => (
          <div key={i} className="space-y-1">
            {group.label && <p className="px-3 pb-1 text-[11px] font-medium text-muted-foreground">{group.label}</p>}
            {group.items.map((item) => {
              const isActive = active === item.tab;
              const on = status[item.tab];
              return (
                <Link
                  key={item.tab}
                  href={studioHref(item.tab)}
                  scroll={false}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm transition-colors",
                    isActive ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <item.icon className={cn("size-4", isActive && "text-primary")} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && on === undefined && (
                    <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">{item.badge}</span>
                  )}
                  {on !== undefined && (
                    <span
                      className={cn("size-1.5 rounded-full", on ? "bg-emerald-500" : "bg-muted-foreground/30")}
                      aria-label={on ? "مفعّل" : "متوقف"}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </>
  );
}

/** Header at the top of every studio panel. */
export function PanelHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
