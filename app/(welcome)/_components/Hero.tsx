"use client";

import { motion } from "motion/react";
import { AvatarCircles } from "@/components/ui/avatar-circles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ripple } from "@/components/ui/ripple";
import { WordRotate } from "@/components/ui/word-rotate";
import {
  Video,
  ShoppingBag,
  Store,
  RefreshCw,
  Package,
  Users,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";

const avatars = [
  {
    imageUrl: "https://avatars.githubusercontent.com/u/16860528",
    profileUrl: "https://github.com/dillionverma",
  },
  {
    imageUrl: "https://avatars.githubusercontent.com/u/20110627",
    profileUrl: "https://github.com/tomonarifeehan",
  },
  {
    imageUrl: "https://avatars.githubusercontent.com/u/106103625",
    profileUrl: "https://github.com/BankkRoll",
  },
  {
    imageUrl: "https://avatars.githubusercontent.com/u/59228569",
    profileUrl: "https://github.com/safethecode",
  },
  {
    imageUrl: "https://avatars.githubusercontent.com/u/59442788",
    profileUrl: "https://github.com/sanjay-mali",
  },
  {
    imageUrl: "https://avatars.githubusercontent.com/u/89768406",
    profileUrl: "https://github.com/itsarghyadas",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      delay,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  }),
};

const pills = [
  { icon: RefreshCw, label: "تحديث فوري" },
  { icon: Package, label: "مخزون موحد" },
  { icon: Users, label: "عملاء موحدون" },
  { icon: BarChart3, label: "تقارير ذكية" },
  { icon: ShieldCheck, label: "مدفوعات آمنة" },
];

function Beam({ reverse, delay }: { reverse?: boolean; delay?: number }) {
  return (
    <div className="relative h-[2px] w-full overflow-hidden rounded-full bg-border">
      <motion.div
        className="absolute inset-y-0 h-full w-full"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, var(--primary) 50%, transparent 100%)",
          opacity: reverse ? 0.45 : 0.8,
        }}
        animate={{ x: reverse ? ["100%", "-100%"] : ["-100%", "100%"] }}
        transition={{
          duration: reverse ? 2.6 : 2.1,
          repeat: Infinity,
          ease: "linear",
          delay: delay ?? 0,
        }}
      />
    </div>
  );
}

function StoreCard({
  icon: Icon,
  title,
  subtitle,
  floatDelay,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  floatDelay?: number;
}) {
  return (
    <motion.div
      animate={{ y: [0, -5, 0] }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
        delay: floatDelay ?? 0,
      }}
      className="w-[148px] shrink-0 rounded-2xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="text-xs font-bold text-foreground">{title}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>
      <div className="mt-3 space-y-1.5">
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-primary"
            animate={{ width: ["50%", "80%", "50%"] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: (floatDelay ?? 0) * 0.5,
            }}
          />
        </div>
        <div className="relative h-1.5 w-3/4 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-primary/60"
            animate={{ width: ["35%", "65%", "35%"] }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: (floatDelay ?? 0) * 0.5 + 0.4,
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

function ConnectionIllustration() {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      custom={0.55}
      className="relative mt-10 w-full max-w-215 select-none"
      dir="ltr"
    >
      <div className="flex items-center gap-3">
        <StoreCard
          icon={ShoppingBag}
          title="Online Store"
          subtitle="متجرك الإلكتروني"
          floatDelay={0}
        />

        {/* Left connector */}
        <div className="flex flex-1 flex-col gap-2.5">
          <Beam delay={0} />
          <Beam reverse delay={0.6} />
        </div>

        {/* Casho hub */}
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.4,
          }}
          className="relative shrink-0 flex flex-col items-center gap-2"
        >
          {/* Pulse ring */}
          <motion.div
            className="absolute rounded-full"
            animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: 80, height: 80 }}
          />
          <div className="relative flex h-17 w-17 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/25">
            <Image src="/white-logo.svg" alt="Casho" width={28} height={28} />
          </div>
          {/* <div className="text-center">
            <p className="text-[11px] font-bold text-foreground">Casho</p>
            <p className="text-[10px] text-muted-foreground leading-tight">نظام واحد</p>
          </div> */}
        </motion.div>

        {/* Right connector */}
        <div className="flex flex-1 flex-col gap-2.5">
          <Beam delay={0.25} />
          <Beam reverse delay={0.9} />
        </div>

        <StoreCard
          icon={Store}
          title="Physical Store"
          subtitle="محلك الفعلي"
          floatDelay={0.9}
        />
      </div>

      {/* Feature pills */}
      <div
        className="mt-5 flex flex-wrap items-center justify-center gap-2"
        dir="rtl"
      >
        {pills.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground"
          >
            <Icon className="h-3 w-3 text-primary" />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function HeroSection() {
  return (
    <div className="relative flex h-200 w-full flex-col items-center justify-center overflow-hidden rounded-lg ">
      <div className="flex w-full flex-col items-center justify-center">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={0}
        >
          <Badge className="p-4 px-5 font-semibold text-md bg-primary/10 text-primary">
            +5000 تاجر نشط دلوقتي علي كاشو
          </Badge>

          {/* <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={0.3}
          >
            <AvatarCircles
              numPeople={5000}
              avatarUrls={avatars}
              className="mt-5"
            />
          </motion.div> */}
        </motion.div>

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={0.1}
          className="text-foreground mt-6 text-center text-4xl font-extrabold leading-snug tracking-tight sm:text-5xl md:text-6xl"
        >
          <span className="text-primary font-extrabold">كاشو</span> طريقك لإدارة
          البيزنس بالكامل
          <WordRotate
            className="font-extrabold text-primary"
            words={["بشكل أسرع", "بشكل أذكى", "بشكل أسهل"]}
          />
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={0.2}
          className="mt-10 text-base font-medium leading-8 text-muted-foreground md:text-lg max-w-3xl text-center"
        >
          Casho بيجمع كل أدوات إدارة متجرك في نظام واحد، سواء مبيعاتك على الأرض
          أو أونلاين، علشان تقدر تتابع وتدير كل حاجة من مكان واحد بسهولة.
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={0.4}
          className="flex mt-8 space-x-5"
        >
          <Button
            size="lg"
            className="p-4 text-md font-bold items-center flex justify-center"
          >
            جرب كاشو دلوقتي
            <Image
              src={`/white-logo.svg`}
              alt="Casho Logo"
              width={23}
              height={23}
              className="mr-1"
            />
          </Button>

          <Button variant="outline" size="lg" className="p-4 text-md">
            اتعرف أكتر على كاشو
            <Video className="mr-2" size={18} />
          </Button>
        </motion.div>

        <ConnectionIllustration />
      </div>
      <Ripple />
    </div>
  );
}
