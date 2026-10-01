"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { PopupView, type PopupStage } from "@/components/storefront/popup-view";
import type { StorefrontPopup } from "@/lib/popups/popup-config";
import {
  SubmitPopupLeadAction,
  TrackPopupConversionAction,
  TrackPopupEventAction,
} from "@/actions/store/popups.actions";
import { QUIET_PATHS, storeHref, storePath } from "./widget-position";

// ─────────────────────────────────────────────────────────────────────────────
//  Decides which popup (if any) a visitor sees, and when.
//  - Never on cart / checkout / order pages (don't interrupt a purchase).
//  - One popup per visit at most; highest priority eligible one wins.
//  - Frequency + "new vs returning" are tracked in localStorage per store.
// ─────────────────────────────────────────────────────────────────────────────

type Memory = { seen: Record<string, number>; visits: number; done: string[] };

function storageKey(slug: string) {
  return `casho:popups:${slug}`;
}

function readMemory(slug: string): Memory {
  try {
    const raw = localStorage.getItem(storageKey(slug));
    const parsed = raw ? (JSON.parse(raw) as Partial<Memory>) : {};
    return { seen: parsed.seen ?? {}, visits: parsed.visits ?? 0, done: parsed.done ?? [] };
  } catch {
    return { seen: {}, visits: 0, done: [] };
  }
}

function writeMemory(slug: string, memory: Memory) {
  try {
    localStorage.setItem(storageKey(slug), JSON.stringify(memory));
  } catch {
    // private mode / blocked storage — popups still work, just without memory
  }
}

