/**
 * Analytics Center exports: CSV (UTF-8 with BOM, opens in Excel with Arabic
 * intact) or Excel (xlsx, already used by the merchant reports). Admin only;
 * every export is written to the security log. Exports contain aggregates —
 * never individual visitors (the event export has no visitor or session ids).
 */
import { NextResponse, type NextRequest } from "next/server";
import { unstable_rethrow } from "next/navigation";
import * as XLSX from "xlsx";

import { auditAnalytics, requireAnalyticsViewer } from "@/lib/analytics/access";
import { CHANNEL_LABELS, type Channel } from "@/lib/analytics/channel";
import { isStorefrontView, parseAnalyticsFilter, type AnalyticsFilter } from "@/lib/analytics/filters";
import { BUILT_IN_FUNNELS, readSteps, type FunnelDefinition } from "@/lib/analytics/funnels";
import { deriveRates, pctChange, ratio } from "@/lib/analytics/metrics";
import { getEvents, getJourneys, getPerformance } from "@/lib/analytics/queries/activity";
import { getAcquisition, getStoresTable, getVisitorBreakdowns, type AttributedRow, type AttributionModel, type Dimension, type OrderRow, type TouchDimension } from "@/lib/analytics/queries/breakdowns";
import { getCampaigns } from "@/lib/analytics/queries/campaigns";
import { getFunnelReport } from "@/lib/analytics/queries/funnels";
import { getHeatmapPages } from "@/lib/analytics/queries/heatmaps";
import { getOverview } from "@/lib/analytics/queries/overview";
import { getPagesTable } from "@/lib/analytics/queries/pages";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Cell = string | number | null;
type Sheet = { name: string; rows: Cell[][] };

const egp = (piasters: number) => Math.round(piasters) / 100;
const pct = (r: number | null) => (r === null ? null : Math.round(r * 1000) / 10);
const sec = (ms: number | null) => (ms === null ? null : Math.round(ms / 1000));
const channel = (c: string | null) => (c ? (CHANNEL_LABELS[c as Channel] ?? c) : "");

/** Casho conversions (signups/paid) and storefront ones (orders) as one shape. */
type ConvCounts = { orders: number; signups: number; paid: number; revenue: number };
const convCounts = (c: AttributedRow | OrderRow): ConvCounts =>
  "orders" in c ? { orders: c.orders, signups: 0, paid: 0, revenue: c.revenue } : { orders: 0, signups: c.signups, paid: c.paid, revenue: c.revenue };

function header(f: AnalyticsFilter, title: string): Cell[][] {
  return [[title], ["الفترة", `${f.fromKey} → ${f.toKey}`], ["مقارنة بـ", f.prevFromKey ? `${f.prevFromKey} → ${f.prevToKey}` : "—"], ["النطاق", f.storeId ? `متجر ${f.storeId}` : f.scope], ["الجهاز", f.device], []];
}

