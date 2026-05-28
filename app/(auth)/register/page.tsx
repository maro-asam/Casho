/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  Palette,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  UserRound,
  XCircle,
} from "lucide-react";

import { RegisterAction } from "@/actions/auth/register.actions";
import {
  checkStoreSlugAvailability,
  type StoreSlugAvailabilityState,
} from "@/actions/auth/check-store-slug.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "../_components/forms/form-field";

type Step = 1 | 2 | 3 | 4;

const steps = [
  { id: 1, title: "اسم المتجر", icon: Store },
  { id: 2, title: "بيانات التاجر", icon: UserRound },
  { id: 3, title: "الحساب", icon: Lock },
  { id: 4, title: "جاهز!", icon: ShieldCheck },
] as const;

const brandFeatures = [
  { icon: ShoppingBag, text: "أضف منتجاتك وابدأ البيع في دقائق" },
  { icon: CreditCard, text: "استقبل مدفوعات آمنة مع كاشير" },
  { icon: BarChart3, text: "تابع طلباتك ومبيعاتك لحظة بلحظة" },
  { icon: Palette, text: "خصص مظهر متجرك من ثيمات احترافية" },
];

const COUNTRIES = [
  "مصر",
  "السعودية",
  "الإمارات",
  "الكويت",
  "قطر",
  "البحرين",
  "عُمان",
  "الأردن",
  "المغرب",
  "تونس",
  "الجزائر",
  "ليبيا",
  "السودان",
  "العراق",
  "لبنان",
  "سوريا",
  "فلسطين",
  "اليمن",
  "أخرى",
];

const BUSINESS_TYPES = [
  "ملابس وأزياء",
  "إلكترونيات وتقنية",
  "أغذية ومشروبات",
  "صحة وجمال",
  "منزل وديكور",
  "رياضة ولياقة",
  "كتب وتعليم",
  "مجوهرات وإكسسوارات",
  "حرف يدوية",
  "خدمات رقمية",
  "أطفال وألعاب",
  "سيارات وقطع غيار",
  "أخرى",
];

const formReveal = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const panelReveal = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: "easeOut", delay: 0.08 },
  },
};

const stepVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: "easeIn" } },
};

