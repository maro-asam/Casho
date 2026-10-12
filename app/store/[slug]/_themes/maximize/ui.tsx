// ─────────────────────────────────────────────────────────────────────────────
//  Maximize theme — UI primitives (server-safe, no hooks)
// ─────────────────────────────────────────────────────────────────────────────

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ComponentProps, ReactNode } from "react";
import { ChevronLeft, ChevronsLeft, ImageIcon, Star } from "lucide-react";

import { cn, formatPrice } from "@/lib/utils";
import { swatchColor } from "../shared/colors";
import { discountPercent } from "../shared/commerce";

/** Classes for portal content (drawers, dialogs, popovers). */
export const MX_PORTAL = "store-theme-root theme-maximize mx-portal";

const nf = new Intl.NumberFormat("ar-EG");
export const num = (n: number) => nf.format(n);

export { discountPercent };

/** Stagger index for reveal / drawer animations. */
export const delay = (d: number) => ({ "--d": d }) as CSSProperties;
export const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

// ─── Buttons ────────────────────────────────────────────────────────────────

type BtnVariant = "solid" | "outline" | "soft" | "white";
type BtnSize = "sm" | "md" | "lg";

export function btn({
  variant = "solid",
  size = "md",
  full,
  icon,
  className,
}: { variant?: BtnVariant; size?: BtnSize; full?: boolean; icon?: boolean; className?: string } = {}) {
  return cn("mx-btn", `mx-btn--${variant}`, size !== "md" && `mx-btn--${size}`, full && "mx-btn--full", icon && "mx-btn--icon", className);
}

/** Chevron toward the reading end (used after "View all"). */
export function Chevron({ className, double }: { className?: string; double?: boolean }) {
  const Icon = double ? ChevronsLeft : ChevronLeft;
  return <Icon aria-hidden className={cn("size-[1.05em] shrink-0 ltr:rotate-180", className)} />;
}

// ─── Layout ─────────────────────────────────────────────────────────────────

export function Wrap({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-wrap", className)} {...props} />;
}

/** Section opener: eyebrow + bold title on the start side, actions and a
 *  "View all »" link on the end; or centered (Maximize's "Top Quality.
 *  Even Better Prices." headings). */
export function SectionHeader({
  eyebrow,
  title,
  href,
  linkLabel = "عرض الكل",
  center,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  linkLabel?: string;
  center?: boolean;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "mb-5 sm:mb-6",
        center ? "flex flex-col items-center text-center" : "flex flex-wrap items-end justify-between gap-x-6 gap-y-3",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && <p className="mx-eyebrow mb-1">{eyebrow}</p>}
        <h2 className="mx-h2 text-balance">{title}</h2>
      </div>
      {(href || actions) && (
        <div className={cn("flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2", center && "mt-3")}>
          {actions}
          {href && (
            <Link href={href} className="inline-flex min-h-10 items-center gap-1 text-[0.9375rem] font-semibold text-(--mx-link) hover:underline">
              {linkLabel}
              <Chevron double />
            </Link>
          )}
        </div>
      )}
    </header>
  );
}

