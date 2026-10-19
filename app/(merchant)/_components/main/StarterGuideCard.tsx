"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, Check, CreditCard, ImageIcon, Package, Rocket, Tag, Truck, Wallet, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { tr } from "@/lib/i18n/dashboard";

type GuideIcon = "wallet" | "category" | "product" | "banner" | "payment" | "shipping" | "seo";

export type StarterGuideStep = {
  id: string;
  title: string;
  description: string;
  href: string;
  completed: boolean;
  icon: GuideIcon;
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
const HIDE_EVENT = "casho-starter-guide-hidden";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(HIDE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(HIDE_EVENT, onChange);
  };
}

function readHidden() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export default function StarterGuideBar({ steps }: { steps: StarterGuideStep[] }) {
  // Server render assumes hidden so a dismissed guide never flashes in.
  const hidden = useSyncExternalStore(subscribe, readHidden, () => true);

  const completedCount = steps.filter((step) => step.completed).length;
  const nextStep = steps.find((step) => !step.completed);

  if (hidden || !nextStep) return null;

  const progress = Math.round((completedCount / steps.length) * 100);

  function hide() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Storage blocked — still hide for this session.
    }
    window.dispatchEvent(new Event(HIDE_EVENT));
  }

  return (
    <section aria-labelledby="setup-guide-title" className="rounded-xl border border-border bg-card">
      <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 id="setup-guide-title" className="text-base font-semibold">
                {tr("جهّز متجرك للبيع")}
              </h2>
              <p className="text-xs text-muted-foreground">
                {tr("خلصت {0} من {1} خطوات", completedCount, steps.length)}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground sm:hidden"
              onClick={hide}
              aria-label={tr("إخفاء دليل الإعداد")}
            >
              <X className="size-4" />
            </Button>
          </div>
          <div
            className="h-1.5 max-w-md overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={tr("نسبة جاهزية المتجر")}
          >
            <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="gap-1.5">
            <Link href={nextStep.href}>
              {tr("التالي: {0}", nextStep.title)}
              <ArrowLeft className="size-3.5 ltr:-scale-x-100" />
            </Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden size-8 text-muted-foreground sm:inline-flex"
            onClick={hide}
            aria-label={tr("إخفاء دليل الإعداد")}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <ol className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4 [&>li:last-child]:rounded-b-xl">
        {steps.map((step) => (
          <li key={step.id} className="bg-card">
            <GuideStep step={step} isNext={step.id === nextStep.id} />
          </li>
        ))}
      </ol>
    </section>
  );
}

function GuideStep({ step, isNext }: { step: StarterGuideStep; isNext: boolean }) {
  const Icon = guideIcons[step.icon];

  return (
    <Link
      href={step.href}
      className="group flex h-full items-start gap-3 p-4 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
    >
      <span
        className={cn(
          "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border",
          step.completed && "border-emerald-500 bg-emerald-500 text-white",
          !step.completed && isNext && "border-primary text-primary",
          !step.completed && !isNext && "border-border text-muted-foreground",
        )}
      >
        {step.completed ? <Check className="size-3.5" strokeWidth={3} /> : <Icon className="size-3" />}
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            "block text-sm font-medium",
            step.completed && "text-muted-foreground line-through decoration-muted-foreground/40",
          )}
        >
          {step.title}
        </span>
        <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-muted-foreground">{step.description}</span>
      </span>
    </Link>
  );
}
