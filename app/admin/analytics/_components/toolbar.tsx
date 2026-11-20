import { Suspense } from "react";
import { canSeeStorefronts, requireAnalyticsViewer } from "@/lib/analytics/access";
import { getStoreOptions } from "@/lib/analytics/queries/breakdowns";
import type { AnalyticsFilter } from "@/lib/analytics/filters";
import { fmtRangeKeys } from "../_lib/format";
import { FilterBar } from "./filter-bar";

/** Filters + the exact dates being shown (and what they're compared with). */
export async function Toolbar({
  filter,
  report,
  hideScope,
  hideDevice,
  live,
}: {
  filter: AnalyticsFilter;
  report?: string;
  hideScope?: boolean;
  hideDevice?: boolean;
  live?: boolean;
}) {
  const storefronts = canSeeStorefronts(await requireAnalyticsViewer());
  const stores = storefronts ? await getStoreOptions().catch(() => []) : [];
  const range = fmtRangeKeys(filter.fromKey, filter.toKey);
  const prev = filter.prevFromKey && filter.prevToKey ? fmtRangeKeys(filter.prevFromKey, filter.prevToKey) : null;
  return (
    <div className="space-y-2">
      <Suspense fallback={<div className="h-9" />}>
        <FilterBar stores={stores} storefronts={storefronts} rangeLabel={range} exportReport={report} hideScope={hideScope} hideDevice={hideDevice} live={live} />
      </Suspense>
      {!live && <p className="text-[12px] text-muted-foreground">
        {range}
        {prev && <> · مقارنة بـ {prev}</>} · بتوقيت القاهرة · الأرقام بتتحدث كل دقيقة
      </p>}
    </div>
  );
}
