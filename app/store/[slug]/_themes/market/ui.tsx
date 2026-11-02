// ─────────────────────────────────────────────────────────────────────────────
//  Casho Market theme — UI primitives (server-safe, no hooks)
// ─────────────────────────────────────────────────────────────────────────────

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ComponentProps, ReactNode } from "react";
import { ArrowLeft, ChevronLeft, ShoppingBasket, Star } from "lucide-react";

import { cn, formatPrice } from "@/lib/utils";
import { swatchColor } from "../shared/colors";
import { discountPercent } from "../shared/commerce";
import { aisleOf, CategoryIcon } from "./lib/category-icon";
import { isVariety } from "./lib/market";

/** Classes for portal content (drawers, dialogs, popovers). */
export const MK_PORTAL = "store-theme-root theme-market mk-portal";

const nf = new Intl.NumberFormat("ar-EG");
export const num = (n: number) => nf.format(n);
const nf2 = new Intl.NumberFormat("ar-EG", { minimumIntegerDigits: 2 });
/** Two-digit Arabic numerals ("٠١"). */
export const num2 = (n: number) => nf2.format(n);
/** Delivery time in natural Arabic ("يوم واحد", "يومين", "٣ أيام", "١٤ يوم"). */
export const days = (n: number) => (n === 1 ? "يوم واحد" : n === 2 ? "يومين" : n <= 10 ? `${num(n)} أيام` : `${num(n)} يوم`);

export { discountPercent, isVariety };

/** Option labels on product pages and cart rows. */
export const OPTION_LABEL: Record<string, string> = { size: "الحجم", color: "اللون" };

/** "اللون: أحمر" / "النوع: فراولة" for a chosen option on cart rows. */
export function featureLabel(key: string, value: string) {
  return `${key === "color" && isVariety([value]) ? "النوع" : (OPTION_LABEL[key] ?? key)}: ${value}`;
}

/** Stagger index for reveal / drawer animations. */
export const delay = (d: number) => ({ "--d": d }) as CSSProperties;
export const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

// ─── Buttons ────────────────────────────────────────────────────────────────

type BtnVariant = "solid" | "outline" | "soft" | "tint" | "white" | "ghost-light" | "wa";
type BtnSize = "sm" | "md" | "lg";

export function btn({
  variant = "solid",
  size = "md",
  full,
  icon,
  className,
}: { variant?: BtnVariant; size?: BtnSize; full?: boolean; icon?: boolean; className?: string } = {}) {
  return cn("mk-btn", `mk-btn--${variant}`, size !== "md" && `mk-btn--${size}`, full && "mk-btn--full", icon && "mk-btn--icon", className);
}

/** Chevron toward the reading end (used after "View all"). */
export function Chevron({ className }: { className?: string }) {
  return <ChevronLeft aria-hidden className={cn("size-[1.05em] shrink-0 ltr:rotate-180", className)} />;
}

/** Arrow toward the reading end; slides forward when its button is hovered. */
export function Arrow({ className }: { className?: string }) {
  return <ArrowLeft aria-hidden className={cn("mk-arrow-icon ltr:rotate-180", className)} />;
}

// ─── Layout ─────────────────────────────────────────────────────────────────

