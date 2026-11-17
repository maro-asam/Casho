import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { Unavailable } from "@/components/saas-page";
import { BackLink } from "@/app/admin/_components/admin-ui";
import { auditAnalytics, requireAnalyticsViewer } from "@/lib/analytics/access";
import { ID_PATTERN } from "@/lib/analytics/constants";
import { filterParams, parseAnalyticsFilter } from "@/lib/analytics/filters";
import { getSessionTimeline } from "@/lib/analytics/queries/activity";
import { Section, Stat } from "../../_components/ui";
import { SCOPE_LABELS, channelLabel, countryName, deviceLabel, eventLabel, flagOf, fmtDateTime, fmtDuration, fmtNum, fmtTime, pathLabel } from "../../_lib/format";

export const dynamic = "force-dynamic";

const SAFE_PROPS = new Set(["cta", "label", "form", "tag", "href", "type", "dead", "rage", "method", "metric", "rating", "message", "status", "url", "via", "plan", "cycle", "product", "qty", "kind"]);

export default async function SessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { sessionId } = await params;
  const f = parseAnalyticsFilter(await searchParams);
  const back = `/admin/analytics/journeys${filterParams(f)}`;
  const viewer = await requireAnalyticsViewer();
  if (!viewer.superAdmin) {
    return (
      <div className="space-y-4">
        <BackLink href={back}>رحلات الزوار</BackLink>
        <section className="apple-card">
          <Unavailable icon={Lock} title="للسوبر أدمن بس" description="الرحلات الفردية متاحة للسوبر أدمن." />
        </section>
      </div>
    );
  }
  if (!ID_PATTERN.test(sessionId)) notFound();
  const data = await getSessionTimeline(sessionId);
  if (!data) notFound();
  await auditAnalytics(viewer, "ANALYTICS_JOURNEY_VIEWED", { sessionId });

  const { session: s } = data;
  const items = [
    ...data.pages.map((p) => ({ kind: "page" as const, at: p.startedAt, key: p.id, title: pathLabel(p.path), detail: `${fmtDuration(p.engagedMs)} تفاعل · سكرول ${fmtNum(p.scrollPct)}٪` })),
    ...data.events
      .filter((e) => e.name !== "click" || e.props)
      .map((e) => {
        const props = (e.props ?? {}) as Record<string, unknown>;
        const safe = Object.entries(props).filter(([k]) => SAFE_PROPS.has(k)).map(([k, v]) => `${k}: ${String(v)}`);
        return { kind: "event" as const, at: e.ts, key: e.id, title: eventLabel(e.name), detail: [e.path ? pathLabel(e.path) : null, ...safe].filter(Boolean).join(" · ") };
      }),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());

  return (
    <div className="space-y-6">
      <BackLink href={back}>رحلات الزوار</BackLink>
      <div>
        <h2 className="text-[24px] leading-[30px] font-bold">زيارة {fmtDateTime(s.startedAt)}</h2>
        <p className="text-[14px] text-muted-foreground">
          {SCOPE_LABELS[s.scope]}
          {s.store ? ` · ${s.store.name}` : ""} · زائر {s.visitorId.slice(0, 8)} · {fmtNum(data.visitorSessions)} زيارة لنفس المتصفح
        </p>
      </div>

      <section className="apple-card grid grid-cols-2 gap-5 p-5 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="المدة" value={fmtDuration(s.lastSeenAt.getTime() - s.startedAt.getTime())} />
        <Stat label="وقت التفاعل" value={fmtDuration(s.engagedMs)} />
        <Stat label="صفحات" value={fmtNum(s.pageviews)} />
        <Stat label="المصدر" value={channelLabel(s.channel)} hint={[s.source, s.utmCampaign].filter(Boolean).join(" · ")} />
        <Stat label="الجهاز" value={deviceLabel(s.device)} hint={[s.browser, s.os].filter(Boolean).join(" · ")} />
        <Stat label="المكان (تقريبي)" value={s.country ? `${flagOf(s.country)} ${countryName(s.country)}` : "—"} hint={s.city ?? undefined} />
      </section>

      <Section title="اللي حصل بالترتيب" subtitle={s.converted ? "الزيارة دي حوّلت" : undefined} flush>
        <ol className="relative space-y-0 px-5 pb-5">
          {items.map((it) => (
            <li key={it.key} className="relative flex gap-3 border-s-2 border-border/70 ps-4 pb-4 last:pb-0">
              <span aria-hidden className={`absolute -start-[6px] top-1 size-2.5 rounded-full ${it.kind === "page" ? "bg-(--viz-1)" : "bg-(--viz-2)"}`} />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium" dir="auto">
                  {it.kind === "page" ? `فتح ${it.title}` : it.title}
                </p>
                {it.detail && (
                  <p className="text-[12px] break-words text-muted-foreground" dir="auto">
                    {it.detail}
                  </p>
                )}
              </div>
              <time className="shrink-0 text-[12px] text-muted-foreground tabular-nums">{fmtTime(it.at)}</time>
            </li>
          ))}
        </ol>
      </Section>
      <p className="px-1 text-[12px] text-muted-foreground">فتحك للزيارة دي اتسجل في سجل الأمان.</p>
    </div>
  );
}
