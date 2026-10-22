import Link from "next/link";
import type { OrderRiskLevel, OrderSource, OrderStatus } from "@prisma/client";
import { ChevronLeft } from "lucide-react";
import { ORDER_CHANNELS, ORDER_RISK_META, paymentMethodLabel } from "./order-meta";
import { OrderStatusSelect } from "./order-status-select";
import { WhatsAppConfirmButton } from "./whatsapp-confirm-button";
import { Tag, initialOf } from "@/components/saas-page";
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
  /** Confirmed by the customer (phone code or WhatsApp link). */
  customerConfirmed: boolean;
  /** Signed WhatsApp confirmation link while the order still needs one. */
  confirmUrl: string | null;
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

function Avatar({ name }: { name: string }) {
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-[15px] font-semibold text-foreground/70">
      {initialOf(name)}
    </span>
  );
}

function Channel({ source }: { source: OrderSource }) {
  const { label, icon: Icon } = ORDER_CHANNELS[source];
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
      <Icon className="size-3.5" strokeWidth={1.8} />
      {label}
    </span>
  );
}

/** Only what needs the merchant's attention: risky numbers, unconfirmed, confirmed-but-pending and returned orders. */
function Flags({ order }: { order: OrderRow }) {
  const risk = order.riskLevel && order.riskLevel !== "LOW" ? ORDER_RISK_META[order.riskLevel] : null;
  const confirmed = order.customerConfirmed && order.status === "PENDING";
  if (!risk && !order.awaitingCode && !order.returned && !confirmed) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {confirmed && <Tag tone="success">{tr("العميل أكّد")}</Tag>}
      {risk && <Tag tone={risk.tone}>{risk.label}</Tag>}
      {order.awaitingCode && <Tag tone="warning">{tr("مستني التأكيد")}</Tag>}
      {order.returned && <Tag tone="danger">{tr("مرتجع")}</Tag>}
    </div>
  );
}

const th = "h-9 px-3 text-start align-bottom pb-2 text-[12px] font-medium text-muted-foreground whitespace-nowrap";
const td = "relative px-3 py-3 align-middle";

/** Desktop: list-view table. Mobile: grouped rows — same data, same row link. */
function confirmTarget(order: OrderRow, confirmUrl: string) {
  return {
    fullName: order.fullName,
    phone: order.phone,
    total: order.total,
    items: order.firstProduct ? [{ name: order.firstProduct, quantity: 1 }] : [],
    moreCount: order.otherProducts,
    confirmUrl,
  };
}

export function OrdersTable({ orders, storeId, storeName }: { orders: OrderRow[]; storeId: string; storeName: string }) {
  return (
    <>
      <div className="hidden md:block">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th className={`${th} ps-5`}>{tr("العميل")}</th>
              <th className={th}>{tr("الطلب")}</th>
              <th className={`${th} hidden lg:table-cell`}>{tr("المنتجات")}</th>
              <th className={`${th} hidden xl:table-cell`}>{tr("القناة")}</th>
              <th className={th}>{tr("الحالة")}</th>
              <th className={`${th} text-end`}>{tr("المبلغ")}</th>
              <th aria-hidden className="w-14 pe-4" />
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              // The order link stretches over the whole row; the status menu sits above it (z-10).
              <tr
                key={order.id}
                className="group relative transition-colors hover:bg-muted/50 has-focus-visible:bg-muted/50 [&>td]:border-t-[0.5px] [&>td]:border-border"
              >
                <td className={`${td} ps-5`}>
                  <div className="flex items-center gap-3">
                    <Avatar name={order.fullName} />
                    <div className="min-w-0">
                      <Link
                        href={orderHref(order.id)}
                        className="block max-w-48 truncate text-[15px] leading-5 after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
                      >
                        {order.fullName}
                      </Link>
                      <p className="text-[13px] leading-[18px] text-muted-foreground tabular-nums" dir="ltr">
                        {order.phone}
                      </p>
                      <Flags order={order} />
                    </div>
                  </div>
                </td>
                <td className={td}>
                  <p className="font-mono text-[13px] text-foreground/85" dir="ltr">
                    {shortId(order.id)}
                  </p>
                  <p className="text-[13px] text-muted-foreground">{dateFormat.format(order.createdAt)}</p>
                </td>
                <td className={`${td} hidden lg:table-cell`}>
                  <p className="max-w-52 truncate text-[15px]">
                    {order.firstProduct ?? "—"}
                    {order.otherProducts > 0 && (
                      <span className="text-muted-foreground"> +{nf.format(order.otherProducts)}</span>
                    )}
                  </p>
                  <p className="text-[13px] text-muted-foreground">{tr("{0} قطعة", nf.format(order.itemCount))}</p>
                </td>
                <td className={`${td} hidden xl:table-cell`}>
                  <Channel source={order.source} />
                </td>
                <td className={td}>
                  <OrderStatusSelect orderId={order.id} storeId={storeId} currentStatus={order.status} />
                </td>
                <td className={`${td} text-end`}>
                  <p className="text-[15px] font-semibold tabular-nums">{money.format(order.total / 100)}</p>
                  <p className="text-[13px] text-muted-foreground">{paymentMethodLabel(order.paymentMethod)}</p>
                </td>
                <td className={`${td} pe-4`}>
                  {order.confirmUrl ? (
                    <WhatsAppConfirmButton variant="icon" storeName={storeName} order={confirmTarget(order, order.confirmUrl)} />
                  ) : (
                    <ChevronLeft className="size-4 text-(--label-3) ltr:-scale-x-100" strokeWidth={2.4} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="apple-rows [--row-inset:68px] md:hidden">
        {orders.map((order) => (
          <li key={order.id} className="relative flex gap-3 px-4 py-3">
            <Avatar name={order.fullName} />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={orderHref(order.id)}
                    className="block truncate text-[15px] leading-5 after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
                  >
                    {order.fullName}
                  </Link>
                  <p className="text-[13px] text-muted-foreground">
                    <span className="font-mono text-[12px]" dir="ltr">
                      {shortId(order.id)}
                    </span>{" "}
                    · {dateFormat.format(order.createdAt)}
                  </p>
                  <Flags order={order} />
                </div>
                <p className="shrink-0 text-[15px] font-semibold tabular-nums">{money.format(order.total / 100)}</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <OrderStatusSelect orderId={order.id} storeId={storeId} currentStatus={order.status} />
                {order.confirmUrl ? (
                  <WhatsAppConfirmButton variant="icon" storeName={storeName} order={confirmTarget(order, order.confirmUrl)} />
                ) : (
                  <Channel source={order.source} />
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
