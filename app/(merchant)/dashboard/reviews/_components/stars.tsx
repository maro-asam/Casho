import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { tr } from "@/lib/i18n/dashboard";

/** Read-only star row (App Store orange). Rating is also exposed as text for screen readers. */
export function Stars({ rating, size = "sm", className }: { rating: number; size?: "sm" | "md"; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-px", className)} role="img" aria-label={tr("{0} من ٥ نجوم", rating)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          strokeWidth={0}
          className={cn(size === "sm" ? "size-3.5" : "size-5", n <= Math.round(rating) ? "fill-(--sys-orange)" : "fill-(--sys-gray)/30")}
        />
      ))}
    </span>
  );
}
