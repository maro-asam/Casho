import {
  ShoppingBag,
  RotateCcw,
  XCircle,
  Star,
  Wallet,
  Tag,
  FileText,
  User,
  Gift,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TimelineEvent = {
  id: string;
  eventType: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  referenceId: string | null;
  createdAt: Date;
};

const eventConfig: Record<
  string,
  { icon: React.ElementType; color: string; bg: string }
> = {
  ORDER_PLACED:    { icon: ShoppingBag, color: "text-emerald-600", bg: "bg-emerald-500/10" },
  ORDER_RETURNED:  { icon: RotateCcw,   color: "text-amber-600",  bg: "bg-amber-500/10"  },
  ORDER_CANCELED:  { icon: XCircle,     color: "text-rose-600",   bg: "bg-rose-500/10"   },
  POINTS_EARNED:   { icon: Star,        color: "text-violet-600", bg: "bg-violet-500/10" },
  POINTS_REDEEMED: { icon: Gift,        color: "text-violet-600", bg: "bg-violet-500/10" },
  POINTS_ADJUSTED: { icon: Star,        color: "text-blue-600",   bg: "bg-blue-500/10"   },
  WALLET_CREDITED: { icon: Wallet,      color: "text-emerald-600", bg: "bg-emerald-500/10" },
  WALLET_DEBITED:  { icon: Wallet,      color: "text-rose-600",   bg: "bg-rose-500/10"   },
  TAG_ADDED:       { icon: Tag,         color: "text-blue-600",   bg: "bg-blue-500/10"   },
  TAG_REMOVED:     { icon: Tag,         color: "text-gray-500",   bg: "bg-gray-500/10"   },
  NOTE_ADDED:      { icon: FileText,    color: "text-indigo-600", bg: "bg-indigo-500/10" },
  PROFILE_UPDATED: { icon: User,        color: "text-gray-600",   bg: "bg-gray-500/10"   },
  REFERRAL_MADE:   { icon: User,        color: "text-pink-600",   bg: "bg-pink-500/10"   },
};

export function CustomerTimelineTab({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border py-14 text-center">
        <MoreHorizontal className="mb-3 size-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">لا توجد أحداث في السجل بعد</p>
      </div>
    );
  }

  // Group by date
  const grouped: Record<string, TimelineEvent[]> = {};
  for (const ev of events) {
    const key = new Date(ev.createdAt).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(ev);
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([date, dayEvents]) => (
        <div key={date}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
            {date}
          </p>
          <div className="space-y-0">
            {dayEvents.map((ev, idx) => {
              const cfg = eventConfig[ev.eventType] ?? {
                icon: MoreHorizontal,
                color: "text-gray-500",
                bg: "bg-gray-500/10",
              };
              const Icon = cfg.icon;
              const isLast = idx === dayEvents.length - 1;

              return (
                <div key={ev.id} className="relative flex gap-3">
                  {/* Line */}
                  {!isLast && (
                    <div className="absolute right-[17px] top-9 h-full w-px bg-border" />
                  )}

                  {/* Icon */}
                  <div
                    className={cn(
                      "relative z-10 mt-1 flex size-8 shrink-0 items-center justify-center rounded-full",
                      cfg.bg
                    )}
                  >
                    <Icon className={cn("size-3.5", cfg.color)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium leading-tight">{ev.title}</p>
                        {ev.description && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {ev.description}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {new Date(ev.createdAt).toLocaleTimeString("ar-EG", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
