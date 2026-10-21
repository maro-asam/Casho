import Image from "next/image";
import Link from "next/link";

import { acceptRate, offerDiscountLabel, offerUnitPrice, type OfferDiscountType, type OfferType } from "@/lib/offers/offer-pricing";
import { cn } from "@/lib/utils";
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

/** The offered product as an app-icon-sized thumbnail, badged with the offer type. */
function OfferThumb({ o }: { o: OfferRow }) {
  const meta = offerTypeMeta(o.type);
  return (
    <span className="relative shrink-0">
      <span className={cn("relative block size-12 overflow-hidden rounded-[12px] bg-(--fill-3)", !o.isActive && "opacity-50 grayscale")}>
        <Image src={o.offerProduct.image || "/images/product-placeholder.png"} alt="" fill sizes="48px" className="object-cover" />
      </span>
      <span
        title={meta.label}
        className={cn("absolute -end-1.5 -bottom-1.5 grid size-5 place-items-center rounded-full text-white ring-2 ring-card", meta.glyph)}
      >
        <meta.icon className="size-3" strokeWidth={3} />
      </span>
    </span>
  );
}

function Performance({ o }: { o: OfferRow }) {
  const rate = acceptRate(o.views, o.accepts);
  return (
    <div className="w-28 space-y-1">
      <p className="text-[13px] text-muted-foreground tabular-nums">
        <span className="text-[15px] font-semibold text-foreground">{tr("{0}٪", nf.format(rate))}</span> {tr("قبول")}
      </p>
      <div className="h-1 overflow-hidden rounded-full bg-(--fill-3)" role="img" aria-label={tr("{0} من {1} مشاهدة", o.accepts, o.views)}>
        <div className="h-full rounded-full bg-(--sys-green)" style={{ width: `${rate}%` }} />
      </div>
      <p className="text-[12px] text-muted-foreground tabular-nums">{tr("{0} من {1} مشاهدة", nf.format(o.accepts), nf.format(o.views))}</p>
    </div>
  );
}

/** Mail-style list: what's offered, on what, at what price — and how it's converting. One row link opens the sheet. */
export function OffersTable({ offers, editHref }: { offers: OfferRow[]; editHref: (id: string) => string }) {
  return (
    <ul className="apple-rows border-t-[0.5px] border-border [--row-inset:84px]">
      {offers.map((o) => {
        const meta = offerTypeMeta(o.type);
        const discount = offerDiscountLabel(o);
        const price = offerUnitPrice(o.offerProduct.price, o);
        return (
          <li key={o.id} className="relative flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-(--fill-3)/40">
            <OfferThumb o={o} />

            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-baseline gap-2">
                <Link
                  href={editHref(o.id)}
                  className={cn(
                    "truncate text-[15px] font-semibold after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-ring",
                    !o.isActive && "text-muted-foreground",
                  )}
                >
                  {o.name}
                </Link>
                <span className="hidden shrink-0 text-[12px] text-muted-foreground sm:inline">{meta.title}</span>
              </div>
              <p className="truncate text-[13px] text-muted-foreground">
                {o.offerProduct.name}
                <span className="text-(--label-3)"> · </span>
                {triggerSummary(o)}
              </p>
              <p className="flex flex-wrap items-baseline gap-x-2 text-[13px] tabular-nums">
                <span className="font-semibold">{money.format(price)}</span>
                {price < o.offerProduct.price && <span className="text-muted-foreground line-through">{money.format(o.offerProduct.price)}</span>}
                {discount && <span className="text-foreground/80">{discount}</span>}
                {!o.offerProduct.isActive && <span className="text-(--sys-orange)">{tr("المنتج مخفي")}</span>}
                <span className="text-muted-foreground md:hidden">
                  {tr("{0}٪ قبول · {1}", nf.format(acceptRate(o.views, o.accepts)), money.format(o.revenue / 100))}
                </span>
              </p>
            </div>

            <div className="hidden md:block">
              <Performance o={o} />
            </div>

            <div className="hidden w-28 text-end lg:block">
              <p className="text-[15px] font-semibold tabular-nums">{money.format(o.revenue / 100)}</p>
              <p className="text-[12px] text-muted-foreground tabular-nums">{tr("{0} طلب", nf.format(o.orders))}</p>
            </div>

            <div className="flex shrink-0 items-center gap-2.5">
              <OfferActiveSwitch key={String(o.isActive)} offerId={o.id} name={o.name} isActive={o.isActive} />
              <OfferRowActions offer={{ id: o.id, name: o.name, orders: o.orders, isActive: o.isActive }} editHref={editHref(o.id)} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
