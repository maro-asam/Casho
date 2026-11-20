import { Bug, Gauge } from "lucide-react";
import { Unavailable } from "@/components/saas-page";
import { readAnalyticsFilter } from "@/lib/analytics/access";
import { VITAL_THRESHOLDS, ratio, vitalRating } from "@/lib/analytics/metrics";
import { getPerformance } from "@/lib/analytics/queries/activity";
import { cn } from "@/lib/utils";
import { Toolbar } from "../_components/toolbar";
import { DataTable, Note, Section } from "../_components/ui";
import { deviceLabel, fmtDateTime, fmtNum, fmtPct, pathLabel } from "../_lib/format";

export const dynamic = "force-dynamic";

const VITALS: { key: string; name: string; what: string }[] = [
  { key: "LCP", name: "أكبر عنصر ظهر (LCP)", what: "إمتى المحتوى الأساسي للصفحة ظهر." },
  { key: "INP", name: "سرعة الاستجابة (INP)", what: "الصفحة بترد على الضغط والكتابة في قد إيه." },
  { key: "CLS", name: "ثبات الصفحة (CLS)", what: "قد إيه المحتوى بيتنطط وهو بيحمّل." },
  { key: "FCP", name: "أول رسم (FCP)", what: "إمتى أول حاجة ظهرت على الشاشة." },
  { key: "TTFB", name: "رد السيرفر (TTFB)", what: "أول بايت وصل من السيرفر." },
];

const RATING: Record<string, { label: string; cls: string }> = {
  good: { label: "كويس", cls: "text-(--viz-good)" },
  "needs-improvement": { label: "محتاج تحسين", cls: "text-(--sys-orange)" },
  poor: { label: "ضعيف", cls: "text-(--viz-bad)" },
};

const fmtVital = (key: string, v: number | null) =>
  v === null ? "—" : key === "CLS" ? v.toLocaleString("ar-EG", { maximumFractionDigits: 3 }) : v >= 1000 ? `${(v / 1000).toLocaleString("ar-EG", { maximumFractionDigits: 2 })} ث` : `${fmtNum(v)} مللي`;

function RatingText({ metric, value }: { metric: string; value: number | null }) {
  const r = value === null ? null : vitalRating(metric, value);
  if (!r) return <span>{fmtVital(metric, value)}</span>;
  return (
    <span className={cn("font-medium", RATING[r].cls)}>
      {fmtVital(metric, value)} <span className="text-[11px]">({RATING[r].label})</span>
    </span>
  );
}

