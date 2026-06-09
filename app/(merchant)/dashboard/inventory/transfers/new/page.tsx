import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GetBranchesAction } from "@/actions/inventory/branches.actions";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { prisma } from "@/lib/prisma";
import { NewTransferForm } from "../_components/NewTransferForm";

async function getProducts(userId: string) {
  const store = await prisma.store.findFirst({ where: { userId }, select: { id: true } });
  if (!store) return [];
  return prisma.product.findMany({
    where: { storeId: store.id, isActive: true, stock: { gt: 0 } },
    select: { id: true, name: true, image: true, sku: true, stock: true },
    orderBy: { name: "asc" },
    take: 500,
  });
}

export default async function NewTransferPage() {
  const userId = await requireUserId();
  const [branches, products] = await Promise.all([GetBranchesAction(), getProducts(userId)]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/inventory/transfers">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowRight className="size-4" />
            التحويلات
          </Button>
        </Link>
        <h1 className="text-xl font-bold">تحويل مخزون جديد</h1>
      </div>
      {branches.length < 2 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            تحتاج إلى فرعين على الأقل لإنشاء تحويل.
          </p>
          <Link href="/dashboard/inventory/branches">
            <Button className="mt-4">إدارة الفروع</Button>
          </Link>
        </div>
      ) : (
        <NewTransferForm branches={branches} products={products} />
      )}
    </div>
  );
}
