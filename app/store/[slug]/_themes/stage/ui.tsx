// ─────────────────────────────────────────────────────────────────────────────
//  Casho Stage theme — UI primitives (server-safe, no hooks)
// ─────────────────────────────────────────────────────────────────────────────

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ComponentProps, ReactNode } from "react";
import { ArrowLeft, ChevronLeft, ShoppingBag, Star } from "lucide-react";

import { cn, formatPrice } from "@/lib/utils";
import { swatchColor } from "../shared/colors";
import { discountPercent } from "../shared/commerce";
import { isVariety } from "./lib/stage";

/** Classes for portal content (drawers, dialogs, popovers). */
export const SG_PORTAL = "store-theme-root theme-stage sg-portal";

const nf = new Intl.NumberFormat("ar-EG");
export const num = (n: number) => nf.format(n);
const nf2 = new Intl.NumberFormat("ar-EG", { minimumIntegerDigits: 2 });
/** Two-digit Arabic numerals ("٠١"). */
export const num2 = (n: number) => nf2.format(n);
/** Delivery time in natural Arabic ("يوم واحد", "يومين", "٣ أيام", "١٤ يوم"). */
export const days = (n: number) => (n === 1 ? "يوم واحد" : n === 2 ? "يومين" : n <= 10 ? `${num(n)} أيام` : `${num(n)} يوم`);

export { discountPercent, isVariety };

/** Option labels on product pages and cart rows. */
export const OPTION_LABEL: Record<string, string> = { size: "المقاس", color: "اللون" };

/** "اللون: أسود" / "النوع: فانيليا" for a chosen option on cart rows. */
export function featureLabel(key: string, value: string) {
  return `${key === "color" && isVariety([value]) ? "النوع" : (OPTION_LABEL[key] ?? key)}: ${value}`;
}

/** Stagger index for reveal / menu animations. */
export const delay = (d: number) => ({ "--d": d }) as CSSProperties;
export const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

// ─── Buttons ────────────────────────────────────────────────────────────────

type BtnVariant = "solid" | "outline" | "gray" | "plain" | "white" | "wa";
type BtnSize = "sm" | "md" | "lg";

/** apple.com's capsules: one filled tint per view, everything else quieter. */
export function btn({
  variant = "solid",
  size = "md",
  full,
  icon,
  className,
}: { variant?: BtnVariant; size?: BtnSize; full?: boolean; icon?: boolean; className?: string } = {}) {
  return cn("sg-btn", `sg-btn--${variant}`, size !== "md" && `sg-btn--${size}`, full && "sg-btn--full", icon && "sg-btn--icon", className);
}

/** Chevron toward the reading end (used after "View all"). */
export function Chevron({ className }: { className?: string }) {
  return <ChevronLeft aria-hidden className={cn("size-[1em] shrink-0 ltr:rotate-180", className)} />;
}

/** Arrow toward the reading end; slides forward when its button is hovered. */
export function Arrow({ className }: { className?: string }) {
  return <ArrowLeft aria-hidden className={cn("sg-arrow-icon ltr:rotate-180", className)} />;
}

/** "اعرف أكثر ›" — apple.com's text link. */
export function MoreLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("sg-link", className)}>
      {children}
      <Chevron className="sg-link-chev" />
    </Link>
  );
}

// ─── Layout ─────────────────────────────────────────────────────────────────

export function Wrap({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("sg-wrap", className)} {...props} />;
}

/** A full-bleed band: the page, the light gray of apple.com's store, or night. */
export function Band({ tone = "page", className, ...props }: ComponentProps<"section"> & { tone?: "page" | "alt" | "night" }) {
  return <section data-tone={tone} className={cn("sg-band", className)} {...props} />;
}

/** apple.com store headline: the claim in ink, the rest of the sentence in
 *  gray ("الأحدث. شوف الجديد."). Links sit on the end. */
export function SectionHeader({
  title,
  tagline,
  href,
  linkLabel = "عرض الكل",
  actions,
  className,
}: {
  title: string;
  tagline?: string;
  href?: string;
  linkLabel?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("sg-head", className)}>
      <h2 className="sg-h2 sg-twotone text-balance">
        <span>{title}</span>
        {tagline && <> {tagline}</>}
      </h2>
      {(href || actions) && (
        <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2">
          {actions}
          {href && <MoreLink href={href}>{linkLabel}</MoreLink>}
        </div>
      )}
    </header>
  );
}

