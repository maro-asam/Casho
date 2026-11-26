// ─────────────────────────────────────────────────────────────────────────────
//  Casho Bunn theme — UI primitives (server-safe, no hooks)
// ─────────────────────────────────────────────────────────────────────────────

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ComponentProps, ReactNode } from "react";
import { ArrowLeft, ChevronLeft, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { discountPercent, FEATURE_LABEL } from "../shared/commerce";
import { bunnArabic, bunnLatin } from "./fonts";
import { BeanIcon } from "./icons";
import { FAMILY_COLORS, ROAST_COLORS, optionKind, roastLabel, type Note, type RoastLevel } from "./lib/coffee";
import { formatPrice, lazyStoreIntl, st } from "@/lib/i18n/storefront";

/** Classes for portal content (drawers, dialogs, sheets) — they render outside
 *  the store root, so they carry the theme scope and its display fonts. */
export const BN_PORTAL = `store-theme-root theme-bunn bn-portal ${bunnArabic.variable} ${bunnLatin.variable}`;

const nf = lazyStoreIntl.number();
export const num = (n: number) => nf.format(n);
const nf2 = lazyStoreIntl.number({ minimumIntegerDigits: 2 });
/** Two-digit numerals ("٠١"). */
export const num2 = (n: number) => nf2.format(n);
const nf1 = lazyStoreIntl.number({ maximumFractionDigits: 1 });
/** Up to one decimal ("١٥٫٥"). */
export const num1 = (n: number) => nf1.format(n);
/** Delivery time in natural Arabic ("يوم واحد", "يومين", "٣ أيام", "١٤ يوم"). */
export const days = (n: number) => (n === 1 ? st("يوم واحد") : n === 2 ? st("يومين") : n <= 10 ? st("{0} أيام", num(n)) : st("{0} يوم", num(n)));

export { discountPercent };

/** What a product's sizes / colors are on a coffee store: a roast, a grind,
 *  a weight, plain or spiced — or plain sizes and colors. */
export function optionLabel(kind: "size" | "color", values: string[]) {
  const k = optionKind(values);
  if (k === "roast") return st("التحميص");
  if (k === "grind") return st("الطحنة");
  if (k === "weight") return st("الوزن");
  if (k === "spice") return st("النوع");
  return kind === "size" ? st("المقاس") : st("اللون");
}

/** "الطحنة: إسبريسو" / "التحميص: غامق" for a chosen option on cart rows. */
export function featureLabel(key: string, value: string) {
  const label = key === "size" || key === "color" ? optionLabel(key, [value]) : (FEATURE_LABEL[key] ?? key);
  return `${label}: ${value}`;
}

/** Stagger index for reveal / menu animations. */
export const delay = (d: number) => ({ "--d": d }) as CSSProperties;
export const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

// ─── Buttons ────────────────────────────────────────────────────────────────

type BtnVariant = "solid" | "outline" | "crema" | "light" | "ghost" | "wa";
type BtnSize = "sm" | "md" | "lg";

/** Espresso-filled, a hairline outline, crema for the one moment that
 *  deserves it, light on photos. */
export function btn({
  variant = "solid",
  size = "md",
  full,
  icon,
  className,
}: { variant?: BtnVariant; size?: BtnSize; full?: boolean; icon?: boolean; className?: string } = {}) {
  return cn("bn-btn", `bn-btn--${variant}`, size !== "md" && `bn-btn--${size}`, full && "bn-btn--full", icon && "bn-btn--icon", className);
}

export function Chevron({ className }: { className?: string }) {
  return <ChevronLeft aria-hidden className={cn("size-[1em] shrink-0 ltr:rotate-180", className)} />;
}

/** Arrow toward the reading end; travels a little when its link is hovered. */
export function Arrow({ className }: { className?: string }) {
  return <ArrowLeft aria-hidden className={cn("bn-arrow ltr:rotate-180", className)} />;
}

export function TextLink({ href, children, className, arrow = true }: { href: string; children: ReactNode; className?: string; arrow?: boolean }) {
  return (
    <Link href={href} className={cn("bn-link", className)}>
      <span className="bn-underline">{children}</span>
      {arrow && <Arrow />}
    </Link>
  );
}

// ─── Layout ─────────────────────────────────────────────────────────────────

export function Wrap({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("bn-wrap", className)} {...props} />;
}

/** A full-bleed band: the kraft page, oat, or espresso. */
export function Band({ tone = "page", className, ...props }: ComponentProps<"section"> & { tone?: "page" | "alt" | "espresso" }) {
  return <section data-tone={tone} className={cn("bn-band", className)} {...props} />;
}

/** A small bean between two dashes — the label's divider. */
export function Divider({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("bn-divider", className)}>
      <i />
      <BeanIcon />
      <i />
    </span>
  );
}

