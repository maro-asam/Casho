import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "كلمة المرور لازم تكون 8 أحرف على الأقل")
  .max(100, "كلمة المرور طويلة جدًا");

const egyptianPhoneSchema = z
  .string()
  .trim()
  .min(1, "رقم الموبايل مطلوب")
  .regex(/^(010|011|012|015)\d{8}$/, "رقم الموبايل غير صحيح");

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "البريد الإلكتروني مطلوب")
    .email("البريد الإلكتروني غير صحيح")
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export const registerSchema = z
  .object({
    storeName: z
      .string()
      .trim()
      .min(2, "اسم المتجر قصير جدًا")
      .max(60, "اسم المتجر طويل جدًا"),

    email: z
      .string()
      .trim()
      .min(1, "البريد الإلكتروني مطلوب")
      .email("البريد الإلكتروني غير صحيح")
      .transform((value) => value.toLowerCase()),

    phoneNumber: egyptianPhoneSchema,

    password: passwordSchema,

    confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "البريد الإلكتروني مطلوب")
    .email("البريد الإلكتروني غير صحيح"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "الرابط غير صالح"),
    password: z.string().min(6, "كلمة المرور لازم تكون 6 أحرف على الأقل"),
    confirmPassword: z.string().min(6, "تأكيد كلمة المرور مطلوب"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "تأكيد كلمة المرور غير مطابق",
  });
