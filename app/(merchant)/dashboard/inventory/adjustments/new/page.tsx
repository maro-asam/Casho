import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GetBranchesAction } from "@/actions/inventory/branches.actions";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { NewAdjustmentForm } from "./_components/NewAdjustmentForm";
import { tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

async function getProducts(userId: string) {
  const store = await prisma.store.findFirst({ where: { userId }, select: { id: true } });
  if (!store) return { products: [], branchStock: {} };
  const products = await prisma.product.findMany({
    where: { storeId: store.id, isActive: true },
    select: { id: true, name: true, image: true, sku: true, stock: true },
    orderBy: { name: "asc" },
    take: 500,
  });
  const rows = await prisma.branchInventory.findMany({
    where: { storeId: store.id, variantId: null, productId: { in: products.map((p) => p.id) } },
    select: { productId: true, branchId: true, quantity: true },
  });
  const branchStock: Record<string, Record<string, number>> = {};
  for (const r of rows) (branchStock[r.productId] ??= {})[r.branchId] = r.quantity;
  return { products, branchStock };
}

export default async function NewAdjustmentPage() {
  await loadDashboardLocale();
  const userId = await requireUserId();
  const [branches, { products, branchStock }] = await Promise.all([
    GetBranchesAction(),
    getProducts(userId),
  ]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/inventory/adjustments">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowRight className="size-4 ltr:-scale-x-100" />
            {tr("التسويات")}
          </Button>
        </Link>
        <h1 className="text-xl font-bold">{tr("تسوية مخزون جديدة")}</h1>
      </div>
      <NewAdjustmentForm branches={branches.filter((b) => b.isActive)} products={products} branchStock={branchStock} />
    </div>
  );
}
