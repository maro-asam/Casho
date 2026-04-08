import Link from "next/link";
import { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

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
    <Card className="flex flex-col gap-4 p-6 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>

          {badge !== undefined && (
            <Badge variant="secondary" className="rounded-lg px-3 py-1">
              {badge}
            </Badge>
          )}
        </div>

        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {actionLabel && actionHref && (
        <Button asChild className="rounded-lg">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </Card>
  );
}
