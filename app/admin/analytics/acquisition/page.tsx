import { Segmented } from "@/components/saas-page";
import { CHANNEL_DESCRIPTIONS, CHANNEL_LABELS, CHANNELS } from "@/lib/analytics/channel";
import { filterParams, isStorefrontView, parseAnalyticsFilter } from "@/lib/analytics/filters";
import { ratio } from "@/lib/analytics/metrics";
import { getAcquisition, getBreakdown, type AttributionModel, type Dimension, type TouchDimension } from "@/lib/analytics/queries/breakdowns";
import { BarList } from "../_components/bar-list";
import { Toolbar } from "../_components/toolbar";
import { DataTable, Note, Section } from "../_components/ui";
import { channelLabel, deviceLabel, fmtMoney, fmtNum, fmtPct, pathLabel } from "../_lib/format";

export const dynamic = "force-dynamic";

const DIMS: { value: Dimension & TouchDimension; label: string }[] = [
  { value: "channel", label: "نوع المصدر" },
  { value: "source", label: "المصدر" },
  { value: "medium", label: "utm_medium" },
  { value: "campaign", label: "utm_campaign" },
  { value: "content", label: "utm_content" },
  { value: "term", label: "utm_term" },
  { value: "referrer", label: "المواقع المحيلة" },
  { value: "landing", label: "صفحات الهبوط" },
];

