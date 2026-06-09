"use server";

import { revalidatePath } from "next/cache";
import { PosShiftStatus, PosShiftEntryType, NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { createNotification } from "@/lib/notifications/in-app";

async function getStoreForUser(userId: string) {
  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, name: true, slug: true },
  });
  if (!store) throw new Error("المتجر غير موجود");
  return store;
}

export async function GetActiveShiftAction() {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  return prisma.posShift.findFirst({
    where: { storeId: store.id, status: PosShiftStatus.OPEN },
    include: {
      cashier: { select: { id: true, name: true, email: true } },
      entries: { orderBy: { createdAt: "desc" }, take: 20 },
    },
    orderBy: { openedAt: "desc" },
  });
}

export async function OpenShiftAction(openingBalance: number) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const existingOpen = await prisma.posShift.findFirst({
    where: { storeId: store.id, status: PosShiftStatus.OPEN },
    select: { id: true },
  });
  if (existingOpen) throw new Error("يوجد وردية مفتوحة بالفعل");

  const openingBalancePiasters = Math.round(openingBalance * 100);

  const shift = await prisma.posShift.create({
    data: {
      storeId: store.id,
      cashierId: userId,
      status: PosShiftStatus.OPEN,
      openingBalance: openingBalancePiasters,
      entries: {
        create: {
          type: PosShiftEntryType.OPENING_FLOAT,
          amount: openingBalancePiasters,
          note: "رصيد افتتاح الوردية",
        },
      },
    },
    include: {
      cashier: { select: { id: true, name: true, email: true } },
    },
  });

  revalidatePath("/pos");
  return shift;
}

export async function CloseShiftAction(input: {
  shiftId: string;
  closingBalance: number;
  notes?: string;
}) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const shift = await prisma.posShift.findFirst({
    where: { id: input.shiftId, storeId: store.id, status: PosShiftStatus.OPEN },
    include: {
      orders: {
        where: { source: "POS" },
        select: { total: true, discount: true },
      },
    },
  });
  if (!shift) throw new Error("الوردية غير موجودة أو مغلقة بالفعل");

  const closingBalancePiasters = Math.round(input.closingBalance * 100);

  const cashSales = shift.orders.reduce((sum, o) => sum + o.total, 0);
  const expectedCash = shift.openingBalance + cashSales - shift.totalReturns;
  const cashDifference = closingBalancePiasters - expectedCash;

  const closedShift = await prisma.posShift.update({
    where: { id: shift.id },
    data: {
      status: PosShiftStatus.CLOSED,
      closingBalance: closingBalancePiasters,
      expectedCash,
      cashDifference,
      closedAt: new Date(),
      notes: input.notes,
      entries: {
        create: {
          type: PosShiftEntryType.CLOSING_COUNT,
          amount: closingBalancePiasters,
          note: `إغلاق الوردية — العجز/الزيادة: ${cashDifference >= 0 ? "+" : ""}${(cashDifference / 100).toFixed(2)} ج`,
        },
      },
    },
  });

  await createNotification({
    storeId: store.id,
    userId,
    type: NotificationType.SYSTEM,
    title: "تم إغلاق الوردية",
    message: `وردية بإجمالي مبيعات ${(shift.totalSales / 100).toFixed(2)} ج تم إغلاقها بنجاح.`,
    href: `/pos/shifts/${shift.id}`,
  });

  revalidatePath("/pos");
  revalidatePath("/pos/shifts");
  return closedShift;
}

export async function AddCashMovementAction(input: {
  shiftId: string;
  type: "CASH_IN" | "CASH_OUT";
  amount: number;
  note?: string;
}) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const shift = await prisma.posShift.findFirst({
    where: { id: input.shiftId, storeId: store.id, status: PosShiftStatus.OPEN },
    select: { id: true },
  });
  if (!shift) throw new Error("الوردية غير موجودة أو مغلقة");

  const amountPiasters = Math.round(Math.abs(input.amount) * 100);

  await prisma.posShiftEntry.create({
    data: {
      shiftId: shift.id,
      type: input.type === "CASH_IN" ? PosShiftEntryType.CASH_IN : PosShiftEntryType.CASH_OUT,
      amount: input.type === "CASH_IN" ? amountPiasters : -amountPiasters,
      note: input.note,
    },
  });

  revalidatePath("/pos");
  return { success: true };
}

export async function GetShiftsAction(limit = 20) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  return prisma.posShift.findMany({
    where: { storeId: store.id },
    include: {
      cashier: { select: { id: true, name: true, email: true } },
      _count: { select: { orders: true } },
    },
    orderBy: { openedAt: "desc" },
    take: limit,
  });
}

export async function GetShiftByIdAction(shiftId: string) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  return prisma.posShift.findFirst({
    where: { id: shiftId, storeId: store.id },
    include: {
      cashier: { select: { id: true, name: true, email: true } },
      entries: { orderBy: { createdAt: "asc" } },
      orders: {
        where: { source: "POS" },
        select: {
          id: true,
          total: true,
          discount: true,
          profitTotal: true,
          paymentMethod: true,
          createdAt: true,
          fullName: true,
          splitPayments: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}
