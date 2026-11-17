/**
 * Live visitors for /admin/analytics/realtime (polled every few seconds).
 * Admin only; never cached — every number is read at request time.
 */
import { NextResponse, type NextRequest } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { requireAnalyticsViewer } from "@/lib/analytics/access";
import { parseAnalyticsFilter } from "@/lib/analytics/filters";
import { getRealtime } from "@/lib/analytics/queries/activity";
import { getAnalyticsSettings } from "@/lib/analytics/settings";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAnalyticsViewer();
  } catch (error) {
    unstable_rethrow(error);
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  try {
    const f = parseAnalyticsFilter(Object.fromEntries(req.nextUrl.searchParams));
    const settings = await getAnalyticsSettings();
    const data = await getRealtime(f, settings.realtimeWindowMin);
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[analytics] realtime", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
