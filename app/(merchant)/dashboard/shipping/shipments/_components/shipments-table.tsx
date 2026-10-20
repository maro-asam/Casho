import Link from "next/link";
import type { ShipmentStatus } from "@prisma/client";
import { ExternalLink } from "lucide-react";

import { StatusText } from "@/components/saas-page";
import { CarrierMark } from "@/components/shipping/carrier-mark";
import { SHIPMENT_STATUS_META, isCodOutstanding } from "@/lib/shipping/shipment-status";
import { CollectButton } from "./cod-buttons";
import { lazyIntl, tr } from "@/lib/i18n/dashboard";

export type ShipmentRow = {
  id: string;
  orderId: string | null;
  provider: string;
  courierName: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  status: ShipmentStatus;
  codAmount: number | null;
  codCollectedAt: Date | null;
  customer: string | null;
  destination: string | null;
  createdAt: Date;
};

const money = lazyIntl.number({ style: "currency", currency: "EGP", maximumFractionDigits: 0 });
const dateFormat = lazyIntl.date({ timeZone: "Africa/Cairo", day: "numeric", month: "short" });

const rowHref = (row: ShipmentRow) => (row.orderId ? `/orders/${row.orderId}` : null);

function Cod({ row }: { row: ShipmentRow }) {
  if (!row.codAmount) return <span className="text-[13px] text-muted-foreground">{tr("مدفوع")}</span>;
  const due = isCodOutstanding({ status: row.status, codAmount: row.codAmount, codCollectedAt: row.codCollectedAt });
  return (
    <div className="flex items-center justify-end gap-2">
      {due && <CollectButton id={row.id} />}
      <div className="text-end">
        <p className="text-[15px] font-semibold tabular-nums">{money.format(row.codAmount / 100)}</p>
        <p className="text-[12px]">
          {row.codCollectedAt ? (
            <span className="text-(--sys-green)">{tr("وصلتك")}</span>
          ) : due ? (
            <span className="text-(--sys-orange)">{tr("عند الشركة")}</span>
          ) : (
            <span className="text-muted-foreground">{tr("لسه")}</span>
          )}
        </p>
      </div>
    </div>
  );
}

/** Mail-style rows: carrier mark, customer + route, status, COD trailing. */
export function ShipmentsTable({ rows }: { rows: ShipmentRow[] }) {
  return (
    <ul className="apple-rows border-t-[0.5px] border-border [--row-inset:68px]">
      {rows.map((row) => {
        const href = rowHref(row);
        const meta = SHIPMENT_STATUS_META[row.status];
        const title = row.customer ?? row.courierName;
        return (
          <li key={row.id} className="relative flex items-center gap-3 px-5 py-3 transition-colors hover:bg-(--fill-3)/40">
            <CarrierMark carrier={row.provider} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                {href ? (
                  <Link href={href} className="truncate text-[15px] font-semibold after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-ring">
                    {title}
                  </Link>
                ) : (
                  <p className="truncate text-[15px] font-semibold">{title}</p>
                )}
                <span className="shrink-0 text-[13px] text-muted-foreground">{dateFormat.format(row.createdAt)}</span>
              </div>
              <p className="truncate text-[13px] text-muted-foreground">
                {row.courierName}
                {row.destination && ` · ${row.destination}`}
                {row.trackingNumber && (
                  <>
                    {" · "}
                    <span className="font-mono" dir="ltr">
                      {row.trackingNumber}
                    </span>
                  </>
                )}
                {row.trackingUrl && (
                  <a
                    href={row.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={tr("صفحة التتبع")}
                    className="relative z-10 ms-1 inline-flex align-middle text-primary"
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                )}
              </p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <StatusText tone={meta.tone}>{meta.label}</StatusText>
                <Cod row={row} />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
