import { prisma } from "@/lib/prisma";
import { BalanceTransactionType } from "@prisma/client";

async function main() {
  const storeId = "f3899151-daa5-4870-9e37-e53e9cb2aab1";
  const amount = 55000; // 550 جنيه = 55000 قرش

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

  const balanceAfter = store.balance;
  const balanceBefore = balanceAfter - amount;

  if (balanceBefore < 0) {
    throw new Error(
      "balanceBefore طلع أقل من صفر. راجع amount أو الرصيد الحالي في المتجر.",
    );
  }

  const existingTransaction = await prisma.balanceTransaction.findFirst({
    where: {
      storeId: store.id,
      type: BalanceTransactionType.TOPUP,
      amount,
      balanceAfter,
      note: "تسجيل حركة قديمة مضافة من Prisma Studio",
    },
  });

  if (existingTransaction) {
    console.log("الحركة دي متسجلة بالفعل، مش هنعمل duplicate.");
    return;
  }

  const transaction = await prisma.balanceTransaction.create({
    data: {
      storeId: store.id,
      type: BalanceTransactionType.TOPUP,
      amount,
      balanceBefore,
      balanceAfter,
      note: "تسجيل حركة قديمة مضافة من Prisma Studio",
    },
  });

  console.log("تم تسجيل الحركة القديمة بنجاح ✅");
  console.log({
    storeName: store.name,
    storeId: store.id,
    transactionId: transaction.id,
    balanceBefore,
    amount,
    balanceAfter,
  });
}

main()
  .catch((error) => {
    console.error("Backfill failed ❌");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
