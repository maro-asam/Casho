/**
 * Apple HIG building blocks for dashboard pages (orders, products…), on top of the dashboard's
 * `.apple-ui` tokens (globals.css): opaque content cards on the grouped
 * background, capsule buttons, Settings-style rows, a segmented control.
 */
import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { PillTone } from "./status-pill";
import { hrefWith, type SearchParamsRecord } from "./url-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { lazyIntl, tr } from "@/lib/i18n/dashboard";

const nf = lazyIntl.number();

/* ── Buttons (capsules; press = dim + scale, never a ripple) ─────────────── */

const capsule =
  "apple-press inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

export const appleButton = {
  /** The one prominent action of a view. */
  filled: cn(capsule, "h-11 bg-primary px-5 text-[15px] font-semibold text-primary-foreground hover:bg-primary/90"),
  /** Secondary actions: gray fill, label in the text color. */
  gray: cn(capsule, "h-11 bg-card px-4 text-[15px] text-foreground hover:bg-card/80"),
  /** Gray fill inside a card. */
  tinted: cn(capsule, "h-9 bg-muted px-3.5 text-[15px] text-foreground hover:bg-muted/70"),
  /** Text-only, tinted = tappable. */
  plain: cn(capsule, "-mx-2 h-9 px-2 text-[15px] text-primary hover:bg-primary/8"),
  destructive: cn(capsule, "h-9 bg-(--sys-red)/10 px-3.5 text-[15px] text-(--sys-red) hover:bg-(--sys-red)/15"),
  /** Confirms a non-undoable destruction (dialog footers only). */
  destructiveFilled: cn(capsule, "h-9 bg-(--sys-red) px-4 text-sm font-semibold text-white hover:bg-(--sys-red)/90"),
  /** Row "⋯" menu trigger: sits above a stretched row link. */
  more: cn(capsule, "relative z-10 size-9 bg-muted text-primary hover:bg-muted/70 data-[state=open]:bg-muted/70"),
};

/** Menu content sizing shared by row menus. */
export const appleMenu =
  "w-56 rounded-xl p-1.5 [&_[data-slot=dropdown-menu-item]]:h-9 [&_[data-slot=dropdown-menu-item]]:rounded-lg [&_[data-slot=dropdown-menu-item]]:text-[15px]";

/* ── Status tones → system colors. Color is never the only signal: always a label. */

const TONE_DOT: Record<PillTone, string> = {
  neutral: "bg-(--sys-gray)",
  info: "bg-primary",
  success: "bg-(--sys-green)",
  warning: "bg-(--sys-orange)",
  danger: "bg-(--sys-red)",
  accent: "bg-(--sys-indigo)",
};

const TONE_FILL: Record<PillTone, string> = {
  neutral: "bg-muted",
  info: "bg-primary/10",
  success: "bg-(--sys-green)/12",
  warning: "bg-(--sys-orange)/14",
  danger: "bg-(--sys-red)/12",
  accent: "bg-(--sys-indigo)/12",
};

export const toneDotClass = (tone: PillTone) => TONE_DOT[tone];

export function Dot({ tone, className }: { tone: PillTone; className?: string }) {
  return <span aria-hidden className={cn("size-2 shrink-0 rounded-full", TONE_DOT[tone], className)} />;
}

/** Dot + label, no box — the quiet default for a status. */
export function StatusText({ tone, children, className }: { tone: PillTone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] text-foreground/80", className)}>
      <Dot tone={tone} />
      {children}
    </span>
  );
}

/** Tinted capsule for things that need attention (risk, returned…). Text stays in the label color for contrast. */
export function Tag({ tone, children, className }: { tone: PillTone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[12px] font-medium text-foreground/85",
        TONE_FILL[tone],
        className,
      )}
    >
      <Dot tone={tone} className="size-1.5" />
      {children}
    </span>
  );
}

/* ── Cards ───────────────────────────────────────────────────────────────── */

