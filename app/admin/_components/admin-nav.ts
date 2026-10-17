import {
  ArrowLeftRight,
  Bell,
  BriefcaseBusiness,
  Camera,
  FileText,
  Handshake,
  Headset,
  Layers,
  LayoutDashboard,
  ListChecks,
  ShieldAlert,
  ShoppingCart,
  TrendingUp,
  Store,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/** Live counters shown as sidebar badges (filled by the layout). */
export type AdminBadgeKey = "topups" | "services" | "support";
export type AdminBadges = Partial<Record<AdminBadgeKey, number>>;

export type AdminNavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: AdminBadgeKey;
};

export type AdminNavSection = { title?: string; items: AdminNavItem[] };

export const ADMIN_NAV: AdminNavSection[] = [
  {
    items: [{ name: "نظرة عامة", href: "/admin", icon: LayoutDashboard }],
  },
  {
    title: "العملاء",
    items: [
      { name: "المتاجر", href: "/admin/stores", icon: Store },
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
      { name: "فريق المبيعات", href: "/admin/sales", icon: Handshake },
      { name: "المدونة", href: "/admin/blog", icon: FileText },
      { name: "الإشعارات", href: "/admin/notifications", icon: Bell },
    ],
  },
  {
    title: "النظام",
    items: [{ name: "سجل الأمان", href: "/admin/security", icon: ShieldAlert }],
  },
];

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
