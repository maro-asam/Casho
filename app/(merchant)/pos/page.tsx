import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePosContext } from "@/lib/pos/pos-context";
import { listUserStores } from "@/lib/store/store-guard";
import { GetActiveShiftAction } from "@/actions/pos/shift.actions";
import { GetHeldOrdersAction, GetPosCategoriesAction } from "@/actions/pos/pos.actions";
import PosTerminal from "./_components/PosTerminal";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export default async function PosPage() {
  await loadDashboardLocale();
  const ctx = await requirePosContext();
  const userId = ctx.userId;

  const store = await prisma.store.findUnique({
    where: { id: ctx.storeId },
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

  const [activeShift, categories, cashierUser, heldOrders, stores] = await Promise.all([
    GetActiveShiftAction(),
    GetPosCategoriesAction(),
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    }),
    GetHeldOrdersAction(),
    listUserStores(userId),
  ]);

  return (
    <PosTerminal
      key={ctx.branch.id}
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
      initialHeldCount={heldOrders.length}
      branch={{ id: ctx.branch.id, name: ctx.branch.name }}
      branches={ctx.branches.map((b) => ({ id: b.id, name: b.name }))}
      branchLocked={!!ctx.shift}
      stores={stores}
    />
  );
}
