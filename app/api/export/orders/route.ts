import { NextResponse, type NextRequest } from "next/server";
import * as XLSX from "xlsx";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { buildOrderWhere, parseOrderFilters } from "@/app/(merchant)/dashboard/orders/_components/order-filters";
import {
  ORDER_CHANNELS,
  ORDER_STATUS_META,
  paymentMethodLabel,
} from "@/app/(merchant)/dashboard/orders/_components/order-meta";
import { FEATURE_KEYS, hasFeature } from "@/lib/entitlements";
import { prisma } from "@/lib/prisma";

const cairoDate = new Intl.DateTimeFormat("ar-EG", {
  timeZone: "Africa/Cairo",
  dateStyle: "medium",
  timeStyle: "short",
});

const COLUMNS: { header: string; width: number }[] = [
  { header: "م", width: 6 },
  { header: "رقم الطلب", width: 12 },
  { header: "التاريخ", width: 22 },
  { header: "اسم العميل", width: 24 },
  { header: "رقم الموبايل", width: 16 },
  { header: "العنوان", width: 40 },
  { header: "القناة", width: 12 },
  { header: "الحالة", width: 14 },
  { header: "طريقة الدفع", width: 20 },
  { header: "عدد القطع", width: 10 },
  { header: "المنتجات", width: 50 },
  { header: "الإجمالي الفرعي (ج.م)", width: 18 },
  { header: "الشحن (ج.م)", width: 12 },
  { header: "الخصم (ج.م)", width: 12 },
  { header: "الإجمالي (ج.م)", width: 14 },
  { header: "ملاحظات", width: 30 },
  { header: "المعرّف الكامل", width: 38 },
];

function escapeCsvValue(value: string | number | null | undefined) {
  const stringValue = String(value ?? "");
  return /[",\n\r]/.test(stringValue) ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
}

/** RFC 5987 so Arabic store names survive in the downloaded file name. */
function attachment(fileName: string) {
  const ascii = fileName.replace(/[^\x20-\x7E]/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const format = request.nextUrl.searchParams.get("format") === "xlsx" ? "xlsx" : "csv";

    const store = await prisma.store.findFirst({
      where: { userId },
      select: { id: true, name: true },
    });

    if (!store) {
      return NextResponse.json({ error: "مفيش متجر مرتبط بحسابك" }, { status: 404 });
    }

    if (!(await hasFeature(store.id, FEATURE_KEYS.ORDER_EXPORT))) {
      return NextResponse.json(
        {
          code: "FEATURE_NOT_AVAILABLE",
          feature: FEATURE_KEYS.ORDER_EXPORT,
          error: "تصدير الطلبات مش متاح في باقتك الحالية.",
        },
        { status: 403 },
      );
    }

    // Same filters as the orders page, so "export" means "what I'm looking at".
    const filters = parseOrderFilters(request.nextUrl.searchParams);

    const orders = await prisma.order.findMany({
      where: buildOrderWhere(store.id, filters),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        fullName: true,
        phone: true,
        address: true,
        source: true,
        status: true,
        paymentMethod: true,
        subtotal: true,
        shipping: true,
        discount: true,
        total: true,
        notes: true,
        items: { select: { quantity: true, product: { select: { name: true } } } },
      },
    });

    const rows = orders.map((order, index) => [
      index + 1,
      `#${order.id.slice(0, 8)}`,
      cairoDate.format(order.createdAt),
      order.fullName,
      order.phone,
      order.address,
      ORDER_CHANNELS[order.source].label,
      ORDER_STATUS_META[order.status].label,
      paymentMethodLabel(order.paymentMethod),
      order.items.reduce((sum, item) => sum + item.quantity, 0),
      order.items.map((item) => `${item.product.name} × ${item.quantity}`).join(" | ") || "—",
      order.subtotal / 100,
      order.shipping / 100,
      order.discount / 100,
      order.total / 100,
      order.notes ?? "",
      order.id,
    ]);

    const headers = COLUMNS.map((c) => c.header);
    const baseName = `orders-${store.name}-${new Date().toISOString().slice(0, 10)}`;

    if (format === "xlsx") {
      const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      sheet["!cols"] = COLUMNS.map((c) => ({ wch: c.width }));
      sheet["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length, c: headers.length - 1 } }) };

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, "الطلبات");
      // Open right-to-left in Excel.
      workbook.Workbook = { Views: [{ RTL: true }] };

      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx", compression: true }) as Buffer;

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": attachment(`${baseName}.xlsx`),
          "Cache-Control": "no-store",
        },
      });
    }

    const csvContent = [headers, ...rows].map((row) => row.map(escapeCsvValue).join(",")).join("\n");

    // BOM so Excel opens the Arabic text as UTF-8.
    return new NextResponse("﻿" + csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": attachment(`${baseName}.csv`),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Export orders error:", error);
    return NextResponse.json({ error: "حصلت مشكلة وإحنا بنجهّز الملف، جرّب تاني." }, { status: 500 });
  }
}
