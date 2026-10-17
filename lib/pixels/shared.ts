// Client-safe pixel definitions shared by the dashboard form, the storefront
// scripts and the server-side conversion APIs.

/**
 * Strict id formats. These ids are printed into inline <script> tags on the
 * storefront, so anything that isn't exactly an id must never be stored.
 */
export const PIXEL_ID_PATTERNS = {
  meta: /^\d{10,20}$/,
  tiktok: /^[A-Z0-9]{15,30}$/,
  snap: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
} as const;

export type PixelPlatform = keyof typeof PIXEL_ID_PATTERNS;

/** Normalises what merchants paste (spaces, lowercase TikTok codes, uppercase Snap UUIDs). */
export function normalizePixelId(platform: PixelPlatform, raw: string) {
  const value = raw.replace(/\s+/g, "");
  if (platform === "tiktok") return value.toUpperCase();
  if (platform === "snap") return value.toLowerCase();
  return value;
}

export function isValidPixelId(platform: PixelPlatform, id: string | null | undefined): id is string {
  return typeof id === "string" && PIXEL_ID_PATTERNS[platform].test(id);
}

/** Which browser pixels a storefront loads. Only valid ids ever get here. */
export type StorePixelConfig = {
  meta: string | null;
  tiktok: string | null;
  snap: string | null;
};

export function hasAnyPixel(config: StorePixelConfig | null | undefined): config is StorePixelConfig {
  return Boolean(config && (config.meta || config.tiktok || config.snap));
}

export type PixelEventName = "PageView" | "ViewContent" | "AddToCart" | "InitiateCheckout" | "Purchase";

export type PixelContent = { id: string; quantity: number; price: number; name?: string };

/** One commerce event, in EGP (not piasters) — the unit ad platforms expect. */
export type PixelEventPayload = {
  /** Shared by the browser pixel and the server API so the platform keeps one copy. */
  eventId?: string;
  value?: number;
  currency?: string;
  contents?: PixelContent[];
  orderId?: string;
};

/** Deterministic, so a reload of the thank-you page and the server event dedupe. */
export const purchaseEventId = (orderId: string) => `purchase_${orderId}`;
