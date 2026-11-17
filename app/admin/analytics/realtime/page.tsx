import { parseAnalyticsFilter } from "@/lib/analytics/filters";
import { getRealtime } from "@/lib/analytics/queries/activity";
import { getAnalyticsSettings } from "@/lib/analytics/settings";
import { Toolbar } from "../_components/toolbar";
import { RealtimeView } from "./realtime-view";

export const dynamic = "force-dynamic";

export default async function RealtimePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const f = parseAnalyticsFilter(sp);
  const settings = await getAnalyticsSettings();
  const initial = await getRealtime(f, settings.realtimeWindowMin);
  const query = new URLSearchParams();
  for (const k of ["scope", "store", "device"]) {
    const v = sp[k];
    if (typeof v === "string") query.set(k, v);
  }
  return (
    <div className="space-y-6">
      <Toolbar filter={f} live />
      <RealtimeView initial={JSON.parse(JSON.stringify(initial))} query={query.toString()} />
    </div>
  );
}
