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
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -16, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "mx-auto transition-[max-width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        scrolled ? "max-w-4xl" : "max-w-full",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between px-4 md:px-5 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          scrolled
            ? "rounded-2xl border border-border/15 bg-background/80 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-2xl dark:bg-background/70 dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
            : "rounded-2xl border border-transparent bg-transparent py-3",
        )}
      >
        {children}
      </div>
    </motion.div>
  );
}
