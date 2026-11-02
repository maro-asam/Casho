import Image from "next/image";
import Link from "next/link";
import { Dumbbell } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { StoreShell } from "../../types";

/** Store logo and/or name (Studio → الهوية: logo, size, corners, show name).
 *  Without a logo the name sits beside a leaning red dumbbell block. */
export default function StoreMark({ shell, className, onClick }: { shell: StoreShell; className?: string; onClick?: () => void }) {
  const height = Math.max(32, Math.min(shell.logoSize, 56));
  const isSvg = !!shell.logo && (shell.logo.endsWith(".svg") || shell.logo.includes("/svg"));
  const nameVisible = shell.showStoreName || !shell.logo;
  return (
    <Link href={buildStoreUrl(shell.slug)} onClick={onClick} aria-label={`${shell.name} — الصفحة الرئيسية`} className={cn("flex min-w-0 items-center gap-2.5", className)}>
      {shell.logo ? (
        <span className="relative block shrink-0 overflow-hidden" style={{ height, width: height, borderRadius: Math.min(shell.logoRadius, height / 2) }}>
          {isSvg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shell.logo} alt="" className="size-full object-contain" />
          ) : (
            <Image src={shell.logo} alt="" fill sizes={`${height * 2}px`} priority className="object-cover" />
          )}
        </span>
      ) : (
        <span aria-hidden className="grid size-9 shrink-0 skew-x-(--gy-slant) place-items-center bg-(--gy-btn) text-(--gy-btn-ink)">
          <Dumbbell className="size-5 -skew-x-(--gy-slant)" />
        </span>
      )}
      {nameVisible && <span className="gy-display truncate text-[1.375rem] leading-none sm:text-[1.625rem]">{shell.name}</span>}
    </Link>
  );
}
