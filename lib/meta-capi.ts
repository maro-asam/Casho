import crypto from "crypto";

export type MetaStandardEventName =
  | "PageView"
  | "ViewContent"
  | "Search"
  | "AddToCart"
  | "InitiateCheckout"
  | "Purchase"
  | "Lead"
  | "CompleteRegistration";

type MetaContent = {
  id: string;
  quantity?: number;
  item_price?: number;
};

type MetaCapiCustomData = {
  currency?: string;
  value?: number;
  order_id?: string;
  content_name?: string;
  content_type?: string;
  content_ids?: string[];
  contents?: MetaContent[];
  num_items?: number;
  search_string?: string;
  store_id?: string;
  store_slug?: string;
  [key: string]: unknown;
};

export type SendMetaCapiEventInput = {
  eventName: MetaStandardEventName;
  eventId?: string;

  eventSourceUrl: string;
  ip?: string | null;
  userAgent?: string | null;

  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  zipCode?: string | null;

  fbp?: string | null;
  fbc?: string | null;

  customData?: MetaCapiCustomData;
};

function sha256(value?: string | null) {
  if (!value) return undefined;

  return crypto
    .createHash("sha256")
    .update(value.trim().toLowerCase())
    .digest("hex");
}

function normalizePhone(phone?: string | null) {
  if (!phone) return undefined;

  // Meta prefers normalized phone before hashing.
  // هنشيل أي رموز ونسيب الأرقام بس.
  return phone.replace(/[^\d]/g, "");
}

function cleanObject<T extends Record<string, unknown>>(obj: T) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => {
      if (value === undefined || value === null || value === "") return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    }),
  );
}

export function createMetaEventId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export async function sendMetaCapiEvent(input: SendMetaCapiEventInput) {
  const pixelId = process.env.FACEBOOK_PIXEL_ID;
  const accessToken = process.env.FACEBOOK_CAPI_ACCESS_TOKEN;
  const testEventCode = process.env.FACEBOOK_TEST_EVENT_CODE;

  const eventId = input.eventId || createMetaEventId(input.eventName);

  if (!pixelId || !accessToken) {
    console.warn("[Meta CAPI] Missing FACEBOOK_PIXEL_ID or FACEBOOK_CAPI_ACCESS_TOKEN");

    return {
      ok: false,
      eventId,
      error: "Missing Meta CAPI environment variables",
    };
  }

  const userData = cleanObject({
    em: sha256(input.email),
    ph: sha256(normalizePhone(input.phone)),
    fn: sha256(input.firstName),
    ln: sha256(input.lastName),
    ct: sha256(input.city),
    st: sha256(input.state),
    country: sha256(input.country),
    zp: sha256(input.zipCode),

    // دول لا يتم عمل hash لهم
    client_ip_address: input.ip || undefined,
    client_user_agent: input.userAgent || undefined,
    fbp: input.fbp || undefined,
    fbc: input.fbc || undefined,
  });

  const eventPayload = cleanObject({
    event_name: input.eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    action_source: "website",
    event_source_url: input.eventSourceUrl,
    user_data: userData,
    custom_data: cleanObject(input.customData || {}),
  });

  const body = cleanObject({
    data: [eventPayload],
    test_event_code: testEventCode || undefined,
  });

  try {
    const response = await fetch(
      `https://graph.facebook.com/v20.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify(body),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("[Meta CAPI] Error:", result);

      return {
        ok: false,
        eventId,
        error: result,
      };
    }

    return {
      ok: true,
      eventId,
      result,
    };
  } catch (error) {
    console.error("[Meta CAPI] Request failed:", error);

    return {
      ok: false,
      eventId,
      error,
    };
  }
}