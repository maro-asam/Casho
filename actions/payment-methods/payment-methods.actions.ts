"use server";

import { revalidatePath } from "next/cache";
import { revalidateStorefront } from "@/lib/store/storefront-cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret, maskSecret } from "@/lib/secrets";
import { PaymobError, createPaymobCheckout, paymobKeyMode, type PaymobMode } from "@/lib/paymob";
import { PAYMENT_METHODS, isAvailablePaymentMethod, type PaymentMethodKey } from "@/constants/welcome/payment-methods";

const manualPaymentMethodKeys = PAYMENT_METHODS.filter((method) => method.manual).map((method) => method.key);

export type ManualPaymentDetails = Record<string, string>;

export type PaymentMethodsSettingsData = {
  storeId: string;
  storeName: string;
  storeSlug: string;

  /** Ordered — the first one is preselected at checkout. */
  enabledPaymentMethods: PaymentMethodKey[];
  manualPaymentDetails: ManualPaymentDetails;

  paymob: {
    connected: boolean;
    /** From the saved keys' prefix. */
    mode: PaymobMode | null;
    secretKeyHint: string | null;
    publicKey: string;
    hasHmacSecret: boolean;
    cardIntegrationId: number | null;
    walletIntegrationId: number | null;
  };
};

// Retired methods (Kashier) silently drop out of every list.
const isPaymentMethodKey = isAvailablePaymentMethod;

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
  revalidateStorefront(slug);
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
          paymobSecretKeyEncrypted: true,
          paymobSecretKeyHint: true,
          paymobPublicKey: true,
          paymobHmacSecretEncrypted: true,
          paymobCardIntegrationId: true,
          paymobWalletIntegrationId: true,
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

  return {
    storeId: store.id,
    storeName: store.name,
    storeSlug: store.slug,
    enabledPaymentMethods,
    manualPaymentDetails,
    paymob: {
      connected: paymobReady(settings),
      mode: settings?.paymobPublicKey ? paymobKeyMode(settings.paymobPublicKey, "public") : null,
      secretKeyHint: settings?.paymobSecretKeyEncrypted ? (settings.paymobSecretKeyHint ?? "••••") : null,
      publicKey: settings?.paymobPublicKey ?? "",
      hasHmacSecret: Boolean(settings?.paymobHmacSecretEncrypted),
      cardIntegrationId: settings?.paymobCardIntegrationId ?? null,
      walletIntegrationId: settings?.paymobWalletIntegrationId ?? null,
    },
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
          paymobSecretKeyEncrypted: true,
          paymobPublicKey: true,
          paymobHmacSecretEncrypted: true,
          paymobCardIntegrationId: true,
          paymobWalletIntegrationId: true,
        },
      },
    },
  });

  if (!store) return [];
  const s = store.storePaymentSettings;
  const enabledKeys = normalizeEnabledPaymentMethods(s?.enabledPaymentMethods?.length ? s.enabledPaymentMethods : store.paymentMethods);

  return enabledKeys
    .filter((key) => key !== "paymob" || paymobReady(s))
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

type PaymobColumns = {
  paymobSecretKeyEncrypted: string | null;
  paymobPublicKey: string | null;
  paymobHmacSecretEncrypted: string | null;
  paymobCardIntegrationId: number | null;
  paymobWalletIntegrationId: number | null;
};

/** Every piece a checkout + its callback needs is saved. */
function paymobReady(s: PaymobColumns | null | undefined) {
  return Boolean(
    s?.paymobSecretKeyEncrypted && s.paymobPublicKey && s.paymobHmacSecretEncrypted && (s.paymobCardIntegrationId || s.paymobWalletIntegrationId),
  );
}

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
    paymobEnabled: enabled.includes("paymob"),
    // Kashier is retired; saving anything turns it off for good.
    kashierEnabled: false,
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
      if (key === "paymob" && !paymobReady(store.storePaymentSettings)) return { success: false, needsSetup: true, message: "اربط حساب Paymob الأول" };
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

const integrationId = z
  .string()
  .trim()
  .regex(/^\d{1,12}$/, "رقم الـ Integration ID أرقام بس")
  .transform(Number)
  .optional()
  .or(z.literal("").transform(() => undefined));

const paymobSchema = z.object({
  secretKey: z.string().trim().max(300, "المفتاح طويل أوي").optional(),
  publicKey: z.string().trim().min(1, "الصق الـ Public Key").max(300, "المفتاح طويل أوي"),
  hmacSecret: z.string().trim().max(300, "الـ HMAC طويل أوي").optional(),
  cardIntegrationId: integrationId,
  walletIntegrationId: integrationId,
});

/**
 * Saves the merchant's Paymob keys. Before anything is stored we open (and
 * abandon) a real payment intention with them — nothing is charged, but it
 * proves the secret key and integration ids work together.
 */
