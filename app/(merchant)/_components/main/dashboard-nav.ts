import {
  BanknoteArrowUp,
  BookOpen,
  Camera,
  ChartNoAxesCombined,
  CirclePercent,
  Code2,
  CreditCard,
  Gift,
  Globe,
  Headset,
  ImageIcon,
  Layers,
  LayoutDashboard,
  MonitorCheck,
  Package,
  PaintRoller,
  QrCode,
  Rocket,
  Send,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Star,
  Tag,
  Timer,
  Truck,
  Users,
  Warehouse,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavLeaf = {
  name: string;
  href: string;
  icon?: LucideIcon;
  badge?: string;
};

export type NavItem = NavLeaf & {
  icon: LucideIcon;
  /** Sub-pages shown when the item is expanded. */
  children?: NavLeaf[];
};

export type NavSection = {
  /** Omitted for the top, most-used group. */
  title?: string;
  items: NavItem[];
};

// Single source for the sidebar, the topbar title and the ⌘K search.
// Hrefs are the clean app-subdomain paths; middleware maps them to /dashboard/*.
export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { name: "نظرة عامة", href: "/", icon: LayoutDashboard },
      { name: "الطلبات", href: "/orders", icon: ShoppingCart },
      { name: "المنتجات", href: "/products", icon: Package },
      { name: "نقطة البيع (POS)", href: "/pos", icon: MonitorCheck },
      { name: "التقارير", href: "/reports", icon: ChartNoAxesCombined },
    ],
  },
  {
    title: "المتجر",
    items: [
      { name: "التصنيفات", href: "/categories", icon: Tag },
      { name: "البانرات", href: "/banners", icon: ImageIcon },
      { name: "تخصيص المتجر", href: "/customization", icon: PaintRoller },
      { name: "المراجعات", href: "/reviews", icon: Star },
      { name: "المدونة", href: "/blog", icon: BookOpen },
      { name: "دومين مخصص", href: "/domain", icon: Globe },
    ],
  },
  {
    title: "التسويق",
    items: [
      { name: "أكواد الخصم", href: "/coupons", icon: CirclePercent },
      { name: "الكارتات المتروكة", href: "/abandoned-carts", icon: Timer },
      { name: "نظام النقاط", href: "/loyalty", icon: Gift },
      { name: "الظهور في جوجل", href: "/seo", icon: Rocket },
      { name: "QR Code المتجر", href: "/qr-code", icon: QrCode },
    ],
  },
  {
    title: "العمليات",
    items: [
      {
        name: "العملاء",
        href: "/crm",
        icon: Users,
        children: [
          { name: "لوحة CRM", href: "/crm" },
          { name: "كل العملاء", href: "/crm/customers" },
          { name: "الشرائح", href: "/crm/segments" },
          { name: "العلامات", href: "/crm/tags" },
          { name: "التحليلات", href: "/crm/analytics" },
        ],
      },
      {
        name: "المخزون",
        href: "/inventory",
        icon: Warehouse,
        children: [
          { name: "إدارة المخزون", href: "/inventory" },
          { name: "حركات المخزون", href: "/inventory/movements" },
          { name: "الموردون", href: "/inventory/suppliers" },
          { name: "طلبات الشراء", href: "/inventory/purchase-orders" },
          { name: "تحويلات الفروع", href: "/inventory/transfers" },
        ],
      },
      { name: "طرق الشحن", href: "/shipping", icon: Truck },
    ],
  },
  {
    title: "القنوات والربط",
    items: [
      { name: "طلبات انستجرام", href: "/suggested-orders", icon: Send, badge: "AI" },
      { name: "ربط انستجرام", href: "/integrations/instagram", icon: Camera },
      { name: "ربط تيليجرام", href: "/telegram", icon: Send },
      { name: "استيراد من Shopify", href: "/integrations/shopify", icon: ShoppingBag },
      { name: "مفاتيح API", href: "/api-keys", icon: Code2 },
    ],
  },
  {
    title: "الحساب",
    items: [
      { name: "الرصيد", href: "/balance", icon: Wallet },
      { name: "الخطة والاشتراك", href: "/change-plan", icon: BanknoteArrowUp },
      { name: "بوابات الدفع", href: "/payment-methods", icon: CreditCard },
      { name: "خدمات إضافية", href: "/services", icon: Layers },
      { name: "نظام المكافآت", href: "/referral", icon: Gift },
    ],
  },
];

/** Pinned to the bottom of the sidebar. */
export const NAV_FOOTER: NavItem[] = [
  { name: "مركز المساعدة", href: "/support", icon: Headset },
  { name: "الإعدادات", href: "/settings", icon: Settings },
];

/** `/dashboard/orders/123` and `/orders/123` both become `/orders/123`. */
export function normalizePath(pathname: string) {
  const stripped = pathname.replace(/^\/dashboard(?=\/|$)/, "");
  return stripped === "" ? "/" : stripped;
}

function matches(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export type ActiveNav = { item: NavItem; child?: NavLeaf };

/** The single most specific nav entry for the current path (longest match wins). */
export function findActiveNav(rawPathname: string): ActiveNav | null {
  const pathname = normalizePath(rawPathname);
  let best: (ActiveNav & { length: number }) | null = null;

  for (const item of [...NAV_SECTIONS.flatMap((s) => s.items), ...NAV_FOOTER]) {
    const candidates: ActiveNav[] = item.children
      ? item.children.map((child) => ({ item, child }))
      : [{ item }];

    for (const candidate of candidates) {
      const href = candidate.child?.href ?? candidate.item.href;
      if (matches(pathname, href) && (!best || href.length > best.length)) {
        best = { ...candidate, length: href.length };
      }
    }
  }

  return best ? { item: best.item, child: best.child } : null;
}
