// ─────────────────────────────────────────────────────────────────────────────
//  Dune theme — UI primitives (server-safe, no hooks)
// ─────────────────────────────────────────────────────────────────────────────

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ComponentProps, ReactNode } from "react";
import { ArrowLeft, ImageIcon, Star } from "lucide-react";

import { cn, formatPrice } from "@/lib/utils";
import { swatchColor } from "../shared/colors";
import { duneDisplay } from "./fonts";

/** Classes for portal content (drawers, dialogs, popovers). */
export const DN_PORTAL = `store-theme-root theme-dune dn-portal ${duneDisplay.variable}`;

const nf = new Intl.NumberFormat("ar-EG");
export const num = (n: number) => nf.format(n);

export { discountPercent } from "../shared/commerce";

/** Stagger index for reveal / drawer animations. */
export const delay = (d: number) => ({ "--d": d }) as CSSProperties;
export const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

// ─── Buttons ────────────────────────────────────────────────────────────────

type BtnVariant = "solid" | "outline" | "light" | "glass" | "ghost";
type BtnSize = "sm" | "md" | "lg";

export function btn({
  variant = "solid",
  size = "md",
  full,
  icon,
  className,
}: { variant?: BtnVariant; size?: BtnSize; full?: boolean; icon?: boolean; className?: string } = {}) {
  return cn("dn-btn", `dn-btn--${variant}`, size !== "md" && `dn-btn--${size}`, full && "dn-btn--full", icon && "dn-btn--icon", className);
}

/** Arrow toward the reading end. */
export function Arrow({ className }: { className?: string }) {
  return <ArrowLeft aria-hidden className={cn("size-[1.05em] shrink-0 ltr:rotate-180", className)} />;
}

// ─── Layout ─────────────────────────────────────────────────────────────────

export function Wrap({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("dn-wrap", className)} {...props} />;
}

/** Section opener: serif title on the start side, a quiet "view all" link on
 *  the end; or centered with an eyebrow for editorial sections. */
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  href,
  linkLabel = "عرض الكل",
  center,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  center?: boolean;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "mb-7 sm:mb-10",
        center ? "flex flex-col items-center text-center" : "flex flex-wrap items-end justify-between gap-x-8 gap-y-3",
        className,
      )}
    >
      <div className={cn("min-w-0", center ? "max-w-2xl" : "max-w-3xl")}>
        {eyebrow && <p className="dn-label dn-appear mb-3 text-(--dn-quiet)">{eyebrow}</p>}
        <h2 className="dn-h2 dn-appear text-balance" style={delay(1)}>
          {title}
        </h2>
        {subtitle && (
          <p className="dn-appear mt-3 text-[0.9375rem] leading-7 text-(--dn-quiet)" style={delay(2)}>
            {subtitle}
          </p>
        )}
      </div>
      {(href || actions) && (
        <div className={cn("dn-appear flex shrink-0 items-center gap-3", center && "mt-5")} style={delay(2)}>
          {href && (
            <Link href={href} className="dn-link dn-label">
              {linkLabel}
              <Arrow />
            </Link>
          )}
          {actions}
        </div>
      )}
    </header>
  );
}

