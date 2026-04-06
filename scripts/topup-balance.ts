import { prisma } from "@/lib/prisma";
import { BalanceTransactionType } from "@/lib/generated/prisma/enums";

async function main() {
  const storeId = "c11aa198-984e-4629-a535-9f210cb9a7b0";
  const amount = 50000; 
  const note = "شحن يدوي مؤقت لحد ما نعمل dashboard";

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: {
      id: true,
      balance: true,
      name: true,
    },
  });

  if (!store) {
    throw new Error("Store not found");
  }

  const balanceBefore = store.balance;
  const balanceAfter = balanceBefore + amount;

  const result = await prisma.$transaction(async (tx) => {
    const updatedStore = await tx.store.update({
      where: { id: store.id },
      data: {
        balance: balanceAfter,
      },
    });

    const transaction = await tx.balanceTransaction.create({
      data: {
        storeId: store.id,
        type: BalanceTransactionType.TOPUP,
        amount,
        balanceBefore,
        balanceAfter,
        note,
      },
    });

    return {
      updatedStore,
      transaction,
    };
  });

  console.log("تم شحن الرصيد بنجاح ✅");
  console.log({
    storeName: store.name,
    storeId: store.id,
    transactionId: result.transaction.id,
    balanceBefore,
    amount,
    balanceAfter,
  });
}

main()
  .catch((error) => {
    console.error("Topup failed ❌");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
