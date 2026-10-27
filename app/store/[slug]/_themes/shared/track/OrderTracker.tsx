"use client";

import { useId, useState, useTransition, type FormEvent } from "react";
import { Loader2, Search } from "lucide-react";

import { TrackOrderAction } from "@/actions/store/track-order.actions";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { TrackedOrder } from "@/lib/orders/tracking";
import { cn } from "@/lib/utils";
import { whatsappHref } from "../social";
import { TrackedOrderView } from "./TrackedOrderView";

/** The theme's own classes and status colors — the tracker's layout and copy are shared. */
export type TrackSkin = {
  label: string;
  field: string;
  /** Primary action (search). */
  button: string;
  /** Secondary actions and links (carrier site, contact, track another). */
  secondary: string;
  /** A block surface: status, shipment, items, the search form. */
  panel: string;
  /** CSS colors for done / needs attention / canceled. */
  ok: string;
  warn: string;
  bad: string;
};

/**
 * Storefront order tracking, shared by every theme: search by order number +
 * the phone it was placed with (no login), or show the order straight away
 * when opened from a signed link.
 */
export function OrderTracker({
  storeSlug,
  whatsapp,
  initialCode,
  initialOrder,
  skin,
}: {
  storeSlug: string;
  /** Store WhatsApp number, for the "ask about this order" link. */
  whatsapp: string | null;
  initialCode: string;
  initialOrder: TrackedOrder | null;
  skin: TrackSkin;
}) {
  const id = useId();
  const [order, setOrder] = useState(initialOrder);
  const [code, setCode] = useState(initialCode);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<{ message: string; field?: "code" | "phone" } | null>(null);
  const [pending, start] = useTransition();

  const wa = whatsappHref(whatsapp);
  const contactPage = buildStoreUrl(storeSlug, "/contact");

  function submit(e: FormEvent) {
    e.preventDefault();
    start(async () => {
      const result = await TrackOrderAction(storeSlug, code, phone);
      if (result.ok) {
        setError(null);
        setOrder(result.order);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setError({ message: result.message, field: result.field });
      }
    });
  }

  if (order) {
    const helpHref = wa ? `${wa}?text=${encodeURIComponent(`أهلًا، عندي سؤال عن طلبي ${order.number}`)}` : contactPage;
    return (
      <TrackedOrderView
        order={order}
        skin={skin}
        helpHref={helpHref}
        onReset={() => {
          setOrder(null);
          setCode("");
          setPhone("");
        }}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <form onSubmit={submit} className={cn(skin.panel, "space-y-5")} noValidate>
        <div>
          <label htmlFor={`${id}-code`} className={cn(skin.label, "mb-1.5 block")}>
            رقم الطلب
          </label>
          <input
            id={`${id}-code`}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            maxLength={40}
            dir="ltr"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="A1B2C3"
            aria-invalid={error?.field === "code" || undefined}
            aria-describedby={`${id}-code-hint`}
            className={cn(skin.field, "font-mono uppercase tracking-wider")}
          />
          <p id={`${id}-code-hint`} className="mt-1.5 text-xs leading-5 text-muted-foreground">
            تلاقيه في رسالة أو إيميل تأكيد الطلب، زي{" "}
            <span dir="ltr" className="font-mono">
              #A1B2C3
            </span>
            .
          </p>
        </div>

        <div>
          <label htmlFor={`${id}-phone`} className={cn(skin.label, "mb-1.5 block")}>
            رقم الموبايل اللي طلبت بيه
          </label>
          <input
            id={`${id}-phone`}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            placeholder="01xxxxxxxxx"
            aria-invalid={error?.field === "phone" || undefined}
            className={skin.field}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-(--store-radius) px-4 py-3 text-sm leading-6" style={{ color: skin.bad, background: `color-mix(in srgb, ${skin.bad} 10%, transparent)` }}>
            {error.message}
          </p>
        )}

        <button type="submit" disabled={pending} aria-busy={pending} className={skin.button}>
          {pending ? <Loader2 className="animate-spin" /> : <Search />}
          تتبّع الطلب
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        مش لاقي رقم الطلب؟{" "}
        <a href={wa ?? contactPage} target={wa ? "_blank" : undefined} rel="noreferrer" className="font-medium text-foreground underline underline-offset-4 hover:no-underline">
          كلّم المتجر
        </a>
      </p>
    </div>
  );
}
