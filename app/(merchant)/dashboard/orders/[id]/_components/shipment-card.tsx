"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ShipmentStatus } from "@prisma/client";
import {
  Banknote,
  Check,
  ChevronDown,
  ExternalLink,
  Loader2,
  PenLine,
  Printer,
  RefreshCw,
  Truck,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import {
  CancelShipmentAction,
  CreateShipmentAction,
  MarkCodCollectedAction,
  SyncShipmentAction,
  UpdateShipmentStatusAction,
} from "@/actions/store/shipments.actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusPill, toneDot } from "@/components/saas-page";
import { CarrierMark } from "@/components/shipping/carrier-mark";
import { SHIPMENT_STATUS_META, SHIPMENT_TRACK, type ShipmentEvent } from "@/lib/shipping/shipment-status";
import { cn } from "@/lib/utils";
import { CopyButton } from "./copy-button";
import { lazyIntl, tdir, tr, trv } from "@/lib/i18n/dashboard";

export type ShipCarrierOption = {
  key: string;
  name: string;
  isApi: boolean;
  cod: boolean;
  defaultWeightKg: number | null;
};

export type ShipmentView = {
  id: string;
  provider: string;
  courierName: string;
  isApi: boolean;
  status: ShipmentStatus;
  trackingNumber: string | null;
  trackingUrl: string | null;
  labelUrl: string | null;
  codAmount: number;
  codCollectedAt: string | null;
  cost: number | null;
  weightKg: number | null;
  events: ShipmentEvent[];
  lastSyncedAt: string | null;
};

const money = lazyIntl.number({ style: "currency", currency: "EGP", maximumFractionDigits: 2 });
const when = lazyIntl.date({
  timeZone: "Africa/Cairo",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

const MANUAL_STATUSES: ShipmentStatus[] = [
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "FAILED_DELIVERY",
  "RETURNED",
];

function Shell({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section aria-labelledby="shipment-title" className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-2 px-5 pt-4 pb-3">
        <h2 id="shipment-title" className="inline-flex items-center gap-2 text-sm font-semibold">
          <Truck className="size-4 text-muted-foreground" />
          {tr("الشحن")}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/* ── No carrier connected ──────────────────────────────────────────────── */

function NoCarriers() {
  return (
    <Shell>
      <div className="mx-5 mb-5 flex flex-col items-start gap-3 rounded-lg border border-dashed border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-muted-foreground">
          {tr("اربط شركة شحن — أو مندوبك — عشان تشحن الطلب من هنا وتتابع حالته وتحصيله.")}
        </p>
        <Button asChild size="sm" variant="outline" className="shrink-0">
          <Link href="/shipping/integrations">{tr("اربط شركة شحن")}</Link>
        </Button>
      </div>
    </Shell>
  );
}

/* ── Create shipment ───────────────────────────────────────────────────── */

function ShipForm({
  orderId,
  carriers,
  defaultCod,
  destination,
}: {
  orderId: string;
  carriers: ShipCarrierOption[];
  defaultCod: number;
  destination: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState(carriers[0]!.key);
  const carrier = carriers.find((c) => c.key === selected) ?? carriers[0]!;
  const needsTracking = !carrier.isApi && carrier.key !== "OWN_COURIER";

  function submit(fd: FormData) {
    fd.set("carrier", carrier.key);
    startTransition(async () => {
      const res = await CreateShipmentAction(orderId, fd);
      if (!res.success) {
        toast.error(trv(res.message));
        return;
      }
      toast.success(trv(res.message));
      router.refresh();
    });
  }

  return (
    <Shell>
      <form action={submit} className="space-y-5 px-5 pb-5">
        <fieldset>
          <legend className="mb-2 text-xs font-medium text-muted-foreground">
            {tr("اشحن مع")}{destination ? tr(" · رايح {0}", destination) : ""}
          </legend>
          <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
            {carriers.map((c) => {
              const active = c.key === selected;
              return (
                <button
                  key={c.key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSelected(c.key)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-2.5 text-start transition-colors",
                    active ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:bg-muted/50",
                  )}
                >
                  <CarrierMark carrier={c.key} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{c.name}</span>
                    <span className="inline-flex items-center gap-1 text-[0.6875rem] text-muted-foreground">
                      {c.isApi ? <Zap className="size-3" /> : <PenLine className="size-3" />}
                      {c.isApi ? tr("بوليصة تلقائية") : tr("تسجيل يدوي")}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      "grid size-4 shrink-0 place-items-center rounded-full border",
                      active ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30",
                    )}
                  >
                    {active && <Check className="size-3" />}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          {!carrier.isApi && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="trackingNumber">
                {needsTracking ? tr("رقم البوليصة") : tr("رقم داخلي (اختياري)")}
                {needsTracking && <span className="text-destructive"> *</span>}
              </Label>
              <Input
                id="trackingNumber"
                name="trackingNumber"
                dir="ltr"
                required={needsTracking}
                maxLength={64}
                placeholder={needsTracking ? tr("الرقم اللي {0} اديتهولك", carrier.name) : tr("مثال: 0425")}
                className="font-mono placeholder:font-sans"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="codAmount">{tr("التحصيل من العميل (ج.م)")}</Label>
            <Input
              id="codAmount"
              name="codAmount"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              key={`${carrier.key}-cod`}
              defaultValue={carrier.cod ? (defaultCod / 100).toString() : "0"}
              disabled={!carrier.cod}
              className="tabular-nums"
            />
            <p className="text-xs text-muted-foreground">
              {!carrier.cod ? tr("{0} مابتحصّلش عند الاستلام", carrier.name) : defaultCod > 0 ? tr("إجمالي الطلب — الدفع عند الاستلام") : tr("الطلب مدفوع، مفيش تحصيل")}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="weightKg">{tr("الوزن (كجم)")}</Label>
            <Input
              id="weightKg"
              name="weightKg"
              type="number"
              min="0.1"
              max="100"
              step="0.1"
              inputMode="decimal"
              key={`${carrier.key}-weight`}
              defaultValue={carrier.defaultWeightKg ?? 1}
              className="tabular-nums"
            />
          </div>

          {!carrier.isApi && (
            <div className="space-y-1.5">
              <Label htmlFor="cost">{tr("تكلفة الشحن عليك (ج.م)")}</Label>
              <Input id="cost" name="cost" type="number" min="0" step="0.5" inputMode="decimal" placeholder={tr("اختياري")} className="tabular-nums" />
            </div>
          )}

          <div className={cn("space-y-1.5", carrier.isApi && "sm:col-span-2")}>
            <Label htmlFor="notes">{tr("ملاحظة للمندوب")}</Label>
            <Input id="notes" name="notes" maxLength={500} placeholder={tr("مثال: اتصل قبلها بساعة")} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="submit" disabled={isPending} className="gap-1.5">
            {isPending ? <Loader2 className="size-4 animate-spin" /> : carrier.isApi ? <Zap className="size-4" /> : <Truck className="size-4" />}
            {carrier.isApi ? tr("اعمل البوليصة على {0}", carrier.name) : tr("سجّل الشحنة")}
          </Button>
        </div>
      </form>
    </Shell>
  );
}

/* ── Existing shipment ─────────────────────────────────────────────────── */

function Track({ status }: { status: ShipmentStatus }) {
  const current = SHIPMENT_TRACK.indexOf(status);
  const offTrack = current === -1;
  return (
    <ol className="grid grid-cols-5 gap-1.5" aria-label={tr("مراحل الشحنة")}>
      {SHIPMENT_TRACK.map((step, i) => {
        const done = !offTrack && i <= current;
        return (
          <li key={step} className="space-y-1.5">
            <span
              className={cn(
                "block h-1.5 rounded-full",
                done ? (status === "DELIVERED" ? "bg-emerald-500" : "bg-primary") : "bg-muted",
              )}
            />
            <span
              className={cn(
                "block truncate text-[0.6875rem]",
                i === current ? "font-semibold text-foreground" : "text-muted-foreground",
              )}
            >
              {SHIPMENT_STATUS_META[step].label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function ShipmentDetails({ shipment }: { shipment: ShipmentView }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmCancel, setConfirmCancel] = useState<null | "carrier" | "local">(null);
  const meta = SHIPMENT_STATUS_META[shipment.status];
  const closed = shipment.status === "DELIVERED" || shipment.status === "RETURNED";
  const codDue = shipment.codAmount > 0;

  function run(task: () => Promise<{ success: boolean; message: string; canCancelLocally?: boolean }>) {
    startTransition(async () => {
      const res = await task();
      if (!res.success) {
        if (res.canCancelLocally) setConfirmCancel("local");
        toast.error(trv(res.message));
        return;
      }
      toast.success(trv(res.message));
      router.refresh();
    });
  }

  const events = [...shipment.events].reverse();

  return (
    <Shell
      action={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5" disabled={isPending}>
              <span aria-hidden className={cn("size-1.5 rounded-full", toneDot(meta.tone))} />
              {tr("غيّر الحالة")}
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs text-muted-foreground">{tr("حالة الشحنة")}</DropdownMenuLabel>
            {MANUAL_STATUSES.map((s) => (
              <DropdownMenuItem
                key={s}
                disabled={s === shipment.status}
                onSelect={() => run(() => UpdateShipmentStatusAction(shipment.id, s))}
                className="gap-2"
              >
                <span aria-hidden className={cn("size-1.5 rounded-full", toneDot(SHIPMENT_STATUS_META[s].tone))} />
                {SHIPMENT_STATUS_META[s].label}
                {s === shipment.status && <Check className="ms-auto size-3.5" />}
              </DropdownMenuItem>
            ))}
            {!closed && (
              <DropdownMenuItem onSelect={() => setConfirmCancel("carrier")} className="gap-2 text-destructive focus:text-destructive">
                <XCircle className="size-3.5" />
                {tr("إلغاء الشحنة")}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      }
    >
      <div className="space-y-5 px-5 pb-5">
        {/* Carrier + tracking */}
        <div className="flex flex-wrap items-center gap-3">
          <CarrierMark carrier={shipment.provider} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">{shipment.courierName}</p>
              <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
            </div>
            {shipment.trackingNumber ? (
              <p className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                <span className="font-mono" dir="ltr">
                  {shipment.trackingNumber}
                </span>
                <CopyButton value={shipment.trackingNumber} label={tr("رقم التتبع")} className="size-6" />
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">{tr("من غير رقم تتبع")}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {shipment.labelUrl && (
              <Button asChild variant="outline" size="sm" className="h-8 gap-1.5">
                <a href={shipment.labelUrl} target="_blank" rel="noreferrer">
                  <Printer className="size-3.5" />
                  {tr("البوليصة")}
                </a>
              </Button>
            )}
            {shipment.trackingUrl && (
              <Button asChild variant="outline" size="sm" className="h-8 gap-1.5">
                <a href={shipment.trackingUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-3.5" />
                  {tr("تتبّع")}
                </a>
              </Button>
            )}
            {shipment.isApi && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5"
                disabled={isPending}
                onClick={() => run(() => SyncShipmentAction(shipment.id))}
              >
                <RefreshCw className={cn("size-3.5", isPending && "animate-spin")} />
                {tr("تحديث")}
              </Button>
            )}
          </div>
        </div>

        {/* Progress */}
        {SHIPMENT_TRACK.includes(shipment.status) ? (
          <Track status={shipment.status} />
        ) : (
          <p
            className={cn(
              "rounded-lg px-3 py-2 text-sm",
              shipment.status === "RETURNED" ? "bg-rose-500/10 text-rose-700 dark:text-rose-400" : "bg-amber-500/10 text-amber-700 dark:text-amber-400",
            )}
          >
            {shipment.status === "RETURNED"
              ? tr("الشحنة رجعت — الطلب اتسجّل مرتجع والمخزون رجع.")
              : tr("المندوب ماقدرش يسلّم. كلّم العميل وحدّث الحالة لما يتسلّم أو يرجع.")}
          </p>
        )}

        {/* Money */}
        <dl className="grid gap-px overflow-hidden rounded-lg border border-border bg-border text-sm sm:grid-cols-3">
          <div className="bg-card px-3 py-2.5">
            <dt className="text-xs text-muted-foreground">{tr("التحصيل")}</dt>
            <dd className="font-semibold tabular-nums">{codDue ? money.format(shipment.codAmount / 100) : tr("مدفوع مسبقًا")}</dd>
          </div>
          <div className="bg-card px-3 py-2.5">
            <dt className="text-xs text-muted-foreground">{tr("تكلفة الشحن")}</dt>
            <dd className="font-semibold tabular-nums">{shipment.cost !== null ? money.format(shipment.cost / 100) : "—"}</dd>
          </div>
          <div className="flex items-center justify-between gap-2 bg-card px-3 py-2.5">
            <div>
              <dt className="text-xs text-muted-foreground">{tr("فلوس التحصيل")}</dt>
              <dd className="font-medium">
                {!codDue ? (
                  "—"
                ) : shipment.codCollectedAt ? (
                  <span className="text-emerald-700 dark:text-emerald-400">{tr("وصلتك")}</span>
                ) : shipment.status === "DELIVERED" ? (
                  <span className="text-amber-700 dark:text-amber-400">{tr("عند الشركة")}</span>
                ) : (
                  <span className="text-muted-foreground">{tr("لسه")}</span>
                )}
              </dd>
            </div>
            {codDue && shipment.status === "DELIVERED" && (
              <Button
                variant={shipment.codCollectedAt ? "ghost" : "outline"}
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                disabled={isPending}
                onClick={() => run(() => MarkCodCollectedAction([shipment.id], !shipment.codCollectedAt))}
              >
                <Banknote className="size-3.5" />
                {shipment.codCollectedAt ? tr("تراجع") : tr("استلمتها")}
              </Button>
            )}
          </div>
        </dl>

        {/* Timeline */}
        {events.length > 0 && (
          <div>
            <p className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>{tr("سجل الشحنة")}</span>
              {shipment.lastSyncedAt && <span>{tr("آخر تحديث {0}", when.format(new Date(shipment.lastSyncedAt)))}</span>}
            </p>
            <ol className="relative space-y-3 border-s border-border ps-4">
              {events.slice(0, 8).map((e, i) => (
                <li key={`${e.at}-${i}`} className="relative">
                  <span
                    aria-hidden
                    className={cn(
                      "absolute -start-[1.3rem] top-1.5 size-2 rounded-full ring-4 ring-card",
                      i === 0 ? toneDot(SHIPMENT_STATUS_META[e.status]?.tone ?? "neutral") : "bg-muted-foreground/40",
                    )}
                  />
                  <p className="text-sm">
                    <span className="font-medium">{SHIPMENT_STATUS_META[e.status]?.label ?? e.status}</span>
                    {e.note && <span className="text-muted-foreground"> — {e.note}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {when.format(new Date(e.at))}
                    {e.location && ` · ${e.location}`}
                    {e.source === "carrier" && tr(" · من الشركة")}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <AlertDialog open={confirmCancel !== null} onOpenChange={(open) => !open && setConfirmCancel(null)}>
        <AlertDialogContent dir={tdir()}>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmCancel === "local" ? tr("تلغيها في كاشو بس؟") : tr("تلغي الشحنة؟")}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmCancel === "local"
                ? tr("اتأكد إنك لغيتها من حسابك في {0}. هنا هتتسجّل ملغية وتقدر تشحن الطلب تاني.", shipment.courierName)
                : shipment.isApi
                  ? tr("هنطلب من {0} تلغي البوليصة، والطلب يرجع جاهز للشحن.", shipment.courierName)
                  : tr("الشحنة هتتسجّل ملغية — بلّغ {0} بنفسك. الطلب يرجع جاهز للشحن.", shipment.courierName)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tr("رجوع")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                const localOnly = confirmCancel === "local";
                setConfirmCancel(null);
                run(() => CancelShipmentAction(shipment.id, { localOnly }));
              }}
            >
              {tr("إلغاء الشحنة")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Shell>
  );
}

/* ── Entry ─────────────────────────────────────────────────────────────── */

export function ShipmentCard({
  orderId,
  orderCanceled,
  carriers,
  shipment,
  defaultCod,
  destination,
}: {
  orderId: string;
  orderCanceled: boolean;
  carriers: ShipCarrierOption[];
  shipment: ShipmentView | null;
  /** Piasters to collect by default (unpaid cash orders). */
  defaultCod: number;
  destination: string | null;
}) {
  if (shipment) return <ShipmentDetails shipment={shipment} />;
  if (orderCanceled) return null;
  if (carriers.length === 0) return <NoCarriers />;
  return <ShipForm orderId={orderId} carriers={carriers} defaultCod={defaultCod} destination={destination} />;
}
