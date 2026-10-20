"use client";

import { useEffect } from "react";

/**
 * Storefront end of the Studio canvas (active only inside an iframe, and only
 * for messages from our own origin):
 *
 *  ← CASHO_THEME_UPDATE  { cssVars }            live color tweaks, no reload
 *  ← CASHO_STUDIO_MODE   { edit, labels, tint } hover outline + click-to-edit
 *  ← CASHO_STUDIO_FOCUS  { id }                 scroll a region into view + flash it
 *  → CASHO_STUDIO_READY  { regions }            regions present on this page
 *  → CASHO_STUDIO_SELECT { id }                 merchant clicked a region
 *
 * Regions are delimited by <template data-studio-anchor> markers (StudioAnchor).
 */

type Message =
  | { type: "CASHO_THEME_UPDATE"; cssVars: Record<string, string> }
  | { type: "CASHO_STUDIO_MODE"; edit: boolean; labels?: Record<string, string>; tint?: string }
  | { type: "CASHO_STUDIO_FOCUS"; id: string };

type Region = { id: string; rect: DOMRect };

/** Bounding box of everything between an anchor and the next one (or the parent's end). */
function regionRect(anchor: Element): DOMRect | null {
  let top = Infinity;
  let left = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (let el = anchor.nextElementSibling; el && !el.hasAttribute("data-studio-anchor"); el = el.nextElementSibling) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    top = Math.min(top, r.top);
    left = Math.min(left, r.left);
    right = Math.max(right, r.right);
    bottom = Math.max(bottom, r.bottom);
  }
  return top === Infinity ? null : new DOMRect(left, top, right - left, bottom - top);
}

function regions(): Region[] {
  return [...document.querySelectorAll("template[data-studio-anchor]")].flatMap((anchor) => {
    const id = anchor.getAttribute("data-studio-anchor") ?? "";
    if (!id || id.startsWith("__")) return [];
    const rect = regionRect(anchor);
    return rect ? [{ id, rect }] : [];
  });
}

/** Innermost region under the pointer. */
function regionAt(x: number, y: number): Region | null {
  const hits = regions().filter(({ rect }) => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom);
  return hits.sort((a, b) => a.rect.width * a.rect.height - b.rect.width * b.rect.height)[0] ?? null;
}

function makeOverlay(tint: string) {
  const box = document.createElement("div");
  box.setAttribute("aria-hidden", "true");
  Object.assign(box.style, {
    position: "fixed",
    zIndex: "2147483646",
    pointerEvents: "none",
    border: `2px solid ${tint}`,
    borderRadius: "10px",
    background: `color-mix(in srgb, ${tint} 7%, transparent)`,
    transition: "top .12s ease, left .12s ease, width .12s ease, height .12s ease, opacity .12s ease",
    opacity: "0",
  } satisfies Partial<CSSStyleDeclaration>);
  const label = document.createElement("span");
  Object.assign(label.style, {
    position: "absolute",
    insetInlineStart: "8px",
    top: "8px",
    padding: "3px 10px",
    borderRadius: "999px",
    background: tint,
    color: "#fff",
    font: "600 12px/18px -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif",
    boxShadow: "0 4px 12px rgba(0,0,0,.18)",
    whiteSpace: "nowrap",
  } satisfies Partial<CSSStyleDeclaration>);
  box.appendChild(label);
  document.body.appendChild(box);
  return { box, label };
}

export function StoreBuilderBridge() {
  useEffect(() => {
    if (typeof window === "undefined" || window === window.top) return;
    const origin = window.location.origin;
    const post = (message: object) => window.parent.postMessage(message, origin);

    let edit = false;
    let labels: Record<string, string> = {};
    let overlay: ReturnType<typeof makeOverlay> | null = null;
    let pointer: { x: number; y: number } | null = null;
    let frame = 0;

    function paint(region: Region | null, flash = false) {
      if (!overlay) return;
      const { box, label } = overlay;
      if (!region) {
        box.style.opacity = "0";
        return;
      }
      const { rect } = region;
      Object.assign(box.style, {
        top: `${Math.max(0, rect.top)}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        height: `${Math.min(rect.bottom, window.innerHeight) - Math.max(0, rect.top)}px`,
        opacity: "1",
      });
      label.textContent = labels[region.id] ?? "";
      label.style.display = label.textContent ? "" : "none";
      if (flash) box.animate([{ opacity: 1 }, { opacity: 0.35 }, { opacity: 1 }], { duration: 700, iterations: 2 });
    }

    function refresh() {
      frame = 0;
      if (!edit || !pointer) return paint(null);
      const region = regionAt(pointer.x, pointer.y);
      paint(region);
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(refresh);
    };

    function onMove(e: PointerEvent) {
      pointer = { x: e.clientX, y: e.clientY };
      schedule();
    }
    function onLeave() {
      pointer = null;
      schedule();
    }
    // Capture phase so links/buttons inside the section don't navigate while editing.
    function onClick(e: MouseEvent) {
      if (!edit) return;
      const region = regionAt(e.clientX, e.clientY);
      if (!region) return;
      e.preventDefault();
      e.stopPropagation();
      post({ type: "CASHO_STUDIO_SELECT", id: region.id });
    }

    function setMode(next: boolean, tint = "#0088ff") {
      edit = next;
      if (edit && !overlay) overlay = makeOverlay(tint);
      if (overlay) overlay.box.style.borderColor = tint;
      document.documentElement.style.cursor = edit ? "pointer" : "";
      schedule();
    }

    function focus(id: string) {
      const anchor = document.querySelector(`template[data-studio-anchor="${CSS.escape(id)}"]`);
      const target = anchor?.nextElementSibling;
      if (!anchor || !target) return;
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      if (!overlay) overlay = makeOverlay("#0088ff");
      // Paint once the smooth scroll has settled.
      window.setTimeout(() => {
        const rect = regionRect(anchor);
        if (rect) paint({ id, rect }, true);
      }, 450);
    }

    function onMessage(event: MessageEvent<Message>) {
      if (event.origin !== origin) return;
      const data = event.data;
      if (data?.type === "CASHO_THEME_UPDATE") {
        if (!data.cssVars || typeof data.cssVars !== "object") return;
        // Theme vars are declared on .store-theme-root (see layout), which beats
        // anything set on <html> — so apply them there as well.
        const targets = [document.documentElement, ...document.querySelectorAll<HTMLElement>(".store-theme-root")];
        for (const [property, value] of Object.entries(data.cssVars)) {
          if (typeof value !== "string" || !property.startsWith("--")) continue;
          for (const el of targets) el.style.setProperty(property, value);
        }
      } else if (data?.type === "CASHO_STUDIO_MODE") {
        labels = data.labels ?? labels;
        setMode(Boolean(data.edit), data.tint);
      } else if (data?.type === "CASHO_STUDIO_FOCUS" && typeof data.id === "string") {
        focus(data.id);
      }
    }

    window.addEventListener("message", onMessage);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("click", onClick, true);
    post({ type: "CASHO_STUDIO_READY", regions: regions().map((r) => r.id) });

    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("click", onClick, true);
      if (frame) cancelAnimationFrame(frame);
      overlay?.box.remove();
    };
  }, []);

  return null;
}
