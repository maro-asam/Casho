import { tr } from "@/lib/i18n/dashboard";
/**
 * Carrier registry — the single source of truth for every shipping company a
 * merchant can connect. Adding a carrier = one entry here (plus a provider
 * adapter in ./providers and a case in ./factory if it has an API).
 *
 * `integration`:
 *  - "api"    → Casho creates the waybill and syncs tracking through the carrier's API.
 *  - "manual" → the merchant books the shipment with the carrier, then records the
 *               tracking number here; Casho tracks status, COD and the customer link.
 *
 * `trackingUrl` is only set where the public deep-link format is known; merchants
 * can set (or override) it per store via CarrierSettings.trackingUrlTemplate.
 */

export const CARRIER_KEYS = [
  "BOSTA",
  "ARAMEX",
  "MYLERZ",
  "JT_EXPRESS",
  "SHIPBLU",
  "R2S",
  "SMSA",
  "EGYPT_POST",
  "DHL",
  "FEDEX",
  "UPS",
  "FLEXTOCK",
  "KHAZENLY",
  "OWN_COURIER",
] as const;

export type CarrierKey = (typeof CARRIER_KEYS)[number];

export type CarrierCategory = "local" | "international" | "fulfillment" | "own";

export type CredentialField = {
  key: string;
  label: string;
  type: "text" | "password";
  placeholder?: string;
  help?: string;
  required: boolean;
  /** Shown masked as the "connected" hint. */
  hint?: boolean;
};

export type Carrier = {
  key: CarrierKey;
  /** Brand name as written by the company. */
  name: string;
  nameAr: string;
  tagline: string;
  category: CarrierCategory;
  integration: "api" | "manual";
  /** Monogram tile — Casho never ships carrier logos. */
  mark: { text: string; bg: string; fg: string };
  website?: string;
  /** Public tracking page; `{tracking}` is replaced with the tracking number. */
  trackingUrl?: string;
  features: {
    cod: boolean;
    international: boolean;
    fulfillment: boolean;
  };
  credentialFields?: CredentialField[];
};

