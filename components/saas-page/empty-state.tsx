import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  /** What is missing. */
  title: string;
  /** Why it's empty / what happens next. */
  description?: string;
  /** What the user can do about it. */
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 px-6 py-16 text-center", className)}>
      <span className="mb-1 grid size-10 place-items-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <p className="text-sm font-semibold">{title}</p>
      {description && <p className="max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
