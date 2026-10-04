// ─────────────────────────────────────────────────────────────────────────────
//  Mada theme — UI primitives (server-safe, no hooks)
// ─────────────────────────────────────────────────────────────────────────────

import Image from "next/image";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ArrowLeft, ChevronLeft, ImageIcon, Star } from "lucide-react";

import { cn, formatPrice } from "@/lib/utils";
import { madaDisplay } from "./fonts";
import { swatchColor } from "./lib/colors";

/** Classes for portal content (drawers, dialogs, popovers). */
export const MD_PORTAL = `store-theme-root theme-mada md-portal ${madaDisplay.variable}`;

const nf = new Intl.NumberFormat("ar-EG");
export const num = (n: number) => nf.format(n);

export { discountPercent } from "../shared/commerce";

// ─── Buttons ────────────────────────────────────────────────────────────────

type BtnVariant = "brand" | "signal" | "outline" | "light" | "ghost";
type BtnSize = "sm" | "md" | "lg";

export function btn({
  variant = "brand",
  size = "md",
  full,
  icon,
  className,
}: { variant?: BtnVariant; size?: BtnSize; full?: boolean; icon?: boolean; className?: string } = {}) {
  return cn("md-btn", `md-btn--${variant}`, size !== "md" && `md-btn--${size}`, full && "md-btn--full", icon && "md-btn--icon", className);
}

/** Arrow toward the reading end. */
export function Arrow({ className }: { className?: string }) {
  return <ArrowLeft aria-hidden className={cn("size-[1.1em] shrink-0 ltr:rotate-180", className)} />;
}

// ─── Layout ─────────────────────────────────────────────────────────────────

export function Wrap({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("md-wrap", className)} {...props} />;
}

/** Section opener: signal eyebrow + title on the start side, actions on the end. */
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  href,
  linkLabel = "عرض الكل",
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 sm:mb-9", className)}>
      <div className="min-w-0 max-w-2xl">
        {eyebrow && <span className="md-eyebrow mb-3">{eyebrow}</span>}
        <h2 className="md-h2">{title}</h2>
        {subtitle && <p className="mt-2 text-[0.9375rem] leading-7 text-(--md-quiet)">{subtitle}</p>}
      </div>
      {(href || actions) && (
        <div className="flex shrink-0 items-center gap-2">
          {href && (
            <Link href={href} className={btn({ variant: "outline", size: "sm" })}>
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
      <ol className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-[0.8125rem] text-(--md-quiet)">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className={cn("flex min-w-0 items-center gap-1.5", last && "min-w-0 flex-1")}>
              {item.href && !last ? (
                <Link href={item.href} className="inline-flex min-h-8 items-center transition-colors hover:text-(--md-ink)">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={cn("truncate", last && "font-medium text-(--md-ink)")}>
                  {item.label}
                </span>
              )}
              {!last && <ChevronLeft aria-hidden className="size-3.5 shrink-0 opacity-60 ltr:rotate-180" />}
            </li>
          );
        })}
      </ol>
    </nav>
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
    <p className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span
        className={cn(
          "md-price",
          size === "sm" && "text-[0.875rem]",
          size === "md" && "text-[0.9375rem] sm:text-base",
          size === "lg" && "text-xl",
          size === "xl" && "text-[1.75rem] sm:text-[2rem]",
          onSale && "text-(--md-sale)",
        )}
      >
        {onSale && <span className="sr-only">السعر بعد الخصم: </span>}
        {formatPrice(price)}
      </span>
      {onSale && (
        <s className={cn("tabular-nums text-(--md-quiet) decoration-1", size === "xl" || size === "lg" ? "text-base" : "text-[0.8125rem]")}>
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
            className={cn(size === "sm" ? "size-3" : "size-4", i <= full ? "fill-(--md-star) text-(--md-star)" : "fill-(--md-line) text-(--md-line)")}
          />
        ))}
      </span>
      {count !== undefined && (
        <span aria-hidden className={cn("tabular-nums text-(--md-quiet)", size === "sm" ? "text-xs" : "text-sm")}>
          {value.toFixed(1)} ({num(count)})
        </span>
      )}
    </span>
  );
}

/** Small color dots under a product; unknown color names collapse into "+N". */
export function Swatches({ colors, max = 4, className }: { colors: string[]; max?: number; className?: string }) {
  const known = colors.map((c) => ({ label: c, color: swatchColor(c) })).filter((c) => c.color);
  if (colors.length === 0) return null;
  const shown = known.slice(0, max);
  const rest = colors.length - shown.length;
  return (
    <span className={cn("flex items-center gap-1.5", className)}>
      <span className="sr-only">الألوان المتاحة: {colors.join("، ")}</span>
      {shown.map((c) => (
        <span key={c.label} aria-hidden title={c.label} className="md-swatch size-3.5" style={{ background: c.color! }} />
      ))}
      {rest > 0 && (
        <span aria-hidden className="text-xs tabular-nums text-(--md-quiet)">
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
      <span aria-hidden className="absolute inset-0 grid place-items-center text-(--md-line-strong)">
        <ImageIcon className="size-[22%] max-w-12 min-w-5" strokeWidth={1.25} />
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
    <div className={cn("md-panel flex flex-col items-center px-6 py-14 text-center sm:py-20", className)}>
      <span className="grid size-16 place-items-center rounded-full bg-(--md-signal) text-(--md-signal-ink) [&_svg]:size-7">{icon}</span>
      <h2 className="md-h3 mt-5">{title}</h2>
      {description && <p className="mt-2 max-w-md text-[0.9375rem] leading-7 text-(--md-quiet)">{description}</p>}
      {action && <div className="mt-7 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}
