import Link from "next/link";
import type { ReactNode } from "react";
import { readAnalyticsFilter } from "@/lib/analytics/access";
import { filterParams, isStorefrontView } from "@/lib/analytics/filters";
import { ratio } from "@/lib/analytics/metrics";
import { getPagesTable, pageInsights, type PageRow } from "@/lib/analytics/queries/pages";
import { Toolbar } from "../_components/toolbar";
import { DataTable, Note, Section } from "../_components/ui";
import { fmtDuration, fmtNum, fmtPct, pathLabel } from "../_lib/format";

export const dynamic = "force-dynamic";

const SORTS = {
  views: (r: PageRow) => r.views,
  visitors: (r: PageRow) => r.visitors,
  entrances: (r: PageRow) => r.entrances,
  exits: (r: PageRow) => r.exits,
  engaged: (r: PageRow) => r.avgEngagedMs,
  scroll: (r: PageRow) => r.avgScroll,
  bounce: (r: PageRow) => ratio(r.bounces, r.entrances) ?? -1,
  conversion: (r: PageRow) => ratio(r.convertedSessions, r.sessions) ?? -1,
  exitRate: (r: PageRow) => ratio(r.exits, r.views) ?? -1,
  cta: (r: PageRow) => r.ctaClicks,
} as const;
type SortKey = keyof typeof SORTS;

