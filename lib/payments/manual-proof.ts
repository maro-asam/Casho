/**
 * Manual transfers at checkout (wallet, InstaPay, bank, Fawry…): the shopper
 * transfers first, then tells the store what they paid from and uploads a
 * screenshot, and only then is the order placed. Pure — shared by the checkout
 * page, CreateOrderAction, the order page and the merchant's order details.
 *
 * A method asks for proof only when the merchant gave transfer details for it;
 * without them there is nothing to transfer to, so it places the order as before.
 * The merchant decides which of the two is required (`proofRules`); the other
 * is still asked for, as optional.
 */
import { isManualPaymentMethod } from "@/constants/payment-methods";

export type ManualPaymentSettings = {
  manualPaymentDetails?: unknown;
  vodafoneCashNumber?: string | null;
  instapayAddress?: string | null;
  bankTransferDetails?: string | null;
  requireTransferPayer?: boolean | null;
  requireTransferScreenshot?: boolean | null;
} | null | undefined;

/** What a manual transfer must come with (StorePaymentSettings; both by default). */
export type ProofRules = { payer: boolean; screenshot: boolean };

export function proofRules(settings: ManualPaymentSettings): ProofRules {
  return { payer: settings?.requireTransferPayer ?? true, screenshot: settings?.requireTransferScreenshot ?? true };
}

/** Where the shopper sends the money for `method` (the merchant's number, address or account), or null. */
export function manualTransferDetail(method: string, settings: ManualPaymentSettings): string | null {
  const map = settings?.manualPaymentDetails;
  const fromMap = map && typeof map === "object" && !Array.isArray(map) ? (map as Record<string, unknown>)[method] : null;
  if (typeof fromMap === "string" && fromMap.trim()) return fromMap.trim();
  // Legacy columns, from before the per-method map existed.
  const legacy =
    method === "vodafone_cash"
      ? settings?.vodafoneCashNumber
      : method === "instapay"
        ? settings?.instapayAddress
        : method === "bank_transfer"
          ? settings?.bankTransferDetails
          : null;
  return legacy?.trim() || null;
}

/** The order goes through the transfer window ("paid from" + screenshot) before it's placed. */
export function needsPaymentProof(method: string, settings: ManualPaymentSettings): boolean {
  return isManualPaymentMethod(method) && manualTransferDetail(method, settings) !== null;
}

export const PAYER_MAX_LENGTH = 80;

/** What the shopper typed as "paid from", tidied — null when it's too short to find the transfer. */
export function normalizePayer(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.replace(/\s+/g, " ").trim().slice(0, PAYER_MAX_LENGTH);
  return value.replace(/\s/g, "").length >= 3 ? value : null;
}

/**
 * Server action bodies stop at 1 MB, so the browser shrinks the screenshot
 * first (lib/image-compress) and the server refuses anything bigger.
 */
export const PROOF_MAX_BYTES = 900 * 1024;

export const PROOF_FOLDER = "casho/uploads/payment-proofs";

/** A screenshot the server will send on to Cloudinary (an image, not empty, under the limit). */
export function isAcceptableProof(file: unknown): file is Blob {
  return (
    typeof Blob !== "undefined" &&
    file instanceof Blob &&
    file.size > 0 &&
    file.size <= PROOF_MAX_BYTES &&
    file.type.startsWith("image/") &&
    file.type !== "image/svg+xml"
  );
}

export type CheckedProof = { payer: string | null; image: Blob | null } | { error: string };

/**
 * What the shopper sent, against the store's rules: a required piece must be
 * there; an optional one is kept when it's usable. A screenshot that was sent
 * but can't be used is refused either way (better than silently dropping it).
 */
export function checkProof(rules: ProofRules, sent: { payer: unknown; image: unknown } | null | undefined): CheckedProof {
  const payer = normalizePayer(sent?.payer);
  const image = sent?.image;
  const hasImage = typeof Blob !== "undefined" && image instanceof Blob && image.size > 0;
  if (rules.payer && !payer) return { error: "اكتب الرقم أو الحساب اللي حوّلت منه." };
  if (hasImage && !isAcceptableProof(image)) return { error: "الصورة دي مش هينفع ترفعها. ارفع سكرين شوت JPG أو PNG أقل من ١ ميجا." };
  if (rules.screenshot && !hasImage) return { error: "ارفع صورة التحويل (سكرين شوت) عشان نأكد طلبك." };
  return { payer, image: hasImage ? (image as Blob) : null };
}
