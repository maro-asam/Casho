"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

/** One-tap light/dark switch for shoppers. */
export default function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="تبديل الوضع الليلي"
      className={cn("grid size-11 place-items-center transition-colors hover:text-(--rq-accent) [&_svg]:size-[1.125rem]", className)}
    >
      <Sun className="dark:hidden" />
      <Moon className="hidden dark:block" />
    </button>
  );
}
