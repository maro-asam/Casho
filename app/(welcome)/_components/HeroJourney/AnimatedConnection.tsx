"use client";

import { motion } from "framer-motion";
import { useId } from "react";

interface Props {
  /** SVG path d attribute */
  d: string;
  color: string;
  delay?: number;
  /** viewBox dimensions of the parent SVG */
  reverse?: boolean;
}

export default function AnimatedConnection({ d, color, delay = 0, reverse = false }: Props) {
  const id = useId();
  const gradId = `grad-${id}`;
  const filterId = `glow-${id}`;

  return (
    <g>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="50%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <filter id={filterId} x="-20%" y="-100%" width="140%" height="300%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* base track */}
      <path
        d={d}
        fill="none"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* animated beam */}
      <motion.path
        d={d}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="2"
        strokeLinecap="round"
        filter={`url(#${filterId})`}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{
          pathLength: {
            delay: delay + 0.5,
            duration: 1.2,
            ease: [0.16, 1, 0.3, 1],
          },
          opacity: { delay: delay + 0.5, duration: 0.3 },
        }}
      />

      {/* travelling particle */}
      <motion.circle
        r="3"
        fill={color}
        filter={`url(#${filterId})`}
        style={{ offsetPath: `path("${d}")` } as React.CSSProperties}
        animate={{
          offsetDistance: reverse ? ["100%", "0%"] : ["0%", "100%"],
          opacity: [0, 1, 1, 0],
          scale: [0.5, 1.2, 1, 0.5],
        }}
        transition={{
          duration: 2.8,
          delay: delay + 1.5,
          repeat: Infinity,
          repeatDelay: 1.2,
          ease: "easeInOut",
        }}
      />
    </g>
  );
}
