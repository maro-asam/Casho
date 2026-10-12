// ─────────────────────────────────────────────────────────────────────────────
//  Cello theme — UI primitives (server-safe, no hooks)
// ─────────────────────────────────────────────────────────────────────────────

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ComponentProps, ReactNode } from "react";
import { ChevronLeft, ChevronsLeft, ImageIcon, Star } from "lucide-react";

import { cn, formatPrice } from "@/lib/utils";
import { swatchColor } from "../shared/colors";
import { discountPercent } from "../shared/commerce";

/** Classes for portal content (drawers, dialogs, popovers). */
export const CE_PORTAL = "store-theme-root theme-cello ce-portal";

const nf = new Intl.NumberFormat("ar-EG");
export const num = (n: number) => nf.format(n);

export { discountPercent };

/** Stagger index for reveal / drawer animations. */
export const delay = (d: number) => ({ "--d": d }) as CSSProperties;
export const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

// ─── Buttons ────────────────────────────────────────────────────────────────

type BtnVariant = "solid" | "outline" | "soft" | "white" | "cta";
type BtnSize = "sm" | "md" | "lg";

export function btn({
  variant = "solid",
  size = "md",
  full,
  icon,
  className,
}: { variant?: BtnVariant; size?: BtnSize; full?: boolean; icon?: boolean; className?: string } = {}) {
  return cn("ce-btn", `ce-btn--${variant}`, size !== "md" && `ce-btn--${size}`, full && "ce-btn--full", icon && "ce-btn--icon", className);
}

/** Chevron toward the reading end (used after "View all"). */
export function Chevron({ className, double }: { className?: string; double?: boolean }) {
  const Icon = double ? ChevronsLeft : ChevronLeft;
  return <Icon aria-hidden className={cn("size-[1.05em] shrink-0 ltr:rotate-180", className)} />;
}

// ─── Layout ─────────────────────────────────────────────────────────────────

export function Wrap({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("ce-wrap", className)} {...props} />;
}

/** Section opener: title with an italic subtitle on the start side, an
 *  underlined "View all" link and actions on the end; or centered. */
export function SectionHeader({
  sub,
  title,
  href,
  linkLabel = "عرض الكل",
  center,
  actions,
  className,
}: {
  sub?: string;
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
        "mb-5 sm:mb-8",
        center ? "flex flex-col items-center text-center" : "flex flex-wrap items-end justify-between gap-x-6 gap-y-3",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="ce-h2 text-balance">{title}</h2>
        {sub && <p className="ce-sub">{sub}</p>}
      </div>
      {(href || actions) && (
        <div className={cn("flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2", center && "mt-3")}>
          {actions}
          {href && (
            <Link href={href} className="ce-link text-[0.9375rem] font-medium text-(--ce-ink)">
              {linkLabel}
            </Link>
          )}
        </div>
      )}
    </header>
  );
}

