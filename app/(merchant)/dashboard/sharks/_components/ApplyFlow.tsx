"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { submitSharksApplicationAction } from "@/actions/sharks/apply.actions";
import { appleButton } from "@/components/saas-page";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BENEFITS, OPERATING_SINCE, TRACKS, benefitsForTrack, pick, type OperatingSince } from "@/lib/sharks/catalog";
import { APPLICATION_STEPS, fieldErrors } from "@/lib/sharks/validation";
import { currentLocale, isRtl, tr, trv } from "@/lib/i18n/dashboard";
import { cn } from "@/lib/utils";

export type EligibleStore = { id: string; name: string; url: string; industry: string | null };

type Draft = {
  storeId: string;
  businessName: string;
  storeUrl: string;
  industry: string;
  description: string;
  operatingSince: string;
  offering: string;
  customers: string;
  challenge: string;
  traction: string;
  potential: string;
  requestedTracks: ("BENEFITS" | "GROWTH")[];
  investmentInterest: boolean;
  supportGoal: string;
  links: string[];
  extraInfo: string;
  termsAccepted: boolean;
  marketingOptIn: boolean;
};

const DRAFT_KEY = "casho-sharks-draft";

function fromStore(store: EligibleStore): Pick<Draft, "storeId" | "businessName" | "storeUrl" | "industry"> {
  return { storeId: store.id, businessName: store.name, storeUrl: store.url, industry: store.industry ?? "" };
}

function emptyDraft(store: EligibleStore): Draft {
  return {
    ...fromStore(store),
    description: "",
    operatingSince: "",
    offering: "",
    customers: "",
    challenge: "",
    traction: "",
    potential: "",
    requestedTracks: [],
    investmentInterest: false,
    supportGoal: "",
    links: [""],
    extraInfo: "",
    termsAccepted: false,
    marketingOptIn: false,
  };
}

const STEP_TITLES = [() => tr("البيزنس"), () => tr("الوضع الحالي"), () => tr("الدعم"), () => tr("المراجعة والموافقة")];

/**
 * Four short steps → one application. Each step is validated with the same
 * schema the server re-checks. A per-session key makes a double submit
 * harmless; the draft is kept on this device until it's sent.
 */
