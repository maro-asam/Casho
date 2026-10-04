// ─────────────────────────────────────────────────────────────────────────────
//  Riwaq theme — UI primitives
//  Server-safe building blocks (no hooks). Every Riwaq screen is composed from
//  these so type, rules and spacing stay one language.
// ─────────────────────────────────────────────────────────────────────────────

import Image from "next/image";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ArrowLeft, Star } from "lucide-react";

import { cn, formatPrice } from "@/lib/utils";
import { riwaqDisplay } from "./fonts";

/** Classes for content rendered in a portal (sheets, dialogs, popovers):
 *  re-applies the store tokens + Riwaq scope + display font outside the root. */
export const RQ_PORTAL = `store-theme-root theme-riwaq rq-portal ${riwaqDisplay.variable}`;

const nf = new Intl.NumberFormat("ar-EG");
const nf2 = new Intl.NumberFormat("ar-EG", { minimumIntegerDigits: 2 });

/** "١٢" */
export const num = (n: number) => nf.format(n);
/** Zero-padded index numeral: "٠٧" */
export const idx = (n: number) => nf2.format(n);

/** One-letter monogram for imageless frames — skips the Arabic article "ال". */
export function monogram(name: string) {
  const clean = name.trim().replace(/^ال(?=\S{2})/, "");
  return [...clean][0] ?? "";
}

// ─── Buttons ────────────────────────────────────────────────────────────────

type BtnVariant = "ink" | "accent" | "line" | "text";
type BtnSize = "sm" | "md" | "lg";

export function btn({
  variant = "ink",
  size = "md",
  full,
  icon,
  className,
}: { variant?: BtnVariant; size?: BtnSize; full?: boolean; icon?: boolean; className?: string } = {}) {
  return cn(
    "rq-btn",
    `rq-btn--${variant}`,
    size !== "md" && `rq-btn--${size}`,
    full && "rq-btn--full",
    icon && "rq-btn--icon",
    className,
  );
}

/** Arrow pointing toward the reading end; nudges on hover of its link. */
export function Arrow({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("rq-arrow", className)}>
      <ArrowLeft className="size-[1.1em] ltr:rotate-180" />
    </span>
  );
}

// ─── Layout ─────────────────────────────────────────────────────────────────

