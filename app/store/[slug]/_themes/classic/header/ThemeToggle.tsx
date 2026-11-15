"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { btn } from "../ui";
import { st } from "@/lib/i18n/storefront";

/** One-tap light/dark switch for shoppers. */
export default function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label={st("تبديل الوضع الليلي")}
      className={btn({ variant: "ghost", size: "icon", className })}
    >
      <Sun className="dark:hidden" />
      <Moon className="hidden dark:block" />
    </button>
  );
}
