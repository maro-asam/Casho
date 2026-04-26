import crypto from "crypto";

import type { KashierAllowedMethod } from "@/constants/welcome/payment-methods";

export type KashierCheckoutMode = "test" | "live";

const KASHIER_CALLBACK_FIELDS = [
  "paymentStatus",
  "cardDataToken",
  "maskedCard",
  "merchantOrderId",
  "orderId",
  "cardBrand",
  "orderReference",
  "transactionId",
  "amount",
  "currency",
] as const;

export function piastersToKashierAmount(amountInPiasters: number) {
  if (!Number.isInteger(amountInPiasters) || amountInPiasters <= 0) {
    throw new Error("Invalid Kashier amount");
  }

  return (amountInPiasters / 100).toFixed(2);
}

export function kashierAmountToPiasters(amount: string | null) {
  if (!amount) return null;

  const parsed = Number(amount);
  if (!Number.isFinite(parsed)) return null;

  return Math.round(parsed * 100);
}

export function generateKashierOrderHash(input: {
  merchantId: string;
  orderId: string;
  amount: string;
  currency: string;
  paymentApiKey: string;
}) {
  const path = `/?payment=${input.merchantId}.${input.orderId}.${input.amount}.${input.currency}`;

  return crypto
    .createHmac("sha256", input.paymentApiKey)
    .update(path)
    .digest("hex");
}

export function createMerchantKashierHppUrl(input: {
  checkoutUrl?: string;
  merchantId: string;
  paymentApiKey: string;
  mode: KashierCheckoutMode;
  orderId: string;
  amountInPiasters: number;
  currency?: "EGP";
  merchantRedirect: string;
  allowedMethods: KashierAllowedMethod[];
  display?: "ar" | "en";
  metaData?: Record<string, string | number | boolean | null | undefined>;
  brandColor?: string;
}) {
  const checkoutUrl = input.checkoutUrl || "https://checkout.kashier.io";
  const currency = input.currency || "EGP";
  const amount = piastersToKashierAmount(input.amountInPiasters);

  const hash = generateKashierOrderHash({
    merchantId: input.merchantId,
    orderId: input.orderId,
    amount,
    currency,
    paymentApiKey: input.paymentApiKey,
  });

  const params = new URLSearchParams({
    merchantId: input.merchantId,
    orderId: input.orderId,
    amount,
    currency,
    hash,
    merchantRedirect: input.merchantRedirect,
    allowedMethods: input.allowedMethods.join(","),
    failureRedirect: "true",
    redirectMethod: "get",
    display: input.display || "ar",
    mode: input.mode,
  });

  if (input.brandColor) {
    params.set("brandColor", input.brandColor);
  }

  if (input.metaData) {
    const cleanedMetaData = Object.fromEntries(
      Object.entries(input.metaData).filter(([, value]) => value != null),
    );

    params.set("metaData", JSON.stringify(cleanedMetaData));
  }

  return `${checkoutUrl}?${params.toString()}`;
}

function safeCompareHex(a: string, b: string) {
  try {
    const bufferA = Buffer.from(a, "hex");
    const bufferB = Buffer.from(b, "hex");

    if (bufferA.length !== bufferB.length) return false;

    return crypto.timingSafeEqual(bufferA, bufferB);
  } catch {
    return false;
  }
}

export function verifyMerchantKashierCallbackSignature(
  params: URLSearchParams,
  paymentApiKey: string,
) {
  const receivedSignature = params.get("signature");

  if (!receivedSignature) return false;

  const fixedQueryString = KASHIER_CALLBACK_FIELDS.map((key) => {
    return `${key}=${params.get(key) ?? ""}`;
  }).join("&");

  const expectedFixedSignature = crypto
    .createHmac("sha256", paymentApiKey)
    .update(fixedQueryString)
    .digest("hex");

  if (safeCompareHex(expectedFixedSignature, receivedSignature)) {
    return true;
  }

  // Fallback لأن بعض callbacks ممكن تبعت fields زيادة/ناقصة حسب طريقة الدفع.
  const dynamicQueryString = Array.from(params.entries())
    .filter(([key]) => key !== "signature" && key !== "mode")
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  const expectedDynamicSignature = crypto
    .createHmac("sha256", paymentApiKey)
    .update(dynamicQueryString)
    .digest("hex");

  return safeCompareHex(expectedDynamicSignature, receivedSignature);
}

export function isKashierPaid(params: URLSearchParams) {
  const status = (params.get("paymentStatus") || params.get("status") || "")
    .trim()
    .toLowerCase();

  return ["success", "paid", "captured", "approved"].includes(status);
}
