import {
  PAYMENT_METHODS,
  type PaymentMethodKey,
} from "@/constants/welcome/payment-methods";

type StorePaymentSettingsLike = {
  cashOnDeliveryEnabled?: boolean | null;
  vodafoneCashEnabled?: boolean | null;
  instapayEnabled?: boolean | null;
  bankTransferEnabled?: boolean | null;
  kashierEnabled?: boolean | null;
  kashierMerchantId?: string | null;
  kashierApiKeyEncrypted?: string | null;
  kashierAllowedMethods?: string[] | null;
} | null;

const paymentMethodKeys = new Set(PAYMENT_METHODS.map((method) => method.key));

export function isPaymentMethodKey(value: string): value is PaymentMethodKey {
  return paymentMethodKeys.has(value as PaymentMethodKey);
}

function uniquePaymentMethods(methods: PaymentMethodKey[]) {
  return methods.filter((method, index, arr) => arr.indexOf(method) === index);
}

export function resolveEnabledPaymentMethodKeys(input: {
  paymentMethods?: string[] | null;
  paymentSettings?: StorePaymentSettingsLike;
}): PaymentMethodKey[] {
  const settings = input.paymentSettings;

  if (settings) {
    const enabled: PaymentMethodKey[] = [];

    if (settings.cashOnDeliveryEnabled) enabled.push("cash_on_delivery");
    if (settings.vodafoneCashEnabled) enabled.push("vodafone_cash");
    if (settings.instapayEnabled) enabled.push("instapay");
    if (settings.bankTransferEnabled) enabled.push("bank_transfer");

    const hasUsableKashierCredentials = Boolean(
      settings.kashierMerchantId &&
        settings.kashierApiKeyEncrypted &&
        settings.kashierAllowedMethods?.length,
    );

    if (settings.kashierEnabled && hasUsableKashierCredentials) {
      enabled.push("kashier");
    }

    return uniquePaymentMethods(enabled);
  }

  const legacyMethods = (input.paymentMethods || []).filter(isPaymentMethodKey);

  // أول مرة للتاجر قبل ما يحفظ الصفحة الجديدة: خلي COD هو الافتراضي الآمن.
  return legacyMethods.length ? uniquePaymentMethods(legacyMethods) : ["cash_on_delivery"];
}
