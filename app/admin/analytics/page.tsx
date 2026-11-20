import Link from "next/link";
import { Activity } from "lucide-react";
import { Unavailable, appleButton } from "@/components/saas-page";
import { readAnalyticsFilter } from "@/lib/analytics/access";
import { filterParams, isStorefrontView, type AnalyticsFilter } from "@/lib/analytics/filters";
import { deriveRates, ratio } from "@/lib/analytics/metrics";
import { getOverview, type Series } from "@/lib/analytics/queries/overview";
import { getBreakdown } from "@/lib/analytics/queries/breakdowns";
import { getPagesTable } from "@/lib/analytics/queries/pages";
import { getTrackingStart } from "@/lib/analytics/queries/status";
import { BarList } from "./_components/bar-list";
import { KpiGrid, type KpiSpec } from "./_components/kpi";
import { Toolbar } from "./_components/toolbar";
import { TrendChart, type TrendMetric } from "./_components/trend-chart";
import { Note, Section } from "./_components/ui";
import { channelLabel, deviceLabel, fmtDateTime, fmtDec, fmtDuration, fmtMoney, fmtNum, fmtPct, pathLabel } from "./_lib/format";

export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | string[] | undefined>>;

const perBucket = (a: number[], b: number[]) => a.map((v, i) => (b[i] ? v / b[i] : 0));

function compareLabelOf(f: AnalyticsFilter) {
  if (f.compare === "year") return "عن السنة اللي فاتت";
  if (f.compare === "none") return "";
  return "عن الفترة اللي قبلها";
}

