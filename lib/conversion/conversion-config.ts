import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
//  Storefront conversion widgets. Stored in StoreSettings.conversionConfig.
// ─────────────────────────────────────────────────────────────────────────────

export const conversionConfigSchema = z.object({
  whatsapp: z
    .object({
      enabled: z.boolean().default(false),
      /** Falls back to StoreSettings.whatsappNumber when empty. */
      phone: z.string().trim().max(20).default(""),
      greeting: z.string().trim().max(300).default("أهلاً، عندي استفسار"),
      /** Append the page the customer is on (product link) to the message. */
      attachPage: z.boolean().default(true),
      label: z.string().trim().max(30).default("كلمنا واتساب"),
      showLabel: z.boolean().default(true),
      position: z.enum(["start", "end"]).default("start"),
      devices: z.enum(["all", "mobile", "desktop"]).default("all"),
    })
    .default({
      enabled: false,
      phone: "",
      greeting: "أهلاً، عندي استفسار",
      attachPage: true,
      label: "كلمنا واتساب",
      showLabel: true,
      position: "start",
      devices: "all",
    }),
  purchaseToasts: z
    .object({
      enabled: z.boolean().default(false),
      /** Show the buyer's first name, or keep everyone anonymous. */
      nameMode: z.enum(["first", "hidden"]).default("first"),
      lookbackDays: z.number().int().min(1).max(30).default(7),
      intervalSeconds: z.number().int().min(8).max(120).default(20),
      maxPerVisit: z.number().int().min(1).max(10).default(4),
      position: z.enum(["start", "end"]).default("end"),
    })
    .default({
      enabled: false,
      nameMode: "first",
      lookbackDays: 7,
      intervalSeconds: 20,
      maxPerVisit: 4,
      position: "end",
    }),
});

export type ConversionConfig = z.infer<typeof conversionConfigSchema>;

export function readConversionConfig(raw: unknown): ConversionConfig {
  const parsed = conversionConfigSchema.safeParse(raw ?? {});
  return parsed.success ? parsed.data : conversionConfigSchema.parse({});
}

/** A real recent order, reduced to what is safe to show publicly. */
export type RecentPurchase = {
  firstName: string | null;
  productName: string;
  productImage: string | null;
  productSlug: string;
  createdAt: string;
};

/** wa.me wants international digits only: 01xxxxxxxxx → 201xxxxxxxxx. */
export function toWhatsAppDigits(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (/^01\d{9}$/.test(digits)) return `2${digits}`;
  if (/^00/.test(digits)) return digits.slice(2);
  return digits;
}
