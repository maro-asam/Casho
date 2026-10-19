import Link from "next/link";
import { ImageIcon } from "lucide-react";

import { StatusPill } from "@/components/saas-page";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AbandonedCartRow } from "@/lib/cart-recovery/abandoned";
import { CartRowActions } from "./cart-row-actions";
import { recoveryMeta } from "./recovery-meta";
import { lazyIntl, tr } from "@/lib/i18n/dashboard";

const money = lazyIntl.number({ style: "currency", currency: "EGP", maximumFractionDigits: 0 });
const nf = lazyIntl.number();
const rtf = lazyIntl.relative({ numeric: "auto" });

function ago(date: Date, now: number) {
  const minutes = Math.round((date.getTime() - now) / 60000);
  if (minutes > -60) return rtf.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours > -24) return rtf.format(hours, "hour");
  return rtf.format(Math.round(hours / 24), "day");
}

function Customer({ cart }: { cart: AbandonedCartRow }) {
  if (!cart.phone && !cart.fullName) return <span className="text-sm text-muted-foreground">{tr("زائر من غير رقم")}</span>;
  return (
    <div className="min-w-0">
      <p className="max-w-40 truncate text-sm font-medium">{cart.fullName || tr("عميل")}</p>
      {cart.phone && (
        <p className="text-xs text-muted-foreground tabular-nums" dir="ltr">
          {cart.phone}
        </p>
      )}
    </div>
  );
}

function Products({ cart }: { cart: AbandonedCartRow }) {
  if (cart.status === "recovered") return <span className="text-sm text-muted-foreground">{tr("اتحولت لطلب")}</span>;
  const shown = cart.items.slice(0, 3);
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div className="flex shrink-0 -space-x-2 space-x-reverse">
        {shown.map((i) => (
          <span key={i.productId} className="relative grid size-8 place-items-center overflow-hidden rounded-md border-2 border-card bg-muted">
            {i.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={i.image} alt="" className="size-full object-cover" />
            ) : (
              <ImageIcon className="size-3.5 text-muted-foreground/60" />
            )}
          </span>
        ))}
      </div>
      <div className="min-w-0">
        <p className="max-w-48 truncate text-sm">{cart.items[0]?.name}</p>
        <p className="text-xs text-muted-foreground">
          {tr("{0} قطعة", nf.format(cart.itemCount))}{cart.items.length > 1 && tr(" · {0} منتجات", nf.format(cart.items.length))}
        </p>
      </div>
    </div>
  );
}

type Props = { carts: AbandonedCartRow[]; openHref: (key: string) => string; now: number };

/** Desktop: table. Mobile: stacked rows — same data, same row link. */
export function CartsTable({ carts, openHref, now }: Props) {
  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="h-10 ps-4 text-start text-xs font-medium text-muted-foreground">{tr("العميل")}</TableHead>
              <TableHead className="h-10 text-start text-xs font-medium text-muted-foreground">{tr("المنتجات")}</TableHead>
              <TableHead className="hidden h-10 text-start text-xs font-medium text-muted-foreground lg:table-cell">{tr("آخر نشاط")}</TableHead>
              <TableHead className="h-10 text-start text-xs font-medium text-muted-foreground">{tr("الحالة")}</TableHead>
              <TableHead className="h-10 text-end text-xs font-medium text-muted-foreground">{tr("القيمة")}</TableHead>
              <TableHead className="h-10 w-36 pe-4">
                <span className="sr-only">{tr("إجراءات")}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {carts.map((cart) => {
              const meta = recoveryMeta(cart.status);
              return (
                <TableRow key={`${cart.status}-${cart.key}`} className="relative">
                  <TableCell className="py-3 ps-4">
                    <Link
                      href={openHref(cart.key)}
                      scroll={false}
                      className="block after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-ring"
                      aria-label={tr("افتح سلة {0}", cart.fullName ?? cart.phone ?? tr("زائر"))}
                    >
                      <Customer cart={cart} />
                    </Link>
                  </TableCell>
                  <TableCell className="py-3">
                    <Products cart={cart} />
                  </TableCell>
                  <TableCell className="hidden py-3 text-sm text-muted-foreground lg:table-cell">{ago(cart.lastActivityAt, now)}</TableCell>
                  <TableCell className="py-3">
                    <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                  </TableCell>
                  <TableCell className="py-3 text-end text-sm font-semibold tabular-nums">{money.format(cart.value / 100)}</TableCell>
                  <TableCell className="py-3 pe-4">
                    <CartRowActions cartKey={cart.key} phone={cart.phone} status={cart.status} openHref={openHref(cart.key)} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y divide-border md:hidden">
        {carts.map((cart) => {
          const meta = recoveryMeta(cart.status);
          return (
            <li key={`${cart.status}-${cart.key}`} className="relative space-y-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <Link href={openHref(cart.key)} scroll={false} className="min-w-0 after:absolute after:inset-0">
                  <Customer cart={cart} />
                </Link>
                <p className="shrink-0 text-sm font-semibold tabular-nums">{money.format(cart.value / 100)}</p>
              </div>
              <Products cart={cart} />
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                  {ago(cart.lastActivityAt, now)}
                </span>
                <CartRowActions cartKey={cart.key} phone={cart.phone} status={cart.status} openHref={openHref(cart.key)} />
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
