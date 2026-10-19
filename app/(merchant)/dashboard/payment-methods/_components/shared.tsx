import Image from "next/image";
import { cn } from "@/lib/utils";
import { tr } from "@/lib/i18n/dashboard";

export function MethodLogo({ src, alt, size = "md", className }: { src: string; alt: string; size?: "xs" | "sm" | "md" | "lg"; className?: string }) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-xl border border-black/5 bg-white shadow-xs dark:border-white/10",
        size === "xs" && "size-6 rounded-md p-0.5",
        size === "sm" && "size-8 rounded-lg p-1",
        size === "md" && "size-11 p-1.5",
        size === "lg" && "size-14 p-2",
        className,
      )}
    >
      <Image src={src} alt={alt} width={48} height={48} className="max-h-full w-auto object-contain" />
    </span>
  );
}

export function OnDot({ on, label }: { on: boolean; label?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs", on ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground")}>
      <span className={cn("size-1.5 rounded-full", on ? "bg-emerald-500" : "bg-muted-foreground/40")} />
      {label ?? (on ? tr("ظاهر للعملاء") : tr("مش مفعّل"))}
    </span>
  );
}
