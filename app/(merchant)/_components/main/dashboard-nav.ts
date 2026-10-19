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
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Star,
  Tag,
  Target,
  TrendingUp,
  Timer,
  Truck,
  Users,
  Warehouse,
  Wallet,
  ShoppingCartIcon,
  type LucideIcon,
} from "lucide-react";
import { tr } from "@/lib/i18n/dashboard";

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
      { get name() { return tr("نظرة عامة"); }, href: "/", icon: LayoutDashboard },
      { get name() { return tr("الطلبات"); }, href: "/orders", icon: ShoppingCart },
      { get name() { return tr("المنتجات"); }, href: "/products", icon: Package },
      { get name() { return tr("نقطة البيع (POS)"); }, href: "/pos", icon: MonitorCheck },
      { get name() { return tr("التقارير"); }, href: "/reports", icon: ChartNoAxesCombined },
    ],
  },
  {
    get title() { return tr("المتجر"); },
    items: [
      { get name() { return tr("التصنيفات"); }, href: "/categories", icon: Tag },
      { get name() { return tr("البانرات"); }, href: "/banners", icon: ImageIcon },
      { get name() { return tr("تخصيص المتجر"); }, href: "/customization", icon: PaintRoller },
      { get name() { return tr("المراجعات"); }, href: "/reviews", icon: Star },
      { get name() { return tr("المدونة"); }, href: "/blog", icon: BookOpen },
      { get name() { return tr("دومين مخصص"); }, href: "/domain", icon: Globe },
    ],
  },
  {
    get title() { return tr("التسويق"); },
    items: [
      { get name() { return tr("أكواد الخصم"); }, href: "/coupons", icon: CirclePercent },
      { get name() { return tr("Upsell و Cross-sell"); }, href: "/offers", icon: TrendingUp },
      { get name() { return tr("نظام النقاط"); }, href: "/loyalty", icon: Gift },
      { get name() { return tr("الظهور في جوجل"); }, href: "/seo", icon: Rocket },
      { get name() { return tr("عربات التسوق المهجورة"); }, href: "/abandoned-carts", icon: ShoppingCartIcon },
      { get name() { return tr("البيكسل وتتبع الإعلانات"); }, href: "/pixels", icon: Target },
      { get name() { return tr("QR Code المتجر"); }, href: "/qr-code", icon: QrCode },
    ],
  },
  {
    get title() { return tr("العمليات"); },
    items: [
      {
        get name() { return tr("العملاء"); },
        href: "/crm",
        icon: Users,
        children: [
          { get name() { return tr("لوحة CRM"); }, href: "/crm" },
          { get name() { return tr("كل العملاء"); }, href: "/crm/customers" },
          { get name() { return tr("الشرائح"); }, href: "/crm/segments" },
          { get name() { return tr("العلامات"); }, href: "/crm/tags" },
          { get name() { return tr("التحليلات"); }, href: "/crm/analytics" },
        ],
      },
      {
        get name() { return tr("المخزون"); },
        href: "/inventory",
        icon: Warehouse,
        children: [
          { get name() { return tr("إدارة المخزون"); }, href: "/inventory" },
          { get name() { return tr("حركات المخزون"); }, href: "/inventory/movements" },
          { get name() { return tr("الموردون"); }, href: "/inventory/suppliers" },
          { get name() { return tr("طلبات الشراء"); }, href: "/inventory/purchase-orders" },
          { get name() { return tr("تحويلات الفروع"); }, href: "/inventory/transfers" },
        ],
      },
      {
        get name() { return tr("الشحن"); },
        href: "/shipping",
        icon: Truck,
        children: [
          { get name() { return tr("الشحنات"); }, href: "/shipping/shipments" },
          { get name() { return tr("شركات الشحن"); }, href: "/shipping/integrations" },
          { get name() { return tr("طرق وأسعار الشحن"); }, href: "/shipping" },
        ],
      },
      { get name() { return tr("الحماية من الوهمي"); }, href: "/fraud", icon: ShieldCheck },
    ],
  },
  {
    get title() { return tr("القنوات والربط"); },
    items: [
      { get name() { return tr("طلبات انستجرام"); }, href: "/suggested-orders", icon: Send, badge: "AI" },
      { get name() { return tr("ربط انستجرام"); }, href: "/integrations/instagram", icon: Camera },
      { get name() { return tr("ربط تيليجرام"); }, href: "/telegram", icon: Send },
      { get name() { return tr("استيراد من Shopify"); }, href: "/integrations/shopify", icon: ShoppingBag },
      { get name() { return tr("مفاتيح API"); }, href: "/api-keys", icon: Code2 },
    ],
  },
  {
    get title() { return tr("الحساب"); },
    items: [
      { get name() { return tr("الرصيد"); }, href: "/balance", icon: Wallet },
      { get name() { return tr("الخطة والاشتراك"); }, href: "/change-plan", icon: BanknoteArrowUp },
      { get name() { return tr("بوابات الدفع"); }, href: "/payment-methods", icon: CreditCard },
      { get name() { return tr("خدمات إضافية"); }, href: "/services", icon: Layers },
      { get name() { return tr("نظام المكافآت"); }, href: "/referral", icon: Gift },
    ],
  },
];

/** Pinned to the bottom of the sidebar. */
export const NAV_FOOTER: NavItem[] = [
  { get name() { return tr("مركز المساعدة"); }, href: "/support", icon: Headset },
  { get name() { return tr("الإعدادات"); }, href: "/settings", icon: Settings },
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
