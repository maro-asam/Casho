import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { GetActiveShiftAction } from "@/actions/pos/shift.actions";
import { GetPosCategoriesAction } from "@/actions/pos/pos.actions";
import PosTerminal from "./_components/PosTerminal";

export default async function PosPage() {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: {
      id: true,
      name: true,
      slug: true,
      settings: {
        select: {
          logo: true,
          primaryColor: true,
          whatsappNumber: true,
        },
      },
    },
  });

  if (!store) redirect("/");

  const [activeShift, categories, cashierUser] = await Promise.all([
    GetActiveShiftAction(),
    GetPosCategoriesAction(),
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    }),
  ]);

  return (
    <PosTerminal
      store={store}
      cashier={cashierUser!}
      activeShift={activeShift ? {
        id: activeShift.id,
        openingBalance: activeShift.openingBalance,
        totalSales: activeShift.totalSales,
        transactionCount: activeShift.transactionCount,
        openedAt: activeShift.openedAt.toISOString(),
      } : null}
      categories={categories}
    />
  );
}
