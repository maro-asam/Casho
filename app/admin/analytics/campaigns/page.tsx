import { Megaphone } from "lucide-react";
import { Segmented, Unavailable } from "@/components/saas-page";
import { canEditCampaignCosts, readAnalyticsFilter } from "@/lib/analytics/access";
import { ratio } from "@/lib/analytics/metrics";
import type { AttributedRow, OrderRow } from "@/lib/analytics/queries/breakdowns";
import { getCampaigns } from "@/lib/analytics/queries/campaigns";
import { Toolbar } from "../_components/toolbar";
import { DataTable, Note, Section } from "../_components/ui";
import { fmtDec, fmtMoney, fmtNum, fmtPct } from "../_lib/format";
import { CostManager } from "./cost-manager";

export const dynamic = "force-dynamic";

export default async function CampaignsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const { viewer, f } = await readAnalyticsFilter(sp);
  const model = sp.model === "last" ? "last" : "first";
  const data = await getCampaigns(f, model);

  const conv = new Map(data.conversions.map((c) => [c.key ?? "", c]));
  const keys = [...new Set([...data.traffic.map((t) => t.key ?? ""), ...data.conversions.map((c) => c.key ?? "")])].filter(Boolean);
  const rows = keys
    .map((key) => ({ key, t: data.traffic.find((x) => x.key === key), c: conv.get(key), cost: data.costByCampaign[key.toLowerCase()] ?? null }))
    .sort((a, b) => (b.t?.sessions ?? 0) - (a.t?.sessions ?? 0));

  return (
    <div className="space-y-6">
      <Toolbar filter={f} report={`campaigns:${model}`} />

      <Section
        title="الحملات"
        subtitle="الزيارات اللي عليها utm_campaign"
        flush
        info={
          <>
            <p>الحملة بتتعرف من utm_campaign في رابط الإعلان. {data.storefront ? "الطلبات والقيمة من جدول الطلبات." : "التسجيلات والدفع والإيراد من سجلات كاشو المؤكدة، منسوبة للحملة حسب طريقة النسب."}</p>
            <p>تكلفة العميل وعائد الإعلان بيظهروا بس للحملات اللي دخلت تكلفتها تحت — مفيش تقدير. التكلفة بتتوزع بالتساوي على أيام الحملة، وبنحسب الجزء اللي جوه الفترة.</p>
          </>
        }
        actions={
          data.storefront ? null : (
            <Segmented
              label="طريقة النسب"
              param="model"
              basePath="/admin/analytics/campaigns"
              searchParams={sp}
              segments={[
                { label: "أول زيارة", value: undefined },
                { label: "آخر زيارة", value: "last" },
              ]}
            />
          )
        }
      >
        {rows.length ? (
          <DataTable
            minWidth={980}
            head={
              data.storefront
                ? ["الحملة", "زيارات", "زوار", "تفاعل", "طلبات", "القيمة", "التكلفة", "تكلفة الطلب", "العائد (ROAS)"]
                : ["الحملة", "زيارات", "زوار", "تفاعل", "تسجيلات", "دفعوا", "الإيراد", "التكلفة", "تكلفة التسجيل", "تكلفة العميل الدافع", "العائد (ROAS)"]
            }
          >
            {rows.map(({ key, t, c, cost }) => {
              const a = c as AttributedRow | undefined;
              const o = c as OrderRow | undefined;
              const revenue = (data.storefront ? o?.revenue : a?.revenue) ?? 0;
              return (
                <tr key={key}>
                  <td className="max-w-64 truncate font-medium" dir="auto">
                    {key}
                  </td>
                  <td>{fmtNum(t?.sessions ?? 0)}</td>
                  <td>{fmtNum(t?.visitors ?? 0)}</td>
                  <td>{fmtPct(t ? ratio(t.engaged, t.sessions) : null)}</td>
                  {data.storefront ? (
                    <>
                      <td>{fmtNum(o?.orders ?? 0)}</td>
                      <td>{fmtMoney(revenue)}</td>
                      <td>{cost === null ? "—" : fmtMoney(cost)}</td>
                      <td>{cost !== null && o?.orders ? fmtMoney(cost / o.orders) : "—"}</td>
                      <td>{cost ? `${fmtDec(revenue / cost)}×` : "—"}</td>
                    </>
                  ) : (
                    <>
                      <td>{fmtNum(a?.signups ?? 0)}</td>
                      <td>{fmtNum(a?.paid ?? 0)}</td>
                      <td>{fmtMoney(revenue)}</td>
                      <td>{cost === null ? "—" : fmtMoney(cost)}</td>
                      <td>{cost !== null && a?.signups ? fmtMoney(cost / a.signups) : "—"}</td>
                      <td>{cost !== null && a?.paid ? fmtMoney(cost / a.paid) : "—"}</td>
                      <td>{cost ? `${fmtDec(revenue / cost)}×` : "—"}</td>
                    </>
                  )}
                </tr>
              );
            })}
          </DataTable>
        ) : (
          <Unavailable icon={Megaphone} title="مفيش زيارات من حملات في الفترة دي" description="ضيف utm_campaign (وutm_source وutm_medium) لروابط الإعلانات عشان تظهر هنا." className="py-12" />
        )}
      </Section>

      <CostManager costs={data.costs} canEdit={canEditCampaignCosts(viewer)} />

      <Note className="px-1">
        ربط Meta Ads API (لسحب الصرف تلقائيًا) مش متفعل — محتاج حساب إعلانات وتوكن ads_read. لحد ما يتعمل، الصرف بيتكتب يدويًا هنا، والتحليلات بتقرا UTM إعلانات Meta (fb / ig / an بيتجمعوا كـ facebook / instagram / meta_audience_network).
      </Note>
    </div>
  );
}
