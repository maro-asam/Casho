// ─────────────────────────────────────────────────────────────────────────────
//  Casho Arena theme — UI primitives (server-safe, no hooks)
// ─────────────────────────────────────────────────────────────────────────────

import Image from "next/image";
import Link from "next/link";
import { createElement, type CSSProperties, type ComponentProps, type HTMLAttributes, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Gamepad2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { discountPercent, FEATURE_LABEL } from "../shared/commerce";
import type { CategoryLink, ProductCardData } from "../types";
import { arenaDisplay } from "./fonts";
import { formatPrice, lazyStoreIntl, st, storeCurrency, storeNumberFormat } from "@/lib/i18n/storefront";

/** Classes for portal content (sheets, dialogs). */
export const AN_PORTAL = `store-theme-root theme-arena an-portal ${arenaDisplay.variable}`;

const nf = lazyStoreIntl.number();
export const num = (n: number) => nf.format(n);

/** "باقة واحدة" / "باقتين" / "٧ باقات" / "١٢ باقة" — Arabic counts the noun. */
export function packagesCount(n: number) {
  if (n === 1) return st("باقة واحدة");
  if (n === 2) return st("باقتين");
  return n >= 3 && n <= 10 ? st("{0} باقات", num(n)) : st("{0} باقة", num(n));
}

/** "قسم واحد" / "قسمين" / "٦ أقسام" / "١٢ قسم" (games and apps). */
export function gamesCount(n: number) {
  if (n === 1) return st("قسم واحد");
  if (n === 2) return st("قسمين");
  return n >= 3 && n <= 10 ? st("{0} أقسام", num(n)) : st("{0} قسم", num(n));
}

export { discountPercent };

/** "معرّف اللاعب: 512…" / "المقاس: L" for a chosen option on cart rows. */
export function featureLabel(key: string, value: string) {
  return `${FEATURE_LABEL[key] ?? key}: ${value}`;
}

/** Stagger index for the rise-in animation. */
export const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

/** A price split for display: the amount large, the currency small ("١٢٬٧٠٠" + "ج.س."). */
export function priceParts(value: number) {
  const parts = storeNumberFormat({ style: "currency", currency: storeCurrency(), maximumFractionDigits: 0 }).formatToParts(value);
  const currency = parts.find((p) => p.type === "currency")?.value ?? "";
  const amount = parts
    .filter((p) => p.type !== "currency")
    .map((p) => p.value)
    .join("")
    .replace(/[‎‏؜]/g, "")
    .trim();
  return { amount, currency };
}

/** Big amount + small currency, as the reference app prints prices. */
export function Price({ value, className, size = "md" }: { value: number; className?: string; size?: "sm" | "md" | "lg" }) {
  const { amount, currency } = priceParts(value);
  return (
    <span className={cn("an-price", `an-price--${size}`, className)} aria-label={formatPrice(value)}>
      <span aria-hidden className="an-price-amount">{amount}</span>
      {currency && <span aria-hidden className="an-price-cur">{currency}</span>}
    </span>
  );
}

// ─── Buttons ────────────────────────────────────────────────────────────────

type BtnVariant = "grad" | "white" | "glass" | "ghost" | "wa";
type BtnSize = "sm" | "md" | "lg";

/** One gradient (or white, on the hero) button per view; the rest are glass. */
export function btn({
  variant = "grad",
  size = "md",
  full,
  className,
}: { variant?: BtnVariant; size?: BtnSize; full?: boolean; className?: string } = {}) {
  return cn("an-btn", `an-btn--${variant}`, size !== "md" && `an-btn--${size}`, full && "an-btn--full", className);
}

/** Arrow toward the reading end (RTL: left). */
export function Arrow({ className }: { className?: string }) {
  return <ArrowLeft aria-hidden className={cn("size-4 shrink-0 ltr:rotate-180", className)} />;
}

/** "→ رجوع" — arrow toward the start. */
export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="an-back">
      <ArrowRight aria-hidden className="size-4 ltr:rotate-180" />
      {children}
    </Link>
  );
}

// ─── Layout ─────────────────────────────────────────────────────────────────

export function Wrap({ className, narrow, ...props }: ComponentProps<"div"> & { narrow?: boolean }) {
  return <div className={cn("an-wrap", narrow && "an-wrap--narrow", className)} {...props} />;
}

/** The card surface every panel shares (violet glass, hairline border). */
export function Panel({ className, as: Tag = "div", ...props }: HTMLAttributes<HTMLElement> & { as?: "div" | "section" | "aside" | "li" }) {
  return createElement(Tag, { className: cn("an-panel", className), ...props });
}

export function PageHead({ title, note, back, className }: { title: string; note?: ReactNode; back?: { href: string; label: string }; className?: string }) {
  return (
    <header className={cn("an-pagehead", className)}>
      {back && <BackLink href={back.href}>{back.label}</BackLink>}
      <h1 className="an-h1">{title}</h1>
      {note && <p className="an-sub mt-1.5 max-w-2xl">{note}</p>}
    </header>
  );
}

