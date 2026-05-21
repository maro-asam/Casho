"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  CreditCard,
  ImageIcon,
  Package,
  Rocket,
  Tag,
  Truck,
  Wallet,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type GuideIcon = "wallet" | "category" | "product" | "banner" | "payment" | "shipping" | "seo";

export type StarterGuideStep = {
  id: string;
  title: string;
  description: string;
  href: string;
  completed: boolean;
  icon: GuideIcon;
};

type StarterGuideBarProps = {
  steps: StarterGuideStep[];
};

const guideIcons = {
  wallet: Wallet,
  category: Tag,
  product: Package,
  banner: ImageIcon,
  payment: CreditCard,
  shipping: Truck,
  seo: Rocket,
};

const STORAGE_KEY = "casho-starter-guide-hidden";

export default function StarterGuideBar({ steps }: StarterGuideBarProps) {
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    setIsHidden(window.localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  const completedCount = useMemo(
    () => steps.filter((step) => step.completed).length,
    [steps],
  );
  const progress = steps.length ? Math.round((completedCount / steps.length) * 100) : 0;
  const nextStep = steps.find((step) => !step.completed);
  const isComplete = progress >= 100;

  const handleHide = () => {
    window.localStorage.setItem(STORAGE_KEY, "true");
    setIsHidden(true);
  };

  if (isHidden || !steps.length) return null;

  return (
    <Card className="relative overflow-hidden rounded-[2rem] border-border/70 bg-background/80 shadow-sm shadow-black/5 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-bl from-primary/12 via-transparent to-transparent" />
      <CardContent className="relative p-5 sm:p-6">
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.4fr] xl:items-start">
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <Badge className="rounded-full border-0 bg-primary/10 text-primary hover:bg-primary/10">
                  Setup playbook
                </Badge>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold tracking-tight md:text-2xl">
                    جهّز متجرك كأنه SaaS محترف
                  </h2>
                  <p className="text-sm leading-7 text-muted-foreground">
                    خلّي كل أساسيات البيع جاهزة: منتجات، دفع، شحن، و SEO. أول ما تخلصهم هتبدأ تقيس كل حاجة من الداشبورد.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 shrink-0 rounded-2xl"
                onClick={handleHide}
                aria-label="إخفاء دليل البداية"
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="rounded-[1.5rem] border border-border/70 bg-muted/30 p-4">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold">نسبة الجاهزية</p>
                  <p className="text-xs text-muted-foreground">
                    {completedCount} من {steps.length} خطوات مكتملة
                  </p>
                </div>
                <span className="text-2xl font-bold text-primary">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {nextStep && !isComplete ? (
              <div className="flex flex-col gap-3 rounded-[1.5rem] border border-primary/20 bg-primary/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                    Next best action
                  </p>
                  <p className="text-sm font-bold">{nextStep.title}</p>
                </div>
                <Button asChild className="rounded-2xl font-bold">
                  <Link href={nextStep.href}>ابدأ الخطوة</Link>
                </Button>
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                كله تمام. المتجر جاهز للتشغيل والمتابعة من لوحة التحكم.
              </div>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {steps.map((step) => (
              <GuideStepCard key={step.id} step={step} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function GuideStepCard({ step }: { step: StarterGuideStep }) {
  const Icon = guideIcons[step.icon];

  return (
    <Link
      href={step.href}
      className={cn(
        "group rounded-[1.5rem] border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        step.completed
          ? "border-emerald-500/20 bg-emerald-500/10"
          : "border-border/70 bg-background/75 hover:border-primary/30",
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <span
          className={cn(
            "grid size-10 place-items-center rounded-2xl",
            step.completed ? "bg-emerald-500/15 text-emerald-600" : "bg-primary/10 text-primary",
          )}
        >
          <Icon className="size-5" />
        </span>
        <span
          className={cn(
            "grid size-7 place-items-center rounded-full",
            step.completed
              ? "bg-emerald-500 text-white"
              : "border border-border/70 bg-muted text-muted-foreground",
          )}
        >
          {step.completed ? <CheckCircle2 className="size-4" /> : <Circle className="size-3" />}
        </span>
      </div>

      <div className="space-y-1.5">
        <h3 className="text-sm font-bold tracking-tight text-foreground">{step.title}</h3>
        <p className="line-clamp-2 text-xs leading-6 text-muted-foreground">
          {step.description}
        </p>
      </div>
    </Link>
  );
}
