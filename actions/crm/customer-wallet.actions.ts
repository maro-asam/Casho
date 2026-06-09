"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";

async function getStoreId(userId: string) {
  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });
  if (!store) throw new Error("المتجر غير موجود");
  return store.id;
}

export async function AddWalletBalanceAction(
  customerId: string,
  amount: number,
  description?: string
) {
  if (amount <= 0) return { success: false as const, message: "المبلغ يجب أن يكون أكبر من صفر" };

  const userId = await requireUserId();
  const storeId = await getStoreId(userId);

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, storeId },
    select: { id: true, walletBalance: true },
  });
  if (!customer) return { success: false as const, message: "العميل غير موجود" };

  const balanceBefore = customer.walletBalance;
  const balanceAfter = balanceBefore + amount;

  await prisma.$transaction([
    prisma.customer.update({
      where: { id: customerId },
      data: { walletBalance: balanceAfter },
    }),
    prisma.customerWalletTransaction.create({
      data: {
        customerId,
        storeId,
        type: "CREDIT",
        amount,
        balanceBefore,
        balanceAfter,
        description: description ?? "إضافة رصيد",
      },
    }),
    prisma.customerTimeline.create({
      data: {
        customerId,
        storeId,
        eventType: "WALLET_CREDITED",
        title: "إضافة رصيد للمحفظة",
        description: `تم إضافة ${(amount / 100).toFixed(2)} ج.م للمحفظة`,
        metadata: { amount, description },
      },
    }),
  ]);

  revalidatePath(`/dashboard/crm/customers/${customerId}`);
  return { success: true as const, newBalance: balanceAfter };
}

export async function DeductWalletBalanceAction(
  customerId: string,
  amount: number,
  description?: string,
  reference?: string
) {
  if (amount <= 0) return { success: false as const, message: "المبلغ يجب أن يكون أكبر من صفر" };

  const userId = await requireUserId();
  const storeId = await getStoreId(userId);

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, storeId },
    select: { id: true, walletBalance: true },
  });
  if (!customer) return { success: false as const, message: "العميل غير موجود" };

  if (customer.walletBalance < amount)
    return { success: false as const, message: "رصيد المحفظة غير كافٍ" };

  const balanceBefore = customer.walletBalance;
  const balanceAfter = balanceBefore - amount;

  await prisma.$transaction([
    prisma.customer.update({
      where: { id: customerId },
      data: { walletBalance: balanceAfter },
    }),
    prisma.customerWalletTransaction.create({
      data: {
        customerId,
        storeId,
        type: "DEBIT",
        amount,
        balanceBefore,
        balanceAfter,
        description: description ?? "خصم رصيد",
        reference,
      },
    }),
    prisma.customerTimeline.create({
      data: {
        customerId,
        storeId,
        eventType: "WALLET_DEBITED",
        title: "خصم من المحفظة",
        description: `تم خصم ${(amount / 100).toFixed(2)} ج.م من المحفظة`,
        metadata: { amount, description, reference },
      },
    }),
  ]);

  revalidatePath(`/dashboard/crm/customers/${customerId}`);
  return { success: true as const, newBalance: balanceAfter };
}

export async function RefundToWalletAction(
  customerId: string,
  amount: number,
  orderId?: string
) {
  if (amount <= 0) return { success: false as const, message: "مبلغ الاسترداد غير صالح" };

  const userId = await requireUserId();
  const storeId = await getStoreId(userId);

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, storeId },
    select: { id: true, walletBalance: true },
  });
  if (!customer) return { success: false as const, message: "العميل غير موجود" };

  const balanceBefore = customer.walletBalance;
  const balanceAfter = balanceBefore + amount;

  await prisma.$transaction([
    prisma.customer.update({
      where: { id: customerId },
      data: { walletBalance: balanceAfter },
    }),
    prisma.customerWalletTransaction.create({
      data: {
        customerId,
        storeId,
        type: "REFUND",
        amount,
        balanceBefore,
        balanceAfter,
        description: "استرداد إلى المحفظة",
        reference: orderId,
      },
    }),
    prisma.customerTimeline.create({
      data: {
        customerId,
        storeId,
        eventType: "WALLET_CREDITED",
        title: "استرداد إلى المحفظة",
        description: `تم استرداد ${(amount / 100).toFixed(2)} ج.م إلى المحفظة`,
        referenceId: orderId,
        metadata: { amount, orderId },
      },
    }),
  ]);

  revalidatePath(`/dashboard/crm/customers/${customerId}`);
  return { success: true as const, newBalance: balanceAfter };
}

export async function GetWalletTransactionsAction(customerId: string, page = 1) {
  const userId = await requireUserId();
  const storeId = await getStoreId(userId);

  const PAGE = 20;
  const [transactions, total] = await Promise.all([
    prisma.customerWalletTransaction.findMany({
      where: { customerId, storeId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE,
      take: PAGE,
    }),
    prisma.customerWalletTransaction.count({ where: { customerId, storeId } }),
  ]);

  return { transactions, total };
}
