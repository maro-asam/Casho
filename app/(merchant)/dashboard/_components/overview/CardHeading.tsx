import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Card title row: Headline title, footnote subtitle, optional plain (tinted text) action. */
export default function CardHeading({
  title,
  subtitle,
  action,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: { label: string; href: string };
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-5 pt-5 pb-3", className)}>
      <div className="min-w-0 space-y-0.5">
        <h2 className="text-[17px] leading-[22px] font-semibold tracking-[-0.01em]">{title}</h2>
        {subtitle && <p className="text-[13px] leading-[18px] text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
      {action && (
        <Link
          href={action.href}
          className="apple-press -me-1 flex shrink-0 items-center gap-0.5 rounded-full px-2 py-1 text-[15px] text-primary hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {action.label}
          <ChevronLeft className="size-4 ltr:-scale-x-100" />
        </Link>
      )}
    </div>
  );
}
