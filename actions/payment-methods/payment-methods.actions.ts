"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret, maskSecret } from "@/lib/secrets";
import { createMerchantKashierHppUrl } from "@/lib/kashier-merchant";
import {
  PAYMENT_METHODS,
  KASHIER_ALLOWED_METHODS,
  type KashierAllowedMethod,
  type PaymentMethodKey,
} from "@/constants/welcome/payment-methods";

const kashierAllowedKeys = KASHIER_ALLOWED_METHODS.map((m) => m.key) as [KashierAllowedMethod, ...KashierAllowedMethod[]];
const manualPaymentMethodKeys = PAYMENT_METHODS.filter((method) => method.manual).map((method) => method.key);

export type ManualPaymentDetails = Record<string, string>;

export type PaymentMethodsSettingsData = {
  storeId: string;
  storeName: string;
  storeSlug: string;

  /** Ordered — the first one is preselected at checkout. */
  enabledPaymentMethods: PaymentMethodKey[];
  manualPaymentDetails: ManualPaymentDetails;

  kashierEnabled: boolean;
  kashierMode: "TEST" | "LIVE";
  kashierMerchantId: string;
  kashierApiKeyHint: string | null;
  kashierAllowedMethods: KashierAllowedMethod[];
};

function isPaymentMethodKey(value: string): value is PaymentMethodKey {
  return PAYMENT_METHODS.some((method) => method.key === value);
}

function isKashierAllowedMethod(value: string): value is KashierAllowedMethod {
  return KASHIER_ALLOWED_METHODS.some((method) => method.key === value);
}

function normalizeEnabledPaymentMethods(paymentMethods: string[] | null | undefined): PaymentMethodKey[] {
  const normalized = [...new Set((paymentMethods ?? []).filter(isPaymentMethodKey))];
  return normalized.length > 0 ? normalized : ["cash_on_delivery"];
}

function normalizeManualPaymentDetails(value: unknown): ManualPaymentDetails {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const details: ManualPaymentDetails = {};
  for (const [key, rawValue] of Object.entries(value)) {
    if (typeof rawValue === "string") details[key] = rawValue;
  }
  return details;
}

function emptyToNull(value?: string | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length ? trimmed : null;
}

function revalidateStorePayments(slug: string) {
  revalidatePath("/dashboard/payment-methods");
  revalidatePath(`/store/${slug}`, "layout");
}

async function getOwnedStore() {
  const userId = await requireUserId();
  return prisma.store.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      paymentMethods: true,
      settings: { select: { primaryColor: true } },
      storePaymentSettings: {
        select: {
          enabledPaymentMethods: true,
          manualPaymentDetails: true,
          vodafoneCashNumber: true,
          instapayAddress: true,
          bankTransferDetails: true,
          kashierEnabled: true,
          kashierMode: true,
          kashierMerchantId: true,
          kashierApiKeyEncrypted: true,
          kashierApiKeyHint: true,
          kashierAllowedMethods: true,
        },
      },
    },
  });
}

export async function GetPaymentMethodsSettingsAction(): Promise<PaymentMethodsSettingsData> {
  const store = await getOwnedStore();
  if (!store) redirect("/");

  const settings = store.storePaymentSettings;
  const enabledPaymentMethods = normalizeEnabledPaymentMethods(
    settings?.enabledPaymentMethods?.length ? settings.enabledPaymentMethods : store.paymentMethods,
  );

  // Legacy columns predate the JSON map — fold them in so nothing typed before is lost.
  const manualPaymentDetails = normalizeManualPaymentDetails(settings?.manualPaymentDetails);
  if (settings?.vodafoneCashNumber && !manualPaymentDetails.vodafone_cash) manualPaymentDetails.vodafone_cash = settings.vodafoneCashNumber;
  if (settings?.instapayAddress && !manualPaymentDetails.instapay) manualPaymentDetails.instapay = settings.instapayAddress;
  if (settings?.bankTransferDetails && !manualPaymentDetails.bank_transfer) manualPaymentDetails.bank_transfer = settings.bankTransferDetails;

  const allowed = (settings?.kashierAllowedMethods ?? []).filter(isKashierAllowedMethod);

  return {
    storeId: store.id,
    storeName: store.name,
    storeSlug: store.slug,
    enabledPaymentMethods,
    manualPaymentDetails,
    kashierEnabled: enabledPaymentMethods.includes("kashier"),
    kashierMode: settings?.kashierMode ?? "TEST",
    kashierMerchantId: settings?.kashierMerchantId ?? "",
    kashierApiKeyHint: settings?.kashierApiKeyEncrypted ? (settings.kashierApiKeyHint ?? "••••") : null,
    kashierAllowedMethods: allowed.length ? allowed : ["card", "wallet"],
  };
}