function sessionFlag(key: string, set?: boolean) {
  try {
    if (set) sessionStorage.setItem(key, "1");
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

/** Previews inside the dashboard (iframes) must not inflate the merchant's stats. */
function isPreview() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function isEligible(popup: StorefrontPopup, path: string, memory: Memory, isMobile: boolean, sessionKey: string) {
  const { targeting, frequency } = popup.config;
  if (popup.endsAt && new Date(popup.endsAt).getTime() < Date.now()) return false;
  if (memory.done.includes(popup.id)) return false; // already converted — never nag again

  if (targeting.pages === "home" && path !== "/") return false;
  if (targeting.pages === "products" && !/^\/(products|categories)(\/|$)/.test(path)) return false;
  if (targeting.devices === "mobile" && !isMobile) return false;
  if (targeting.devices === "desktop" && isMobile) return false;
  if (targeting.audience === "new" && memory.visits > 1) return false;
  if (targeting.audience === "returning" && memory.visits <= 1) return false;

  const lastSeen = memory.seen[popup.id];
  if (frequency.mode === "once" && lastSeen) return false;
  if (frequency.mode === "session" && sessionFlag(`${sessionKey}:${popup.id}`)) return false;
  if (frequency.mode === "days" && lastSeen && Date.now() - lastSeen < frequency.days * 86400_000) return false;
  return true;
}

export function PopupHost({ storeSlug, popups }: { storeSlug: string; popups: StorefrontPopup[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [active, setActive] = useState<StorefrontPopup | null>(null);
  const [stage, setStage] = useState<PopupStage>("offer");
  const [code, setCode] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const shownThisVisit = useRef(false);
  const tracked = useRef<Set<string>>(new Set());
  const sessionKey = `casho:popup-session:${storeSlug}`;

  // Count a "visit" once per browser session (drives new vs returning).
  useEffect(() => {
    if (sessionFlag(`${sessionKey}:visit`)) return;
    sessionFlag(`${sessionKey}:visit`, true);
    const memory = readMemory(storeSlug);
    writeMemory(storeSlug, { ...memory, visits: memory.visits + 1 });
  }, [storeSlug, sessionKey]);

  const show = useCallback(
    (popup: StorefrontPopup, mobile: boolean) => {
      if (shownThisVisit.current || sessionFlag(`${sessionKey}:shown`)) return;
      shownThisVisit.current = true;
      sessionFlag(`${sessionKey}:shown`, true);
      sessionFlag(`${sessionKey}:${popup.id}`, true);
      const memory = readMemory(storeSlug);
      writeMemory(storeSlug, { ...memory, seen: { ...memory.seen, [popup.id]: Date.now() } });
      setStage("offer");
      setCode(null);
      setError(null);
      setIsMobile(mobile);
      setActive(popup);
      if (!isPreview() && !tracked.current.has(`v:${popup.id}`)) {
        tracked.current.add(`v:${popup.id}`);
        TrackPopupEventAction(popup.id, "view").catch(() => {});
      }
    },
    [storeSlug, sessionKey],
  );

  // Visual builder: show a popup on demand, skipping triggers / frequency rules.
  useEffect(() => {
    if (!isPreview()) return;
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "CASHO_PREVIEW_POPUP") return;
      const popup = event.data.popup as StorefrontPopup | null;
      if (!popup) {
        setActive(null);
        return;
      }
      setStage("offer");
      setCode(null);
      setError(null);
      setIsMobile(window.matchMedia("(max-width: 767px)").matches);
      setActive(popup);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Arm the trigger of the best eligible popup for this page.
  useEffect(() => {
    if (!popups.length || shownThisVisit.current || sessionFlag(`${sessionKey}:shown`)) return;
    const path = storePath(pathname, storeSlug);
    if (QUIET_PATHS.test(path)) return;

    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const memory = readMemory(storeSlug);
    const popup = [...popups]
      .sort((a, b) => b.priority - a.priority)
      .find((p) => isEligible(p, path, memory, mobile, sessionKey));
    if (!popup) return;

    const { trigger } = popup.config;
    const cleanups: Array<() => void> = [];

    if (trigger.kind === "scroll") {
      const onScroll = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (max <= 0 || (window.scrollY / max) * 100 >= trigger.scrollPercent) show(popup, mobile);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      cleanups.push(() => window.removeEventListener("scroll", onScroll));
    } else if (trigger.kind === "exit" && !mobile) {
      const onLeave = (e: MouseEvent) => {
        if (e.clientY <= 0 && !e.relatedTarget) show(popup, mobile);
      };
      document.addEventListener("mouseout", onLeave);
      cleanups.push(() => document.removeEventListener("mouseout", onLeave));
    } else if (trigger.kind === "exit" && mobile) {
      // No mouse on phones: a quick scroll back up is the closest "about to leave" signal.
      let lastY = window.scrollY;
      let armed = false;
      const arm = setTimeout(() => (armed = true), 8000);
      const onScroll = () => {
        const y = window.scrollY;
        if (armed && lastY - y > 120 && y > 300) show(popup, mobile);
        lastY = y;
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      cleanups.push(() => {
        clearTimeout(arm);
        window.removeEventListener("scroll", onScroll);
      });
    } else {
      const t = setTimeout(() => show(popup, mobile), trigger.delaySeconds * 1000);
      cleanups.push(() => clearTimeout(t));
    }

    return () => cleanups.forEach((fn) => fn());
  }, [pathname, popups, storeSlug, sessionKey, show]);

  if (!active) return null;

  const markDone = () => {
    const memory = readMemory(storeSlug);
    if (!memory.done.includes(active.id)) writeMemory(storeSlug, { ...memory, done: [...memory.done, active.id] });
  };

  const trackClick = () => {
    if (isPreview() || tracked.current.has(`c:${active.id}`)) return;
    tracked.current.add(`c:${active.id}`);
    TrackPopupEventAction(active.id, "click").catch(() => {});
  };

  async function submit({ phone, name }: { phone: string; name: string }) {
    if (!active) return;
    // Builder preview: walk through the flow without saving a test customer.
    if (isPreview()) {
      setCode(active.type === "discount" ? active.config.content.couponCode || null : null);
      setStage("success");
      return;
    }
    trackClick();
    setPending(true);
    setError(null);
    const result = await SubmitPopupLeadAction(active.id, { phone, name }).catch(() => ({
      ok: false as const,
      message: "حصلت مشكلة، جرّب تاني.",
    }));
    setPending(false);
    if (!result.ok) return setError(result.message);
    markDone();
    setCode(result.couponCode);
    setStage("success");
  }

  function cta() {
    if (!active) return;
    trackClick();
    if (active.type === "discount") {
      setCode(active.config.content.couponCode || null);
      setStage("success");
      return;
    }
    // Announcement: following the link is the conversion.
    if (!isPreview()) TrackPopupConversionAction(active.id).catch(() => {});
    markDone();
    setActive(null);
    const link = active.config.content.ctaLink;
    if (!link) return;
    if (link.startsWith("/")) router.push(storeHref(pathname, storeSlug, link));
    else window.location.href = link;
  }

  function copied() {
    if (!active || isPreview() || tracked.current.has(`k:${active.id}`)) return;
    tracked.current.add(`k:${active.id}`);
    markDone();
    TrackPopupConversionAction(active.id).catch(() => {});
  }

  return (
    <PopupView
      type={active.type}
      config={active.config}
      stage={stage}
      mobile={isMobile}
      revealedCode={code}
      countdownTo={earliest(active.endsAt, active.couponExpiresAt)}
      pending={pending}
      error={error}
      onSubmit={submit}
      onCta={cta}
      onCopy={copied}
      onClose={() => setActive(null)}
    />
  );
}

function earliest(a: string | null, b: string | null) {
  if (!a) return b;
  if (!b) return a;
  return new Date(a) < new Date(b) ? a : b;
}
