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
      initial={{ opacity: 0, y: -20, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "mx-auto transition-[max-width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        scrolled ? "max-w-4xl" : "max-w-full",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between px-4 md:px-6 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          scrolled
            ? "rounded-2xl border border-border/20 bg-background/85 py-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.05)] backdrop-blur-2xl dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
            : "rounded-xl border border-border/10 bg-card/60 py-3.5 shadow-sm backdrop-blur-md",
        )}
      >
        {children}
      </div>
    </motion.div>
  );
}
