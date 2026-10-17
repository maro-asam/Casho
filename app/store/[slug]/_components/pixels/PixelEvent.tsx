"use client";

import { useEffect } from "react";

import type { PixelEventName, PixelEventPayload } from "@/lib/pixels/shared";
import { trackPixelEvent } from "./pixel-events";

/**
 * Fires one pixel event when a storefront page mounts. Route files render it
 * next to the theme, so every theme gets tracking without touching its views.
 * `onceKey` makes it fire once per browser (e.g. the purchase on a thank-you
 * page the customer reloads).
 */
export function PixelEvent({ name, payload, onceKey }: { name: PixelEventName; payload: PixelEventPayload; onceKey?: string }) {
  useEffect(() => {
    if (onceKey) {
      try {
        const key = `casho:pixel:${onceKey}`;
        if (localStorage.getItem(key)) return;
        localStorage.setItem(key, "1");
      } catch {
        // storage blocked — the shared eventId still lets Meta/TikTok dedupe
      }
    }
    trackPixelEvent(name, payload);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per mount
  }, []);

  return null;
}
