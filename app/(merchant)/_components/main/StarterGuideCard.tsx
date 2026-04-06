"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  FolderTree,
  ImageIcon,
  Package,
  Wallet,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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

export default function StarterGuideBar({ steps }: StarterGuideBarProps) {
  const [hidden, setHidden] = useState(false);

  const completedCount = steps.filter((step) => step.completed).length;
  const total = steps.length;
  const progress = total ? Math.round((completedCount / total) * 100) : 0;

  const icons = useMemo(
    () => ({
      wallet: Wallet,
      category: FolderTree,
      banner: ImageIcon,
      product: Package,
    }),
    [],
  );

  if (hidden || completedCount === total) return null;

  const nextStep = steps.find((step) => !step.completed);

  return (
    <div
      dir="rtl"
      className="flex h-auto min-h-15 flex-col gap-3 rounded-lg border border-border/60 bg-background px-4 py-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">كمّل إعداد متجرك</p>

            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {completedCount}/{total}
            </span>
          </div>

          <Progress value={progress} className="h-2" />
        </div>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-8 shrink-0 rounded-full"
          onClick={() => setHidden(true)}
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {steps.map((step) => {
          const Icon = icons[step.icon];

          return (
            <Link
              key={step.id}
              href={step.href}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition",
                step.completed
                  ? "border-emerald-200 bg-emerald-500/10 text-emerald-600"
                  : "border-border bg-muted/40 text-muted-foreground hover:bg-muted",
              )}
            >
              {step.completed ? (
                <Check className="size-3.5" />
              ) : (
                <Icon className="size-3.5" />
              )}

              <span>{step.title}</span>
            </Link>
          );
        })}
      </div>

      {nextStep ? (
        <div className="flex justify-start">
          <Button asChild size="sm" className="rounded-lg">
            <Link href={nextStep.href}>
              كمّل
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}