async function buildReport(report: string, f: AnalyticsFilter): Promise<{ title: string; sheets: Sheet[] }> {
  const [kind, a, b] = report.split(":");
  switch (kind) {
    case "overview": {
      const d = await getOverview(f);
      const c = d.current.totals;
      const p = d.previous?.totals ?? null;
      const rc = deriveRates(c);
      const rp = p ? deriveRates(p) : null;
      const cb = d.current.business;
      const pb = d.previous?.business ?? null;
      const line = (label: string, cur: number | null, prev: number | null): Cell[] => [label, cur, prev, pct(pctChange(cur, prev))];
      const rows: Cell[][] = [
        ...header(f, "نظرة عامة"),
        ["المؤشر", "الفترة دي", "فترة المقارنة", "التغير ٪"],
        line("إجمالي الزوار (زائر/يوم)", c.visitorDays, p?.visitorDays ?? null),
        line("زوار فريدين", c.visitors, p?.visitors ?? null),
        line("زيارات", c.sessions, p?.sessions ?? null),
        line("زوار جداد", c.newVisitors, p?.newVisitors ?? null),
        line("زوار راجعين", rc.returningVisitors, rp?.returningVisitors ?? null),
        line("مشاهدات الصفحات", c.pageviews, p?.pageviews ?? null),
        line("صفحات لكل زيارة", rc.pagesPerSession, rp?.pagesPerSession ?? null),
        line("متوسط مدة الزيارة (ث)", sec(rc.avgSessionMs), sec(rp?.avgSessionMs ?? null)),
        line("متوسط وقت التفاعل (ث)", sec(rc.avgEngagementMs), sec(rp?.avgEngagementMs ?? null)),
        line("نسبة التفاعل ٪", pct(rc.engagementRate), pct(rp?.engagementRate ?? null)),
        line("معدل الارتداد ٪", pct(rc.bounceRate), pct(rp?.bounceRate ?? null)),
        line("نسبة التحويل ٪", pct(rc.conversionRate), pct(rp?.conversionRate ?? null)),
        ...(isStorefrontView(f)
          ? [
              line("طلبات متتبعة", cb.orders, pb?.orders ?? null),
              line("قيمة الطلبات المتتبعة (ج.م)", egp(cb.orderRevenue), pb ? egp(pb.orderRevenue) : null),
              line("كل الطلبات الأونلاين", cb.allOrders, pb?.allOrders ?? null),
            ]
          : [
              line("حسابات جديدة", cb.signups, pb?.signups ?? null),
              line("تسجيلات مكتملة", cb.verifiedSignups, pb?.verifiedSignups ?? null),
              line("تجارب مجانية", cb.trials, pb?.trials ?? null),
              line("اشتراكات مدفوعة (متاجر)", cb.paidStores, pb?.paidStores ?? null),
              line("إيراد الاشتراكات (ج.م)", egp(cb.revenue), pb ? egp(pb.revenue) : null),
              line("إيراد من زيارات متتبعة (ج.م)", egp(cb.attributedRevenue), pb ? egp(pb.attributedRevenue) : null),
            ]),
        line("زوار بقوا عملاء ٪", pct(ratio(cb.customers, c.visitors)), pb && p ? pct(ratio(pb.customers, p.visitors)) : null),
      ];
      const series: Cell[][] = [
        ["الفترة", "زيارات", "زوار", "مشاهدات", "زيارات متفاعلة", "تحويلات", "حسابات", "اشتراكات مدفوعة", "الإيراد (ج.م)", "طلبات", "قيمة الطلبات (ج.م)"],
        ...d.buckets.map((bk, i) => [
          bk.key,
          d.series.sessions[i],
          d.series.visitors[i],
          d.series.pageviews[i],
          d.series.engagedSessions[i],
          d.series.convertedSessions[i],
          d.series.signups[i],
          d.series.paidStores[i],
          egp(d.series.revenue[i]),
          d.series.orders[i],
          egp(d.series.orderRevenue[i]),
        ]),
      ];
      return { title: "overview", sheets: [{ name: "المؤشرات", rows }, { name: "يوم بيوم", rows: series }] };
    }
    case "visitors": {
      const v = await getVisitorBreakdowns(f);
      const sheets = Object.entries(v).map(([dim, rows]) => ({
        name: dim,
        rows: [["القيمة", "زيارات", "زوار", "متفاعلة", "تحويلات"], ...rows.map((r) => [r.sub ? `${r.key} (${r.sub})` : r.key, r.sessions, r.visitors, r.engaged, r.converted])],
      }));
      return { title: "visitors", sheets };
    }
    case "acquisition": {
      const dim = (a || "channel") as Dimension & TouchDimension;
      const model: AttributionModel = b === "last" ? "last" : "first";
      const { traffic, conversions } = await getAcquisition(f, dim, model);
      const conv = new Map(conversions.map((c) => [c.key ?? "", convCounts(c)]));
      const rows: Cell[][] = [
        ...header(f, `مصادر الزيارات — ${dim}${isStorefrontView(f) ? "" : ` (نسب: ${model === "first" ? "أول زيارة" : "آخر زيارة"})`}`),
        isStorefrontView(f)
          ? [dim, "زيارات", "زوار", "تفاعل ٪", "تحويل ٪", "طلبات", "قيمة الطلبات (ج.م)"]
          : [dim, "زيارات", "زوار", "تفاعل ٪", "تحويل ٪", "تسجيلات", "دفعوا", "الإيراد (ج.م)"],
        ...traffic.map((t) => {
          const c = conv.get(t.key ?? "");
          const key = dim === "channel" ? channel(t.key) : (t.key ?? "");
          return isStorefrontView(f)
            ? [key, t.sessions, t.visitors, pct(ratio(t.engaged, t.sessions)), pct(ratio(t.converted, t.sessions)), c?.orders ?? 0, egp(c?.revenue ?? 0)]
            : [key, t.sessions, t.visitors, pct(ratio(t.engaged, t.sessions)), pct(ratio(t.converted, t.sessions)), c?.signups ?? 0, c?.paid ?? 0, egp(c?.revenue ?? 0)];
        }),
      ];
      return { title: `acquisition-${dim}`, sheets: [{ name: "المصادر", rows }] };
    }
    case "pages": {
      const pages = await getPagesTable(f);
      const rows: Cell[][] = [
        ...header(f, "أداء الصفحات"),
        ["الصفحة", "مشاهدات", "زوار", "دخول", "خروج", "وقت التفاعل (ث)", "السكرول ٪", "ارتداد ٪", "نسبة الخروج ٪", "تحويل ٪", "ضغطات CTA"],
        ...pages.map((r) => [
          r.path,
          r.views,
          r.visitors,
          r.entrances,
          r.exits,
          sec(r.avgEngagedMs),
          Math.round(r.avgScroll),
          pct(ratio(r.bounces, r.entrances)),
          pct(ratio(r.exits, r.views)),
          pct(ratio(r.convertedSessions, r.sessions)),
          r.ctaClicks,
        ]),
      ];
      return { title: "pages", sheets: [{ name: "الصفحات", rows }] };
    }
    case "heatmap": {
      const pages = await getHeatmapPages(f);
      const rows: Cell[][] = [
        ...header(f, "النقرات حسب الصفحة"),
        ["الصفحة", "مشاهدات", "نقرات", "نقرات/مشاهدة", "ميتة", "غضب", "متوسط السكرول ٪"],
        ...pages.map((p) => [p.path, p.views, p.clicks, ratio(p.clicks, p.views), p.deadClicks, p.rageClicks, Math.round(p.avgScroll)]),
      ];
      return { title: "heatmap-pages", sheets: [{ name: "الصفحات", rows }] };
    }
    case "funnel": {
      let def: FunnelDefinition | undefined = BUILT_IN_FUNNELS.find((d) => d.id === a);
      if (!def && a) {
        const row = await prisma.analyticsFunnel.findUnique({ where: { id: a } });
        if (row) def = { id: row.id, name: row.name, description: row.description, scope: row.scope, steps: readSteps(row.steps), windowDays: row.windowDays, builtIn: false };
      }
      def ??= BUILT_IN_FUNNELS[0];
      const r = await getFunnelReport(def, f);
      const rows: Cell[][] = [
        ...header(f, `Funnel — ${def.name}`),
        ["الخطوة", "وصلوا", "من البداية ٪", "من اللي قبلها ٪", "خرجوا", "متوسط الوقت من اللي قبلها (د)"],
        ...def.steps.map((s, i) => [
          s.label,
          r.steps[i].entered,
          pct(r.steps[i].fromStart),
          pct(r.steps[i].fromPrevious),
          r.steps[i].dropped,
          r.steps[i].medianMsFromPrevious === null ? null : Math.round(r.steps[i].medianMsFromPrevious! / 60_000),
        ]),
      ];
      return { title: `funnel-${def.id}`, sheets: [{ name: "Funnel", rows }] };
    }
    case "journeys": {
      const j = await getJourneys(f);
      const rows: Cell[][] = [...header(f, "أشهر المسارات"), ["زيارات", "المسار"], ...j.paths.map((p) => [p.sessions, p.steps.join(" ← ")])];
      return { title: "journeys", sheets: [{ name: "المسارات", rows }] };
    }
    case "campaigns": {
      const model: AttributionModel = a === "last" ? "last" : "first";
      const d = await getCampaigns(f, model);
      const conv = new Map(d.conversions.map((c) => [c.key ?? "", convCounts(c)]));
      const rows: Cell[][] = [
        ...header(f, "الحملات"),
        ["الحملة", "زيارات", "زوار", d.storefront ? "طلبات" : "تسجيلات", d.storefront ? "—" : "دفعوا", "الإيراد (ج.م)", "التكلفة (ج.م)", "ROAS"],
        ...d.traffic
          .filter((t) => t.key)
          .map((t) => {
            const c = conv.get(t.key!);
            const cost = d.costByCampaign[t.key!.toLowerCase()] ?? null;
            const revenue = c?.revenue ?? 0;
            return [t.key, t.sessions, t.visitors, d.storefront ? (c?.orders ?? 0) : (c?.signups ?? 0), d.storefront ? null : (c?.paid ?? 0), egp(revenue), cost === null ? null : egp(cost), cost ? Math.round((revenue / cost) * 100) / 100 : null];
          }),
      ];
      return { title: "campaigns", sheets: [{ name: "الحملات", rows }] };
    }
    case "performance": {
      const d = await getPerformance(f);
      return {
        title: "performance",
        sheets: [
          { name: "Web Vitals", rows: [["المؤشر", "p75", "قياسات", "كويس", "محتاج تحسين", "ضعيف"], ...d.vitals.map((v) => [v.metric, Math.round(v.p75 * 1000) / 1000, v.n, v.good, v.ni, v.poor])] },
          { name: "الصفحات", rows: [["الصفحة", "LCP", "INP", "CLS", "TTFB", "قياسات"], ...d.byPage.map((p) => [p.path, p.lcp, p.inp, p.cls, p.ttfb, p.n])] },
          { name: "الأخطاء", rows: [["النوع", "الرسالة", "المصدر", "مرات", "زيارات", "آخر مرة"], ...d.errors.map((e) => [e.kind, e.message, e.source, e.n, e.sessions, e.lastSeen])] },
          { name: "طلبات فشلت", rows: [["العنوان", "الحالة", "مرات", "زيارات", "آخر مرة"], ...d.failed.map((e) => [e.url, e.status, e.n, e.sessions, e.lastSeen])] },
        ],
      };
    }
    case "events": {
      const pages = await Promise.all([1, 2, 3, 4, 5].map((page) => getEvents(f, { name: a || null, q: null, page })));
      const rows: Cell[][] = [
        ...header(f, `الأحداث${a ? ` — ${a}` : ""} (آخر ٢٥٠)`),
        ["الوقت", "الحدث", "الصفحة", "الجهاز", "النطاق", "القيمة", "الخصائص"],
        ...pages.flatMap((p) => p.rows).map((r) => [r.ts, r.name, r.path, r.device, r.scope, r.value, r.props ? JSON.stringify(r.props) : null]),
      ];
      return { title: "events", sheets: [{ name: "الأحداث", rows }] };
    }
    case "stores": {
      const rows = await getStoresTable({ ...f, scope: "storefront", storeId: null });
      return {
        title: "stores",
        sheets: [
          {
            name: "المتاجر",
            rows: [
              ...header(f, "مقارنة المتاجر"),
              ["المتجر", "الرابط", "زيارات", "زوار", "مشاهدات", "تفاعل ٪", "طلبات", "تحويل ٪", "قيمة الطلبات (ج.م)"],
              ...rows.map((r) => [r.name, r.slug, r.sessions, r.visitors, r.pageviews, pct(ratio(r.engaged, r.sessions)), r.orders, pct(ratio(r.orders, r.sessions)), egp(r.revenue)]),
            ],
          },
        ],
      };
    }
    default:
      throw new Error("unknown report");
  }
}