export function Wrap({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mk-wrap", className)} {...props} />;
}

/** Section opener: a large title on the start side; "View all" and actions on
 *  the end. */
export function SectionHeader({
  title,
  sub,
  href,
  linkLabel = "عرض الكل",
  actions,
  className,
}: {
  title: string;
  sub?: string;
  href?: string;
  linkLabel?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mk-head", className)}>
      <div className="min-w-0">
        <h2 className="mk-h2 text-balance">{title}</h2>
        {sub && <p className="mk-sub">{sub}</p>}
      </div>
      {(href || actions) && (
        <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2">
          {actions}
          {href && (
            <Link href={href} className="mk-link text-sm">
              {linkLabel}
              <Chevron />
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
                <Link href={item.href} className="inline-flex min-h-8 items-center text-(--mk-label-2) underline-offset-4 hover:text-(--mk-tint) hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className="truncate font-bold text-(--mk-ink)">
                  {item.label}
                </span>
              )}
              {!last && <ChevronLeft aria-hidden className="size-3.5 shrink-0 text-(--mk-label-2) ltr:rotate-180" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Page header: quiet breadcrumbs over a large title, with the category's art
 *  beside it when it has any. */
export function PageHead({
  title,
  note,
  crumbs,
  image,
  iconFor,
  children,
}: {
  title: string;
  note?: ReactNode;
  crumbs?: { label: string; href?: string }[];
  image?: string | null;
  /** Category name: shows its aisle icon when there's no photo. */
  iconFor?: string;
  children?: ReactNode;
}) {
  return (
    <header className="mk-pagehead">
      {crumbs && <Crumbs items={crumbs} />}
      <div className="mt-3 flex items-center gap-4">
        {image ? (
          <span className="mk-aisle-art relative size-16 shrink-0 overflow-hidden sm:size-20">
            <Image src={image} alt="" fill sizes="5rem" priority className="object-cover" />
          </span>
        ) : iconFor ? (
          <AisleArt name={iconFor} className="size-16 shrink-0 sm:size-20" />
        ) : null}
        <div className="min-w-0 flex-1">
          <h1 className="mk-h1 text-balance">{title}</h1>
          {note && <div className="mt-1 max-w-3xl text-[0.9375rem] leading-6 text-(--mk-label-2)">{note}</div>}
        </div>
      </div>
      {children}
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
  /** Show the "خصم X٪" chip after the prices. */
  chip?: boolean;
  /** Prefix "من" (wholesale tiers start lower). */
  from?: boolean;
  className?: string;
}) {
  const off = discountPercent(price, compareAt);
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span
        className={cn(
          "mk-price",
          size === "sm" && "text-[0.9375rem]",
          size === "md" && "text-[1.0625rem] sm:text-lg",
          size === "lg" && "text-2xl",
          size === "xl" && "text-[2rem] sm:text-[2.5rem]",
        )}
      >
        {off > 0 && <span className="sr-only">السعر بعد الخصم: </span>}
        {from && "من "}
        {formatPrice(price)}
      </span>
      {off > 0 && (
        <>
          <s className={cn("mk-num text-(--mk-label-2) decoration-1", size === "xl" || size === "lg" ? "text-base" : "text-[0.8125rem]")}>
            <span className="sr-only">السعر قبل الخصم: </span>
            {formatPrice(compareAt!)}
          </s>
          {chip && <span className="mk-chip-off self-center">خصم {num(off)}٪</span>}
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
          <Star key={i} className={cn(size === "sm" ? "size-3" : "size-4", i <= full ? "fill-(--mk-star) text-(--mk-star)" : "fill-(--mk-fill) text-(--mk-fill)")} />
        ))}
      </span>
      {count !== undefined && (
        <span aria-hidden className={cn("tabular-nums text-(--mk-label-2)", size === "sm" ? "text-xs" : "text-sm")}>
          ({num(count)})
        </span>
      )}
    </span>
  );
}

/** Round swatches with the color names in a tooltip; unknown names collapse into "+N". */
export function Swatches({ colors, max = 5, className }: { colors: string[]; max?: number; className?: string }) {
  if (isVariety(colors)) return null;
  const known = colors.map((c) => ({ label: c, color: swatchColor(c) })).filter((c) => c.color);
  if (known.length === 0) return null;
  const shown = known.slice(0, max);
  const rest = colors.length - shown.length;
  return (
    <span className={cn("flex flex-wrap items-center gap-1", className)}>
      <span className="sr-only">الألوان المتاحة: {colors.join("، ")}</span>
      {shown.map((c) => (
        <span key={c.label} aria-hidden title={c.label} className="mk-swatch size-3.5" style={{ background: c.color! }} />
      ))}
      {rest > 0 && (
        <span aria-hidden className="text-xs tabular-nums text-(--mk-label-2)">
          +{num(rest)}
        </span>
      )}
    </span>
  );
}

/** "متوفر" / "كمية محدودة" / "غير متوفر حاليًا" from real stock. */
export function StockLine({ stock, count, className }: { stock: number; /** Show the real unit count. */ count?: boolean; className?: string }) {
  if (stock <= 0) return <p className={cn("mk-stock text-(--mk-label-2)", className)}>غير متوفر حاليًا</p>;
  if (stock <= 5) return <p className={cn("mk-stock text-(--mk-low)", className)}>كمية محدودة{count ? ` — باقي ${num(stock)} بس` : ""}</p>;
  return <p className={cn("mk-stock text-(--mk-ok)", className)}>متوفر{count ? ` (${num(stock)} قطعة)` : ""}</p>;
}

/** Image that fills its media box; without a src it shows a quiet basket.
 *  `fit="contain"` treats it as a pack shot on the light plate. */
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
      <span aria-hidden className="absolute inset-0 grid place-items-center text-[#8e8e93] opacity-50">
        <ShoppingBasket className="size-[26%] min-w-6 max-w-14" strokeWidth={1.5} />
      </span>
    );
  }
  return <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className={cn(fit === "contain" ? "mk-product-img" : "object-cover", className)} />;
}

/** An aisle as a home-screen app icon: a white glyph on its system color. */
export function AisleArt({ name, className }: { name: string; className?: string }) {
  const { tone } = aisleOf(name);
  return (
    <span aria-hidden data-tone={tone} className={cn("mk-aisle-art mk-aisle-glyph", className)}>
      <CategoryIcon name={name} strokeWidth={1.75} />
    </span>
  );
}

/** Category photo, or its aisle icon. */
export function CategoryArt({ name, image, sizes, className, priority }: { name: string; image: string | null; sizes: string; className?: string; priority?: boolean }) {
  if (image) return <Image src={image} alt="" fill sizes={sizes} priority={priority} className={cn("object-cover", className)} />;
  return <AisleArt name={name} className="absolute inset-0 !rounded-none" />;
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
    <div className={cn("flex flex-col items-center px-6 py-14 text-center text-(--mk-ink) sm:py-20", className)}>
      <span className="grid size-16 place-items-center rounded-full bg-(--mk-fill) text-(--mk-label-2) [&_svg]:size-7">{icon}</span>
      <h2 className="mk-h3 mt-5">{title}</h2>
      {description && <p className="mt-2 max-w-md text-[0.9375rem] leading-7 text-(--mk-label-2)">{description}</p>}
      {action && <div className="mt-7 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

/** Quiet note box (guidance, the supplement notice). */
export function Note({ icon, children, className }: { icon: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start gap-3 rounded-(--mk-r) bg-(--mk-cell) px-4 py-3.5 text-[0.8125rem] leading-6 text-(--mk-label-2)", className)}>
      <span className="mt-0.5 shrink-0 text-(--mk-tint) [&_svg]:size-[1.125rem]">{icon}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