export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("bn-kicker", className)}>{children}</p>;
}

/** Section head: the kicker with its bean, the bold title, a note and
 *  "عرض الكل" — on the start by default, or centered. */
export function SectionHead({
  kicker,
  title,
  note,
  href,
  linkLabel = st("عرض الكل"),
  align = "start",
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
    <header className={cn("bn-head", className)} data-align={align}>
      <div className="bn-head-copy">
        {kicker && <Kicker className="bn-reveal">{kicker}</Kicker>}
        <h2 className="bn-h2 bn-reveal text-balance" style={delay(1)}>
          {title}
        </h2>
        {note && (
          <p className="bn-note bn-reveal text-balance" style={delay(2)}>
            {note}
          </p>
        )}
      </div>
      {(href || actions) && (
        <div className="bn-head-actions">
          {actions}
          {href && <TextLink href={href}>{linkLabel}</TextLink>}
        </div>
      )}
    </header>
  );
}

export function Crumbs({ items, className }: { items: { label: string; href?: string }[]; className?: string }) {
  return (
    <nav aria-label={st("مسار التصفح")} className={cn("min-w-0", className)}>
      <ol className="bn-crumbs">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className={cn("flex min-w-0 items-center gap-2", last && "min-w-0 flex-1")}>
              {item.href && !last ? (
                <Link href={item.href} className="inline-flex min-h-8 items-center hover:text-(--bn-ink)">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className="truncate text-(--bn-ink)">
                  {item.label}
                </span>
              )}
              {!last && <span aria-hidden className="bn-crumb-sep">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Page header: quiet breadcrumbs, the kicker, a bold title and a note. */
export function PageHead({
  kicker,
  title,
  note,
  crumbs,
  children,
  align = "start",
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
    <header className={cn("bn-pagehead", className)} data-align={align}>
      {crumbs && <Crumbs items={crumbs} className="bn-pagehead-crumbs" />}
      {kicker && <Kicker>{kicker}</Kicker>}
      <h1 className="bn-h1 text-balance">{title}</h1>
      {note && <div className="bn-note">{note}</div>}
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
  save?: boolean;
  from?: boolean;
  className?: string;
}) {
  const off = discountPercent(price, compareAt);
  return (
    <p className={cn("bn-pricebox", className)} data-size={size}>
      <span className={cn("bn-price", off > 0 && "bn-price--sale")}>
        {off > 0 && <span className="sr-only">{st("السعر بعد الخصم:")}{" "}</span>}
        {from && st("من ")}
        {formatPrice(price)}
      </span>
      {off > 0 && (
        <>
          <s className="bn-was">
            <span className="sr-only">{st("السعر قبل الخصم:")}{" "}</span>
            {formatPrice(compareAt!)}
          </s>
          {save && <span className="bn-save">{st("وفّر {0}٪", num(off))}</span>}
        </>
      )}
    </p>
  );
}

export function Rating({ value, count, size = "sm", className }: { value: number; count?: number; size?: "sm" | "md"; className?: string }) {
  const full = Math.round(value);
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="sr-only">{st("التقييم {0} من ٥", value.toFixed(1))}</span>
      <span aria-hidden className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className={cn(size === "sm" ? "size-3" : "size-4", i <= full ? "fill-(--bn-crema) text-(--bn-crema)" : "fill-transparent text-(--bn-ink-3)")} strokeWidth={1.5} />
        ))}
      </span>
      {count !== undefined && (
        <span aria-hidden className={cn("bn-num text-(--bn-ink-2)", size === "sm" ? "text-xs" : "text-sm")}>
          ({num(count)})
        </span>
      )}
    </span>
  );
}

