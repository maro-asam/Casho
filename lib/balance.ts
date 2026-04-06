import { prisma } from "@/lib/prisma";
import { BalanceTransactionType } from "@/lib/generated/prisma/enums";

type ApplyBalanceChangeInput = {
  storeId: string;
  amount: number; // موجب للشحن / سالب للخصم - بالقروش
  type: BalanceTransactionType;
  note?: string;
};

export async function applyBalanceChange({
  storeId,
  amount,
  type,
  note,
}: ApplyBalanceChangeInput) {
  if (!Number.isInteger(amount) || amount === 0) {
    throw new Error("Invalid balance amount");
  }

  return prisma.$transaction(async (tx) => {
    const store = await tx.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        balance: true,
      },
    });

    if (!store) {
      throw new Error("Store not found");
    }

    const balanceBefore = store.balance;
    const balanceAfter = balanceBefore + amount;

    if (balanceAfter < 0) {
      throw new Error("Insufficient balance");
    }

    await tx.store.update({
      where: { id: store.id },
      data: {
        balance: balanceAfter,
      },
    });

    const transaction = await tx.balanceTransaction.create({
      data: {
        storeId: store.id,
        type,
        amount,
        balanceBefore,
        balanceAfter,
        note: note?.trim() || null,
      },
    });

    return {
      storeId: store.id,
      balanceBefore,
      balanceAfter,
      transaction,
    };
  });
}
