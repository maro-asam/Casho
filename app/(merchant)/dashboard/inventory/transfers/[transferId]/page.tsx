import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GetTransferDetailAction } from "@/actions/inventory/transfers.actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TransferStatus } from "@prisma/client";
import { TransferActions } from "./_components/TransferActions";
import { intlLocale, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

const STATUS_CONFIG: Record<TransferStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { get label() { return tr("معلق — بانتظار الموافقة"); }, variant: "secondary" },
  APPROVED: { get label() { return tr("موافق عليه — جاهز للشحن"); }, variant: "outline" },
  SHIPPED: { get label() { return tr("تم الشحن — في الطريق"); }, variant: "default" },
  RECEIVED: { get label() { return tr("مُستلم بالكامل"); }, variant: "default" },
  CANCELLED: { get label() { return tr("ملغي"); }, variant: "destructive" },
};

export default async function TransferDetailPage({ params }: { params: Promise<{ transferId: string }> }) {
  await loadDashboardLocale();
  const { transferId } = await params;
  const transfer = await GetTransferDetailAction(transferId);
  const cfg = STATUS_CONFIG[transfer.status];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/inventory/transfers">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowRight className="size-4 ltr:-scale-x-100" />
              {tr("التحويلات")}
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
          <h2 className="mb-4 font-semibold">{tr("تفاصيل التحويل")}</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{tr("من")}</dt>
              <dd className="font-medium">{transfer.fromBranch.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{tr("إلى")}</dt>
              <dd className="font-medium">{transfer.toBranch.name}</dd>
            </div>
            {transfer.reference && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{tr("مرجع")}</dt>
                <dd dir="ltr" className="font-mono text-xs">{transfer.reference}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{tr("أُنشئ بواسطة")}</dt>
              <dd>{transfer.createdBy.name ?? "—"}</dd>
            </div>
            {transfer.approvedBy && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{tr("وافق عليه")}</dt>
                <dd>{transfer.approvedBy.name}</dd>
              </div>
            )}
            {transfer.shippedAt && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{tr("تاريخ الشحن")}</dt>
                <dd>{new Intl.DateTimeFormat(intlLocale(), { day: "2-digit", month: "short" }).format(new Date(transfer.shippedAt))}</dd>
              </div>
            )}
            {transfer.receivedAt && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{tr("تاريخ الاستلام")}</dt>
                <dd>{new Intl.DateTimeFormat(intlLocale(), { day: "2-digit", month: "short" }).format(new Date(transfer.receivedAt))}</dd>
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
            {tr("المنتجات ({0})", transfer.items.length)}
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-start text-xs font-semibold uppercase text-muted-foreground">
                <th className="px-4 py-3">{tr("المنتج")}</th>
                <th className="px-4 py-3 text-center">{tr("مطلوب")}</th>
                <th className="px-4 py-3 text-center">{tr("مشحون")}</th>
                <th className="px-4 py-3 text-center">{tr("مُستلم")}</th>
                <th className="px-4 py-3 text-center">{tr("الحالة")}</th>
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
                        <Badge variant="default">{tr("مكتمل")}</Badge>
                      ) : partial ? (
                        <Badge variant="outline">{tr("جزئي")}</Badge>
                      ) : (
                        <Badge variant="secondary">{tr("معلق")}</Badge>
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
