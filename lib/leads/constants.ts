/**
 * Lead Management labels and fixed lists (pure, no I/O). The admin panel and
 * the Sales dashboard are Arabic-only, like the rest of /admin and /sales.
 */
import type {
  LeadActivityType,
  LeadBusinessSize,
  LeadDuplicateMode,
  LeadFollowUpStatus,
  LeadImportRowStatus,
  LeadImportStatus,
  LeadLinkSource,
  LeadPriority,
  LeadSource,
  LeadStatus,
} from "@prisma/client";
import type { PillTone } from "@/components/saas-page";
import { EGYPT_GOVERNORATES } from "@/constants/egypt-governorates";

type Meta = { label: string; tone: PillTone };

/** Pipeline order — the Kanban's columns, left to right in reading order. */
export const LEAD_STATUSES: LeadStatus[] = [
  "NEW",
  "ASSIGNED",
  "CONTACTED",
  "INTERESTED",
  "DEMO_SCHEDULED",
  "NEGOTIATION",
  "CONVERTED",
  "LOST",
];

/** Still being worked (not won, not lost). */
export const OPEN_STATUSES: LeadStatus[] = ["NEW", "ASSIGNED", "CONTACTED", "INTERESTED", "DEMO_SCHEDULED", "NEGOTIATION"];

export const STATUS_META: Record<LeadStatus, Meta & { hint: string }> = {
  NEW: { label: "جديد", tone: "neutral", hint: "لسه محدش استلمه" },
  ASSIGNED: { label: "متسند لمندوب", tone: "info", hint: "عند مندوب ولسه متكلمش معاه" },
  CONTACTED: { label: "اتواصلنا", tone: "info", hint: "أول تواصل حصل" },
  INTERESTED: { label: "مهتم", tone: "accent", hint: "عايز يعرف أكتر" },
  DEMO_SCHEDULED: { label: "ديمو متحدد", tone: "accent", hint: "في ميعاد عرض للمنصة" },
  NEGOTIATION: { label: "تفاوض", tone: "warning", hint: "بيتكلم في السعر والباقة" },
  CONVERTED: { label: "اتحوّل لعميل", tone: "success", hint: "فتح متجر ودفع اشتراك" },
  LOST: { label: "خسرناه", tone: "danger", hint: "مش هيكمل — بسبب" },
};

export const PRIORITIES: LeadPriority[] = ["HOT", "HIGH", "MEDIUM", "LOW"];

export const PRIORITY_META: Record<LeadPriority, Meta> = {
  HOT: { label: "ساخن", tone: "danger" },
  HIGH: { label: "عالي", tone: "warning" },
  MEDIUM: { label: "متوسط", tone: "info" },
  LOW: { label: "منخفض", tone: "neutral" },
};

export const LEAD_SOURCES: LeadSource[] = [
  "INSTAGRAM",
  "FACEBOOK",
  "TIKTOK",
  "GOOGLE_MAPS",
  "WEBSITE",
  "REFERRAL",
  "EVENT",
  "COLD_OUTREACH",
  "WALK_IN",
  "OTHER",
];

export const SOURCE_LABELS: Record<LeadSource, string> = {
  INSTAGRAM: "إنستجرام",
  FACEBOOK: "فيسبوك",
  TIKTOK: "تيك توك",
  GOOGLE_MAPS: "خرائط جوجل",
  WEBSITE: "موقع كاشو",
  REFERRAL: "ترشيح",
  EVENT: "معرض / إيفنت",
  COLD_OUTREACH: "تواصل مباشر",
  WALK_IN: "زيارة ميدانية",
  OTHER: "مصدر تاني",
};

export const BUSINESS_SIZES: LeadBusinessSize[] = ["STARTING", "SMALL", "MEDIUM", "LARGE"];

export const SIZE_LABELS: Record<LeadBusinessSize, string> = {
  STARTING: "لسه بادئ / أونلاين بس",
  SMALL: "محل واحد",
  MEDIUM: "نشاط ثابت (فريق أو فرعين)",
  LARGE: "سلسلة / براند كبير",
};

/** Same list merchants pick from at signup (register form), so leads and accounts speak the same categories. */
export const BUSINESS_CATEGORIES = [
  "ملابس وأزياء",
  "إلكترونيات وتقنية",
  "أغذية ومشروبات",
  "صحة وجمال",
  "صيدلية",
  "منزل وديكور",
  "رياضة ولياقة",
  "كتب وتعليم",
  "مجوهرات وإكسسوارات",
  "حرف يدوية",
  "خدمات رقمية",
  "أطفال وألعاب",
  "سيارات وقطع غيار",
  "أخرى",
] as const;

export const CITIES = EGYPT_GOVERNORATES.map((g) => g.name);

