import type { StorePause } from "@/lib/store/pause";
import { cn } from "@/lib/utils";
import { PauseCountdown } from "./PauseCountdown";

/** Description on a closed page: the merchant's message when paused, else the generic line. */
export function closedDescription(pause: StorePause | null | undefined) {
  if (!pause) return "المتجر ده مش متاح دلوقتي. جرب تزوره تاني بعد شوية.";
  return pause.message ?? "المتجر واخد استراحة قصيرة وراجع قريب.";
}

// Egyptian stores and shoppers: one fixed zone, so cached pages read the same everywhere.
const reopenFormat = new Intl.DateTimeFormat("ar-EG", {
  timeZone: "Africa/Cairo",
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "numeric",
  minute: "2-digit",
});

/** Reopen time + optional countdown, for a theme's closed page (its `action` slot). */
export function StorePauseDetails({
  storeSlug,
  pause,
  align = "center",
  className,
}: {
  storeSlug: string;
  pause: StorePause;
  align?: "center" | "start";
  className?: string;
}) {
  return (
    <div className={cn("flex w-full flex-col gap-4", align === "center" ? "items-center" : "items-start", className)}>
      <PauseCountdown
        storeSlug={storeSlug}
        until={pause.until}
        show={pause.showCountdown}
        className={align === "center" ? "justify-center" : "justify-start"}
      />
      <p className="text-sm text-muted-foreground">
        بيرجع يفتح <time dateTime={pause.until}>{reopenFormat.format(new Date(pause.until))}</time>
      </p>
    </div>
  );
}
