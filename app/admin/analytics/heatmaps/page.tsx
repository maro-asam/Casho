import Link from "next/link";
import { Flame } from "lucide-react";
import { Unavailable } from "@/components/saas-page";
import type { DeviceBucket } from "@/lib/analytics/constants";
import { filterParams, parseAnalyticsFilter } from "@/lib/analytics/filters";
import { ratio } from "@/lib/analytics/metrics";
import { getStoreOptions } from "@/lib/analytics/queries/breakdowns";
import { getHeatmap, getHeatmapPages } from "@/lib/analytics/queries/heatmaps";
import { getAnalyticsSettings } from "@/lib/analytics/settings";
import { cn } from "@/lib/utils";
import { Toolbar } from "../_components/toolbar";
import { DataTable, Note, Section } from "../_components/ui";
import { fmtNum, fmtPct, pathLabel } from "../_lib/format";
import { HeatmapViewer } from "./heatmap-viewer";

export const dynamic = "force-dynamic";

const BUCKETS: DeviceBucket[] = ["desktop", "tablet", "mobile"];

export default async function HeatmapsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const f = parseAnalyticsFilter(sp);
  const bucket: DeviceBucket = BUCKETS.includes(sp.bucket as DeviceBucket) ? (sp.bucket as DeviceBucket) : "desktop";
  const [pages, settings, stores] = await Promise.all([getHeatmapPages(f), getAnalyticsSettings(), getStoreOptions()]);
  const requested = typeof sp.path === "string" && sp.path.startsWith("/") ? sp.path : null;
  const path = requested ?? pages.find((p) => p.clicks > 0)?.path ?? pages[0]?.path ?? null;

  // Same-origin URL of the live page (the viewer draws inside it).
  let frameSrc: string | null = null;
  let frameNote: string | undefined;
  if (path) {
    if (/:(id|token)\b/.test(path) || path === "/(excluded)") {
      frameNote = "الصفحة دي مسارها فيه أرقام تعريف اتشالت للخصوصية، فمش هنقدر نفتحها — النقرات والعناصر متاحة في الجداول.";
    } else if (f.scope === "all") {
      frameNote = "اختار نطاق واحد من الفلتر (موقع كاشو، لوحة التاجر، أو متجر) عشان نعرض صفحته.";
    } else if (f.scope === "storefront" && !f.storeId) {
      frameNote = "اختار متجر من الفلتر — كل متجر شكله مختلف، فالـ heatmap لازم يبقى لمتجر واحد.";
    } else if (f.scope === "storefront") {
      const store = stores.find((s) => s.id === f.storeId);
      frameSrc = store ? `/store/${encodeURIComponent(store.slug)}${path === "/" ? "" : path}` : null;
      if (!store) frameNote = "المتجر ده مش موجود.";
    } else if (f.scope === "app") {
      if (settings.heatmapPrivatePages) frameSrc = path;
      else frameNote = "صفحات لوحة التاجر خاصة، والـ heatmaps بتاعتها مقفولة من الإعدادات.";
    } else {
      frameSrc = `/_site${path === "/" ? "" : path}`;
    }
  }
  const data = path ? await getHeatmap(f, path, bucket) : null;
  const heatmapsOff = !settings.heatmapsEnabled;

  return (
    <div className="space-y-6">
      <Toolbar filter={f} report="heatmap" hideDevice />

      {heatmapsOff && (
        <p className="apple-card px-5 py-3 text-[14px] text-muted-foreground">
          جمع أماكن النقرات واقف من الإعدادات — البيانات اللي هنا من قبل ما يتقفل.
        </p>
      )}

      {data && path ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] text-muted-foreground">الصفحة:</span>
            <span className="text-[17px] font-semibold" dir="auto">
              {pathLabel(path)}
            </span>
          </div>
          <HeatmapViewer key={`${path}|${f.storeId ?? f.scope}`} data={data} frameSrc={frameSrc} frameNote={frameNote} />
        </>
      ) : (
        <section className="apple-card">
          <Unavailable icon={Flame} title="لسه مفيش نقرات متسجلة" description="أول ما الزوار يتصفحوا الصفحات هتلاقي هنا خريطة لكل صفحة: فين بيضغطوا، لحد فين بينزلوا، وأنهي عناصر محدش بيلمسها." />
        </section>
      )}

      <Section title="قارن الصفحات" subtitle="اختار صفحة عشان تفتح الخريطة بتاعتها" flush>
        {pages.length ? (
          <DataTable minWidth={720} head={["الصفحة", "مشاهدات", "نقرات", "نقرات/مشاهدة", "ميتة", "غضب", "متوسط السكرول"]}>
            {pages.slice(0, 60).map((p) => (
              <tr key={p.path} className={cn("hover:bg-muted/40", p.path === path && "bg-muted/50")}>
                <td className="max-w-80">
                  <Link
                    href={`/admin/analytics/heatmaps${filterParams(f, { path: p.path, bucket: bucket === "desktop" ? null : bucket })}`}
                    scroll={false}
                    aria-current={p.path === path ? "true" : undefined}
                    className="block truncate font-medium text-primary"
                    dir="auto"
                  >
                    {pathLabel(p.path)}
                  </Link>
                </td>
                <td>{fmtNum(p.views)}</td>
                <td>{fmtNum(p.clicks)}</td>
                <td>{(ratio(p.clicks, p.views) ?? 0).toLocaleString("ar-EG", { maximumFractionDigits: 1 })}</td>
                <td>{fmtPct(ratio(p.deadClicks, p.clicks))}</td>
                <td>{fmtNum(p.rageClicks)}</td>
                <td>{fmtPct(p.avgScroll / 100)}</td>
              </tr>
            ))}
          </DataTable>
        ) : (
          <p className="px-5 pb-6 text-[14px] text-muted-foreground">مفيش صفحات عليها زيارات في الفترة دي.</p>
        )}
      </Section>

      <Note className="px-1">
        بنسجل مكان النقرة (العنصر + مكانها جواه + مكانها في الصفحة) وعمق السكرول بس — مفيش تسجيل شاشة ولا كتابة ولا قيم حقول. الكمبيوتر = عرض ١٠٢٤px وأكتر، التابلت ٧٦٨–١٠٢٣، الموبايل أقل من ٧٦٨، وكل جهاز بيتعرض لوحده عشان الـ layout بيختلف.
        {settings.heatmapSampleRate < 100 && ` بنجمع النقرات من ${fmtNum(settings.heatmapSampleRate)}٪ من الزيارات بس (من الإعدادات).`}
      </Note>
    </div>
  );
}
