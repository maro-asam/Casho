import Image from "next/image";
import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { StoreShell } from "../../types";

/** Store logo and/or name. Without a logo the name sits beside a small
 *  plus mark in the store color. */
export default function StoreMark({ shell, className, onClick, tone }: { shell: StoreShell; className?: string; onClick?: () => void; tone?: "light" }) {
  const height = Math.max(32, Math.min(shell.logoSize, 52));
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
        <span aria-hidden className={cn("grid size-9 shrink-0 place-items-center rounded-[0.625rem]", tone === "light" ? "bg-white/15 text-white" : "bg-(--rx-btn) text-(--rx-btn-ink)")}>
          <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
            <path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z" />
          </svg>
        </span>
      )}
      {nameVisible && <span className={cn("rx-display truncate text-[1.25rem] leading-none sm:text-[1.4375rem]", tone === "light" && "!text-white")}>{shell.name}</span>}
    </Link>
  );
}
