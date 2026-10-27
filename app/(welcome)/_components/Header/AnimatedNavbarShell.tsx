"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Floating Liquid Glass island. At the top of the page it is a wide, clear
 * bar; once content scrolls beneath it, it tightens into a compact glass
 * capsule with a hairline scroll-progress indicator along its bottom edge.
 */
export default function AnimatedNavbarShell({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  const [onDark, setOnDark] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 260, damping: 40, restDelta: 0.001 });

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      const beneath = document.elementsFromPoint(window.innerWidth / 2, 36);
      setOnDark(beneath.some((el) => el.closest(".al-dark")));
    };
    onScroll();
    // Re-check once the page beneath has laid out (first paint can race this effect).
    const raf = requestAnimationFrame(onScroll);
    const timer = window.setTimeout(onScroll, 400);
    // Streamed page content can land after this effect (e.g. a dark hero arriving
    // late); re-check whenever the page height changes.
    const ro = new ResizeObserver(onScroll);
    ro.observe(document.body);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      className={cn(
        "relative mx-auto flex items-center rounded-full ps-4 pe-2",
        "transition-[max-width,height,background-color,box-shadow] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
        scrolled ? "al-glass h-[52px] max-w-[1040px]" : "h-14 max-w-[1200px] bg-transparent",
        onDark && "al-nav-dark",
      )}
    >
      {children}

      {/* Scroll progress, clipped to the capsule */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 overflow-hidden rounded-full transition-opacity duration-500",
          scrolled ? "opacity-100" : "opacity-0",
        )}
      >
        <motion.span
          style={{ scaleX: progress }}
          className="absolute inset-x-6 bottom-0 h-[2px] origin-left rounded-full bg-linear-to-r from-[#1447e6]/0 via-[#1447e6] to-[#4d7cff] rtl:origin-right dark:via-[#3366ff]"
        />
      </span>
    </div>
  );
}
