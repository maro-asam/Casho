"use client";

import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { Check, Copy, Loader2, X } from "lucide-react";
import type { PopupConfig, PopupType } from "@/lib/popups/popup-config";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
//  Pure popup UI. Rendered by the storefront host AND the dashboard preview,
//  so what the merchant designs is exactly what customers get.
//  Colors come from the store theme vars (with neutral fallbacks).
// ─────────────────────────────────────────────────────────────────────────────

export type PopupStage = "offer" | "success";

type PopupViewProps = {
  type: PopupType;
  config: PopupConfig;
  stage: PopupStage;
  /** Inside the dashboard preview: absolute in its frame instead of fixed on the page. */
  contained?: boolean;
  /** Force the mobile layout (preview); otherwise responsive. */
  mobile?: boolean;
  revealedCode?: string | null;
  countdownTo?: string | null;
  pending?: boolean;
  error?: string | null;
  onSubmit?: (input: { phone: string; name: string }) => void;
  onCta?: () => void;
  onCopy?: () => void;
  onClose?: () => void;
};

const RADIUS = { sm: "0.5rem", md: "0.875rem", lg: "1.5rem" } as const;

function useCountdown(target?: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);
  if (!target) return null;
  const ms = new Date(target).getTime() - now;
  // Only real, near deadlines create honest urgency.
  if (!(ms > 0) || ms > 7 * 24 * 3600 * 1000) return null;
  const s = Math.floor(ms / 1000);
  const days = Math.floor(s / 86400);
  const parts = [Math.floor((s % 86400) / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, "0"));
  return { days, clock: parts.join(":") };
}

