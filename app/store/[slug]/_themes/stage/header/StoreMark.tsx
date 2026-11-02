import Image from "next/image";
import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { StoreShell } from "../../types";

/** Store logo and/or name (Studio → الهوية: logo, size, corners, show name).
 *  The bar is thin, so the logo is capped at its height; without one the name
 *  is set as a wordmark. */
export default function StoreMark({ shell, className, onClick }: { shell: StoreShell; className?: string; onClick?: () => void }) {
  const height = Math.max(24, Math.min(shell.logoSize, 36));
  const isSvg = !!shell.logo && (shell.logo.endsWith(".svg") || shell.logo.includes("/svg"));
  const nameVisible = shell.showStoreName || !shell.logo;
  return (
    <Link href={buildStoreUrl(shell.slug)} onClick={onClick} aria-label={`${shell.name}، الصفحة الرئيسية`} className={cn("flex min-w-0 items-center gap-2", className)}>
      {shell.logo && (
        <span className="relative block shrink-0 overflow-hidden" style={{ height, width: height, borderRadius: Math.min(shell.logoRadius, height / 2) }}>
          {isSvg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shell.logo} alt="" className="size-full object-contain" />
          ) : (
            <Image src={shell.logo} alt="" fill sizes={`${height * 2}px`} priority className="object-cover" />
          )}
        </span>
      )}
      {nameVisible && <span className="sg-wordmark truncate">{shell.name}</span>}
    </Link>
  );
}
