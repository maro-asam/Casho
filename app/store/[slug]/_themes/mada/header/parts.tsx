"use client";

import Image from "next/image";
import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { StoreShell } from "../../types";

export function StoreMark({ shell, className }: { shell: StoreShell; className?: string }) {
  const height = Math.max(28, Math.min(shell.logoSize, 44));
  const isSvg = !!shell.logo && (shell.logo.endsWith(".svg") || shell.logo.includes("/svg"));
  const nameVisible = shell.showStoreName || !shell.logo;
  return (
    <Link href={buildStoreUrl(shell.slug)} aria-label={`${shell.name} — الصفحة الرئيسية`} className={cn("flex min-w-0 items-center gap-2.5", className)}>
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
      {nameVisible && <span className="md-face truncate text-[1.25rem] font-bold sm:text-[1.375rem]">{shell.name}</span>}
    </Link>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="تبديل الوضع الليلي"
      className={cn("md-btn md-btn--ghost md-btn--icon", className)}
    >
      <Sun className="dark:hidden" />
      <Moon className="hidden dark:block" />
    </button>
  );
}