export function PopupView({
  type,
  config,
  stage,
  contained,
  mobile,
  revealedCode,
  countdownTo,
  pending,
  error,
  onSubmit,
  onCta,
  onCopy,
  onClose,
}: PopupViewProps) {
  const { content, design, gate } = config;
  const layout = mobile && design.layout === "split" ? "center" : design.layout;
  const blocking = layout !== "corner";
  const countdown = useCountdown(design.showCountdown ? countdownTo : null);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);
  const firstField = useRef<HTMLInputElement>(null);

  const needsForm = stage === "offer" && (type === "lead" || (type === "discount" && gate.requirePhone));

  useEffect(() => {
    if (contained) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [contained, onClose]);

  const style = {
    "--pp-accent": design.accent === "theme" ? "var(--store-primary, #111827)" : design.accent,
    "--pp-accent-fg": design.accent === "theme" ? "var(--store-primary-foreground, #fff)" : "#fff",
    "--pp-bg": "var(--store-card, #ffffff)",
    "--pp-fg": "var(--store-card-foreground, #0a0a0a)",
    "--pp-muted": "var(--store-muted-foreground, #6b7280)",
    "--pp-soft": "var(--store-muted, #f4f4f5)",
    "--pp-border": "var(--store-border, #e4e4e7)",
    "--pp-radius": RADIUS[design.radius],
  } as CSSProperties;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (needsForm) onSubmit?.({ phone, name });
    else onCta?.();
  }

  function copy() {
    if (!revealedCode) return;
    navigator.clipboard?.writeText(revealedCode).catch(() => {});
    setCopied(true);
    onCopy?.();
    setTimeout(() => setCopied(false), 1800);
  }

  const showImage = Boolean(content.image) && stage === "offer";
  const position = contained ? "absolute" : "fixed";

  const card = (
    <div
      role="dialog"
      aria-modal={blocking}
      aria-labelledby="casho-popup-title"
      style={style}
      className={cn(
        "pointer-events-auto relative w-full overflow-hidden bg-(--pp-bg) text-(--pp-fg) shadow-2xl ring-1 ring-black/5",
        "animate-in fade-in-0 zoom-in-95 duration-300",
        layout === "center" && "max-w-sm rounded-(--pp-radius)",
        layout === "split" && "grid max-w-2xl grid-cols-2 rounded-(--pp-radius)",
        layout === "bottom" && cn("rounded-t-(--pp-radius)", !mobile && "max-w-lg sm:rounded-(--pp-radius)"),
        layout === "corner" && "max-w-xs rounded-(--pp-radius)",
      )}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="إغلاق"
        className="absolute end-3 top-3 z-10 grid size-8 place-items-center rounded-full bg-black/5 text-(--pp-fg) backdrop-blur transition hover:bg-black/10"
      >
        <X className="size-4" />
      </button>

      {showImage && (
        <div
          className={cn(
            "relative bg-(--pp-soft)",
            layout === "split" ? "order-last min-h-80" : layout === "corner" ? "aspect-[2/1]" : "aspect-video",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- merchant URLs from any host */}
          <img src={content.image} alt="" className="absolute inset-0 size-full object-cover" />
        </div>
      )}

      <form onSubmit={submit} className={cn("flex flex-col justify-center gap-3 text-center", layout === "corner" ? "p-4" : "p-6 sm:p-7")}>
        {stage === "offer" ? (
          <>
            {content.eyebrow && (
              <p className="text-xs font-semibold tracking-wide text-(--pp-accent)">{content.eyebrow}</p>
            )}
            <h2 id="casho-popup-title" className={cn("font-bold leading-snug", layout === "corner" ? "text-lg" : "text-2xl")}>
              {content.title}
            </h2>
            {content.body && <p className="text-sm leading-6 text-(--pp-muted)">{content.body}</p>}

            {countdown && (
              <div className="mx-auto flex items-center gap-2 rounded-full bg-(--pp-soft) px-3 py-1 text-xs">
                <span className="text-(--pp-muted)">العرض ينتهي خلال</span>
                <span className="font-mono font-semibold tabular-nums" dir="ltr">
                  {countdown.days > 0 && `${countdown.days}d `}
                  {countdown.clock}
                </span>
              </div>
            )}

            {needsForm && (
              <div className="mt-1 space-y-2 text-right">
                {gate.askName && (
                  <input
                    ref={firstField}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="اسمك"
                    autoComplete="given-name"
                    maxLength={60}
                    className="h-11 w-full rounded-[calc(var(--pp-radius)*0.6)] border border-(--pp-border) bg-transparent px-3 text-sm outline-none focus:border-(--pp-accent) focus:ring-2 focus:ring-(--pp-accent)/20"
                  />
                )}
                <input
                  ref={gate.askName ? undefined : firstField}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="رقم الموبايل — 01xxxxxxxxx"
                  inputMode="tel"
                  autoComplete="tel"
                  dir="ltr"
                  maxLength={16}
                  aria-invalid={!!error || undefined}
                  className="h-11 w-full rounded-[calc(var(--pp-radius)*0.6)] border border-(--pp-border) bg-transparent px-3 text-right text-sm outline-none placeholder:text-right focus:border-(--pp-accent) focus:ring-2 focus:ring-(--pp-accent)/20"
                />
                {error && <p className="text-xs text-red-600">{error}</p>}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[calc(var(--pp-radius)*0.6)] bg-(--pp-accent) px-4 text-sm font-semibold text-(--pp-accent-fg) transition hover:opacity-90 disabled:opacity-60"
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              {content.ctaText}
            </button>

            {content.dismissText && (
              <button type="button" onClick={onClose} className="text-xs text-(--pp-muted) underline-offset-4 hover:underline">
                {content.dismissText}
              </button>
            )}
            {needsForm && <p className="text-[11px] text-(--pp-muted)">مش هنبعتلك غير العروض المهمة. ممكن تلغي في أي وقت.</p>}
          </>
        ) : (
          <>
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-(--pp-accent)/10 text-(--pp-accent)">
              <Check className="size-6" />
            </span>
            <h2 id="casho-popup-title" className="text-xl font-bold">
              {content.successTitle || "تمام!"}
            </h2>
            {content.successBody && <p className="text-sm leading-6 text-(--pp-muted)">{content.successBody}</p>}

            {revealedCode && (
              <button
                type="button"
                onClick={copy}
                className="group mt-1 flex h-14 w-full items-center justify-between rounded-[calc(var(--pp-radius)*0.6)] border-2 border-dashed border-(--pp-accent) bg-(--pp-accent)/5 px-4"
              >
                <span className="font-mono text-lg font-bold tracking-widest" dir="ltr">
                  {revealedCode}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-(--pp-accent)">
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {copied ? "اتنسخ" : "انسخ"}
                </span>
              </button>
            )}
            {countdown && revealedCode && (
              <p className="text-xs text-(--pp-muted)">
                الكود صالح لمدة{" "}
                <span className="font-mono font-semibold tabular-nums" dir="ltr">
                  {countdown.days > 0 && `${countdown.days}d `}
                  {countdown.clock}
                </span>
              </p>
            )}
            <button
              type="button"
              onClick={onClose}
              className="mt-1 inline-flex h-11 w-full items-center justify-center rounded-[calc(var(--pp-radius)*0.6)] bg-(--pp-accent) px-4 text-sm font-semibold text-(--pp-accent-fg) transition hover:opacity-90"
            >
              كمّل تسوّق
            </button>
          </>
        )}
      </form>
    </div>
  );

  return (
    <div
      dir="rtl"
      className={cn(
        position,
        "inset-0 z-[70] flex p-4",
        layout === "center" || layout === "split" ? "items-center justify-center" : "",
        layout === "bottom" && cn("items-end justify-center", mobile ? "p-0" : "max-sm:p-0"),
        layout === "corner" && "pointer-events-none items-end justify-start",
      )}
    >
      {blocking && (
        <div
          aria-hidden
          onClick={onClose}
          className={cn(position, "inset-0 bg-black/50 backdrop-blur-[2px] animate-in fade-in-0 duration-300")}
        />
      )}
      {card}
    </div>
  );
}
