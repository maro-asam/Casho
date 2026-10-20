import Link from "next/link";
import { ImageIcon } from "lucide-react";

import { StatusText } from "@/components/saas-page";
import type { AbandonedCartRow } from "@/lib/cart-recovery/abandoned";
import { cn } from "@/lib/utils";
import { CartRowActions } from "./cart-row-actions";
import { recoveryMeta } from "./recovery-meta";
import { lazyIntl, tr } from "@/lib/i18n/dashboard";

const money = lazyIntl.number({ style: "currency", currency: "EGP", maximumFractionDigits: 0 });
const nf = lazyIntl.number();
const rtf = lazyIntl.relative({ numeric: "auto" });

export function ago(date: Date, now: number) {
  const minutes = Math.round((date.getTime() - now) / 60000);
  if (minutes > -60) return rtf.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours > -24) return rtf.format(hours, "hour");
  return rtf.format(Math.round(hours / 24), "day");
}

/** Overlapping product thumbnails (like a stack of photos). */
export function ThumbStack({ cart, size = "md" }: { cart: AbandonedCartRow; size?: "md" | "lg" }) {
  const shown = cart.items.slice(0, 3);
  const box = size === "md" ? "size-11 rounded-[10px]" : "size-14 rounded-[13px]";
  return (
    <div className="flex shrink-0">
      {shown.length === 0 ? (
        <span className={cn("grid place-items-center bg-(--fill-3)", box)}>
          <ImageIcon className="size-4 text-(--label-3)" />
        </span>
      ) : (
        shown.map((i, n) => (
          <span
            key={i.productId}
            className={cn("relative grid place-items-center overflow-hidden bg-(--fill-3) ring-2 ring-card", box, n > 0 && "-ms-5")}
            style={{ zIndex: 3 - n }}
          >
            {i.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={i.image} alt="" className="size-full object-cover" />
            ) : (
              <ImageIcon className="size-4 text-(--label-3)" />
            )}
          </span>
        ))
      )}
    </div>
  );
}

type Props = { carts: AbandonedCartRow[]; openHref: (key: string) => string; now: number };

/** Mail-style list: who, what they left, how long ago, value — one row link to the recovery sheet. */
export function CartsTable({ carts, openHref, now }: Props) {
  return (
    <ul className="apple-rows border-t-[0.5px] border-border [--row-inset:20px]">
      {carts.map((cart) => {
        const meta = recoveryMeta(cart.status);
        const who = cart.fullName || (cart.phone ? tr("عميل") : tr("زائر من غير رقم"));
        return (
          <li key={`${cart.status}-${cart.key}`} className="relative flex items-center gap-3 px-5 py-3 transition-colors hover:bg-(--fill-3)/40">
            <ThumbStack cart={cart} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <Link
                  href={openHref(cart.key)}
                  scroll={false}
                  className={cn(
                    "truncate text-[15px] font-semibold after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-ring",
                    !cart.fullName && !cart.phone && "font-normal text-muted-foreground",
                  )}
                  aria-label={tr("افتح سلة {0}", cart.fullName ?? cart.phone ?? tr("زائر"))}
                >
                  {who}
                </Link>
                <span className="shrink-0 text-[13px] text-muted-foreground">{ago(cart.lastActivityAt, now)}</span>
              </div>
              <p className="truncate text-[13px] text-muted-foreground">
                {cart.status === "recovered"
                  ? tr("اتحولت لطلب")
                  : (
                    <>
                      {cart.items[0]?.name}
                      {cart.items.length > 1 && tr(" · {0} منتجات", nf.format(cart.items.length))}
                    </>
                  )}
                {cart.phone && (
                  <span className="hidden sm:inline" dir="ltr">
                    {" · "}
                    {cart.phone}
                  </span>
                )}
              </p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <span className="flex items-center gap-3">
                  <StatusText tone={meta.tone}>{meta.label}</StatusText>
                  <span className="text-[15px] font-semibold tabular-nums">{money.format(cart.value / 100)}</span>
                </span>
                <CartRowActions cartKey={cart.key} phone={cart.phone} status={cart.status} openHref={openHref(cart.key)} />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
