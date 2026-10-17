import { prisma } from "@/lib/prisma";
import { BalanceTransactionType, type Prisma } from "@prisma/client";

type ApplyBalanceChangeInput = {
  storeId: string;
  amount: number; // موجب للشحن / سالب للخصم - بالقروش
  type: BalanceTransactionType;
  note?: string;
  reference?: string;
};

/**
 * Moves the store balance and writes its ledger row inside the caller's
 * transaction. Atomic: the balance is changed with `increment` (never a stale
 * read-then-write), and a debit only applies while the balance covers it, so
 * concurrent callers can neither lose an update nor overdraw.
 */
export async function applyBalanceChangeTx(
  tx: Prisma.TransactionClient,
  { storeId, amount, type, note, reference }: ApplyBalanceChangeInput,
) {
  if (!Number.isInteger(amount) || amount === 0) {
    throw new Error("Invalid balance amount");
  }

  const res = await tx.store.updateMany({
    where: { id: storeId, ...(amount < 0 && { balance: { gte: -amount } }) },
    data: { balance: { increment: amount } },
  });

  if (res.count !== 1) {
    const exists = await tx.store.findUnique({ where: { id: storeId }, select: { id: true } });
    throw new Error(exists ? "Insufficient balance" : "Store not found");
  }

  // Our update holds the row lock, so this read sees exactly our result.
  const { balance: balanceAfter } = await tx.store.findUniqueOrThrow({
    where: { id: storeId },
    select: { balance: true },
  });
  const balanceBefore = balanceAfter - amount;

  const transaction = await tx.balanceTransaction.create({
    data: {
      storeId,
      type,
      amount,
      balanceBefore,
      balanceAfter,
      note: note?.trim() || null,
      reference: reference ?? null,
    },
  });

  return { storeId, balanceBefore, balanceAfter, transaction };
}

export async function applyBalanceChange(input: ApplyBalanceChangeInput) {
  return prisma.$transaction((tx) => applyBalanceChangeTx(tx, input));
}
