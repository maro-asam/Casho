import { z } from "zod";
import { BENEFIT_KEYS, OPERATING_SINCE, RUBRIC } from "./catalog";
import { parseVideoUrl } from "./video";
import { RESERVED_SLUGS } from "./workflow";

// Input schemas for Casho Sharks. The application form validates each step on
// the client with the same schemas the server action re-checks.

const text = (min: number, max: number, minMsg: string) =>
  z
    .string()
    .trim()
    .min(min, minMsg)
    .max(max, `الحد الأقصى ${max} حرف`);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `الحد الأقصى ${max} حرف`)
    .optional()
    .transform((v) => (v ? v : null));

const httpsUrl = z
  .string()
  .trim()
  .max(500, "الرابط طويل جدًا")
  .refine((v) => {
    try {
      const u = new URL(v);
      return u.protocol === "https:" || u.protocol === "http:";
    } catch {
      return false;
    }
  }, "اكتب رابط كامل يبدأ بـ https://");

export const businessStep = z.object({
  storeId: z.string().uuid("اختار المتجر"),
  businessName: text(2, 80, "اكتب اسم البيزنس"),
  storeUrl: httpsUrl,
  industry: text(2, 60, "اكتب المجال"),
  description: text(30, 1000, "اوصف البيزنس في ٣٠ حرف على الأقل"),
  operatingSince: z.enum(Object.keys(OPERATING_SINCE) as [string, ...string[]], { message: "اختار المدة" }),
});

export const situationStep = z.object({
  offering: text(10, 600, "قولنا بتبيع إيه (١٠ حروف على الأقل)"),
  customers: text(10, 600, "قولنا مين عملاءك (١٠ حروف على الأقل)"),
  challenge: text(20, 1000, "اشرح أكبر تحدي (٢٠ حرف على الأقل)"),
  traction: text(10, 1000, "اكتب أي تقدم وصلتله (١٠ حروف على الأقل)"),
  potential: text(20, 1000, "قولنا ليه شايف إن البيزنس ليه مستقبل (٢٠ حرف على الأقل)"),
});

export const supportStep = z.object({
  requestedTracks: z.array(z.enum(["BENEFITS", "GROWTH"])).min(1, "اختار مسار واحد على الأقل").max(2),
  investmentInterest: z.boolean(),
  supportGoal: text(20, 1000, "اشرح المشكلة اللي محتاج مساعدة فيها (٢٠ حرف على الأقل)"),
});

export const consentStep = z.object({
  links: z.array(httpsUrl).max(5, "٥ روابط بحد أقصى"),
  extraInfo: optionalText(1000),
  termsAccepted: z.literal(true, { message: "لازم توافق على شروط البرنامج" }),
  marketingOptIn: z.boolean(),
});

export const applicationSchema = businessStep
  .extend(situationStep.shape)
  .extend(supportStep.shape)
  .extend(consentStep.shape)
  .extend({ submissionKey: z.string().uuid() });

export type ApplicationInput = z.input<typeof applicationSchema>;

export const APPLICATION_STEPS = [businessStep, situationStep, supportStep, consentStep] as const;

export const replySchema = z.object({
  applicationId: z.string().uuid(),
  message: text(5, 2000, "اكتب ردك"),
});

/* ── Admin ───────────────────────────────────────────────────────────────── */

export const statusSchema = z.object({
  applicationId: z.string().uuid(),
  status: z.enum(["SUBMITTED", "UNDER_REVIEW", "INFO_REQUESTED", "INTERVIEW", "ACCEPTED", "WAITLISTED", "REJECTED"]),
  /** Info request text (shown to the applicant) or an optional decision message. */
  message: optionalText(2000),
});

export const noteSchema = z.object({
  applicationId: z.string().uuid(),
  message: text(2, 4000, "اكتب الملاحظة"),
});

const score = (key: (typeof RUBRIC)[number]["key"]) => {
  const max = RUBRIC.find((c) => c.key === key)!.max;
  return z.coerce.number().int("رقم صحيح").min(0, "من 0").max(max, `لحد ${max}`);
};