/** Predefined reasons for LOST; "OTHER" needs a note. */
export const LOST_REASONS = {
  PRICE: "السعر غالي عليه",
  COMPETITOR: "اختار منصة تانية",
  NOT_READY: "مش جاهز دلوقتي",
  NO_NEED: "مش محتاج متجر أونلاين",
  NO_RESPONSE: "مبيردش خالص",
  WRONG_CONTACT: "الرقم أو البيانات غلط",
  CLOSED_BUSINESS: "النشاط اتقفل",
  OTHER: "سبب تاني",
} as const;
export type LostReason = keyof typeof LOST_REASONS;
export const LOST_REASON_KEYS = Object.keys(LOST_REASONS) as LostReason[];

export const lostReasonLabel = (key: string | null | undefined, note?: string | null) =>
  key === "OTHER" ? note?.trim() || LOST_REASONS.OTHER : key && key in LOST_REASONS ? LOST_REASONS[key as LostReason] : (note ?? "—");

/** Interactions a rep (or admin) logs by hand. `reached` is asked for the first three. */
export const INTERACTION_TYPES = ["CALL", "WHATSAPP", "EMAIL", "MEETING", "DEMO", "NOTE"] as const satisfies readonly LeadActivityType[];
export type InteractionType = (typeof INTERACTION_TYPES)[number];
export const REACHABLE_INTERACTIONS: InteractionType[] = ["CALL", "WHATSAPP", "EMAIL"];

export const ACTIVITY_LABELS: Record<LeadActivityType, string> = {
  CREATED: "اتضاف الليد",
  IMPORTED: "اتضاف من ملف",
  UPDATED: "اتعدلت البيانات",
  ASSIGNED: "اتسند لمندوب",
  REASSIGNED: "اتنقل لمندوب تاني",
  UNASSIGNED: "اتشال من المندوب",
  STATUS_CHANGED: "الحالة اتغيرت",
  PRIORITY_CHANGED: "الأولوية اتغيرت",
  CALL: "مكالمة",
  WHATSAPP: "واتساب",
  EMAIL: "إيميل",
  MEETING: "مقابلة",
  DEMO: "ديمو",
  NOTE: "ملاحظة",
  FOLLOW_UP_SCHEDULED: "متابعة اتحددت",
  FOLLOW_UP_COMPLETED: "متابعة خلصت",
  FOLLOW_UP_RESCHEDULED: "متابعة اتأجلت",
  FOLLOW_UP_CANCELED: "متابعة اتلغت",
  LINKED: "اترابط بحساب كاشو",
  UNLINKED: "اتفك الربط بحساب كاشو",
  CONVERTED: "اتحوّل لعميل",
  LOST: "خسرناه",
  REOPENED: "اتفتح تاني",
  ARCHIVED: "اتأرشف",
  RESTORED: "رجع من الأرشيف",
  DELETED: "اتمسح",
};

export const FOLLOW_UP_STATUS_META: Record<LeadFollowUpStatus, Meta> = {
  PENDING: { label: "مستنية", tone: "info" },
  DONE: { label: "خلصت", tone: "success" },
  CANCELED: { label: "اتلغت", tone: "neutral" },
};

export const LINK_SOURCE_LABELS: Record<LeadLinkSource, string> = {
  AUTO_EMAIL: "تلقائي — الإيميل المتأكد منه",
  AUTO_PHONE: "تلقائي — رقم التسجيل",
  ADMIN: "يدوي — من الإدارة",
};

export const IMPORT_STATUS_META: Record<LeadImportStatus, Meta> = {
  DRAFT: { label: "بيترفع", tone: "neutral" },
  READY: { label: "مستني التأكيد", tone: "warning" },
  RUNNING: { label: "شغال", tone: "info" },
  COMPLETED: { label: "خلص", tone: "success" },
  CANCELED: { label: "اتلغى", tone: "neutral" },
};

export const IMPORT_ROW_META: Record<LeadImportRowStatus, Meta> = {
  VALID: { label: "سليم", tone: "info" },
  INVALID: { label: "فيه غلط", tone: "danger" },
  DUPLICATE_FILE: { label: "متكرر في الملف", tone: "warning" },
  DUPLICATE_EXISTING: { label: "موجود قبل كده", tone: "warning" },
  IMPORTED: { label: "اتضاف", tone: "success" },
  UPDATED: { label: "كمّلنا بياناته", tone: "success" },
  SKIPPED: { label: "اتساب", tone: "neutral" },
  FAILED: { label: "فشل", tone: "danger" },
};

export const DUPLICATE_MODE_LABELS: Record<LeadDuplicateMode, { label: string; hint: string }> = {
  SKIP: { label: "سيب المكرر", hint: "الليدز الموجودة قبل كده متتلمسش — يتضاف الجديد السليم بس." },
  FILL_BLANKS: {
    label: "كمّل بيانات الموجود",
    hint: "الليد الموجود ياخد من الملف الخانات اللي فاضية عنده بس. عمره ما يكتب فوق بيانات موجودة.",
  },
};

export const ACTOR_ROLE_LABELS: Record<string, string> = { ADMIN: "الإدارة", SALES: "مندوب", SYSTEM: "النظام" };
