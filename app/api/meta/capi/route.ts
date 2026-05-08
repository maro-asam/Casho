import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function hash(value?: string) {
  if (!value) return undefined;
  return crypto
    .createHash("sha256")
    .update(value.trim().toLowerCase())
    .digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const pixelId = process.env.FACEBOOK_PIXEL_ID;
    const accessToken = process.env.FACEBOOK_CAPI_ACCESS_TOKEN;

    if (!pixelId || !accessToken) {
      return NextResponse.json(
        { error: "Missing Facebook CAPI env variables" },
        { status: 500 },
      );
    }

    const eventName = body.event_name || "Lead";
    const eventId = body.event_id || crypto.randomUUID();

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      undefined;

    const userAgent = req.headers.get("user-agent") || undefined;

    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          action_source: "website",
          event_source_url: body.event_source_url,

          user_data: {
            em: hash(body.email),
            ph: hash(body.phone),
            client_ip_address: ip,
            client_user_agent: userAgent,
            fbp: body.fbp,
            fbc: body.fbc,
          },

          custom_data: {
            currency: body.currency || "EGP",
            value: body.value,
            order_id: body.order_id,
            content_name: body.content_name,
          },
        },
      ],
    };

    const response = await fetch(
      `https://graph.facebook.com/v20.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(result, { status: response.status });
    }

    return NextResponse.json({ ok: true, event_id: eventId, result });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to send CAPI event" },
      { status: 500 },
    );
  }
}
