import Link from "next/link";
import { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

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
    <header className="flex flex-col gap-5 pt-2 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0 space-y-1">
        <p className="flex items-center gap-1.5 text-[13px] font-semibold text-primary">
          <Icon className="size-4" aria-hidden />
        </p>
        <div className="flex items-center gap-2.5">
          <h1 className="text-[34px] leading-[41px] font-bold ltr:tracking-[-0.02em]">{title}</h1>
          {badge !== undefined && (
            <span className="rounded-full bg-(--fill-3) px-2.5 py-0.5 text-[13px] font-semibold text-muted-foreground tabular-nums">
              {badge}
            </span>
          )}
        </div>
        <p className="text-[15px] text-muted-foreground">{description}</p>
      </div>

      {actionLabel && actionHref && (
        <Button asChild className="h-11 shrink-0 rounded-full px-5 text-[15px] font-semibold">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </header>
  );
}
