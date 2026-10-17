import { z } from "zod";

/** "٠١٠ 1234-5678" → "01012345678": Latin digits, no spaces/dashes/brackets. */
export function normalizePhone(value: string) {
  return value
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[\s\-().]/g, "")
    .trim();
}

/** Drops control characters (newlines in a name, zero-width tricks) and collapses whitespace. */
function cleanText(value: string) {
  return value.replace(/[\u0000-\u001f\u007f​-‏‪-‮]/g, " ").replace(/\s+/g, " ").trim();
}

export const orderPhoneSchema = z
  .string()
  .transform(normalizePhone)
  .pipe(z.string().regex(/^\+?\d{8,15}$/, "رقم الموبايل غير صحيح"));

export const checkoutContactSchema = z.object({
  fullName: z
    .string()
    .transform(cleanText)
    .pipe(z.string().min(2, "الاسم قصير جدًا").max(100, "الاسم طويل جدًا")),
  phone: orderPhoneSchema,
  address: z
    .string()
    .transform(cleanText)
    .pipe(z.string().min(5, "العنوان قصير جدًا").max(500, "العنوان طويل جدًا")),
});

export type CheckoutContact = z.infer<typeof checkoutContactSchema>;
