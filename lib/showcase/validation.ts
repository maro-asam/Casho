import { z } from "zod";
import { SHOWCASE_CATEGORY_KEYS } from "./catalog";

const webUrl = (message: string) =>
  z
    .string()
    .trim()
    .max(1000, "الرابط طويل جدًا")
    .refine((v) => {
      try {
        const u = new URL(v);
        return u.protocol === "https:" || u.protocol === "http:";
      } catch {
        return false;
      }
    }, message);

/**
 * One Casho example as the admin form sends it. With `storeSlug` the card is
 * tied to that store (its live address wins over `url`), so `url` may be empty.
 */
export const showcaseSiteSchema = z
  .object({
    name: z.string().trim().min(2, "اكتب اسم المتجر").max(60, "الحد الأقصى ٦٠ حرف"),
    category: z.enum(SHOWCASE_CATEGORY_KEYS as [string, ...string[]], { message: "اختار المجال" }),
    storeSlug: z
      .string()
      .trim()
      .toLowerCase()
      .max(63)
      .optional()
      .transform((v) => v || null),
    url: z.union([z.literal(""), webUrl("اكتب رابط كامل يبدأ بـ https://")]).optional().transform((v) => v || null),
    imageUrl: webUrl("ارفع صورة أو حط رابط صورة"),
    published: z.boolean().default(true),
  })
  .refine((v) => v.storeSlug || v.url, { message: "اربطه بمتجر على كاشو أو اكتب رابط الموقع", path: ["url"] });

export type ShowcaseSiteInput = z.input<typeof showcaseSiteSchema>;
export type ShowcaseSiteData = z.output<typeof showcaseSiteSchema>;

export function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