/** Methods shown at checkout, in the merchant's order (first = preselected). */
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
          kashierAllowedMethods: true,
        },
      },
    },
  });

  if (!store) return [];
  const s = store.storePaymentSettings;
  const enabledKeys = normalizeEnabledPaymentMethods(s?.enabledPaymentMethods?.length ? s.enabledPaymentMethods : store.paymentMethods);
  const kashierUsable = Boolean(s?.kashierEnabled && s.kashierMerchantId && s.kashierApiKeyEncrypted && s.kashierAllowedMethods.some(isKashierAllowedMethod));

  return enabledKeys
    .filter((key) => key !== "kashier" || kashierUsable)
    .map((key) => PAYMENT_METHODS.find((m) => m.key === key)!)
    .map((method) => ({ key: method.key, label: method.label }));
}

// ─── Mutations — each change saves on its own ─────────────────────────────

export type PaymentActionResult = {
  success: boolean;
  message: string;
  errors?: Record<string, string>;
  /** The method can't be turned on before it's set up — open its setup panel. */
  needsSetup?: boolean;
};

type OwnedStore = NonNullable<Awaited<ReturnType<typeof getOwnedStore>>>;

function currentEnabled(store: OwnedStore) {
  return normalizeEnabledPaymentMethods(store.storePaymentSettings?.enabledPaymentMethods?.length ? store.storePaymentSettings.enabledPaymentMethods : store.paymentMethods);
}

function currentDetails(store: OwnedStore) {
  const s = store.storePaymentSettings;
  const details = normalizeManualPaymentDetails(s?.manualPaymentDetails);
  if (s?.vodafoneCashNumber && !details.vodafone_cash) details.vodafone_cash = s.vodafoneCashNumber;
  if (s?.instapayAddress && !details.instapay) details.instapay = s.instapayAddress;
  if (s?.bankTransferDetails && !details.bank_transfer) details.bank_transfer = s.bankTransferDetails;
  return details;
}

const kashierReady = (store: OwnedStore) =>
  Boolean(store.storePaymentSettings?.kashierMerchantId && store.storePaymentSettings.kashierApiKeyEncrypted && store.storePaymentSettings.kashierAllowedMethods.length);

/** Writes the enabled list + details and keeps the legacy per-method columns in sync. */
async function writeSettings(
  store: OwnedStore,
  enabled: PaymentMethodKey[],
  details: ManualPaymentDetails,
  extra: Record<string, unknown> = {},
) {
  const fields = {
    enabledPaymentMethods: enabled,
    manualPaymentDetails: details,
    cashOnDeliveryEnabled: enabled.includes("cash_on_delivery"),
    vodafoneCashEnabled: enabled.includes("vodafone_cash"),
    vodafoneCashNumber: emptyToNull(details.vodafone_cash),
    instapayEnabled: enabled.includes("instapay"),
    instapayAddress: emptyToNull(details.instapay),
    bankTransferEnabled: enabled.includes("bank_transfer"),
    bankTransferDetails: emptyToNull(details.bank_transfer),
    kashierEnabled: enabled.includes("kashier"),
    ...extra,
  };
  await prisma.$transaction([
    prisma.store.update({ where: { id: store.id }, data: { paymentMethods: enabled } }),
    prisma.storePaymentSettings.upsert({ where: { storeId: store.id }, update: fields, create: { storeId: store.id, ...fields } }),
  ]);
  revalidateStorePayments(store.slug);
}