export default async function AnalyticsOverviewPage({ searchParams }: { searchParams: SP }) {
  const { f } = await readAnalyticsFilter(await searchParams);
  const storefront = isStorefrontView(f);
  const [data, channels, devices, pages, started] = await Promise.all([
    getOverview(f),
    getBreakdown(f, "channel", 10),
    getBreakdown(f, "device", 5),
    getPagesTable(f),
    getTrackingStart(),
  ]);

  const c = data.current.totals;
  const p = data.previous?.totals ?? null;
  const cb = data.current.business;
  const pb = data.previous?.business ?? null;
  const rc = deriveRates(c);
  const rp = p ? deriveRates(p) : null;
  const s: Series = data.series;
  const compareLabel = compareLabelOf(f);

  const traffic: KpiSpec[] = [
    {
      id: "visitor-days",
      label: "إجمالي الزوار",
      value: fmtNum(c.visitorDays),
      current: c.visitorDays,
      previous: p?.visitorDays ?? null,
      spark: s.visitors,
      definition: (
        <>
          <p>مجموع الزوار المختلفين في كل يوم من أيام الفترة. نفس الشخص لو جه يومين بيتحسب مرتين.</p>
          <p>الزائر = متصفح عليه رقم عشوائي من كاشو (cookie)، مش شخص متأكدين منه.</p>
        </>
      ),
    },
    {
      id: "visitors",
      label: "زوار فريدين",
      value: fmtNum(c.visitors),
      current: c.visitors,
      previous: p?.visitors ?? null,
      spark: s.visitors,
      definition: <p>عدد المتصفحات المختلفة اللي زارت في الفترة كلها، كل متصفح مرة واحدة. لو حد مسح الـ cookies أو فتح من جهاز تاني بيتحسب زائر جديد.</p>,
    },
    {
      id: "sessions",
      label: "الزيارات (Sessions)",
      value: fmtNum(c.sessions),
      current: c.sessions,
      previous: p?.sessions ?? null,
      spark: s.sessions,
      definition: <p>زيارة = نشاط متصل من غير توقف أطول من مهلة الجلسة (٣٠ دقيقة افتراضيًا، من الإعدادات). بعد التوقف ده أي نشاط بيبدأ زيارة جديدة.</p>,
    },
    {
      id: "new",
      label: "زوار جداد",
      value: fmtNum(c.newVisitors),
      current: c.newVisitors,
      previous: p?.newVisitors ?? null,
      spark: s.newVisitors,
      hint: (
        <span className="text-[12px] text-muted-foreground tabular-nums">
          {fmtNum(rc.returningVisitors)} راجعين · {fmtPct(ratio(c.newVisitors, c.visitors))} جداد
        </span>
      ),
      definition: (
        <>
          <p>جديد = أول زيارة للمتصفح ده (مكانش عليه رقم كاشو قبل كده). راجع = كان زار قبل كده.</p>
          <p>الراجعين = الزوار الفريدين − الجداد.</p>
        </>
      ),
    },
    {
      id: "pageviews",
      label: "مشاهدات الصفحات",
      value: fmtNum(c.pageviews),
      current: c.pageviews,
      previous: p?.pageviews ?? null,
      spark: s.pageviews,
      definition: <p>كل فتح لصفحة، بما فيها التنقل جوه الموقع من غير reload. الصفحات المستبعدة من الإعدادات مش بتتحسب.</p>,
    },
    {
      id: "pps",
      label: "صفحات لكل زيارة",
      value: fmtDec(rc.pagesPerSession),
      current: rc.pagesPerSession,
      previous: rp?.pagesPerSession ?? null,
      spark: perBucket(s.pageviews, s.sessions),
      definition: <p>مشاهدات الصفحات ÷ عدد الزيارات.</p>,
    },
    {
      id: "duration",
      label: "متوسط مدة الزيارة",
      value: fmtDuration(rc.avgSessionMs),
      current: rc.avgSessionMs,
      previous: rp?.avgSessionMs ?? null,
      spark: perBucket(s.durationMs, s.sessions),
      definition: <p>من أول حاجة اتسجلت في الزيارة لآخر حاجة اتسجلت فيها، في المتوسط. زيارة صفحة واحدة من غير أي نشاط بعدها مدتها تقريبًا صفر.</p>,
    },
    {
      id: "engagement-time",
      label: "متوسط وقت التفاعل",
      value: fmtDuration(rc.avgEngagementMs),
      current: rc.avgEngagementMs,
      previous: rp?.avgEngagementMs ?? null,
      spark: perBucket(s.engagedMs, s.sessions),
      definition: (
        <p>الوقت اللي الصفحة كانت فيه ظاهرة وفي المقدمة والزائر بيستخدمها (حرّك، سكرول، ضغط في آخر دقيقتين)، مجموع صفحات الزيارة ÷ عدد الزيارات.</p>
      ),
    },
  ];

  const engagement: KpiSpec[] = [
    {
      id: "engagement-rate",
      label: "نسبة التفاعل",
      value: fmtPct(rc.engagementRate),
      current: rc.engagementRate,
      previous: rp?.engagementRate ?? null,
      spark: perBucket(s.engagedSessions, s.sessions),
      definition: <p>زيارة متفاعلة = فيها صفحتين أو أكتر، أو ١٠ ثواني تفاعل أو أكتر، أو تحويل ({storefront ? "طلب" : "تسجيل"}). النسبة = الزيارات المتفاعلة ÷ كل الزيارات (نفس تعريف Google Analytics 4).</p>,
    },
    {
      id: "bounce",
      label: "معدل الارتداد",
      value: fmtPct(rc.bounceRate),
      current: rc.bounceRate,
      previous: rp?.bounceRate ?? null,
      better: "down",
      spark: perBucket(s.sessions.map((v, i) => v - s.engagedSessions[i]), s.sessions),
      definition: <p>الزيارات اللي مكانتش متفاعلة ÷ كل الزيارات = ١ − نسبة التفاعل. يعني صفحة واحدة، أقل من ١٠ ثواني تفاعل، ومن غير تحويل.</p>,
    },
    {
      id: "conversion",
      label: storefront ? "نسبة التحويل (طلبات)" : "نسبة التحويل (تسجيل)",
      value: fmtPct(rc.conversionRate),
      current: rc.conversionRate,
      previous: rp?.conversionRate ?? null,
      spark: perBucket(s.convertedSessions, s.sessions),
      definition: storefront ? (
        <p>زيارات اتعمل فيها طلب (طلب موجود فعلًا في المتجر) ÷ كل الزيارات.</p>
      ) : (
        <p>زيارات اتعمل فيها حساب جديد (الحساب موجود فعلًا في قاعدة البيانات، مش بس ضغطة زرار) ÷ كل الزيارات.</p>
      ),
    },
    {
      id: "customers",
      label: storefront ? "زوار اشتروا" : "زوار بقوا عملاء دافعين",
      value: fmtPct(ratio(cb.customers, c.visitors)),
      current: ratio(cb.customers, c.visitors),
      previous: pb && p ? ratio(pb.customers, p.visitors) : null,
      hint: <span className="text-[12px] text-muted-foreground tabular-nums">{fmtNum(cb.customers)} من {fmtNum(c.visitors)} زائر</span>,
      definition: storefront ? (
        <p>الزوار الفريدين اللي عملوا طلب متسجل ومش ملغي ÷ الزوار الفريدين.</p>
      ) : (
        <p>من زوار الفترة دي: كام واحد سجّل حساب ومتجره اتخصم منه اشتراك واحد على الأقل (لحد النهارده) ÷ الزوار الفريدين. بيعتمد على ربط المتصفح بالحساب وقت التسجيل.</p>
      ),
    },
  ];

  const business: KpiSpec[] = storefront
    ? [
        {
          id: "orders",
          label: "طلبات من زيارات متتبعة",
          value: fmtNum(cb.orders),
          current: cb.orders,
          previous: pb?.orders ?? null,
          spark: s.orders,
          hint: <span className="text-[12px] text-muted-foreground tabular-nums">من {fmtNum(cb.allOrders)} طلب أونلاين في الفترة</span>,
          definition: <p>طلبات المتجر اللي اتربطت بزيارة متتبعة (الطلب موجود ومش ملغي). الفرق عن إجمالي الطلبات = زوار رفضوا القياس، أو Do Not Track، أو طلبات من غير المتصفح.</p>,
        },
        {
          id: "order-revenue",
          label: "قيمة الطلبات المتتبعة",
          value: fmtMoney(cb.orderRevenue),
          current: cb.orderRevenue,
          previous: pb?.orderRevenue ?? null,
          spark: s.orderRevenue,
          definition: <p>مجموع إجمالي الطلبات اللي فوق (من جدول الطلبات نفسه، مش من المتصفح).</p>,
        },
      ]
    : [
        {
          id: "signups",
          label: "حسابات جديدة",
          value: fmtNum(cb.signups),
          current: cb.signups,
          previous: pb?.signups ?? null,
          spark: s.signups,
          definition: <p>كل الحسابات اللي اتعملت في الفترة (من جدول المستخدمين)، سواء الزائر كان متتبع أو لأ. حسابات الإدارة والمبيعات مش محسوبة.</p>,
        },
        {
          id: "verified",
          label: "تسجيلات مكتملة",
          value: fmtNum(cb.verifiedSignups),
          current: cb.verifiedSignups,
          previous: pb?.verifiedSignups ?? null,
          spark: s.verifiedSignups,
          definition: <p>الحسابات الجديدة اللي أكدت الإيميل بالكود (أو سجلت بجوجل) — يعني تقدر تدخل الداشبورد فعلًا.</p>,
        },
        {
          id: "trials",
          label: "تجارب مجانية بدأت",
          value: fmtNum(cb.trials),
          current: cb.trials,
          previous: pb?.trials ?? null,
          spark: s.trials,
          definition: <p>متاجر بدأت فترة التجربة المجانية في الفترة (كل متجر جديد بياخد تجربة تلقائيًا).</p>,
        },
        {
          id: "paid",
          label: "اشتراكات مدفوعة",
          value: fmtNum(cb.paidStores),
          current: cb.paidStores,
          previous: pb?.paidStores ?? null,
          spark: s.paidStores,
          definition: <p>عدد المتاجر اللي اتخصم منها اشتراك في الفترة (قيد SUBSCRIPTION_CHARGE في دفتر الرصيد) — دفع مؤكد، مش ضغطة على زرار.</p>,
        },
        {
          id: "revenue",
          label: "إيراد الاشتراكات",
          value: fmtMoney(cb.revenue),
          current: cb.revenue,
          previous: pb?.revenue ?? null,
          spark: s.revenue,
          definition: <p>خصومات الاشتراك − المرتجع في الفترة (نفس تعريف صفحة الأرباح).</p>,
        },
        {
          id: "attributed",
          label: "إيراد من زيارات متتبعة",
          value: fmtMoney(cb.attributedRevenue),
          current: cb.attributedRevenue,
          previous: pb?.attributedRevenue ?? null,
          hint: <span className="text-[12px] text-muted-foreground tabular-nums">{fmtPct(ratio(cb.attributedRevenue, cb.revenue))} من الإيراد</span>,
          definition: (
            <p>الجزء من إيراد الفترة اللي جه من متاجر صاحبها اتسجل من متصفح متتبع، وأول زيارة ليه (قبل التسجيل) مطابقة للفلتر (الجهاز). المتاجر القديمة اللي اتعملت قبل التتبع مش هتظهر هنا.</p>
          ),
        },
      ];

  const metrics: TrendMetric[] = [
    { key: "visitors", label: "الزوار", format: "count", current: s.visitors, previous: data.prevSeries?.visitors ?? null },
    { key: "sessions", label: "الزيارات", format: "count", current: s.sessions, previous: data.prevSeries?.sessions ?? null },
    { key: "pageviews", label: "المشاهدات", format: "count", current: s.pageviews, previous: data.prevSeries?.pageviews ?? null },
    {
      key: "engagement",
      label: "التفاعل",
      format: "pct",
      current: s.sessions.map((v, i) => (v ? s.engagedSessions[i] / v : null)),
      previous: data.prevSeries ? data.prevSeries.sessions.map((v, i) => (v ? data.prevSeries!.engagedSessions[i] / v : null)) : null,
    },
    storefront
      ? { key: "orders", label: "الطلبات", format: "count", current: s.orders, previous: data.prevSeries?.orders ?? null }
      : { key: "signups", label: "التسجيلات", format: "count", current: s.signups, previous: data.prevSeries?.signups ?? null },
    storefront
      ? { key: "rev", label: "قيمة الطلبات", format: "money", current: s.orderRevenue, previous: data.prevSeries?.orderRevenue ?? null }
      : { key: "rev", label: "الإيراد", format: "money", current: s.revenue, previous: data.prevSeries?.revenue ?? null },
  ];

  const qs = filterParams(f);
  const noTraffic = c.sessions === 0 && (p?.sessions ?? 0) === 0;

  return (
    <div className="space-y-6">
      <Toolbar filter={f} report="overview" />

      {noTraffic && (
        <section className="apple-card">
          <Unavailable
            icon={Activity}
            title={started ? "مفيش زيارات في الفترة دي" : "التتبع لسه مبدأش يجمع بيانات"}
            description={
              started
                ? `أول زيارة اتسجلت ${fmtDateTime(started)}. جرّب فترة تانية أو نطاق تاني من الفلتر.`
                : "الأرقام هتبدأ تظهر مع أول زائر بعد نشر التحديث. زياراتك إنت (والفريق) مش بتتحسب — افتح الموقع من متصفح خاص عشان تجرب."
            }
            action={
              <Link href="/admin/analytics/realtime" className={appleButton.gray}>
                شوف الزوار دلوقتي
              </Link>
            }
          />
        </section>
      )}

      <div className="space-y-3">
        <h2 className="px-1 text-[13px] font-semibold text-muted-foreground">الزيارات</h2>
        <KpiGrid items={traffic} compareLabel={compareLabel} />
      </div>
      <div className="space-y-3">
        <h2 className="px-1 text-[13px] font-semibold text-muted-foreground">التفاعل والتحويل</h2>
        <KpiGrid items={engagement} compareLabel={compareLabel} />
      </div>
      <div className="space-y-3">
        <h2 className="px-1 text-[13px] font-semibold text-muted-foreground">{storefront ? "المبيعات (طلبات مؤكدة)" : "النتايج (من سجلات كاشو المؤكدة)"}</h2>
        <KpiGrid items={business} compareLabel={compareLabel} className={storefront ? "lg:grid-cols-2" : "lg:grid-cols-3"} />
      </div>

      <TrendChart
        title="على مدار الفترة"
        labels={data.buckets.map((b) => b.label)}
        prevLabels={data.prevBuckets.map((b) => b.label)}
        metrics={metrics}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="منين جايين" subtitle="الزيارات حسب نوع المصدر" flush>
          <BarList
            valueLabel="زيارات"
            items={channels.map((r) => ({
              key: r.key ?? "none",
              label: channelLabel(r.key),
              value: r.sessions,
              extra: `${fmtPct(ratio(r.converted, r.sessions))} تحويل`,
              href: `/admin/analytics/acquisition${qs}`,
            }))}
          />
        </Section>
        <Section title="أكتر الصفحات" subtitle="حسب المشاهدات" flush>
          <BarList
            valueLabel="مشاهدات"
            items={pages.slice(0, 8).map((r) => ({
              key: r.path,
              label: <span dir="auto">{pathLabel(r.path)}</span>,
              value: r.views,
              href: `/admin/analytics/pages/detail${filterParams(f, { path: r.path })}`,
            }))}
          />
        </Section>
        <Section title="الأجهزة" subtitle="الزيارات حسب نوع الجهاز" flush>
          <BarList
            valueLabel="زيارات"
            items={devices.map((r) => ({
              key: r.key ?? "none",
              label: deviceLabel(r.key),
              value: r.sessions,
              extra: `${fmtPct(ratio(r.engaged, r.sessions))} تفاعل`,
            }))}
          />
        </Section>
      </div>

      <Note className="px-1">
        الزيارات من متصفحات الإدارة والمبيعات وأصحاب المتاجر على متاجرهم مش بتتحسب. اللي رفض القياس أو عنده Do Not Track مش بيتحسب برضه، فالأرقام دي أقل شوية من الحقيقة — بس كل رقم فيها حقيقي.
      </Note>
    </div>
  );
}
