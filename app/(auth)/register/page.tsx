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
  CheckCircle2,
  Loader2,
  Store,
  UserRound,
  ShieldCheck,
  XCircle,
  Sparkles,
} from "lucide-react";

import { RegisterAction } from "@/actions/auth/register.actions";
import {
  checkStoreSlugAvailability,
  type StoreSlugAvailabilityState,
} from "@/actions/auth/check-store-slug.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormField } from "../_components/forms/form-field";

type Step = 1 | 2 | 3;

const steps = [
  { id: 1, title: "اسم المتجر", icon: Store },
  { id: 2, title: "بيانات الحساب", icon: UserRound },
  { id: 3, title: "تم الإنشاء", icon: ShieldCheck },
] as const;

const formReveal = {
  hidden: { opacity: 0, x: 40, scale: 0.98 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.55,
      ease: "easeOut",
    },
  },
};

const imageReveal = {
  hidden: { opacity: 0, x: -40, scale: 1.02 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.65,
      ease: "easeOut",
      delay: 0.08,
    },
  },
};

const stepVariants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.22,
      ease: "easeInOut",
    },
  },
};

export default function RegisterRoute() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(RegisterAction, null);

  const [step, setStep] = useState<Step>(1);

  const [storeName, setStoreName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [slugStatus, setSlugStatus] = useState<StoreSlugAvailabilityState | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);

  const requestIdRef = useRef(0);

  const passwordMismatch = useMemo(() => {
    return confirmPassword.length > 0 && password !== confirmPassword;
  }, [password, confirmPassword]);

  const isStepOneValid =
    storeName.trim().length >= 2 &&
    !!slugStatus?.suggestedSlug;

  const isStepTwoValid =
    email.trim().length > 0 &&
    phoneNumber.trim().length > 0 &&
    password.length >= 8 &&
    confirmPassword.length > 0 &&
    !passwordMismatch;

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }

    if (state?.success) {
      toast.success("تم إنشاء الحساب بنجاح");
      setStep(3);

      const timer = setTimeout(() => {
        router.push("/dashboard");
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
        if (requestIdRef.current === currentRequestId) {
          setIsCheckingSlug(false);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [storeName]);

  return (
    <div
      dir="rtl"
      className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-10 md:px-6"
    >
      <Card className="w-full max-w-5xl overflow-hidden border bg-background p-0 shadow-2xl">
        <CardContent className="grid min-h-155 p-0 md:grid-cols-2">
          <motion.div
            // @ts-ignore
            variants={formReveal}
            initial="hidden"
            animate="visible"
            className="flex items-center"
          >
            <div className="w-full p-8 md:p-10 lg:p-12">
              <div className="mb-8 flex flex-col items-center text-center">
                <Link href="/" className="mb-4">
                  <Image
                    src="/logo.svg"
                    alt="Casho"
                    width={56}
                    height={56}
                    priority
                    className="rounded-md"
                  />
                </Link>

                <h1 className="text-3xl font-bold tracking-tight">
                  أنشئ متجرك
                </h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  خطوة بسيطة وتبدأ البيع أونلاين في دقائق
                </p>
              </div>

              <div className="mb-8 flex items-center justify-between gap-3">
                {steps.map((item) => {
                  const Icon = item.icon;
                  const isActive = step === item.id;
                  const isDone = step > item.id;

                  return (
                    <div
                      key={item.id}
                      className="flex flex-1 items-center gap-3"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={[
                            "flex size-10 items-center justify-center rounded-md border bg-background transition-colors",
                            isDone
                              ? "border-primary bg-primary text-primary-foreground"
                              : isActive
                                ? "border-primary text-primary"
                                : "text-muted-foreground",
                          ].join(" ")}
                        >
                          {isDone ? (
                            <CheckCircle2 className="size-4" />
                          ) : (
                            <Icon className="size-4" />
                          )}
                        </div>

                        <span
                          className={[
                            "hidden text-sm md:inline",
                            isActive || isDone
                              ? "text-foreground"
                              : "text-muted-foreground",
                          ].join(" ")}
                        >
                          {item.title}
                        </span>
                      </div>

                      {item.id !== 3 && (
                        <div className="hidden h-px flex-1 bg-border md:block" />
                      )}
                    </div>
                  );
                })}
              </div>

              <form action={formAction}>
                <AnimatePresence mode="wait">
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
                          placeholder="Maro Store"
                          value={storeName}
                          onChange={(e) => setStoreName(e.target.value)}
                          className="w-full"
                        />
                      </FormField>

                      {(isCheckingSlug || slugStatus) && (
                        <div className="rounded-xl border bg-muted/40 p-4">
                          {isCheckingSlug ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="size-4 animate-spin" />
                              <span>جارٍ فحص اسم المتجر...</span>
                            </div>
                          ) : slugStatus ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-sm">
                                {slugStatus.available ? (
                                  <>
                                    <CheckCircle2 className="size-4 text-green-600" />
                                    <span className="font-medium text-foreground">
                                      الاسم متاح
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="size-4 text-amber-600" />
                                    <span className="font-medium text-foreground">
                                      الاسم ده مستخدم بالفعل
                                    </span>
                                  </>
                                )}
                              </div>

                              <div className="space-y-1 text-sm">
                                <p className="text-muted-foreground">
                                  رابط المتجر هيبقى:
                                </p>
                                <div className="rounded-lg border bg-background px-3 py-2 font-medium" dir="ltr">
                                  {slugStatus.suggestedSlug}.casho.store
                                </div>
                              </div>

                              {slugStatus.normalizedSlug && (
                                <div className="space-y-1 text-sm">
                                  <p className="text-muted-foreground">
                                    الاسم بعد التحويل للرابط:
                                  </p>
                                  <div className="rounded-lg border bg-background px-3 py-2" dir="ltr">
                                    {slugStatus.normalizedSlug}
                                  </div>
                                </div>
                              )}

                              {!slugStatus.available && (
                                <div className="flex items-start gap-2 rounded-lg border border-dashed bg-background px-3 py-2 text-sm">
                                  <Sparkles className="mt-0.5 size-4 text-primary" />
                                  <p className="text-muted-foreground">
                                    متاح لك الاسم البديل ده بدلًا منه:
                                    <span className="mx-1 font-semibold text-foreground" dir="ltr">
                                      {slugStatus.suggestedSlug}
                                    </span>
                                  </p>
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
                        className="w-full"
                      >
                        التالي
                        <ArrowLeft className="ms-2 size-4" />
                      </Button>
                    </motion.div>
                  )}

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
                      <input type="hidden" name="storeName" value={storeName} />

                      <FormField
                        htmlFor="email"
                        label="البريد الإلكتروني"
                        error={state?.fieldErrors?.email}
                      >
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          dir="ltr"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full"
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
                          dir="ltr"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full"
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
                          className="w-full"
                        />
                      </FormField>

                      <FormField
                        htmlFor="confirmPassword"
                        label="تأكيد كلمة المرور"
                        error={state?.fieldErrors?.confirmPassword}
                      >
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          dir="ltr"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full"
                        />
                      </FormField>

                      {passwordMismatch && (
                        <p className="text-sm text-destructive">
                          كلمتا المرور غير متطابقتين
                        </p>
                      )}

                      {slugStatus?.suggestedSlug && (
                        <div className="rounded-xl border bg-muted/40 p-3 text-sm">
                          <p className="text-muted-foreground">
                            اسم المتجر النهائي:
                          </p>
                          <p className="mt-1 font-medium" dir="ltr">
                            {slugStatus.suggestedSlug}.casho.store
                          </p>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setStep(1)}
                          className="flex-1"
                        >
                          <ArrowRight className="me-2 size-4" />
                          رجوع
                        </Button>

                        <Button
                          type="submit"
                          disabled={!isStepTwoValid || isPending || isCheckingSlug}
                          className="flex-1"
                        >
                          {isPending ? "جاري الإنشاء..." : "ابدأ متجرك"}
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      key="step-3"
                      // @ts-ignore
                      variants={stepVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="flex min-h-65 flex-col items-center justify-center space-y-4 text-center"
                    >
                      <motion.div
                        initial={{ scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                      >
                        <CheckCircle2 className="size-10 text-primary" />
                      </motion.div>

                      <h3 className="text-2xl font-bold">تم إنشاء حسابك 🎉</h3>
                      <p className="text-sm text-muted-foreground">
                        جاري تحويلك للوحة التحكم...
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {step !== 3 && (
                  <p className="mt-6 text-center text-sm text-muted-foreground">
                    عندك حساب؟{" "}
                    <Link
                      href="/login"
                      className="font-medium text-foreground underline underline-offset-4"
                    >
                      سجل دخول
                    </Link>
                  </p>
                )}
              </form>
            </div>
          </motion.div>

          <motion.div
            // @ts-ignore
            variants={imageReveal}
            initial="hidden"
            animate="visible"
            className="relative hidden min-h-80 md:block"
          >
            <Image
              src="/register.jpg"
              alt="Casho register"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-center"
            />

            <div className="absolute inset-0 bg-linear-to-tr from-black/10 via-transparent to-primary/10" />

            <div className="absolute bottom-6 left-6 right-6 rounded-md border border-card/20 bg-card/70 p-4 backdrop-blur-md">
              <p className="text-sm font-semibold text-foreground">
                افتح متجرك وابدأ البيع بشكل منظم
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                خطوات بسيطة لإنشاء الحساب، وبعدها تقدر تضيف منتجاتك وتبدأ
                استقبال الطلبات.
              </p>
            </div>
          </motion.div>
        </CardContent>
      </Card>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        باستخدامك كاشو، أنت توافق على الشروط وسياسة الخصوصية
      </p>
    </div>
  );
}