function InsightCard({ title, info, rows, metric, href }: { title: string; info: ReactNode; rows: PageRow[]; metric: (r: PageRow) => string; href: (r: PageRow) => string }) {
  return (
    <Section title={title} info={info} flush>
      {rows.length ? (
        <ol className="apple-rows pb-2 [--row-inset:20px]">
          {rows.map((r) => (
            <li key={r.path}>
              <Link href={href(r)} className="apple-press flex min-h-11 items-center justify-between gap-3 px-5 py-2 text-[14px] hover:bg-muted/50">
                <span className="min-w-0 truncate" dir="auto">
                  {pathLabel(r.path)}
                </span>
                <span className="shrink-0 text-muted-foreground tabular-nums">{metric(r)}</span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className="px-5 pb-5 text-[13px] text-muted-foreground">مفيش صفحات عليها زيارات كفاية لسه.</p>
      )}
    </Section>
  );
}

export default async function PagesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const { f } = await readAnalyticsFilter(sp);
  const storefront = isStorefrontView(f);
  const rows = await getPagesTable(f);
  const insights = pageInsights(rows);
  const sort: SortKey = typeof sp.sort === "string" && sp.sort in SORTS ? (sp.sort as SortKey) : "views";
  const sorted = [...rows].sort((a, b) => SORTS[sort](b) - SORTS[sort](a));
  const detail = (r: PageRow) => `/admin/analytics/pages/detail${filterParams(f, { path: r.path })}`;
  const sortHref = (key: SortKey) => `/admin/analytics/pages${filterParams(f, { sort: key === "views" ? null : key })}`;
  const sortHead = (key: SortKey, label: string) => (
    <Link href={sortHref(key)} scroll={false} className={sort === key ? "font-semibold text-foreground" : "hover:text-foreground"} aria-current={sort === key ? "true" : undefined}>
      {label}
      {sort === key ? " ↓" : ""}
    </Link>
  );
  const enough = `بين الصفحات اللي عليها ${fmtNum(insights.minViews)} مشاهدة أو أكتر.`;
  const conv = storefront ? "طلب" : "تسجيل";

  return (
    <div className="space-y-6">
      <Toolbar filter={f} report="pages" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <InsightCard
          title="الأفضل أداءً"
          info={<p>أعلى نسبة زيارات فيها {conv} من الزيارات اللي شافت الصفحة. {enough}</p>}
          rows={insights.top}
          metric={(r) => `${fmtPct(ratio(r.convertedSessions, r.sessions))} تحويل`}
          href={detail}
        />
        <InsightCard
          title="أفضل صفحات هبوط"
          info={<p>صفحات الدخول بأعلى تحويل لكل زيارة بدأت منها، وبعدين الأقل ارتداد.</p>}
          rows={insights.bestLanding}
          metric={(r) => `${fmtPct(ratio(r.entryConversions, r.entrances))} تحويل · ${fmtNum(r.entrances)} دخول`}
          href={detail}
        />
        <InsightCard
          title="الأسوأ أداءً"
          info={<p>صفحات الدخول بأعلى معدل ارتداد (الزائر دخل عليها ومشي من غير تفاعل).</p>}
          rows={insights.worst}
          metric={(r) => `${fmtPct(ratio(r.bounces, r.entrances))} ارتداد`}
          href={detail}
        />
        <InsightCard
          title="زيارات كتير وتحويل قليل"
          info={<p>من أكتر ربع صفحات في المشاهدات، ونسبة التحويل فيها أقل من متوسط الموقع ({fmtPct(insights.siteConversion)}).</p>}
          rows={insights.highTrafficLowConversion}
          metric={(r) => `${fmtNum(r.views)} مشاهدة · ${fmtPct(ratio(r.convertedSessions, r.sessions))}`}
          href={detail}
        />
        <InsightCard
          title="أعلى نسبة خروج"
          info={<p>الخروج = آخر صفحة في الزيارة. النسبة = مرات الخروج ÷ المشاهدات. {enough}</p>}
          rows={insights.highExit}
          metric={(r) => `${fmtPct(ratio(r.exits, r.views))} خروج`}
          href={detail}
        />
      </div>

      <Section title="كل الصفحات" subtitle="اضغط على صفحة عشان تشوف تفاصيلها" flush>
        {sorted.length ? (
          <DataTable
            minWidth={1080}
            head={[
              "الصفحة",
              sortHead("views", "مشاهدات"),
              sortHead("visitors", "زوار"),
              sortHead("entrances", "دخول"),
              sortHead("exits", "خروج"),
              sortHead("engaged", "وقت التفاعل"),
              sortHead("scroll", "السكرول"),
              sortHead("bounce", "ارتداد"),
              sortHead("exitRate", "نسبة الخروج"),
              sortHead("conversion", "تحويل"),
              sortHead("cta", "ضغطات CTA"),
            ]}
          >
            {sorted.map((r) => (
              <tr key={r.path} className="hover:bg-muted/40">
                <td className="max-w-80">
                  <Link href={detail(r)} className="block truncate font-medium text-primary" dir="auto" title={r.title ?? r.path}>
                    {pathLabel(r.path)}
                  </Link>
                </td>
                <td>{fmtNum(r.views)}</td>
                <td>{fmtNum(r.visitors)}</td>
                <td>{fmtNum(r.entrances)}</td>
                <td>{fmtNum(r.exits)}</td>
                <td>{fmtDuration(r.avgEngagedMs)}</td>
                <td>{fmtPct(r.avgScroll / 100)}</td>
                <td>{fmtPct(ratio(r.bounces, r.entrances))}</td>
                <td>{fmtPct(ratio(r.exits, r.views))}</td>
                <td>{fmtPct(ratio(r.convertedSessions, r.sessions))}</td>
                <td>{fmtNum(r.ctaClicks)}</td>
              </tr>
            ))}
          </DataTable>
        ) : (
          <p className="px-5 pb-6 text-[14px] text-muted-foreground">مفيش مشاهدات في الفترة دي.</p>
        )}
      </Section>

      <Note className="px-1">
        الارتداد محسوب على الزيارات اللي بدأت من الصفحة. التحويل = الزيارات اللي شافت الصفحة واتعمل فيها {conv}. السكرول = متوسط أعمق نقطة وصلها الزائر من طول الصفحة. المسارات اللي فيها أرقام تعريف بتتجمع كـ <span dir="ltr">:id</span>.
        {storefront && !f.storeId && " في «كل المتاجر» نفس المسار من متاجر مختلفة بيتجمع مع بعض — اختار متجر عشان تشوف صفحاته لوحدها."}
      </Note>
    </div>
  );
}
