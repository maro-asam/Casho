import { prisma } from "@/lib/prisma";
import {
  BalanceTransactionType,
  TopupRequestStatus,
} from "@/lib/generated/prisma/enums";

async function main() {
  const requestId = process.argv[2];

  if (!requestId) {
    throw new Error("لازم تبعت requestId");
  }

  const request = await prisma.topupRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      amount: true,
      status: true,
      note: true,
      transferRef: true,
      storeId: true,
      store: {
        select: {
          id: true,
          name: true,
          balance: true,
        },
      },
    },
  });

  if (!request) {
    throw new Error("Topup request not found");
  }

  if (request.status !== TopupRequestStatus.APPROVED) {
    throw new Error("الطلب لازم يكون APPROVED الأول");
  }

  const existingTransaction = await prisma.balanceTransaction.findFirst({
    where: {
      storeId: request.storeId,
      type: BalanceTransactionType.TOPUP,
      reference: request.id,
    },
    select: {
      id: true,
    },
  });

  if (existingTransaction) {
    throw new Error("تمت إضافة هذا الشحن قبل كده");
  }

  const balanceBefore = request.store.balance;
  const balanceAfter = balanceBefore + request.amount;

  const result = await prisma.$transaction(async (tx) => {
    const updatedStore = await tx.store.update({
      where: { id: request.store.id },
      data: {
        balance: balanceAfter,
      },
    });

    const transaction = await tx.balanceTransaction.create({
      data: {
        storeId: request.store.id,
        type: BalanceTransactionType.TOPUP,
        amount: request.amount,
        balanceBefore,
        balanceAfter,
        note:
          request.note?.trim() ||
          `شحن رصيد من طلب شحن${request.transferRef ? ` - ${request.transferRef}` : ""}`,
        reference: request.id,
      },
    });

    return {
      updatedStore,
      transaction,
    };
  });

  console.log("تم إضافة الرصيد بنجاح ✅");
  console.log({
    storeName: request.store.name,
    storeId: request.store.id,
    requestId: request.id,
    transactionId: result.transaction.id,
    balanceBefore,
    amount: request.amount,
    balanceAfter,
  });
}

main()
  .catch((error) => {
    console.error("Apply topup failed ❌");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
