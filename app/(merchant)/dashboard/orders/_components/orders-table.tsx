import Link from "next/link";
import type { OrderRiskLevel, OrderSource, OrderStatus } from "@prisma/client";
import { StatusPill } from "@/components/saas-page";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ORDER_CHANNELS, ORDER_RISK_META, paymentMethodLabel } from "./order-meta";
import { OrderStatusSelect } from "./order-status-select";
import { lazyIntl, tr } from "@/lib/i18n/dashboard";

export type OrderRow = {
  id: string;
  fullName: string;
  phone: string;
  status: OrderStatus;
  source: OrderSource;
  total: number;
  paymentMethod: string;
  createdAt: Date;
  itemCount: number;
  firstProduct: string | null;
  otherProducts: number;
  riskLevel: OrderRiskLevel | null;
  /** Waiting for the customer's phone code. */
  awaitingCode: boolean;
  /** Canceled because the customer refused the delivery. */
  returned: boolean;
};

const money = lazyIntl.number({ style: "currency", currency: "EGP", maximumFractionDigits: 0 });
const nf = lazyIntl.number();
const dateFormat = lazyIntl.date({
  timeZone: "Africa/Cairo",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

const orderHref = (id: string) => `/orders/${id}`;
const shortId = (id: string) => `#${id.slice(0, 8)}`;

function Channel({ source }: { source: OrderSource }) {
  const { label, icon: Icon } = ORDER_CHANNELS[source];
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      <Icon className="size-3.5" />
      {label}
    </span>
  );
}

function Products({ order }: { order: OrderRow }) {
  return (
    <div className="min-w-0">
      <p className="max-w-52 truncate text-sm">
        {order.firstProduct ?? "—"}
        {order.otherProducts > 0 && <span className="text-muted-foreground"> +{nf.format(order.otherProducts)}</span>}
      </p>
      <p className="text-xs text-muted-foreground">{tr("{0} قطعة", nf.format(order.itemCount))}</p>
    </div>
  );
}

/** Only what needs the merchant's attention: risky numbers, unconfirmed and returned orders. */
function Flags({ order }: { order: OrderRow }) {
  const risk = order.riskLevel && order.riskLevel !== "LOW" ? ORDER_RISK_META[order.riskLevel] : null;
  if (!risk && !order.awaitingCode && !order.returned) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {risk && (
        <StatusPill tone={risk.tone} className="text-[11px]">
          {risk.label}
        </StatusPill>
      )}
      {order.awaitingCode && (
        <StatusPill tone="warning" className="text-[11px]">
          {tr("مستني التأكيد")}
        </StatusPill>
      )}
      {order.returned && (
        <StatusPill tone="danger" className="text-[11px]">
          {tr("مرتجع")}
        </StatusPill>
      )}
    </div>
  );
}

/** Desktop: table. Mobile: stacked rows — same data, same row link. */
export function OrdersTable({ orders, storeId }: { orders: OrderRow[]; storeId: string }) {
  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="h-10 ps-4 text-start text-xs font-medium text-muted-foreground">{tr("الطلب")}</TableHead>
              <TableHead className="h-10 text-start text-xs font-medium text-muted-foreground">{tr("العميل")}</TableHead>
              <TableHead className="hidden h-10 text-start text-xs font-medium text-muted-foreground lg:table-cell">
                {tr("المنتجات")}
              </TableHead>
              <TableHead className="hidden h-10 text-start text-xs font-medium text-muted-foreground xl:table-cell">
                {tr("القناة")}
              </TableHead>
              <TableHead className="h-10 text-start text-xs font-medium text-muted-foreground">{tr("الحالة")}</TableHead>
              <TableHead className="h-10 pe-4 text-end text-xs font-medium text-muted-foreground">{tr("المبلغ")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              // The order link stretches over the whole row; the status menu sits above it (z-10).
              <TableRow key={order.id} className="relative">
                <TableCell className="py-3 ps-4">
                  <Link
                    href={orderHref(order.id)}
                    className="font-mono text-sm font-medium after:absolute after:inset-0 hover:underline focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-ring"
                    dir="ltr"
                  >
                    {shortId(order.id)}
                  </Link>
                  <p className="text-xs text-muted-foreground">{dateFormat.format(order.createdAt)}</p>
                </TableCell>
                <TableCell className="py-3">
                  <p className="max-w-44 truncate text-sm font-medium">{order.fullName}</p>
                  <p className="text-xs text-muted-foreground tabular-nums" dir="ltr">
                    {order.phone}
                  </p>
                  <Flags order={order} />
                </TableCell>
                <TableCell className="hidden py-3 lg:table-cell">
                  <Products order={order} />
                </TableCell>
                <TableCell className="hidden py-3 xl:table-cell">
                  <Channel source={order.source} />
                </TableCell>
                <TableCell className="py-3">
                  <OrderStatusSelect orderId={order.id} storeId={storeId} currentStatus={order.status} />
                </TableCell>
                <TableCell className="py-3 pe-4 text-end">
                  <p className="text-sm font-semibold tabular-nums">{money.format(order.total / 100)}</p>
                  <p className="text-xs text-muted-foreground">{paymentMethodLabel(order.paymentMethod)}</p>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y divide-border md:hidden">
        {orders.map((order) => (
          <li key={order.id} className="relative space-y-2 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={orderHref(order.id)}
                  className="block truncate text-sm font-medium after:absolute after:inset-0 focus-visible:outline-none"
                >
                  {order.fullName}
                </Link>
                <p className="text-xs text-muted-foreground">
                  <span className="font-mono" dir="ltr">
                    {shortId(order.id)}
                  </span>{" "}
                  · {dateFormat.format(order.createdAt)}
                </p>
                <Flags order={order} />
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums">{money.format(order.total / 100)}</p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <OrderStatusSelect orderId={order.id} storeId={storeId} currentStatus={order.status} />
              <Channel source={order.source} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
