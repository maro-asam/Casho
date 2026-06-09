import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GetSuppliersAction } from "@/actions/inventory/suppliers.actions";
import { GetBranchesAction } from "@/actions/inventory/branches.actions";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { prisma } from "@/lib/prisma";
import { NewPOForm } from "../_components/NewPOForm";

async function getProducts(userId: string) {
  const store = await prisma.store.findFirst({ where: { userId }, select: { id: true } });
  if (!store) return [];
  return prisma.product.findMany({
    where: { storeId: store.id, isActive: true },
    select: { id: true, name: true, image: true, sku: true, stock: true, costPrice: true },
    orderBy: { name: "asc" },
    take: 500,
  });
}

export default async function NewPOPage() {
  const userId = await requireUserId();
  const [suppliersData, branches, products] = await Promise.all([
    GetSuppliersAction({ pageSize: 100 }),
    GetBranchesAction(),
    getProducts(userId),
  ]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/inventory/purchase-orders">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowRight className="size-4" />
            طلبات الشراء
          </Button>
        </Link>
        <h1 className="text-xl font-bold">طلب شراء جديد</h1>
      </div>
      <NewPOForm
        suppliers={suppliersData.items}
        branches={branches}
        products={products}
      />
    </div>
  );
}
