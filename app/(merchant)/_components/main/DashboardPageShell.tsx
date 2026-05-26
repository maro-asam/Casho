import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DashboardPageShellProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  badge?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

type DashboardSurfaceProps = {
  children: ReactNode;
  className?: string;
};

type DashboardMetricPillProps = {
  label: string;
  value: string | number;
  icon?: ReactNode;
  className?: string;
};

export function DashboardPageShell({
  eyebrow = "Merchant Console",
  title,
  description,
  badge,
  action,
  children,
  className,
}: DashboardPageShellProps) {
  return (
    <div dir="rtl" className={cn("space-y-6", className)}>
      <Card className="relative overflow-hidden ... border-border/70 bg-background/80 shadow-sm shadow-black/5 backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-bl from-primary/12 via-transparent to-transparent" />
        <CardContent className="relative p-5 sm:p-6 lg:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full border-0 bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">
                  {eyebrow}
                </Badge>
                {badge && (
                  <Badge variant="secondary" className="rounded-full px-3 py-1">
                    {badge}
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl xl:text-4xl">
                  {title}
                </h1>
                {description && (
                  <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                    {description}
                  </p>
                )}
              </div>
            </div>

            {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
          </div>
        </CardContent>
      </Card>

      {children}
    </div>
  );
}

export function DashboardSurface({ children, className }: DashboardSurfaceProps) {
  return (
    <Card
      className={cn(
        "... border-border/70 bg-background/80 shadow-sm shadow-black/5 backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </Card>
  );
}

export function DashboardSurfaceBody({ children, className }: DashboardSurfaceProps) {
  return <CardContent className={cn("p-5 sm:p-6", className)}>{children}</CardContent>;
}

export function DashboardMetricPill({
  label,
  value,
  icon,
  className,
}: DashboardMetricPillProps) {
  return (
    <div
      className={cn(
        "flex min-w-36 items-center gap-3 rounded-2xl border border-border/70 bg-background/70 px-4 py-3 shadow-sm",
        className,
      )}
    >
      {icon && <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</span>}
      <span className="min-w-0">
        <span className="block text-[11px] font-bold text-muted-foreground">{label}</span>
        <span className="block truncate text-sm font-bold text-foreground">{value}</span>
      </span>
    </div>
  );
}