export default function RegisterRoute() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(RegisterAction, null);

  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [storeName, setStoreName] = useState("");
  const [slugStatus, setSlugStatus] =
    useState<StoreSlugAvailabilityState | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const requestIdRef = useRef(0);

  // Step 2
  const [merchantName, setMerchantName] = useState("");
  const [country, setCountry] = useState("");
  const [businessType, setBusinessType] = useState("");

  // Step 3
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const passwordMismatch = useMemo(
    () => confirmPassword.length > 0 && password !== confirmPassword,
    [password, confirmPassword],
  );

  const isStepOneValid =
    storeName.trim().length >= 2 && !!slugStatus?.suggestedSlug;

  const isStepTwoValid =
    merchantName.trim().length >= 2 && !!country && !!businessType;

  const isStepThreeValid =
    email.trim().length > 0 &&
    phoneNumber.trim().length > 0 &&
    password.length >= 8 &&
    confirmPassword.length > 0 &&
    !passwordMismatch;

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) {
      toast.success("تم إنشاء الحساب بنجاح");
      setStep(4);
      const timer = setTimeout(() => {
        router.push("/change-plan?onboarding=1");
        router.refresh();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [state, router]);

  useEffect(() => {
    const value = storeName.trim();
    if (value.length < 2) {
      setSlugStatus(null);
      setIsCheckingSlug(false);
      return;
    }
    setIsCheckingSlug(true);
    const currentRequestId = ++requestIdRef.current;
    const timer = setTimeout(async () => {
      try {
        const result = await checkStoreSlugAvailability(value);
        if (requestIdRef.current !== currentRequestId) return;
        setSlugStatus(result);
      } catch (error) {
        if (requestIdRef.current !== currentRequestId) return;
        console.error(error);
        setSlugStatus(null);
      } finally {
        if (requestIdRef.current === currentRequestId) setIsCheckingSlug(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [storeName]);

  const progressWidth =
    step === 1 ? "0%" : step === 2 ? "33%" : step === 3 ? "66%" : "100%";

  return (
    <div dir="rtl" className="flex min-h-screen">
      {/* ── Form Panel (RIGHT in RTL) ── */}
      <motion.div
        // @ts-ignore
        variants={formReveal}
        initial="hidden"
        animate="visible"
        className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12 md:px-10"
      >
        <div className="w-full max-w-105">
          {/* Mobile logo */}
          <div className="mb-8 flex justify-center lg:hidden">
            <Link href="/">
              <Image
                src="/logo.svg"
                alt="Casho"
                width={44}
                height={44}
                priority
                className="rounded-xl"
              />
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              أنشئ حسابك
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              خطوات بسيطة وتبدأ البيع أونلاين في دقائق
            </p>
          </div>

          {/* Google OAuth shortcut */}
          <div className="mb-6 space-y-4">
            <a href="/api/auth/google" className="block">
              <button
                type="button"
                className="flex h-11 w-full items-center justify-center gap-2.5 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                إنشاء حساب بواسطة Google
              </button>
            </a>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-3 text-muted-foreground">أو أنشئ حساباً بالبريد</span>
              </div>
            </div>
          </div>

          {/* Step indicator */}
          <div className="mb-8 space-y-3">
            <div className="relative h-1.5 overflow-hidden rounded-full bg-border">
              <motion.div
                className="absolute inset-y-0 right-0 rounded-full bg-primary"
                initial={false}
                animate={{ width: progressWidth }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              />
            </div>

            <div className="flex items-center justify-between">
              {steps.map((item) => {
                const isActive = step === item.id;
                const isDone = step > item.id;
                return (
                  <div key={item.id} className="flex items-center gap-1.5">
                    <div
                      className={[
                        "flex size-6 items-center justify-center rounded-full border-2 text-[11px] font-bold transition-all duration-300",
                        isDone
                          ? "border-primary bg-primary text-primary-foreground"
                          : isActive
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-muted-foreground",
                      ].join(" ")}
                    >
                      {isDone ? <Check className="size-3" /> : item.id}
                    </div>
                    <span
                      className={[
                        "hidden text-xs transition-colors sm:inline",
                        isActive || isDone
                          ? "font-medium text-foreground"
                          : "text-muted-foreground",
                      ].join(" ")}
                    >
                      {item.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form action={formAction}>
            <AnimatePresence mode="wait">
              {/* ── Step 1: اسم المتجر ── */}
              {step === 1 && (
                <motion.div
                  key="step-1"
                  // @ts-ignore
                  variants={stepVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-5"
                >
                  <FormField
                    htmlFor="storeName"
                    label="اسم المتجر"
                    error={state?.fieldErrors?.storeName}
                  >
                    <Input
                      id="storeName"
                      name="storeName"
                      placeholder="مثال: Maro Store"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="h-11"
                    />
                  </FormField>

                  {(isCheckingSlug || slugStatus) && (
                    <div className="rounded-xl border bg-muted/30 p-4">
                      {isCheckingSlug ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="size-4 animate-spin" />
                          <span>جارٍ فحص توفر الاسم...</span>
                        </div>
                      ) : slugStatus ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            {slugStatus.available ? (
                              <>
                                <CheckCircle2 className="size-4 text-emerald-500" />
                                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                  الاسم متاح
                                </span>
                              </>
                            ) : (
                              <>
                                <XCircle className="size-4 text-amber-500" />
                                <span className="font-medium text-amber-600 dark:text-amber-400">
                                  الاسم مستخدم بالفعل
                                </span>
                              </>
                            )}
                          </div>

                          <div
                            className="rounded-lg border bg-background px-3 py-2 font-mono text-sm"
                            dir="ltr"
                          >
                            <span className="text-muted-foreground">
                              https://
                            </span>
                            <span className="font-semibold text-foreground">
                              {slugStatus.suggestedSlug}
                            </span>
                            <span className="text-muted-foreground">
                              .casho.store
                            </span>
                          </div>

                          {!slugStatus.available && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Sparkles className="size-3.5 text-primary" />
                              <span>تم اقتراح اسم بديل متاح لك</span>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  )}

                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!isStepOneValid || isCheckingSlug}
                    className="h-11 w-full font-medium"
                  >
                    التالي
                    <ArrowLeft className="ms-2 size-4" />
                  </Button>
                </motion.div>
              )}

              {/* ── Step 2: بيانات التاجر ── */}
              {step === 2 && (
                <motion.div
                  key="step-2"
                  // @ts-ignore
                  variants={stepVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-5"
                >
                  <FormField
                    htmlFor="merchantName"
                    label="اسم التاجر"
                    error={state?.fieldErrors?.name}
                  >
                    <Input
                      id="merchantName"
                      placeholder="الاسم الكامل"
                      value={merchantName}
                      onChange={(e) => setMerchantName(e.target.value)}
                      className="h-11"
                    />
                  </FormField>

                  <FormField
                    htmlFor="country"
                    label="البلد"
                    error={state?.fieldErrors?.country}
                  >
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger className="h-11 w-full">
                        <SelectValue placeholder="اختر البلد" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField
                    htmlFor="businessType"
                    label="نوع النشاط"
                    error={state?.fieldErrors?.businessType}
                  >
                    <Select
                      value={businessType}
                      onValueChange={setBusinessType}
                    >
                      <SelectTrigger className="h-11 w-full">
                        <SelectValue placeholder="اختر نوع نشاطك" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUSINESS_TYPES.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <div className="flex gap-3 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="h-11 flex-1"
                    >
                      <ArrowRight className="me-2 size-4" />
                      رجوع
                    </Button>
                    <Button
                      type="button"
                      disabled={!isStepTwoValid}
                      onClick={() => setStep(3)}
                      className="h-11 flex-1 font-medium"
                    >
                      التالي
                      <ArrowLeft className="ms-2 size-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ── Step 3: بيانات الحساب ── */}
              {step === 3 && (
                <motion.div
                  key="step-3"
                  // @ts-ignore
                  variants={stepVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-4"
                >
                  <input type="hidden" name="storeName" value={storeName} />
                  <input type="hidden" name="name" value={merchantName} />
                  <input type="hidden" name="country" value={country} />
                  <input
                    type="hidden"
                    name="businessType"
                    value={businessType}
                  />

                  <FormField
                    htmlFor="email"
                    label="البريد الإلكتروني"
                    error={state?.fieldErrors?.email}
                  >
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="example@email.com"
                      dir="ltr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11"
                    />
                  </FormField>

                  <FormField
                    htmlFor="phoneNumber"
                    label="رقم الموبايل"
                    error={state?.fieldErrors?.phoneNumber}
                  >
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      placeholder="01xxxxxxxxx"
                      dir="ltr"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="h-11"
                    />
                  </FormField>

                  <FormField
                    htmlFor="password"
                    label="كلمة المرور"
                    error={state?.fieldErrors?.password}
                  >
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      dir="ltr"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11"
                    />
                  </FormField>

                  <FormField
                    htmlFor="confirmPassword"
                    label="تأكيد كلمة المرور"
                    error={
                      passwordMismatch
                        ? "كلمتا المرور غير متطابقتين"
                        : state?.fieldErrors?.confirmPassword
                    }
                  >
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      dir="ltr"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-11"
                    />
                  </FormField>

                  {slugStatus?.suggestedSlug && (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                      <p className="mb-1 text-xs text-muted-foreground">
                        رابط متجرك
                      </p>
                      <p
                        className="font-mono text-sm font-semibold text-foreground"
                        dir="ltr"
                      >
                        {slugStatus.suggestedSlug}.casho.store
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(2)}
                      className="h-11 flex-1"
                    >
                      <ArrowRight className="me-2 size-4" />
                      رجوع
                    </Button>
                    <Button
                      type="submit"
                      disabled={!isStepThreeValid || isPending}
                      className="h-11 flex-1 font-medium"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="me-2 size-4 animate-spin" />
                          جاري الإنشاء...
                        </>
                      ) : (
                        "ابدأ متجرك"
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ── Step 4: تم ── */}
              {step === 4 && (
                <motion.div
                  key="step-4"
                  // @ts-ignore
                  variants={stepVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="flex min-h-64 flex-col items-center justify-center space-y-5 text-center"
                >
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      duration: 0.45,
                      ease: [0.175, 0.885, 0.32, 1.275],
                    }}
                    className="flex size-16 items-center justify-center rounded-full bg-primary/10"
                  >
                    <CheckCircle2 className="size-8 text-primary" />
                  </motion.div>

                  <div>
                    <h3 className="text-xl font-bold">تم إنشاء متجرك! 🎉</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      جاري تحويلك للوحة التحكم...
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    <span>لحظة واحدة...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {step !== 4 && (
              <p className="mt-6 text-center text-sm text-muted-foreground">
                عندك حساب بالفعل؟{" "}
                <Link
                  href="/login"
                  className="font-semibold text-foreground underline underline-offset-4 transition-colors hover:text-primary"
                >
                  سجل دخولك
                </Link>
              </p>
            )}
          </form>
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          باستخدامك كاشو، أنت توافق على الشروط وسياسة الخصوصية
        </p>
      </motion.div>

      {/* ── Brand Panel (LEFT in RTL) ── */}
      <motion.div
        // @ts-ignore
        variants={panelReveal}
        initial="hidden"
        animate="visible"
        className="relative hidden w-130 flex-col justify-between overflow-hidden bg-slate-900 p-10 text-white lg:flex"
      >
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-primary/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 size-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 size-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-2xl" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="Casho"
            width={38}
            height={38}
            className="rounded-lg"
          />
          <span className="text-lg font-bold tracking-wide">كاشو</span>
        </div>

        {/* Features */}
        <div className="relative space-y-8">
          <div>
            <h2 className="text-[1.75rem] font-bold leading-snug">
              ابدأ متجرك الإلكتروني
              <br />
              <span className="text-primary">اليوم مجاناً</span>
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/55">
              انضم لآلاف التجار الناجحين وابدأ البيع أونلاين بخطوات بسيطة
            </p>
          </div>

          <ul className="space-y-4">
            {brandFeatures.map((feature) => (
              <li key={feature.text} className="flex items-center gap-3">
                <div className="flex size-9 flex-none items-center justify-center rounded-xl bg-white/10">
                  <feature.icon className="size-4 text-white/90" />
                </div>
                <span className="text-sm text-white/75">{feature.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Stats widget */}
        <div className="relative rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between px-8 gap-6">
            <div>
              <p className="text-2xl font-bold">5,000+</p>
              <p className="mt-0.5 text-xs text-white/55">تاجر نشط</p>
            </div>
            <div className="h-10 w-px bg-white/15" />
            <div>
              <p className="text-2xl font-bold">98%</p>
              <p className="mt-0.5 text-xs text-white/55">رضا العملاء</p>
            </div>
            <div className="h-10 w-px bg-white/15" />
            <div>
              <p className="text-2xl font-bold">24/7</p>
              <p className="mt-0.5 text-xs text-white/55">دعم فني</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
