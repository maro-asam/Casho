import Link from "next/link";
import { ArrowRight, Edit } from "lucide-react";
import { GetSupplierDetailAction } from "@/actions/inventory/suppliers.actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PO_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "مسودة", variant: "secondary" },
  SENT: { label: "مُرسل", variant: "outline" },
  PARTIAL: { label: "استلام جزئي", variant: "default" },
  RECEIVED: { label: "مُستلم", variant: "default" },
  CANCELLED: { label: "ملغي", variant: "destructive" },
};

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ supplierId: string }>;
}) {
  const { supplierId } = await params;
  const supplier = await GetSupplierDetailAction(supplierId);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/inventory/suppliers">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowRight className="size-4" />
              الموردون
            </Button>
          </Link>
          <h1 className="text-xl font-bold">{supplier.name}</h1>
          {!supplier.isActive && <Badge variant="secondary">غير نشط</Badge>}
        </div>
        <Link href={`/dashboard/inventory/suppliers/${supplier.id}/edit`}>
          <Button variant="outline" size="sm" className="gap-2">
            <Edit className="size-4" />
            تعديل
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info card */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 font-semibold">بيانات المورد</h2>
          <dl className="space-y-3 text-sm">
            {supplier.phone && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">الهاتف</dt>
                <dd dir="ltr">{supplier.phone}</dd>
              </div>
            )}
            {supplier.email && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">البريد</dt>
                <dd dir="ltr">{supplier.email}</dd>
              </div>
            )}
            {supplier.address && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">العنوان</dt>
                <dd className="text-end">{supplier.address}</dd>
              </div>
            )}
            {supplier.taxNumber && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">الرقم الضريبي</dt>
                <dd dir="ltr">{supplier.taxNumber}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">الرصيد المستحق</dt>
              <dd className={supplier.balance > 0 ? "font-semibold text-amber-600" : ""}>
                {supplier.balance > 0
                  ? new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP" }).format(supplier.balance / 100)
                  : "لا يوجد"}
              </dd>
            </div>
          </dl>
          {supplier.notes && (
            <div className="mt-4 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              {supplier.notes}
            </div>
          )}
        </div>

        {/* Products */}
        <div className="rounded-xl border border-border bg-card shadow-sm lg:col-span-2">
          <h2 className="border-b border-border px-5 py-4 font-semibold">
            المنتجات المرتبطة ({supplier.products.length})
          </h2>
          <div className="divide-y divide-border">
            {supplier.products.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-muted-foreground">
                لا توجد منتجات مرتبطة
              </p>
            ) : (
              supplier.products.map(({ product, isPrimary, costPrice }) => (
                <div key={product.id} className="flex items-center gap-3 px-5 py-3">
                  <img src={product.image} alt={product.name} className="size-9 rounded-md object-cover" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/dashboard/products/${product.id}/edit`} className="font-medium hover:underline">
                      {product.name}
                    </Link>
                    {product.sku && <p className="font-mono text-xs text-muted-foreground">{product.sku}</p>}
                  </div>
                  {isPrimary && <Badge>رئيسي</Badge>}
                  {costPrice && (
                    <span className="text-sm text-muted-foreground">
                      {costPrice} ج
                    </span>
                  )}
                  <span className="text-sm tabular-nums text-muted-foreground">
                    مخزون: {product.stock}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Purchase Orders */}
      {supplier.purchaseOrders.length > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-semibold">آخر طلبات الشراء</h2>
            <Link href={`/dashboard/inventory/purchase-orders?supplierId=${supplier.id}`}>
              <Button variant="ghost" size="sm">عرض الكل</Button>
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-right text-xs font-semibold uppercase text-muted-foreground">
                <th className="px-4 py-3">رقم الأمر</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3 text-center">المنتجات</th>
                <th className="px-4 py-3">الإجمالي</th>
                <th className="px-4 py-3">التاريخ</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {supplier.purchaseOrders.map((po) => {
                const st = PO_STATUS[po.status] ?? { label: po.status, variant: "outline" as const };
                return (
                  <tr key={po.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{po.orderNumber}</td>
                    <td className="px-4 py-3">
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center">{po._count.items}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP" }).format(po.totalAmount / 100)}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("ar-EG", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(po.createdAt))}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/inventory/purchase-orders/${po.id}`}>
                        <Button variant="ghost" size="sm">عرض</Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
