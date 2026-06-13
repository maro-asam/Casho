"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { BarChart3, Camera, CreditCard, Palette, ShoppingBag } from "lucide-react";

const features = [
  { icon: ShoppingBag, text: "أضف منتجاتك وابدأ البيع في دقائق" },
  { icon: CreditCard, text: "استقبل مدفوعات آمنة مع كاشير" },
  { icon: BarChart3, text: "تابع طلباتك ومبيعاتك لحظة بلحظة" },
  { icon: Camera, text: "إدارة Instagram AI من لوحة تحكم واحدة" },
  { icon: Palette, text: "خصص مظهر متجرك من ثيمات احترافية" },
];

const stats = [
  { value: "5,000+", label: "تاجر نشط" },
  { value: "98%", label: "رضا العملاء" },
  { value: "24/7", label: "دعم فني" },
];

const panelReveal = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: "easeOut", delay: 0.08 },
  },
};

interface AuthBrandPanelProps {
  heading: React.ReactNode;
  subheading: string;
}

export function AuthBrandPanel({ heading, subheading }: AuthBrandPanelProps) {
  return (
    <motion.div
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      variants={panelReveal}
      initial="hidden"
      animate="visible"
      className="relative hidden w-[460px] shrink-0 flex-col overflow-hidden lg:flex"
    >
      {/* Solid dark background */}
      <div className="absolute inset-0 bg-zinc-950" />

      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Gradient orbs */}
      <div className="pointer-events-none absolute -start-28 -top-28 size-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -end-20 size-80 rounded-full bg-primary/15 blur-3xl" />

      <div className="relative flex h-full flex-col justify-between p-10 text-white">
        {/* Logo */}
        <Link href="/" className="flex w-fit items-center gap-2.5">
          <Image
            src="/logo.svg"
            alt="Casho"
            width={36}
            height={36}
            className="rounded-xl"
          />
          <span className="text-lg font-bold tracking-wide">كاشو</span>
        </Link>

        {/* Headline + features */}
        <div className="space-y-8">
          <div>
            <h2 className="text-[1.85rem] font-bold leading-snug">{heading}</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/50">
              {subheading}
            </p>
          </div>

          <ul className="space-y-4">
            {features.map((f) => (
              <li key={f.text} className="flex items-center gap-3.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-inset ring-white/10">
                  <f.icon className="size-3.5 text-white/80" />
                </div>
                <span className="text-sm text-white/65">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Stats bar */}
        <div className="rounded-2xl border border-white/8 bg-white/5 p-5 backdrop-blur-md">
          <div className="flex items-center justify-around">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="mt-0.5 text-[11px] text-white/50">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
