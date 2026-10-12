import { z } from "zod";

const reason = z.string().trim().min(5, "اكتب سبب واضح (5 أحرف على الأقل)").max(500, "السبب طويل جدًا");
const percent = z.coerce.number().min(0, "النسبة لازم تكون 0 أو أكتر").max(100, "النسبة لازم تكون 100 أو أقل");

export const createSalesRepSchema = z.object({
  name: z.string().trim().min(2, "الاسم قصير جدًا").max(100),
  email: z.string().trim().toLowerCase().email("البريد الإلكتروني غير صحيح"),
  phone: z
    .string()
    .trim()
    .regex(/^(010|011|012|015)\d{8}$/, "رقم الموبايل غير صحيح")
    .optional()
    .or(z.literal("")),
  password: z
    .string()
    .min(8, "كلمة المرور لازم تكون 8 أحرف على الأقل")
    .max(100)
    .refine((p) => /\d/.test(p), "كلمة المرور لازم تحتوي على رقم واحد على الأقل"),
  notes: z.string().trim().max(1000).optional(),
});

export const updateSalesRepSchema = z.object({
  salesRepId: z.string().uuid(),
  name: z.string().trim().min(2, "الاسم قصير جدًا").max(100),
  phone: z
    .string()
    .trim()
    .regex(/^(010|011|012|015)\d{8}$/, "رقم الموبايل غير صحيح")
    .optional()
    .or(z.literal("")),
  notes: z.string().trim().max(1000).optional(),
});

export const setSalesRepStatusSchema = z.object({
  salesRepId: z.string().uuid(),
  status: z.enum(["ACTIVE", "DISABLED"]),
  reason,
});

export const assignCustomerSchema = z
  .object({
    customerUserId: z.string().uuid().optional(),
    customerEmail: z.string().trim().toLowerCase().email("البريد الإلكتروني غير صحيح").optional(),
    toSalesRepId: z.string().uuid("اختار المندوب"),
    reason,
  })
  .refine((d) => d.customerUserId || d.customerEmail, { message: "حدد العميل", path: ["customerEmail"] });

export const commissionActionSchema = z.object({
  commissionId: z.string().uuid(),
  action: z.enum(["approve", "hold", "reject", "reverse"]),
  reason: z.string().trim().max(500).optional(),
});

export const commissionAdjustmentSchema = z.object({
  commissionId: z.string().uuid(),
  /** EGP, signed, up to 2 decimals. */
  amountEgp: z.coerce
    .number()
    .refine((n) => Number.isFinite(n) && n !== 0, "اكتب مبلغ غير صفر")
    .refine((n) => Math.abs(Math.round(n * 100) - n * 100) < 1e-6, "أقصى حد قرشين بعد العلامة العشرية"),
  reason,
});

export const recordPayoutSchema = z.object({
  salesRepId: z.string().uuid(),
  /** The payable total (piasters) the admin saw — rejected if it changed meanwhile. */
  expectedTotal: z.coerce.number().int().positive("مفيش مبلغ مستحق للصرف"),
  paidAt: z.coerce.date(),
  method: z.string().trim().min(2, "اكتب طريقة الدفع").max(100),
  reference: z.string().trim().max(200).optional(),
  note: z.string().trim().max(1000).optional(),
});

export const commissionRuleSchema = z
  .object({
    starterRate: percent,
    growthRate: percent,
    proRate: percent,
    renewalRate: percent,
    starterMaxPosition: z.coerce.number().int().min(1, "لازم 1 أو أكتر"),
    growthMaxPosition: z.coerce.number().int().min(2, "لازم 2 أو أكتر"),
    eligibilityMonths: z.coerce.number().int().min(1).max(36),
    note: reason,
  })
  .refine((d) => d.growthMaxPosition > d.starterMaxPosition, {
    message: "حد المستوى التاني لازم يكون أكبر من الأول",
    path: ["growthMaxPosition"],
  });
