"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  CheckCircle2,
  ChevronLeft,
  Loader2,
  Package,
  Settings2,
  Sparkles,
  Store,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CompleteOnboardingAction } from "@/actions/onboarding/onboarding.actions";
import { toast } from "sonner";

const BUSINESS_CATEGORIES = [
  { value: "fashion", label: "أزياء وملابس" },
  { value: "electronics", label: "إلكترونيات وتقنية" },
  { value: "food", label: "أغذية ومشروبات" },
  { value: "beauty", label: "عناية وجمال" },
  { value: "home", label: "أثاث ومنزل" },
  { value: "sports", label: "رياضة ولياقة" },
  { value: "books", label: "كتب وقرطاسية" },
  { value: "other", label: "أخرى" },
];

const LANGUAGES = [
  { value: "ar", label: "العربية", flag: "🇸🇦" },
  { value: "en", label: "English", flag: "🇬🇧" },
];

const TIMEZONES = [
  { value: "Africa/Cairo", label: "القاهرة (UTC+2)" },
  { value: "Asia/Riyadh", label: "الرياض (UTC+3)" },
  { value: "Asia/Dubai", label: "دبي (UTC+4)" },
  { value: "Asia/Kuwait", label: "الكويت (UTC+3)" },
  { value: "Asia/Amman", label: "عمّان (UTC+3)" },
];

const STEPS = ["بيانات النشاط", "تفضيلات المتجر", "إعداد المنتجات", "الانتهاء"] as const;

type Props = {
  storeName: string;
  businessCategory: string;
  trialEndDate: string | null;
};

