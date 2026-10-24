/**
 * Paymob (Egypt) — Intention API + Unified Checkout, and callback verification.
 * https://developers.paymob.com/paymob-docs/developers/intention-apis/create-intention
 *
 * Used twice:
 *  - Casho's own account (env PAYMOB_*) for merchants topping up their balance.
 *  - Each merchant's own account (StorePaymentSettings.paymob*) for their
 *    storefront orders.
 *
 * Amounts are integer cents, which is exactly our piasters.
 */
import crypto from "crypto";

export type PaymobCredentials = {
  secretKey: string;
  publicKey: string;
  hmacSecret: string;
  /** Card / wallet / … integration ids — their test/live status must match the keys. */
  integrationIds: number[];
};

export type PaymobMode = "test" | "live";

const API_BASE = (process.env.PAYMOB_API_URL || "https://accept.paymob.com").replace(/\/$/, "");

const SECRET_KEY = /^[a-z]{3}_sk_(test|live)_\S+$/;
const PUBLIC_KEY = /^[a-z]{3}_pk_(test|live)_\S+$/;

/** "test" / "live" from a key's prefix, or null if it isn't a Paymob key. */
export function paymobKeyMode(key: string, kind: "secret" | "public"): PaymobMode | null {
  const match = (kind === "secret" ? SECRET_KEY : PUBLIC_KEY).exec(key.trim());
  return match ? (match[1] as PaymobMode) : null;
}

/** Casho's own account, or null when the env isn't set (online top-ups off). */
export function getPlatformPaymobCredentials(): PaymobCredentials | null {
  const secretKey = process.env.PAYMOB_SECRET_KEY?.trim();
  const publicKey = process.env.PAYMOB_PUBLIC_KEY?.trim();
  const hmacSecret = process.env.PAYMOB_HMAC_SECRET?.trim();
  const integrationIds = (process.env.PAYMOB_INTEGRATION_IDS ?? "")
    .split(",")
    .map((id) => Number(id.trim()))
    .filter((id) => Number.isInteger(id) && id > 0);

  if (!secretKey || !publicKey || !hmacSecret || !integrationIds.length) return null;
  return { secretKey, publicKey, hmacSecret, integrationIds };
}

// ─── Intention ───────────────────────────────────────────────────────────────

export class PaymobError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "PaymobError";
  }
}

export type PaymobBillingData = {
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
  city?: string;
  street?: string;
};

export type CreateIntentionInput = {
  amountCents: number;
  items: { name: string; amountCents: number; quantity: number }[];
  billing: PaymobBillingData;
  /** Comes back as `merchant_order_id` in every callback. Must be unique per account. */
  specialReference?: string;
  notificationUrl?: string;
  redirectionUrl?: string;
  extras?: Record<string, string | number>;
};

/** Paymob wants every billing field present; "NA" is its documented filler. */
function billingData(b: PaymobBillingData) {
  const [first, ...rest] = b.firstName.trim().split(/\s+/);
  return {
    first_name: (first || "NA").slice(0, 50),
    last_name: (b.lastName?.trim() || rest.join(" ") || "NA").slice(0, 50),
    phone_number: b.phone,
    email: b.email?.trim() || "noreply@casho.store",
    city: b.city?.trim() || "NA",
    street: b.street?.trim().slice(0, 200) || "NA",
    building: "NA",
    floor: "NA",
    apartment: "NA",
    state: "NA",
    country: "EG",
  };
}

/**
 * Creates a payment intention and returns the hosted checkout URL. Creating one
 * charges nothing — an intention nobody pays simply expires.
 */
