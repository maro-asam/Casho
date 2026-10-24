import {
  BalanceTransactionType,
  OrderStatus,
  ServiceRequestStatus,
  SupportRequestStatus,
  TopupMethod,
  TopupRequestStatus,
  UserRole,
} from "@prisma/client";
import type { PillTone } from "@/components/saas-page";

// Admin-wide formatting + status vocabularies. Every admin page reads labels and
// tones from here so a status looks the same in tabs, pills and menus.

export { SUBSCRIPTION_META } from "@/lib/sales/format";

const TZ = "Africa/Cairo";
const moneyFmt = new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 });
const moneyExactFmt = new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 2 });
const compactFmt = new Intl.NumberFormat("ar-EG", { notation: "compact", maximumFractionDigits: 1 });
const numFmt = new Intl.NumberFormat("ar-EG");
const dateFmt = new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeZone: TZ });
const dateTimeFmt = new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short", timeZone: TZ });
const relFmt = new Intl.RelativeTimeFormat("ar-EG", { numeric: "auto" });

/** Piasters → "١٬٢٣٤ ج.م." (whole pounds unless there are piasters). */
export function fmtMoney(piasters: number) {
  return (piasters % 100 === 0 ? moneyFmt : moneyExactFmt).format(piasters / 100);
}
/** Piasters → compact pounds for chart axes ("١٫٢ ألف"). */
export const fmtMoneyCompact = (piasters: number) => compactFmt.format(piasters / 100);
export const fmtNum = (n: number) => numFmt.format(n);
export const fmtDate = (d: Date | null | undefined) => (d ? dateFmt.format(d) : "—");
export const fmtDateTime = (d: Date | null | undefined) => (d ? dateTimeFmt.format(d) : "—");

/** "منذ ٣ ساعات" / "بعد يومين". */
export function fmtRelative(d: Date | null | undefined, now = new Date()) {
  if (!d) return "—";
  const diffSec = Math.round((d.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return relFmt.format(diffSec, "second");
  if (abs < 3600) return relFmt.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return relFmt.format(Math.round(diffSec / 3600), "hour");
  if (abs < 86400 * 30) return relFmt.format(Math.round(diffSec / 86400), "day");
  return fmtDate(d);
}

type Meta = { label: string; tone: PillTone };

export const TOPUP_STATUS_META: Record<TopupRequestStatus, Meta> = {
  PENDING: { label: "مستني مراجعة", tone: "warning" },
  APPROVED: { label: "اتعتمد", tone: "success" },
  REJECTED: { label: "اترفض", tone: "danger" },
};

export const TOPUP_METHOD_LABELS: Record<TopupMethod, string> = {
  VODAFONE_CASH: "فودافون كاش",
  INSTAPAY: "إنستا باي",
  BANK_TRANSFER: "تحويل بنكي",
  KASHIER: "Kashier",
  PAYMOB: "Paymob",
};

export const SERVICE_STATUS_META: Record<ServiceRequestStatus, Meta> = {
  PENDING: { label: "جديد", tone: "warning" },
  CONTACTED: { label: "تم التواصل", tone: "info" },
  IN_PROGRESS: { label: "جاري التنفيذ", tone: "accent" },
  COMPLETED: { label: "مكتمل", tone: "success" },
  CANCELED: { label: "ملغي", tone: "neutral" },
};

export const SUPPORT_STATUS_META: Record<SupportRequestStatus, Meta> = {
  PENDING: { label: "جديد", tone: "warning" },
  OPENED: { label: "قيد المتابعة", tone: "info" },
  RESOLVED: { label: "اتحل", tone: "success" },
  CLOSED: { label: "مقفول", tone: "neutral" },
};

export const ORDER_STATUS_META: Record<OrderStatus, Meta> = {
  PENDING: { label: "قيد المراجعة", tone: "warning" },
  PAID: { label: "مدفوع", tone: "info" },
  SHIPPED: { label: "اتشحن", tone: "accent" },
  DELIVERED: { label: "اتسلّم", tone: "success" },
  CANCELED: { label: "ملغي", tone: "neutral" },
};

export const TX_TYPE_META: Record<BalanceTransactionType, Meta> = {
  TOPUP: { label: "شحن رصيد", tone: "success" },
  SUBSCRIPTION_CHARGE: { label: "خصم اشتراك", tone: "info" },
  BONUS: { label: "بونص", tone: "accent" },
  MANUAL_ADJUSTMENT: { label: "تعديل يدوي", tone: "warning" },
  REFUND: { label: "استرجاع", tone: "danger" },
  REFERRAL_REWARD: { label: "مكافأة إحالة", tone: "accent" },
};

export const ROLE_META: Record<UserRole, Meta> = {
  USER: { label: "تاجر", tone: "neutral" },
  ADMIN: { label: "أدمن", tone: "info" },
  SUPER_ADMIN: { label: "سوبر أدمن", tone: "accent" },
  SALES: { label: "مندوب مبيعات", tone: "success" },
};

export const SECURITY_EVENT_META: Record<string, Meta> = {
  LOGIN_SUCCESS: { label: "دخول ناجح", tone: "success" },
  LOGIN_FAILURE: { label: "محاولة دخول فاشلة", tone: "danger" },
  LOGOUT: { label: "تسجيل خروج", tone: "neutral" },
  PASSWORD_CHANGED: { label: "تغيير كلمة المرور", tone: "info" },
  PASSWORD_RESET_REQUESTED: { label: "طلب استعادة كلمة المرور", tone: "warning" },
  ACCOUNT_LOCKED: { label: "قفل الحساب", tone: "danger" },
  SESSION_REVOKED: { label: "إنهاء جلسة", tone: "warning" },
  LOGIN_BLOCKED: { label: "دخول محظور", tone: "danger" },
  PASSWORD_RESET_COMPLETED: { label: "استعادة كلمة المرور", tone: "info" },
  ALL_SESSIONS_REVOKED: { label: "إنهاء كل الجلسات", tone: "warning" },
  ROLE_CHANGED: { label: "تغيير الصلاحية", tone: "accent" },
  ACCOUNT_DELETED: { label: "حذف حساب", tone: "danger" },
  STORE_DELETED: { label: "حذف متجر", tone: "danger" },
  BRANCH_CREATED: { label: "إنشاء فرع", tone: "neutral" },
  BRANCH_ACTIVATED: { label: "تفعيل فرع", tone: "neutral" },
  BRANCH_DEACTIVATED: { label: "تعطيل فرع", tone: "neutral" },
  BRANCH_DELETED: { label: "حذف فرع", tone: "neutral" },
  MEMBER_BRANCHES_CHANGED: { label: "تعديل فروع عضو", tone: "neutral" },
};

export function securityEventMeta(event: string): Meta {
  return SECURITY_EVENT_META[event] ?? { label: event, tone: "neutral" };
}

/** Enum guard for URL params: `pickEnum(OrderStatus, raw)`. */
export function pickEnum<T extends string>(values: Record<string, T>, raw: string | undefined): T | undefined {
  return raw && (Object.values(values) as string[]).includes(raw) ? (raw as T) : undefined;
}

/** Short, readable device name from a user-agent. */
export function deviceLabel(ua: string | null | undefined) {
  if (!ua) return "جهاز غير معروف";
  const os = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "";
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "";
  return [browser, os].filter(Boolean).join(" · ") || "متصفح";
}
