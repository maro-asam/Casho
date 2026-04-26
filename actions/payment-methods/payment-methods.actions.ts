"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUserId } from "@/actions/auth/require-user-id.actions";

import { prisma } from "@/lib/prisma";
import { encryptSecret, maskSecret } from "@/lib/secrets";
import { resolveEnabledPaymentMethodKeys } from "@/lib/payment-methods";
import {
  PAYMENT_METHODS,
  KASHIER_ALLOWED_METHODS,
  KashierAllowedMethod,
  PaymentMethodKey,
} from "@/constants/welcome/payment-methods";

const kashierAllowedMethodValues = [
  "card",
  "wallet",
  "bank_installments",
] as const;

const paymentMethodsSettingsSchema = z
  .object({
    storeId: z.string().min(1, "معرف المتجر مطلوب"),

    cashOnDeliveryEnabled: z.boolean(),

    vodafoneCashEnabled: z.boolean(),
    vodafoneCashNumber: z
      .string()
      .trim()
      .max(30, "رقم فودافون كاش طويل جدًا")
      .optional(),

    instapayEnabled: z.boolean(),
    instapayAddress: z
      .string()
      .trim()
      .max(120, "بيانات إنستا باي طويلة جدًا")
      .optional(),

    bankTransferEnabled: z.boolean(),
    bankTransferDetails: z
      .string()
      .trim()
      .max(1200, "بيانات التحويل البنكي طويلة جدًا")
      .optional(),

    kashierEnabled: z.boolean(),
    kashierMode: z.enum(["TEST", "LIVE"]),
    kashierMerchantId: z
      .string()
      .trim()
      .max(80, "Merchant ID طويل جدًا")
      .optional(),
    kashierApiKey: z
      .string()
      .trim()
      .max(500, "Payment API Key طويل جدًا")
      .optional(),
    kashierAllowedMethods: z.array(z.enum(kashierAllowedMethodValues)),
  })
  .superRefine((data, ctx) => {
    const hasAnyMethod =
      data.cashOnDeliveryEnabled ||
      data.vodafoneCashEnabled ||
      data.instapayEnabled ||
      data.bankTransferEnabled ||
      data.kashierEnabled;

    if (!hasAnyMethod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["paymentMethods"],
        message: "فعّل طريقة دفع واحدة على الأقل",
      });
    }

    if (data.vodafoneCashEnabled && !data.vodafoneCashNumber?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["vodafoneCashNumber"],
        message: "اكتب رقم فودافون كاش الذي سيظهر للعميل",
      });
    }

    if (data.instapayEnabled && !data.instapayAddress?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["instapayAddress"],
        message: "اكتب عنوان/رقم InstaPay الذي سيظهر للعميل",
      });
    }

    if (data.bankTransferEnabled && !data.bankTransferDetails?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bankTransferDetails"],
        message: "اكتب بيانات الحساب البنكي التي ستظهر للعميل",
      });
    }

    if (data.kashierEnabled && !data.kashierMerchantId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["kashierMerchantId"],
        message: "Merchant ID مطلوب لتفعيل Kashier",
      });
    }

    if (data.kashierEnabled && data.kashierAllowedMethods.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["kashierAllowedMethods"],
        message: "اختار طريقة واحدة على الأقل داخل Kashier",
      });
    }
  });

export type PaymentMethodsFormState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

export type PaymentMethodsSettingsData = {
  storeId: string;
  storeName: string;
  storeSlug: string;
  enabledPaymentMethods: PaymentMethodKey[];

  cashOnDeliveryEnabled: boolean;

  vodafoneCashEnabled: boolean;
  vodafoneCashNumber: string;

  instapayEnabled: boolean;
  instapayAddress: string;

  bankTransferEnabled: boolean;
  bankTransferDetails: string;

  kashierEnabled: boolean;
  kashierMode: "TEST" | "LIVE";
  kashierMerchantId: string;
  kashierApiKeyHint: string | null;
  kashierAllowedMethods: KashierAllowedMethod[];
};

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function formChecked(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function emptyToNull(value?: string) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length ? trimmed : null;
}

function isKashierAllowedMethod(value: string): value is KashierAllowedMethod {
  return KASHIER_ALLOWED_METHODS.some((method) => method.key === value);
}

