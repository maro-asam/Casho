/**
 * Store pause rules (no DB, no Next) so they can be unit tested.
 *
 * - The merchant pauses the store until a time; the storefront shows a closed
 *   page and takes no orders until then. There is no "paused forever".
 * - A pause whose time has passed is simply over — nothing has to run for the
 *   store to reopen (the closed page also clears the column when it gets there).
 * - The closed page can show a countdown and the merchant's own message.
 */
import { z } from "zod";

// Messages are literal (not built from these) so the dashboard can translate them.
/** Longest pause the merchant can set in one go. */
export const MAX_PAUSE_DAYS = 90;
export const PAUSE_MESSAGE_MAX = 280;

const DAY_MS = 24 * 60 * 60 * 1000;
/** A reopen time this close is pointless (and probably a typo). */
const MIN_PAUSE_MS = 60 * 1000;

/** What a closed storefront page needs to show (serializable). */
export type StorePause = {
  /** ISO time the store reopens. */
  until: string;
  message: string | null;
  showCountdown: boolean;
};

export function isPaused(pausedUntil: Date | null | undefined, now = new Date()): pausedUntil is Date {
  return !!pausedUntil && pausedUntil.getTime() > now.getTime();
}

/** The pause to show, or null when the store isn't paused right now. */
export function activePause(
  settings: { pausedUntil: Date | null; pauseMessage: string | null; pauseCountdown: boolean } | null | undefined,
  now = new Date(),
): StorePause | null {
  if (!settings || !isPaused(settings.pausedUntil, now)) return null;
  return {
    until: settings.pausedUntil.toISOString(),
    message: settings.pauseMessage?.trim() || null,
    showCountdown: settings.pauseCountdown,
  };
}

export function pauseInputSchema(now = new Date()) {
  return z.object({
    until: z.coerce
      .date("اختار ميعاد رجوع المتجر")
      .refine((d) => d.getTime() - now.getTime() >= MIN_PAUSE_MS, "ميعاد الرجوع لازم يكون بعد دلوقتي")
      .refine((d) => d.getTime() - now.getTime() <= MAX_PAUSE_DAYS * DAY_MS, "أقصى مدة للإيقاف 90 يوم"),
    message: z
      .string()
      .trim()
      .max(PAUSE_MESSAGE_MAX, "الرسالة طويلة — أقصى حاجة 280 حرف")
      .optional()
      .transform((v) => v || null),
    showCountdown: z.boolean(),
  });
}

export type PauseInput = z.input<ReturnType<typeof pauseInputSchema>>;

/** Remaining time split for a countdown (all zero once it's over). */
export function countdownParts(until: Date, now: Date) {
  const total = Math.max(0, Math.floor((until.getTime() - now.getTime()) / 1000));
  return {
    done: total === 0,
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}
