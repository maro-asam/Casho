import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Settings icon tile: white glyph on a system-color rounded square. */
export function IconTile({ icon: Icon, tint, size = "sm" }: { icon: LucideIcon; tint: string; size?: "sm" | "md" }) {
  return (
    <span aria-hidden className={cn("grid shrink-0 place-items-center text-white", tint, size === "sm" ? "size-[29px] rounded-[7px]" : "size-8 rounded-[8px]")}>
      <Icon className={size === "sm" ? "size-[17px]" : "size-[18px]"} strokeWidth={2} />
    </span>
  );
}

/** Inset grouped section: small header, white rounded card with inset hairlines, footnote. */
export function Group({
  id,
  title,
  action,
  footer,
  inset = 16,
  children,
  className,
}: {
  id?: string;
  title?: string;
  action?: ReactNode;
  footer?: ReactNode;
  /** Separator inset (px) — 16 for text rows, 58 when rows lead with an icon tile. */
  inset?: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} aria-labelledby={id && title ? `${id}-title` : undefined} className={cn("scroll-mt-24 space-y-2", className)}>
      {(title || action) && (
        <div className="flex items-end justify-between gap-3 px-4">
          {title && (
            <h2 id={id ? `${id}-title` : undefined} className="text-[13px] font-semibold text-muted-foreground">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      <div className="apple-card apple-rows overflow-hidden rounded-[14px]" style={{ ["--row-inset" as string]: `${inset}px` }}>
        {children}
      </div>
      {footer && <p className="px-4 text-[13px] leading-[18px] text-muted-foreground">{footer}</p>}
    </section>
  );
}