function buildEnabledPaymentMethods(data: {
  cashOnDeliveryEnabled: boolean;
  vodafoneCashEnabled: boolean;
  instapayEnabled: boolean;
  bankTransferEnabled: boolean;
  kashierEnabled: boolean;
}) {
  const methods: PaymentMethodKey[] = [];

  if (data.cashOnDeliveryEnabled) methods.push("cash_on_delivery");
  if (data.vodafoneCashEnabled) methods.push("vodafone_cash");
  if (data.instapayEnabled) methods.push("instapay");
  if (data.bankTransferEnabled) methods.push("bank_transfer");
  if (data.kashierEnabled) methods.push("kashier");

  return methods;
}

export async function GetPaymentMethodsSettingsAction(): Promise<PaymentMethodsSettingsData> {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: {
      id: true,
      name: true,
      slug: true,
      paymentMethods: true,
      storePaymentSettings: {
        select: {
          cashOnDeliveryEnabled: true,
          vodafoneCashEnabled: true,
          vodafoneCashNumber: true,
          instapayEnabled: true,
          instapayAddress: true,
          bankTransferEnabled: true,
          bankTransferDetails: true,
          kashierEnabled: true,
          kashierMode: true,
          kashierMerchantId: true,
          kashierApiKeyHint: true,
          kashierApiKeyEncrypted: true,
          kashierAllowedMethods: true,
        },
      },
    },
  });

  if (!store) {
    redirect("/");
  }

  const settings = store.storePaymentSettings;

  const enabledPaymentMethods = resolveEnabledPaymentMethodKeys({
    paymentMethods: store.paymentMethods,
    paymentSettings: settings,
  });

  const kashierAllowedMethods = (settings?.kashierAllowedMethods?.length
    ? settings.kashierAllowedMethods
    : ["card", "wallet"]
  ).filter(isKashierAllowedMethod);

  return {
    storeId: store.id,
    storeName: store.name,
    storeSlug: store.slug,
    enabledPaymentMethods,

    cashOnDeliveryEnabled:
      settings?.cashOnDeliveryEnabled ??
      enabledPaymentMethods.includes("cash_on_delivery"),

    vodafoneCashEnabled:
      settings?.vodafoneCashEnabled ??
      enabledPaymentMethods.includes("vodafone_cash"),
    vodafoneCashNumber: settings?.vodafoneCashNumber ?? "",

    instapayEnabled:
      settings?.instapayEnabled ?? enabledPaymentMethods.includes("instapay"),
    instapayAddress: settings?.instapayAddress ?? "",

    bankTransferEnabled:
      settings?.bankTransferEnabled ??
      enabledPaymentMethods.includes("bank_transfer"),
    bankTransferDetails: settings?.bankTransferDetails ?? "",

    kashierEnabled:
      settings?.kashierEnabled ?? enabledPaymentMethods.includes("kashier"),
    kashierMode: settings?.kashierMode ?? "TEST",
    kashierMerchantId: settings?.kashierMerchantId ?? "",
    kashierApiKeyHint: settings?.kashierApiKeyHint ?? null,
    kashierAllowedMethods,
  };
}

export async function GetStoreCheckoutPaymentMethodsAction(storeSlug: string) {
  const store = await prisma.store.findUnique({
    where: { slug: storeSlug },
    select: {
      paymentMethods: true,
      storePaymentSettings: {
        select: {
          cashOnDeliveryEnabled: true,
          vodafoneCashEnabled: true,
          instapayEnabled: true,
          bankTransferEnabled: true,
          kashierEnabled: true,
          kashierMerchantId: true,
          kashierApiKeyEncrypted: true,
          kashierAllowedMethods: true,
        },
      },
    },
  });

  if (!store) return [];

  const enabledKeys = resolveEnabledPaymentMethodKeys({
    paymentMethods: store.paymentMethods,
    paymentSettings: store.storePaymentSettings,
  });

  return PAYMENT_METHODS.filter((method) => enabledKeys.includes(method.key));
}