export function SectionHead({ title, note, href, linkLabel }: { title: string; note?: string; href?: string; linkLabel?: string }) {
  return (
    <div className="an-sechead">
      <div className="min-w-0">
        <h2 className="an-h2">{title}</h2>
        {note && <p className="an-sub mt-1">{note}</p>}
      </div>
      {href && (
        <Link href={href} className="an-more">
          {linkLabel ?? st("عرض الكل")}
          <Arrow className="size-3.5" />
        </Link>
      )}
    </div>
  );
}

export function Empty({ icon, title, description, action, className }: { icon: ReactNode; title: string; description?: string; action?: ReactNode; className?: string }) {
  return (
    <Panel className={cn("an-empty", className)}>
      <span aria-hidden className="an-empty-icon">
        {icon}
      </span>
      <h2 className="an-h3 mt-4">{title}</h2>
      {description && <p className="an-sub mx-auto mt-1.5 max-w-md">{description}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-2.5">{action}</div>}
    </Panel>
  );
}

// ─── Media ──────────────────────────────────────────────────────────────────

/** A game's icon tile: the category / product art, or a gamepad on the gradient. */
export function GameIcon({ src, size = "md", className, priority }: { src?: string | null; size?: "sm" | "md" | "lg"; className?: string; priority?: boolean }) {
  const px = size === "lg" ? 96 : size === "md" ? 64 : 44;
  return (
    <span className={cn("an-icon", `an-icon--${size}`, !src && "an-icon--empty", className)}>
      {src ? <Image src={src} alt="" fill sizes={`${px}px`} priority={priority} className="object-cover" /> : <Gamepad2 aria-hidden />}
    </span>
  );
}

// ─── Cards ──────────────────────────────────────────────────────────────────

/** A game on the home / games page: icon, badge, name, "from X", arrow. */
export function GameCard({ game, storeSlug, badge, index = 0 }: { game: CategoryLink; storeSlug: string; badge?: string | null; index?: number }) {
  const soon = game.productCount === 0;
  return (
    <Link href={buildStoreUrl(storeSlug, `/categories/${game.slug}`)} className="an-game an-rise group" style={stagger(index)} data-soon={soon || undefined}>
      {game.image && (
        <span aria-hidden className="an-game-glow">
          <Image src={game.image} alt="" fill sizes="160px" className="object-cover" />
        </span>
      )}
      <span className="an-game-top">
        <GameIcon src={game.image} />
        {(soon || badge) && <span className={cn("an-badge", soon && "an-badge--quiet")}>{soon ? st("قريبًا") : badge}</span>}
      </span>
      <span className="an-game-name">{game.name}</span>
      <span className="an-game-sub">{soon ? st("الباقات جاية قريب") : packagesCount(game.productCount)}</span>
      <span className="an-game-foot">
        <span className="an-game-from">
          {game.fromPrice != null && !soon ? (
            <>
              {st("يبدأ من")} <b>{formatPrice(game.fromPrice)}</b>
            </>
          ) : (
            st("شوف التفاصيل")
          )}
        </span>
        <span aria-hidden className="an-game-go">
          <Arrow />
        </span>
      </span>
    </Link>
  );
}

/** A package as a link (home shelves, listing): art, name, game, price. */
export function PackageCard({ product, storeSlug, index = 0 }: { product: ProductCardData; storeSlug: string; index?: number }) {
  const off = discountPercent(product.price, product.compareAtPrice);
  const out = product.stock <= 0;
  return (
    <Link href={buildStoreUrl(storeSlug, `/products/${product.slug}`)} className="an-pkgcard an-rise" style={stagger(index)} data-out={out || undefined}>
      <GameIcon src={product.image} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="an-pkgcard-name">{product.name}</span>
        {product.categoryName && <span className="an-pkgcard-game">{product.categoryName}</span>}
        <span className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
          <Price value={product.price} />
          {off > 0 && <s className="an-was">{formatPrice(product.compareAtPrice!)}</s>}
        </span>
      </span>
      {out ? <span className="an-badge an-badge--quiet">{st("نفدت")}</span> : product.isFeatured ? <span className="an-badge">{st("الأكثر مبيعًا")}</span> : off > 0 ? <span className="an-badge">{st("خصم {0}٪", num(off))}</span> : null}
    </Link>
  );
}

export function PackageGrid({ products, storeSlug, className }: { products: ProductCardData[]; storeSlug: string; className?: string }) {
  return (
    <ul className={cn("an-pkggrid", className)}>
      {products.map((p, i) => (
        <li key={p.id} className="contents">
          <PackageCard product={p} storeSlug={storeSlug} index={i} />
        </li>
      ))}
    </ul>
  );
}