export const evaluationSchema = z.object({
  applicationId: z.string().uuid(),
  product: score("product"),
  demand: score("demand"),
  founder: score("founder"),
  growth: score("growth"),
  experience: score("experience"),
  clarity: score("clarity"),
  notes: optionalText(4000),
});

const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((v, ctx) => {
    if (!v) return null;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) {
      ctx.addIssue({ code: "custom", message: "تاريخ غير صالح" });
      return z.NEVER;
    }
    return d;
  });

export const interviewSchema = z.object({
  applicationId: z.string().uuid(),
  interviewAt: optionalDate,
  interviewLocation: optionalText(200),
  notes: optionalText(4000),
});

export const planSchema = z
  .object({
    applicationId: z.string().uuid(),
    track: z.string(),
    benefits: z.array(z.enum(BENEFIT_KEYS as [string, ...string[]])).min(1, "اختار ميزة واحدة على الأقل"),
    scope: text(10, 2000, "اكتب نطاق الدعم المتفق عليه"),
    limitations: optionalText(2000),
    startsOn: optionalDate,
    endsOn: optionalDate,
    ownerId: z.string().uuid().optional().or(z.literal("")).transform((v) => v || null),
    status: z.enum(["PLANNED", "IN_PROGRESS", "PAUSED", "COMPLETED", "CANCELED"]),
  })
  .refine((p) => !p.startsOn || !p.endsOn || p.endsOn >= p.startsOn, { message: "تاريخ النهاية قبل البداية", path: ["endsOn"] });

export const taskSchema = z.object({
  planId: z.string().uuid(),
  title: text(2, 200, "اكتب المهمة"),
  isMilestone: z.boolean(),
  dueOn: optionalDate,
});

export const storyContentSchema = z.object({
  storyId: z.string().uuid(),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "حروف إنجليزي صغيرة وأرقام وشرطات بس")
    .min(3, "٣ حروف على الأقل")
    .max(60)
    .refine((v) => !RESERVED_SLUGS.includes(v), "الرابط ده محجوز"),
  title: text(3, 120, "اكتب عنوان القصة"),
  businessName: text(2, 80, "اكتب اسم البيزنس"),
  industry: text(2, 60, "اكتب المجال"),
  // Drafts may be incomplete; approval checks completeness (missingStoryContent).
  summary: z.string().trim().max(400, "الحد الأقصى 400 حرف"),
  intro: optionalText(3000),
  challenge: optionalText(3000),
  whySelected: optionalText(3000),
  supportProvided: optionalText(3000),
  outcomes: optionalText(3000),
  founderQuote: optionalText(500),
  founderName: optionalText(80),
  coverImageUrl: z.union([httpsUrl, z.literal("")]).optional().transform((v) => v || null),
  logoUrl: z.union([httpsUrl, z.literal("")]).optional().transform((v) => v || null),
  videoUrl: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null)
    .refine((v) => !v || parseVideoUrl(v) !== null, "رابط فيديو غير مدعوم — استخدم YouTube أو Vimeo أو رابط مباشر لملف mp4/webm"),
  videoPosterUrl: z.union([httpsUrl, z.literal("")]).optional().transform((v) => v || null),
  showTrack: z.boolean(),
});

export const consentSchema = z.object({
  storyId: z.string().uuid(),
  givenBy: text(2, 120, "مين اللي وافق؟"),
  method: text(2, 200, "إزاي اتسجلت الموافقة؟ (مثلاً: رسالة واتساب، نموذج موقّع)"),
  scope: text(5, 1000, "إيه اللي اتوافق عليه بالظبط؟"),
  givenAt: z
    .string()
    .trim()
    .transform((v, ctx) => {
      const d = new Date(v);
      if (!v || Number.isNaN(d.getTime())) {
        ctx.addIssue({ code: "custom", message: "اكتب تاريخ الموافقة" });
        return z.NEVER;
      }
      return d;
    }),
});

export const programSchema = z.object({
  applicationsOpen: z.boolean(),
  benefitsAvailable: z.boolean(),
  growthAvailable: z.boolean(),
});

/** Zod issues → { field: firstMessage }. */
export function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0] === undefined ? "_" : String(issue.path[0]);
    out[key] ??= issue.message;
  }
  return out;
}
