"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const ICONS = ["🛍️", "💰", "✅", "🚚", "📦", "📈", "👤", "🎯"];
const COLORS = [
  "from-blue-500/20 to-blue-600/10",
  "from-emerald-500/20 to-emerald-600/10",
  "from-green-500/20 to-green-600/10",
  "from-orange-500/20 to-orange-600/10",
  "from-violet-500/20 to-violet-600/10",
  "from-emerald-500/20 to-teal-600/10",
  "from-sky-500/20 to-sky-600/10",
  "from-pink-500/20 to-pink-600/10",
];

const POSITIONS = [
  { top: "8%",  left: "2%" },
  { top: "5%",  right: "3%" },
  { top: "38%", left: "1%" },
  { top: "35%", right: "2%" },
  { top: "68%", left: "3%" },
  { top: "72%", right: "1%" },
];

interface ActiveEvent {
  id: number;
  text: string;
  icon: string;
  color: string;
  position: (typeof POSITIONS)[number];
}

export default function FloatingEvents({ events }: { events: string[] }) {
  const [active, setActive] = useState<ActiveEvent[]>([]);

  useEffect(() => {
    let idx = 0;
    const schedule = () => {
      const delay = 1200 + Math.random() * 1800;
      const timer = setTimeout(() => {
        const posIdx   = idx % POSITIONS.length;
        const eventIdx = idx % events.length;
        const id = idx;

        setActive((prev) => [
          ...prev.filter((e) => e.position !== POSITIONS[posIdx]),
          { id, text: events[eventIdx], icon: ICONS[eventIdx % ICONS.length], color: COLORS[eventIdx % COLORS.length], position: POSITIONS[posIdx] },
        ]);

        setTimeout(() => setActive((prev) => prev.filter((e) => e.id !== id)), 3200);

        idx++;
        schedule();
      }, delay);
      return timer;
    };

    const t = schedule();
    return () => clearTimeout(t);
  }, [events]);

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <AnimatePresence>
        {active.map(({ id, text, icon, color, position }) => (
          <motion.div
            key={id}
            className="absolute"
            style={position}
            initial={{ opacity: 0, scale: 0.72, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.82, y: -6 }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className={`flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/15 bg-linear-to-br ${color} px-3 py-2 backdrop-blur-md shadow-lg shadow-black/8 dark:shadow-black/30`}
            >
              <span className="text-sm">{icon}</span>
              <span className="whitespace-nowrap text-[11px] font-semibold text-foreground/80">
                {text}
              </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
