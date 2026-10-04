import Image from "next/image";
import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { StoreShell } from "../../types";

/** Logo + store name set in the display face. */
export default function StoreMark({
  shell,
  size = "sm",
  className,
}: {
  shell: StoreShell;
  size?: "sm" | "lg";
  className?: string;
}) {
  const max = size === "lg" ? 56 : 36;
  const height = Math.max(28, Math.min(shell.logoSize, max));
  const isSvg = !!shell.logo && (shell.logo.endsWith(".svg") || shell.logo.includes("/svg"));
  // Without a logo the store name is the brand mark, whatever the setting says.
  const nameVisible = shell.showStoreName || !shell.logo;

  return (
    <Link
      href={buildStoreUrl(shell.slug)}
      aria-label={`${shell.name} — الصفحة الرئيسية`}
      className={cn("flex min-w-0 items-center gap-3", className)}
    >
      {shell.logo && (
        <span
          className="relative block shrink-0 overflow-hidden"
          style={{ height, width: height, borderRadius: Math.min(shell.logoRadius, height / 2) }}
        >
          {isSvg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shell.logo} alt="" className="size-full object-contain" />
          ) : (
            <Image src={shell.logo} alt="" fill sizes={`${height * 2}px`} priority className="object-cover" />
          )}
        </span>
      )}
      {nameVisible && (
        <span
          className={cn(
            "rq-face truncate font-semibold leading-tight",
            size === "lg" ? "text-[2rem]" : "text-[1.25rem]",
          )}
        >
          {shell.name}
        </span>
      )}
    </Link>
  );
}