export const CARRIERS: Carrier[] = [
  {
    key: "BOSTA",
    name: "Bosta",
    get nameAr() { return tr("بوسطة"); },
    get tagline() { return tr("توصيل محلي لكل المحافظات مع تحصيل عند الاستلام وتتبع لحظي من جوه كاشو."); },
    category: "local",
    integration: "api",
    mark: { text: "B", bg: "#E30613", fg: "#FFFFFF" },
    website: "https://bosta.co",
    features: { cod: true, international: false, fulfillment: false },
    credentialFields: [
      {
        key: "apiKey",
        label: "API Key",
        type: "password",
        get placeholder() { return tr("الصق مفتاح Bosta"); },
        get help() { return tr("من حسابك على Bosta: الإعدادات ← API Integration"); },
        required: true,
        hint: true,
      },
    ],
  },
  {
    key: "ARAMEX",
    name: "Aramex",
    get nameAr() { return tr("أرامكس"); },
    get tagline() { return tr("شحن محلي ودولي، بوليصة تلقائية وتتبع من جوه كاشو."); },
    category: "international",
    integration: "api",
    mark: { text: "A", bg: "#DC291E", fg: "#FFFFFF" },
    website: "https://www.aramex.com",
    trackingUrl: "https://www.aramex.com/track/results?ShipmentNumber={tracking}",
    features: { cod: true, international: true, fulfillment: false },
    credentialFields: [
      { key: "username", get label() { return tr("اسم المستخدم"); }, type: "text", placeholder: "email@example.com", required: true },
      { key: "password", get label() { return tr("كلمة المرور"); }, type: "password", required: true },
      { key: "accountNumber", get label() { return tr("رقم الحساب"); }, type: "text", get placeholder() { return tr("مثال: 20016"); }, required: true, hint: true },
      { key: "accountPin", get label() { return tr("PIN الحساب"); }, type: "password", required: true },
      { key: "accountEntity", get label() { return tr("كيان الحساب"); }, type: "text", placeholder: "CAI", required: true },
      { key: "accountCountryCode", get label() { return tr("كود الدولة"); }, type: "text", placeholder: "EG", required: false },
    ],
  },
  {
    key: "MYLERZ",
    name: "Mylerz",
    get nameAr() { return tr("مايلرز"); },
    get tagline() { return tr("توصيل للتجارة الإلكترونية في مصر مع تحصيل عند الاستلام."); },
    category: "local",
    integration: "manual",
    mark: { text: "My", bg: "#1B2A4A", fg: "#FFFFFF" },
    features: { cod: true, international: false, fulfillment: false },
  },
  {
    key: "JT_EXPRESS",
    name: "J&T Express",
    get nameAr() { return tr("جي آند تي إكسبريس"); },
    get tagline() { return tr("شبكة توصيل واسعة داخل مصر للطرود الصغيرة والمتوسطة."); },
    category: "local",
    integration: "manual",
    mark: { text: "J&T", bg: "#D71920", fg: "#FFFFFF" },
    features: { cod: true, international: false, fulfillment: false },
  },
  {
    key: "SHIPBLU",
    name: "ShipBlu",
    get nameAr() { return tr("شيب بلو"); },
    get tagline() { return tr("تخزين وتجهيز وتوصيل للمتاجر الأونلاين في مصر."); },
    category: "fulfillment",
    integration: "manual",
    mark: { text: "SB", bg: "#1E5EFF", fg: "#FFFFFF" },
    website: "https://shipblu.com",
    features: { cod: true, international: false, fulfillment: true },
  },
  {
    key: "R2S",
    name: "R2S",
    get nameAr() { return tr("آر تو إس"); },
    get tagline() { return tr("توصيل محلي بأسعار تنافسية للمتاجر."); },
    category: "local",
    integration: "manual",
    mark: { text: "R2S", bg: "#0F766E", fg: "#FFFFFF" },
    features: { cod: true, international: false, fulfillment: false },
  },
  {
    key: "SMSA",
    name: "SMSA Express",
    get nameAr() { return tr("سمسا إكسبريس"); },
    get tagline() { return tr("شحن سريع داخل مصر ولدول الخليج."); },
    category: "international",
    integration: "manual",
    mark: { text: "S", bg: "#4B2C83", fg: "#FFFFFF" },
    website: "https://www.smsaexpress.com",
    features: { cod: true, international: true, fulfillment: false },
  },
  {
    key: "EGYPT_POST",
    name: "Egypt Post",
    get nameAr() { return tr("البريد المصري"); },
    get tagline() { return tr("أوسع تغطية في مصر، حتى القرى والمناطق البعيدة."); },
    category: "local",
    integration: "manual",
    mark: { text: "بريد", bg: "#0B3B8C", fg: "#FFD200" },
    features: { cod: true, international: true, fulfillment: false },
  },
  {
    key: "DHL",
    name: "DHL Express",
    get nameAr() { return tr("دي إتش إل"); },
    get tagline() { return tr("شحن دولي سريع لأكتر من ٢٢٠ دولة."); },
    category: "international",
    integration: "manual",
    mark: { text: "DHL", bg: "#FFCC00", fg: "#D40511" },
    website: "https://www.dhl.com/eg-en",
    trackingUrl: "https://www.dhl.com/eg-en/home/tracking.html?tracking-id={tracking}&submit=1",
    features: { cod: false, international: true, fulfillment: false },
  },
  {
    key: "FEDEX",
    name: "FedEx",
    get nameAr() { return tr("فيديكس"); },
    get tagline() { return tr("شحن دولي للطرود والمستندات."); },
    category: "international",
    integration: "manual",
    mark: { text: "Fx", bg: "#4D148C", fg: "#FF6200" },
    website: "https://www.fedex.com",
    trackingUrl: "https://www.fedex.com/fedextrack/?trknbr={tracking}",
    features: { cod: false, international: true, fulfillment: false },
  },
  {
    key: "UPS",
    name: "UPS",
    get nameAr() { return tr("يو بي إس"); },
    get tagline() { return tr("شحن دولي وتتبع مفصّل للطرود."); },
    category: "international",
    integration: "manual",
    mark: { text: "UPS", bg: "#351C15", fg: "#FFB500" },
    website: "https://www.ups.com",
    trackingUrl: "https://www.ups.com/track?tracknum={tracking}",
    features: { cod: false, international: true, fulfillment: false },
  },
  {
    key: "FLEXTOCK",
    name: "Flextock",
    get nameAr() { return tr("فلكستوك"); },
    get tagline() { return tr("مخازن وتجهيز طلبات وتوصيل — سيب المخزون عندهم وهم يشحنوا."); },
    category: "fulfillment",
    integration: "manual",
    mark: { text: "Fl", bg: "#111827", fg: "#34D399" },
    features: { cod: true, international: false, fulfillment: true },
  },
  {
    key: "KHAZENLY",
    name: "Khazenly",
    get nameAr() { return tr("خزنلي"); },
    get tagline() { return tr("تخزين وتغليف وتوصيل للمتاجر الأونلاين."); },
    category: "fulfillment",
    integration: "manual",
    mark: { text: "خ", bg: "#F59E0B", fg: "#1F2937" },
    features: { cod: true, international: false, fulfillment: true },
  },
  {
    key: "OWN_COURIER",
    name: "Own courier",
    get nameAr() { return tr("مندوب خاص"); },
    get tagline() { return tr("مندوبك أنت أو شركة شحن مش في القايمة — تابع شحناتها وتحصيلها هنا برضه."); },
    category: "own",
    integration: "manual",
    mark: { text: "م", bg: "#E5E7EB", fg: "#111827" },
    features: { cod: true, international: false, fulfillment: false },
  },
];

