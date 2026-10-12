"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle, ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2, Sparkles } from "lucide-react";

import { RegisterAction } from "@/actions/auth/register.actions";
import type { RegisterState } from "@/actions/auth/auth.types";
import { checkStoreSlugAvailability, type StoreSlugAvailabilityState } from "@/actions/auth/check-store-slug.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AuthSplit } from "../auth-split";
import { GoogleButton, OrDivider, PasswordInput } from "../auth-controls";
import { StorePreview } from "../store-preview";
import { FormField } from "./form-field";

type Step = 1 | 2 | 3;

const STEPS: { title: string; description: string }[] = [
  { title: "سمّي متجرك", description: "الاسم ده هيظهر لعملائك، ومنه هنعمل لينك متجرك." },
  { title: "عرّفنا بيك", description: "عشان نجهّزلك المتجر على حسب نشاطك." },
  { title: "بيانات الدخول", description: "هتستخدمهم عشان تدخل على لوحة التحكم." },
];

const COUNTRIES = ["مصر", "السعودية", "الإمارات", "الكويت", "قطر", "البحرين", "عُمان", "الأردن", "المغرب", "تونس", "الجزائر", "ليبيا", "السودان", "العراق", "لبنان", "سوريا", "فلسطين", "اليمن", "أخرى"];

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

const PHONE_RE = /^(010|011|012|015)\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STEP_FIELDS: Record<Step, string[]> = {
  1: ["storeName"],
  2: ["name", "country", "businessType"],
  3: ["email", "phoneNumber", "password", "confirmPassword"],
};

function passwordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/\d/.test(password)) score++;
  if (password.length >= 12 || (/[a-zA-Z]/.test(password) && /[^a-zA-Z0-9]/.test(password))) score++;
  return score;
}
const STRENGTH = [
  { label: "", tone: "bg-border" },
  { label: "ضعيفة", tone: "bg-destructive" },
  { label: "كويسة", tone: "bg-amber-500" },
  { label: "قوية", tone: "bg-emerald-500" },
];