export default function ApplyFlow({ stores, tracks }: { stores: EligibleStore[]; tracks: ("BENEFITS" | "GROWTH")[] }) {
  const router = useRouter();
  const reduce = !!useReducedMotion();
  const lang = currentLocale();
  const rtl = isRtl();
  const [submissionKey] = useState(() => crypto.randomUUID());
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(stores[0]));
  const [restored, setRestored] = useState(false);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  // Set when the step changes; the next step's heading takes focus once it mounts
  // (AnimatePresence mounts it only after the old step has left).
  const focusHeading = useRef(false);

  // Restore a draft from this device (same stores only).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<Draft>;
      if (!stores.some((s) => s.id === saved.storeId)) return;
      // Browser-only state: reading it during render would mismatch the server HTML.
      /* eslint-disable react-hooks/set-state-in-effect */
      setDraft((d) => ({ ...d, ...saved, requestedTracks: (saved.requestedTracks ?? []).filter((t) => tracks.includes(t)), termsAccepted: false }));
      setRestored(true);
      /* eslint-enable react-hooks/set-state-in-effect */
    } catch {
      /* storage unavailable */
    }
  }, [stores, tracks]);

  useEffect(() => {
    if (done) return;
    const t = window.setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, termsAccepted: false }));
      } catch {
        /* storage unavailable */
      }
    }, 400);
    return () => window.clearTimeout(t);
  }, [draft, done]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    if (errors[key as string]) setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => k !== key)));
  };

  const payload = () => ({ ...draft, links: draft.links.map((l) => l.trim()).filter(Boolean), extraInfo: draft.extraInfo.trim() || undefined, submissionKey });

  function validate(index: number) {
    const res = APPLICATION_STEPS[index].safeParse(payload());
    if (res.success) return true;
    const errs = fieldErrors(res.error);
    setErrors(errs);
    requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
    return false;
  }

  const go = (next: number) => {
    focusHeading.current = true;
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  function next() {
    if (validate(step)) go(step + 1);
  }

  function submit() {
    for (let i = 0; i < APPLICATION_STEPS.length; i++) {
      if (!validate(i)) {
        if (i !== step) go(i);
        return;
      }
    }
    start(async () => {
      try {
        const res = await submitSharksApplicationAction(payload());
        if (!res.success) {
          const errs = res.fieldErrors ?? {};
          setErrors(errs);
          toast.error(trv(res.message));
          const stepWithError = APPLICATION_STEPS.findIndex((s) => Object.keys(errs).some((k) => k in s.shape));
          if (stepWithError >= 0 && stepWithError !== step) go(stepWithError);
          return;
        }
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {
          /* storage unavailable */
        }
        setDone(true);
      } catch {
        toast.error(tr("محصلش إرسال، جرّب تاني"));
      }
    });
  }

  if (done) return <Submitted onContinue={() => router.refresh()} />;

  const variants = {
    enter: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: (rtl ? -1 : 1) * d * 40 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: (rtl ? 1 : -1) * d * 40 }),
  };
  const err = (k: string) => (errors[k] ? trv(errors[k]) : undefined);
  const last = step === APPLICATION_STEPS.length - 1;

  return (
    <section className="apple-card overflow-hidden" aria-labelledby="sharks-step-title">
      {/* Progress */}
      <div className="px-5 pt-5 sm:px-8 sm:pt-7">
        <ol className="grid grid-cols-4 gap-2" aria-label={tr("خطوات الطلب")}>
          {STEP_TITLES.map((title, i) => (
            <li key={i} aria-current={i === step ? "step" : undefined}>
              <span className={cn("block h-1 rounded-full transition-colors duration-500", i <= step ? "bg-primary" : "bg-muted")} />
              <span className={cn("mt-2 hidden text-[12px] sm:block", i === step ? "font-semibold text-foreground" : "text-muted-foreground")}>{title()}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-[13px] text-muted-foreground sm:hidden">{tr("الخطوة {0} من {1}", step + 1, APPLICATION_STEPS.length)}</p>
      </div>

      {restored && step === 0 && (
        <p className="mx-5 mt-4 rounded-xl bg-muted px-4 py-3 text-[13px] text-muted-foreground sm:mx-8">{tr("رجّعنالك آخر مسودة كنت بتكتبها على الجهاز ده.")}</p>
      )}

      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={step}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: reduce ? 0.15 : 0.32, ease: [0.28, 0.11, 0.32, 1] }}
            className="space-y-6 px-5 py-6 sm:px-8 sm:py-8"
          >
            <h2
              id="sharks-step-title"
              ref={(el) => {
                if (el && focusHeading.current) {
                  focusHeading.current = false;
                  el.focus();
                }
              }}
              tabIndex={-1} className="text-[22px] font-bold outline-none">
              {STEP_TITLES[step]()}
            </h2>

            {step === 0 && (
              <>
                {stores.length > 1 && (
                  <Field label={tr("المتجر")} error={err("storeId")}>
                    {(p) => (
                      <select
                        {...p}
                        value={draft.storeId}
                        onChange={(e) => {
                          const s = stores.find((x) => x.id === e.target.value);
                          if (s) setDraft((d) => ({ ...d, ...fromStore(s) }));
                        }}
                        className="h-11 w-full rounded-xl border border-input bg-background px-3 text-[15px]"
                      >
                        {stores.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </Field>
                )}
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field label={tr("اسم البيزنس")} error={err("businessName")}>
                    {(p) => <Input {...p} value={draft.businessName} onChange={(e) => set("businessName", e.target.value)} maxLength={80} className="h-11" />}
                  </Field>
                  <Field label={tr("المجال")} hint={tr("مثلاً: ملابس، عطور، أكل بيتي")} error={err("industry")}>
                    {(p) => <Input {...p} value={draft.industry} onChange={(e) => set("industry", e.target.value)} maxLength={60} className="h-11" />}
                  </Field>
                </div>
                <Field label={tr("رابط المتجر")} error={err("storeUrl")}>
                  {(p) => <Input {...p} dir="ltr" type="url" inputMode="url" value={draft.storeUrl} onChange={(e) => set("storeUrl", e.target.value)} className="h-11" />}
                </Field>
                <Field label={tr("عرّفنا بالبيزنس")} hint={tr("في سطرين أو تلاتة: بتعمل إيه ولمين.")} error={err("description")}>
                  {(p) => <Textarea {...p} value={draft.description} onChange={(e) => set("description", e.target.value)} maxLength={1000} rows={4} />}
                </Field>
                <Field label={tr("البيزنس شغال من إمتى؟")} error={err("operatingSince")} group>
                  {(p) => (
                    <div role="radiogroup" {...p} className="grid gap-2 sm:grid-cols-2">
                      {(Object.keys(OPERATING_SINCE) as OperatingSince[]).map((k) => (
                        <Choice key={k} type="radio" name="operatingSince" checked={draft.operatingSince === k} onChange={() => set("operatingSince", k)}>
                          {pick(OPERATING_SINCE[k], lang)}
                        </Choice>
                      ))}
                    </div>
                  )}
                </Field>
              </>
            )}

            {step === 1 && (
              <>
                <Field label={tr("بتبيع إيه؟")} error={err("offering")}>
                  {(p) => <Textarea {...p} value={draft.offering} onChange={(e) => set("offering", e.target.value)} maxLength={600} rows={3} />}
                </Field>
                <Field label={tr("مين عملاءك؟")} error={err("customers")}>
                  {(p) => <Textarea {...p} value={draft.customers} onChange={(e) => set("customers", e.target.value)} maxLength={600} rows={3} />}
                </Field>
                <Field label={tr("إيه أكبر تحدي قدامك دلوقتي؟")} error={err("challenge")}>
                  {(p) => <Textarea {...p} value={draft.challenge} onChange={(e) => set("challenge", e.target.value)} maxLength={1000} rows={4} />}
                </Field>
                <Field
                  label={tr("وصلت لإيه لحد دلوقتي؟")}
                  hint={tr("أي تقدم تقدر تقوله: عملاء راجعين، طلبات، مبيعات تقريبية. مش لازم أرقام دقيقة أو بيانات سرية.")}
                  error={err("traction")}
                >
                  {(p) => <Textarea {...p} value={draft.traction} onChange={(e) => set("traction", e.target.value)} maxLength={1000} rows={4} />}
                </Field>
                <Field label={tr("ليه شايف إن البيزنس ده ليه مستقبل؟")} error={err("potential")}>
                  {(p) => <Textarea {...p} value={draft.potential} onChange={(e) => set("potential", e.target.value)} maxLength={1000} rows={4} />}
                </Field>
              </>
            )}

            {step === 2 && (
              <>
                <Field label={tr("محتاج دعم في إيه؟")} hint={tr("اختار مسار أو اتنين. اختيارك مش معناه إنك هتاخده — الفريق بيحدد المناسب.")} error={err("requestedTracks")} group>
                  {(p) => (
                    <div {...p} className="grid gap-3">
                      {tracks.map((t) => (
                        <Choice
                          key={t}
                          type="checkbox"
                          checked={draft.requestedTracks.includes(t)}
                          onChange={(on) => set("requestedTracks", on ? [...draft.requestedTracks, t] : draft.requestedTracks.filter((x) => x !== t))}
                        >
                          <span className="block font-semibold" dir="ltr">
                            {pick(TRACKS[t].name, lang)}
                          </span>
                          <span className="mt-0.5 block text-[13px] text-muted-foreground">{benefitsForTrack(t).map((k) => pick(BENEFITS[k], lang)).join(" · ")}</span>
                        </Choice>
                      ))}
                    </div>
                  )}
                </Field>
                <Field label={tr("المشكلة اللي عايز مساعدة فيها")} hint={tr("كل ما تكون محدد أكتر، كل ما نقدر نقيّم أحسن.")} error={err("supportGoal")}>
                  {(p) => <Textarea {...p} value={draft.supportGoal} onChange={(e) => set("supportGoal", e.target.value)} maxLength={1000} rows={4} />}
                </Field>
                <div className="rounded-2xl border border-dashed border-border p-4">
                  <Choice type="checkbox" checked={draft.investmentInterest} onChange={(on) => set("investmentInterest", on)} plain>
                    <span className="block font-medium">{tr("عايز أعرف لما يبقى فيه مسار استثمار في المستقبل")}</span>
                    <span className="mt-1 block text-[13px] leading-relaxed text-muted-foreground">
                      {tr("ده للعلم بس، ومش طلب تمويل. Casho Investment مسار مستقبلي، وكاشو مفيهاش تمويل أو استثمار متاح دلوقتي.")}
                    </span>
                  </Choice>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <Field label={tr("روابط تساعدنا نفهم شغلك (اختياري)")} hint={tr("انستجرام، صور منتجات، ملف على Google Drive… لحد ٥ روابط.")} error={err("links")} group>
                  {(p) => (
                    <div {...p} className="space-y-2">
                      {draft.links.map((link, i) => (
                        <div key={i} className="flex gap-2">
                          <Input
                            dir="ltr"
                            type="url"
                            inputMode="url"
                            placeholder="https://"
                            aria-label={tr("رابط {0}", i + 1)}
                            value={link}
                            onChange={(e) => set("links", draft.links.map((l, j) => (j === i ? e.target.value : l)))}
                            className="h-11"
                          />
                          {draft.links.length > 1 && (
                            <button type="button" aria-label={tr("شيل الرابط")} onClick={() => set("links", draft.links.filter((_, j) => j !== i))} className={cn(appleButton.tinted, "size-11 px-0")}>
                              <X className="size-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {draft.links.length < 5 && (
                        <button type="button" onClick={() => set("links", [...draft.links, ""])} className={appleButton.plain}>
                          <Plus className="size-4" />
                          {tr("رابط تاني")}
                        </button>
                      )}
                    </div>
                  )}
                </Field>
                <Field label={tr("حاجة تانية حابب تقولها؟ (اختياري)")} error={err("extraInfo")}>
                  {(p) => <Textarea {...p} value={draft.extraInfo} onChange={(e) => set("extraInfo", e.target.value)} maxLength={1000} rows={3} />}
                </Field>

                <div className="space-y-3 rounded-2xl bg-muted/60 p-5">
                  <p className="text-[15px] font-semibold">{tr("شروط البرنامج")}</p>
                  <ul className="list-disc space-y-1.5 ps-5 text-[13px] leading-relaxed text-muted-foreground">
                    <li>{tr("التقديم مجاني ومش بيضمن الاختيار أو أي نوع دعم.")}</li>
                    <li>{tr("Casho Sharks مش بيقدّم تمويل أو استثمار أو فلوس. الدعم اللي بيتوافق عليه بيتكتب في خطة واضحة.")}</li>
                    <li>{tr("بيانات الطلب بتستخدم للمراجعة بس، ومحدش بيشوفها غير فريق كاشو.")}</li>
                    <li>{tr("الفريق ممكن يتواصل معاك بأسئلة أو لترتيب مكالمة.")}</li>
                  </ul>
                  <Field label="" error={err("termsAccepted")} group>
                    {(p) => (
                      <div {...p}>
                        <Choice type="checkbox" checked={draft.termsAccepted} onChange={(on) => set("termsAccepted", on)} plain>
                          <span className="font-medium">{tr("قريت الشروط وموافق عليها")}</span>
                        </Choice>
                      </div>
                    )}
                  </Field>
                </div>

                <div className="rounded-2xl border border-border p-5">
                  <Choice type="checkbox" checked={draft.marketingOptIn} onChange={(on) => set("marketingOptIn", on)} plain>
                    <span className="block font-medium">{tr("ممكن تتواصلوا معايا بخصوص نشر حكايتي مستقبلًا (اختياري)")}</span>
                    <span className="mt-1 block text-[13px] leading-relaxed text-muted-foreground">
                      {tr("ده مش موافقة على النشر. أي قصة أو صورة أو فيديو هيحتاج موافقتك الصريحة على المحتوى نفسه قبل ما يتنشر، وتقدر ترفض في أي وقت.")}
                    </span>
                  </Choice>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4 sm:px-8">
        {step > 0 ? (
          <button type="button" onClick={() => go(step - 1)} disabled={pending} className={appleButton.tinted}>
            {tr("رجوع")}
          </button>
        ) : (
          <span />
        )}
        {last ? (
          <button type="button" onClick={submit} disabled={pending} className={appleButton.filled} aria-busy={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {pending ? tr("بيتبعت…") : tr("ابعت الطلب")}
          </button>
        ) : (
          <button type="button" onClick={next} className={appleButton.filled}>
            {tr("التالي")}
          </button>
        )}
      </div>
    </section>
  );
}

/** Label + control + hint + error, wired for screen readers. */
function Field({
  label,
  hint,
  error,
  group,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  /** Radio/checkbox groups: label the wrapper instead of one input. */
  group?: boolean;
  children: (props: { id: string; "aria-invalid"?: boolean; "aria-describedby"?: string; "aria-labelledby"?: string; tabIndex?: number }) => ReactNode;
}) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  const props = group
    ? { id, "aria-labelledby": label ? `${id}-label` : undefined, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined, tabIndex: error ? -1 : undefined }
    : { id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined };
  return (
    <div className="space-y-2">
      {label &&
        (group ? (
          <p id={`${id}-label`} className="text-[15px] font-medium">
            {label}
          </p>
        ) : (
          <label htmlFor={id} className="block text-[15px] font-medium">
            {label}
          </label>
        ))}
      {hint && (
        <p id={`${id}-hint`} className="text-[13px] leading-relaxed text-muted-foreground">
          {hint}
        </p>
      )}
      {children(props)}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-[13px] text-(--sys-red)">
          {error}
        </p>
      )}
    </div>
  );
}

function Choice({
  type,
  name,
  checked,
  onChange,
  plain,
  children,
}: {
  type: "radio" | "checkbox";
  name?: string;
  checked: boolean;
  onChange: (on: boolean) => void;
  plain?: boolean;
  children: ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 text-[15px] has-focus-visible:ring-2 has-focus-visible:ring-ring",
        plain ? "rounded-lg" : "min-h-11 rounded-xl border p-3.5 transition-colors",
        !plain && (checked ? "border-primary bg-primary/6" : "border-border hover:bg-muted/50"),
      )}
    >
      <input type={type} name={name} checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden
        className={cn(
          "mt-0.5 grid size-5 shrink-0 place-items-center border transition-colors",
          type === "radio" ? "rounded-full" : "rounded-md",
          checked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40 bg-background",
        )}
      >
        {checked && (type === "radio" ? <span className="size-2 rounded-full bg-current" /> : <Check className="size-3.5" strokeWidth={3} />)}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </label>
  );
}

function Submitted({ onContinue }: { onContinue: () => void }) {
  const reduce = !!useReducedMotion();
  return (
    <section className="apple-card px-6 py-14 text-center sm:px-10" aria-live="polite">
      <svg viewBox="0 0 64 64" className="mx-auto size-16 text-primary" aria-hidden>
        <motion.circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" strokeWidth="2.5" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, ease: "easeOut" }} />
        <motion.path
          d="M20 33l8 8 16-17"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.45, ease: "easeOut" }}
        />
      </svg>
      <h2 className="mt-6 text-[28px] font-bold">{tr("طلبك وصل")}</h2>
      <p className="mx-auto mt-3 max-w-[460px] text-[15px] leading-relaxed text-muted-foreground">
        {tr("فريق كاشو هيراجع الطلب، وهيوصلك إشعار هنا مع أي تحديث. التقديم مش معناه اختيار مضمون.")}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={onContinue} className={appleButton.filled}>
          {tr("تابع حالة الطلب")}
        </button>
        <Link href="/notifications" className={appleButton.gray}>
          {tr("الإشعارات")}
        </Link>
      </div>
    </section>
  );
}