export const CARRIER_CATEGORY_LABELS: Record<CarrierCategory, string> = {
  get local() { return tr("توصيل محلي"); },
  get international() { return tr("محلي ودولي"); },
  get fulfillment() { return tr("تخزين وتوصيل"); },
  get own() { return tr("مندوبك"); },
};

const BY_KEY = new Map<string, Carrier>(CARRIERS.map((c) => [c.key, c]));

export function isCarrierKey(value: unknown): value is CarrierKey {
  return typeof value === "string" && BY_KEY.has(value);
}

/** Tolerates legacy lowercase keys ("bosta") written by the public API. */
export function getCarrier(key: string | null | undefined): Carrier | null {
  return key ? (BY_KEY.get(key.toUpperCase()) ?? null) : null;
}

// ─── Per-store settings (ShippingIntegration.settings) ───────────────────────

export type CarrierSettings = {
  /** Overrides the carrier's public tracking link; must contain {tracking}. */
  trackingUrlTemplate?: string;
  /** Name shown to customers — mainly for OWN_COURIER ("مندوب أحمد"). */
  displayName?: string;
  defaultWeightKg?: number;
  /** Governorate code the carrier picks orders up from. */
  pickupGovernorate?: string;
};

export function readCarrierSettings(value: unknown): CarrierSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const v = value as Record<string, unknown>;
  return {
    trackingUrlTemplate: typeof v.trackingUrlTemplate === "string" ? v.trackingUrlTemplate : undefined,
    displayName: typeof v.displayName === "string" ? v.displayName : undefined,
    defaultWeightKg: typeof v.defaultWeightKg === "number" ? v.defaultWeightKg : undefined,
    pickupGovernorate: typeof v.pickupGovernorate === "string" ? v.pickupGovernorate : undefined,
  };
}

export function isValidTrackingTemplate(template: string) {
  return /^https:\/\/[^\s]+$/.test(template) && template.includes("{tracking}");
}

/** Public tracking link for a shipment, or null when the carrier has none. */
export function buildTrackingUrl(
  carrier: Carrier | null,
  settings: CarrierSettings,
  trackingNumber: string | null | undefined,
): string | null {
  if (!trackingNumber) return null;
  const template = [settings.trackingUrlTemplate, carrier?.trackingUrl].find(
    (t): t is string => !!t && isValidTrackingTemplate(t),
  );
  if (!template) return null;
  return template.replaceAll("{tracking}", encodeURIComponent(trackingNumber));
}

/** What customers and the dashboard call this carrier. */
export function carrierDisplayName(carrier: Carrier | null, settings: CarrierSettings = {}, fallback = tr("شركة شحن")) {
  return settings.displayName?.trim() || carrier?.nameAr || fallback;
}
