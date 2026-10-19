import Link from "next/link";
import type { ShipmentStatus } from "@prisma/client";
import { ExternalLink } from "lucide-react";

import { StatusPill } from "@/components/saas-page";
import { CarrierMark } from "@/components/shipping/carrier-mark";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  if (!row.codAmount) return <span className="text-sm text-muted-foreground">{tr("مدفوع")}</span>;
  const due = isCodOutstanding({ status: row.status, codAmount: row.codAmount, codCollectedAt: row.codCollectedAt });
  return (
    <div className="flex items-center justify-end gap-2">
      <div className="text-end">
        <p className="text-sm font-medium tabular-nums">{money.format(row.codAmount / 100)}</p>
        <p className="text-xs">
          {row.codCollectedAt ? (
            <span className="text-emerald-700 dark:text-emerald-400">{tr("وصلتك")}</span>
          ) : due ? (
            <span className="text-amber-700 dark:text-amber-400">{tr("عند الشركة")}</span>
          ) : (
            <span className="text-muted-foreground">{tr("لسه")}</span>
          )}
        </p>
      </div>
      {due && <CollectButton id={row.id} />}
    </div>
  );
}

function Tracking({ row }: { row: ShipmentRow }) {
  if (!row.trackingNumber) return <span className="text-xs text-muted-foreground">{tr("من غير رقم")}</span>;
  return (
    <span className="inline-flex items-center gap-1">
      <span className="font-mono text-xs text-muted-foreground" dir="ltr">
        {row.trackingNumber}
      </span>
      {row.trackingUrl && (
        <a
          href={row.trackingUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={tr("صفحة التتبع")}
          className="relative z-10 text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="size-3.5" />
        </a>
      )}
    </span>
  );
}

export function ShipmentsTable({ rows }: { rows: ShipmentRow[] }) {
  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="h-10 ps-4 text-xs font-medium text-muted-foreground">{tr("الشحنة")}</TableHead>
              <TableHead className="h-10 text-xs font-medium text-muted-foreground">{tr("العميل")}</TableHead>
              <TableHead className="hidden h-10 text-xs font-medium text-muted-foreground lg:table-cell">{tr("المحافظة")}</TableHead>
              <TableHead className="h-10 text-xs font-medium text-muted-foreground">{tr("الحالة")}</TableHead>
              <TableHead className="hidden h-10 text-xs font-medium text-muted-foreground xl:table-cell">{tr("التاريخ")}</TableHead>
              <TableHead className="h-10 pe-4 text-end text-xs font-medium text-muted-foreground">{tr("التحصيل")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const href = rowHref(row);
              const meta = SHIPMENT_STATUS_META[row.status];
              return (
                <TableRow key={row.id} className="relative">
                  <TableCell className="ps-4 py-3">
                    <div className="flex items-center gap-3">
                      <CarrierMark carrier={row.provider} size="sm" />
                      <div className="min-w-0">
                        {href ? (
                          <Link href={href} className="block truncate text-sm font-medium after:absolute after:inset-0 hover:underline">
                            {row.courierName}
                          </Link>
                        ) : (
                          <p className="truncate text-sm font-medium">{row.courierName}</p>
                        )}
                        <Tracking row={row} />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-sm">{row.customer ?? "—"}</TableCell>
                  <TableCell className="hidden py-3 text-sm text-muted-foreground lg:table-cell">{row.destination ?? "—"}</TableCell>
                  <TableCell className="py-3">
                    <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                  </TableCell>
                  <TableCell className="hidden py-3 text-sm text-muted-foreground xl:table-cell">
                    {dateFormat.format(row.createdAt)}
                  </TableCell>
                  <TableCell className="pe-4 py-3">
                    <Cod row={row} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile */}
      <ul className="divide-y divide-border md:hidden">
        {rows.map((row) => {
          const href = rowHref(row);
          const meta = SHIPMENT_STATUS_META[row.status];
          return (
            <li key={row.id} className="relative space-y-2 px-4 py-3">
              <div className="flex items-center gap-3">
                <CarrierMark carrier={row.provider} size="sm" />
                <div className="min-w-0 flex-1">
                  {href ? (
                    <Link href={href} className="block truncate text-sm font-medium after:absolute after:inset-0">
                      {row.customer ?? row.courierName}
                    </Link>
                  ) : (
                    <p className="truncate text-sm font-medium">{row.customer ?? row.courierName}</p>
                  )}
                  <p className="truncate text-xs text-muted-foreground">
                    {row.courierName}
                    {row.destination && ` · ${row.destination}`} · {dateFormat.format(row.createdAt)}
                  </p>
                </div>
                <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
              </div>
              <div className="flex items-center justify-between gap-2">
                <Tracking row={row} />
                <Cod row={row} />
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
