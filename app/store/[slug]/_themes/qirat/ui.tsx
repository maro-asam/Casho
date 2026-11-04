// ─────────────────────────────────────────────────────────────────────────────
//  Casho Qirat theme — UI primitives (server-safe, no hooks)
// ─────────────────────────────────────────────────────────────────────────────

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ComponentProps, ReactNode } from "react";
import { ArrowLeft, ChevronLeft, Gem, Star } from "lucide-react";

import { cn, formatPrice } from "@/lib/utils";
import { discountPercent } from "../shared/commerce";
import { qiratArabic, qiratLatin } from "./fonts";
import { isMetalOption, isVariety, swatchFill } from "./lib/qirat";

/** Classes for portal content (drawers, dialogs, sheets) — they render outside
 *  the store root, so they carry the theme scope and its display fonts. */
export const QR_PORTAL = `store-theme-root theme-qirat qr-portal ${qiratArabic.variable} ${qiratLatin.variable}`;

const nf = new Intl.NumberFormat("ar-EG");
export const num = (n: number) => nf.format(n);
const nf2 = new Intl.NumberFormat("ar-EG", { minimumIntegerDigits: 2 });
/** Two-digit Arabic numerals ("٠١"). */
export const num2 = (n: number) => nf2.format(n);
/** Delivery time in natural Arabic ("يوم واحد", "يومين", "٣ أيام", "١٤ يوم"). */
export const days = (n: number) => (n === 1 ? "يوم واحد" : n === 2 ? "يومين" : n <= 10 ? `${num(n)} أيام` : `${num(n)} يوم`);

export { discountPercent, isMetalOption, isVariety };

/** Option label on product pages and cart rows: metals read "المعدن",
 *  scents and stones "النوع". */
export function optionLabel(kind: "size" | "color", values: string[]) {
  if (kind === "size") return "المقاس";
  if (isMetalOption(values)) return "المعدن";
  if (isVariety(values)) return "النوع";
  return "اللون";
}

/** "المعدن: ذهبي" / "المقاس: ١٧" for a chosen option on cart rows. */
export function featureLabel(key: string, value: string) {
  const label = key === "color" ? optionLabel("color", [value]) : key === "size" ? "المقاس" : key;
  return `${label}: ${value}`;
}

/** Stagger index for reveal / menu animations. */
export const delay = (d: number) => ({ "--d": d }) as CSSProperties;
export const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

// ─── Buttons ────────────────────────────────────────────────────────────────

type BtnVariant = "solid" | "outline" | "gold" | "light" | "ghost" | "wa";
type BtnSize = "sm" | "md" | "lg";

/** The jeweler's buttons: ink filled with a gold glint, a hairline outline,
 *  gold for the one moment that deserves it, light on photos. */
export function btn({
  variant = "solid",
  size = "md",
  full,
  icon,
  className,
}: { variant?: BtnVariant; size?: BtnSize; full?: boolean; icon?: boolean; className?: string } = {}) {
  return cn("qr-btn", `qr-btn--${variant}`, size !== "md" && `qr-btn--${size}`, full && "qr-btn--full", icon && "qr-btn--icon", className);
}

/** Chevron toward the reading end. */
export function Chevron({ className }: { className?: string }) {
  return <ChevronLeft aria-hidden className={cn("size-[1em] shrink-0 ltr:rotate-180", className)} />;
}

/** Arrow toward the reading end; travels a little when its link is hovered. */
export function Arrow({ className }: { className?: string }) {
  return <ArrowLeft aria-hidden className={cn("qr-arrow ltr:rotate-180", className)} />;
}

/** Text link whose underline draws in from the start on hover. */
export function TextLink({ href, children, className, arrow = true }: { href: string; children: ReactNode; className?: string; arrow?: boolean }) {
  return (
    <Link href={href} className={cn("qr-link", className)}>
      <span className="qr-underline">{children}</span>
      {arrow && <Arrow />}
    </Link>
  );
}

// ─── Layout ─────────────────────────────────────────────────────────────────

