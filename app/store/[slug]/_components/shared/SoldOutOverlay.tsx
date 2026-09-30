/** A product whose stock ran out — still listed, just clearly unavailable. */
export function isSoldOut(product: { stock?: number | null }) {
  return typeof product.stock === "number" && product.stock <= 0;
}

/**
 * Drop inside a card's (relative) image container. Theme-neutral on purpose:
 * it has to read well on every store theme and color.
 */
export function SoldOutOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/35">
      <span className="rounded-full bg-black/80 px-3 py-1 text-xs font-semibold text-white">نفد المخزون</span>
    </div>
  );
}