/** Five beans from light to dark, filled up to the roast — the label's meter. */
export function RoastMeter({ level, size = "sm", label, className }: { level: RoastLevel; size?: "sm" | "md" | "lg"; label?: boolean; className?: string }) {
  return (
    <span className={cn("bn-roast", className)} data-size={size}>
      <span className="sr-only">{st("التحميص: {0}", roastLabel(level))}</span>
      <span aria-hidden className="bn-roast-beans">
        {([1, 2, 3, 4, 5] as RoastLevel[]).map((i) => (
          <i key={i} data-on={i <= level || undefined} style={{ ["--bean" as string]: ROAST_COLORS[i] }} />
        ))}
      </span>
      {label && (
        <span aria-hidden className="bn-roast-label">
          {roastLabel(level)}
        </span>
      )}
    </span>
  );
}

/** Tasting notes as dots in their flavor family's color. */
export function Notes({ notes, max = 3, chips, className }: { notes: Note[]; max?: number; chips?: boolean; className?: string }) {
  if (notes.length === 0) return null;
  return (
    <ul className={cn(chips ? "bn-chips" : "bn-notes", className)} aria-label={st("النكهات")}>
      {notes.slice(0, max).map((n) => (
        <li key={n.label} style={{ ["--note" as string]: FAMILY_COLORS[n.family] }}>
          <i aria-hidden />
          {n.label}
        </li>
      ))}
    </ul>
  );
}

/** "متوفر" / "كمية محدودة" / "خلص" from real stock. */
export function StockLine({ stock, count, className }: { stock: number; count?: boolean; className?: string }) {
  if (stock <= 0)
    return (
      <p className={cn("bn-stock", className)} data-level="out">
        {st("خلص من المخزن حاليًا")}
      </p>
    );
  if (stock <= 5)
    return (
      <p className={cn("bn-stock", className)} data-level="low">
        {st("كمية محدودة")}{count ? st(" — باقي {0} بس", num(stock)) : ""}
      </p>
    );
  return (
    <p className={cn("bn-stock", className)} data-level="ok">
      {st("متوفر وجاهز للطلب")}
    </p>
  );
}

/** Product photo filling its plate; without one, a bean stands in. */
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
      <span aria-hidden className="absolute inset-0 grid place-items-center text-(--bn-ink-3)">
        <BeanIcon className="size-[24%] min-w-6 max-w-12" strokeWidth={1.1} />
      </span>
    );
  }
  return <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className={cn(fit === "contain" ? "object-contain p-[6%]" : "object-cover", className)} />;
}

/** Category photo, or its initial set as a stamp. */
export function CategoryArt({ name, image, sizes, className, priority }: { name: string; image: string | null; sizes: string; className?: string; priority?: boolean }) {
  if (image) return <Image src={image} alt="" fill sizes={sizes} priority={priority} className={cn("object-cover", className)} />;
  return (
    <span aria-hidden className="bn-monogram absolute inset-0">
      {[...name.trim()][0]}
    </span>
  );
}

// ─── States ─────────────────────────────────────────────────────────────────

export function Empty({ icon, title, description, action, className }: { icon: ReactNode; title: string; description?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-16 text-center sm:py-24", className)}>
      <span className="bn-empty-icon">{icon}</span>
      <h2 className="bn-h3 mt-6">{title}</h2>
      {description && <p className="mt-3 max-w-md text-[0.9375rem] leading-7 text-(--bn-ink-2)">{description}</p>}
      {action && <div className="mt-8 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

export function Notice({ icon, children, className }: { icon: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("bn-notebox", className)}>
      <span className="mt-0.5 shrink-0 text-(--bn-crema-ink) [&_svg]:size-[1.125rem]">{icon}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
