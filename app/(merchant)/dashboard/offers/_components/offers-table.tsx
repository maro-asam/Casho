import Image from "next/image";
import Link from "next/link";

import { StatusPill } from "@/components/saas-page";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { acceptRate, offerDiscountLabel, offerUnitPrice, type OfferDiscountType, type OfferType } from "@/lib/offers/offer-pricing";
import { offerTypeMeta } from "./offer-meta";
import { OfferActiveSwitch, OfferRowActions } from "./offer-row-actions";
import { lazyIntl, tr } from "@/lib/i18n/dashboard";

type ProductRef = { id: string; name: string; image: string; price: number; isActive: boolean };

export type OfferRow = {
  id: string;
  type: OfferType;
  name: string;
  isActive: boolean;
  discountType: OfferDiscountType;
  discountValue: number;
  views: number;
  accepts: number;
  /** Piasters, from non-canceled orders. */
  revenue: number;
  orders: number;
  offerProduct: ProductRef;
  triggers: ProductRef[];
};

const nf = lazyIntl.number({ maximumFractionDigits: 1 });
const money = lazyIntl.number({ style: "currency", currency: "EGP", maximumFractionDigits: 0 });

function triggerSummary(o: OfferRow) {
  if (o.triggers.length === 0) return tr("على كل المنتجات");
  if (o.triggers.length === 1) return tr("على {0}", o.triggers[0].name);
  return tr("على {0} و{1} كمان", o.triggers[0].name, nf.format(o.triggers.length - 1));
}

function OfferProduct({ o }: { o: OfferRow }) {
  const price = offerUnitPrice(o.offerProduct.price, o);
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="relative size-9 shrink-0 overflow-hidden rounded-md bg-muted">
        <Image src={o.offerProduct.image || "/images/product-placeholder.png"} alt="" fill sizes="36px" className="object-cover" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm">{o.offerProduct.name}</p>
        <p className="text-xs text-muted-foreground tabular-nums">
          <span className="font-medium text-foreground">{money.format(price)}</span>
          {price < o.offerProduct.price && <span className="ms-1.5 line-through">{money.format(o.offerProduct.price)}</span>}
          {!o.offerProduct.isActive && <span className="ms-1.5 text-amber-600">{tr("· المنتج مخفي")}</span>}
        </p>
      </div>
    </div>
  );
}

function Performance({ o }: { o: OfferRow }) {
  return (
    <div className="text-sm tabular-nums">
      <span className="font-medium">{tr("{0}٪", nf.format(acceptRate(o.views, o.accepts)))}</span>
      <span className="text-xs text-muted-foreground">{" "}{tr("قبول")}</span>
      <p className="text-xs text-muted-foreground">
        {tr("{0} من {1} مشاهدة", nf.format(o.accepts), nf.format(o.views))}
      </p>
    </div>
  );
}

/** Desktop: table. Mobile: stacked rows — same data, same row link. */
export function OffersTable({ offers, editHref }: { offers: OfferRow[]; editHref: (id: string) => string }) {
  const controls = (o: OfferRow) => (
    <div className="flex items-center justify-end gap-2">
      <OfferActiveSwitch key={String(o.isActive)} offerId={o.id} name={o.name} isActive={o.isActive} />
      <OfferRowActions offer={{ id: o.id, name: o.name, orders: o.orders }} editHref={editHref(o.id)} />
    </div>
  );

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="h-10 ps-4 text-start text-xs font-medium text-muted-foreground">{tr("العرض")}</TableHead>
              <TableHead className="h-10 text-start text-xs font-medium text-muted-foreground">{tr("المنتج المعروض")}</TableHead>
              <TableHead className="hidden h-10 text-start text-xs font-medium text-muted-foreground lg:table-cell">{tr("الأداء")}</TableHead>
              <TableHead className="hidden h-10 text-end text-xs font-medium text-muted-foreground xl:table-cell">{tr("مبيعات العرض")}</TableHead>
              <TableHead className="h-10 w-28 pe-4 text-end text-xs font-medium text-muted-foreground">{tr("تشغيل")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offers.map((o) => {
              const meta = offerTypeMeta(o.type);
              const discount = offerDiscountLabel(o);
              return (
                <TableRow key={o.id} className="relative">
                  <TableCell className="max-w-72 py-3 ps-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={editHref(o.id)}
                        scroll={false}
                        className="truncate text-sm font-semibold after:absolute after:inset-0 hover:underline focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-ring"
                      >
                        {o.name}
                      </Link>
                      <StatusPill tone={meta.tone}>{meta.short}</StatusPill>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {triggerSummary(o)}
                      {discount && <span className="font-medium text-foreground"> · {discount}</span>}
                    </p>
                  </TableCell>
                  <TableCell className="max-w-64 py-3">
                    <OfferProduct o={o} />
                  </TableCell>
                  <TableCell className="hidden py-3 lg:table-cell">
                    <Performance o={o} />
                  </TableCell>
                  <TableCell className="hidden py-3 text-end xl:table-cell">
                    <p className="text-sm font-medium tabular-nums">{money.format(o.revenue / 100)}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">{tr("{0} طلب", nf.format(o.orders))}</p>
                  </TableCell>
                  <TableCell className="py-3 pe-4">{controls(o)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y divide-border md:hidden">
        {offers.map((o) => {
          const meta = offerTypeMeta(o.type);
          return (
            <li key={o.id} className="relative space-y-2 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={editHref(o.id)} scroll={false} className="block truncate text-sm font-semibold after:absolute after:inset-0">
                    {o.name}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">{triggerSummary(o)}</p>
                </div>
                <StatusPill tone={meta.tone}>{meta.short}</StatusPill>
              </div>
              <OfferProduct o={o} />
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground tabular-nums">
                  {tr("{0}٪ قبول · {1}", nf.format(acceptRate(o.views, o.accepts)), money.format(o.revenue / 100))}
                </p>
                <div className="relative z-10">{controls(o)}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