export function Wrap({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("qr-wrap", className)} {...props} />;
}

/** A full-bleed band: the pearl page, champagne, or velvet (the display case). */
export function Band({ tone = "page", className, ...props }: ComponentProps<"section"> & { tone?: "page" | "alt" | "velvet" }) {
  return <section data-tone={tone} className={cn("qr-band", className)} {...props} />;
}

/** Two hairlines and a diamond — the theme's one ornament. */
export function Ornament({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("qr-orn", className)}>
      <i />
      <b />
      <i />
    </span>
  );
}

/** Small gold label over a title. */
export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("qr-kicker", className)}>{children}</p>;
}

/** Section head: a gold kicker, the serif title, the ornament under it, and
 *  "عرض الكل" — centered by default, or on the start with the link at the end. */
export function SectionHead({
  kicker,
  title,
  note,
  href,
  linkLabel = "عرض الكل",
  align = "center",
  actions,
  className,
}: {
  kicker?: string;
  title: string;
  note?: string;
  href?: string;
  linkLabel?: string;
  align?: "center" | "start";
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("qr-head", className)} data-align={align}>
      <div className="qr-head-copy">
        {kicker && <Kicker className="qr-reveal">{kicker}</Kicker>}
        <h2 className="qr-h2 qr-reveal text-balance" style={delay(1)}>
          {title}
        </h2>
        {align === "center" && <Ornament className="qr-reveal mt-4" />}
        {note && (
          <p className="qr-note qr-reveal text-balance" style={delay(2)}>
            {note}
          </p>
        )}
      </div>
      {(href || actions) && (
        <div className="qr-head-actions">
          {actions}
          {href && <TextLink href={href}>{linkLabel}</TextLink>}
        </div>
      )}
    </header>
  );
}

