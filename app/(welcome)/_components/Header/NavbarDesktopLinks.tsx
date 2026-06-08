/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_LINKS = [
  { name: "الرئيسية", href: "/" },
  { name: "المميزات", href: "#features" },
  { name: "الأسعار", href: "#pricing" },
  { name: "الأسئلة", href: "#faq" },
  { name: "المدونة", href: "/blog" },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: -8, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function NavbarDesktopLinks() {
  const pathname = usePathname();
  const [hovered, setHovered] = useState<string | null>(null);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href.startsWith("#")) return false;
    return pathname.startsWith(href);
  };

  return (
    <motion.nav
      className="hidden items-center gap-0.5 md:flex"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      onMouseLeave={() => setHovered(null)}
    >
      {NAV_LINKS.map((link) => {
        const active = isActive(link.href);
        const showPill = hovered === link.name || (!hovered && active);

        return (
          // @ts-expect-error
          <motion.div key={link.name} variants={itemVariants} className="relative">
            <Link
              href={link.href}
              onMouseEnter={() => setHovered(link.name)}
              className={`relative inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-200 ${
                active
                  ? "text-foreground"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              {showPill && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-lg bg-foreground/6"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{link.name}</span>
              {active && (
                <span className="relative z-10 ms-1.5 inline-flex size-1.5 rounded-full bg-primary" />
              )}
            </Link>
          </motion.div>
        );
      })}
    </motion.nav>
  );
}