export default async function PerformancePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { f } = await readAnalyticsFilter(await searchParams);
  const d = await getPerformance(f);
  const byMetric = new Map(d.vitals.map((v) => [v.metric, v]));
  const devices = [...new Set(d.byDevice.map((r) => r.device))];
  const lcpGood = d.lcpConversion.find((r) => r.rating === "good");
  const lcpPoor = d.lcpConversion.filter((r) => r.rating !== "good").reduce((a, r) => ({ sessions: a.sessions + r.sessions, engaged: a.engaged + r.engaged, converted: a.converted + r.converted }), { sessions: 0, engaged: 0, converted: 0 });

  return (
    <div className="space-y-6">
      <Toolbar filter={f} report="performance" />

      <section aria-label="Core Web Vitals" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {VITALS.map((v) => {
          const m = byMetric.get(v.key);
          const total = m ? m.good + m.ni + m.poor : 0;
          return (
            <div key={v.key} className="apple-card space-y-2 px-5 py-4">
              <p className="text-[13px] text-muted-foreground">{v.name}</p>
              <p className="text-[24px] leading-[30px] font-bold tabular-nums">
                <RatingText metric={v.key} value={m ? m.p75 : null} />
              </p>
              {total > 0 ? (
                <>
                  <div className="flex h-2 gap-[2px] overflow-hidden rounded-full" role="img" aria-label={`كويس ${fmtPct(m!.good / total)}، محتاج تحسين ${fmtPct(m!.ni / total)}، ضعيف ${fmtPct(m!.poor / total)}`}>
                    <span className="bg-(--viz-good)" style={{ width: `${(m!.good / total) * 100}%` }} />
                    <span className="bg-(--viz-warn)" style={{ width: `${(m!.ni / total) * 100}%` }} />
                    <span className="bg-(--viz-bad)" style={{ width: `${(m!.poor / total) * 100}%` }} />
                  </div>
                  <p className="text-[11px] text-muted-foreground tabular-nums">
                    {fmtPct(m!.good / total)} كويس · {fmtNum(total)} قياس
                  </p>
                </>
              ) : (
                <p className="text-[12px] text-muted-foreground">لسه مفيش قياسات</p>
              )}
              <p className="text-[11px] leading-[15px] text-muted-foreground">
                {v.what} الحد الكويس ≤ {fmtVital(v.key, VITAL_THRESHOLDS[v.key][0])}
              </p>
            </div>
          );
        })}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="الأداء حسب الجهاز" subtitle="الـ p75: ٧٥٪ من الزيارات أسرع من الرقم ده" flush>
          {devices.length ? (
            <DataTable minWidth={520} head={["الجهاز", "LCP", "INP", "CLS", "TTFB"]}>
              {devices.map((dev) => {
                const get = (k: string) => d.byDevice.find((r) => r.device === dev && r.metric === k)?.p75 ?? null;
                return (
                  <tr key={dev}>
                    <td className="font-medium">{deviceLabel(dev)}</td>
                    {["LCP", "INP", "CLS", "TTFB"].map((k) => (
                      <td key={k}>
                        <RatingText metric={k} value={get(k)} />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </DataTable>
          ) : (
            <p className="px-5 pb-6 text-[14px] text-muted-foreground">لسه مفيش قياسات.</p>
          )}
        </Section>
        <Section
          title="البطء بيأثر على التحويل؟"
          subtitle="الزيارات حسب سرعة أول صفحة (LCP)"
          info={<p>بنقارن الزيارات اللي أول صفحة فيها ظهرت بسرعة (LCP كويس) باللي كانت أبطأ. الفرق مش بيثبت سبب، بس بيوريك لو البطء مرتبط بخسارة زوار.</p>}
        >
          {lcpGood || lcpPoor.sessions ? (
            <dl className="grid grid-cols-2 gap-4 text-[14px]">
              <div className="space-y-1">
                <dt className="text-[12px] text-muted-foreground">أول صفحة سريعة</dt>
                <dd className="tabular-nums">{fmtNum(lcpGood?.sessions ?? 0)} زيارة</dd>
                <dd className="tabular-nums">تفاعل {fmtPct(lcpGood ? ratio(lcpGood.engaged, lcpGood.sessions) : null)}</dd>
                <dd className="tabular-nums">تحويل {fmtPct(lcpGood ? ratio(lcpGood.converted, lcpGood.sessions) : null)}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-[12px] text-muted-foreground">أول صفحة بطيئة</dt>
                <dd className="tabular-nums">{fmtNum(lcpPoor.sessions)} زيارة</dd>
                <dd className="tabular-nums">تفاعل {fmtPct(ratio(lcpPoor.engaged, lcpPoor.sessions))}</dd>
                <dd className="tabular-nums">تحويل {fmtPct(ratio(lcpPoor.converted, lcpPoor.sessions))}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-[14px] text-muted-foreground">لسه مفيش قياسات كفاية.</p>
          )}
        </Section>
      </div>

      <Section title="أبطأ الصفحات" subtitle="حسب LCP (p75)، الصفحات اللي عليها ٣ قياسات أو أكتر" flush>
        {d.byPage.length ? (
          <DataTable minWidth={720} head={["الصفحة", "LCP", "INP", "CLS", "TTFB", "قياسات"]}>
            {d.byPage.map((r) => (
              <tr key={r.path}>
                <td className="max-w-72 truncate font-medium" dir="auto">
                  {pathLabel(r.path)}
                </td>
                <td>
                  <RatingText metric="LCP" value={r.lcp} />
                </td>
                <td>
                  <RatingText metric="INP" value={r.inp} />
                </td>
                <td>
                  <RatingText metric="CLS" value={r.cls} />
                </td>
                <td>
                  <RatingText metric="TTFB" value={r.ttfb} />
                </td>
                <td>{fmtNum(r.n)}</td>
              </tr>
            ))}
          </DataTable>
        ) : (
          <Unavailable icon={Gauge} title="لسه مفيش قياسات كفاية" className="py-10" />
        )}
      </Section>

      <Section title="أخطاء JavaScript وملفات ما اتحملتش" subtitle="متجمعة بالرسالة · الأرقام والإيميلات جوه الرسايل متخفية" flush>
        {d.errors.length ? (
          <DataTable minWidth={860} head={["الخطأ", "مرات", "زيارات", "صفحات", "آخر مرة"]}>
            {d.errors.map((e, i) => (
              <tr key={i}>
                <td className="max-w-[420px]">
                  <p className="truncate font-medium" dir="ltr" title={e.message}>
                    {e.message}
                  </p>
                  <p className="truncate text-[12px] text-muted-foreground" dir="ltr">
                    {e.kind === "resource_error" ? "ملف ما اتحملش" : "JS"} · {e.source ?? "—"} · {e.samplePath ?? ""}
                  </p>
                </td>
                <td>{fmtNum(e.n)}</td>
                <td>{fmtNum(e.sessions)}</td>
                <td>{fmtNum(e.pages)}</td>
                <td className="whitespace-nowrap">{fmtDateTime(e.lastSeen)}</td>
              </tr>
            ))}
          </DataTable>
        ) : (
          <Unavailable icon={Bug} title="مفيش أخطاء متسجلة" description="أخطاء الـ JavaScript اللي بتحصل عند الزوار بتظهر هنا (لو مفعّلة من الإعدادات)." className="py-10" />
        )}
      </Section>

      <Section
        title="طلبات شبكة فشلت"
        subtitle="ردود ٤٠٠ و٥٠٠ اللي المتصفح قدر يشوفها (صفحات، API، صور)"
        info={<p>من Resource Timing في المتصفح (Chrome / Edge). المتصفحات اللي مش بتدي حالة الرد مش بتظهر هنا. مفيش أي محتوى من الطلب بيتسجل — العنوان (من غير query) والحالة بس.</p>}
        flush
      >
        {d.failed.length ? (
          <DataTable minWidth={760} head={["العنوان", "الحالة", "النوع", "مرات", "زيارات", "آخر مرة"]}>
            {d.failed.map((r, i) => (
              <tr key={i}>
                <td className="max-w-80 truncate font-medium" dir="ltr">
                  {r.url}
                </td>
                <td className={r.status >= 500 ? "text-(--viz-bad)" : ""}>{r.status}</td>
                <td>{r.type ?? "—"}</td>
                <td>{fmtNum(r.n)}</td>
                <td>{fmtNum(r.sessions)}</td>
                <td className="whitespace-nowrap">{fmtDateTime(r.lastSeen)}</td>
              </tr>
            ))}
          </DataTable>
        ) : (
          <p className="px-5 pb-6 text-[14px] text-muted-foreground">مفيش طلبات فاشلة متسجلة.</p>
        )}
      </Section>

      <Note className="px-1">القياسات من متصفحات الزوار الحقيقيين (Real User Monitoring) عن طريق web-vitals المدمجة في Next.js. التصنيف حسب حدود Google.</Note>
    </div>
  );
}