export function Crumbs({ items, className }: { items: { label: string; href?: string }[]; className?: string }) {
  return (
    <nav aria-label="مسار التصفح" className={cn("min-w-0", className)}>
      <ol className="qr-crumbs">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className={cn("flex min-w-0 items-center gap-2", last && "min-w-0 flex-1")}>
              {item.href && !last ? (
                <Link href={item.href} className="inline-flex min-h-8 items-center hover:text-(--qr-ink)">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className="truncate text-(--qr-ink)">
                  {item.label}
                </span>
              )}
              {!last && <span aria-hidden className="qr-crumb-dot" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Page header: quiet breadcrumbs, a centered serif title, the ornament. */
export function PageHead({
  kicker,
  title,
  note,
  crumbs,
  children,
  align = "center",
  className,
}: {
  kicker?: string;
  title: string;
  note?: ReactNode;
  crumbs?: { label: string; href?: string }[];
  children?: ReactNode;
  align?: "center" | "start";
  className?: string;
}) {
  return (
    <header className={cn("qr-pagehead", className)} data-align={align}>
      {crumbs && <Crumbs items={crumbs} className="qr-pagehead-crumbs" />}
      {kicker && <Kicker>{kicker}</Kicker>}
      <h1 className="qr-h1 text-balance">{title}</h1>
      {align === "center" && <Ornament className="mt-4" />}
      {note && <div className="qr-note">{note}</div>}
      {children}
    </header>
  );
}

// ─── Commerce ───────────────────────────────────────────────────────────────

export function Price({
  price,
  compareAt,
  size = "md",
  save = false,
  from,
  className,
}: {
  price: number;
  compareAt?: number | null;
  size?: "sm" | "md" | "lg" | "xl";
  /** Show "وفّر X٪" after the prices. */
  save?: boolean;
  /** Prefix "من" (wholesale tiers start lower). */
  from?: boolean;
  className?: string;
}) {
  const off = discountPercent(price, compareAt);
  return (
    <p className={cn("qr-pricebox", className)} data-size={size}>
      <span className={cn("qr-price", off > 0 && "qr-price--sale")}>
        {off > 0 && <span className="sr-only">السعر بعد الخصم: </span>}
        {from && "من "}
        {formatPrice(price)}
      </span>
      {off > 0 && (
        <>
          <s className="qr-was">
            <span className="sr-only">السعر قبل الخصم: </span>
            {formatPrice(compareAt!)}
          </s>
          {save && <span className="qr-save">وفّر {num(off)}٪</span>}
        </>
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
          <Star key={i} className={cn(size === "sm" ? "size-3" : "size-4", i <= full ? "fill-(--qr-gold) text-(--qr-gold)" : "fill-transparent text-(--qr-ink-3)")} strokeWidth={1.25} />
        ))}
      </span>
      {count !== undefined && (
        <span aria-hidden className={cn("qr-num text-(--qr-ink-2)", size === "sm" ? "text-xs" : "text-sm")}>
          ({num(count)})
        </span>
      )}
    </span>
  );
}

/** Small metal / color dots; metals get their polished finish. */
export function Swatches({ colors, max = 5, className }: { colors: string[]; max?: number; className?: string }) {
  if (isVariety(colors)) return null;
  const known = colors.map((c) => ({ label: c, fill: swatchFill(c) })).filter((c) => c.fill);
  if (known.length === 0) return null;
  const shown = known.slice(0, max);
  const rest = colors.length - shown.length;
  return (
    <span className={cn("qr-swatches", className)}>
      <span className="sr-only">
        {isMetalOption(colors) ? "المعادن المتاحة" : "الألوان المتاحة"}: {colors.join("، ")}
      </span>
      {shown.map((c) => (
        <span key={c.label} aria-hidden title={c.label} className="qr-swatch" style={{ background: c.fill! }} />
      ))}
      {rest > 0 && (
        <span aria-hidden className="qr-num text-[0.6875rem] text-(--qr-ink-2)">
          +{num(rest)}
        </span>
      )}
    </span>
  );
}

/** "متوفرة" / "قطع محدودة" / "نفدت" from real stock. */
export function StockLine({ stock, count, className }: { stock: number; /** Show the real units left. */ count?: boolean; className?: string }) {
  if (stock <= 0)
    return (
      <p className={cn("qr-stock", className)} data-level="out">
        نفدت الكمية حاليًا
      </p>
    );
  if (stock <= 5)
    return (
      <p className={cn("qr-stock", className)} data-level="low">
        قطع محدودة{count ? ` — باقي ${num(stock)} بس` : ""}
      </p>
    );
  return (
    <p className={cn("qr-stock", className)} data-level="ok">
      متوفرة وجاهزة للطلب
    </p>
  );
}

/** Product photo filling its plate; without one, a quiet gem stands in. */
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
      <span aria-hidden className="absolute inset-0 grid place-items-center text-(--qr-ink-3)">
        <Gem className="size-[22%] min-w-6 max-w-12" strokeWidth={1} />
      </span>
    );
  }
  return <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className={cn(fit === "contain" ? "object-contain p-[6%]" : "object-cover", className)} />;
}

/** Category photo, or its initial set as a serif monogram. */
export function CategoryArt({ name, image, sizes, className, priority }: { name: string; image: string | null; sizes: string; className?: string; priority?: boolean }) {
  if (image) return <Image src={image} alt="" fill sizes={sizes} priority={priority} className={cn("object-cover", className)} />;
  return (
    <span aria-hidden className="qr-monogram absolute inset-0">
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
    <div className={cn("flex flex-col items-center px-6 py-16 text-center sm:py-24", className)}>
      <span className="qr-empty-icon">{icon}</span>
      <h2 className="qr-h3 mt-6">{title}</h2>
      <Ornament className="mt-4" />
      {description && <p className="mt-4 max-w-md text-[0.9375rem] leading-7 text-(--qr-ink-2)">{description}</p>}
      {action && <div className="mt-8 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

/** Quiet note (guidance, delivery notes). */
export function Note({ icon, children, className }: { icon: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("qr-notebox", className)}>
      <span className="mt-0.5 shrink-0 text-(--qr-gold-ink) [&_svg]:size-[1.125rem]">{icon}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
