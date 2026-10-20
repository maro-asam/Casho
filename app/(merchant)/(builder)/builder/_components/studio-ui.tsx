"use client";

/**
 * Settings-app building blocks for the Studio sidebar (HIG inset grouped
 * lists): groups with a caption header, 44pt rows, colored icon tiles,
 * disclosure chevrons, switches and choice tiles.
 */

import Link from "next/link";
import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { Check, ChevronLeft, ExternalLink, type LucideIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { tr } from "@/lib/i18n/dashboard";

/** Scrolling body of a panel. Fields and switches inside get the filled HIG style. */
export function PanelBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("apple-form space-y-6 px-4 pt-2 pb-8", className)}>{children}</div>;
}

export function Group({
  title,
  footer,
  action,
  children,
  className,
  plain,
}: {
  title?: ReactNode;
  /** Explanatory footnote under the group. */
  footer?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** No card — for content that brings its own surface (tiles, previews). */
  plain?: boolean;
}) {
  return (
    <section className={cn("space-y-1.5", className)}>
      {(title || action) && (
        <div className="flex items-end justify-between gap-2 px-4">
          {title && <h3 className="text-[13px] leading-[18px] text-muted-foreground">{title}</h3>}
          {action}
        </div>
      )}
      {plain ? children : <div className="apple-rows overflow-hidden rounded-[14px] bg-card [--row-inset:56px]">{children}</div>}
      {footer && <p className="px-4 text-[12px] leading-[17px] text-muted-foreground">{footer}</p>}
    </section>
  );
}

/** Settings icon tile: white glyph on a colored rounded square. */
export function IconTile({ icon: Icon, tint, className }: { icon: LucideIcon; tint: string; className?: string }) {
  return (
    <span className={cn("grid size-[29px] shrink-0 place-items-center rounded-[7px] text-white", tint, className)}>
      <Icon className="size-[17px]" strokeWidth={2} />
    </span>
  );
}

type RowBase = {
  icon?: LucideIcon;
  tint?: string;
  label: ReactNode;
  description?: ReactNode;
  /** Secondary value on the trailing side (e.g. the current theme name). */
  value?: ReactNode;
  badge?: ReactNode;
  className?: string;
};

function RowContent({ icon, tint = "bg-(--sys-gray)", label, description, value, badge, trailing }: RowBase & { trailing: ReactNode }) {
  return (
    <>
      {icon && <IconTile icon={icon} tint={tint} />}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[15px] leading-5">{label}</span>
          {badge}
        </span>
        {description && <span className="block text-[13px] leading-[18px] text-muted-foreground">{description}</span>}
      </span>
      {value !== undefined && <span className="max-w-[45%] shrink-0 truncate text-[15px] text-muted-foreground">{value}</span>}
      {trailing}
    </>
  );
}

const rowClass =
  "flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-start transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none active:bg-muted";

/** Disclosure row: opens another screen (button) or page (href; `external` opens a new tab). */
export function NavRow({
  onClick,
  href,
  external,
  ...row
}: RowBase & { onClick?: () => void; href?: string; external?: boolean }) {
  const trailing = external ? (
    <ExternalLink className="size-4 shrink-0 text-(--label-3)" />
  ) : (
    <ChevronLeft className="size-4 shrink-0 text-(--label-3) ltr:-scale-x-100" strokeWidth={2.4} />
  );
  const content = <RowContent {...row} trailing={trailing} />;
  if (href) {
    return (
      <Link href={href} target={external ? "_blank" : undefined} className={cn(rowClass, row.className)}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cn(rowClass, row.className)}>
      {content}
    </button>
  );
}

export function SwitchRow({
  checked,
  onCheckedChange,
  disabled,
  ...row
}: RowBase & { checked: boolean; onCheckedChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={cn("flex min-h-11 w-full cursor-pointer items-center gap-3 px-4 py-2.5", disabled && "cursor-default opacity-60", row.className)}>
      <RowContent
        {...row}
        trailing={<Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} className="shrink-0" />}
      />
    </label>
  );
}

