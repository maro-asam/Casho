import Link from "next/link";
import { ListFilter } from "lucide-react";
import { Pager, SearchInput, Unavailable } from "@/components/saas-page";
import { EVENT_NAME_PATTERN, KNOWN_EVENTS, SERVER_ONLY_EVENTS } from "@/lib/analytics/constants";
import { readAnalyticsFilter } from "@/lib/analytics/access";
import { filterParams } from "@/lib/analytics/filters";
import { getEvents } from "@/lib/analytics/queries/activity";
import { cn } from "@/lib/utils";
import { Toolbar } from "../_components/toolbar";
import { TrendChart } from "../_components/trend-chart";
import { DataTable, Note, Section } from "../_components/ui";
import { SCOPE_LABELS, deviceLabel, eventLabel, fmtDateTime, fmtNum, pathLabel } from "../_lib/format";

export const dynamic = "force-dynamic";

/** Only short scalar props are shown (they were sanitised on the way in). */
function Props({ props }: { props: Record<string, unknown> | null }) {
  if (!props) return <span className="text-muted-foreground">—</span>;
  const entries = Object.entries(props).filter(([, v]) => ["string", "number", "boolean"].includes(typeof v));
  return (
    <span className="flex flex-wrap justify-end gap-1">
      {entries.map(([k, v]) => (
        <span key={k} className="max-w-56 truncate rounded-full bg-muted px-2 py-0.5 text-[11px]" dir="ltr" title={`${k}: ${String(v)}`}>
          <span className="text-muted-foreground">{k}:</span> {String(v)}
        </span>
      ))}
    </span>
  );
}

export default async function EventsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const { f } = await readAnalyticsFilter(sp);
  const name = typeof sp.name === "string" && EVENT_NAME_PATTERN.test(sp.name) ? sp.name : null;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) || null : null;
  const page = Math.max(1, Number(sp.page) || 1);
  const data = await getEvents(f, { name, q, page });
  const chip = (value: string | null, label: string, count?: number) => (
    <Link
      key={value ?? "all"}
      href={`/admin/analytics/events${filterParams(f, { name: value, ...(q ? { q } : {}) })}`}
      scroll={false}
      aria-current={name === value ? "true" : undefined}
      className={cn(
        "apple-press inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px]",
        name === value ? "bg-primary text-primary-foreground" : "bg-card text-foreground shadow-[0_0_0_0.5px_var(--border)] hover:bg-card/80",
      )}
    >
      {label}
      {count !== undefined && <span className={name === value ? "opacity-80" : "text-muted-foreground"}>{fmtNum(count)}</span>}
    </Link>
  );

  return (
    <div className="space-y-6">
      <Toolbar filter={f} report={`events${name ? `:${name}` : ""}`} />

      <div className="space-y-3">
        <div className="max-w-md [&_input]:h-11 [&_input]:rounded-[12px] [&_input]:border-0 [&_input]:bg-card [&_input]:text-[15px]">
          <SearchInput placeholder="ابحث باسم الحدث أو الصفحة…" />
        </div>
        <div className="flex flex-wrap gap-2">
          {chip(null, "كل الأحداث")}
          {data.names.map((n) => chip(n.name, eventLabel(n.name), n.n))}
        </div>
      </div>

      <TrendChart
        title={name ? `${eventLabel(name)} على مدار الفترة` : "كل الأحداث على مدار الفترة"}
        labels={data.volume.map((v) => v.label)}
        prevLabels={[]}
        metrics={[{ key: "n", label: "عدد", format: "count", current: data.volume.map((v) => v.n), previous: null }]}
      />

      <Section title="الأحداث" subtitle={`${fmtNum(data.total)} حدث · الأحدث فوق`} flush>
        {data.rows.length ? (
          <>
            <DataTable minWidth={900} head={["الحدث", "الصفحة", "الجهاز", "النطاق", "القيمة", "الخصائص", "الوقت"]}>
              {data.rows.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap">
                    <span className="font-medium">{eventLabel(r.name)}</span>
                    <span className="ms-1.5 text-[11px] text-muted-foreground" dir="ltr">
                      {r.name}
                    </span>
                    {r.server && <span className="ms-1.5 rounded-full bg-(--sys-green)/12 px-1.5 text-[10px] text-foreground">مؤكد</span>}
                  </td>
                  <td className="max-w-56 truncate" dir="auto">
                    {pathLabel(r.path)}
                  </td>
                  <td>{deviceLabel(r.device)}</td>
                  <td className="whitespace-nowrap">
                    {SCOPE_LABELS[r.scope]}
                    {r.storeName ? ` · ${r.storeName}` : ""}
                  </td>
                  <td>{r.value === null ? "—" : fmtNum(r.value)}</td>
                  <td>
                    <Props props={r.props} />
                  </td>
                  <td className="whitespace-nowrap">{fmtDateTime(r.ts)}</td>
                </tr>
              ))}
            </DataTable>
            <Pager page={page} pageSize={data.pageSize} total={data.total} basePath="/admin/analytics/events" searchParams={sp} noun="حدث" />
          </>
        ) : (
          <Unavailable icon={ListFilter} title="مفيش أحداث بالفلتر ده" className="py-12" />
        )}
      </Section>

      <Section title="الأحداث المتاحة" subtitle="اللي كاشو بتسجله لوحدها — وتقدر تضيف أحداث جديدة من الكود" flush>
        <DataTable minWidth={560} head={["الاسم", "المعنى", "المصدر"]}>
          {Object.entries(KNOWN_EVENTS).map(([key, label]) => (
            <tr key={key}>
              <td className="font-medium" dir="ltr">
                {key}
              </td>
              <td>{label}</td>
              <td>{SERVER_ONLY_EVENTS.has(key) ? "السيرفر (بعد ما السجل يتحفظ)" : "المتصفح"}</td>
            </tr>
          ))}
        </DataTable>
        <Note className="px-5 pb-5">
          حدث جديد من أي client component: <code dir="ltr">trackEvent(&quot;pricing_toggle&quot;, &#123; cycle: &quot;yearly&quot; &#125;)</code> من <code dir="ltr">@/lib/analytics/track</code>. أو زرار بـ <code dir="ltr">data-cta=&quot;name&quot;</code> بيتسجل كـ cta_clicked لوحده. الأسماء snake_case، والخصائص قيم قصيرة من غير بيانات شخصية.
        </Note>
      </Section>
    </div>
  );
}
