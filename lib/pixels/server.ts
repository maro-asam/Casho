// Server-side conversion events on the merchant's own pixels — Meta Conversions
// API and TikTok Events API. They recover the conversions browser pixels lose
// (ad blockers, iOS, closed tabs) and share `eventId` with the browser event,
// so each platform keeps a single copy. Plan-gated (FEATURE_KEYS.META_CAPI).

import { after } from "next/server";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/secrets";
import { FEATURE_KEYS, hasFeature } from "@/lib/entitlements";
import { normalizePhone, sendMetaCapiEvent, sha256 } from "@/lib/meta-capi";
import type { PixelEventName, PixelEventPayload } from "./shared";

const TIKTOK_EVENTS_URL = "https://business-api.tiktok.com/open_api/v1.3/event/track/";

export type ServerPixelEvent = {
  storeId: string;
  eventName: Exclude<PixelEventName, "PageView">;
  payload: PixelEventPayload & { eventId: string };
  customer?: { phone?: string | null; fullName?: string | null };
  /** Page the event happened on; defaults to the request referer. */
  eventSourceUrl?: string;
};

/** Browser signals — read during the request (not inside `after`). */
export type PixelRequestContext = {
  ip: string | null;
  userAgent: string | null;
  url: string | null;
  fbp: string | null;
  fbc: string | null;
  ttp: string | null;
};

export type PlatformResult = { ok: boolean; error?: string };
export type ServerEventResult = { meta?: PlatformResult; tiktok?: PlatformResult };

export async function readPixelRequestContext(): Promise<PixelRequestContext> {
  const [h, c] = await Promise.all([headers(), cookies()]);
  return {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null,
    userAgent: h.get("user-agent"),
    url: h.get("referer"),
    fbp: c.get("_fbp")?.value ?? null,
    fbc: c.get("_fbc")?.value ?? null,
    ttp: c.get("_ttp")?.value ?? null,
  };
}

type ServerTargets = {
  meta: { pixelId: string; accessToken: string; testEventCode: string | null } | null;
  tiktok: { pixelId: string; accessToken: string; testEventCode: string | null } | null;
};

function decrypt(value: string | null) {
  if (!value) return null;
  try {
    return decryptSecret(value);
  } catch (error) {
    console.error("[pixels] could not decrypt a conversion API token", error);
    return null;
  }
}

/** Platforms this store can send server events to right now (configured + on its plan). */
export async function loadServerTargets(storeId: string, opts: { skipPlanCheck?: boolean } = {}): Promise<ServerTargets | null> {
  const settings = await prisma.storePixelSettings.findUnique({ where: { storeId } });
  if (!settings) return null;

  const metaToken = settings.metaPixelId ? decrypt(settings.metaCapiTokenEnc) : null;
  const tiktokToken = settings.tiktokPixelId ? decrypt(settings.tiktokAccessTokenEnc) : null;
  if (!metaToken && !tiktokToken) return null;
  if (!opts.skipPlanCheck && !(await hasFeature(storeId, FEATURE_KEYS.META_CAPI))) return null;

  return {
    meta: metaToken ? { pixelId: settings.metaPixelId!, accessToken: metaToken, testEventCode: settings.metaTestEventCode } : null,
    tiktok: tiktokToken
      ? { pixelId: settings.tiktokPixelId!, accessToken: tiktokToken, testEventCode: settings.tiktokTestEventCode }
      : null,
  };
}

function splitName(fullName?: string | null) {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  return { first: parts[0] ?? null, last: parts.length > 1 ? parts[parts.length - 1] : null };
}

const TIKTOK_EVENT_NAMES: Record<ServerPixelEvent["eventName"], string> = {
  ViewContent: "ViewContent",
  AddToCart: "AddToCart",
  InitiateCheckout: "InitiateCheckout",
  Purchase: "CompletePayment",
};