export function Card({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className,
  id,
}: {
  title?: string;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section aria-labelledby={headingId} className={cn("apple-card overflow-hidden", className)}>
      {title && (
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
          <div className="flex min-w-0 items-start gap-2.5">
            {Icon && <Icon className="mt-0.5 size-[18px] shrink-0 text-muted-foreground" strokeWidth={1.8} />}
            <div className="min-w-0 space-y-0.5">
              <h2 id={headingId} className="text-[17px] leading-[22px] font-semibold ltr:tracking-[-0.01em]">
                {title}
              </h2>
              {subtitle && <p className="text-[13px] leading-[18px] text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/** List page surface: toolbar (search + filters, filled fields), content, hairline-topped footer (usually <Pager />). */
export function ListCard({ toolbar, footer, children, className }: { toolbar?: ReactNode; footer?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("apple-card overflow-hidden", className)}>
      {toolbar && (
        <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 [&_input[type=search]]:h-11 [&_input[type=search]]:rounded-[12px] [&_input[type=search]]:border-0 [&_input[type=search]]:bg-(--fill-3) [&_input[type=search]]:text-[15px]">
          {toolbar}
        </div>
      )}
      {children}
      {footer && <div className="border-t-[0.5px] border-border">{footer}</div>}
    </section>
  );
}

/** Settings-style rows: label on the leading side, value (secondary label) trailing, inset hairlines. */
export function Rows({ children, className }: { children: ReactNode; className?: string }) {
  return <dl className={cn("apple-rows pb-2 [--row-inset:20px]", className)}>{children}</dl>;
}

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-4 px-5 py-2.5 text-[15px]">
      <dt className="shrink-0">{label}</dt>
      <dd className="min-w-0 text-end text-muted-foreground">{children}</dd>
    </div>
  );
}

/* ── Page header ─────────────────────────────────────────────────────────── */

export function LargeTitle({
  eyebrow,
  title,
  subtitle,
  actions,
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-5 pt-2 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0 space-y-1">
        {eyebrow}
        <h1 className="text-[34px] leading-[41px] font-bold ltr:tracking-[-0.02em]">{title}</h1>
        {subtitle && <p className="text-[15px] text-muted-foreground">{subtitle}</p>}
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/* ── Segmented control (URL-driven, works in server components) ─────────── */

export function Segmented({
  label,
  param,
  basePath,
  searchParams,
  segments,
}: {
  label: string;
  param: string;
  basePath: string;
  searchParams?: SearchParamsRecord;
  segments: { label: string; value?: string; count?: number }[];
}) {
  const raw = searchParams?.[param];
  const current = (Array.isArray(raw) ? raw[0] : raw) || undefined;

  return (
    <nav aria-label={label} className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
      <ul className="inline-flex min-w-max items-center gap-0.5 rounded-full bg-(--sys-gray)/14 p-[3px]">
        {segments.map((segment) => {
          const active = segment.value === current;
          return (
            <li key={segment.value ?? "all"}>
              <Link
                href={hrefWith(basePath, searchParams, { [param]: segment.value })}
                aria-current={active ? "page" : undefined}
                scroll={false}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[13px] transition-[background-color,color,box-shadow] duration-200 ease-(--ease-apple) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-card font-semibold text-foreground shadow-[0_3px_8px_rgba(0,0,0,0.12),0_1px_1px_rgba(0,0,0,0.04)]"
                    : "text-foreground/70 hover:text-foreground",
                )}
              >
                {segment.label}
                {segment.count !== undefined && (
                  <span className={cn("tabular-nums", active ? "text-muted-foreground" : "text-(--label-3)")}>
                    {nf.format(segment.count)}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Local-state segmented control (no URL) — e.g. "Upload | Link". Use inside client components. */
export function SegmentedButtons<T extends string>({
  label,
  value,
  onChange,
  options,
  role = "radiogroup",
  className,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly (readonly [T, ReactNode])[];
  /** "tablist" when each option swaps a panel below. */
  role?: "radiogroup" | "tablist";
  className?: string;
}) {
  const itemRole = role === "tablist" ? "tab" : "radio";
  return (
    <div role={role} aria-label={label} className={cn("inline-flex rounded-full bg-(--sys-gray)/14 p-[3px]", className)}>
      {options.map(([option, text]) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            role={itemRole}
            {...(itemRole === "tab" ? { "aria-selected": active } : { "aria-checked": active })}
            onClick={() => onChange(option)}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-full px-3 text-[13px] transition-[background-color,box-shadow,color] duration-200 ease-(--ease-apple) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-card font-semibold text-foreground shadow-[0_3px_8px_rgba(0,0,0,0.12),0_1px_1px_rgba(0,0,0,0.04)]"
                : "text-foreground/70 hover:text-foreground",
            )}
          >
            {text}
          </button>
        );
      })}
    </div>
  );
}

/* ── Empty / unavailable content ─────────────────────────────────────────── */

export function Unavailable({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 px-6 py-16 text-center", className)}>
      <Icon className="mb-2 size-11 text-(--label-3)" strokeWidth={1.5} />
      <p className="text-[20px] leading-[25px] font-semibold">{title}</p>
      {description && <p className="max-w-sm text-[15px] leading-[21px] text-muted-foreground">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/* ── Pager: range + previous/next capsules ───────────────────────────────── */

export function Pager({
  page,
  pageSize,
  total,
  basePath,
  searchParams,
  noun,
}: {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  searchParams?: SearchParamsRecord;
  noun: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const link = (p: number) => hrefWith(basePath, searchParams, { page: p === 1 ? undefined : p });
  const step = "apple-press inline-flex h-9 items-center gap-1 rounded-full bg-muted px-3.5 text-[15px] text-primary hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const stepOff = "inline-flex h-9 items-center gap-1 rounded-full bg-muted px-3.5 text-[15px] text-(--label-3)";

  return (
    <div className="flex flex-col items-center justify-between gap-3 px-5 py-4 sm:flex-row">
      <p className="text-[13px] text-muted-foreground tabular-nums">
        {tr("عرض {0}–{1} من {2} {3}", nf.format(from), nf.format(to), nf.format(total), noun)}
      </p>

      {totalPages > 1 && (
        <nav aria-label={tr("الصفحات")} className="flex items-center gap-2">
          {page > 1 ? (
            <Link href={link(page - 1)} className={step}>
              <ChevronRight className="size-4 ltr:-scale-x-100" strokeWidth={2.2} />
              {tr("السابق")}
            </Link>
          ) : (
            <span aria-disabled className={stepOff}>
              <ChevronRight className="size-4 ltr:-scale-x-100" strokeWidth={2.2} />
              {tr("السابق")}
            </span>
          )}
          <span className="min-w-16 text-center text-[13px] text-muted-foreground tabular-nums">
            {nf.format(page)} / {nf.format(totalPages)}
          </span>
          {page < totalPages ? (
            <Link href={link(page + 1)} className={step}>
              {tr("التالي")}
              <ChevronLeft className="size-4 ltr:-scale-x-100" strokeWidth={2.2} />
            </Link>
          ) : (
            <span aria-disabled className={stepOff}>
              {tr("التالي")}
              <ChevronLeft className="size-4 ltr:-scale-x-100" strokeWidth={2.2} />
            </span>
          )}
        </nav>
      )}
    </div>
  );
}

export const initialOf = (name: string) => name.trim().slice(0, 1).toUpperCase() || "#";

/* ── loading.tsx body for an Apple list page ─────────────────────────────── */

export function ListPageSkeleton({ thumb = "circle", actions = 1 }: { thumb?: "circle" | "square"; actions?: number }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label={tr("جاري التحميل")}>
      <div className="flex flex-col gap-5 pt-2 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-40 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <div className="flex gap-2">
          {Array.from({ length: actions }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-28 rounded-full bg-card" />
          ))}
        </div>
      </div>

      <Skeleton className="h-[38px] w-full max-w-xl rounded-full" />

      <div className="apple-card overflow-hidden">
        <div className="flex gap-2 p-4 sm:px-5">
          <Skeleton className="h-9 w-full max-w-sm rounded-[10px]" />
          <Skeleton className="h-9 w-40 rounded-full" />
        </div>
        <div className="apple-rows [--row-inset:68px]">
          {Array.from({ length: 8 }).map((_, r) => (
            <div key={r} className="flex items-center gap-3 px-5 py-3">
              <Skeleton className={cn("size-10 shrink-0", thumb === "circle" ? "rounded-full" : "rounded-[10px]")} />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-36 rounded-md" />
                <Skeleton className="h-3 w-24 rounded-md" />
              </div>
              <Skeleton className="hidden h-8 w-28 rounded-full md:block" />
              <Skeleton className="h-4 w-16 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
