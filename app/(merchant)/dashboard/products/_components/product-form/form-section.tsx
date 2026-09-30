import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type FormSectionProps = {
  title: string;
  description?: string;
  /** Collapsed by default — for advanced, rarely used settings. Fields stay in the form either way. */
  collapsible?: boolean;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function FormSection({ title, description, collapsible, aside, children, className }: FormSectionProps) {
  const heading = (
    <div className="min-w-0 flex-1">
      <h2 className="text-sm font-semibold">{title}</h2>
      {description && <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p>}
    </div>
  );

  if (collapsible) {
    return (
      <details className={cn("group rounded-xl border border-border bg-card", className)}>
        <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
          {heading}
          <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-border px-5 py-5">{children}</div>
      </details>
    );
  }

  return (
    <section className={cn("rounded-xl border border-border bg-card", className)}>
      <div className="flex items-start gap-3 px-5 pt-4 pb-3">
        {heading}
        {aside}
      </div>
      <div className="px-5 pb-5">{children}</div>
    </section>
  );
}

/** Label + control + hint/error, the one field layout for product forms. */
export function Field({
  label,
  htmlFor,
  optional,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  optional?: boolean;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="flex items-center gap-1.5 text-sm font-medium">
        {label}
        {optional && <span className="text-xs font-normal text-muted-foreground">(اختياري)</span>}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs leading-5 text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
