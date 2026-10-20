import Image from "next/image";
import { cn } from "@/lib/utils";

/** Brand logo on a white squircle (app-icon style), hairline rim instead of a border. */
export function MethodLogo({ src, alt, size = "md", className }: { src: string; alt: string; size?: "xs" | "sm" | "md" | "lg"; className?: string }) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden bg-white ring-[0.5px] ring-black/10 ring-inset dark:ring-white/15",
        size === "xs" && "size-6 rounded-[7px] p-0.5",
        size === "sm" && "size-8 rounded-[9px] p-1",
        size === "md" && "size-10 rounded-[11px] p-1.5",
        size === "lg" && "size-14 rounded-[15px] p-2",
        className,
      )}
    >
      <Image src={src} alt={alt} width={48} height={48} className="max-h-full w-auto object-contain" />
    </span>
  );
}