/** Static row (label + any trailing control). */
export function Row({ children, ...row }: RowBase & { children?: ReactNode }) {
  return (
    <div className={cn("flex min-h-11 w-full items-center gap-3 px-4 py-2.5", row.className)}>
      <RowContent {...row} trailing={children} />
    </div>
  );
}

/** Label + control + hint, for fields inside a group card. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  trailing,
  children,
  className,
}: {
  label?: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string | null;
  /** Shown on the label line (e.g. a character count). */
  trailing?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5 px-4 py-3", className)}>
      {(label || trailing) && (
        <div className="flex items-center justify-between gap-2 px-0.5">
          {label && (
            <label htmlFor={htmlFor} className="text-[13px] font-medium text-foreground/80">
              {label}
            </label>
          )}
          {trailing}
        </div>
      )}
      {children}
      {error ? (
        <p role="alert" className="px-0.5 text-[12px] font-medium text-(--sys-red)">
          {error}
        </p>
      ) : (
        hint && <p className="px-0.5 text-[12px] leading-[17px] text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

/** Visual choice tiles (theme, navbar, card style…): preview + label, check on the selected one. */
export function ChoiceTiles<T extends string | number>({
  value,
  onChange,
  options,
  columns = 2,
  disabled,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; description?: ReactNode; preview?: ReactNode }[];
  columns?: 2 | 3 | 4;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("grid gap-2.5", columns === 2 ? "grid-cols-2" : columns === 3 ? "grid-cols-3" : "grid-cols-4")}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => !active && onChange(o.value)}
            className={cn(
              "apple-press group relative flex flex-col gap-2 rounded-[14px] bg-card p-2 text-start transition-shadow duration-200 ease-(--ease-apple) focus-visible:outline-none disabled:opacity-60",
              active ? "ring-2 ring-primary" : "ring-1 ring-transparent hover:ring-foreground/10 focus-visible:ring-primary/50",
            )}
          >
            {o.preview && <div className="pointer-events-none">{o.preview}</div>}
            <span className="flex items-start justify-between gap-1 px-1 pb-0.5">
              <span className="min-w-0">
                <span className="block truncate text-[13px] leading-[18px] font-medium">{o.label}</span>
                {o.description && <span className="block text-[11px] leading-[15px] text-muted-foreground">{o.description}</span>}
              </span>
              <span
                aria-hidden
                className={cn(
                  "grid size-[18px] shrink-0 place-items-center rounded-full transition-colors",
                  active ? "bg-primary text-primary-foreground" : "ring-1 ring-(--label-3)",
                )}
              >
                {active && <Check className="size-3" strokeWidth={3} />}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Draft autosave: persists `value` once it stops changing for `delay` ms, and
 * flushes on unmount so leaving a screen never drops the last edit. Everything
 * lands in the draft (with undo), so there's no Save button to forget.
 */
export function useAutosave<T>(value: T, persist: (value: T) => Promise<unknown>, delay = 800) {
  const saved = useRef(JSON.stringify(value));
  const latest = useRef(value);
  const persistRef = useRef(persist);
  // Keep the latest value/callback for the debounced and unmount flushes.
  useEffect(() => {
    latest.current = value;
    persistRef.current = persist;
  });

  const flush = useCallback(() => {
    const json = JSON.stringify(latest.current);
    if (json === saved.current) return;
    saved.current = json;
    void persistRef.current(latest.current);
  }, []);

  useEffect(() => {
    if (JSON.stringify(value) === saved.current) return;
    const timer = setTimeout(flush, delay);
    return () => clearTimeout(timer);
  }, [value, delay, flush]);

  useEffect(() => flush, [flush]);
  return flush;
}

/** "Changes here go live immediately" note for tools outside the draft. */
export function LiveNote() {
  return (
    <p className="mx-4 flex items-start gap-2 rounded-xl bg-(--sys-orange)/12 px-3.5 py-2.5 text-[12px] leading-[17px] text-foreground/85">
      <span aria-hidden className="mt-1 size-1.5 shrink-0 rounded-full bg-(--sys-orange)" />
      {tr("الأدوات دي بتشتغل على متجرك فورًا — مش بتستنى النشر.")}
    </p>
  );
}
