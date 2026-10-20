import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { tr } from "@/lib/i18n/dashboard";

type FormSectionProps = {
  title: string;
  description?: string;
  /** Collapsed by default — for advanced, rarely used settings. Fields stay in the form either way. */
  collapsible?: boolean;
  /** Start a collapsible section expanded (e.g. it already has data). */
  defaultOpen?: boolean;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
};

function Heading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="min-w-0 flex-1 space-y-0.5">
      <h2 className="text-[17px] leading-[22px] font-semibold ltr:tracking-[-0.01em]">{title}</h2>
      {description && <p className="text-[13px] leading-[18px] text-muted-foreground">{description}</p>}
    </div>
  );
}

/** One opaque card per group of fields (HIG grouped form). */
export function FormSection({ title, description, collapsible, defaultOpen, aside, children, className }: FormSectionProps) {
  if (collapsible) {
    return (
      <details open={defaultOpen} className={cn("group apple-card overflow-hidden", className)}>
        <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
          <Heading title={title} description={description} />
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
            <ChevronDown className="size-4 transition-transform duration-300 ease-(--ease-apple) group-open:rotate-180" strokeWidth={2.2} />
          </span>
        </summary>
        <div className="px-5 pt-1 pb-5">{children}</div>
      </details>
    );
  }

  return (
    <section className={cn("apple-card", className)}>
      <div className="flex items-start gap-3 px-5 pt-5 pb-4">
        <Heading title={title} description={description} />
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
      <label htmlFor={htmlFor} className="flex items-center gap-1.5 px-1 text-[13px] font-medium text-foreground/80">
        {label}
        {optional && <span className="font-normal text-muted-foreground">{tr("(اختياري)")}</span>}
      </label>
      {children}
      {error ? (
        <p role="alert" className="px-1 text-[12px] font-medium text-(--sys-red)">
          {error}
        </p>
      ) : (
        hint && <p className="px-1 text-[12px] leading-[17px] text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

/** Settings-style switch row: title + footnote on the leading side, switch trailing. */
export function ToggleRow({ label, description, control }: { label: string; description?: string; control: ReactNode }) {
  return (
    <label className="flex min-h-14 cursor-pointer items-center justify-between gap-4 py-3">
      <span className="min-w-0">
        <span className="block text-[15px] leading-5">{label}</span>
        {description && <span className="block text-[13px] leading-[18px] text-muted-foreground">{description}</span>}
      </span>
      {control}
    </label>
  );
}
