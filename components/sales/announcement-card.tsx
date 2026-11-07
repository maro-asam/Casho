import type { ReactNode } from "react";
import { Megaphone, Pin, Sparkles, TriangleAlert, type LucideIcon } from "lucide-react";
import type { Announcement } from "@/lib/sales/campaign-queries";
import { fmtDayMonth, fmtRelativeDays } from "@/lib/sales/format";
import { cn } from "@/lib/utils";

export const ANNOUNCEMENT_TONE: Record<string, { label: string; icon: LucideIcon; tile: string }> = {
  INFO: { label: "معلومة", icon: Megaphone, tile: "bg-linear-to-b from-primary/85 to-primary" },
  PROMO: { label: "عرض", icon: Sparkles, tile: "bg-linear-to-b from-[#a855f7] to-[#7c3aed]" },
  ALERT: { label: "تنبيه", icon: TriangleAlert, tile: "bg-linear-to-b from-(--sys-orange)/85 to-(--sys-orange)" },
};

const NEW_FOR_MS = 3 * 86_400_000;

/** One message on the sales board — Notification Center style: app-icon tile, title + time, body. */
export function AnnouncementCard({
  announcement: a,
  actions,
  now = new Date(),
  className,
}: {
  announcement: Announcement;
  /** Admin controls, rendered under the body. */
  actions?: ReactNode;
  now?: Date;
  className?: string;
}) {
  const tone = ANNOUNCEMENT_TONE[a.tone] ?? ANNOUNCEMENT_TONE.INFO;
  const Icon = tone.icon;
  const expired = a.expiresAt !== null && a.expiresAt.getTime() <= now.getTime();
  const isNew = !expired && now.getTime() - a.createdAt.getTime() < NEW_FOR_MS;

  return (
    <article className={cn("apple-card flex gap-3.5 p-4 sm:p-5", expired && "opacity-60", className)}>
      <span
        aria-hidden
        className={cn("grid size-10 shrink-0 place-items-center rounded-[11px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.28)]", tone.tile)}
      >
        <Icon className="size-5" strokeWidth={2} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 text-[15px] leading-5 font-semibold">
            <span className="sr-only">{tone.label}: </span>
            {a.title}
          </h3>
          <time dateTime={a.createdAt.toISOString()} className="shrink-0 pt-px text-[12px] text-muted-foreground">
            {fmtRelativeDays(a.createdAt, now)}
          </time>
        </div>
        <p className="mt-1 text-[15px] leading-5.5 whitespace-pre-line text-foreground/85">{a.body}</p>

        {(a.pinned || isNew || a.expiresAt) && (
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
            {isNew && (
              <span className="inline-flex items-center gap-1 font-semibold text-foreground/80">
                <span aria-hidden className="size-1.5 rounded-full bg-primary" />
                جديد
              </span>
            )}
            {a.pinned && (
              <span className="inline-flex items-center gap-1">
                <Pin className="size-3" strokeWidth={2.2} />
                مثبّت
              </span>
            )}
            {a.expiresAt && <span>{expired ? "انتهى" : `ظاهر لحد ${fmtDayMonth(new Date(a.expiresAt.getTime() - 1))}`}</span>}
          </div>
        )}
        {actions && <div className="mt-3 flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </article>
  );
}
