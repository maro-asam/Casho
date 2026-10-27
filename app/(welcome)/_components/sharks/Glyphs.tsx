import { cn } from "@/lib/utils";

// The Casho Sharks mark is the "selected dot" from the hero field: a filled
// brand dot inside a thin ring. Track glyphs extend it — one ring, two rings,
// and a dashed ring for the pathway that doesn't exist yet.

export function SharksMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className={cn("size-[1em] shrink-0", className)}>
      <circle cx="10" cy="10" r="8.5" fill="none" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.2" />
      <circle cx="10" cy="10" r="3.6" fill="currentColor" />
    </svg>
  );
}

export function TrackGlyph({ kind, className }: { kind: "BENEFITS" | "GROWTH" | "INVESTMENT"; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={cn("size-12 shrink-0", className)}>
      {kind === "INVESTMENT" ? (
        <>
          <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.3" strokeDasharray="2.5 4.5" strokeLinecap="round" />
          <circle cx="24" cy="24" r="4.5" fill="none" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.3" />
        </>
      ) : (
        <>
          {kind === "GROWTH" && <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeOpacity="0.22" strokeWidth="1.2" />}
          <circle cx="24" cy="24" r={kind === "GROWTH" ? 13.5 : 17} fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.3" />
          <circle cx="24" cy="24" r="5" fill="currentColor" />
        </>
      )}
    </svg>
  );
}
