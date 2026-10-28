"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ShipmentStatus } from "@prisma/client";
import {
  Banknote,
  Check,
  ChevronsUpDown,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CarrierMark } from "@/components/shipping/carrier-mark";
import { SHIPMENT_STATUS_META, SHIPMENT_TRACK, type ShipmentEvent } from "@/lib/shipping/shipment-status";
import { cn } from "@/lib/utils";
import { CopyButton } from "./copy-button";
import { Card, Dot, Tag, appleButton, toneDotClass } from "@/components/saas-page";
import { lazyIntl, tdir, tr, trv } from "@/lib/i18n/dashboard";

export type ShipCarrierOption = {
  key: string;
  name: string;
  isApi: boolean;
  cod: boolean;
  defaultWeightKg: number | null;
  /** Areas to pick from when the carrier needs one (Mylerz in Cairo/Giza). */
  zones?: { code: string; name: string }[];
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

/** Filled, borderless text field (HIG). */
const field = "h-11 rounded-xl border-0 bg-background text-[15px] shadow-none focus-visible:ring-2 focus-visible:ring-primary/35";
const small = cn(appleButton.tinted, "h-8 px-3 text-[13px]");

function Shell({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Card id="shipment" title={tr("الشحن")} icon={Truck} action={action}>
      {children}
    </Card>
  );
}

/* ── No carrier connected ──────────────────────────────────────────────── */

function NoCarriers() {
  return (
    <Shell>
      <div className="mx-5 mb-5 flex flex-col items-start gap-3 rounded-2xl bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[15px] leading-6 text-muted-foreground">
          {tr("اربط شركة شحن — أو مندوبك — عشان تشحن الطلب من هنا وتتابع حالته وتحصيله.")}
        </p>
        <Link href="/shipping/integrations" className={cn(appleButton.tinted, "bg-card text-primary")}>
          {tr("اربط شركة شحن")}
        </Link>
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
          <legend className="mb-2 px-1 text-[13px] text-muted-foreground">
            {tr("اشحن مع")}{destination ? tr(" · رايح {0}", destination) : ""}
          </legend>
          <div role="radiogroup" className="apple-rows overflow-hidden rounded-2xl bg-background [--row-inset:60px]">
            {carriers.map((c) => {
              const active = c.key === selected;
              return (
                <button
                  key={c.key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSelected(c.key)}
                  className="flex min-h-14 w-full items-center gap-3 px-3 py-2 text-start transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none active:bg-muted"
                >
                  <CarrierMark carrier={c.key} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] leading-5">{c.name}</span>
                    <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
                      {c.isApi ? <Zap className="size-3" /> : <PenLine className="size-3" />}
                      {c.isApi ? tr("بوليصة تلقائية") : tr("تسجيل يدوي")}
                    </span>
                  </span>
                  <Check aria-hidden className={cn("size-5 shrink-0 text-primary", !active && "invisible")} strokeWidth={2.4} />
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          {carrier.zones && carrier.zones.length > 0 && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="px-1 text-[13px] font-normal text-muted-foreground" htmlFor="zone">
                {tr("المنطقة")}
                <span className="text-destructive"> *</span>
              </Label>
              <select key={`${carrier.key}-zone`} id="zone" name="zone" required defaultValue="" className={cn(field, "w-full px-3 outline-none")}>
                <option value="" disabled>
                  {tr("اختار منطقة العميل")}
                </option>
                {carrier.zones.map((z) => (
                  <option key={z.code} value={z.code}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!carrier.isApi && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="px-1 text-[13px] font-normal text-muted-foreground" htmlFor="trackingNumber">
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
                className={cn(field, "font-mono placeholder:font-sans")}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="px-1 text-[13px] font-normal text-muted-foreground" htmlFor="codAmount">{tr("التحصيل من العميل (ج.م)")}</Label>
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
              className={cn(field, "tabular-nums")}
            />
            <p className="px-1 text-[12px] text-muted-foreground">
              {!carrier.cod ? tr("{0} مابتحصّلش عند الاستلام", carrier.name) : defaultCod > 0 ? tr("إجمالي الطلب — الدفع عند الاستلام") : tr("الطلب مدفوع، مفيش تحصيل")}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="px-1 text-[13px] font-normal text-muted-foreground" htmlFor="weightKg">{tr("الوزن (كجم)")}</Label>
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
              className={cn(field, "tabular-nums")}
            />
          </div>

          {!carrier.isApi && (
            <div className="space-y-1.5">
              <Label className="px-1 text-[13px] font-normal text-muted-foreground" htmlFor="cost">{tr("تكلفة الشحن عليك (ج.م)")}</Label>
              <Input id="cost" name="cost" type="number" min="0" step="0.5" inputMode="decimal" placeholder={tr("اختياري")} className={cn(field, "tabular-nums")} />
            </div>
          )}

          <div className={cn("space-y-1.5", carrier.isApi && "sm:col-span-2")}>
            <Label className="px-1 text-[13px] font-normal text-muted-foreground" htmlFor="notes">{tr("ملاحظة للمندوب")}</Label>
            <Input id="notes" name="notes" maxLength={500} placeholder={tr("مثال: اتصل قبلها بساعة")} className={field} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-1">
          <button type="submit" disabled={isPending} className={appleButton.filled}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : carrier.isApi ? <Zap className="size-4" /> : <Truck className="size-4" />}
            {carrier.isApi ? tr("اعمل البوليصة على {0}", carrier.name) : tr("سجّل الشحنة")}
          </button>
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
                "block h-1 rounded-full transition-colors duration-300 ease-(--ease-apple)",
                done ? (status === "DELIVERED" ? "bg-(--sys-green)" : "bg-primary") : "bg-muted",
              )}
            />
            <span
              className={cn(
                "block truncate text-[12px]",
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
            <button type="button" className={small} disabled={isPending}>
              <Dot tone={meta.tone} />
              {tr("غيّر الحالة")}
              <ChevronsUpDown className="size-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5">
            <DropdownMenuLabel className="text-[12px] font-normal text-muted-foreground">{tr("حالة الشحنة")}</DropdownMenuLabel>
            {MANUAL_STATUSES.map((s) => (
              <DropdownMenuItem
                key={s}
                disabled={s === shipment.status}
                onSelect={() => run(() => UpdateShipmentStatusAction(shipment.id, s))}
                className="h-9 gap-2.5 rounded-lg text-[15px]"
              >
                <Check className={cn("size-4 text-primary", s !== shipment.status && "invisible")} strokeWidth={2.4} />
                <span className="flex-1">{SHIPMENT_STATUS_META[s].label}</span>
                <Dot tone={SHIPMENT_STATUS_META[s].tone} />
              </DropdownMenuItem>
            ))}
            {!closed && (
              <DropdownMenuItem variant="destructive" onSelect={() => setConfirmCancel("carrier")} className="h-9 gap-2.5 rounded-lg text-[15px]">
                <XCircle className="size-4" />
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
              <p className="text-[17px] leading-[22px] font-semibold">{shipment.courierName}</p>
              <Tag tone={meta.tone}>{meta.label}</Tag>
            </div>
            {shipment.trackingNumber ? (
              <p className="inline-flex items-center gap-0.5 text-[13px] text-muted-foreground">
                <span className="font-mono" dir="ltr">
                  {shipment.trackingNumber}
                </span>
                <CopyButton value={shipment.trackingNumber} label={tr("رقم التتبع")} className="size-7" />
              </p>
            ) : (
              <p className="text-[13px] text-muted-foreground">{tr("من غير رقم تتبع")}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {shipment.labelUrl && (
              <a href={shipment.labelUrl} target="_blank" rel="noreferrer" className={small}>
                <Printer className="size-3.5" />
                {tr("البوليصة")}
              </a>
            )}
            {shipment.trackingUrl && (
              <a href={shipment.trackingUrl} target="_blank" rel="noreferrer" className={small}>
                <ExternalLink className="size-3.5" />
                {tr("تتبّع")}
              </a>
            )}
            {shipment.isApi && (
              <button
                type="button"
                className={small}
                disabled={isPending}
                onClick={() => run(() => SyncShipmentAction(shipment.id))}
              >
                <RefreshCw className={cn("size-3.5", isPending && "animate-spin")} />
                {tr("تحديث")}
              </button>
            )}
          </div>
        </div>

        {/* Progress */}
        {SHIPMENT_TRACK.includes(shipment.status) ? (
          <Track status={shipment.status} />
        ) : (
          <p
            className={cn(
              "rounded-xl px-3.5 py-2.5 text-[13px] leading-5",
              shipment.status === "RETURNED" ? "bg-(--sys-red)/12" : "bg-(--sys-orange)/12",
            )}
          >
            {shipment.status === "RETURNED"
              ? tr("الشحنة رجعت — الطلب اتسجّل مرتجع والمخزون رجع.")
              : tr("المندوب ماقدرش يسلّم. كلّم العميل وحدّث الحالة لما يتسلّم أو يرجع.")}
          </p>
        )}

        {/* Money */}
        <dl className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl bg-background px-3.5 py-2.5">
            <dt className="text-[12px] text-muted-foreground">{tr("التحصيل")}</dt>
            <dd className="text-[17px] leading-6 font-semibold tabular-nums">{codDue ? money.format(shipment.codAmount / 100) : tr("مدفوع مسبقًا")}</dd>
          </div>
          <div className="rounded-xl bg-background px-3.5 py-2.5">
            <dt className="text-[12px] text-muted-foreground">{tr("تكلفة الشحن")}</dt>
            <dd className="text-[17px] leading-6 font-semibold tabular-nums">{shipment.cost !== null ? money.format(shipment.cost / 100) : "—"}</dd>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-xl bg-background px-3.5 py-2.5">
            <div>
              <dt className="text-[12px] text-muted-foreground">{tr("فلوس التحصيل")}</dt>
              <dd className="text-[17px] leading-6 font-semibold">
                {!codDue ? (
                  "—"
                ) : shipment.codCollectedAt ? (
                  <span className="inline-flex items-center gap-1.5"><Dot tone="success" />{tr("وصلتك")}</span>
                ) : shipment.status === "DELIVERED" ? (
                  <span className="inline-flex items-center gap-1.5"><Dot tone="warning" />{tr("عند الشركة")}</span>
                ) : (
                  <span className="text-muted-foreground">{tr("لسه")}</span>
                )}
              </dd>
            </div>
            {codDue && shipment.status === "DELIVERED" && (
              <button
                type="button"
                className={cn(small, "bg-card", shipment.codCollectedAt ? "text-muted-foreground" : "text-primary")}
                disabled={isPending}
                onClick={() => run(() => MarkCodCollectedAction([shipment.id], !shipment.codCollectedAt))}
              >
                <Banknote className="size-3.5" />
                {shipment.codCollectedAt ? tr("تراجع") : tr("استلمتها")}
              </button>
            )}
          </div>
        </dl>

        {/* Timeline */}
        {events.length > 0 && (
          <div>
            <p className="mb-3 flex items-center justify-between px-1 text-[13px] text-muted-foreground">
              <span>{tr("سجل الشحنة")}</span>
              {shipment.lastSyncedAt && <span>{tr("آخر تحديث {0}", when.format(new Date(shipment.lastSyncedAt)))}</span>}
            </p>
            <ol className="relative ms-1 space-y-3.5 border-s-2 border-muted ps-4">
              {events.slice(0, 8).map((e, i) => (
                <li key={`${e.at}-${i}`} className="relative">
                  <span
                    aria-hidden
                    className={cn(
                      "absolute -start-[1.4rem] top-1.5 size-2.5 rounded-full ring-4 ring-card",
                      i === 0 ? toneDotClass(SHIPMENT_STATUS_META[e.status]?.tone ?? "neutral") : "bg-(--label-3)",
                    )}
                  />
                  <p className="text-[15px] leading-5">
                    <span className="font-semibold">{SHIPMENT_STATUS_META[e.status]?.label ?? e.status}</span>
                    {e.note && <span className="text-muted-foreground"> — {e.note}</span>}
                  </p>
                  <p className="text-[12px] text-muted-foreground">
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
        <AlertDialogContent dir={tdir()} className="rounded-[22px]">
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
            <AlertDialogCancel className="rounded-full">{tr("رجوع")}</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-(--sys-red) text-white hover:bg-(--sys-red)/90"
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
