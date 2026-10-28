/**
 * Confirm It → Casho: the customer's answer for an order.
 * POST /api/apps/confirm-it/callback/<token>  { order_id, status: "confirmed" | "cancelled" | …, reason? }
 * The per-store token in the URL is the authorization (see lib/apps/confirm-it).
 * Accepts JSON or form bodies; order_id can be the Casho id or the "#A1B2C3" number.
 */
import { NextRequest, NextResponse } from "next/server";

import { handleConfirmItCallback } from "@/lib/apps/confirm-it";

async function readBody(req: NextRequest): Promise<Record<string, unknown> | null> {
  const type = req.headers.get("content-type") ?? "";
  try {
    if (type.includes("application/json")) {
      const json = await req.json();
      return json && typeof json === "object" && !Array.isArray(json) ? (json as Record<string, unknown>) : null;
    }
    return Object.fromEntries((await req.formData()).entries());
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await readBody(req);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });

  try {
    const result = await handleConfirmItCallback(token, body);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error("[confirm-it callback]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

/** Lets Confirm It's dashboard check the URL is reachable. */
export function GET() {
  return NextResponse.json({ ok: true, app: "confirm-it" });
}
