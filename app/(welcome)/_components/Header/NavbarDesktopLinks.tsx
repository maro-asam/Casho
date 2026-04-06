/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const NAV_LINKS = [
  { name: "الرئيسية", href: "/" },
  { name: "المميزات", href: "#features" },
  { name: "الأسعار", href: "#pricing" },
  { name: "الأسئلة", href: "#faq" },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: -10,
    filter: "blur(6px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export default function NavbarDesktopLinks() {
  return (
    <motion.nav
      className="hidden items-center gap-1 md:flex"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {NAV_LINKS.map((link) => (
        // @ts-expect-error
        <motion.div key={link.name} variants={itemVariants}>
          <Link
            href={link.href}
            className="group relative inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-medium text-foreground/80 transition-colors duration-300 hover:text-primary"
          >
            <span className="relative z-10">{link.name}</span>

            <span className="absolute inset-0 rounded-md bg-primary/0 transition-colors duration-300 group-hover:bg-primary/5" />

            <span className="absolute bottom-1 right-4 h-0.5 w-0 rounded-md bg-primary transition-all duration-300 group-hover:w-[calc(100%-2rem)]" />
          </Link>
        </motion.div>
      ))}
    </motion.nav>
  );
}