"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Transparent over the hero; gains a solid surface + border once the page scrolls.
export default function AnimatedNavbarShell({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={cn(
        "mx-auto flex h-16 max-w-7xl items-center rounded-xl border px-3 transition-[background-color,border-color,box-shadow] duration-200 sm:px-4",
        scrolled
          ? "border-border bg-background/85 shadow-sm backdrop-blur-md supports-backdrop-filter:bg-background/75"
          : "border-transparent bg-transparent",
      )}
    >
      {children}
    </div>
  );
}
