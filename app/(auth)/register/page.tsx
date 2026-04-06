/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Store,
  UserRound,
  ShieldCheck,
} from "lucide-react";

import { RegisterAction } from "@/actions/auth/register.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "../_components/forms/form-field";

type Step = 1 | 2 | 3;

const steps = [
  { id: 1, title: "اسم المتجر", icon: Store },
  { id: 2, title: "بيانات الحساب", icon: UserRound },
  { id: 3, title: "تم الإنشاء", icon: ShieldCheck },
] as const;

const pageFadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: "easeOut",
    },
  },
};

const imageReveal = {
  hidden: { opacity: 0, scale: 1.03 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.7,
      ease: "easeOut",
    },
  },
};

const stepVariants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
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

  const passwordMismatch = useMemo(() => {
    return confirmPassword.length > 0 && password !== confirmPassword;
  }, [password, confirmPassword]);

  const isStepOneValid = storeName.trim().length >= 2;

  const isStepTwoValid =
    email &&
    phoneNumber &&
    password.length >= 8 &&
    confirmPassword &&
    !passwordMismatch;

  useEffect(() => {
    if (state?.error) toast.error(state.error);

    if (state?.success) {
      toast.success("تم إنشاء الحساب بنجاح");

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep(3);

      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1200);
    }
  }, [state, router]);

  return (
    <main className="min-h-screen overflow-hidden">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* LEFT SIDE */}
        <motion.section
          // @ts-ignore

          variants={pageFadeUp}
          initial="hidden"
          animate="visible"
          className="flex items-center justify-center bg-background px-6 py-10 sm:px-8 lg:px-12"
        >
          <div className="w-full max-w-md">
            {/* HEADER */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
              className="mb-8 items-center text-center"
            >
              <div className="mb-6 flex w-full size-16 items-center justify-center rounded-lg">
                <Link href="/">
                  <Image
                    src="/logo.svg"
                    alt="Casho"
                    width={80}
                    height={80}
                    className="h-14 w-14 rounded-lg"
                    priority
                  />
                </Link>
              </div>

              <h1 className="text-3xl font-bold">أنشئ متجرك</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                خطوة بسيطة وتبدأ البيع أونلاين في دقائق
              </p>
            </motion.div>

            {/* STEPS */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.18, ease: "easeOut" }}
              className="mb-8 flex items-center justify-between"
            >
              {steps.map((s, index) => {
                const Icon = s.icon;
                const active = step === s.id;
                const done = step > s.id;

                return (
                  <motion.div
                    key={s.id}
                    className="flex flex-col items-center gap-2"
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.3,
                      delay: 0.22 + index * 0.07,
                      ease: "easeOut",
                    }}
                  >
                    <div
                      className={`flex size-10 items-center justify-center rounded-full border transition-colors duration-300 ${
                        done
                          ? "bg-primary text-white"
                          : active
                            ? "border-primary text-primary"
                            : "text-muted-foreground"
                      }`}
                    >
                      {done ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* FORM */}
            <form action={formAction} className="space-y-5">
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
                        className="h-12 rounded-full px-5 text-center"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                      />
                    </FormField>

                    <Button
                      type="button"
                      className="h-12 w-full rounded-full"
                      onClick={() => setStep(2)}
                      disabled={!isStepOneValid}
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
                        className="h-12 rounded-full px-5"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                        className="h-12 rounded-full px-5"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
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
                        className="h-12 rounded-full px-5"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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
                        className="h-12 rounded-full px-5"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </FormField>

                    {passwordMismatch && (
                      <p className="text-center text-xs text-red-500">
                        كلمتا المرور غير متطابقتين
                      </p>
                    )}

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-12 flex-1 rounded-full"
                        onClick={() => setStep(1)}
                      >
                        <ArrowRight className="me-2 size-4" />
                        رجوع
                      </Button>

                      <Button
                        type="submit"
                        className="h-12 flex-1 rounded-full"
                        disabled={!isStepTwoValid || isPending}
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
                    className="space-y-4 py-10 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                    >
                      <CheckCircle2 className="mx-auto size-10 text-primary" />
                    </motion.div>

                    <h3 className="text-xl font-bold">تم إنشاء حسابك 🎉</h3>
                    <p className="text-sm text-muted-foreground">
                      جاري تحويلك...
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.45, delay: 0.28 }}
                className="text-center text-sm text-muted-foreground"
              >
                عندك حساب؟{" "}
                <Link
                  href="/login"
                  className="font-medium text-foreground underline"
                >
                  سجل دخول
                </Link>
              </motion.p>
            </form>
          </div>
        </motion.section>

        {/* RIGHT SIDE */}
        <motion.section
          // @ts-ignore
          variants={imageReveal}
          initial="hidden"
          animate="visible"
          className="relative hidden lg:flex"
        >
          <Image
            src="/register.jpg"
            alt="register"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/10" />
        </motion.section>
      </div>
    </main>
  );
}