export async function UpdatePaymentMethodsAction(
  _prevState: PaymentMethodsFormState | null,
  formData: FormData,
): Promise<PaymentMethodsFormState> {
  try {
    const rawData = {
      storeId: formString(formData, "storeId"),

      cashOnDeliveryEnabled: formChecked(formData, "cashOnDeliveryEnabled"),

      vodafoneCashEnabled: formChecked(formData, "vodafoneCashEnabled"),
      vodafoneCashNumber: formString(formData, "vodafoneCashNumber"),

      instapayEnabled: formChecked(formData, "instapayEnabled"),
      instapayAddress: formString(formData, "instapayAddress"),

      bankTransferEnabled: formChecked(formData, "bankTransferEnabled"),
      bankTransferDetails: formString(formData, "bankTransferDetails"),

      kashierEnabled: formChecked(formData, "kashierEnabled"),
      kashierMode: formString(formData, "kashierMode") || "TEST",
      kashierMerchantId: formString(formData, "kashierMerchantId"),
      kashierApiKey: formString(formData, "kashierApiKey"),
      kashierAllowedMethods: formData
        .getAll("kashierAllowedMethods")
        .map(String),
    };

    const parsed = paymentMethodsSettingsSchema.safeParse(rawData);

    if (!parsed.success) {
      return {
        success: false,
        message: "راجع بيانات طرق الدفع",
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const userId = await requireUserId();
    const data = parsed.data;

    const store = await prisma.store.findFirst({
      where: {
        id: data.storeId,
        userId,
      },
      select: {
        id: true,
        slug: true,
        storePaymentSettings: {
          select: {
            kashierApiKeyEncrypted: true,
          },
        },
      },
    });

    if (!store) {
      return {
        success: false,
        message: "غير مصرح لك بتعديل إعدادات هذا المتجر",
      };
    }

    const hasExistingKashierApiKey = Boolean(
      store.storePaymentSettings?.kashierApiKeyEncrypted,
    );

    if (
      data.kashierEnabled &&
      !data.kashierApiKey &&
      !hasExistingKashierApiKey
    ) {
      return {
        success: false,
        message: "أضف Payment API Key أول مرة لتفعيل Kashier",
        errors: {
          kashierApiKey: ["Payment API Key مطلوب أول مرة لتفعيل Kashier"],
        },
      };
    }

    const enabledPaymentMethods = buildEnabledPaymentMethods(data);

    if (enabledPaymentMethods.length === 0) {
      return {
        success: false,
        message: "فعّل طريقة دفع واحدة على الأقل",
        errors: { paymentMethods: ["فعّل طريقة دفع واحدة على الأقل"] },
      };
    }

    const encryptedApiKey = data.kashierApiKey
      ? encryptSecret(data.kashierApiKey)
      : undefined;

    const apiKeyHint = data.kashierApiKey
      ? maskSecret(data.kashierApiKey)
      : undefined;

    await prisma.$transaction(async (tx) => {
      await tx.store.update({
        where: { id: store.id },
        data: {
          paymentMethods: enabledPaymentMethods,
        },
      });

      await tx.storePaymentSettings.upsert({
        where: { storeId: store.id },
        update: {
          cashOnDeliveryEnabled: data.cashOnDeliveryEnabled,

          vodafoneCashEnabled: data.vodafoneCashEnabled,
          vodafoneCashNumber: emptyToNull(data.vodafoneCashNumber),

          instapayEnabled: data.instapayEnabled,
          instapayAddress: emptyToNull(data.instapayAddress),

          bankTransferEnabled: data.bankTransferEnabled,
          bankTransferDetails: emptyToNull(data.bankTransferDetails),

          kashierEnabled: data.kashierEnabled,
          kashierMode: data.kashierMode,
          kashierMerchantId: emptyToNull(data.kashierMerchantId),
          kashierAllowedMethods: data.kashierAllowedMethods,
          ...(encryptedApiKey
            ? {
                kashierApiKeyEncrypted: encryptedApiKey,
                kashierApiKeyHint: apiKeyHint,
              }
            : {}),
        },
        create: {
          storeId: store.id,

          cashOnDeliveryEnabled: data.cashOnDeliveryEnabled,

          vodafoneCashEnabled: data.vodafoneCashEnabled,
          vodafoneCashNumber: emptyToNull(data.vodafoneCashNumber),

          instapayEnabled: data.instapayEnabled,
          instapayAddress: emptyToNull(data.instapayAddress),

          bankTransferEnabled: data.bankTransferEnabled,
          bankTransferDetails: emptyToNull(data.bankTransferDetails),

          kashierEnabled: data.kashierEnabled,
          kashierMode: data.kashierMode,
          kashierMerchantId: emptyToNull(data.kashierMerchantId),
          kashierAllowedMethods: data.kashierAllowedMethods,
          kashierApiKeyEncrypted: encryptedApiKey ?? null,
          kashierApiKeyHint: apiKeyHint ?? null,
        },
      });
    });

    revalidatePath("/dashboard/payment-methods");
    revalidatePath("/dashboard/payment-gateways");
    revalidatePath(`/store/${store.slug}`);
    revalidatePath(`/store/${store.slug}/checkout`);

    return {
      success: true,
      message: "تم حفظ طرق الدفع بنجاح",
    };
  } catch (error) {
    console.error("UpdatePaymentMethodsAction error:", error);

    return {
      success: false,
      message: "حدث خطأ أثناء حفظ طرق الدفع",
    };
  }
}