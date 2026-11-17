/**
 * Funnel definitions. A step is a page view, an event (optionally with one
 * property match), or a verified business fact read from Casho's own records
 * — an account, a store, a plan, a payment request, a ledger credit, an
 * order — never from a browser event that merely claims it.
 */
import { z } from "zod";
import { EVENT_NAME_PATTERN, PROP_KEY_PATTERN } from "./constants";

export const VERIFIED_STEPS = {
  signup: { label: "سجّل حساب", source: "حساب اتعمل في جدول المستخدمين" },
  store_created: { label: "اتعمل له متجر", source: "متجر اتسجل في جدول المتاجر" },
  plan_selected: { label: "اختار باقة", source: "المتجر عليه باقة مختارة (planSelected)" },
  payment_initiated: { label: "بدأ دفع", source: "طلب شحن رصيد اتعمل (أونلاين أو تحويل)" },
  payment_completed: { label: "دفع بنجاح", source: "شحن رصيد اتقيد في دفتر الرصيد" },
  paid_subscription: { label: "اشتراك مدفوع", source: "خصم اشتراك اتقيد في دفتر الرصيد" },
  order_placed: { label: "عمل طلب في المتجر", source: "طلب موجود ومش ملغي" },
} as const;
export type VerifiedStep = keyof typeof VERIFIED_STEPS;

export type FunnelStep =
  | { type: "page"; value: string; label: string }
  | { type: "event"; value: string; propKey?: string; propValue?: string; label: string }
  | { type: "verified"; value: VerifiedStep; label: string };

export type FunnelScope = "MARKETING" | "APP" | "STOREFRONT";

export type FunnelDefinition = {
  id: string;
  name: string;
  description: string | null;
  scope: FunnelScope;
  steps: FunnelStep[];
  windowDays: number;
  builtIn: boolean;
};

/** The Casho acquisition funnel (built in, not editable). */
export const CASHO_FUNNEL: FunnelDefinition = {
  id: "casho-acquisition",
  name: "رحلة الاشتراك في كاشو",
  description: "من أول زيارة لموقع كاشو لحد أول دفعة مؤكدة.",
  scope: "MARKETING",
  windowDays: 30,
  builtIn: true,
  steps: [
    { type: "page", value: "*", label: "زار موقع كاشو" },
    { type: "event", value: "cta_clicked", propKey: "cta", propValue: "signup", label: "ضغط زرار التسجيل" },
    { type: "page", value: "/register*", label: "فتح صفحة التسجيل" },
    { type: "verified", value: "signup", label: "خلّص التسجيل" },
    { type: "verified", value: "store_created", label: "اتعمل له متجر" },
    { type: "verified", value: "plan_selected", label: "اختار باقة" },
    { type: "verified", value: "payment_initiated", label: "بدأ دفع" },
    { type: "verified", value: "payment_completed", label: "دفع بنجاح" },
  ],
};

/** A storefront funnel every store has (built in). */
export const STORE_FUNNEL: FunnelDefinition = {
  id: "store-purchase",
  name: "رحلة الشراء في المتاجر",
  description: "من زيارة المتجر لحد طلب مؤكد. اختار متجر من الفلتر عشان تشوف متجر واحد.",
  scope: "STOREFRONT",
  windowDays: 7,
  builtIn: true,
  steps: [
    { type: "page", value: "*", label: "زار المتجر" },
    { type: "page", value: "/products/*", label: "فتح صفحة منتج" },
    { type: "event", value: "add_to_cart", label: "أضاف للسلة" },
    { type: "page", value: "/checkout*", label: "فتح صفحة الدفع" },
    { type: "verified", value: "order_placed", label: "عمل طلب" },
  ],
};

export const BUILT_IN_FUNNELS = [CASHO_FUNNEL, STORE_FUNNEL];

const pathValue = z
  .string()
  .trim()
  .max(200)
  .refine((v) => v === "*" || v.startsWith("/"), "المسار لازم يبدأ بـ /");

export const funnelStepSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("page"), value: pathValue, label: z.string().trim().min(1).max(60) }),
  z.object({
    type: z.literal("event"),
    value: z.string().regex(EVENT_NAME_PATTERN, "اسم حدث غير صالح"),
    propKey: z.string().regex(PROP_KEY_PATTERN).optional().or(z.literal("").transform(() => undefined)),
    propValue: z.string().trim().max(120).optional(),
    label: z.string().trim().min(1).max(60),
  }),
  z.object({
    type: z.literal("verified"),
    value: z.enum(Object.keys(VERIFIED_STEPS) as [VerifiedStep, ...VerifiedStep[]]),
    label: z.string().trim().min(1).max(60),
  }),
]);

export const funnelInputSchema = z.object({
  name: z.string().trim().min(2, "اكتب اسم للـ funnel").max(80),
  description: z.string().trim().max(200).optional().nullable(),
  scope: z.enum(["MARKETING", "APP", "STOREFRONT"]),
  windowDays: z.coerce.number().int().min(1).max(90),
  steps: z.array(funnelStepSchema).min(2, "محتاج خطوتين على الأقل").max(10, "أقصى حاجة ١٠ خطوات"),
});
export type FunnelInput = z.infer<typeof funnelInputSchema>;

/** "/products/*" → SQL LIKE "/products/%"; "*" → any page; exact otherwise. */
export function pathPattern(value: string): { kind: "any" } | { kind: "prefix"; like: string } | { kind: "exact"; path: string } {
  if (value === "*") return { kind: "any" };
  if (value.endsWith("*")) {
    const base = value.slice(0, -1).replace(/[\\%_]/g, (c) => `\\${c}`);
    return { kind: "prefix", like: `${base}%` };
  }
  return { kind: "exact", path: value };
}

/** Stored JSON → steps, dropping anything that no longer validates. */
export function readSteps(raw: unknown): FunnelStep[] {
  if (!Array.isArray(raw)) return [];
  const out: FunnelStep[] = [];
  for (const item of raw) {
    const parsed = funnelStepSchema.safeParse(item);
    if (parsed.success) out.push(parsed.data as FunnelStep);
  }
  return out;
}