export async function TogglePaymentMethodAction(key: string, on: boolean): Promise<PaymentActionResult> {
  try {
    if (!isPaymentMethodKey(key)) return { success: false, message: "طريقة دفع مش معروفة" };
    const store = await getOwnedStore();
    if (!store) return { success: false, message: "مش لاقيين متجرك" };

    const enabled = currentEnabled(store);
    const details = currentDetails(store);

    if (on) {
      if (key === "kashier" && !kashierReady(store)) return { success: false, needsSetup: true, message: "اربط حساب Kashier الأول" };
      if (manualPaymentMethodKeys.includes(key) && !details[key]?.trim())
        return { success: false, needsSetup: true, message: "اكتب البيانات اللي العميل هيحوّل عليها الأول" };
      if (!enabled.includes(key)) enabled.push(key);
    } else {
      if (enabled.length === 1 && enabled[0] === key) return { success: false, message: "لازم تسيب طريقة دفع واحدة على الأقل" };
      enabled.splice(enabled.indexOf(key), 1);
    }

    await writeSettings(store, enabled, details);
    const label = PAYMENT_METHODS.find((m) => m.key === key)?.label ?? key;
    return { success: true, message: on ? `${label} ظاهر دلوقتي في صفحة الدفع` : `${label} اتشال من صفحة الدفع` };
  } catch (error) {
    console.error("TogglePaymentMethodAction error:", error);
    return { success: false, message: "مقدرناش نحفظ. جرّب تاني." };
  }
}

export async function SaveManualMethodAction(key: string, value: string): Promise<PaymentActionResult> {
  try {
    if (!isPaymentMethodKey(key) || !manualPaymentMethodKeys.includes(key)) return { success: false, message: "طريقة دفع مش معروفة" };
    const text = value.trim();
    if (!text) return { success: false, message: "اكتب البيانات الأول", errors: { details: "اكتب البيانات اللي العميل هيحوّل عليها" } };
    if (text.length > 1000) return { success: false, message: "التعليمات طويلة أوي", errors: { details: "خليها أقل من ١٠٠٠ حرف" } };

    const store = await getOwnedStore();
    if (!store) return { success: false, message: "مش لاقيين متجرك" };

    const enabled = currentEnabled(store);
    const details = { ...currentDetails(store), [key]: text };
    if (!enabled.includes(key)) enabled.push(key);

    await writeSettings(store, enabled, details);
    return { success: true, message: "اتحفظ وظاهر في صفحة الدفع" };
  } catch (error) {
    console.error("SaveManualMethodAction error:", error);
    return { success: false, message: "مقدرناش نحفظ. جرّب تاني." };
  }
}

const kashierSchema = z.object({
  merchantId: z.string().trim().min(1, "اكتب الـ Merchant ID").max(80, "Merchant ID طويل أوي"),
  apiKey: z.string().trim().max(500, "API Key طويل أوي").optional(),
  allowedMethods: z.array(z.enum(kashierAllowedKeys)).min(1, "اختار طريقة واحدة على الأقل"),
  mode: z.enum(["TEST", "LIVE"]),
});

export async function SaveKashierAction(input: z.input<typeof kashierSchema>): Promise<PaymentActionResult> {
  try {
    const parsed = kashierSchema.safeParse(input);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
      return { success: false, message: "في بيانات ناقصة", errors };
    }

    const store = await getOwnedStore();
    if (!store) return { success: false, message: "مش لاقيين متجرك" };

    const data = parsed.data;
    if (!data.apiKey && !store.storePaymentSettings?.kashierApiKeyEncrypted) {
      return { success: false, message: "محتاجين الـ API Key", errors: { apiKey: "الصق الـ Payment API Key" } };
    }

    const enabled = currentEnabled(store);
    if (!enabled.includes("kashier")) enabled.unshift("kashier");

    await writeSettings(store, enabled, currentDetails(store), {
      kashierMode: data.mode,
      kashierMerchantId: data.merchantId,
      kashierAllowedMethods: data.allowedMethods,
      ...(data.apiKey && { kashierApiKeyEncrypted: encryptSecret(data.apiKey), kashierApiKeyHint: maskSecret(data.apiKey) }),
    });

    return {
      success: true,
      message: data.mode === "LIVE" ? "Kashier شغال — عملاءك يقدروا يدفعوا أونلاين" : "اتحفظ في وضع التجربة — جرّب عملية دفع وبعدها حوّل للايف",
    };
  } catch (error) {
    console.error("SaveKashierAction error:", error);
    return { success: false, message: "مقدرناش نحفظ. جرّب تاني." };
  }
}

