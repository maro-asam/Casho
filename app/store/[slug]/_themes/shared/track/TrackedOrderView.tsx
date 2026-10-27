"use client";

import { useState, type CSSProperties } from "react";
import Image from "next/image";
import { AlertTriangle, Banknote, Check, CheckCircle2, Copy, ExternalLink, Package, Truck, XCircle } from "lucide-react";

import type { TrackedOrder } from "@/lib/orders/tracking";
import { cn } from "@/lib/utils";
import type { TrackSkin } from "./OrderTracker";

const when = new Intl.DateTimeFormat("ar-EG", {
  timeZone: "Africa/Cairo",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});
const day = new Intl.DateTimeFormat("ar-EG", { timeZone: "Africa/Cairo", day: "numeric", month: "long", year: "numeric" });
const money = new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 2 });
const nf = new Intl.NumberFormat("ar-EG");

const TONE_ICON = { progress: Truck, attention: AlertTriangle, done: CheckCircle2, ended: XCircle } as const;

function toneColor(tone: TrackedOrder["tone"], skin: TrackSkin) {
  if (tone === "attention") return skin.warn;
  if (tone === "ended") return skin.bad;
  if (tone === "done") return skin.ok;
  return "var(--primary)";
}

/** Tinted chip: the tone color as text on a faint wash of itself. */
const chip = (color: string): CSSProperties => ({ color, background: `color-mix(in srgb, ${color} 12%, transparent)` });

function CopyNumber({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(value).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
      aria-label={copied ? "اتنسخ" : "انسخ رقم الشحنة"}
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
    </button>
  );
}

function Steps({ steps, skin }: { steps: TrackedOrder["steps"]; skin: TrackSkin }) {
  return (
    <ol className="grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }} aria-label="مراحل الطلب">
      {steps.map((step, i) => {
        const color = step.ended ? skin.bad : step.done ? "var(--primary)" : undefined;
        return (
          <li key={`${step.label}-${i}`} className="min-w-0 space-y-2" aria-current={step.current ? "step" : undefined}>
            <span className={cn("block h-1.5 rounded-full", !color && "bg-muted")} style={color ? { background: color } : undefined} />
            <span
              className={cn("block text-xs leading-5 sm:text-sm", step.current ? "font-bold" : !step.done && "text-muted-foreground")}
              style={step.ended ? { color: skin.bad } : undefined}
            >
              {step.label}
            </span>
            {step.at && <span className="block text-[0.6875rem] leading-4 text-muted-foreground">{when.format(new Date(step.at))}</span>}
          </li>
        );
      })}
    </ol>
  );
}

