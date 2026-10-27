"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useSharksCopy } from "./copy";

/**
 * One paragraph, read at the pace of the scroll: each word comes up from gray
 * as the reader reaches it. The text is fully present for screen readers and
 * under Reduce Motion.
 */
export default function Manifesto() {
  const c = useSharksCopy();
  const reduce = !!useReducedMotion();
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.82", "end 0.45"] });
  const words = c.manifesto.split(" ");

  return (
    <section className="al-section">
      <div className="al-container">
        <p ref={ref} className="sk-manifesto mx-auto max-w-[880px] text-pretty">
          {words.map((word, i) => (
            <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} still={reduce}>
              {word}
            </Word>
          ))}
        </p>
      </div>
    </section>
  );
}

function Word({ children, progress, range, still }: { children: string; progress: MotionValue<number>; range: [number, number]; still: boolean }) {
  const opacity = useTransform(progress, (v) => (still ? 1 : 0.16 + 0.84 * Math.min(1, Math.max(0, (v - range[0]) / (range[1] - range[0])))));
  // The server can't know about Reduce Motion, so its opacity can differ from
  // the client's first render; framer-motion writes the real value on mount.
  return (
    <>
      <motion.span style={{ opacity }} suppressHydrationWarning>
        {children}
      </motion.span>{" "}
    </>
  );
}
