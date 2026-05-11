"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { prisma } from "@/lib/prisma";
import { encryptSecret, maskSecret } from "@/lib/secrets";
import {
  PAYMENT_METHODS,
  KASHIER_ALLOWED_METHODS,
  type KashierAllowedMethod,
  type PaymentMethodKey,
} from "@/constants/welcome/payment-methods";

const kashierAllowedMethodValues = [
  "card",
  "wallet",
  "bank_installments",
] as const;

const paymentMethodKeys = PAYMENT_METHODS.map((method) => method.key) as [
  PaymentMethodKey,
  ...PaymentMethodKey[],
];

const manualPaymentMethodKeys = PAYMENT_METHODS.filter(
  (method) => method.manual,
).map((method) => method.key);

const paymentMethodsSettingsSchema = z
  .object({
    storeId: z.string().min(1, "معرف المتجر مطلوب"),

    enabledPaymentMethods: z
      .array(z.enum(paymentMethodKeys))
      .min(1, "فعّل طريقة دفع واحدة على الأقل"),

    manualPaymentDetails: z.record(z.string(), z.string()).default({}),

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
    const kashierSelected = data.enabledPaymentMethods.includes("kashier");

    if (kashierSelected && !data.kashierMerchantId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["kashierMerchantId"],
        message: "Merchant ID مطلوب لتفعيل Kashier",
      });
    }

    if (kashierSelected && data.kashierAllowedMethods.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["kashierAllowedMethods"],
        message: "اختار طريقة واحدة على الأقل داخل Kashier",
      });
    }

    for (const methodKey of data.enabledPaymentMethods) {
      if (!manualPaymentMethodKeys.includes(methodKey)) continue;

      const value = data.manualPaymentDetails[methodKey]?.trim();

      if (!value) {
        const method = PAYMENT_METHODS.find((item) => item.key === methodKey);

        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [`manual_${methodKey}`],
          message: `اكتب بيانات التحويل الخاصة بـ ${
            method?.label ?? methodKey
          }`,
        });
      }
    }
  });

export type PaymentMethodsFormState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

export type ManualPaymentDetails = Record<string, string>;

export type PaymentMethodsSettingsData = {
  storeId: string;
  storeName: string;
  storeSlug: string;

  enabledPaymentMethods: PaymentMethodKey[];
  manualPaymentDetails: ManualPaymentDetails;

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

function emptyToNull(value?: string) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length ? trimmed : null;
}

function isPaymentMethodKey(value: string): value is PaymentMethodKey {
  return PAYMENT_METHODS.some((method) => method.key === value);
}

function isKashierAllowedMethod(value: string): value is KashierAllowedMethod {
  return KASHIER_ALLOWED_METHODS.some((method) => method.key === value);
}

function getEnabledPaymentMethods(formData: FormData): PaymentMethodKey[] {
  return formData
    .getAll("enabledPaymentMethods")
    .map(String)
    .filter(isPaymentMethodKey);
}

function getManualPaymentDetails(formData: FormData): ManualPaymentDetails {
  const details: ManualPaymentDetails = {};

  for (const method of PAYMENT_METHODS) {
    if (!method.manual) continue;

    const value = formString(formData, `manual_${method.key}`);

    if (value) {
      details[method.key] = value;
    }
  }

  return details;
}

function normalizeManualPaymentDetails(value: unknown): ManualPaymentDetails {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const details: ManualPaymentDetails = {};

  for (const [key, rawValue] of Object.entries(value)) {
    if (typeof rawValue === "string") {
      details[key] = rawValue;
    }
  }

  return details;
}

function normalizeEnabledPaymentMethods(
  paymentMethods: string[] | null | undefined,
): PaymentMethodKey[] {
  const normalized = (paymentMethods ?? []).filter(isPaymentMethodKey);

  if (normalized.length > 0) {
    return normalized;
  }

  return ["cash_on_delivery"];
}

function getDefaultKashierAllowedMethods(
  methods: string[] | null | undefined,
): KashierAllowedMethod[] {
  const normalized = (methods ?? []).filter(isKashierAllowedMethod);

  if (normalized.length > 0) {
    return normalized;
  }

  return ["card", "wallet"];
}

