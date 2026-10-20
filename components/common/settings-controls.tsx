import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Title + description on one side, a control (switch…) on the other. */
export function SettingRow({
  title,
  description,
  control,
  bare,
}: {
  title: string;
  description?: string;
  control: ReactNode;
  bare?: boolean;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4", !bare && "rounded-xl border border-border bg-card p-4")}>
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="text-xs leading-5 text-muted-foreground">{description}</p>}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

/** Compact segmented control for 2–4 options. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: ReactNode }[];
  className?: string;
}) {
  return (
    <div role="radiogroup" className={cn("flex rounded-lg bg-muted p-0.5", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "flex-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
            value === o.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
