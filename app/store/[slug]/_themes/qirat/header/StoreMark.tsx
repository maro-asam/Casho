import Image from "next/image";
import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { StoreShell } from "../../types";

/** Store logo and/or name (Studio → الهوية: logo, size, corners, show name).
 *  Without a logo the name is set as a serif wordmark, spaced like a maison's. */
export default function StoreMark({ shell, className, onClick, max = 52 }: { shell: StoreShell; className?: string; onClick?: () => void; /** Cap on the logo height (px). */ max?: number }) {
  const height = Math.max(28, Math.min(shell.logoSize, max));
  const isSvg = !!shell.logo && (shell.logo.endsWith(".svg") || shell.logo.includes("/svg"));
  const nameVisible = shell.showStoreName || !shell.logo;
  return (
    <Link href={buildStoreUrl(shell.slug)} onClick={onClick} aria-label={`${shell.name}، الصفحة الرئيسية`} className={cn("qr-mark", className)}>
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
      {nameVisible && <span className="qr-wordmark truncate">{shell.name}</span>}
    </Link>
  );
}