function getManualValue(
  manualPaymentDetails: ManualPaymentDetails,
  key: PaymentMethodKey,
) {
  return emptyToNull(manualPaymentDetails[key]);
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
          enabledPaymentMethods: true,
          manualPaymentDetails: true,

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
          kashierAllowedMethods: true,
        },
      },
    },
  });

  if (!store) {
    redirect("/");
  }

  const settings = store.storePaymentSettings;

  const enabledPaymentMethods = normalizeEnabledPaymentMethods(
    settings?.enabledPaymentMethods?.length
      ? settings.enabledPaymentMethods
      : store.paymentMethods,
  );

  const manualPaymentDetails = normalizeManualPaymentDetails(
    settings?.manualPaymentDetails,
  );

  if (settings?.vodafoneCashNumber && !manualPaymentDetails.vodafone_cash) {
    manualPaymentDetails.vodafone_cash = settings.vodafoneCashNumber;
  }

  if (settings?.instapayAddress && !manualPaymentDetails.instapay) {
    manualPaymentDetails.instapay = settings.instapayAddress;
  }

  if (settings?.bankTransferDetails && !manualPaymentDetails.bank_transfer) {
    manualPaymentDetails.bank_transfer = settings.bankTransferDetails;
  }

  const kashierAllowedMethods = getDefaultKashierAllowedMethods(
    settings?.kashierAllowedMethods,
  );

  return {
    storeId: store.id,
    storeName: store.name,
    storeSlug: store.slug,

    enabledPaymentMethods,
    manualPaymentDetails,

    cashOnDeliveryEnabled: enabledPaymentMethods.includes("cash_on_delivery"),

    vodafoneCashEnabled: enabledPaymentMethods.includes("vodafone_cash"),
    vodafoneCashNumber:
      manualPaymentDetails.vodafone_cash ?? settings?.vodafoneCashNumber ?? "",

    instapayEnabled: enabledPaymentMethods.includes("instapay"),
    instapayAddress:
      manualPaymentDetails.instapay ?? settings?.instapayAddress ?? "",

    bankTransferEnabled: enabledPaymentMethods.includes("bank_transfer"),
    bankTransferDetails:
      manualPaymentDetails.bank_transfer ?? settings?.bankTransferDetails ?? "",

    kashierEnabled: enabledPaymentMethods.includes("kashier"),
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
          enabledPaymentMethods: true,
          kashierEnabled: true,
          kashierMerchantId: true,
          kashierApiKeyEncrypted: true,
        },
      },
    },
  });

  if (!store) return [];

  const enabledKeys = normalizeEnabledPaymentMethods(
    store.storePaymentSettings?.enabledPaymentMethods?.length
      ? store.storePaymentSettings.enabledPaymentMethods
      : store.paymentMethods,
  );

  return PAYMENT_METHODS.filter((method) => {
    if (!enabledKeys.includes(method.key)) return false;

    if (method.key !== "kashier") return true;

    return Boolean(
      store.storePaymentSettings?.kashierEnabled &&
      store.storePaymentSettings?.kashierMerchantId &&
      store.storePaymentSettings?.kashierApiKeyEncrypted,
    );
  }).map((method) => ({
    key: method.key,
    label: method.label,
  }));
}

export async function UpdatePaymentMethodsAction(
  _prevState: PaymentMethodsFormState | null,
  formData: FormData,
): Promise<PaymentMethodsFormState> {
  try {
    const enabledPaymentMethods = getEnabledPaymentMethods(formData);
    const manualPaymentDetails = getManualPaymentDetails(formData);

    const rawData = {
      storeId: formString(formData, "storeId"),
      enabledPaymentMethods,
      manualPaymentDetails,

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

    const kashierEnabled = data.enabledPaymentMethods.includes("kashier");

    const hasExistingKashierApiKey = Boolean(
      store.storePaymentSettings?.kashierApiKeyEncrypted,
    );

    if (kashierEnabled && !data.kashierApiKey && !hasExistingKashierApiKey) {
      return {
        success: false,
        message: "أضف Payment API Key أول مرة لتفعيل Kashier",
        errors: {
          kashierApiKey: ["Payment API Key مطلوب أول مرة لتفعيل Kashier"],
        },
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
          paymentMethods: data.enabledPaymentMethods,
        },
      });

      await tx.storePaymentSettings.upsert({
        where: { storeId: store.id },
        update: {
          enabledPaymentMethods: data.enabledPaymentMethods,
          manualPaymentDetails: data.manualPaymentDetails,

          cashOnDeliveryEnabled:
            data.enabledPaymentMethods.includes("cash_on_delivery"),

          vodafoneCashEnabled:
            data.enabledPaymentMethods.includes("vodafone_cash"),
          vodafoneCashNumber: getManualValue(
            data.manualPaymentDetails,
            "vodafone_cash",
          ),

          instapayEnabled: data.enabledPaymentMethods.includes("instapay"),
          instapayAddress: getManualValue(
            data.manualPaymentDetails,
            "instapay",
          ),

          bankTransferEnabled:
            data.enabledPaymentMethods.includes("bank_transfer"),
          bankTransferDetails: getManualValue(
            data.manualPaymentDetails,
            "bank_transfer",
          ),

          kashierEnabled,
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

          enabledPaymentMethods: data.enabledPaymentMethods,
          manualPaymentDetails: data.manualPaymentDetails,

          cashOnDeliveryEnabled:
            data.enabledPaymentMethods.includes("cash_on_delivery"),

          vodafoneCashEnabled:
            data.enabledPaymentMethods.includes("vodafone_cash"),
          vodafoneCashNumber: getManualValue(
            data.manualPaymentDetails,
            "vodafone_cash",
          ),

          instapayEnabled: data.enabledPaymentMethods.includes("instapay"),
          instapayAddress: getManualValue(
            data.manualPaymentDetails,
            "instapay",
          ),

          bankTransferEnabled:
            data.enabledPaymentMethods.includes("bank_transfer"),
          bankTransferDetails: getManualValue(
            data.manualPaymentDetails,
            "bank_transfer",
          ),

          kashierEnabled,
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
