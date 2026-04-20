"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  FolderTree,
  ImageIcon,
  Package,
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
  CardDescription,
  CardHeader,
  CardTitle,
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
    const nextStep = steps.find((step) => !step.completed) ?? null;

    return {
      completedCount,
      totalSteps,
      progress,
      nextStep,
    };
  }, [steps]);

  if (isHidden || totalSteps === 0 || completedCount === totalSteps) {
    return null;
  }

  return (
    <section dir="rtl">
      <Card className="overflow-hidden border-border/60 shadow-sm pt-0">
        <CardHeader className="border-b border-border/50 bg-muted/20 p-4 pt-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className="gap-1 rounded-xl px-3 py-1 font-normal"
                >
                  <Sparkles className="size-3.5" />
                  دليل البداية
                </Badge>

                <Badge variant="outline" className="rounded-xl px-3 py-1">
                  {completedCount} من {totalSteps}
                </Badge>
              </div>

              <div className="space-y-1">
                <CardTitle className="text-base md:text-lg">
                  كمّل إعداد متجرك
                </CardTitle>
                <CardDescription className="leading-6">
                  خلّص الخطوات الأساسية عشان متجرك يبقى جاهز للبيع واستقبال
                  الطلبات.
                </CardDescription>
              </div>

              <div className="flex items-center gap-3">
                <Progress value={progress} className="h-2.5 flex-1" />
                <span className="text-xs font-medium text-muted-foreground">
                  {progress}%
                </span>
              </div>
            </div>

            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="shrink-0 rounded-xl"
              onClick={() => setIsHidden(true)}
              aria-label="إخفاء الدليل"
            >
              <X className="size-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-4 md:p-6">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = stepIcons[step.icon];
              const isNextStep = nextStep?.id === step.id;

              return (
                <StepCard
                  key={step.id}
                  step={step}
                  index={index}
                  Icon={Icon}
                  isNextStep={isNextStep}
                />
              );
            })}
          </div>

          {nextStep && (
            <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  الخطوة المهمة دلوقتي
                </p>
                <p className="text-sm font-medium text-foreground">
                  {nextStep.title}
                </p>
              </div>

              <Button asChild size="sm" className="rounded-xl">
                <Link href={nextStep.href}>
                  ابدأ دلوقتي
                  <ChevronLeft className="size-4" />
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

type StepCardProps = {
  step: Step;
  index: number;
  Icon: LucideIcon;
  isNextStep: boolean;
};

function StepCard({ step, index, Icon, isNextStep }: StepCardProps) {
  const status = step.completed
    ? "completed"
    : isNextStep
      ? "next"
      : "pending";

  return (
    <Link
      href={step.href}
      className={cn(
        "group rounded-2xl border p-4 transition-all",
        "hover:border-primary/20 hover:bg-muted/30",
        status === "completed" &&
          "border-emerald-200 bg-emerald-500/5 hover:bg-emerald-500/10",
        status === "next" &&
          "border-primary/25 bg-primary/5 shadow-sm hover:bg-primary/10",
        status === "pending" && "border-border/60 bg-background",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl border",
            status === "completed" &&
              "border-emerald-200 bg-emerald-500/10 text-emerald-700",
            status === "next" && "border-primary/20 bg-primary/10 text-primary",
            status === "pending" &&
              "border-border bg-muted/40 text-muted-foreground",
          )}
        >
          {step.completed ? (
            <Check className="size-4" />
          ) : (
            <Icon className="size-4" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-muted-foreground">
              خطوة {index + 1}
            </span>

            <StepStatusBadge status={status} />
          </div>

          <p className="line-clamp-1 text-sm font-medium text-foreground">
            {step.title}
          </p>
        </div>
      </div>
    </Link>
  );
}

function StepStatusBadge({
  status,
}: {
  status: "completed" | "next" | "pending";
}) {
  if (status === "completed") {
    return (
      <span className="text-[11px] font-medium text-emerald-700">مكتملة</span>
    );
  }

  if (status === "next") {
    return <span className="text-[11px] font-medium text-primary">التالية</span>;
  }

  return <span className="text-[11px] text-muted-foreground">لاحقًا</span>;
}