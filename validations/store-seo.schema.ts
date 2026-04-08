import { z } from "zod";

export const storeSeoSchema = z.object({
  seoTitle: z
    .string()
    .trim()
    .max(70, "عنوان الـ SEO لازم يكون أقل من 70 حرف")
    .optional()
    .or(z.literal("")),
  seoDescription: z
    .string()
    .trim()
    .max(160, "وصف الـ SEO لازم يكون أقل من 160 حرف")
    .optional()
    .or(z.literal("")),
  seoKeywords: z
    .string()
    .trim()
    .max(300, "الكلمات المفتاحية كتير زيادة")
    .optional()
    .or(z.literal("")),
  ogTitle: z
    .string()
    .trim()
    .max(70, "عنوان المشاركة لازم يكون أقل من 70 حرف")
    .optional()
    .or(z.literal("")),
  ogDescription: z
    .string()
    .trim()
    .max(200, "وصف المشاركة لازم يكون أقل من 200 حرف")
    .optional()
    .or(z.literal("")),
  ogImage: z
    .string()
    .trim()
    .url("رابط صورة المشاركة غير صحيح")
    .optional()
    .or(z.literal("")),
  isIndexed: z.boolean(),
});

export type StoreSeoInput = z.infer<typeof storeSeoSchema>;