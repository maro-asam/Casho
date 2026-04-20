import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { BalanceTransactionType } from "@prisma/client";
import { requireUserId } from "@/actions/auth/require-user-id.actions";

function getTransactionLabel(type: BalanceTransactionType) {
  switch (type) {
    case BalanceTransactionType.TOPUP:
      return "شحن رصيد";
    case BalanceTransactionType.SUBSCRIPTION_CHARGE:
      return "خصم اشتراك";
    case BalanceTransactionType.BONUS:
      return "رصيد إضافي";
    case BalanceTransactionType.MANUAL_ADJUSTMENT:
      return "تعديل يدوي";
    case BalanceTransactionType.REFUND:
      return "استرجاع رصيد";
    default:
      return type;
  }
}

function formatDate(date: Date | null) {
  if (!date) return "";

  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function escapeCsv(value: string | number | null | undefined) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: {
      id: true,
      name: true,
    },
  });

  if (!store) {
    return new Response("Store not found", { status: 404 });
  }

  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type")?.trim() || "";
  const q = searchParams.get("q")?.trim() || "";
  const from = searchParams.get("from")?.trim() || "";
  const to = searchParams.get("to")?.trim() || "";

  const validTypes = Object.values(BalanceTransactionType);
  const typeFilter = validTypes.includes(type as BalanceTransactionType)
    ? (type as BalanceTransactionType)
    : undefined;

  const createdAtFilter: { gte?: Date; lte?: Date } = {};

  if (from) {
    createdAtFilter.gte = new Date(`${from}T00:00:00`);
  }

  if (to) {
    createdAtFilter.lte = new Date(`${to}T23:59:59.999`);
  }

  const transactions = await prisma.balanceTransaction.findMany({
    where: {
      storeId: store.id,
      ...(typeFilter ? { type: typeFilter } : {}),
      ...(from || to ? { createdAt: createdAtFilter } : {}),
      ...(q
        ? {
            note: {
              contains: q,
            },
          }
        : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      type: true,
      amount: true,
      note: true,
      reference: true,
      createdAt: true,
      balanceBefore: true,
      balanceAfter: true,
    },
  });

  const headers = [
    "ID",
    "النوع",
    "Type",
    "المبلغ",
    "الرصيد قبل",
    "الرصيد بعد",
    "الملاحظة",
    "Reference",
    "التاريخ",
  ];

  const rows = transactions.map((transaction) => [
    transaction.id,
    getTransactionLabel(transaction.type),
    transaction.type,
    (transaction.amount / 100).toFixed(2),
    (transaction.balanceBefore / 100).toFixed(2),
    (transaction.balanceAfter / 100).toFixed(2),
    transaction.note || "",
    transaction.reference || "",
    formatDate(transaction.createdAt),
  ]);

  const csv = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ].join("\n");

  return new Response("\uFEFF" + csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="balance-history.csv"`,
    },
  });
}
