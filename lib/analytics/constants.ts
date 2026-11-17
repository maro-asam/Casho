/**
 * Shared constants of the Analytics Center — safe to import from the browser
 * SDK, the collector and the admin pages alike (no server-only imports).
 */

/** Collector endpoint, same origin as the page (storefront subdomains and custom domains included). */
export const COLLECT_PATH = "/api/e";

/** Payload version the collector accepts. */
export const PAYLOAD_VERSION = 1;

/** Short scope codes used on the wire. */
export const SCOPE_CODES = { m: "MARKETING", a: "APP", s: "STOREFRONT" } as const;
export type ScopeCode = keyof typeof SCOPE_CODES;
export type AnalyticsScopeName = (typeof SCOPE_CODES)[ScopeCode];

/** First-party cookies. `_ca` spans casho.store + app.casho.store; storefront cookies are per host and per store. */
export const COOKIE_MAIN = "_ca";
export const COOKIE_STORE_PREFIX = "_cs_";
/** Consent decision: "1" accepted, "0" declined. */
export const COOKIE_CONSENT_MAIN = "_ca_ok";
export const COOKIE_CONSENT_STORE_PREFIX = "_cs_ok_";
/** Set in the browser of anyone who opens /admin or /sales — their traffic isn't counted. */
export const COOKIE_TEAM = "_ca_team";

/** Storefront cookie key: the store id without dashes, shortened (cookie names stay short and ASCII). */
export function storeCookieKey(storeId: string) {
  return storeId.replace(/[^A-Za-z0-9]/g, "").slice(0, 12);
}

/** Random ids made by the browser: 16–40 url-safe characters. */
export const ID_PATTERN = /^[A-Za-z0-9_-]{16,40}$/;
/** Event names: lowercase snake_case, starting with a letter. */
export const EVENT_NAME_PATTERN = /^[a-z][a-z0-9_]{1,39}$/;
export const PROP_KEY_PATTERN = /^[a-z][a-z0-9_]{0,31}$/;

export const LIMITS = {
  /** Request body, bytes. */
  maxBody: 64 * 1024,
  /** Items per batch. */
  maxEventsPerBatch: 50,
  /** Events kept per session — anything past this is dropped (runaway pages, abuse). */
  maxEventsPerSession: 1500,
  maxPageviewsPerSession: 300,
  maxProps: 12,
  maxPropString: 120,
  maxPath: 300,
  maxQuery: 300,
  maxTitle: 120,
  maxSelector: 300,
  maxLabel: 60,
  /** Events older than this (clock skew, stale queues) are dropped. */
  maxEventAgeMs: 24 * 60 * 60 * 1000,
} as const;

/** A session is "engaged" with ≥ 2 page views, ≥ 10 s engaged time, or a conversion (GA4's definition). */
export const ENGAGED_MS = 10_000;
export const ENGAGED_PAGEVIEWS = 2;

/** Viewport width → heatmap layout bucket. */
export function viewportBucket(width: number): "desktop" | "tablet" | "mobile" {
  if (width >= 1024) return "desktop";
  if (width >= 768) return "tablet";
  return "mobile";
}

/** Width the heatmap viewer renders each bucket at. */
export const BUCKET_WIDTH = { desktop: 1366, tablet: 820, mobile: 390 } as const;
export type DeviceBucket = keyof typeof BUCKET_WIDTH;

/** Events the platform emits itself — the Event Explorer labels these. Custom names are allowed too. */
export const KNOWN_EVENTS = {
  page_view: "مشاهدة صفحة",
  session_start: "بداية زيارة",
  click: "نقرة",
  cta_clicked: "نقرة على زر دعوة (CTA)",
  form_started: "بدأ يملأ فورم",
  form_submitted: "أرسل فورم",
  js_error: "خطأ JavaScript",
  resource_error: "ملف ما اتحملش",
  request_failed: "طلب شبكة فشل",
  web_vital: "مؤشر أداء (Web Vital)",
  signup_completed: "تسجيل حساب (مؤكد)",
  store_created: "إنشاء متجر (مؤكد)",
  login: "تسجيل دخول (مؤكد)",
  subscription_selected: "اختيار باقة (مؤكد)",
  payment_initiated: "بدء دفع (مؤكد)",
  add_to_cart: "إضافة للسلة",
  checkout_started: "فتح صفحة الدفع في المتجر",
  order_placed: "طلب في المتجر (مؤكد)",
} as const;

/** Events recorded by the server after the database write succeeded — never from the browser. */
export const SERVER_ONLY_EVENTS = new Set([
  "signup_completed",
  "store_created",
  "login",
  "subscription_selected",
  "payment_initiated",
  "order_placed",
  "session_start",
  "page_view",
]);

/** Countries where the REGION consent mode asks first (EU/EEA + UK + CH). */
export const CONSENT_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU",
  "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "IS", "LI", "NO", "GB", "CH",
]);

/** Query parameters never recorded, whatever the settings say (secrets, contact details, payment callbacks). */
export const BUILTIN_EXCLUDED_PARAMS = [
  "token", "access_token", "code", "state", "key", "secret", "password", "pass", "pwd", "email", "phone", "mobile",
  "hmac", "signature", "sig", "session", "sessionid", "auth", "otp", "id_token", "invite", "reset", "order",
  "fbclid", "gclid", "gbraid", "wbraid", "msclkid", "ttclid", "twclid", "li_fat_id", "_ga", "_gl",
];

/** Paths on the app host that are never collected (internal tools). */
export const INTERNAL_PATH_PREFIXES = ["/admin", "/sales", "/print"];

/** Auth pages on the app host count as Casho's acquisition (marketing) scope. */
export const AUTH_PATH_PREFIXES = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];

export function hasPathPrefix(path: string, prefixes: readonly string[]) {
  return prefixes.some((p) => path === p || path.startsWith(p.endsWith("/") ? p : `${p}/`));
}
