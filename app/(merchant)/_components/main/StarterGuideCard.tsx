"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  Circle,
  FolderTree,
  ImageIcon,
  Package,
  Rocket,
  Sparkles,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type StepIconName = "wallet" | "category" | "banner" | "product";

type Step = {
  id: string;
  title: string;
  href: string;
  completed: boolean;
  icon: StepIconName;
};

type StarterGuideBarProps = {
  steps: Step[];
};

const stepIcons: Record<StepIconName, LucideIcon> = {
  wallet: Wallet,
  category: FolderTree,
  banner: ImageIcon,
  product: Package,
};

export default function StarterGuideBar({ steps }: StarterGuideBarProps) {
  const [isHidden, setIsHidden] = useState(false);

  const { completedCount, totalSteps, progress, nextStep } = useMemo(() => {
    const completedCount = steps.filter((step) => step.completed).length;
    const totalSteps = steps.length;
    const progress = totalSteps
      ? Math.round((completedCount / totalSteps) * 100)
      : 0;

    return {
      completedCount,
      totalSteps,
      progress,
      nextStep: steps.find((step) => !step.completed) ?? null,
    };
  }, [steps]);

  if (isHidden || totalSteps === 0 || completedCount === totalSteps) {
    return null;
  }

  return (
    <section dir="rtl">
      <Card className="overflow-hidden border-border/60 bg-linear-to-br from-background via-background to-primary/5 shadow-sm">
        <CardContent className="p-0">
          <div className="relative overflow-hidden border-b border-border/60 p-5 md:p-6">
            <div className="absolute -inset-s-16 -top-16 size-40 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -bottom-20 -inset-e-20 size-52 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">
                    <Sparkles className="size-3.5" />
                    دليل البداية
                  </Badge>

                  <Badge variant="outline" className="rounded-full px-3 py-1">
                    {completedCount} من {totalSteps} مكتمل
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
                    جهّز متجرك وابدأ بيع أول طلب
                  </h2>

                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                    كمّل الإعدادات الأساسية بالترتيب عشان متجرك يبقى جاهز
                    للبيع واستقبال الطلبات بدون تعقيد.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {nextStep && (
                  <Button asChild className="rounded-full px-5">
                    <Link href={nextStep.href}>
                      كمل الخطوة التالية
                      <ChevronLeft className="size-4" />
                    </Link>
                  </Button>
                )}

                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => setIsHidden(true)}
                  aria-label="إخفاء الدليل"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            <div className="relative mt-6 flex items-center gap-3">
              <Progress value={progress} className="h-2.5 flex-1" />
              <span className="min-w-10 text-xs font-semibold text-primary">
                {progress}%
              </span>
            </div>
          </div>

          <div className="p-4 md:p-6">
            {nextStep && (
              <Link
                href={nextStep.href}
                className="mb-4 flex items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 transition hover:bg-primary/10"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                    <Rocket className="size-5" />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-primary">
                      الخطوة المطلوبة الآن
                    </p>
                    <p className="text-sm font-semibold">{nextStep.title}</p>
                  </div>
                </div>

                <ChevronLeft className="size-5 text-primary" />
              </Link>
            )}

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {steps.map((step, index) => {
                const Icon = stepIcons[step.icon];
                const isNextStep = nextStep?.id === step.id;

                return (
                  <GuideStepCard
                    key={step.id}
                    step={step}
                    index={index}
                    Icon={Icon}
                    isNextStep={isNextStep}
                  />
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

type GuideStepCardProps = {
  step: Step;
  index: number;
  Icon: LucideIcon;
  isNextStep: boolean;
};

function GuideStepCard({ step, index, Icon, isNextStep }: GuideStepCardProps) {
  const status = step.completed ? "completed" : isNextStep ? "next" : "pending";

  return (
    <Link
      href={step.href}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card p-4 transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md",
        status === "completed" && "border-emerald-200 bg-emerald-500/5",
        status === "next" && "border-primary/30 bg-primary/5 shadow-sm",
        status === "pending" && "border-border/60",
      )}
    >
      {status === "next" && (
        <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
      )}

      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex size-11 items-center justify-center rounded-2xl border transition",
            status === "completed" &&
              "border-emerald-200 bg-emerald-500/10 text-emerald-700",
            status === "next" && "border-primary/20 bg-primary/10 text-primary",
            status === "pending" &&
              "border-border bg-muted/50 text-muted-foreground",
          )}
        >
          {status === "completed" ? (
            <Check className="size-5" />
          ) : status === "pending" ? (
            <Circle className="size-4" />
          ) : (
            <Icon className="size-5" />
          )}
        </div>

        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-medium",
            status === "completed" &&
              "bg-emerald-500/10 text-emerald-700",
            status === "next" && "bg-primary/10 text-primary",
            status === "pending" && "bg-muted text-muted-foreground",
          )}
        >
          {status === "completed"
            ? "مكتملة"
            : status === "next"
              ? "ابدأ هنا"
              : `خطوة ${index + 1}`}
        </span>
      </div>

      <div className="mt-4 space-y-1">
        <p className="text-xs text-muted-foreground">خطوة {index + 1}</p>
        <h3 className="line-clamp-2 text-sm font-semibold leading-6">
          {step.title}
        </h3>
      </div>
    </Link>
  );
}