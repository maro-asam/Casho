import Link from "next/link";
import { Store } from "lucide-react";
import { Unavailable } from "@/components/saas-page";
import { requireStorefrontViewer } from "@/lib/analytics/access";
import { filterParams, parseAnalyticsFilter } from "@/lib/analytics/filters";
import { ratio } from "@/lib/analytics/metrics";
import { getStoresTable, type StoreRow } from "@/lib/analytics/queries/breakdowns";
import { BarList } from "../_components/bar-list";
import { Toolbar } from "../_components/toolbar";
import { DataTable, Note, Section } from "../_components/ui";
import { fmtMoney, fmtNum, fmtPct } from "../_lib/format";

export const dynamic = "force-dynamic";

const SORTS = {
  sessions: (r: StoreRow) => r.sessions,
  visitors: (r: StoreRow) => r.visitors,
  engagement: (r: StoreRow) => ratio(r.engaged, r.sessions) ?? -1,
  orders: (r: StoreRow) => r.orders,
  conversion: (r: StoreRow) => ratio(r.orders, r.sessions) ?? -1,
  revenue: (r: StoreRow) => r.revenue,
} as const;
type SortKey = keyof typeof SORTS;

export default async function StoresAnalyticsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireStorefrontViewer(); // merchants' stores: never a media buyer
  const sp = await searchParams;
  const f = parseAnalyticsFilter({ ...sp, scope: "storefront", store: undefined });
  const rows = await getStoresTable(f);
  const sort: SortKey = typeof sp.sort === "string" && sp.sort in SORTS ? (sp.sort as SortKey) : "sessions";
  const sorted = [...rows].sort((a, b) => SORTS[sort](b) - SORTS[sort](a));
  // Conversion leaders only among stores with enough visits to mean something.
  const enough = rows.filter((r) => r.sessions >= 20);
  const bestConversion = [...enough].sort((a, b) => (ratio(b.orders, b.sessions) ?? 0) - (ratio(a.orders, a.sessions) ?? 0)).slice(0, 8);
  const head = (key: SortKey, label: string) => (
    <Link href={`/admin/analytics/stores${filterParams(f, { scope: null, sort: key === "sessions" ? null : key })}`} scroll={false} className={sort === key ? "font-semibold text-foreground" : "hover:text-foreground"}>
      {label}
      {sort === key ? " ↓" : ""}
    </Link>
  );
  const open = (r: StoreRow) => `/admin/analytics${filterParams({ ...f, storeId: r.storeId })}`;

  return (
    <div className="space-y-6">
      <Toolbar filter={f} report="stores" hideScope />

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="أكتر المتاجر زيارات" flush>
          <BarList valueLabel="زيارات" items={rows.slice(0, 8).map((r) => ({ key: r.storeId, label: r.name, value: r.sessions, extra: `${fmtNum(r.orders)} طلب`, href: open(r) }))} empty="مفيش زيارات للمتاجر في الفترة دي" />
        </Section>
        <Section title="أعلى تحويل" subtitle="بين المتاجر اللي عليها ٢٠ زيارة أو أكتر" info={<p>التحويل = طلبات مؤكدة (مش ملغية) من زيارات متتبعة ÷ زيارات المتجر.</p>} flush>
          <BarList
            valueLabel="طلبات"
            items={bestConversion.map((r) => ({ key: r.storeId, label: r.name, value: r.orders, extra: `${fmtPct(ratio(r.orders, r.sessions))} تحويل`, href: open(r) }))}
            empty="لسه مفيش متاجر عليها زيارات كفاية"
          />
        </Section>
      </div>

      <Section title="قارن المتاجر" subtitle="اضغط على متجر عشان تفتح كل التحليلات بتاعته" flush>
        {sorted.length ? (
          <DataTable minWidth={860} head={["المتجر", head("sessions", "زيارات"), head("visitors", "زوار"), "مشاهدات", head("engagement", "تفاعل"), head("orders", "طلبات"), head("conversion", "تحويل"), head("revenue", "قيمة الطلبات")]}>
            {sorted.map((r) => (
              <tr key={r.storeId} className="hover:bg-muted/40">
                <td className="max-w-64">
                  <Link href={open(r)} className="block truncate font-medium text-primary">
                    {r.name}
                  </Link>
                  <span className="block text-[12px] text-muted-foreground" dir="ltr">
                    {r.slug}
                  </span>
                </td>
                <td>{fmtNum(r.sessions)}</td>
                <td>{fmtNum(r.visitors)}</td>
                <td>{fmtNum(r.pageviews)}</td>
                <td>{fmtPct(ratio(r.engaged, r.sessions))}</td>
                <td>{fmtNum(r.orders)}</td>
                <td>{fmtPct(ratio(r.orders, r.sessions))}</td>
                <td>{fmtMoney(r.revenue)}</td>
              </tr>
            ))}
          </DataTable>
        ) : (
          <Unavailable icon={Store} title="مفيش زيارات للمتاجر في الفترة دي" className="py-12" />
        )}
      </Section>

      <Note className="px-1">
        كل متجر بياناته معزولة: زوار المتجر ليهم أرقام عشوائية خاصة بالمتجر ده بس (مش بنقدر نتابع شخص من متجر لمتجر)، وكل حدث بيتربط بالمتجر من عنوان الصفحة نفسه، مش من اللي المتصفح بيقوله. زيارات صاحب المتجر وفريقه على متجرهم مش بتتحسب.
      </Note>
    </div>
  );
}
