"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useActiveNavKey, useNavLinks } from "./nav-links";

const spring = { type: "spring", stiffness: 420, damping: 34 } as const;

export default function NavbarDesktopLinks() {
  const links = useNavLinks();
  const activeKey = useActiveNavKey();
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <nav
      aria-label="Main"
      onMouseLeave={() => setHovered(null)}
      className="hidden items-center gap-0.5 lg:flex"
    >
      {links.map((link) => {
        const active = activeKey === link.key;

        return (
          <Link
            key={link.key}
            href={link.href}
            aria-current={active ? "page" : undefined}
            onMouseEnter={() => setHovered(link.key)}
            onFocus={() => setHovered(link.key)}
            onBlur={() => setHovered(null)}
            className={cn(
              "relative isolate rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {/* Pill that glides between hovered links */}
            {hovered === link.key && (
              <motion.span
                layoutId="welcome-nav-hover"
                transition={spring}
                className={cn(
                  "absolute inset-0 -z-10 rounded-full",
                  active ? "bg-primary/10" : "bg-foreground/[0.06] dark:bg-white/[0.08]",
                )}
              />
            )}

            {active && (
              <motion.span
                layoutId="welcome-nav-active"
                transition={spring}
                className="absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-primary"
              />
            )}

            <span className="relative">{link.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