export default async function AcquisitionPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const f = parseAnalyticsFilter(sp);
  const storefront = isStorefrontView(f);
  const dim = (DIMS.find((d) => d.value === sp.dim)?.value ?? "channel") as Dimension & TouchDimension;
  const model: AttributionModel = sp.model === "last" ? "last" : "first";
  const [{ traffic, conversions }, channels] = await Promise.all([getAcquisition(f, dim, model), getBreakdown(f, "channel", 10)]);

  const convByKey = new Map(conversions.map((c) => [c.key ?? "", c]));
  const keys = [...new Set([...traffic.map((t) => t.key ?? ""), ...conversions.map((c) => c.key ?? "")])];
  const rows = keys
    .map((key) => {
      const t = traffic.find((x) => (x.key ?? "") === key);
      const c = convByKey.get(key) as Record<string, number> | undefined;
      return { key, t, c };
    })
    .sort((a, b) => (b.t?.sessions ?? 0) - (a.t?.sessions ?? 0) || (b.c?.signups ?? b.c?.orders ?? 0) - (a.c?.signups ?? a.c?.orders ?? 0));

  const label = (key: string) => {
    if (!key) return <span className="text-muted-foreground">{dim === "landing" || dim === "channel" ? "—" : "(من غير قيمة)"}</span>;
    if (dim === "channel") return channelLabel(key);
    if (dim === "landing") return <span dir="auto">{pathLabel(key)}</span>;
    if (dim === "source" && key === "(direct)") return "(مباشر)";
    return <span dir="auto">{key}</span>;
  };

  const head = storefront
    ? ["", "زيارات", "زوار", "تفاعل", "تحويل", "طلبات", "قيمة الطلبات"]
    : ["", "زيارات", "زوار", "تفاعل", "تحويل", "تسجيلات", "دفعوا", "الإيراد"];

  return (
    <div className="space-y-6">
      <Toolbar filter={f} report={`acquisition:${dim}:${model}`} />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Section
          title="أنواع المصادر"
          subtitle="الزيارات ونسبة التحويل لكل نوع"
          flush
          info={
            <>
              {CHANNELS.map((c) => (
                <p key={c}>
                  <b className="text-foreground">{CHANNEL_LABELS[c]}:</b> {CHANNEL_DESCRIPTIONS[c]}
                </p>
              ))}
            </>
          }
        >
          <BarList
            valueLabel="زيارات"
            items={channels.map((r) => ({
              key: r.key ?? "none",
              label: channelLabel(r.key),
              value: r.sessions,
              extra: `${fmtPct(ratio(r.converted, r.sessions))} تحويل`,
              href: `/admin/analytics/acquisition${filterParams(f, { dim: "source" })}`,
            }))}
          />
        </Section>
        <Section
          title="إزاي بنحسب التحويلات"
          info={<p>حملات Meta: حط في رابط الإعلان utm_source={"{{site_source_name}}"}&utm_medium=paid&utm_campaign={"{{campaign.name}}"}&utm_content={"{{ad.name}}"} — fb/ig بيتجمعوا تلقائيًا كـ facebook/instagram.</p>}
        >
          <div className="space-y-2 text-[14px] leading-[21px] text-muted-foreground">
            {storefront ? (
              <p>الطلبات والقيمة من جدول الطلبات نفسه، مربوطة بالزيارة اللي اتعمل فيها الطلب (آخر زيارة). الطلبات الملغية مش محسوبة.</p>
            ) : (
              <>
                <p>
                  التسجيلات = حسابات اتعملت في الفترة، كل حساب بيتنسب لـ
                  <b className="text-foreground"> {model === "first" ? "أول زيارة" : "آخر زيارة من مصدر معروف"}</b> للمتصفح قبل التسجيل.
                </p>
                <p>«دفعوا» و«الإيراد» = متاجر الحسابات دي اللي اتخصم منها اشتراك فعلًا (لحد النهارده)، وصافي الاشتراكات منهم.</p>
                <p>الحسابات اللي اتعملت من متصفح مش متتبع (رفض القياس مثلًا) مش بتظهر هنا، فمجموع الجدول ممكن يبقى أقل من إجمالي التسجيلات.</p>
              </>
            )}
            {!storefront && (
              <Segmented
                label="طريقة النسب"
                param="model"
                basePath="/admin/analytics/acquisition"
                searchParams={sp}
                segments={[
                  { label: "أول زيارة", value: undefined },
                  { label: "آخر زيارة", value: "last" },
                ]}
              />
            )}
          </div>
        </Section>
      </div>

      <Section title="التفاصيل" subtitle="اختار البُعد" flush actions={null}>
        <div className="px-5 pb-3">
          <Segmented label="البُعد" param="dim" basePath="/admin/analytics/acquisition" searchParams={sp} segments={DIMS.map((d) => ({ label: d.label, value: d.value === "channel" ? undefined : d.value }))} />
        </div>
        {rows.length ? (
          <DataTable head={head} minWidth={760}>
            {rows.slice(0, 100).map(({ key, t, c }) => (
              <tr key={key || "none"}>
                <td className="max-w-72 truncate font-medium">{label(key)}</td>
                <td>{fmtNum(t?.sessions ?? 0)}</td>
                <td>{fmtNum(t?.visitors ?? 0)}</td>
                <td>{fmtPct(t ? ratio(t.engaged, t.sessions) : null)}</td>
                <td>{fmtPct(t ? ratio(t.converted, t.sessions) : null)}</td>
                {storefront ? (
                  <>
                    <td>{fmtNum(c?.orders ?? 0)}</td>
                    <td>{fmtMoney(c?.revenue ?? 0)}</td>
                  </>
                ) : (
                  <>
                    <td>{fmtNum(c?.signups ?? 0)}</td>
                    <td>{fmtNum(c?.paid ?? 0)}</td>
                    <td>{fmtMoney(c?.revenue ?? 0)}</td>
                  </>
                )}
              </tr>
            ))}
          </DataTable>
        ) : (
          <p className="px-5 pb-6 text-[14px] text-muted-foreground">مفيش زيارات بالبُعد ده في الفترة.</p>
        )}
      </Section>

      <Note className="px-1">
        {dim === "referrer" && "المواقع المحيلة = الدومين اللي الزائر جه منه (من غير الصفحة). "}
        «تحويل» = نسبة الزيارات من المصدر ده اللي {storefront ? "اتعمل فيها طلب" : "اتعمل فيها حساب"} في نفس الزيارة.{f.device !== "all" && ` (${deviceLabel(f.device)} بس)`}
      </Note>
    </div>
  );
}
