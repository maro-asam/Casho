"use client";

import { motion } from "framer-motion";

const arcs = [
  { d: "M110 170 C160 120 250 120 300 170", delay: 0 },
  { d: "M95 185 C160 95 260 95 315 185", delay: 0.6 },
  { d: "M120 205 C180 150 240 150 290 205", delay: 1.2 },
  { d: "M135 225 C185 190 230 190 275 225", delay: 1.8 },
];

const pings = [
  { x: 110, y: 170, delay: 0.5 },
  { x: 300, y: 170, delay: 1.1 },
  { x: 95, y: 185, delay: 0.8 },
  { x: 315, y: 185, delay: 1.7 },
  { x: 210, y: 120, delay: 1.3 },
  { x: 210, y: 255, delay: 0.5 },
];

export default function NetworkGlobe() {
  return (
    <div className="relative mx-auto flex h-[420px] w-full max-w-[520px] items-center justify-center">
      {/* glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-[420px] w-[420px] rounded-md bg-primary/10 blur-3xl" />
      </div>

      {/* floating blurred bg */}
      <div className="absolute right-10 top-12 h-32 w-32 rounded-md bg-primary/10 blur-3xl" />
      <div className="absolute bottom-12 left-10 h-28 w-28 rounded-md bg-sky-200/40 blur-3xl" />

      {/* globe shell */}
      <div className="relative flex h-[540px] w-[540px] items-center justify-center rounded-md border border-border/100 bg-background/60 shadow-[0_20px_80px_-20px_hsl(var(--primary)/0.20)] backdrop-blur-xl">
        {/* inner glow */}
        <div className="absolute inset-6 rounded-md bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.10),transparent_90%)]" />

        {/* globe grid */}
        <div className="absolute inset-0 overflow-hidden rounded-md">
          {/* horizontal lines */}
          <div className="absolute left-1/2 top-1/2 h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-md border border-primary/20" />
          <div className="absolute left-1/2 top-1/2 h-[62%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-md border border-primary/20" />
          <div className="absolute left-1/2 top-1/2 h-[46%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-md border border-primary/20" />
          <div className="absolute left-1/2 top-1/2 h-[30%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-md border border-primary/20" />

          {/* vertical lines */}
          <div className="absolute left-1/2 top-1/2 h-[78%] w-[28%] -translate-x-1/2 -translate-y-1/2 rounded-md border border-primary/20" />
          <div className="absolute left-1/2 top-1/2 h-[78%] w-[50%] -translate-x-1/2 -translate-y-1/2 rounded-md border border-primary/20" />
          <div className="absolute left-1/2 top-1/2 h-[78%] w-[68%] -translate-x-1/2 -translate-y-1/2 rounded-md border border-primary/20" />

          {/* soft shading */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,white,transparent_30%),radial-gradient(circle_at_90%_90%,hsl(var(--primary)/0.08),transparent_28%)]" />
        </div>

        {/* animated svg arcs */}
        <svg
          viewBox="0 0 420 420"
          className="absolute inset-0 h-full w-full"
          fill="none"
        >
          {arcs.map((arc, index) => (
            <g key={index}>
              <path
                d={arc.d}
                stroke="hsl(var(--primary) / 0.22)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <motion.path
                d={arc.d}
                stroke="hsl(var(--primary))"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="10 14"
                initial={{ strokeDashoffset: 0 }}
                animate={{ strokeDashoffset: -48 }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: "linear",
                  delay: arc.delay,
                }}
              />
            </g>
          ))}

          {/* center hub */}
          <circle cx="210" cy="210" r="4" fill="hsl(var(--primary))" />
          <circle cx="210" cy="210" r="10" fill="hsl(var(--primary) / 0.12)" />
        </svg>

        {/* pings */}
        {pings.map((ping, index) => (
          <div
            key={index}
            className="absolute"
            style={{
              left: ping.x,
              top: ping.y,
              transform: "translate(-50%, -50%)",
            }}
          >
            <span className="absolute left-1/2 top-1/2 block h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-md bg-primary" />
            <motion.span
              className="absolute left-1/2 top-1/2 block h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-md border border-primary/50"
              animate={{ scale: [1, 2.8], opacity: [0.7, 0] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
                delay: ping.delay,
              }}
            />
          </div>
        ))}

        {/* orbit ring */}
        <motion.div
          className="absolute inset-[-14px] rounded-md border border-primary/40"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />

        {/* label cards */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="absolute -right-8 top-8 hidden rounded-md border bg-background/85 px-4 py-3 shadow-xl backdrop-blur md:block"
        >
          <p className="text-xs text-muted-foreground">طلبات شغالة</p>
          <p className="mt-1 text-sm font-semibold">عميل جديد اشترى الآن</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="absolute -left-10 top-20 hidden rounded-md border bg-background/85 px-4 py-3 shadow-xl backdrop-blur md:block"
        >
          <p className="text-xs text-muted-foreground">انتشار أسرع</p>
          <p className="mt-1 text-sm font-semibold">متجرك يوصل أكتر</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="absolute bottom-3 left-1/2 hidden -translate-x-1/2 rounded-md border bg-background/85 px-4 py-3 shadow-xl backdrop-blur md:block"
        >
          <p className="text-xs text-muted-foreground">إدارة أسهل</p>
          <p className="mt-1 text-sm font-semibold">كل طلباتك في مكان واحد</p>
        </motion.div>
      </div>
    </div>
  );
}
