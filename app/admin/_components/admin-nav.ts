import {
  Activity,
  ArrowLeftRight,
  Bell,
  BriefcaseBusiness,
  Camera,
  FileText,
  Globe,
  Handshake,
  Headset,
  Layers,
  LayoutDashboard,
  LayoutTemplate,
  ListChecks,
  ShieldAlert,
  Target,
  ShoppingCart,
  Telescope,
  TrendingUp,
  Store,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/** Live counters shown as sidebar badges (filled by the layout). */
export type AdminBadgeKey = "stores" | "topups" | "services" | "support" | "sharks" | "sales" | "leads";
export type AdminBadges = Partial<Record<AdminBadgeKey, number>>;

export type AdminNavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: AdminBadgeKey;
  /** "news" counts something to look at, not work waiting on an admin (those stay red). */
  badgeTone?: "news";
  /** Only these roles see it (the page itself enforces the same rule — lib/leads/access.ts). */
  roles?: readonly string[];
};

export type AdminNavSection = { title?: string; items: AdminNavItem[] };

export const ADMIN_NAV: AdminNavSection[] = [
  {
    items: [
      { name: "نظرة عامة", href: "/admin", icon: LayoutDashboard },
      { name: "مركز التحليلات", href: "/admin/analytics", icon: Activity },
    ],
  },
  {
    title: "العملاء",
    items: [
      { name: "المتاجر", href: "/admin/stores", icon: Store, badge: "stores", badgeTone: "news" },
      { name: "المستخدمين", href: "/admin/users", icon: Users },
      { name: "طلبات المتاجر", href: "/admin/orders", icon: ShoppingCart },
    ],
  },
  {
    title: "المالية",
    items: [
      { name: "الأرباح", href: "/admin/profit", icon: TrendingUp },
      { name: "طلبات الشحن", href: "/admin/topup-requests", icon: Wallet, badge: "topups" },
      { name: "الحركات المالية", href: "/admin/transactions", icon: ArrowLeftRight },
      { name: "الباقات", href: "/admin/plans", icon: Layers },
      { name: "الميزات", href: "/admin/features", icon: ListChecks },
      { name: "الدومينات", href: "/admin/domains", icon: Globe },
    ],
  },
  {
    title: "التشغيل",
    items: [
      { name: "طلبات الخدمات", href: "/admin/service-requests", icon: BriefcaseBusiness, badge: "services" },
      { name: "الدعم الفني", href: "/admin/support-requests", icon: Headset, badge: "support" },
      { name: "Instagram AI", href: "/admin/instagram", icon: Camera },
    ],
  },
  {
    title: "النمو والتواصل",
    items: [
      { name: "فريق المبيعات", href: "/admin/sales", icon: Handshake, badge: "sales" },
      { name: "الليدز", href: "/admin/leads", icon: Target, badge: "leads", roles: ["SUPER_ADMIN"] },
      { name: "Casho Sharks", href: "/admin/sharks", icon: Telescope, badge: "sharks" },
      { name: "أمثلة كاشو", href: "/admin/showcase", icon: LayoutTemplate },
      { name: "المدونة", href: "/admin/blog", icon: FileText },
      { name: "الإشعارات", href: "/admin/notifications", icon: Bell },
    ],
  },
  {
    title: "النظام",
    items: [{ name: "سجل الأمان", href: "/admin/security", icon: ShieldAlert }],
  },
];

/** A media buyer's sidebar (lib/admin/panel-roles.ts): the Analytics Center is the whole panel. */
export const ANALYTICS_ONLY_NAV: AdminNavSection[] = [{ items: ADMIN_NAV[0].items.filter((item) => item.href === "/admin/analytics") }];

/** The sidebar for a viewer: items limited to some roles are dropped for everyone else. */
export function adminNavFor(role: string | undefined, analyticsOnly: boolean): AdminNavSection[] {
  if (analyticsOnly) return ANALYTICS_ONLY_NAV;
  return ADMIN_NAV.map((s) => ({ ...s, items: s.items.filter((i) => !i.roles || (role !== undefined && i.roles.includes(role))) })).filter((s) => s.items.length > 0);
}

const ALL_ITEMS = ADMIN_NAV.flatMap((s) => s.items);

/** Longest matching nav item for a pathname ("/admin" only matches itself). */
export function findAdminNav(pathname: string): AdminNavItem | null {
  let best: AdminNavItem | null = null;
  for (const item of ALL_ITEMS) {
    const match = item.href === "/admin" ? pathname === "/admin" : pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (match && (!best || item.href.length > best.href.length)) best = item;
  }
  return best;
}
