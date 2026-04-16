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
import { Card, CardContent } from "@/components/ui/card";

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

  const nextStep = steps.find((step) => !step.completed);

  if (hidden || total === 0 || completedCount === total) return null;

  return (
    <section dir="rtl" className="">
      <Card>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold md:text-base">
                    كمّل إعداد متجرك
                  </h3>

                  <span className="bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                    {completedCount} من {total}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <Progress value={progress} className="h-2" />
                  </div>

                  <span className="shrink-0 text-xs font-medium text-muted-foreground">
                    {progress}%
                  </span>
                </div>
              </div>

              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="shrink-0"
                onClick={() => setHidden(true)}
                aria-label="إخفاء"
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              {steps.map((step, index) => {
                const Icon = icons[step.icon];
                const isNext = step.id === nextStep?.id;

                return (
                  <Link
                    key={step.id}
                    href={step.href}
                    className={cn(
                      "group border px-3 py-3 transition rounded-xl",
                      step.completed
                        ? "border-emerald-200 bg-background/70"
                        : isNext
                          ? "border-primary/30 bg-primary/5"
                          : "border-border bg-muted/30 hover:bg-muted/50",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center border rounded-xl",
                          step.completed
                            ? "border-emerald-200 bg-emerald-100 dark:bg-background text-emerald-700"
                            : isNext
                              ? "border-primary/20 bg-primary/10 text-primary"
                              : "border-border bg-background text-muted-foreground",
                        )}
                      >
                        {step.completed ? (
                          <Check className="size-4" />
                        ) : (
                          <Icon className="size-4" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="text-[11px] text-muted-foreground">
                            خطوة {index + 1}
                          </span>

                          {step.completed ? (
                            <span className="text-[11px] font-medium text-emerald-700">
                              مكتملة
                            </span>
                          ) : isNext ? (
                            <span className="text-[11px] font-medium text-primary">
                              التالية
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">
                              غير مكتملة
                            </span>
                          )}
                        </div>

                        <p
                          className={cn(
                            "line-clamp-1 text-sm font-medium",
                            step.completed
                              ? "text-foreground"
                              : isNext
                                ? "text-foreground"
                                : "text-muted-foreground",
                          )}
                        >
                          {step.title}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {nextStep ? (
              <div className="flex items-center justify-between gap-3 border-t pt-3">
                <p className="text-sm text-muted-foreground">
                  الخطوة اللي هتفرق دلوقتي:
                  <span className="mr-1 font-medium text-foreground">
                    {nextStep.title}
                  </span>
                </p>

                <Button asChild size="sm">
                  <Link href={nextStep.href}>
                    ابدأ دلوقتي
                    <ChevronLeft className="size-4" />
                  </Link>
                </Button>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
