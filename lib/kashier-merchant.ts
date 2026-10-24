import crypto from "crypto";

// Kashier is retired — only the callback verification for payments still in
// flight is left (app/api/payments/kashier/callback).

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

export function kashierAmountToPiasters(amount: string | null) {
  if (!amount) return null;

  const parsed = Number(amount);
  if (!Number.isFinite(parsed)) return null;

  return Math.round(parsed * 100);
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
