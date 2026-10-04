// ─────────────────────────────────────────────────────────────────────────────
//  Classic theme — UI primitives
//  Server-safe building blocks (no hooks). Every Classic screen is composed
//  from these so spacing, sizing and type stay consistent.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ChevronLeft, Star } from "lucide-react";

import { cn, formatPrice } from "@/lib/utils";

/** Classes for content rendered in a portal (sheets, dialogs, popovers):
 *  re-applies the store tokens + Classic scope outside the store root. */
export const CLASSIC_PORTAL = "store-theme-root theme-classic classic-portal";

// ─── Buttons ────────────────────────────────────────────────────────────────

type BtnVariant = "primary" | "outline" | "ghost" | "soft" | "inverse";
type BtnSize = "sm" | "md" | "lg" | "icon" | "icon-sm";

const BTN_BASE =
  "inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap font-semibold " +
  "rounded-(--c-btn-radius) transition-[background-color,color,border-color,opacity,transform] duration-(--c-motion) " +
  "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0";

const BTN_VARIANT: Record<BtnVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:opacity-90",
  outline: "border border-border bg-background text-foreground hover:border-foreground/40",
  ghost: "text-foreground hover:bg-(--c-subtle)",
  soft: "bg-(--c-subtle) text-foreground hover:bg-muted",
  inverse: "bg-background text-foreground hover:opacity-90",
};

const BTN_SIZE: Record<BtnSize, string> = {
  sm: "h-(--c-control-sm) px-3.5 text-[0.8125rem] [&_svg]:size-4",
  md: "h-(--c-control) px-5 text-sm [&_svg]:size-[1.125rem]",
  lg: "h-(--c-control-lg) px-6 text-[0.9375rem] [&_svg]:size-5",
  icon: "size-(--c-control) [&_svg]:size-5",
  "icon-sm": "size-(--c-control-sm) [&_svg]:size-[1.125rem]",
};

export function btn({
  variant = "primary",
  size = "md",
  full,
  className,
}: { variant?: BtnVariant; size?: BtnSize; full?: boolean; className?: string } = {}) {
  return cn(BTN_BASE, BTN_VARIANT[variant], BTN_SIZE[size], full && "w-full", className);
}

// ─── Layout ─────────────────────────────────────────────────────────────────

export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("c-container", className)} {...props} />;
}

export function SectionHeading({
  title,
  subtitle,
  href,
  linkLabel = "عرض الكل",
  className,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-5 flex items-end justify-between gap-4 sm:mb-6", className)}>
      <div className="min-w-0">
        <h2 className="text-lg font-bold leading-tight tracking-tight sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="group -my-2 inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-semibold text-foreground/80 transition-colors hover:text-foreground"
        >
          {linkLabel}
          <ChevronLeft className="size-4 transition-transform duration-(--c-motion) group-hover:-translate-x-0.5 ltr:rotate-180 ltr:group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="مسار التصفح" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-[0.8125rem] text-muted-foreground">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className={cn("flex min-w-0 items-center gap-1.5", last ? "min-w-0" : "shrink-0")}>
              {item.href && !last ? (
                <Link href={item.href} className="transition-colors hover:text-foreground">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={cn("truncate", last && "text-foreground")}>
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

export function discountPercent(price: number, compareAt: number | null | undefined) {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

export function Price({
  price,
  compareAt,
  size = "md",
  className,
}: {
  price: number;
  compareAt?: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const onSale = !!compareAt && compareAt > price;
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span
        className={cn(
          "font-bold tabular-nums tracking-tight",
          size === "sm" && "text-[0.9375rem]",
          size === "md" && "text-base",
          size === "lg" && "text-2xl sm:text-[1.75rem]",
          onSale && "text-(--c-sale)",
        )}
      >
        {formatPrice(price)}
      </span>
      {onSale && (
        <span
          className={cn(
            "tabular-nums text-muted-foreground line-through decoration-1",
            size === "lg" ? "text-base" : "text-xs sm:text-[0.8125rem]",
          )}
        >
          <span className="sr-only">السعر قبل الخصم: </span>
          {formatPrice(compareAt!)}
        </span>
      )}
    </div>
  );
}

export function Stars({
  value,
  count,
  size = "sm",
  className,
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className="sr-only">التقييم {value.toFixed(1)} من 5</span>
      <div aria-hidden className="flex items-center gap-px">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              size === "sm" ? "size-3" : "size-4",
              i <= rounded ? "fill-(--c-rating) text-(--c-rating)" : "fill-muted text-muted",
            )}
          />
        ))}
      </div>
      {count !== undefined && (
        <span aria-hidden className={cn("tabular-nums text-muted-foreground", size === "sm" ? "text-xs" : "text-sm")}>
          ({count})
        </span>
      )}
    </div>
  );
}

// ─── States ─────────────────────────────────────────────────────────────────

export function EmptyState({
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
        "flex flex-col items-center justify-center rounded-(--c-radius-lg) bg-(--c-subtle) px-6 py-14 text-center sm:py-20",
        className,
      )}
    >
      <div className="mb-4 grid size-14 place-items-center rounded-full bg-background text-muted-foreground shadow-[0_1px_2px_rgb(0_0_0/0.06)] [&_svg]:size-6">
        {icon}
      </div>
      <h2 className="text-lg font-bold">{title}</h2>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

export function PageHeader({
  breadcrumbs,
  title,
  meta,
  children,
}: {
  breadcrumbs: { label: string; href?: string }[];
  title: ReactNode;
  meta?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="pb-5 pt-4 sm:pb-8 sm:pt-6">
      <Breadcrumbs items={breadcrumbs} />
      <div className="mt-3 flex flex-col gap-3 sm:mt-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-[2rem]">{title}</h1>
          {meta && <p className="mt-1.5 text-sm text-muted-foreground">{meta}</p>}
        </div>
        {children}
      </div>
    </header>
  );
}
