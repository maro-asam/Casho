"use server";

import { revalidatePath } from "next/cache";
import { PosShiftStatus, PosShiftEntryType, NotificationType, OrderSource, PosReturnStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications/in-app";
import { assertCanUse, FEATURE_KEYS } from "@/lib/entitlements";
import { canManageOthersShifts, requirePosContext } from "@/lib/pos/pos-context";
import { expectedDrawerCash } from "@/lib/pos/cash";
import { BranchAccessError, requireBranchScope, type BranchAccessContext } from "@/lib/store/branch-context";

const egp = (piasters: number) => `${(piasters / 100).toFixed(2)} ج`;

/**
 * Shifts this user may see: their own, plus — for owners/managers — every shift
 * in the branches they can access.
 */
function visibleShiftsWhere(ctx: BranchAccessContext): Prisma.PosShiftWhereInput {
  if (canManageOthersShifts(ctx)) return { storeId: ctx.storeId, branchId: { in: ctx.branches.map((b) => b.id) } };
  return { storeId: ctx.storeId, cashierId: ctx.userId };
}

/** Cash that should be in the drawer: float + cash part of sales + cash in/out − cash refunds. */
async function computeExpectedCash(tx: Prisma.TransactionClient, shift: { id: string; openingBalance: number }) {
  const [orders, entries, refunds] = await Promise.all([
    tx.order.findMany({
      where: { posShiftId: shift.id, source: OrderSource.POS },
      select: { total: true, paymentMethod: true, splitPayments: { select: { paymentMethod: true, amount: true } } },
    }),
    tx.posShiftEntry.aggregate({
      where: { shiftId: shift.id, type: { in: [PosShiftEntryType.CASH_IN, PosShiftEntryType.CASH_OUT] } },
      _sum: { amount: true },
    }),
    tx.posReturn.aggregate({
      where: { shiftId: shift.id, status: PosReturnStatus.COMPLETED, refundMethod: "cash" },
      _sum: { refundAmount: true },
    }),
  ]);

  return expectedDrawerCash({
    openingBalance: shift.openingBalance,
    orders,
    cashMovements: entries._sum.amount ?? 0,
    cashRefunds: refunds._sum.refundAmount ?? 0,
  });
}

export async function GetActiveShiftAction() {
  const ctx = await requirePosContext();
  if (!ctx.shift) return null;

  return prisma.posShift.findUnique({
    where: { id: ctx.shift.id },
    include: {
      cashier: { select: { id: true, name: true, email: true } },
      branch: { select: { id: true, name: true } },
      entries: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
}

export async function OpenShiftAction(openingBalance: number) {
  const ctx = await requirePosContext();
  await assertCanUse(ctx.storeId, FEATURE_KEYS.POS);

  if (ctx.shift) throw new Error("عندك وردية مفتوحة بالفعل");
  if (!Number.isFinite(openingBalance) || openingBalance < 0) throw new Error("رصيد الافتتاح غير صالح");

  const openingBalancePiasters = Math.round(openingBalance * 100);

  let shift;
  try {
    shift = await prisma.posShift.create({
      data: {
        storeId: ctx.storeId,
        branchId: ctx.branch.id,
        cashierId: ctx.userId,
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
        branch: { select: { id: true, name: true } },
      },
    });
  } catch (error) {
    // Unique index: one open shift per cashier (double click / two tabs).
    if ((error as { code?: string }).code === "P2002") throw new Error("عندك وردية مفتوحة بالفعل");
    throw error;
  }

  if (!ctx.isOwner) {
    await createNotification({
      storeId: ctx.storeId,
      type: NotificationType.SHIFT_OPENED,
      title: `وردية جديدة — ${ctx.branch.name}`,
      message: `${shift.cashier.name || shift.cashier.email} فتح وردية في فرع ${ctx.branch.name} برصيد ${egp(openingBalancePiasters)}.`,
      href: `/pos/shifts/${shift.id}`,
      data: { shiftId: shift.id, branchId: ctx.branch.id },
    });
  }

  revalidatePath("/pos");
  return shift;
}

export async function CloseShiftAction(input: {
  shiftId: string;
  closingBalance: number;
  notes?: string;
}) {
  const ctx = await requirePosContext();
  if (!Number.isFinite(input.closingBalance) || input.closingBalance < 0) throw new Error("المبلغ غير صالح");

  const isOwn = ctx.shift?.id === input.shiftId;
  const shift = await prisma.posShift.findFirst({
    where: {
      id: input.shiftId,
      status: PosShiftStatus.OPEN,
      ...(isOwn ? { storeId: ctx.storeId } : visibleShiftsWhere(ctx)),
    },
    include: {
      branch: { select: { name: true } },
      cashier: { select: { name: true, email: true } },
    },
  });
  if (!shift) throw new Error("الوردية غير موجودة أو مغلقة بالفعل");

  const closingBalancePiasters = Math.round(input.closingBalance * 100);

  const closedShift = await prisma.$transaction(async (tx) => {
    const expectedCash = await computeExpectedCash(tx, shift);
    const cashDifference = closingBalancePiasters - expectedCash;

    // Guarded update: two people closing the same shift at once — only one wins.
    const res = await tx.posShift.updateMany({
      where: { id: shift.id, status: PosShiftStatus.OPEN },
      data: {
        status: PosShiftStatus.CLOSED,
        closingBalance: closingBalancePiasters,
        expectedCash,
        cashDifference,
        closedAt: new Date(),
        notes: input.notes,
      },
    });
    if (res.count === 0) throw new Error("الوردية اتقفلت بالفعل");

    await tx.posShiftEntry.create({
      data: {
        shiftId: shift.id,
        type: PosShiftEntryType.CLOSING_COUNT,
        amount: closingBalancePiasters,
        note: `إغلاق الوردية — العجز/الزيادة: ${cashDifference >= 0 ? "+" : ""}${(cashDifference / 100).toFixed(2)} ج${isOwn ? "" : " (أغلقها المدير)"}`,
      },
    });

    return tx.posShift.findUniqueOrThrow({ where: { id: shift.id } });
  });

  const diff = closedShift.cashDifference ?? 0;
  const branchName = shift.branch?.name ?? "الفرع الرئيسي";
  await createNotification({
    storeId: ctx.storeId,
    type: NotificationType.SHIFT_CLOSED,
    title: diff < 0 ? `عجز في وردية — ${branchName}` : `تم إغلاق وردية — ${branchName}`,
    message:
      `وردية ${shift.cashier.name || shift.cashier.email} في فرع ${branchName}: ` +
      `مبيعات ${egp(shift.totalSales)} · ${shift.transactionCount} فاتورة` +
      (diff === 0 ? " · الدرج مظبوط." : ` · ${diff < 0 ? "عجز" : "زيادة"} ${egp(Math.abs(diff))}.`),
    href: `/pos/shifts/${shift.id}`,
    data: { shiftId: shift.id, branchId: shift.branchId, cashDifference: diff },
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
  const ctx = await requirePosContext();

  // Only into your own drawer.
  if (!ctx.shift || ctx.shift.id !== input.shiftId) throw new Error("الوردية غير موجودة أو مغلقة");
  if (!Number.isFinite(input.amount)) throw new Error("المبلغ غير صالح");

  const amountPiasters = Math.round(Math.abs(input.amount) * 100);

  await prisma.posShiftEntry.create({
    data: {
      shiftId: ctx.shift.id,
      type: input.type === "CASH_IN" ? PosShiftEntryType.CASH_IN : PosShiftEntryType.CASH_OUT,
      amount: input.type === "CASH_IN" ? amountPiasters : -amountPiasters,
      note: input.note,
    },
  });

  revalidatePath("/pos");
  return { success: true };
}

export async function GetShiftsAction(limit = 20, branch?: string | null) {
  const ctx = await requireBranchScope("use_pos", branch, "pos");
  const where: Prisma.PosShiftWhereInput = canManageOthersShifts(ctx)
    ? { storeId: ctx.storeId, branchId: { in: ctx.scope.branchIds ?? ctx.branches.map((b) => b.id) } }
    : { storeId: ctx.storeId, cashierId: ctx.userId };

  const shifts = await prisma.posShift.findMany({
    where,
    include: {
      cashier: { select: { id: true, name: true, email: true } },
      branch: { select: { id: true, name: true } },
      _count: { select: { orders: true } },
    },
    orderBy: { openedAt: "desc" },
    take: limit,
  });
  return { shifts, scope: ctx.scope, branches: ctx.branches, canSeeAll: canManageOthersShifts(ctx) };
}

export async function GetShiftByIdAction(shiftId: string) {
  const ctx = await requireBranchScope("use_pos", undefined, "pos");
  const shift = await prisma.posShift.findFirst({
    where: { id: shiftId, ...visibleShiftsWhere(ctx) },
    include: {
      cashier: { select: { id: true, name: true, email: true } },
      branch: { select: { id: true, name: true } },
      entries: { orderBy: { createdAt: "asc" } },
      returns: {
        where: { status: PosReturnStatus.COMPLETED },
        select: { id: true, refundAmount: true, refundMethod: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
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
  if (!shift) return null;
  if (!canManageOthersShifts(ctx) && shift.cashierId !== ctx.userId) throw new BranchAccessError();
  return shift;
}
