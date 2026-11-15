/**
 * Whether things should stay still: the shopper asked for reduced motion, or
 * the merchant set the Studio's motion to "none" (`data-motion` on the store
 * root). For script-driven motion (autoplaying slideshows, rotating
 * announcements) — CSS motion is handled by each theme's stylesheet.
 * Browser-only; returns false on the server.
 */
export function motionOff(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.querySelector('.store-theme-root[data-motion="none"]') !== null
  );
}