export function Crumbs({ items, className, tone = "dark" }: { items: { label: string; href?: string }[]; className?: string; tone?: "dark" | "light" }) {
  const light = tone === "light";
  return (
    <nav aria-label="مسار التصفح" className={cn("min-w-0", className)}>
      <ol className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-[0.8125rem]">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className={cn("flex min-w-0 items-center gap-1.5", last && "min-w-0 flex-1")}>
              {item.href && !last ? (
                <Link href={item.href} className={cn("inline-flex min-h-8 items-center hover:underline underline-offset-4", light ? "text-white" : "text-(--ce-ink)")}>
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={cn("truncate", light ? "text-white/85" : "text-(--ce-text)")}>
                  {item.label}
                </span>
              )}
              {!last && <ChevronLeft aria-hidden className={cn("size-3.5 shrink-0 ltr:rotate-180", light ? "text-white/80" : "text-(--ce-quiet)")} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Collection banner: a rounded photo band with breadcrumbs, the title and
 *  description in white on the start side. Without a photo it sits on navy. */
export function CollectionBanner({
  title,
  note,
  image,
  crumbs,
}: {
  title: string;
  note?: ReactNode;
  image?: string | null;
  crumbs?: { label: string; href?: string }[];
}) {
  return (
    <header className="relative mt-5 overflow-hidden rounded-(--ce-r-lg) bg-(--ce-navy) text-white sm:mt-7">
      {image && (
        <>
          <Image src={image} alt="" fill priority sizes="100vw" className="object-cover" />
          <span aria-hidden className="absolute inset-0 bg-[linear-gradient(to_left,rgb(0_16_48/0.72),rgb(0_16_48/0.25))] ltr:bg-[linear-gradient(to_right,rgb(0_16_48/0.72),rgb(0_16_48/0.25))]" />
        </>
      )}
      <div className="relative flex min-h-40 flex-col justify-center px-5 py-7 sm:min-h-56 sm:px-8 sm:py-9">
        {crumbs && <Crumbs items={crumbs} tone="light" />}
        <h1 className="ce-h1 mt-3 text-balance !text-white">{title}</h1>
        {note && <div className="mt-2 max-w-3xl text-sm leading-7 text-white/90 sm:text-[0.9375rem]">{note}</div>}
      </div>
    </header>
  );
}

// ─── Commerce ───────────────────────────────────────────────────────────────

export function Price({
  price,
  compareAt,
  size = "md",
  chip = false,
  from,
  className,
}: {
  price: number;
  compareAt?: number | null;
  size?: "sm" | "md" | "lg" | "xl";
  /** Show the solid red "Sale" badge after the prices (product page). */
  chip?: boolean;
  /** Prefix "من" (wholesale tiers start lower). */
  from?: boolean;
  className?: string;
}) {
  const off = discountPercent(price, compareAt);
  return (
    <p className={cn("flex flex-wrap items-center gap-x-2 gap-y-0.5", className)}>
      <span
        className={cn(
          "ce-price",
          size === "sm" && "text-[0.9375rem]",
          size === "md" && "text-base sm:text-[1.0625rem]",
          size === "lg" && "text-[1.375rem]",
          size === "xl" && "text-[1.625rem] sm:text-[1.875rem]",
        )}
      >
        {off > 0 && <span className="sr-only">السعر بعد الخصم: </span>}
        {from && "من "}
        {formatPrice(price)}
      </span>
      {off > 0 && (
        <>
          <s className={cn("ce-num font-medium text-(--ce-sale) decoration-1", size === "xl" || size === "lg" ? "text-lg" : "text-[0.875rem]")}>
            <span className="sr-only">السعر قبل الخصم: </span>
            {formatPrice(compareAt!)}
          </s>
          {chip && <span className="ce-chip-off">خصم {num(off)}٪</span>}
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
            className={cn(size === "sm" ? "size-3" : "size-4", i <= full ? "fill-(--ce-star) text-(--ce-star)" : "fill-(--ce-line) text-(--ce-line)")}
          />
        ))}
      </span>
      {count !== undefined && (
        <span aria-hidden className={cn("tabular-nums text-(--ce-quiet)", size === "sm" ? "text-xs" : "text-sm")}>
          ({num(count)})
        </span>
      )}
    </span>
  );
}

/** "Color: Plum" with square swatches; unknown color names collapse into
 *  "+N". The first color is outlined like the reference's selected chip. */
export function Swatches({ colors, max = 6, className, label = true }: { colors: string[]; max?: number; className?: string; label?: boolean }) {
  if (colors.length === 0) return null;
  const known = colors.map((c) => ({ label: c, color: swatchColor(c) })).filter((c) => c.color);
  const shown = known.slice(0, max);
  const rest = colors.length - shown.length;
  return (
    <div className={cn("min-w-0", className)}>
      {label && (
        <p className="truncate text-[0.8125rem] text-(--ce-quiet)">
          اللون: <span className="text-(--ce-ink)">{colors[0]}</span>
        </p>
      )}
      <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <span className="sr-only">الألوان المتاحة: {colors.join("، ")}</span>
        {shown.map((c, i) => (
          <span
            key={c.label}
            aria-hidden
            title={c.label}
            className={cn("grid size-6 place-items-center rounded-[0.1875rem] border", i === 0 ? "border-(--ce-ink)" : "border-transparent")}
          >
            <span className="ce-swatch size-[1.125rem]" style={{ background: c.color! }} />
          </span>
        ))}
        {rest > 0 && (
          <span aria-hidden className="text-xs tabular-nums text-(--ce-quiet)">
            {shown.length ? `+${num(rest)}` : `${num(colors.length)} ألوان`}
          </span>
        )}
      </span>
    </div>
  );
}

/** "● In stock" / "● Low stock" / "● Out of stock" from real stock. */
export function StockLine({ stock, count, className }: { stock: number; /** Show the real unit count. */ count?: boolean; className?: string }) {
  const n = count ? ` (${num(stock)} قطعة)` : "";
  if (stock <= 0) return <p className={cn("ce-stock text-(--ce-quiet)", className)}>نفدت الكمية</p>;
  if (stock <= 5) return <p className={cn("ce-stock font-medium text-(--ce-low)", className)}>كمية قليلة{n}</p>;
  return <p className={cn("ce-stock font-medium text-(--ce-stock)", className)}>متوفر{n}</p>;
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
      <span aria-hidden className="absolute inset-0 grid place-items-center text-(--ce-quiet) opacity-50">
        <ImageIcon className="size-[22%] min-w-5 max-w-12" strokeWidth={1.25} />
      </span>
    );
  }
  return <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className={cn(fit === "contain" ? "ce-product-img" : "object-cover", className)} />;
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
    <div className={cn("flex flex-col items-center rounded-(--ce-r-lg) bg-(--ce-card) px-6 py-14 text-center sm:py-20", className)}>
      <span className="grid size-14 place-items-center rounded-full bg-(--ce-tint) text-(--ce-btn) [&_svg]:size-6">{icon}</span>
      <h2 className="ce-h3 mt-5">{title}</h2>
      {description && <p className="mt-2 max-w-md text-[0.9375rem] leading-7 text-(--ce-quiet)">{description}</p>}
      {action && <div className="mt-7 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}