export function Wrap({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rq-wrap", className)} {...props} />;
}

/** Numbered section opener: "٠٢ ─────────" then the title and an end link. */
export function SectionHead({
  index,
  title,
  subtitle,
  href,
  linkLabel = "عرض الكل",
  className,
}: {
  index?: number;
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  className?: string;
}) {
  return (
    <header className={cn("mb-6 sm:mb-10", className)}>
      <div className="flex items-center gap-4" aria-hidden>
        {index !== undefined && <span className="rq-num text-sm text-(--rq-accent)">{idx(index)}</span>}
        <span className="rq-rule flex-1" />
      </div>
      <div className="mt-4 flex items-end justify-between gap-6">
        <div className="min-w-0">
          <h2 className="rq-h2">{title}</h2>
          {subtitle && <p className="rq-caption mt-2">{subtitle}</p>}
        </div>
        {href && (
          <Link href={href} className="group inline-flex min-h-11 shrink-0 items-center gap-2 text-sm font-semibold">
            <span className="rq-link">{linkLabel}</span>
            <Arrow />
          </Link>
        )}
      </div>
    </header>
  );
}

/** Slash-separated trail: الرئيسية / المنتجات / … */
export function Crumbs({ items, className }: { items: { label: string; href?: string }[]; className?: string }) {
  return (
    <nav aria-label="مسار التصفح" className={cn("min-w-0", className)}>
      <ol className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] text-(--rq-quiet)">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className={cn("flex min-w-0 items-center gap-2", last && "min-w-0 flex-1")}>
              {item.href && !last ? (
                <Link href={item.href} className="rq-link inline-flex min-h-8 items-center hover:text-(--rq-ink)">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={cn("truncate", last && "text-(--rq-ink)")}>
                  {item.label}
                </span>
              )}
              {!last && (
                <span aria-hidden className="opacity-50">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Page opener: trail, big title with a superscript count, optional aside. */
export function PageTitle({
  crumbs,
  title,
  count,
  intro,
  aside,
  className,
}: {
  crumbs: { label: string; href?: string }[];
  title: ReactNode;
  count?: number;
  intro?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("pb-6 pt-5 sm:pb-10 sm:pt-8", className)}>
      <Crumbs items={crumbs} />
      <div className="mt-5 flex flex-col gap-5 sm:mt-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="rq-h1 break-words">
            {title}
            {count !== undefined && count > 0 && <span className="rq-sup">({num(count)})</span>}
          </h1>
          {intro && <div className="rq-small mt-3 max-w-[60ch] text-(--rq-quiet)">{intro}</div>}
        </div>
        {aside}
      </div>
    </header>
  );
}

// ─── Commerce ───────────────────────────────────────────────────────────────

export { discountPercent } from "../shared/commerce";

export function Price({
  price,
  compareAt,
  size = "md",
  className,
}: {
  price: number;
  compareAt?: number | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const onSale = !!compareAt && compareAt > price;
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5", className)}>
      <span
        className={cn(
          "rq-price",
          size === "sm" && "text-[0.9375rem]",
          size === "md" && "text-[1.0625rem]",
          size === "lg" && "text-2xl",
          size === "xl" && "text-[2rem] sm:text-[2.5rem]",
        )}
      >
        {onSale && <span className="sr-only">السعر بعد الخصم: </span>}
        {formatPrice(price)}
      </span>
      {onSale && (
        <s className={cn("tabular-nums text-(--rq-quiet) decoration-1", size === "xl" || size === "lg" ? "text-base" : "text-[0.8125rem]")}>
          <span className="sr-only">السعر قبل الخصم: </span>
          {formatPrice(compareAt!)}
        </s>
      )}
    </p>
  );
}

export function Stars({ value, count, className }: { value: number; count?: number; className?: string }) {
  const rounded = Math.round(value);
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="sr-only">التقييم {value.toFixed(1)} من ٥</span>
      <span aria-hidden className="flex items-center gap-px">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn("size-3", i <= rounded ? "fill-(--rq-star) text-(--rq-star)" : "fill-transparent text-(--rq-rule-strong)")}
          />
        ))}
      </span>
      {count !== undefined && (
        <span aria-hidden className="text-xs tabular-nums text-(--rq-quiet)">
          ({num(count)})
        </span>
      )}
    </span>
  );
}

// ─── States ─────────────────────────────────────────────────────────────────

/** Empty / error block: an outlined arch holding an icon, beside the message. */
export function Empty({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 items-center gap-6 border-y border-(--rq-rule) py-12 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-10 sm:py-16",
        className,
      )}
    >
      <div className="rq-arch grid h-32 w-24 place-items-center border border-(--rq-ink) bg-transparent pt-6 text-(--rq-accent) [&_svg]:size-7">
        {icon}
      </div>
      <div className="min-w-0">
        <h2 className="rq-h2">{title}</h2>
        {description && <p className="rq-small mt-3 max-w-[48ch] text-(--rq-quiet)">{description}</p>}
        {action && <div className="mt-7 flex flex-wrap items-center gap-3">{action}</div>}
      </div>
    </div>
  );
}

/** Small 8-point star — the souq motif used as a separator. */
export function StarMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-3 shrink-0", className)} fill="currentColor">
      <path d="M12 1l2.6 5.8L20.5 4l-2.8 5.9L23.5 12l-5.8 2.1 2.8 5.9-5.9-2.8L12 23l-2.6-5.8L3.5 20l2.8-5.9L.5 12l5.8-2.1L3.5 4l5.9 2.8z" />
    </svg>
  );
}

/** Product image that fills its plate; without a src it shows the star motif
 *  instead of a broken image. */
export function PlateImage({
  src,
  sizes,
  priority,
  className,
}: {
  src: string | null | undefined;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  if (!src) {
    return (
      <span aria-hidden className="absolute inset-0 grid place-items-center text-(--rq-rule-strong)">
        <StarMark className="size-[18%] min-w-4 max-w-10" />
      </span>
    );
  }
  return <Image src={src} alt="" fill priority={priority} sizes={sizes} className={cn("object-cover", className)} />;
}
