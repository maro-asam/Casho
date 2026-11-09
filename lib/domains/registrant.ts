import { z } from "zod";

// The registrant contact Vercel's registrar needs for every registration.
// Casho registers on its own name (one contact for all stores), set by an
// admin at /admin/domains. Client-safe: the admin form validates with it too.

const text = (label: string) => z.string().trim().min(1, `${label} مطلوب`).max(120);

export const registrantSchema = z.object({
  firstName: text("الاسم الأول"),
  lastName: text("اسم العائلة"),
  companyName: z.string().trim().max(120).optional().transform((v) => v || undefined),
  email: z.string().trim().pipe(z.email("بريد مش صحيح")),
  /** E.164, e.g. +201001234567. */
  phone: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{7,14}$/, "اكتب الرقم بالصيغة الدولية — مثال: ‎+201001234567"),
  address1: text("العنوان"),
  city: text("المدينة"),
  state: text("المحافظة"),
  zip: text("الرمز البريدي"),
  /** ISO 3166-1 alpha-2. */
  country: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, "كود الدولة حرفين — مثال: EG"),
});

export type Registrant = z.infer<typeof registrantSchema>;

export function parseRegistrant(value: unknown): Registrant | null {
  const parsed = registrantSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
