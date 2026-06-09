import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GetBranchesAction } from "@/actions/inventory/branches.actions";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { NewAdjustmentForm } from "./_components/NewAdjustmentForm";

async function getProducts(userId: string) {
  const store = await prisma.store.findFirst({ where: { userId }, select: { id: true } });
  if (!store) return [];
  return prisma.product.findMany({
    where: { storeId: store.id, isActive: true },
    select: { id: true, name: true, image: true, sku: true, stock: true },
    orderBy: { name: "asc" },
    take: 500,
  });
}

export default async function NewAdjustmentPage() {
  const userId = await requireUserId();
  const [branches, products] = await Promise.all([
    GetBranchesAction(),
    getProducts(userId),
  ]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/inventory/adjustments">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowRight className="size-4" />
            التسويات
          </Button>
        </Link>
        <h1 className="text-xl font-bold">تسوية مخزون جديدة</h1>
      </div>
      <NewAdjustmentForm branches={branches} products={products} />
    </div>
  );
}
