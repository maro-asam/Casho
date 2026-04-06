import { NextRequest, NextResponse } from "next/server";
import {
  approveTopupRequestAction,
  rejectTopupRequestAction,
} from "@/actions/admin/admin-topup.actions";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const data = body.callback_query;

  if (!data) {
    return NextResponse.json({ ok: true });
  }

  const callback = data.data; // approve_xxx

  const [action, requestId] = callback.split("_");

  try {
    if (action === "approve") {
      await approveTopupRequestAction(requestId);
    }

    if (action === "reject") {
      await rejectTopupRequestAction(requestId);
    }
  } catch (e) {
    console.error(e);
  }

  return NextResponse.json({ ok: true });
}