import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DataCardProps = {
  /** Search + filters row above the data. */
  toolbar?: ReactNode;
  /** Usually <Pagination />. */
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** The one bordered surface on a list page: toolbar, table/list, footer. */
export function DataCard({ toolbar, footer, children, className }: DataCardProps) {
  return (
    <section className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
      {toolbar && (
        <div className="flex flex-col gap-2 border-b border-border p-3 sm:flex-row sm:items-center sm:justify-between">
          {toolbar}
        </div>
      )}
      {children}
      {footer && <div className="border-t border-border">{footer}</div>}
    </section>
  );
}