export function RegisterForm({ refCode, trialDays }: { refCode?: string; trialDays: number }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [done, setDone] = useState(false);

  // Step 1
  const [storeName, setStoreName] = useState("");
  const [slug, setSlug] = useState<StoreSlugAvailabilityState | null>(null);
  const [checking, setChecking] = useState(false);
  const slugRequest = useRef(0);
  const slugTimer = useRef<number | undefined>(undefined);

  // Step 2
  const [name, setName] = useState("");
  const [country, setCountry] = useState("مصر");
  const [businessType, setBusinessType] = useState("");

  // Step 3
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [state, formAction, isPending] = useActionState(async (prev: RegisterState | null, formData: FormData) => {
    const result = await RegisterAction(prev, formData);
    if (result.success) {
      setDone(true);
      window.setTimeout(() => {
        router.push("/onboarding");
        router.refresh();
      }, 1200);
    } else {
      // Send the merchant back to the step that holds the first invalid field.
      const failed = Object.keys(result.fieldErrors ?? {});
      const target = ([1, 2, 3] as Step[]).find((s) => STEP_FIELDS[s].some((f) => failed.includes(f)));
      if (target) setStep(target);
      else if (result.error) toast.error(result.error);
    }
    return result;
  }, null);

  function onStoreNameChange(value: string) {
    setStoreName(value);
    window.clearTimeout(slugTimer.current);
    const trimmed = value.trim();
    const id = ++slugRequest.current;
    if (trimmed.length < 2) {
      setSlug(null);
      setChecking(false);
      return;
    }
    setChecking(true);
    slugTimer.current = window.setTimeout(async () => {
      try {
        const result = await checkStoreSlugAvailability(trimmed);
        if (slugRequest.current === id) setSlug(result);
      } catch {
        if (slugRequest.current === id) setSlug(null);
      } finally {
        if (slugRequest.current === id) setChecking(false);
      }
    }, 400);
  }

  const errors = state?.fieldErrors ?? {};
  const phoneError =
    errors.phoneNumber ?? (touched.phone && phone && !PHONE_RE.test(phone.trim()) ? "رقم مصري من ١١ رقم يبدأ بـ 010 أو 011 أو 012 أو 015" : undefined);
  const emailError = errors.email ?? (touched.email && email && !EMAIL_RE.test(email.trim()) ? "الإيميل ده مش صحيح" : undefined);
  const strength = passwordStrength(password);
  const passwordOk = password.length >= 8 && /\d/.test(password);

  const canContinue: Record<Step, boolean> = {
    1: storeName.trim().length >= 2 && !!slug?.suggestedSlug && !checking,
    2: name.trim().length >= 2 && !!country && !!businessType,
    3: EMAIL_RE.test(email.trim()) && PHONE_RE.test(phone.trim()) && passwordOk,
  };

  if (done) {
    return (
      <AuthSplit aside={<StorePreview storeName={storeName} slug={slug?.suggestedSlug ?? ""} businessType={businessType} trialDays={trialDays} />}>
        <div className="flex flex-col items-center gap-4 text-center motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95" role="status">
          <span className="grid size-14 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-7" />
          </span>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight">متجرك جاهز</h1>
            <p className="font-mono text-sm text-muted-foreground" dir="ltr">
              {slug?.suggestedSlug}.casho.store
            </p>
          </div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            بنجهّزلك الخطوات الأولى...
          </p>
        </div>
      </AuthSplit>
    );
  }

  const current = STEPS[step - 1];

  return (
    <AuthSplit
      aside={<StorePreview storeName={storeName} slug={slug?.suggestedSlug ?? ""} businessType={businessType} trialDays={trialDays} />}
      switchPrompt="عندك حساب؟"
      switchLabel="سجّل دخول"
      switchHref="/login"
    >
      <div className="space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex gap-1.5" aria-hidden>
            {STEPS.map((_, i) => (
              <span key={i} className={cn("h-1 flex-1 rounded-full transition-colors duration-300", i < step ? "bg-primary" : "bg-border")} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            خطوة {step.toLocaleString("ar-EG")} من {STEPS.length.toLocaleString("ar-EG")}
          </p>
        </div>

        <div key={step} className="space-y-1.5 motion-safe:animate-in motion-safe:fade-in">
          <h1 className="text-2xl font-bold tracking-tight">{current.title}</h1>
          <p className="text-sm text-muted-foreground">{current.description}</p>
        </div>

        {step === 1 && (
          <>
            <GoogleButton label="ابدأ بحساب Google" refCode={refCode} />
            <OrDivider label="أو بالإيميل" />
          </>
        )}

        {state?.error && !state.fieldErrors && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {state.error}
          </div>
        )}

        <form
          action={formAction}
          onSubmit={(e) => {
            // Enter on steps 1–2 moves forward instead of submitting.
            if (step < 3) {
              e.preventDefault();
              if (canContinue[step]) setStep((step + 1) as Step);
            }
          }}
          className="space-y-5"
        >
          {/* Single source of truth for what gets submitted. */}
          <input type="hidden" name="storeName" value={storeName} />
          <input type="hidden" name="name" value={name} />
          <input type="hidden" name="country" value={country} />
          <input type="hidden" name="businessType" value={businessType} />
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="phoneNumber" value={phone} />
          <input type="hidden" name="password" value={password} />
          <input type="hidden" name="confirmPassword" value={password} />
          {refCode && <input type="hidden" name="refCode" value={refCode} />}

          <div key={step} className="space-y-5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1">
            {step === 1 && (
              <FormField
                htmlFor="storeName"
                label="اسم المتجر"
                error={errors.storeName}
                hint={<SlugStatus checking={checking} slug={slug} />}
              >
                <Input
                  id="storeName"
                  value={storeName}
                  onChange={(e) => onStoreNameChange(e.target.value)}
                  placeholder="مثلًا: بيت الأزياء"
                  autoFocus
                  autoComplete="organization"
                  maxLength={60}
                  className="h-11"
                />
              </FormField>
            )}

            {step === 2 && (
              <>
                <FormField htmlFor="merchantName" label="اسمك" error={errors.name}>
                  <Input
                    id="merchantName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="الاسم بالكامل"
                    autoFocus
                    autoComplete="name"
                    className="h-11"
                  />
                </FormField>

                <FormField htmlFor="country" label="البلد" error={errors.country}>
                  <Select value={country} onValueChange={setCountry} dir="rtl">
                    <SelectTrigger id="country" className="h-11 w-full">
                      <SelectValue placeholder="اختار البلد" />
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

                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">بتبيع إيه؟</legend>
                  <div role="radiogroup" aria-label="نوع النشاط" className="flex flex-wrap gap-2 pt-1.5">
                    {BUSINESS_TYPES.map((type) => {
                      const selected = businessType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setBusinessType(type)}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            selected
                              ? "border-primary bg-primary/10 font-medium text-primary"
                              : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                          )}
                        >
                          {selected && <Check className="size-3" strokeWidth={3} />}
                          {type}
                        </button>
                      );
                    })}
                  </div>
                  {errors.businessType && <p className="text-xs text-destructive">{errors.businessType}</p>}
                </fieldset>
              </>
            )}

            {step === 3 && (
              <>
                <FormField htmlFor="email" label="البريد الإلكتروني" error={emailError}>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    placeholder="name@example.com"
                    dir="ltr"
                    autoFocus
                    autoComplete="email"
                    inputMode="email"
                    aria-invalid={!!emailError}
                    className="h-11"
                  />
                </FormField>

                <FormField htmlFor="phoneNumber" label="رقم الموبايل" error={phoneError} hint="هنكلمك عليه لو احتجت مساعدة في متجرك.">
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, "").slice(0, 11))}
                    onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                    placeholder="01xxxxxxxxx"
                    dir="ltr"
                    autoComplete="tel"
                    inputMode="numeric"
                    aria-invalid={!!phoneError}
                    className="h-11 tabular-nums"
                  />
                </FormField>

                <FormField htmlFor="password" label="كلمة المرور" error={errors.password ?? errors.confirmPassword}>
                  <PasswordInput
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    aria-invalid={!!errors.password}
                  />
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-1 gap-1" aria-hidden>
                        {[1, 2, 3].map((n) => (
                          <span key={n} className={cn("h-1 flex-1 rounded-full transition-colors", strength >= n ? STRENGTH[strength].tone : "bg-border")} />
                        ))}
                      </div>
                      <span className="w-10 text-left text-xs text-muted-foreground">{password && STRENGTH[strength].label}</span>
                    </div>
                    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      <Rule ok={password.length >= 8}>٨ حروف على الأقل</Rule>
                      <Rule ok={/\d/.test(password)}>فيها رقم</Rule>
                    </ul>
                  </div>
                </FormField>
              </>
            )}
          </div>

          <div className="flex gap-3">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={() => setStep((step - 1) as Step)} className="h-11 gap-1.5 px-4">
                <ArrowRight className="size-4" />
                رجوع
              </Button>
            )}
            <Button type="submit" disabled={!canContinue[step] || isPending} className="h-11 flex-1 gap-2 font-semibold">
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  بنعمل متجرك...
                </>
              ) : step < 3 ? (
                <>
                  التالي
                  <ArrowLeft className="size-4" />
                </>
              ) : (
                "اعمل متجري"
              )}
            </Button>
          </div>

          {step === 3 && (
            <p className="text-center text-xs leading-5 text-muted-foreground">
              لما تدوس &quot;اعمل متجري&quot; تبقى موافق على{" "}
              <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
                الشروط
              </Link>{" "}
              و
              <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
                سياسة الخصوصية
              </Link>
              .
            </p>
          )}
        </form>
      </div>
    </AuthSplit>
  );
}

function Rule({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={cn("flex items-center gap-1 transition-colors", ok ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
      <Check className={cn("size-3", !ok && "opacity-40")} strokeWidth={3} />
      {children}
    </li>
  );
}

function SlugStatus({ checking, slug }: { checking: boolean; slug: StoreSlugAvailabilityState | null }) {
  if (checking) {
    return (
      <span className="flex items-center gap-1.5">
        <Loader2 className="size-3.5 animate-spin" /> بنشوف الاسم متاح ولا لأ...
      </span>
    );
  }
  if (!slug?.suggestedSlug) return <span>حرفين على الأقل، عربي أو إنجليزي.</span>;

  return (
    <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
      {slug.available ? (
        <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <Sparkles className="size-3.5 text-primary" />
      )}
      <span className={slug.available ? "text-emerald-700 dark:text-emerald-400" : "text-foreground"}>
        {slug.available ? "متاح:" : "الاسم ده مستخدم، اقترحنالك:"}
      </span>
      <span className="font-mono font-medium text-foreground" dir="ltr">
        {slug.suggestedSlug}.casho.store
      </span>
    </span>
  );
}
