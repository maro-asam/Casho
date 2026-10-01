"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, X } from "lucide-react";
import type { ConversionConfig, RecentPurchase } from "@/lib/conversion/conversion-config";
import { cn } from "@/lib/utils";
import { hasStickyBar, QUIET_PATHS, storeHref, storePath } from "./widget-position";

const rtf = new Intl.RelativeTimeFormat("ar-EG", { numeric: "auto" });

function timeAgo(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 60) return rtf.format(-Math.max(1, minutes), "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  return rtf.format(-Math.round(hours / 24), "day");
}

type Props = {
  storeSlug: string;
  config: ConversionConfig["purchaseToasts"];
  purchases: RecentPurchase[];
  /** Lift above the WhatsApp button when they share a corner. */
  stacked: boolean;
};

/**
 * "Someone just bought X" — built only from REAL recent orders (never invented),
 * first name only or fully anonymous, capped per visit.
 */
export function PurchaseToasts({ storeSlug, config, purchases, stacked }: Props) {
  const pathname = usePathname();
  const path = storePath(pathname, storeSlug);
  const [index, setIndex] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const quiet = QUIET_PATHS.test(path);

  useEffect(() => {
    if (quiet || dismissed || purchases.length === 0) return;
    const key = `casho:toasts:${storeSlug}`;
    let shown = 0;
    try {
      shown = Number(sessionStorage.getItem(key) ?? 0);
    } catch {}
    if (shown >= config.maxPerVisit) return;

    let hideTimer: ReturnType<typeof setTimeout>;
    let next = shown % purchases.length;
    const tick = () => {
      if (shown >= config.maxPerVisit) return;
      setIndex(next);
      shown += 1;
      next = (next + 1) % purchases.length;
      try {
        sessionStorage.setItem(key, String(shown));
      } catch {}
      hideTimer = setTimeout(() => setIndex(null), 5500);
    };
    const first = setTimeout(tick, 7000);
    const loop = setInterval(tick, config.intervalSeconds * 1000 + 5500);
    return () => {
      clearTimeout(first);
      clearTimeout(hideTimer);
      clearInterval(loop);
    };
  }, [quiet, dismissed, purchases.length, config.maxPerVisit, config.intervalSeconds, storeSlug]);

  if (quiet || dismissed || index === null) return null;
  const item = purchases[index];
  if (!item) return null;

  const who = config.nameMode === "first" && item.firstName ? item.firstName : "عميل";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed z-[60] w-[min(22rem,calc(100vw-2.5rem))] animate-in fade-in-0 slide-in-from-bottom-4 duration-500",
        config.position === "start" ? "start-5" : "end-5",
        stacked ? "bottom-24" : "bottom-5",
        hasStickyBar(path) && (stacked ? "max-lg:bottom-44" : "max-lg:bottom-24"),
      )}
    >
      <div className="relative flex items-center gap-3 rounded-2xl border border-(--store-border,#e4e4e7) bg-(--store-card,#fff) p-2.5 pe-8 text-(--store-card-foreground,#0a0a0a) shadow-xl">
        <Link
          href={storeHref(pathname, storeSlug, `/products/${item.productSlug}`)}
          className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-(--store-muted,#f4f4f5) after:absolute after:inset-0"
        >
          {item.productImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- merchant URLs from any host
            <img src={item.productImage} alt="" className="size-full object-cover" />
          ) : (
            <ShoppingBag className="m-auto mt-4 size-5 opacity-50" />
          )}
        </Link>
        <div className="min-w-0 text-sm">
          <p className="truncate">
            <span className="font-semibold">{who}</span> طلب
          </p>
          <p className="truncate font-medium">{item.productName}</p>
          <p className="text-xs text-(--store-muted-foreground,#6b7280)">{timeAgo(item.createdAt)}</p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="إخفاء"
          className="absolute end-2 top-2 grid size-6 place-items-center rounded-full text-(--store-muted-foreground,#6b7280) hover:bg-black/5"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
