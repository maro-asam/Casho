import { NextResponse, type NextRequest } from "next/server";
import * as XLSX from "xlsx";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { ORDER_CHANNELS, ORDER_STATUS_META } from "@/app/(merchant)/dashboard/orders/_components/order-meta";
import { parseRange } from "@/app/(merchant)/dashboard/reports/_lib/range";
import { getReportsData } from "@/app/(merchant)/dashboard/reports/_lib/reports-data";
import { prisma } from "@/lib/prisma";

type Cell = string | number | null;

/** Pounds with two decimals, as a number Excel can sum. */
const egp = (piasters: number) => Math.round(piasters) / 100;
const pct = (value: number) => Math.round(value * 10) / 10;

function sheet(rows: Cell[][], widths: number[]) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = widths.map((wch) => ({ wch }));
  return ws;
}

function attachment(fileName: string) {
  const ascii = fileName.replace(/[^\x20-\x7E]/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const store = await prisma.store.findFirst({ where: { userId }, select: { id: true, name: true } });
    if (!store) return NextResponse.json({ error: "مفيش متجر مرتبط بحسابك" }, { status: 404 });

    const sp = request.nextUrl.searchParams;
    const range = parseRange({
      range: sp.get("range") ?? undefined,
      from: sp.get("from") ?? undefined,
      to: sp.get("to") ?? undefined,
    });
    const d = await getReportsData(store.id, range);
    const { kpis, pnl } = d;

    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      sheet(
        [
          [`تقرير ${store.name}`],
          ["الفترة", d.range.label],
          ["مقارنة بـ", d.range.previousLabel],
          [],
          ["البند", "الفترة دي", "الفترة اللي قبلها"],
          ["إجمالي المبيعات (ج.م)", egp(pnl.grossSales.current), egp(pnl.grossSales.previous)],
          ["الخصومات (ج.م)", egp(pnl.discounts.current), egp(pnl.discounts.previous)],
          ["المرتجعات (ج.م)", egp(pnl.returns.current), egp(pnl.returns.previous)],
          ["صافي المبيعات (ج.م)", egp(pnl.netSales.current), egp(pnl.netSales.previous)],
          ["تكلفة البضاعة المباعة (ج.م)", egp(pnl.cogs), null],
          ["إجمالي الربح (ج.م)", egp(pnl.grossProfit.current), egp(pnl.grossProfit.previous)],
          ["هامش الربح %", pct(pnl.margin.current), pct(pnl.margin.previous)],
          ["نسبة المبيعات اللي ليها تكلفة %", pct(pnl.costCoverage * 100), null],
          ["الشحن المحصّل (ج.م)", egp(pnl.shipping), null],
          ["اتحصّل (ج.م)", egp(pnl.collected), null],
          ["لسه متحصّلش (ج.م)", egp(pnl.outstanding), null],
          [],
          ["الطلبات (غير الملغية)", kpis.orders.current, kpis.orders.previous],
          ["متوسط قيمة الطلب (ج.م)", egp(kpis.aov.current), egp(kpis.aov.previous)],
          ["القطع المباعة", pnl.units.current, pnl.units.previous],
          ["الطلبات الملغية", pnl.canceledOrders, null],
          ["نسبة الإلغاء %", pct(kpis.cancelRate.current), pct(kpis.cancelRate.previous)],
          ["الزوار", kpis.visitors.current, kpis.visitors.previous],
          ["الزيارات", pnl.visits, null],
          ["معدل التحويل (أونلاين) %", pct(kpis.conversion.current), pct(kpis.conversion.previous)],
          ["العملاء", kpis.customers.current, kpis.customers.previous],
          ["عملاء جداد", d.customers.new, null],
          ["عملاء رجعوا", d.customers.returning, null],
          [],
          ["ملاحظات"],
          ...d.insights.map((i) => [i.text]),
        ],
        [34, 18, 18],
      ),
      "الملخص",
    );

    XLSX.utils.book_append_sheet(
      wb,
      sheet(
        [
          ["الفترة", "صافي المبيعات (ج.م)", "الطلبات", "الربح (ج.م)", "الزوار"],
          ...d.series.map((p) => [p.label, egp(p.netSales), p.orders, egp(p.profit), p.visitors]),
        ],
        [16, 18, 10, 14, 10],
      ),
      range.granularity === "month" ? "شهري" : range.granularity === "hour" ? "بالساعة" : "يومي",
    );

    XLSX.utils.book_append_sheet(
      wb,
      sheet(
        [
          ["المنتج", "التصنيف", "القطع", "صافي المبيعات (ج.م)", "النسبة %", "الربح (ج.م)", "الهامش %", "المخزون الحالي"],
          ...d.products.map((p) => [
            p.name,
            p.category,
            p.units,
            egp(p.netSales),
            pct(p.share * 100),
            p.profit === null ? "بدون تكلفة" : egp(p.profit),
            p.margin === null ? null : pct(p.margin),
            p.stock,
          ]),
        ],
        [36, 18, 8, 18, 10, 14, 10, 12],
      ),
      "المنتجات",
    );

    XLSX.utils.book_append_sheet(
      wb,
      sheet(
        [
          ["التصنيف", "القطع", "صافي المبيعات (ج.م)", "النسبة %", "الربح (ج.م)"],
          ...d.categories.map((c) => [c.name, c.units, egp(c.netSales), pct(c.share * 100), c.profit === null ? "بدون تكلفة" : egp(c.profit)]),
        ],
        [24, 8, 18, 10, 14],
      ),
      "التصنيفات",
    );

    XLSX.utils.book_append_sheet(
      wb,
      sheet(
        [
          ["القناة", "الطلبات", "المبيعات (ج.م)", "متوسط الطلب (ج.م)", "النسبة %"],
          ...d.channels.map((c) => [ORDER_CHANNELS[c.source].label, c.orders, egp(c.netSales), egp(c.aov), pct(c.share * 100)]),
          [],
          ["طريقة الدفع", "العمليات", "المبلغ (ج.م)", "النسبة %"],
          ...d.payments.map((p) => [p.label, p.count, egp(p.amount), pct(p.share * 100)]),
          [],
          ["الحالة", "الطلبات", "القيمة (ج.م)"],
          ...d.statuses.map((s) => [ORDER_STATUS_META[s.status].label, s.count, egp(s.value)]),
        ],
        [22, 10, 16, 16, 10],
      ),
      "القنوات والدفع",
    );

    XLSX.utils.book_append_sheet(
      wb,
      sheet(
        [
          ["العميل", "الموبايل", "الطلبات", "إجمالي الصرف (ج.م)", "جديد؟"],
          ...d.topCustomers.map((c) => [c.name, c.phone, c.orders, egp(c.spend), c.isNew ? "جديد" : "راجع"]),
        ],
        [24, 16, 10, 18, 8],
      ),
      "أكتر العملاء",
    );

    XLSX.utils.book_append_sheet(
      wb,
      sheet(
        [
          ["قيمة المخزون بالتكلفة (ج.م)", egp(d.inventory.valueCost)],
          ["قيمة المخزون بسعر البيع (ج.م)", egp(d.inventory.valueRetail)],
          ["قطع في المخزون", d.inventory.units],
          ["منتجات نفدت", d.inventory.outOfStock],
          ["منتجات قربت تخلص", d.inventory.lowStock],
          ["قيمة البضاعة الراكدة (ج.م)", egp(d.inventory.deadStockValue)],
          [],
          ["هيخلص قريب", "المخزون", "بيع يومي", "هيخلص خلال (يوم)"],
          ...d.runningOut.map((r) => [r.name, r.stock, Math.round(r.dailyRate * 10) / 10, r.daysLeft === null ? null : Math.floor(r.daysLeft)]),
          [],
          ["بضاعة راكدة (٩٠ يوم)", "المخزون", "القيمة بالتكلفة (ج.م)", "القيمة بسعر البيع (ج.م)"],
          ...d.deadStock.map((r) => [r.name, r.stock, r.valueCost === null ? null : egp(r.valueCost), egp(r.valueRetail)]),
        ],
        [34, 14, 20, 20],
      ),
      "المخزون",
    );

    if (d.pos) {
      XLSX.utils.book_append_sheet(
        wb,
        sheet(
          [
            ["الكاشير", "الفواتير", "المبيعات (ج.م)", "متوسط الفاتورة (ج.م)", "الخصومات (ج.م)"],
            ...d.pos.cashiers.map((c) => [c.name, c.orders, egp(c.netSales), egp(c.aov), egp(c.discounts)]),
            [],
            ["الورديات", d.pos.shifts.count],
            ["فرق الكاش (ج.م)", egp(d.pos.shifts.netDifference)],
            ["عجز (ج.م)", egp(Math.abs(d.pos.shifts.shortage))],
            ["زيادة (ج.م)", egp(d.pos.shifts.overage)],
            ["المرتجعات", d.pos.returns.count],
            ["قيمة المرتجعات (ج.م)", egp(d.pos.returns.amount)],
          ],
          [24, 10, 16, 18, 16],
        ),
        "الكاشير",
      );
    }

    if (d.coupons.length) {
      XLSX.utils.book_append_sheet(
        wb,
        sheet(
          [
            ["الكوبون", "الاستخدام", "عملاء", "المبيعات (ج.م)", "الخصم (ج.م)"],
            ...d.coupons.map((c) => [c.code, c.uses, c.customers, egp(c.sales), egp(c.discount)]),
          ],
          [18, 10, 8, 16, 14],
        ),
        "الكوبونات",
      );
    }

    wb.Workbook = { Views: [{ RTL: true }] };
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx", compression: true }) as Buffer;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": attachment(`report-${store.name}-${range.fromKey}_${range.toKey}.xlsx`),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Export report error:", error);
    return NextResponse.json({ error: "حصلت مشكلة وإحنا بنجهّز التقرير، جرّب تاني." }, { status: 500 });
  }
}