export async function createPaymobCheckout(
  creds: Pick<PaymobCredentials, "secretKey" | "publicKey" | "integrationIds">,
  input: CreateIntentionInput,
  fetchImpl: typeof fetch = fetch,
): Promise<{ url: string; intentionId: string }> {
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    throw new PaymobError("invalid amount");
  }

  // Item lines must add up to the amount; shipping/discounts make that messy,
  // so one line carries the whole order when they don't.
  const itemsTotal = input.items.reduce((sum, i) => sum + i.amountCents * i.quantity, 0);
  const items =
    itemsTotal === input.amountCents
      ? input.items
      : [{ name: input.items.length === 1 ? input.items[0].name : "Order", amountCents: input.amountCents, quantity: 1 }];

  let res: Response;
  try {
    res = await fetchImpl(`${API_BASE}/v1/intention/`, {
      method: "POST",
      headers: { Authorization: `Token ${creds.secretKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: input.amountCents,
        currency: "EGP",
        payment_methods: creds.integrationIds,
        items: items.map((i) => ({ name: i.name.slice(0, 50), amount: i.amountCents, quantity: i.quantity })),
        billing_data: billingData(input.billing),
        special_reference: input.specialReference,
        notification_url: input.notificationUrl,
        redirection_url: input.redirectionUrl,
        extras: input.extras,
      }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new PaymobError("intention request failed (network)");
  }

  // Never log the body: it can echo billing data.
  if (!res.ok) throw new PaymobError(`intention rejected (${res.status})`, res.status);

  const json = (await res.json().catch(() => ({}))) as { id?: string | number; client_secret?: string };
  if (!json.client_secret) throw new PaymobError("intention response without client_secret");

  const params = new URLSearchParams({ publicKey: creds.publicKey, clientSecret: json.client_secret });
  return { url: `${API_BASE}/unifiedcheckout/?${params.toString()}`, intentionId: String(json.id ?? "") };
}

// ─── Callbacks ───────────────────────────────────────────────────────────────

/**
 * One transaction as both callbacks describe it — the server-to-server
 * "processed" POST (JSON `obj`) and the browser "response" GET (query string).
 */
export type PaymobTransaction = {
  id: string;
  /** Our `special_reference` (order / top-up id). */
  merchantOrderId: string | null;
  amountCents: number;
  currency: string;
  success: boolean;
  pending: boolean;
  /** e.g. "card", "wallet". */
  sourceType: string;
  hmacFields: string[];
};

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

/** From the processed callback body: `{ type: "TRANSACTION", obj: {...} }`. */
export function transactionFromWebhook(body: unknown): PaymobTransaction | null {
  const root = body as { type?: string; obj?: Record<string, unknown> } | null;
  if (!root || root.type !== "TRANSACTION" || !root.obj) return null;
  const obj = root.obj;
  const order = (obj.order ?? {}) as Record<string, unknown>;
  const source = (obj.source_data ?? {}) as Record<string, unknown>;

  return {
    id: str(obj.id),
    merchantOrderId: str(order.merchant_order_id) || null,
    amountCents: Number(obj.amount_cents),
    currency: str(obj.currency),
    success: obj.success === true,
    pending: obj.pending === true,
    sourceType: str(source.type),
    hmacFields: [
      obj.amount_cents,
      obj.created_at,
      obj.currency,
      obj.error_occured,
      obj.has_parent_transaction,
      obj.id,
      obj.integration_id,
      obj.is_3d_secure,
      obj.is_auth,
      obj.is_capture,
      obj.is_refunded,
      obj.is_standalone_payment,
      obj.is_voided,
      order.id,
      obj.owner,
      obj.pending,
      source.pan,
      source.sub_type,
      source.type,
      obj.success,
    ].map(str),
  };
}

/** From the redirect back to us (flattened query string). */
export function transactionFromRedirect(query: URLSearchParams): PaymobTransaction | null {
  const id = query.get("id");
  if (!id) return null;
  // Paymob has used both spellings for the nested keys.
  const get = (key: string) => query.get(key) ?? query.get(key.replace(".", "_")) ?? "";

  return {
    id,
    merchantOrderId: query.get("merchant_order_id") || null,
    amountCents: Number(query.get("amount_cents")),
    currency: get("currency"),
    success: query.get("success") === "true",
    pending: query.get("pending") === "true",
    sourceType: get("source_data.type"),
    hmacFields: [
      get("amount_cents"),
      get("created_at"),
      get("currency"),
      get("error_occured"),
      get("has_parent_transaction"),
      id,
      get("integration_id"),
      get("is_3d_secure"),
      get("is_auth"),
      get("is_capture"),
      get("is_refunded"),
      get("is_standalone_payment"),
      get("is_voided"),
      query.get("order") ?? query.get("order_id") ?? "",
      get("owner"),
      get("pending"),
      get("source_data.pan"),
      get("source_data.sub_type"),
      get("source_data.type"),
      get("success"),
    ],
  };
}

/** HMAC-SHA512 over the 20 fields, concatenated in Paymob's fixed order. */
export function verifyPaymobHmac(tx: PaymobTransaction, hmac: string | null, hmacSecret: string) {
  if (!hmac) return false;
  const expected = crypto.createHmac("sha512", hmacSecret).update(tx.hmacFields.join("")).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(hmac.toLowerCase(), "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Base URL Paymob sends the payer back to (and posts webhooks to): the
 * dashboard host — app.casho.store, or app.localhost:3000 in dev — never the
 * bare root domain. The port is kept (dropping it broke local returns).
 */
export function paymobCallbackBaseUrl() {
  const raw = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL)?.replace(/\/$/, "");
  if (!raw) throw new Error("APP_URL is required for Paymob payments");
  const rootDomain = process.env.ROOT_DOMAIN || "casho.store";
  try {
    const url = new URL(raw);
    if (url.hostname === rootDomain) return `${url.protocol}//app.${url.host}`;
  } catch {
    // fall through
  }
  return raw;
}