export function Crumbs({ items, className }: { items: { label: string; href?: string }[]; className?: string }) {
  return (
    <nav aria-label="مسار التصفح" className={cn("min-w-0", className)}>
      <ol className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className={cn("flex min-w-0 items-center gap-1.5", last && "min-w-0 flex-1")}>
              {item.href && !last ? (
                <Link href={item.href} className="inline-flex min-h-8 items-center text-(--sg-label-2) underline-offset-4 hover:text-(--sg-ink) hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className="truncate text-(--sg-ink)">
                  {item.label}
                </span>
              )}
              {!last && <ChevronLeft aria-hidden className="size-3 shrink-0 text-(--sg-label-3) ltr:rotate-180" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Page header: quiet breadcrumbs over apple.com's huge two-tone title. */
export function PageHead({
  title,
  tagline,
  note,
  crumbs,
  children,
  className,
}: {
  title: string;
  /** Gray continuation of the title ("كل المنتجات. اختار اللي يناسبك."). */
  tagline?: string;
  note?: ReactNode;
  crumbs?: { label: string; href?: string }[];
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("sg-pagehead", className)}>
      {crumbs && <Crumbs items={crumbs} className="mb-4" />}
      <h1 className="sg-h1 sg-twotone text-balance">
        <span>{title}</span>
        {tagline && <> {tagline}</>}
      </h1>
      {note && <div className="mt-3 max-w-3xl text-[1.0625rem] leading-7 text-(--sg-label-2)">{note}</div>}
      {children}
    </header>
  );
}

/** "جديد" over a product name — apple.com's orange eyebrow. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("sg-eyebrow", className)}>{children}</p>;
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
  /** Show the "وفّر X٪" note after the prices. */
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
          "sg-price",
          size === "sm" && "text-sm",
          size === "md" && "text-[0.9375rem] sm:text-base",
          size === "lg" && "text-xl",
          size === "xl" && "text-[1.75rem] sm:text-[2rem]",
        )}
      >
        {off > 0 && <span className="sr-only">السعر بعد الخصم: </span>}
        {from && "من "}
        {formatPrice(price)}
      </span>
      {off > 0 && (
        <>
          <s className={cn("sg-num text-(--sg-label-2) decoration-1", size === "xl" || size === "lg" ? "text-base" : "text-[0.8125rem]")}>
            <span className="sr-only">السعر قبل الخصم: </span>
            {formatPrice(compareAt!)}
          </s>
          {chip && <span className="sg-save">وفّر {num(off)}٪</span>}
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
          <Star key={i} className={cn(size === "sm" ? "size-3" : "size-4", i <= full ? "fill-(--sg-ink) text-(--sg-ink)" : "fill-(--sg-fill) text-(--sg-fill)")} />
        ))}
      </span>
      {count !== undefined && (
        <span aria-hidden className={cn("tabular-nums text-(--sg-label-2)", size === "sm" ? "text-xs" : "text-sm")}>
          ({num(count)})
        </span>
      )}
    </span>
  );
}

/** Round swatches like apple.com's color dots; unknown names collapse into "+N". */
export function Swatches({ colors, max = 6, className }: { colors: string[]; max?: number; className?: string }) {
  if (isVariety(colors)) return null;
  const known = colors.map((c) => ({ label: c, color: swatchColor(c) })).filter((c) => c.color);
  if (known.length === 0) return null;
  const shown = known.slice(0, max);
  const rest = colors.length - shown.length;
  return (
    <span className={cn("flex flex-wrap items-center justify-[inherit] gap-1.5", className)}>
      <span className="sr-only">الألوان المتاحة: {colors.join("، ")}</span>
      {shown.map((c) => (
        <span key={c.label} aria-hidden title={c.label} className="sg-swatch size-3" style={{ background: c.color! }} />
      ))}
      {rest > 0 && (
        <span aria-hidden className="text-xs tabular-nums text-(--sg-label-2)">
          +{num(rest)}
        </span>
      )}
    </span>
  );
}

/** "متوفر" / "كمية محدودة" / "غير متوفر حاليًا" from real stock. */
export function StockLine({ stock, count, className }: { stock: number; /** Show the real unit count. */ count?: boolean; className?: string }) {
  if (stock <= 0) return <p className={cn("sg-stock text-(--sg-label-2)", className)}>غير متوفر حاليًا</p>;
  if (stock <= 5) return <p className={cn("sg-stock text-(--sg-low)", className)}>كمية محدودة{count ? ` — باقي ${num(stock)} بس` : ""}</p>;
  return <p className={cn("sg-stock text-(--sg-ok)", className)}>متوفر{count ? ` (${num(stock)} قطعة)` : ""}</p>;
}

/** Image that fills its media box; without a src a quiet bag stands in.
 *  `fit="contain"` keeps a cut-out product whole on its plate. */
export function PlateImage({
  src,
  sizes,
  priority,
  className,
  alt = "",
  fit = "cover",
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
      <span aria-hidden className="absolute inset-0 grid place-items-center text-(--sg-label-3)">
        <ShoppingBag className="size-[24%] min-w-6 max-w-14" strokeWidth={1.25} />
      </span>
    );
  }
  return <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className={cn(fit === "contain" ? "sg-product-img" : "object-cover", className)} />;
}

/** Category photo, or its initial set large on a soft gradient. */
export function CategoryArt({ name, image, sizes, className, priority }: { name: string; image: string | null; sizes: string; className?: string; priority?: boolean }) {
  if (image) return <Image src={image} alt="" fill sizes={sizes} priority={priority} className={cn("object-cover", className)} />;
  return (
    <span aria-hidden className="sg-monogram absolute inset-0">
      {[...name.trim()][0]}
    </span>
  );
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
    <div className={cn("flex flex-col items-center px-6 py-16 text-center text-(--sg-ink) sm:py-24", className)}>
      <span className="grid size-16 place-items-center text-(--sg-label-3) [&_svg]:size-12 [&_svg]:stroke-[1.25]">{icon}</span>
      <h2 className="sg-h3 mt-4">{title}</h2>
      {description && <p className="mt-2 max-w-md text-[1.0625rem] leading-7 text-(--sg-label-2)">{description}</p>}
      {action && <div className="mt-8 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

/** Quiet note box (guidance, delivery notes). */
export function Note({ icon, children, className }: { icon: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start gap-3 rounded-(--sg-r) bg-(--sg-alt) px-4 py-3.5 text-[0.8125rem] leading-6 text-(--sg-label-2)", className)}>
      <span className="mt-0.5 shrink-0 text-(--sg-ink) [&_svg]:size-[1.125rem]">{icon}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
