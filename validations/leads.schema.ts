import { z } from "zod";
import { LeadBusinessSize, LeadPriority, LeadSource, LeadStatus } from "@prisma/client";
import { INTERACTION_TYPES, LOST_REASON_KEYS } from "@/lib/leads/constants";
import {
  cleanNote,
  cleanText,
  normalizeCategory,
  normalizeCity,
  normalizeEmail,
  normalizeHandle,
  normalizePhone,
  normalizeWebsite,
} from "@/lib/leads/normalize";

/** Cells people fill with "nothing" in lead sheets. */
const PLACEHOLDERS = new Set(["-", "--", "—", ".", "n/a", "na", "none", "null", "لا يوجد", "لايوجد", "مفيش", "لا"]);

const blankToNull = (v: unknown) => {
  if (v == null) return null;
  const s = String(v).trim();
  return !s || PLACEHOLDERS.has(s.toLowerCase()) ? null : s;
};

const optText = (max: number) => z.preprocess(blankToNull, z.string().nullable()).transform((v) => cleanText(v, max));

const optEnum = <T extends Record<string, string>>(values: T) =>
  z.preprocess((v) => blankToNull(v), z.nativeEnum(values).nullable());

/** The lead's own data — shared by the add/edit forms and every imported row. */
export const leadFieldsSchema = z.object({
  businessName: z
    .preprocess((v) => (v == null ? "" : String(v)), z.string())
    .transform((v) => cleanText(v, 120) ?? "")
    .pipe(z.string().min(2, "اسم النشاط مطلوب (حرفين على الأقل)")),
  ownerName: optText(100),
  phone: z
    .preprocess((v) => (v == null ? "" : String(v)), z.string())
    .transform((v) => cleanText(v, 40) ?? "")
    .pipe(z.string().min(1, "رقم الموبايل مطلوب"))
    .refine((v) => normalizePhone(v) !== null, "رقم الموبايل مش صحيح"),
  whatsapp: optText(40).refine((v) => v === null || normalizePhone(v) !== null, "رقم الواتساب مش صحيح"),
  email: optText(254)
    .refine((v) => v === null || normalizeEmail(v) !== null, "الإيميل مش صحيح")
    .transform((v) => (v ? normalizeEmail(v) : null)),
  category: optText(80).transform(normalizeCategory),
  city: optText(80).transform(normalizeCity),
  website: optText(300)
    .refine((v) => v === null || normalizeWebsite(v) !== null, "رابط الموقع مش صحيح")
    .transform((v) => (v ? normalizeWebsite(v) : null)),
  instagram: optText(300)
    .refine((v) => v === null || normalizeHandle(v, "instagram.com") !== null, "حساب الإنستجرام مش صحيح")
    .transform((v) => (v ? normalizeHandle(v, "instagram.com") : null)),
  facebook: optText(300)
    .refine((v) => v === null || normalizeHandle(v, "facebook.com") !== null, "صفحة الفيسبوك مش صحيحة")
    .transform((v) => (v ? normalizeHandle(v, "facebook.com") : null)),
  businessSize: optEnum(LeadBusinessSize),
  source: optEnum(LeadSource),
  sourceDetails: optText(300),
});
export type LeadFields = z.output<typeof leadFieldsSchema>;

const id = z.string().uuid("طلب غير صحيح");
const optNote = (max = 2000) => z.preprocess((v) => (v == null ? null : String(v)), z.string().nullable()).transform((v) => cleanNote(v, max));
const priorityChoice = z.union([z.literal("AUTO"), z.nativeEnum(LeadPriority)]).default("AUTO");
const optRep = z.preprocess(blankToNull, id.nullable());

export const createLeadSchema = leadFieldsSchema.extend({
  notes: optNote(),
  priority: z.preprocess((v) => blankToNull(v) ?? "AUTO", priorityChoice),
  assignRepId: optRep,
});

export const updateLeadSchema = leadFieldsSchema.extend({ leadId: id });

const leadIds = z.array(id).min(1, "اختار ليد واحد على الأقل").max(500, "500 ليد بالكتير في المرة");

export const assignLeadsSchema = z.object({
  leadIds,
  salesRepId: optRep,
  reason: optText(300),
});

const lostFields = {
  lostReason: z.preprocess(blankToNull, z.enum(LOST_REASON_KEYS as [string, ...string[]]).nullable()),
  lostNote: optText(300),
};

function refineLost(v: { status: LeadStatus; lostReason: string | null; lostNote: string | null }, ctx: z.RefinementCtx) {
  if (v.status !== "LOST") return;
  if (!v.lostReason) ctx.addIssue({ code: "custom", path: ["lostReason"], message: "اختار سبب الخسارة" });
  else if (v.lostReason === "OTHER" && !v.lostNote) ctx.addIssue({ code: "custom", path: ["lostNote"], message: "اكتب السبب" });
}

export const changeStatusSchema = z.object({ leadId: id, status: z.nativeEnum(LeadStatus), ...lostFields }).superRefine(refineLost);

export const bulkStatusSchema = z.object({ leadIds, status: z.nativeEnum(LeadStatus), ...lostFields }).superRefine(refineLost);

export const changePrioritySchema = z.object({ leadId: id, priority: priorityChoice });

export const logInteractionSchema = z
  .object({
    leadId: id,
    type: z.enum(INTERACTION_TYPES),
    description: optNote(1000),
    reached: z.preprocess((v) => (v === "yes" || v === true ? true : v === "no" || v === false ? false : null), z.boolean().nullable()),
  })
  .superRefine((v, ctx) => {
    if (v.type === "NOTE" && !v.description) ctx.addIssue({ code: "custom", path: ["description"], message: "اكتب الملاحظة" });
  });

const dueAt = z.coerce.date({ message: "الميعاد مش صحيح" });

export const scheduleFollowUpSchema = z.object({ leadId: id, dueAt, note: optNote(500) });

export const completeFollowUpSchema = z.object({
  followUpId: id,
  outcome: optNote(500),
  /** Optional: schedule the next one in the same step. */
  nextDueAt: z.preprocess(blankToNull, dueAt.nullable()),
  nextNote: optNote(500),
});

export const rescheduleFollowUpSchema = z.object({ followUpId: id, dueAt, reason: optText(300) });

export const cancelFollowUpSchema = z.object({ followUpId: id, reason: optText(300) });

export const leadReasonSchema = z.object({ leadId: id, reason: optText(300) });

export const linkCustomerSchema = z.object({ leadId: id, userId: id });

export const resolveMatchSchema = z.object({ matchId: id, decision: z.enum(["link", "dismiss"]) });

export const findAccountSchema = z.object({ query: z.string().trim().min(3, "اكتب 3 حروف على الأقل").max(120) });
