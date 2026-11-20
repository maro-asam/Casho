import Link from "next/link";
import { notFound } from "next/navigation";
import { Flame } from "lucide-react";
import { appleButton } from "@/components/saas-page";
import { BackLink } from "@/app/admin/_components/admin-ui";
import { readAnalyticsFilter } from "@/lib/analytics/access";
import { filterParams, isStorefrontView } from "@/lib/analytics/filters";
import { depthReachedBy, ratio, scrollReach } from "@/lib/analytics/metrics";
import { getPageDetail, getPagesTable } from "@/lib/analytics/queries/pages";
import { BarList } from "../../_components/bar-list";
import { Toolbar } from "../../_components/toolbar";
import { TrendChart } from "../../_components/trend-chart";
import { Note, Section, Stat } from "../../_components/ui";
import { channelLabel, deviceLabel, fmtDuration, fmtNum, fmtPct, pathLabel } from "../../_lib/format";

export const dynamic = "force-dynamic";

export default async function PageDetailPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const path = typeof sp.path === "string" ? sp.path : null;
  if (!path || !path.startsWith("/") || path.length > 300) notFound();
  const { f } = await readAnalyticsFilter(sp);
  const [detail, table] = await Promise.all([getPageDetail(f, path), getPagesTable(f)]);
  const row = table.find((r) => r.path === path);
  const reach = scrollReach(detail.scroll, 25);
  const half = depthReachedBy(detail.scroll, 0.5);
  const storefront = isStorefrontView(f);
  const back = `/admin/analytics/pages${filterParams(f)}`;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <BackLink href={back}>الصفحات</BackLink>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="min-w-0 text-[24px] leading-[30px] font-bold break-all" dir="auto">
            {pathLabel(path)}
          </h2>
          <Link href={`/admin/analytics/heatmaps${filterParams(f, { path })}`} className={appleButton.gray}>
            <Flame className="size-4" />
            افتح الـ heatmap
          </Link>
        </div>
        {row?.title && <p className="text-[14px] text-muted-foreground">{row.title}</p>}
      </div>
      <Toolbar filter={f} />

      <section className="apple-card grid grid-cols-2 gap-5 p-5 sm:grid-cols-4 lg:grid-cols-8">
        <Stat label="مشاهدات" value={fmtNum(row?.views ?? 0)} />
        <Stat label="زوار" value={fmtNum(row?.visitors ?? 0)} />
        <Stat label="دخول" value={fmtNum(row?.entrances ?? 0)} />
        <Stat label="خروج" value={fmtNum(row?.exits ?? 0)} hint={`${fmtPct(row ? ratio(row.exits, row.views) : null)} من المشاهدات`} />
        <Stat label="وقت التفاعل" value={fmtDuration(row?.avgEngagedMs ?? null)} hint="متوسط لكل مشاهدة" />
        <Stat label="ارتداد" value={fmtPct(row ? ratio(row.bounces, row.entrances) : null)} hint="من اللي دخلوا عليها" />
        <Stat label="تحويل" value={fmtPct(row ? ratio(row.convertedSessions, row.sessions) : null)} hint={storefront ? "زيارات فيها طلب" : "زيارات فيها تسجيل"} />
        <Stat label="ضغطات CTA" value={fmtNum(row?.ctaClicks ?? 0)} />
      </section>

      <TrendChart
        title="المشاهدات على مدار الفترة"
        labels={detail.trend.map((t) => t.label)}
        prevLabels={[]}
        metrics={[
          { key: "views", label: "مشاهدات", format: "count", current: detail.trend.map((t) => t.views), previous: null },
          { key: "visitors", label: "زوار", format: "count", current: detail.trend.map((t) => t.visitors), previous: null },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="جم منين" subtitle="لما دي كانت أول صفحة في الزيارة" flush>
          <BarList valueLabel="زيارات" items={detail.sources.map((s) => ({ key: s.key, label: channelLabel(s.key), value: s.sessions }))} empty="محدش دخل على الصفحة دي كأول صفحة" />
        </Section>
        <Section title="الصفحة اللي قبلها" flush>
          <BarList
            valueLabel="مشاهدات"
            items={detail.previous.map((p) => ({ key: p.key ?? "entry", label: p.key ? <span dir="auto">{pathLabel(p.key)}</span> : "(أول صفحة في الزيارة)", value: p.views }))}
          />
        </Section>
        <Section title="راحوا فين بعدها" flush>
          <BarList
            valueLabel="مشاهدات"
            items={detail.next.filter((n) => n.views > 0).map((n) => ({ key: n.key, label: n.key === "(exit)" ? "خرجوا من الموقع" : <span dir="auto">{pathLabel(n.key)}</span>, value: n.views }))}
          />
        </Section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Section
          title="السكرول"
          subtitle={half === null ? "لسه مفيش بيانات سكرول" : `نص الزوار وصلوا لـ ${fmtPct(half / 100)} من الصفحة`}
          info={<p>لكل مشاهدة بنسجل أعمق نقطة شافها الزائر (أسفل الشاشة ÷ طول الصفحة). النسبة = كام مشاهدة وصلت للعمق ده.</p>}
        >
          <ol className="space-y-2">
            {reach.map((r) => (
              <li key={r.depth} className="flex items-center gap-3 text-[13px]">
                <span className="w-12 shrink-0 text-muted-foreground tabular-nums">{fmtPct(r.depth / 100)}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-(--viz-track)">
                  <span className="block h-full rounded-full bg-(--viz-1)" style={{ width: `${r.reached * 100}%` }} />
                </span>
                <span className="w-10 shrink-0 text-end font-medium tabular-nums">{fmtPct(r.reached)}</span>
              </li>
            ))}
          </ol>
        </Section>
        <Section title="أكتر حاجات اتضغط عليها" flush>
          <BarList valueLabel="ضغطات" items={detail.elements.map((e) => ({ key: e.sel, label: e.label ?? <span className="text-muted-foreground" dir="ltr">{e.sel.split(">").slice(-2).join(" › ")}</span>, value: e.clicks }))} empty="مفيش ضغطات متسجلة" />
        </Section>
        <Section title="الأجهزة وأزرار الـ CTA" flush>
          <BarList valueLabel="مشاهدات" items={detail.devices.map((d) => ({ key: d.key, label: deviceLabel(d.key), value: d.views }))} />
          {detail.ctas.length > 0 && (
            <>
              <p className="px-5 pt-2 pb-1 text-[12px] font-semibold text-muted-foreground">ضغطات CTA</p>
              <BarList valueLabel="ضغطات" items={detail.ctas.map((c) => ({ key: c.key, label: c.key, value: c.clicks }))} />
            </>
          )}
        </Section>
      </div>
      <Note className="px-1">كل الأرقام للفترة والفلاتر اللي فوق.</Note>
    </div>
  );
}
