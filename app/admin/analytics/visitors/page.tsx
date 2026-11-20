import { readAnalyticsFilter } from "@/lib/analytics/access";
import { ratio } from "@/lib/analytics/metrics";
import { getVisitorBreakdowns, type BreakdownRow } from "@/lib/analytics/queries/breakdowns";
import { BarList } from "../_components/bar-list";
import { Toolbar } from "../_components/toolbar";
import { Note, Section } from "../_components/ui";
import { countryName, deviceLabel, flagOf, fmtPct, languageName } from "../_lib/format";

export const dynamic = "force-dynamic";

const engaged = (r: BreakdownRow) => `${fmtPct(ratio(r.engaged, r.sessions))} تفاعل`;
const items = (rows: BreakdownRow[], label: (r: BreakdownRow) => React.ReactNode) =>
  rows.map((r) => ({ key: `${r.key ?? "none"}-${r.sub ?? ""}`, label: label(r), value: r.sessions, extra: engaged(r) }));

export default async function VisitorsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { f } = await readAnalyticsFilter(await searchParams);
  const b = await getVisitorBreakdowns(f);
  const geoNote = "المكان من عنوان الـ IP عن طريق الاستضافة — تقريبي (ممكن يطلع مدينة الشبكة مش مدينة الزائر)، والـ IP نفسه مش بيتخزن.";

  return (
    <div className="space-y-6">
      <Toolbar filter={f} report="visitors" />

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="جداد ولا راجعين" subtitle="الزيارات حسب نوع الزائر" flush info={<p>جديد = أول زيارة للمتصفح ده لكاشو (أو للمتجر ده). راجع = كان زار قبل كده من نفس المتصفح.</p>}>
          <BarList valueLabel="زيارات" items={items(b.visitorType, (r) => (r.key === "returning" ? "راجعين" : "جداد"))} />
        </Section>
        <Section title="نوع الجهاز" subtitle="من المتصفح نفسه، مش من مقاس الشاشة" flush>
          <BarList valueLabel="زيارات" items={items(b.device, (r) => deviceLabel(r.key))} />
        </Section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="الدول" subtitle="تقريبي" info={<p>{geoNote}</p>} flush>
          <BarList valueLabel="زيارات" items={items(b.country, (r) => `${flagOf(r.key)} ${countryName(r.key)}`)} />
        </Section>
        <Section title="المدن" subtitle="تقريبي — لما تكون معروفة" info={<p>{geoNote}</p>} flush>
          <BarList
            valueLabel="زيارات"
            items={items(
              b.city.filter((r) => r.key),
              (r) => (
                <>
                  {r.key} <span className="text-muted-foreground">{r.sub ? `· ${countryName(r.sub)}` : ""}</span>
                </>
              ),
            )}
            empty="المدن بتظهر لما الاستضافة تبعتها (Vercel)"
          />
        </Section>
        <Section title="اللغة" subtitle="لغة المتصفح" flush>
          <BarList valueLabel="زيارات" items={items(b.language, (r) => languageName(r.key))} />
        </Section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="المتصفحات" flush>
          <BarList valueLabel="زيارات" items={items(b.browser, (r) => r.key ?? "غير معروف")} />
        </Section>
        <Section title="أنظمة التشغيل" flush>
          <BarList valueLabel="زيارات" items={items(b.os, (r) => r.key ?? "غير معروف")} />
        </Section>
        <Section title="دقة الشاشة" subtitle="عرض × ارتفاع الشاشة بالـ CSS pixels" flush>
          <BarList valueLabel="زيارات" items={items(b.screen, (r) => <span dir="ltr">{r.key ?? "—"}</span>)} />
        </Section>
        <Section title="عرض نافذة المتصفح" subtitle="المساحة اللي الصفحة اتعرضت فيها فعلًا (بتحدد شكل الـ layout)" flush>
          <BarList valueLabel="زيارات" items={items(b.viewport, (r) => <span dir="ltr">{r.key ? `${r.key} px` : "—"}</span>)} />
        </Section>
      </div>

      <Note className="px-1">
        بيانات مجمعة بس: مفيش IP ولا user agent كامل ولا بصمة جهاز بتتخزن. المتصفح والنظام ونوع الجهاز بيتقروا من الـ user agent ساعة الزيارة وبيتخزنوا كأسماء عامة.
      </Note>
    </div>
  );
}
