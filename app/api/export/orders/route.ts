import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { OrderStatus } from "@prisma/client";

function getStatusLabel(status: OrderStatus) {
  switch (status) {
    case "PENDING":
      return "معلق";
    case "PAID":
      return "مدفوع";
    case "SHIPPED":
      return "تم الشحن";
    case "DELIVERED":
      return "وصل";
    case "CANCELED":
      return "ملغي";
    default:
      return status;
  }
}

function getPaymentMethodLabel(method: string) {
  switch (method) {
    case "cash_on_delivery":
      return "الدفع عند الاستلام";
    case "instapay":
      return "إنستاباي";
    case "vodafone_cash":
      return "فودافون كاش";
    case "bank_transfer":
      return "تحويل بنكي";
    default:
      return method;
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function escapeCsvValue(value: string | number | null | undefined) {
  const stringValue = String(value ?? "");

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

export async function GET() {
  try {
    const userId = await requireUserId();

    const store = await prisma.store.findFirst({
      where: { userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!store) {
      return NextResponse.json(
        { error: "لم يتم العثور على متجر لهذا المستخدم" },
        { status: 404 },
      );
    }

    const orders = await prisma.order.findMany({
      where: {
        storeId: store.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const headers = [
      "م",
      "رقم الطلب",
      "رقم مختصر",
      "اسم العميل",
      "رقم الهاتف",
      "العنوان",
      "طريقة الدفع",
      "الحالة",
      "عدد المنتجات",
      "المنتجات",
      "الإجمالي بالجنيه",
      "تاريخ الطلب",
    ];

    const rows = orders.map((order, index) => [
      index + 1,
      order.id,
      `#${order.id.slice(0, 8)}`,
      order.fullName,
      order.phone,
      order.address,
      getPaymentMethodLabel(order.paymentMethod),
      getStatusLabel(order.status),
      order.items.reduce((sum, item) => sum + item.quantity, 0),
      order.items.length
        ? order.items
            .map((item) => `${item.product.name} × ${item.quantity}`)
            .join(" | ")
        : "لا توجد منتجات",
      order.total / 100,
      formatDate(order.createdAt),
    ]);

    const csvContent = [
      headers.map(escapeCsvValue).join(","),
      ...rows.map((row) => row.map(escapeCsvValue).join(",")),
    ].join("\n");

    const bom = "\uFEFF";
    const fileName = `orders-${store.name}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    return new NextResponse(bom + csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Export orders CSV error:", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء تصدير الطلبات" },
      { status: 500 },
    );
  }
}