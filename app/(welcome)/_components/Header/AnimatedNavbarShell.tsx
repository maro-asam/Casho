"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function AnimatedNavbarShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "mx-auto transition-[max-width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        scrolled ? "max-w-screen-xl" : "max-w-screen-2xl",
      )}
    >
      <div
        className={cn(
          "relative flex h-14 items-center rounded-xl px-2.5 ring-1 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-3 md:px-4",
          scrolled
            ? "bg-background/60 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.25)] ring-border/70 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-background/50 dark:bg-background/40 dark:ring-white/10 dark:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.7)]"
            : "bg-transparent ring-border/60 lg:h-16 dark:ring-white/10",
        )}
      >
        {children}
      </div>
    </motion.div>
  );
}
