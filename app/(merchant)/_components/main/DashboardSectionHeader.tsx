import Link from "next/link";
import { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type DashboardSectionHeaderProps = {
  icon: LucideIcon;
  title: string;
  description: React.ReactNode;
  badge?: string | number;
  actionLabel?: string;
  actionHref?: string;
};

export default function DashboardSectionHeader({
  icon: Icon,
  title,
  description,
  badge,
  actionLabel,
  actionHref,
}: DashboardSectionHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-4.5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">{title}</h1>
            {badge !== undefined && (
              <Badge variant="secondary" className="rounded-lg px-2 py-0.5 text-xs">
                {badge}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {actionLabel && actionHref && (
        <Button asChild className="shrink-0 ">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}
