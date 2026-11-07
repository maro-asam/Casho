import { Megaphone } from "lucide-react";
import { AnnouncementCard } from "@/components/sales/announcement-card";
import type { Announcement } from "@/lib/sales/campaign-queries";

/** Messages from the admin team, pinned first. Hidden when there's nothing to say. */
export function AnnouncementsBoard({ items }: { items: Announcement[] }) {
  if (items.length === 0) return null;
  const now = new Date();
  return (
    <section aria-labelledby="board-title" className="space-y-2.5">
      <h2 id="board-title" className="flex items-center gap-1.5 px-1 text-[13px] font-semibold text-muted-foreground">
        <Megaphone className="size-4" strokeWidth={2} />
        من الإدارة
      </h2>
      <div className="grid gap-3 lg:grid-cols-2">
        {items.map((a, i) => (
          // An odd count lets the first (pinned / newest) take the full row.
          <AnnouncementCard key={a.id} announcement={a} now={now} className={items.length % 2 === 1 && i === 0 ? "lg:col-span-2" : undefined} />
        ))}
      </div>
    </section>
  );
}