export function Crumbs({ items, className }: { items: { label: string; href?: string }[]; className?: string }) {
  return (
    <nav aria-label="مسار التصفح" className={cn("min-w-0", className)}>
      <ol className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-[0.8125rem]">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className={cn("flex min-w-0 items-center gap-1.5", last && "min-w-0 flex-1")}>
              {item.href && !last ? (
                <Link href={item.href} className="inline-flex min-h-8 items-center text-(--mx-ink) underline underline-offset-4 hover:text-(--mx-link)">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className="truncate text-(--mx-text)">
                  {item.label}
                </span>
              )}
              {!last && <ChevronLeft aria-hidden className="size-3.5 shrink-0 text-(--mx-quiet) ltr:rotate-180" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Collection banner (Maximize's tinted strip with a centered title). With a
 *  photo it sits on the photo under a soft wash; without one it is a band in
 *  the brand tint. */
export function CollectionBanner({ title, note, image }: { title: string; note?: ReactNode; image?: string | null }) {
  return (
    <header className="relative mt-4 overflow-hidden rounded-(--mx-r-lg) bg-(--mx-tint) sm:mt-6">
      {image && (
        <>
          <Image src={image} alt="" fill priority sizes="100vw" className="object-cover" />
          <span aria-hidden className="absolute inset-0 bg-[color-mix(in_srgb,var(--mx-tint)_72%,transparent)]" />
        </>
      )}
      <div className="relative flex min-h-32 flex-col items-center justify-center px-5 py-8 text-center sm:min-h-40">
        <h1 className="mx-h1 text-balance text-(--mx-link)">{title}</h1>
        {note && <div className="mt-1.5 text-sm text-(--mx-link)">{note}</div>}
      </div>
    </header>
  );
}

// ─── Commerce ───────────────────────────────────────────────────────────────

export function Price({
  price,
  compareAt,
  size = "md",
  chip = true,
  className,
}: {
  price: number;
  compareAt?: number | null;
  size?: "sm" | "md" | "lg" | "xl";
  /** Show the "-32%" chip after a sale price. */
  chip?: boolean;
  className?: string;
}) {
  const off = discountPercent(price, compareAt);
  return (
    <p className={cn("flex flex-wrap items-center gap-x-2 gap-y-0.5", className)}>
      <span
        className={cn(
          "mx-price",
          size === "sm" && "text-[0.9375rem]",
          size === "md" && "text-[1.0625rem] sm:text-lg",
          size === "lg" && "text-[1.375rem]",
          size === "xl" && "text-[1.625rem] sm:text-[1.875rem]",
          off > 0 && "text-(--mx-sale)",
        )}
      >
        {off > 0 && <span className="sr-only">السعر بعد الخصم: </span>}
        {formatPrice(price)}
      </span>
      {off > 0 && (
        <>
          <s className={cn("mx-num font-semibold text-(--mx-text) decoration-1", size === "xl" || size === "lg" ? "text-base" : "text-[0.8125rem]")}>
            <span className="sr-only">السعر قبل الخصم: </span>
            {formatPrice(compareAt!)}
          </s>
          {chip && <span className="mx-chip-off">−{num(off)}٪</span>}
        </>
      )}
    </p>
  );
}

export function Rating({ value, count, size = "sm", className }: { value: number; count?: number; size?: "sm" | "md"; className?: string }) {
  const full = Math.round(value);
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className="sr-only">التقييم {value.toFixed(1)} من ٥</span>
      <span aria-hidden className="flex items-center gap-px">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(size === "sm" ? "size-3" : "size-4", i <= full ? "fill-(--mx-star) text-(--mx-star)" : "fill-(--mx-line) text-(--mx-line)")}
          />
        ))}
      </span>
      {count !== undefined && (
        <span aria-hidden className={cn("tabular-nums text-(--mx-quiet)", size === "sm" ? "text-xs" : "text-sm")}>
          ({num(count)})
        </span>
      )}
    </span>
  );
}

/** Ringed color swatches; unknown color names collapse into "+N". */
export function Swatches({ colors, max = 5, className }: { colors: string[]; max?: number; className?: string }) {
  if (colors.length === 0) return null;
  const known = colors.map((c) => ({ label: c, color: swatchColor(c) })).filter((c) => c.color);
  const shown = known.slice(0, max);
  const rest = colors.length - shown.length;
  return (
    <span className={cn("flex items-center gap-1.5", className)}>
      <span className="sr-only">الألوان المتاحة: {colors.join("، ")}</span>
      {shown.map((c) => (
        <span key={c.label} aria-hidden title={c.label} className="grid size-6 place-items-center rounded-full border border-(--mx-line)">
          <span className="mx-swatch size-4" style={{ background: c.color! }} />
        </span>
      ))}
      {rest > 0 && (
        <span aria-hidden className="text-xs tabular-nums text-(--mx-quiet)">
          {shown.length ? `+${num(rest)}` : `${num(colors.length)} ألوان`}
        </span>
      )}
    </span>
  );
}

/** "● In stock" / "● Low stock" / "● Out of stock" from real stock. */
export function StockLine({ stock, className }: { stock: number; className?: string }) {
  if (stock <= 0) return <span className={cn("mx-stock text-(--mx-quiet)", className)}>نفدت الكمية</span>;
  if (stock <= 5) return <span className={cn("mx-stock text-(--mx-low)", className)}>كمية قليلة</span>;
  return <span className={cn("mx-stock text-(--mx-stock)", className)}>متوفر</span>;
}

/** Image that fills its media box; without a src it shows a quiet glyph.
 *  `fit="contain"` treats it as a product shot on the grey plate. */
export function PlateImage({
  src,
  sizes,
  priority,
  className,
  alt = "",
  fit = "contain",
}: {
  src: string | null | undefined;
  sizes: string;
  priority?: boolean;
  className?: string;
  alt?: string;
  fit?: "contain" | "cover";
}) {
  if (!src || src.includes("product-placeholder")) {
    return (
      <span aria-hidden className="absolute inset-0 grid place-items-center text-(--mx-quiet) opacity-50">
        <ImageIcon className="size-[22%] min-w-5 max-w-12" strokeWidth={1.25} />
      </span>
    );
  }
  return <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className={cn(fit === "contain" ? "mx-product-img" : "object-cover", className)} />;
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
    <div className={cn("flex flex-col items-center rounded-(--mx-r-lg) border border-(--mx-line) px-6 py-14 text-center sm:py-20", className)}>
      <span className="grid size-14 place-items-center rounded-full bg-(--mx-tint) text-(--mx-link) [&_svg]:size-6">{icon}</span>
      <h2 className="mx-h3 mt-5">{title}</h2>
      {description && <p className="mt-2 max-w-md text-[0.9375rem] leading-7 text-(--mx-quiet)">{description}</p>}
      {action && <div className="mt-7 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}