async function sendMeta(target: NonNullable<ServerTargets["meta"]>, event: ServerPixelEvent, ctx: PixelRequestContext): Promise<PlatformResult> {
  const { payload } = event;
  const name = splitName(event.customer?.fullName);
  const contents = payload.contents ?? [];
  const result = await sendMetaCapiEvent({
    credentials: target,
    eventName: event.eventName,
    eventId: payload.eventId,
    eventSourceUrl: event.eventSourceUrl ?? ctx.url ?? "",
    ip: ctx.ip,
    userAgent: ctx.userAgent,
    fbp: ctx.fbp,
    fbc: ctx.fbc,
    phone: event.customer?.phone,
    firstName: name.first,
    lastName: name.last,
    country: event.customer?.phone ? "eg" : null,
    customData: {
      currency: payload.currency ?? "EGP",
      value: payload.value,
      order_id: payload.orderId,
      content_type: "product",
      content_ids: contents.map((c) => c.id),
      contents: contents.map((c) => ({ id: c.id, quantity: c.quantity, item_price: c.price })),
      num_items: contents.reduce((sum, c) => sum + c.quantity, 0) || undefined,
    },
  });
  return result.ok ? { ok: true } : { ok: false, error: describeError(result.error) };
}

async function sendTikTok(target: NonNullable<ServerTargets["tiktok"]>, event: ServerPixelEvent, ctx: PixelRequestContext): Promise<PlatformResult> {
  const { payload } = event;
  const phone = normalizePhone(event.customer?.phone);
  const body = {
    event_source: "web",
    event_source_id: target.pixelId,
    ...(target.testEventCode && { test_event_code: target.testEventCode }),
    data: [
      {
        event: TIKTOK_EVENT_NAMES[event.eventName],
        event_time: Math.floor(Date.now() / 1000),
        event_id: payload.eventId,
        user: {
          ...(phone && { phone: sha256(`+${phone}`) }),
          ...(ctx.ip && { ip: ctx.ip }),
          ...(ctx.userAgent && { user_agent: ctx.userAgent }),
          ...(ctx.ttp && { ttp: ctx.ttp }),
        },
        page: { url: event.eventSourceUrl ?? ctx.url ?? "" },
        properties: {
          currency: payload.currency ?? "EGP",
          ...(payload.value !== undefined && { value: payload.value }),
          ...(payload.orderId && { order_id: payload.orderId }),
          content_type: "product",
          contents: (payload.contents ?? []).map((c) => ({
            content_id: c.id,
            quantity: c.quantity,
            price: c.price,
            ...(c.name && { content_name: c.name }),
          })),
        },
      },
    ],
  };

  try {
    const res = await fetch(TIKTOK_EVENTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Access-Token": target.accessToken },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = (await res.json().catch(() => null)) as { code?: number; message?: string } | null;
    if (res.ok && data?.code === 0) return { ok: true };
    console.error("[pixels] TikTok Events API", res.status, data);
    return { ok: false, error: data?.message ?? `HTTP ${res.status}` };
  } catch (error) {
    console.error("[pixels] TikTok Events API request failed", error);
    return { ok: false, error: "network" };
  }
}

function describeError(error: unknown) {
  if (error && typeof error === "object" && "error" in error) {
    const inner = (error as { error?: { message?: string } }).error;
    if (inner?.message) return inner.message;
  }
  return error instanceof Error ? error.message : "unknown";
}

/** Sends now and reports per platform (dashboard "test event"). Never throws. */
export async function sendStoreServerEvent(
  event: ServerPixelEvent,
  ctx: PixelRequestContext,
  targets?: ServerTargets | null,
): Promise<ServerEventResult> {
  try {
    const resolved = targets === undefined ? await loadServerTargets(event.storeId) : targets;
    if (!resolved) return {};
    const [meta, tiktok] = await Promise.all([
      resolved.meta ? sendMeta(resolved.meta, event, ctx) : undefined,
      resolved.tiktok ? sendTikTok(resolved.tiktok, event, ctx) : undefined,
    ]);
    return { ...(meta && { meta }), ...(tiktok && { tiktok }) };
  } catch (error) {
    console.error("[pixels] server event failed", error);
    return {};
  }
}

/**
 * Fire-and-forget from a checkout / cart action: reads the browser signals now
 * and sends after the response, so ad platforms never slow down a purchase.
 */
export async function queueStoreServerEvent(event: ServerPixelEvent) {
  try {
    const ctx = await readPixelRequestContext();
    after(() => sendStoreServerEvent(event, ctx).then(() => undefined));
  } catch (error) {
    console.error("[pixels] could not queue server event", error);
  }
}
