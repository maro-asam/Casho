import { getCarrier } from "@/lib/shipping/carriers";
import { cn } from "@/lib/utils";
import { tr } from "@/lib/i18n/dashboard";

const SIZES = {
  sm: "size-7 rounded-md text-[0.625rem]",
  md: "size-10 rounded-lg text-xs",
  lg: "size-12 rounded-xl text-sm",
} as const;

/** Monogram tile for a carrier (Casho never ships carrier logos). */
export function CarrierMark({
  carrier: key,
  size = "md",
  className,
}: {
  carrier: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const carrier = getCarrier(key);
  const mark = carrier?.mark ?? { text: tr("؟"), bg: "#E5E7EB", fg: "#374151" };
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center font-bold leading-none tracking-tight ring-1 ring-black/5 ring-inset dark:ring-white/10",
        SIZES[size],
        className,
      )}
      style={{ backgroundColor: mark.bg, color: mark.fg }}
    >
      {mark.text}
    </span>
  );
}
