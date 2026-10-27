"use client";

import { useEffect, useState } from "react";

import { ReopenExpiredPauseAction } from "@/actions/store/store-pause.actions";
import { countdownParts } from "@/lib/store/pause";
import { cn } from "@/lib/utils";

const UNITS = [
  { key: "days", label: "يوم" },
  { key: "hours", label: "ساعة" },
  { key: "minutes", label: "دقيقة" },
  { key: "seconds", label: "ثانية" },
] as const;

const RETRY_MS = 15_000;
const MAX_RETRIES = 20;
/** Reloads per tab, in case a cached closed page keeps coming back. */
const MAX_RELOADS = 3;

function reloadOnce(storeSlug: string) {
  const key = `casho-pause-reload:${storeSlug}`;
  try {
    const count = Number(sessionStorage.getItem(key) ?? 0);
    if (count >= MAX_RELOADS) return;
    sessionStorage.setItem(key, String(count + 1));
  } catch {
    // Storage blocked — one reload is still safe.
  }
  window.location.reload();
}

/**
 * Countdown to the reopen time (when `show`), and the reopen itself: at zero
 * it asks the server to clear the pause, then reloads into the open store.
 * Mounted on every paused closed page, countdown or not.
 */
export function PauseCountdown({ storeSlug, until, show, className }: { storeSlug: string; until: string; show: boolean; className?: string }) {
  // null until mounted: the page is cached, so the server's "now" is stale.
  const [now, setNow] = useState<Date | null>(null);
  const end = new Date(until);
  const parts = now ? countdownParts(end, now) : null;
  const done = parts?.done ?? false;

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!done) return;
    let cancelled = false;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    async function attempt() {
      const { open } = await ReopenExpiredPauseAction(storeSlug).catch(() => ({ open: false }));
      if (cancelled) return;
      // Not open yet means this device's clock runs ahead of ours: wait for it.
      if (open) reloadOnce(storeSlug);
      else if (++tries < MAX_RETRIES) timer = setTimeout(attempt, RETRY_MS);
    }
    attempt();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [done, storeSlug]);

  if (!show) return null;

  if (done) {
    return <p className={cn("text-[0.9375rem] font-semibold text-foreground", className)}>المتجر بيفتح دلوقتي…</p>;
  }

  const units = parts && parts.days === 0 ? UNITS.slice(1) : UNITS;
  return (
    <div role="timer" aria-label="الوقت الباقي على فتح المتجر" className={cn("flex gap-2 sm:gap-3", className)}>
      {units.map(({ key, label }) => (
        <div
          key={key}
          className="flex min-w-16 flex-col items-center rounded-(--store-radius,0.75rem) border border-border bg-card px-3 py-2.5 text-card-foreground sm:min-w-20 sm:py-3"
        >
          <span className="text-2xl font-bold leading-none tabular-nums sm:text-3xl">{parts ? String(parts[key]).padStart(2, "0") : "--"}</span>
          <span className="mt-1.5 text-xs text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}
