import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Read-only star row. Rating is also exposed as text for screen readers. */
export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={`${rating} من ٥ نجوم`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn("size-3.5", n <= rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted")} />
      ))}
    </span>
  );
}
