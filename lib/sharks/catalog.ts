import type { SharksApplicationStatus, SharksPlanStatus, SharksStoryStatus, SharksTaskStatus, SharksTrack } from "@prisma/client";
import type { PillTone } from "@/components/saas-page/status-pill";

// Casho Sharks vocabulary: tracks, the benefits Casho can actually deliver,
// the review rubric and status labels. Bilingual where the public site or the
// merchant dashboard show it; admin pages read `.ar`.

export type Bilingual = { ar: string; en: string };
export const pick = (label: Bilingual, lang: "ar" | "en") => label[lang];

/**
 * Casho Investment is a *future pathway*. It is deliberately not a value of
 * SharksTrack, has no availability switch, no application path and no plan
 * type. Turning it on needs its own separately approved implementation; this
 * constant only documents that and is asserted by tests.
 */
export const INVESTMENT_TRACK_ACTIVE = false as const;

export const TRACKS: Record<SharksTrack, { name: Bilingual; short: Bilingual }> = {
  BENEFITS: {
    name: { ar: "Casho Benefits", en: "Casho Benefits" },
    short: { ar: "دعم تشغيلي", en: "Operational support" },
  },
  GROWTH: {
    name: { ar: "Casho Growth", en: "Casho Growth" },
    short: { ar: "توجيه للنمو", en: "Growth guidance" },
  },
};

export const INVESTMENT_TRACK = {
  name: { ar: "Casho Investment", en: "Casho Investment" },
  short: { ar: "مسار مستقبلي", en: "A future pathway" },
};

/** Things Casho can genuinely deliver today. Support plans store these keys. */
export const BENEFITS = {
  free_subscription: { track: "BENEFITS", ar: "اشتراك كاشو مجاني لمدة متفق عليها", en: "A complimentary Casho subscription for an agreed period" },
  store_setup: { track: "BENEFITS", ar: "تجهيز المتجر مع فريق كاشو", en: "Store setup with the Casho team" },
  pos_setup: { track: "BENEFITS", ar: "تجهيز الكاشير (POS)", en: "POS setup" },
  store_config: { track: "BENEFITS", ar: "ضبط المتجر وتحسين تجربة الشراء", en: "Store configuration and a better shopping experience" },
  early_access: { track: "BENEFITS", ar: "أولوية في تجربة المميزات الجديدة لما تتاح", en: "Priority access to new features when available" },
  journey_review: { track: "GROWTH", ar: "مراجعة المتجر ورحلة العميل", en: "A review of your store and customer journey" },
  marketing_guidance: { track: "GROWTH", ar: "توجيه في التسويق والمبيعات", en: "Marketing and sales guidance" },
  creative_partner: { track: "GROWTH", ar: "تصوير منتجات أو محتوى من خلال شركاء، حسب المتاح", en: "Product photography or creative work through partners, when available" },
  promo_exposure: { track: "GROWTH", ar: "ظهور على قنوات كاشو، حسب المتاح وباتفاق", en: "Exposure on Casho's channels, when available and agreed" },
} as const satisfies Record<string, { track: SharksTrack } & Bilingual>;

export type BenefitKey = keyof typeof BENEFITS;
export const BENEFIT_KEYS = Object.keys(BENEFITS) as BenefitKey[];
export const benefitsForTrack = (track: SharksTrack) => BENEFIT_KEYS.filter((k) => BENEFITS[k].track === track);

/** Evaluation rubric — totals 100. */
export const RUBRIC = [
  { key: "product", max: 20, ar: "جودة المنتج أو الخدمة" },
  { key: "demand", max: 20, ar: "دليل على وجود طلب" },
  { key: "founder", max: 20, ar: "التزام المؤسس وقدرته على التنفيذ" },
  { key: "growth", max: 15, ar: "فرص النمو" },
  { key: "experience", max: 10, ar: "تجربة العميل" },
  { key: "clarity", max: 15, ar: "وضوح الاستخدام المقترح للدعم" },
] as const;
export type RubricKey = (typeof RUBRIC)[number]["key"];

export const OPERATING_SINCE = {
  lt6m: { ar: "أقل من ٦ شهور", en: "Less than 6 months" },
  "6to12m": { ar: "من ٦ شهور لسنة", en: "6 to 12 months" },
  "1to3y": { ar: "من سنة لـ ٣ سنين", en: "1 to 3 years" },
  gt3y: { ar: "أكتر من ٣ سنين", en: "More than 3 years" },
} as const satisfies Record<string, Bilingual>;
export type OperatingSince = keyof typeof OPERATING_SINCE;

type Meta = { ar: string; en: string; tone: PillTone };

export const APPLICATION_STATUS: Record<SharksApplicationStatus, Meta> = {
  SUBMITTED: { ar: "اتبعت", en: "Submitted", tone: "warning" },
  UNDER_REVIEW: { ar: "قيد المراجعة", en: "Under review", tone: "info" },
  INFO_REQUESTED: { ar: "محتاجين معلومات", en: "More information needed", tone: "warning" },
  INTERVIEW: { ar: "مقابلة", en: "Interview", tone: "accent" },
  ACCEPTED: { ar: "اتقبل", en: "Accepted", tone: "success" },
  WAITLISTED: { ar: "قائمة الانتظار", en: "Waitlisted", tone: "neutral" },
  REJECTED: { ar: "متقبلش المرة دي", en: "Not selected", tone: "danger" },
};

export const STORY_STATUS: Record<SharksStoryStatus, Meta> = {
  PROPOSED: { ar: "مقترحة", en: "Proposed", tone: "neutral" },
  AWAITING_CONSENT: { ar: "مستنية موافقة البيزنس", en: "Awaiting consent", tone: "warning" },
  CONSENT_RECORDED: { ar: "الموافقة اتسجلت", en: "Consent recorded", tone: "info" },
  IN_PRODUCTION: { ar: "قيد الإنتاج", en: "In production", tone: "accent" },
  IN_REVIEW: { ar: "مراجعة داخلية", en: "Internal review", tone: "warning" },
  APPROVED: { ar: "معتمدة للنشر", en: "Approved", tone: "info" },
  PUBLISHED: { ar: "منشورة", en: "Published", tone: "success" },
  UNPUBLISHED: { ar: "اتشالت من النشر", en: "Unpublished", tone: "neutral" },
  ARCHIVED: { ar: "مؤرشفة", en: "Archived", tone: "neutral" },
};

export const PLAN_STATUS: Record<SharksPlanStatus, Meta> = {
  PLANNED: { ar: "متخطط", en: "Planned", tone: "neutral" },
  IN_PROGRESS: { ar: "جاري التنفيذ", en: "In progress", tone: "info" },
  PAUSED: { ar: "متوقف مؤقتًا", en: "Paused", tone: "warning" },
  COMPLETED: { ar: "مكتمل", en: "Completed", tone: "success" },
  CANCELED: { ar: "اتلغى", en: "Canceled", tone: "neutral" },
};

export const TASK_STATUS: Record<SharksTaskStatus, Meta> = {
  TODO: { ar: "لسه", en: "To do", tone: "neutral" },
  IN_PROGRESS: { ar: "شغالين عليها", en: "In progress", tone: "info" },
  DONE: { ar: "خلصت", en: "Done", tone: "success" },
  CANCELED: { ar: "اتلغت", en: "Canceled", tone: "neutral" },
};
