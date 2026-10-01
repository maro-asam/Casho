import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
//  Storefront popup — shared by the dashboard editor, the live preview and the
//  storefront host. Stored in StorePopup.config (JSON), validated with zod.
// ─────────────────────────────────────────────────────────────────────────────

export const POPUP_TYPES = ["discount", "lead", "announcement"] as const;
export type PopupType = (typeof POPUP_TYPES)[number];

export const isPopupType = (v: unknown): v is PopupType => POPUP_TYPES.includes(v as PopupType);

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const url = z.string().trim().max(2000).regex(/^(https?:\/\/|\/)\S*$/, "رابط غير صالح");
const text = (max: number) => z.string().trim().max(max);

export const popupConfigSchema = z.object({
  content: z.object({
    eyebrow: text(40).default(""),
    title: text(80).min(1, "اكتب عنوان النافذة"),
    body: text(240).default(""),
    image: url.or(z.literal("")).default(""),
    ctaText: text(30).min(1, "اكتب نص الزرار"),
    ctaLink: url.or(z.literal("")).default(""),
    couponCode: text(40).default(""),
    dismissText: text(40).default(""),
    successTitle: text(80).default(""),
    successBody: text(200).default(""),
  }),
  gate: z.object({
    /** Ask for a phone number before revealing the code / finishing. */
    requirePhone: z.boolean().default(false),
    askName: z.boolean().default(false),
  }),
  design: z.object({
    layout: z.enum(["center", "split", "bottom", "corner"]).default("center"),
    /** "theme" follows the store's primary color. */
    accent: z.union([z.literal("theme"), hex]).default("theme"),
    radius: z.enum(["sm", "md", "lg"]).default("lg"),
    showCountdown: z.boolean().default(true),
  }),
  trigger: z.object({
    kind: z.enum(["delay", "scroll", "exit"]).default("delay"),
    delaySeconds: z.number().int().min(0).max(300).default(5),
    scrollPercent: z.number().int().min(10).max(90).default(40),
  }),
  targeting: z.object({
    pages: z.enum(["all", "home", "products"]).default("all"),
    devices: z.enum(["all", "mobile", "desktop"]).default("all"),
    audience: z.enum(["all", "new", "returning"]).default("all"),
  }),
  frequency: z.object({
    mode: z.enum(["once", "session", "days"]).default("days"),
    days: z.number().int().min(1).max(90).default(3),
  }),
});

export type PopupConfig = z.infer<typeof popupConfigSchema>;

/** Popup as the storefront needs it — no counters, dates resolved. */
export type StorefrontPopup = {
  id: string;
  type: PopupType;
  priority: number;
  config: PopupConfig;
  endsAt: string | null;
  /** Expiry of the linked coupon (for the real countdown), if any. */
  couponExpiresAt: string | null;
};

// ─── Templates — one tap gets a merchant a good-looking popup ────────────────

type Template = { id: string; type: PopupType; name: string; description: string; config: PopupConfig };

const base = (over: {
  content: Partial<PopupConfig["content"]> & Pick<PopupConfig["content"], "title" | "ctaText">;
  gate?: Partial<PopupConfig["gate"]>;
  design?: Partial<PopupConfig["design"]>;
  trigger?: Partial<PopupConfig["trigger"]>;
  targeting?: Partial<PopupConfig["targeting"]>;
  frequency?: Partial<PopupConfig["frequency"]>;
}): PopupConfig =>
  popupConfigSchema.parse({
    content: over.content,
    gate: over.gate ?? {},
    design: over.design ?? {},
    trigger: over.trigger ?? {},
    targeting: over.targeting ?? {},
    frequency: over.frequency ?? {},
  });

