// The dashboard's Apps section: everything a merchant can add to their store.
// "builtin" apps are always there (their state lives on the store — the active
// theme, the font); "installable" apps get a StoreApp row when installed;
// "tool"s are Casho features that open their own page (they used to sit in the
// sidebar). Every app has its own page. The sidebar's Apps item lists the same
// pages as `related` (dashboard-nav.ts) — keep the two in step.

export type AppId =
  | "themes"
  | "fonts"
  | "confirm-it"
  | "image-compressor"
  | "qr-code"
  | "instagram"
  | "telegram"
  | "shopify-import"
  | "api-keys";

export type AppCategory = "design" | "orders" | "channels" | "tools";

export type AppDefinition = {
  id: AppId;
  name: string;
  /** One line for the app card. */
  tagline: string;
  category: AppCategory;
  kind: "builtin" | "installable" | "tool";
  /** Who makes it — shown on the app page. */
  developer: string;
  /** Clean app-subdomain path (middleware maps it to /dashboard/*). */
  href: string;
  website?: string;
};

export const APPS: AppDefinition[] = [
  {
    id: "themes",
    name: "الثيمات",
    tagline: "اختار شكل متجرك من ثيمات جاهزة ومتصممة للموبايل",
    category: "design",
    kind: "builtin",
    developer: "Casho",
    href: "/apps/themes",
  },
  {
    id: "fonts",
    name: "الخطوط",
    tagline: "خطوط عربي وإنجليزي من Google Fonts لكل كلام المتجر",
    category: "design",
    kind: "builtin",
    developer: "Casho",
    href: "/apps/fonts",
  },
  {
    id: "confirm-it",
    name: "Confirm It",
    tagline: "تأكيد طلبات الدفع عند الاستلام تلقائياً على واتساب ومكالمة لو العميل مردّش",
    category: "orders",
    kind: "installable",
    developer: "Confirm It",
    href: "/apps/confirm-it",
    website: "https://www.confirmit-eg.com",
  },
  {
    id: "image-compressor",
    name: "ضغط الصور",
    tagline: "صغّر حجم صور المنتجات من غير ما تبوظ جودتها عشان المتجر يفتح أسرع",
    category: "design",
    kind: "tool",
    developer: "Casho",
    href: "/image-compressor",
  },
  {
    id: "instagram",
    name: "انستجرام",
    tagline: "اكتشاف الطلبات من رسائل DM تلقائياً بالذكاء الاصطناعي",
    category: "channels",
    kind: "tool",
    developer: "Casho",
    href: "/instagram",
  },
  {
    id: "telegram",
    name: "ربط تيليجرام",
    tagline: "إشعار فوري على تيليجرام بكل طلب جديد",
    category: "channels",
    kind: "tool",
    developer: "Casho",
    href: "/telegram",
  },
  {
    id: "qr-code",
    name: "QR Code المتجر",
    tagline: "كود تطبعه على الأكياس والفلايرز يفتح متجرك على طول",
    category: "tools",
    kind: "tool",
    developer: "Casho",
    href: "/qr-code",
  },
  {
    id: "shopify-import",
    name: "استيراد من Shopify",
    tagline: "انقل منتجاتك وعملاءك وطلباتك من Shopify لـ Casho",
    category: "tools",
    kind: "tool",
    developer: "Casho",
    href: "/integrations/shopify",
  },
  {
    id: "api-keys",
    name: "مفاتيح API",
    tagline: "اربط متجرك بأنظمتك الخاصة عن طريق API و Webhooks",
    category: "tools",
    kind: "tool",
    developer: "Casho",
    href: "/api-keys",
  },
];

export const APP_CATEGORY_LABELS: Record<AppCategory, string> = {
  design: "التصميم",
  orders: "الطلبات",
  channels: "القنوات والإشعارات",
  tools: "أدوات",
};

export function getApp(id: string): AppDefinition | undefined {
  return APPS.find((app) => app.id === id);
}
