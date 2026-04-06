"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Store } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AnimatedStartButton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.4, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      className="hidden md:block"
    >

    </motion.div>
  );
}