export const POPUP_TEMPLATES: Template[] = [
  {
    id: "welcome-discount",
    type: "discount",
    name: "خصم أول طلب",
    description: "كود خصم للزوار الجداد مقابل رقم الموبايل — بيكبّر قائمة عملائك.",
    config: base({
      content: {
        eyebrow: "أهلاً بيك 👋",
        title: "خد خصم ١٠٪ على أول طلب",
        body: "سيب رقمك وهنكشفلك كود الخصم حالًا.",
        ctaText: "اكشف الكود",
        dismissText: "لا شكرًا، هدفع السعر كامل",
        successTitle: "الكود بتاعك جاهز 🎉",
        successBody: "استخدمه في صفحة الدفع قبل ما يخلص.",
      },
      gate: { requirePhone: true },
      targeting: { audience: "new" },
      trigger: { kind: "delay", delaySeconds: 6 },
    }),
  },
  {
    id: "exit-save",
    type: "discount",
    name: "استنى قبل ما تمشي",
    description: "بيظهر لما الزائر يحاول يقفل الصفحة — آخر فرصة تكسبه.",
    config: base({
      content: {
        eyebrow: "استنى لحظة!",
        title: "متمشيش من غير هدية",
        body: "خد الكود ده وكمّل طلبك بسعر أحسن.",
        ctaText: "عايز الخصم",
        dismissText: "مش دلوقتي",
        successTitle: "اتفضل الكود",
        successBody: "انسخه واستخدمه في الدفع.",
      },
      design: { layout: "split" },
      trigger: { kind: "exit" },
      frequency: { mode: "days", days: 7 },
    }),
  },
  {
    id: "vip-list",
    type: "lead",
    name: "قائمة العملاء المميزين",
    description: "اجمع أرقام الموبايل لعروض الواتساب الحصرية — من غير خصم.",
    config: base({
      content: {
        eyebrow: "حصريًا",
        title: "اعرف العروض قبل أي حد",
        body: "انضم لقائمة الواتساب وهنبعتلك الجديد والخصومات أول بأول.",
        ctaText: "اشترك",
        dismissText: "مش مهتم",
        successTitle: "انت معانا ✨",
        successBody: "هنبعتلك أول عرض قريب.",
      },
      gate: { requirePhone: true, askName: true },
      design: { layout: "bottom" },
      trigger: { kind: "scroll", scrollPercent: 50 },
    }),
  },
  {
    id: "campaign",
    type: "discount",
    name: "عرض موسمي",
    description: "لمواسم زي الجمعة البيضاء ورمضان — بعدّاد حقيقي لحد آخر يوم في العرض.",
    config: base({
      content: {
        eyebrow: "لفترة محدودة",
        title: "خصومات الموسم بدأت",
        body: "استخدم الكود قبل ما العرض يخلص.",
        ctaText: "خد الكود",
        dismissText: "مش دلوقتي",
        successTitle: "الكود بتاعك",
        successBody: "انسخه واستخدمه في صفحة الدفع.",
      },
      design: { layout: "split", showCountdown: true },
      trigger: { kind: "delay", delaySeconds: 4 },
      frequency: { mode: "session" },
    }),
  },
  {
    id: "announcement",
    type: "announcement",
    name: "إعلان أو كولكشن جديد",
    description: "صورة وزرار يودّي على صفحة — للكولكشن الجديد أو التخفيضات.",
    config: base({
      content: {
        eyebrow: "جديد",
        title: "كولكشن الشتا نزل",
        body: "قطع محدودة — الحق اختار قبل ما المقاسات تخلص.",
        ctaText: "تسوّق دلوقتي",
        ctaLink: "/products",
        dismissText: "",
      },
      design: { layout: "split" },
      trigger: { kind: "delay", delaySeconds: 3 },
      frequency: { mode: "session" },
    }),
  },
];

export const BLANK_POPUP: PopupConfig = POPUP_TEMPLATES[0].config;

export const POPUP_TYPE_META: Record<PopupType, { label: string; tone: "accent" | "info" | "warning" }> = {
  discount: { label: "كود خصم", tone: "accent" },
  lead: { label: "جمع أرقام", tone: "info" },
  announcement: { label: "إعلان", tone: "warning" },
};

export function triggerLabel(trigger: PopupConfig["trigger"]) {
  if (trigger.kind === "exit") return "عند محاولة الخروج";
  if (trigger.kind === "scroll") return `بعد نزول ${trigger.scrollPercent}٪ من الصفحة`;
  return trigger.delaySeconds === 0 ? "فور فتح الصفحة" : `بعد ${trigger.delaySeconds} ثانية`;
}

/** Parse what's in the DB, falling back to a safe default if it's malformed. */
export function readPopupConfig(raw: unknown): PopupConfig {
  const parsed = popupConfigSchema.safeParse(raw);
  return parsed.success ? parsed.data : BLANK_POPUP;
}

/** Egyptian mobile → 01XXXXXXXXX, or null. Accepts +20 / 0020 / spaces / Arabic digits. */
export function normalizeEgyptPhone(input: string) {
  const ascii = input.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/[\s-]/g, "");
  const local = ascii.replace(/^(\+20|0020|20)(?=1)/, "0");
  return /^01[0125]\d{8}$/.test(local) ? local : null;
}