export async function SavePaymobAction(input: z.input<typeof paymobSchema>): Promise<PaymentActionResult> {
  try {
    const parsed = paymobSchema.safeParse(input);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
      return { success: false, message: "في بيانات ناقصة", errors };
    }

    const store = await getOwnedStore();
    if (!store) return { success: false, message: "مش لاقيين متجرك" };
    const saved = store.storePaymentSettings;
    const data = parsed.data;

    let secretKey: string;
    try {
      secretKey = data.secretKey || (saved?.paymobSecretKeyEncrypted ? decryptSecret(saved.paymobSecretKeyEncrypted) : "");
    } catch {
      secretKey = "";
    }
    if (!secretKey) return { success: false, message: "محتاجين الـ Secret Key", errors: { secretKey: "الصق الـ Secret Key" } };
    if (!data.hmacSecret && !saved?.paymobHmacSecretEncrypted) {
      return { success: false, message: "محتاجين الـ HMAC", errors: { hmacSecret: "الصق الـ HMAC Secret" } };
    }

    const secretMode = paymobKeyMode(secretKey, "secret");
    const publicMode = paymobKeyMode(data.publicKey, "public");
    if (!secretMode) return { success: false, message: "الـ Secret Key مش شكله صح", errors: { secretKey: "بيبدأ بـ egy_sk_live_ أو egy_sk_test_" } };
    if (!publicMode) return { success: false, message: "الـ Public Key مش شكله صح", errors: { publicKey: "بيبدأ بـ egy_pk_live_ أو egy_pk_test_" } };
    if (secretMode !== publicMode) {
      return { success: false, message: "المفتاحين مش من نفس الوضع", errors: { publicKey: "واحد تجربة (test) والتاني لايف (live) — خدهم الاتنين من نفس الصفحة" } };
    }

    const integrationIds = [data.cardIntegrationId, data.walletIntegrationId].filter((id): id is number => !!id);
    if (!integrationIds.length) {
      return { success: false, message: "محتاجين Integration ID واحد على الأقل", errors: { cardIntegrationId: "حط رقم الكروت أو المحافظ (أو الاتنين)" } };
    }

    // One check per id: Paymob silently drops an unknown id when it's sent
    // alongside a valid one, and that method would just never show up.
    const checks = [
      ["cardIntegrationId", data.cardIntegrationId],
      ["walletIntegrationId", data.walletIntegrationId],
    ] as const;
    for (const [field, id] of checks) {
      if (!id) continue;
      try {
        await createPaymobCheckout(
          { secretKey, publicKey: data.publicKey, integrationIds: [id] },
          {
            amountCents: 1000,
            items: [{ name: "Casho connection check", amountCents: 1000, quantity: 1 }],
            billing: { firstName: store.name, phone: "+201000000000" },
          },
        );
      } catch (error) {
        const status = error instanceof PaymobError ? error.status : undefined;
        if (status === 401 || status === 403) {
          return { success: false, message: "Paymob رفض الـ Secret Key", errors: { secretKey: "المفتاح ده مش شغال — انسخه تاني من API Keys" } };
        }
        if (status === 404) {
          return {
            success: false,
            message: "Paymob مش لاقي رقم الـ Integration ده",
            errors: { [field]: "الرقم ده مش موجود أو مش متفعّل على حسابك في نفس الوضع (test/live)" },
          };
        }
        return {
          success: false,
          message:
            status !== undefined && status < 500
              ? "Paymob رفض البيانات — اتأكد من الـ Secret Key وأرقام الـ Integration ID وإنهم من نفس الوضع (test/live)."
              : "مقدرناش نوصل لـ Paymob دلوقتي. جرّب كمان شوية.",
        };
      }
    }

    const enabled = currentEnabled(store);
    if (!enabled.includes("paymob")) enabled.unshift("paymob");

    await writeSettings(store, enabled, currentDetails(store), {
      paymobPublicKey: data.publicKey,
      paymobCardIntegrationId: data.cardIntegrationId ?? null,
      paymobWalletIntegrationId: data.walletIntegrationId ?? null,
      ...(data.secretKey && { paymobSecretKeyEncrypted: encryptSecret(data.secretKey), paymobSecretKeyHint: maskSecret(data.secretKey) }),
      ...(data.hmacSecret && { paymobHmacSecretEncrypted: encryptSecret(data.hmacSecret) }),
    });

    return {
      success: true,
      message: secretMode === "live" ? "Paymob شغال — عملاءك يقدروا يدفعوا بالكارت والمحفظة" : "اتربط في وضع التجربة — لما تجهز حط مفاتيح الـ live",
    };
  } catch (error) {
    console.error("SavePaymobAction error:", error);
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

/** Removes the Paymob keys entirely and takes it off checkout. */
export async function DisconnectPaymobAction(): Promise<PaymentActionResult> {
  try {
    const store = await getOwnedStore();
    if (!store) return { success: false, message: "مش لاقيين متجرك" };

    const remaining = currentEnabled(store).filter((k) => k !== "paymob");
    const enabled: PaymentMethodKey[] = remaining.length ? remaining : ["cash_on_delivery"];

    await writeSettings(store, enabled, currentDetails(store), {
      paymobSecretKeyEncrypted: null,
      paymobSecretKeyHint: null,
      paymobPublicKey: null,
      paymobHmacSecretEncrypted: null,
      paymobCardIntegrationId: null,
      paymobWalletIntegrationId: null,
    });
    return { success: true, message: "Paymob اتفصل ومش هيظهر في صفحة الدفع" };
  } catch (error) {
    console.error("DisconnectPaymobAction error:", error);
    return { success: false, message: "مقدرناش نفصل Paymob. جرّب تاني." };
  }
}
