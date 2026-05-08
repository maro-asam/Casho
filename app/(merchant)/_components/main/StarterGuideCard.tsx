"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Check,
  ChevronLeft,
  Circle,
  CreditCard,
  FolderTree,
  ImageIcon,
  Package,
  Search,
  Settings2,
  Sparkles,
  Truck,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type StepIconName =
  | "wallet"
  | "category"
  | "product"
  | "banner"
  | "payment"
  | "shipping"
  | "seo";

type Step = {
  id: string;
  title: string;
  description?: string;
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
  product: Package,
  banner: ImageIcon,
  payment: CreditCard,
  shipping: Truck,
  seo: Search,
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
      <Card className="relative overflow-hidden rounded-[28px] border border-border/60 bg-card shadow-sm p-0">
        <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-28 size-80 rounded-full bg-primary/10 blur-3xl" />

        <CardContent className="relative p-0">
          <div className="grid gap-0 lg:grid-cols-[360px_1fr]">
            <aside className="border-b border-border/60 bg-muted/25 p-5 md:p-6 lg:border-b-0 lg:border-l">
              <div className="flex items-start justify-between gap-4">
                <Badge className="h-9 gap-2 rounded-full bg-primary/10 px-3 text-primary hover:bg-primary/10">
                  <Sparkles className="size-4" />
                  دليل تجهيز المتجر
                </Badge>

                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-9 rounded-full"
                  onClick={() => setIsHidden(true)}
                  aria-label="إخفاء الدليل"
                >
                  <X className="size-4" />
                </Button>
              </div>

              <div className="mt-6 space-y-3">
                <h2 className="text-2xl font-semibold tracking-tight">
                  جهّز متجرك للبيع
                </h2>

                <p className="text-sm leading-7 text-muted-foreground">
                  كمّل الخطوات الأساسية عشان متجرك يبقى جاهز لاستقبال الطلبات،
                  الدفع، الشحن، والظهور بشكل أفضل في محركات البحث.
                </p>
              </div>

              <div className="mt-6 rounded-3xl border bg-background/70 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      نسبة الاكتمال
                    </p>
                    <p className="text-2xl font-semibold text-primary">
                      {progress}%
                    </p>
                  </div>

                  <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <BadgeCheck className="size-6" />
                  </div>
                </div>

                <Progress value={progress} className="h-2.5" />

                <p className="mt-3 text-xs text-muted-foreground">
                  تم إكمال {completedCount} من {totalSteps} خطوات
                </p>
              </div>

              {nextStep && (
                <Button asChild className="mt-5 h-11 w-full rounded-2xl">
                  <Link href={nextStep.href}>
                    كمل الخطوة التالية
                    <ChevronLeft className="size-4" />
                  </Link>
                </Button>
              )}
            </aside>

            <div className="p-4 md:p-6">
              {nextStep && (
                <Link
                  href={nextStep.href}
                  className="mb-4 flex items-center justify-between gap-4 rounded-3xl border border-primary/20 bg-primary/5 p-4 transition hover:bg-primary/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                      <Settings2 className="size-5" />
                    </div>

                    <div>
                      <p className="text-xs font-medium text-primary">
                        المطلوب الآن
                      </p>
                      <p className="font-semibold">{nextStep.title}</p>
                      {nextStep.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {nextStep.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <ChevronLeft className="size-5 text-primary" />
                </Link>
              )}

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
        "group relative min-h-40 overflow-hidden rounded-3xl border bg-background p-4 transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md",
        status === "completed" && "border-emerald-200 bg-emerald-500/5",
        status === "next" && "border-primary/35 bg-primary/5 shadow-sm",
        status === "pending" && "border-border/70",
      )}
    >
      <div
        className={cn(
          "absolute inset-x-5 top-0 h-1 rounded-b-full opacity-0 transition",
          status === "completed" && "bg-emerald-500 opacity-100",
          status === "next" && "bg-primary opacity-100",
        )}
      />

      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex size-12 items-center justify-center rounded-2xl border transition",
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
            status === "completed" && "bg-emerald-500/10 text-emerald-700",
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

      <div className="mt-5 space-y-2">
        <p className="text-xs text-muted-foreground">خطوة {index + 1}</p>

        <h3 className="line-clamp-2 text-base font-semibold leading-7">
          {step.title}
        </h3>

        {step.description && (
          <p className="line-clamp-2 text-xs leading-6 text-muted-foreground">
            {step.description}
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
        فتح الإعداد
        <ChevronLeft className="size-3.5" />
      </div>
    </Link>
  );
}