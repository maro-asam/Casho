import Link from "next/link";
import { ArrowRight, Warehouse } from "lucide-react";
import { GetBranchesAction } from "@/actions/inventory/branches.actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BranchActions } from "./_components/BranchActions";
import { NewBranchDialog } from "./_components/NewBranchDialog";

export default async function BranchesPage() {
  const branches = await GetBranchesAction();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/inventory">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowRight className="size-4" />
              المخزون
            </Button>
          </Link>
          <h1 className="text-xl font-bold">إدارة الفروع</h1>
        </div>
        <NewBranchDialog />
      </div>

      {branches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <Warehouse className="mx-auto mb-3 size-10 text-muted-foreground/40" />
          <p className="mb-2 text-muted-foreground">لا توجد فروع بعد</p>
          <p className="mb-4 text-sm text-muted-foreground/70">
            يمكنك إضافة فروع لتتبع المخزون في كل فرع بشكل مستقل
          </p>
          <NewBranchDialog />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="rounded-xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold">{branch.name}</h2>
                    {branch.isDefault && <Badge>افتراضي</Badge>}
                    {!branch.isActive && <Badge variant="secondary">غير نشط</Badge>}
                  </div>
                  {branch.address && (
                    <p className="mt-1 text-sm text-muted-foreground">{branch.address}</p>
                  )}
                  {branch.phone && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{branch.phone}</p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {branch._count.inventory} صنف في المخزون
                  </p>
                </div>
                <BranchActions branch={branch} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