function csvCell(v: Cell) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  // Formula-injection guard for spreadsheet apps.
  const safe = /^[=+\-@]/.test(s) && Number.isNaN(Number(s)) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

function attachment(fileName: string) {
  const ascii = fileName.replace(/[^\x20-\x7E]/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

export async function GET(req: NextRequest) {
  let viewer;
  try {
    viewer = await requireAnalyticsViewer();
  } catch (error) {
    unstable_rethrow(error);
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const sp = Object.fromEntries(req.nextUrl.searchParams);
  const f = parseAnalyticsFilter(sp);
  const report = (sp.report || "overview").slice(0, 80);
  const format = sp.format === "xlsx" ? "xlsx" : "csv";

  try {
    const { title, sheets } = await buildReport(report, f);
    await auditAnalytics(viewer, "ANALYTICS_EXPORTED", { report, format, from: f.fromKey, to: f.toKey, scope: f.storeId ? `store:${f.storeId}` : f.scope });
    const base = `casho-analytics-${title}-${f.fromKey}_${f.toKey}`;

    if (format === "xlsx") {
      const wb = XLSX.utils.book_new();
      for (const sheet of sheets) {
        const ws = XLSX.utils.aoa_to_sheet(sheet.rows);
        ws["!cols"] = (sheet.rows[0] ?? []).map((_, i) => ({ wch: i === 0 ? 36 : 16 }));
        XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31).replace(/[\\/?*[\]:]/g, "-"));
      }
      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
      return new NextResponse(new Uint8Array(buf), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": attachment(`${base}.xlsx`),
          "Cache-Control": "no-store",
        },
      });
    }

    const csv = sheets
      .map((sheet) => [sheets.length > 1 ? csvCell(sheet.name) : null, ...sheet.rows.map((row) => row.map(csvCell).join(","))].filter((l) => l !== null).join("\r\n"))
      .join("\r\n\r\n");
    return new NextResponse(`﻿${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": attachment(`${base}.csv`),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[analytics] export", error);
    return NextResponse.json({ error: "export failed" }, { status: 400 });
  }
}