export function Crumbs({ items, className }: { items: { label: string; href?: string }[]; className?: string }) {
  return (
    <nav aria-label="مسار التصفح" className={cn("min-w-0", className)}>
      <ol className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] text-(--dn-quiet)">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className={cn("flex min-w-0 items-center gap-2", last && "min-w-0 flex-1")}>
              {item.href && !last ? (
                <Link href={item.href} className="inline-flex min-h-8 items-center transition-colors hover:text-(--dn-ink)">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={cn("truncate", last && "text-(--dn-ink)")}>
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

/** Centered page title block used by listing, cart, info pages. */
export function PageTitle({ title, crumbs, note, className }: { title: string; crumbs: { label: string; href?: string }[]; note?: ReactNode; className?: string }) {
  return (
    <header data-reveal className={cn("flex flex-col items-center pb-8 pt-8 text-center sm:pb-12 sm:pt-12", className)}>
      <Crumbs items={crumbs} className="dn-appear [&_ol]:justify-center [&_li]:flex-none" />
      <h1 className="dn-h1 dn-appear mt-4 max-w-4xl text-balance break-words" style={delay(1)}>
        {title}
      </h1>
      {note && (
        <div className="dn-appear mt-3 text-sm text-(--dn-quiet)" style={delay(2)}>
          {note}
        </div>
      )}
    </header>
  );
}

// ─── Commerce ───────────────────────────────────────────────────────────────

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
          "dn-price",
          size === "sm" && "text-[1.0625rem]",
          size === "md" && "text-[1.1875rem]",
          size === "lg" && "text-[1.5rem]",
          size === "xl" && "text-[1.875rem] sm:text-[2.125rem]",
          onSale && "text-(--dn-sale)",
        )}
      >
        {onSale && <span className="sr-only">السعر بعد الخصم: </span>}
        {formatPrice(price)}
      </span>
      {onSale && (
        <s className={cn("dn-num text-(--dn-quiet) decoration-1", size === "xl" || size === "lg" ? "text-lg" : "text-[0.9375rem]")}>
          <span className="sr-only">السعر قبل الخصم: </span>
          {formatPrice(compareAt!)}
        </s>
      )}
    </p>
  );
}

export function Rating({ value, count, size = "sm", className }: { value: number; count?: number; size?: "sm" | "md"; className?: string }) {
  const full = Math.round(value);
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="sr-only">التقييم {value.toFixed(1)} من ٥</span>
      <span aria-hidden className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(size === "sm" ? "size-3" : "size-4", i <= full ? "fill-(--dn-star) text-(--dn-star)" : "fill-transparent text-(--dn-line-ink)")}
          />
        ))}
      </span>
      {count !== undefined && (
        <span aria-hidden className={cn("tabular-nums text-(--dn-quiet)", size === "sm" ? "text-xs" : "text-sm")}>
          ({num(count)})
        </span>
      )}
    </span>
  );
}

/** Small color dots; unknown color names collapse into "+N". */
export function Swatches({ colors, max = 5, className }: { colors: string[]; max?: number; className?: string }) {
  if (colors.length === 0) return null;
  const known = colors.map((c) => ({ label: c, color: swatchColor(c) })).filter((c) => c.color);
  const shown = known.slice(0, max);
  const rest = colors.length - shown.length;
  return (
    <span className={cn("flex items-center gap-1.5", className)}>
      <span className="sr-only">الألوان المتاحة: {colors.join("، ")}</span>
      {shown.map((c) => (
        <span key={c.label} aria-hidden title={c.label} className="dn-swatch size-3" style={{ background: c.color! }} />
      ))}
      {rest > 0 && (
        <span aria-hidden className="text-xs tabular-nums text-(--dn-quiet)">
          {shown.length ? `+${num(rest)}` : `${num(colors.length)} ألوان`}
        </span>
      )}
    </span>
  );
}

/** Image that fills its media box; without a src it shows a quiet glyph. */
export function PlateImage({
  src,
  sizes,
  priority,
  className,
  alt = "",
}: {
  src: string | null | undefined;
  sizes: string;
  priority?: boolean;
  className?: string;
  alt?: string;
}) {
  if (!src || src.includes("product-placeholder")) {
    return (
      <span aria-hidden className="absolute inset-0 grid place-items-center text-(--dn-line-ink)">
        <ImageIcon className="size-[20%] min-w-5 max-w-12" strokeWidth={1} />
      </span>
    );
  }
  return <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className={cn("object-cover", className)} />;
}

// ─── States ─────────────────────────────────────────────────────────────────

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
    <div className={cn("flex flex-col items-center border border-(--dn-line) px-6 py-16 text-center sm:py-24", className)}>
      <span className="grid size-14 place-items-center rounded-full border border-(--dn-line-ink) text-(--dn-quiet) [&_svg]:size-6">{icon}</span>
      <h2 className="dn-h3 mt-6">{title}</h2>
      {description && <p className="mt-3 max-w-md text-[0.9375rem] leading-7 text-(--dn-quiet)">{description}</p>}
      {action && <div className="mt-8 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}