export async function ReorderPaymentMethodsAction(keys: string[]): Promise<PaymentActionResult> {
  try {
    const store = await getOwnedStore();
    if (!store) return { success: false, message: "مش لاقيين متجرك" };

    const enabled = currentEnabled(store);
    const ordered = keys.filter((k): k is PaymentMethodKey => isPaymentMethodKey(k) && enabled.includes(k));
    // Anything enabled but missing from the request keeps its place at the end.
    const next = [...new Set([...ordered, ...enabled])];

    await writeSettings(store, next, currentDetails(store));
    return { success: true, message: "الترتيب اتحفظ" };
  } catch (error) {
    console.error("ReorderPaymentMethodsAction error:", error);
    return { success: false, message: "مقدرناش نحفظ الترتيب" };
  }
}

/** Removes the Kashier credentials entirely and takes it off checkout. */
export async function DisconnectKashierAction(): Promise<PaymentActionResult> {
  try {
    const store = await getOwnedStore();
    if (!store) return { success: false, message: "مش لاقيين متجرك" };

    const current = normalizeEnabledPaymentMethods(store.storePaymentSettings?.enabledPaymentMethods ?? store.paymentMethods);
    const remaining = current.filter((k) => k !== "kashier");
    const enabled: PaymentMethodKey[] = remaining.length ? remaining : ["cash_on_delivery"];

    await prisma.$transaction([
      prisma.store.update({ where: { id: store.id }, data: { paymentMethods: enabled } }),
      prisma.storePaymentSettings.upsert({
        where: { storeId: store.id },
        update: {
          enabledPaymentMethods: enabled,
          cashOnDeliveryEnabled: enabled.includes("cash_on_delivery"),
          kashierEnabled: false,
          kashierMode: "TEST",
          kashierMerchantId: null,
          kashierApiKeyEncrypted: null,
          kashierApiKeyHint: null,
          kashierAllowedMethods: [],
        },
        create: { storeId: store.id, enabledPaymentMethods: enabled },
      }),
    ]);

    revalidateStorePayments(store.slug);
    return { success: true, message: "Kashier اتفصل ومش هيظهر في صفحة الدفع" };
  } catch (error) {
    console.error("DisconnectKashierAction error:", error);
    return { success: false, message: "مقدرناش نفصل Kashier. جرّب تاني." };
  }
}

/**
 * Opens a real 1 EGP Kashier checkout in TEST mode with the saved credentials.
 * The return route verifies Kashier's signature with the saved API key, so a
 * successful round trip proves both the Merchant ID and the key are right.
 */
export async function StartKashierTestPaymentAction(): Promise<{ success: true; url: string } | { success: false; message: string }> {
  try {
    const store = await getOwnedStore();
    const s = store?.storePaymentSettings;
    if (!store || !s?.kashierMerchantId || !s.kashierApiKeyEncrypted) {
      return { success: false, message: "احفظ الـ Merchant ID والـ API Key الأول" };
    }

    const appUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
    if (!appUrl) return { success: false, message: "التجربة مش متاحة دلوقتي. كلّم الدعم." };

    const allowed = s.kashierAllowedMethods.filter(isKashierAllowedMethod);
    const url = createMerchantKashierHppUrl({
      checkoutUrl: process.env.KASHIER_CHECKOUT_URL,
      merchantId: s.kashierMerchantId,
      paymentApiKey: decryptSecret(s.kashierApiKeyEncrypted),
      mode: "test",
      orderId: `kt_${store.id}_${Date.now()}`,
      amountInPiasters: 100,
      merchantRedirect: `${appUrl}/api/payments/kashier/test-return`,
      allowedMethods: allowed.length ? allowed : ["card"],
      display: "ar",
      brandColor: store.settings?.primaryColor ?? undefined,
    });
    return { success: true, url };
  } catch (error) {
    console.error("StartKashierTestPaymentAction error:", error);
    return { success: false, message: "مقدرناش نجهّز عملية التجربة. اتأكد من البيانات وجرّب تاني." };
  }
}
