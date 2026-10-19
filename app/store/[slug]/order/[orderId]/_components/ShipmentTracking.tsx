import type { ShipmentStatus } from "@prisma/client";
import { Banknote, ExternalLink, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SHIPMENT_STATUS_META, SHIPMENT_TRACK, readShipmentEvents } from "@/lib/shipping/shipment-status";
import { cn } from "@/lib/utils";

const when = new Intl.DateTimeFormat("ar-EG", {
  timeZone: "Africa/Cairo",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});
const money = new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 2 });

/**
 * Customer-facing shipment tracking, hosted by Casho for every carrier. Shows
 * the carrier's own scans and status changes, never the merchant's notes.
 */
export function ShipmentTracking({
  shipment,
}: {
  shipment: {
    courierName: string | null;
    trackingNumber: string | null;
    trackingUrl: string | null;
    status: ShipmentStatus;
    codAmount: number | null;
    estimatedDelivery: Date | null;
    events: unknown;
  };
}) {
  const meta = SHIPMENT_STATUS_META[shipment.status];
  const current = SHIPMENT_TRACK.indexOf(shipment.status);
  const events = readShipmentEvents(shipment.events)
    .map((e) => ({ ...e, note: e.source === "carrier" ? e.note : undefined }))
    .reverse()
    .slice(0, 6);
  const codDue = (shipment.codAmount ?? 0) > 0 && shipment.status !== "DELIVERED";

  return (
    <Card className="rounded-[28px]">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Truck className="size-5 text-primary" />
          تتبّع الشحنة
        </CardTitle>
        <CardDescription>
          {shipment.courierName ? `طلبك مع ${shipment.courierName}` : "طلبك اتشحن"}
          {shipment.trackingNumber && (
            <>
              {" · رقم الشحنة "}
              <span className="font-mono" dir="ltr">
                {shipment.trackingNumber}
              </span>
            </>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex flex-col gap-3 rounded-xl border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">{meta.customerLabel}</p>
            {shipment.estimatedDelivery && shipment.status !== "DELIVERED" && (
              <p className="text-sm text-muted-foreground">متوقع يوصل {when.format(shipment.estimatedDelivery)}</p>
            )}
          </div>
          {shipment.trackingUrl && (
            <Button asChild variant="outline" className="rounded-xl">
              <a href={shipment.trackingUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
                تتبّع على موقع الشركة
              </a>
            </Button>
          )}
        </div>

        {current !== -1 && (
          <ol className="grid grid-cols-5 gap-2" aria-label="مراحل الشحنة">
            {SHIPMENT_TRACK.map((step, i) => (
              <li key={step} className="space-y-2">
                <span className={cn("block h-1.5 rounded-full", i <= current ? "bg-primary" : "bg-muted")} />
                <span className={cn("block text-[0.6875rem] leading-4 sm:text-xs", i === current ? "font-semibold" : "text-muted-foreground")}>
                  {SHIPMENT_STATUS_META[step].label}
                </span>
              </li>
            ))}
          </ol>
        )}

        {codDue && (
          <p className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
            <Banknote className="size-4 shrink-0" />
            جهّز {money.format(shipment.codAmount! / 100)} للمندوب عند الاستلام.
          </p>
        )}

        {events.length > 0 && (
          <ol className="relative space-y-4 border-s ps-5">
            {events.map((e, i) => (
              <li key={`${e.at}-${i}`} className="relative">
                <span
                  aria-hidden
                  className={cn(
                    "absolute -start-[1.6rem] top-1.5 size-2.5 rounded-full ring-4 ring-card",
                    i === 0 ? "bg-primary" : "bg-muted-foreground/30",
                  )}
                />
                <p className="text-sm font-medium">{e.note || SHIPMENT_STATUS_META[e.status]?.customerLabel}</p>
                <p className="text-xs text-muted-foreground">
                  {when.format(new Date(e.at))}
                  {e.location && ` · ${e.location}`}
                </p>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
