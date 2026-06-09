import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GetTransferDetailAction } from "@/actions/inventory/transfers.actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TransferStatus } from "@prisma/client";
import { TransferActions } from "./_components/TransferActions";

const STATUS_CONFIG: Record<TransferStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "معلق — بانتظار الموافقة", variant: "secondary" },
  APPROVED: { label: "موافق عليه — جاهز للشحن", variant: "outline" },
  SHIPPED: { label: "تم الشحن — في الطريق", variant: "default" },
  RECEIVED: { label: "مُستلم بالكامل", variant: "default" },
  CANCELLED: { label: "ملغي", variant: "destructive" },
};

export default async function TransferDetailPage({ params }: { params: { transferId: string } }) {
  const transfer = await GetTransferDetailAction(params.transferId);
  const cfg = STATUS_CONFIG[transfer.status];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/inventory/transfers">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowRight className="size-4" />
              التحويلات
            </Button>
          </Link>
          <h1 className="text-xl font-bold">
            {transfer.fromBranch.name} → {transfer.toBranch.name}
          </h1>
          <Badge variant={cfg.variant}>{cfg.label}</Badge>
        </div>
        <TransferActions transfer={transfer} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 font-semibold">تفاصيل التحويل</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">من</dt>
              <dd className="font-medium">{transfer.fromBranch.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">إلى</dt>
              <dd className="font-medium">{transfer.toBranch.name}</dd>
            </div>
            {transfer.reference && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">مرجع</dt>
                <dd dir="ltr" className="font-mono text-xs">{transfer.reference}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">أُنشئ بواسطة</dt>
              <dd>{transfer.createdBy.name ?? "—"}</dd>
            </div>
            {transfer.approvedBy && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">وافق عليه</dt>
                <dd>{transfer.approvedBy.name}</dd>
              </div>
            )}
            {transfer.shippedAt && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">تاريخ الشحن</dt>
                <dd>{new Intl.DateTimeFormat("ar-EG", { day: "2-digit", month: "short" }).format(new Date(transfer.shippedAt))}</dd>
              </div>
            )}
            {transfer.receivedAt && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">تاريخ الاستلام</dt>
                <dd>{new Intl.DateTimeFormat("ar-EG", { day: "2-digit", month: "short" }).format(new Date(transfer.receivedAt))}</dd>
              </div>
            )}
          </dl>
          {transfer.notes && (
            <div className="mt-4 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              {transfer.notes}
            </div>
          )}
        </div>

        {/* Items */}
        <div className="rounded-xl border border-border bg-card shadow-sm lg:col-span-2">
          <h2 className="border-b border-border px-5 py-4 font-semibold">
            المنتجات ({transfer.items.length})
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-right text-xs font-semibold uppercase text-muted-foreground">
                <th className="px-4 py-3">المنتج</th>
                <th className="px-4 py-3 text-center">مطلوب</th>
                <th className="px-4 py-3 text-center">مشحون</th>
                <th className="px-4 py-3 text-center">مُستلم</th>
                <th className="px-4 py-3 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transfer.items.map((item) => {
                const done = item.receivedQuantity >= item.shippedQuantity && item.shippedQuantity > 0;
                const partial = item.receivedQuantity > 0 && !done;
                return (
                  <tr key={item.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <img src={item.product.image} alt={item.product.name} className="size-9 rounded-md object-cover" />
                        <div>
                          <p className="font-medium">{item.product.name}</p>
                          {item.variant && <p className="text-xs text-muted-foreground">{item.variant.name}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums">{item.requestedQuantity}</td>
                    <td className="px-4 py-3 text-center tabular-nums">{item.shippedQuantity}</td>
                    <td className="px-4 py-3 text-center tabular-nums">{item.receivedQuantity}</td>
                    <td className="px-4 py-3 text-center">
                      {done ? (
                        <Badge variant="default">مكتمل</Badge>
                      ) : partial ? (
                        <Badge variant="outline">جزئي</Badge>
                      ) : (
                        <Badge variant="secondary">معلق</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
