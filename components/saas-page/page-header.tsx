import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  /** Buttons on the end side. Put the primary action last. */
  actions?: ReactNode;
  className?: string;
};

/** Top of every dashboard page: title, one-line purpose, page-level actions. */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
