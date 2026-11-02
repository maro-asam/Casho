import Image from "next/image";
import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { StoreShell } from "../../types";

/** Store logo and/or name (Studio → الهوية: logo, size, corners, show name).
 *  Without a logo the store's first letter sits on an app-icon tile. */
export default function StoreMark({ shell, className, onClick }: { shell: StoreShell; className?: string; onClick?: () => void }) {
  const height = Math.max(28, Math.min(shell.logoSize, 44));
  const isSvg = !!shell.logo && (shell.logo.endsWith(".svg") || shell.logo.includes("/svg"));
  const nameVisible = shell.showStoreName || !shell.logo;
  return (
    <Link href={buildStoreUrl(shell.slug)} onClick={onClick} aria-label={`${shell.name}، الصفحة الرئيسية`} className={cn("flex min-w-0 items-center gap-2", className)}>
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
        <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-[0.5625rem] bg-(--mk-btn) text-base font-bold leading-none text-(--mk-btn-ink)">
          {[...shell.name.trim()][0]}
        </span>
      )}
      {nameVisible && <span className="truncate text-[1.0625rem] font-semibold tracking-tight text-(--mk-ink) sm:text-lg">{shell.name}</span>}
    </Link>
  );
}