function Shipment({ shipment, skin }: { shipment: NonNullable<TrackedOrder["shipment"]>; skin: TrackSkin }) {
  return (
    <section className={skin.panel} aria-labelledby="track-shipment">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id="track-shipment" className="flex items-center gap-2 text-base font-bold">
            <Truck className="size-5 shrink-0" style={{ color: "var(--primary)" }} />
            الشحنة
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{shipment.courier ? `مع ${shipment.courier}` : "مع شركة الشحن"}</p>
        </div>
        {shipment.trackingUrl && (
          <a href={shipment.trackingUrl} target="_blank" rel="noreferrer" className={skin.secondary}>
            <ExternalLink />
            تتبّع على موقع الشركة
          </a>
        )}
      </div>

      {shipment.trackingNumber && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-(--store-radius) bg-muted py-2 pe-1.5 ps-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">رقم الشحنة</p>
            <p className="truncate font-mono text-[0.9375rem] font-semibold" dir="ltr">
              {shipment.trackingNumber}
            </p>
          </div>
          <CopyNumber value={shipment.trackingNumber} />
        </div>
      )}

      <div className="mt-5">
        <p className="font-semibold">{shipment.statusLabel}</p>
        {shipment.estimatedDelivery && (
          <p className="mt-0.5 text-sm text-muted-foreground">متوقع يوصل {when.format(new Date(shipment.estimatedDelivery))}</p>
        )}
      </div>

      {shipment.progress.length > 0 && (
        <ol className="mt-4 grid grid-cols-5 gap-1.5" aria-label="مراحل الشحنة">
          {shipment.progress.map((step) => (
            <li key={step.label} className="min-w-0 space-y-1.5">
              <span className={cn("block h-1 rounded-full", !step.done && "bg-muted")} style={step.done ? { background: "var(--primary)" } : undefined} />
              <span className={cn("block text-[0.6875rem] leading-4", step.current ? "font-semibold" : "text-muted-foreground")}>{step.label}</span>
            </li>
          ))}
        </ol>
      )}

      {shipment.codDue && (
        <p className="mt-5 flex items-center gap-2.5 rounded-(--store-radius) px-4 py-3 text-sm font-medium" style={chip(skin.warn)}>
          <Banknote className="size-4 shrink-0" />
          جهّز {money.format(shipment.codDue / 100)} للمندوب عند الاستلام.
        </p>
      )}

      {shipment.events.length > 0 && (
        <ol className="mt-6 space-y-4 border-s border-border ps-5" aria-label="تحديثات الشحنة">
          {shipment.events.map((e, i) => (
            <li key={`${e.at}-${i}`} className="relative">
              <span
                aria-hidden
                className={cn("absolute -start-[1.6rem] top-1.5 size-2.5 rounded-full ring-4 ring-background", i !== 0 && "bg-muted-foreground/30")}
                style={i === 0 ? { background: "var(--primary)" } : undefined}
              />
              <p className="text-sm font-medium">{e.label}</p>
              <p className="text-xs text-muted-foreground">
                {when.format(new Date(e.at))}
                {e.location && ` · ${e.location}`}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** One tracked order: status and timeline, the shipment, then what was ordered. */
export function TrackedOrderView({
  order,
  skin,
  helpHref,
  onReset,
}: {
  order: TrackedOrder;
  skin: TrackSkin;
  /** WhatsApp chat about this order, or the store's contact page. */
  helpHref: string;
  onReset: () => void;
}) {
  const Icon = TONE_ICON[order.tone];
  const units = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-10">
      <div className="min-w-0 space-y-6">
        <section className={skin.panel} aria-live="polite">
          <div className="flex items-start gap-3.5">
            <span className="grid size-11 shrink-0 place-items-center rounded-full" style={chip(toneColor(order.tone, skin))}>
              <Icon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                طلب{" "}
                <span className="font-mono font-semibold text-foreground" dir="ltr">
                  {order.number}
                </span>{" "}
                · {day.format(new Date(order.placedAt))}
              </p>
              <h2 className="mt-1 text-xl font-bold leading-snug sm:text-2xl">{order.headline}</h2>
              <p className="mt-1.5 text-sm leading-7 text-muted-foreground">{order.detail}</p>
            </div>
          </div>
          <div className="mt-6">
            <Steps steps={order.steps} skin={skin} />
          </div>
        </section>

        {order.shipment && <Shipment shipment={order.shipment} skin={skin} />}
      </div>

      <aside className="min-w-0 space-y-4">
        <section className={skin.panel} aria-labelledby="track-items">
          <h3 id="track-items" className="flex items-center gap-2 text-base font-bold">
            <Package className="size-5 shrink-0" style={{ color: "var(--primary)" }} />
            طلبك
            <span className="text-sm font-normal text-muted-foreground">({nf.format(units)} قطعة)</span>
          </h3>
          <ul className="mt-3 divide-y divide-border">
            {order.items.map((item, i) => (
              <li key={`${item.name}-${i}`} className="flex items-center gap-3 py-3">
                <span className="relative size-12 shrink-0 overflow-hidden rounded-(--store-radius) bg-muted">
                  {item.image && <Image src={item.image} alt="" fill sizes="48px" className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-sm font-medium leading-6">{item.name}</span>
                  {item.detail && <span className="block truncate text-xs text-muted-foreground">{item.detail}</span>}
                </span>
                <span className="shrink-0 text-sm tabular-nums text-muted-foreground">×{nf.format(item.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-1 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">طريقة الدفع</dt>
              <dd className="text-end">{order.paymentLabel}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 text-base font-bold">
              <dt>الإجمالي</dt>
              <dd>{money.format(order.total / 100)}</dd>
            </div>
          </dl>
        </section>

        <div className="grid gap-2.5">
          <a href={helpHref} target={helpHref.startsWith("https://wa.me") ? "_blank" : undefined} rel="noreferrer" className={skin.secondary}>
            عندك سؤال عن الطلب؟ كلّم المتجر
          </a>
          <button type="button" onClick={onReset} className={skin.secondary}>
            تتبّع طلب تاني
          </button>
        </div>
      </aside>
    </div>
  );
}