export default function OnboardingWizard({ storeName, businessCategory, trialEndDate }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState(1);

  // Step 1
  const [name, setName] = useState(storeName);
  const [category, setCategory] = useState(businessCategory);

  // Step 2
  const [language, setLanguage] = useState("ar");
  const [timezone, setTimezone] = useState("Africa/Cairo");

  // Step 3
  const [useDemoData, setUseDemoData] = useState<boolean | null>(null);

  const [isDone, setIsDone] = useState(false);

  const trialDaysLeft = trialEndDate
    ? Math.max(0, Math.ceil((new Date(trialEndDate).getTime() - Date.now()) / 86400000))
    : 3;

  function handleNext() {
    if (step === 1) {
      if (!name.trim()) {
        toast.error("يرجى كتابة اسم المتجر");
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      setStep(3);
      return;
    }

    if (step === 3) {
      if (useDemoData === null) {
        toast.error("يرجى اختيار طريقة الإعداد");
        return;
      }
      startTransition(async () => {
        const result = await CompleteOnboardingAction({
          storeName: name,
          businessCategory: category,
          language,
          useDemoData: useDemoData === true,
        });
        if (result.success) {
          setStep(4);
          setIsDone(true);
          setTimeout(() => router.push("/dashboard"), 2500);
        } else {
          toast.error(result.message);
        }
      });
    }
  }

  function handleBack() {
    if (step > 1) setStep((s) => s - 1);
  }

  const totalSteps = STEPS.length;

  return (
    <div dir="rtl" className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-14 items-center border-b px-6">
        <Image src="/logo.svg" alt="كاشو" width={32} height={32} className="rounded-lg" />
        <span className="mr-2 font-bold text-foreground">كاشو</span>
        <span className="mr-3 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          {trialDaysLeft} {trialDaysLeft === 1 ? "يوم" : "أيام"} تجريبية
        </span>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-border">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-12">
        {/* Step indicators */}
        <div className="mb-10 flex items-center justify-center gap-1.5 overflow-x-auto">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const done = step > n;
            const active = step === n;
            return (
              <div key={n} className="flex items-center gap-1.5">
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all",
                    done
                      ? "bg-primary text-primary-foreground"
                      : active
                        ? "border-2 border-primary bg-primary/10 text-primary"
                        : "border-2 border-border text-muted-foreground"
                  )}
                >
                  {done ? <CheckCircle2 className="h-4 w-4" /> : n}
                </div>
                <span
                  className={cn(
                    "hidden text-xs sm:inline",
                    active ? "font-semibold text-foreground" : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={cn("mx-1 h-px w-6 shrink-0", step > n ? "bg-primary" : "bg-border")} />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Step 1: Business Info ── */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <div className="mb-1 flex items-center gap-2 text-primary">
                <Store className="h-5 w-5" />
                <span className="text-sm font-medium">الخطوة ١ من {totalSteps}</span>
              </div>
              <h1 className="text-2xl font-bold">بيانات نشاطك التجاري</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                أخبرنا عن متجرك لنساعدك على البدء بأفضل إعداد
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="storeName" className="text-sm font-medium">
                اسم المتجر
              </label>
              <Input
                id="storeName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: Maro Store"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">نوع النشاط التجاري</label>
              <div className="grid grid-cols-2 gap-2">
                {BUSINESS_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-right text-sm transition-all",
                      category === cat.value
                        ? "border-primary bg-primary/5 font-semibold text-primary"
                        : "border-border hover:border-primary/40 hover:bg-muted/50"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={handleNext} disabled={!name.trim()}>
              التالي
              <ChevronLeft className="mr-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* ── Step 2: Preferences ── */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <div className="mb-1 flex items-center gap-2 text-primary">
                <Settings2 className="h-5 w-5" />
                <span className="text-sm font-medium">الخطوة ٢ من {totalSteps}</span>
              </div>
              <h1 className="text-2xl font-bold">تفضيلات المتجر</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                اضبط الإعدادات الأساسية لمتجرك
              </p>
            </div>

            {/* Currency - display only */}
            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                العملة
              </p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">جنيه مصري</span>
                <span className="rounded bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground">EGP</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">العملة الافتراضية للمنصة</p>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <label className="text-sm font-medium">لغة المتجر</label>
              <div className="grid grid-cols-2 gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.value}
                    type="button"
                    onClick={() => setLanguage(lang.value)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-4 py-3 text-sm transition-all",
                      language === lang.value
                        ? "border-primary bg-primary/5 font-semibold text-primary"
                        : "border-border hover:border-primary/40 hover:bg-muted/50"
                    )}
                  >
                    <span className="text-xl">{lang.flag}</span>
                    {lang.label}
                    {language === lang.value && (
                      <CheckCircle2 className="mr-auto h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Timezone */}
            <div className="space-y-2">
              <label className="text-sm font-medium">المنطقة الزمنية</label>
              <div className="space-y-1.5">
                {TIMEZONES.map((tz) => (
                  <button
                    key={tz.value}
                    type="button"
                    onClick={() => setTimezone(tz.value)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-sm transition-all",
                      timezone === tz.value
                        ? "border-primary bg-primary/5 font-semibold text-primary"
                        : "border-border hover:border-primary/40 hover:bg-muted/50"
                    )}
                  >
                    {tz.label}
                    {timezone === tz.value && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleBack}>
                رجوع
              </Button>
              <Button className="flex-1" size="lg" onClick={handleNext}>
                التالي
                <ChevronLeft className="mr-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Product Setup ── */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <div className="mb-1 flex items-center gap-2 text-primary">
                <Package className="h-5 w-5" />
                <span className="text-sm font-medium">الخطوة ٣ من {totalSteps}</span>
              </div>
              <h1 className="text-2xl font-bold">إعداد المنتجات</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                كيف تريد أن تبدأ متجرك؟
              </p>
            </div>

            <div className="grid gap-3">
              {/* Demo data option */}
              <button
                type="button"
                onClick={() => setUseDemoData(true)}
                className={cn(
                  "group relative rounded-2xl border-2 p-5 text-right transition-all",
                  useDemoData === true
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 hover:bg-muted/30"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                      useDemoData === true ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}
                  >
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">ابدأ ببيانات تجريبية</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      سنضيف منتجات وطلبات وعملاء نموذجيين لتستكشف المنصة بسهولة
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {["٥ منتجات", "٣ طلبات", "٣ عملاء"].map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {useDemoData === true && (
                  <CheckCircle2 className="absolute left-4 top-4 h-5 w-5 text-primary" />
                )}
              </button>

              {/* Empty option */}
              <button
                type="button"
                onClick={() => setUseDemoData(false)}
                className={cn(
                  "group relative rounded-2xl border-2 p-5 text-right transition-all",
                  useDemoData === false
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 hover:bg-muted/30"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                      useDemoData === false ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}
                  >
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">ابدأ من الصفر</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      متجر نظيف تمامًا، أضف منتجاتك وبياناتك الحقيقية بنفسك
                    </p>
                  </div>
                </div>
                {useDemoData === false && (
                  <CheckCircle2 className="absolute left-4 top-4 h-5 w-5 text-primary" />
                )}
              </button>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleBack}
                disabled={isPending}
              >
                رجوع
              </Button>
              <Button
                className="flex-1"
                size="lg"
                onClick={handleNext}
                disabled={useDemoData === null || isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الإعداد...
                  </>
                ) : (
                  <>
                    إنهاء الإعداد
                    <ChevronLeft className="mr-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 4: Done ── */}
        {step === 4 && (
          <div className="flex flex-col items-center space-y-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              {isDone ? (
                <CheckCircle2 className="h-10 w-10 text-primary" />
              ) : (
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">متجرك جاهز! 🎉</h1>
              <p className="mt-2 text-muted-foreground">
                تم إعداد متجرك بنجاح، يتم تحويلك إلى لوحة التحكم الآن...
              </p>
            </div>
            <div className="w-full overflow-hidden rounded-full bg-border">
              <div className="h-1.5 animate-pulse rounded-full bg-primary" style={{ width: "70%" }} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
