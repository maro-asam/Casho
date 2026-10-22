"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  CreditCard,
  Download,
  ImagePlus,
  Loader2,
  type LucideIcon,
  MessageCircle,
  Package,
  Palette,
  Rocket,
  Sparkles,
  Store,
  Trash2,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

import { CompleteOnboardingAction } from "@/actions/onboarding/onboarding.actions";
import { THEME_PREVIEWS } from "@/app/(merchant)/(builder)/builder/_components/theme-previews";
import { WhatsAppIcon } from "@/app/store/[slug]/_components/conversion/WhatsAppButton";
import { FacebookIcon, InstagramIcon, TikTokIcon } from "@/app/store/[slug]/_themes/shared/social";
import { SegmentedButtons, appleButton } from "@/components/saas-page";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { STORE_THEMES, THEME_PRESET_IDS, type ThemePresetId } from "@/constants/store-themes";
import { uploadImageToCloudinary } from "@/lib/cloudinary-upload";
import { compressImage, ONE_MB } from "@/lib/image-compress";
import { cn } from "@/lib/utils";
import { lazyIntl, tdir, tr, trv } from "@/lib/i18n/dashboard";
import { StorePreview } from "./StorePreview";

const nf = lazyIntl.number();

type Step = "welcome" | "look" | "contact" | "checkout" | "start" | "done";
const FLOW: Step[] = ["welcome", "look", "contact", "checkout", "start", "done"];
/** Steps counted in the progress bar. */
const COUNTED: Step[] = ["look", "contact", "checkout", "start"];

type Start = "demo" | "empty" | "import";

type Props = {
  storeName: string;
  slug: string;
  ownerName: string;
  businessType: string;
  initialLogo: string | null;
  initialWhatsapp: string;
  initialLanguage: "ar" | "en";
  suggestedTheme: ThemePresetId;
  trialDaysLeft: number | null;
  demo: {
    products: number;
    orders: number;
    customers: number;
    preview: { name: string; image: string; price: number }[];
  };
};

const VODAFONE_RE = /^01[0125]\d{8}$/;

export default function OnboardingWizard(props: Props) {
  const { storeName, slug, ownerName, businessType, suggestedTheme, trialDaysLeft, demo } = props;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState<Step>("welcome");
  const [direction, setDirection] = useState<1 | -1>(1);

  // Look
  const [theme, setTheme] = useState<ThemePresetId>(suggestedTheme);
  const [logo, setLogo] = useState<string | null>(props.initialLogo);
  const [language, setLanguage] = useState<"ar" | "en">(props.initialLanguage);
  // Contact
  const [whatsapp, setWhatsapp] = useState(props.initialWhatsapp);
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");
  // Checkout
  const [cod, setCod] = useState(true);
  const [vodafoneOn, setVodafoneOn] = useState(false);
  const [vodafone, setVodafone] = useState("");
  const [instapayOn, setInstapayOn] = useState(false);
  const [instapay, setInstapay] = useState("");
  const [shippingMode, setShippingMode] = useState<"flat" | "free">("flat");
  const [shippingPrice, setShippingPrice] = useState("50");
  // Start
  const [start, setStart] = useState<Start>("demo");

  const [result, setResult] = useState<{ storeUrl: string; seeded: { products: number; orders: number } | null } | null>(null);

  const shipping = shippingMode === "free" ? 0 : Math.max(0, Math.round(Number(shippingPrice) || 0));
  const paymentLabels = [
    cod && tr("كاش عند الاستلام"),
    vodafoneOn && vodafone.trim() && tr("فودافون كاش"),
    instapayOn && instapay.trim() && "InstaPay",
  ].filter((p): p is string => Boolean(p));

  const contactErrors = useMemo(() => {
    const digits = whatsapp.replace(/[\s-]/g, "");
    return { whatsapp: digits && !/^\+?\d{8,15}$/.test(digits) ? tr("اكتب الرقم أرقام بس، زي 01012345678") : null };
  }, [whatsapp]);

  const checkoutErrors = useMemo(() => {
    const v = vodafone.replace(/\s/g, "");
    return {
      vodafone: vodafoneOn && (!v ? tr("اكتب رقم المحفظة") : !VODAFONE_RE.test(v) ? tr("الرقم لازم يكون ١١ رقم ويبدأ بـ 01") : null),
      instapay: instapayOn && !instapay.trim() ? tr("اكتب عنوان InstaPay أو رقمك عليه") : null,
      none: !cod && !(vodafoneOn && v) && !(instapayOn && instapay.trim()) ? tr("فعّل طريقة دفع واحدة على الأقل") : null,
      shipping: shippingMode === "flat" && !(Number(shippingPrice) >= 0 && Number(shippingPrice) <= 100000) ? tr("سعر الشحن مش صحيح") : null,
    };
  }, [cod, vodafoneOn, vodafone, instapayOn, instapay, shippingMode, shippingPrice]);

  function go(next: Step) {
    setDirection(FLOW.indexOf(next) >= FLOW.indexOf(step) ? 1 : -1);
    setStep(next);
    window.scrollTo({ top: 0 });
  }

  const next = () => go(FLOW[FLOW.indexOf(step) + 1]);
  const back = () => go(FLOW[Math.max(0, FLOW.indexOf(step) - 1)]);

  function continueFrom() {
    if (step === "contact" && contactErrors.whatsapp) return toast.error(contactErrors.whatsapp);
    if (step === "checkout") {
      const first = checkoutErrors.none || checkoutErrors.vodafone || checkoutErrors.instapay || checkoutErrors.shipping;
      if (first) return toast.error(first);
    }
    if (step === "start") return finish();
    next();
  }

  function finish() {
    startTransition(async () => {
      const res = await CompleteOnboardingAction({
        themeId: theme,
        logo: logo ?? "",
        storeLanguage: language,
        whatsappNumber: whatsapp,
        instagram,
        facebook,
        tiktok,
        cashOnDelivery: cod,
        vodafoneCash: vodafoneOn ? vodafone : "",
        instapay: instapayOn ? instapay : "",
        shippingPrice: shipping,
        start,
      });
      if (!res.success) {
        toast.error(trv(res.message));
        return;
      }
      setResult({ storeUrl: res.storeUrl, seeded: res.seeded });
      go("done");
      router.prefetch(start === "import" ? "/integrations/shopify" : "/dashboard");
    });
  }

  const counted = COUNTED.indexOf(step);
  const captions: Record<Step, string> = {
    welcome: tr("ده متجرك — هيتبني قدامك مع كل اختيار."),
    look: tr("جرّب الثيمات وشوف متجرك بيتغيّر هنا."),
    contact: tr("أيقونات التواصل بتنوّر مع كل حساب تضيفه."),
    checkout: tr("ده اللي عميلك هيشوفه في صفحة الدفع."),
    start: tr("خطوة أخيرة ومتجرك يبقى جاهز."),
    done: tr("متجرك أونلاين دلوقتي 🎉"),
  };

  const ctaLabel =
    step === "welcome" ? tr("يلا نبدأ") : step === "start" ? (isPending ? tr("بنجهّز متجرك…") : tr("جهّز متجري")) : tr("التالي");

  return (
    <div dir={tdir()} className="apple-ui grid min-h-svh bg-background text-foreground lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex min-h-svh min-w-0 flex-col">
        {/* Top bar: back · progress · trial */}
        <header className="sticky top-0 z-20 bg-background/80 px-4 backdrop-blur-xl sm:px-8">
          <div className="mx-auto flex h-16 w-full max-w-[560px] items-center gap-3">
            {counted >= 0 ? (
              <button
                type="button"
                onClick={back}
                disabled={isPending}
                aria-label={tr("رجوع")}
                className="apple-press grid size-10 shrink-0 place-items-center rounded-full bg-card text-primary disabled:opacity-40"
              >
                <ChevronRight className="size-5 ltr:-scale-x-100" />
              </button>
            ) : (
              <span className="flex shrink-0 items-center gap-2">
                <Image src="/logo.svg" alt="" width={30} height={30} priority className="rounded-[8px]" />
                <span className="text-[17px] font-semibold">{tr("كاشو")}</span>
              </span>
            )}

            {counted >= 0 && (
              <div className="flex flex-1 items-center gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={COUNTED.length} aria-valuenow={counted + 1} aria-label={tr("خطوة {0} من {1}", nf.format(counted + 1), nf.format(COUNTED.length))}>
                {COUNTED.map((s, i) => (
                  <span key={s} className="h-1.5 flex-1 overflow-hidden rounded-full bg-(--fill-3)">
                    <span
                      className="block h-full rounded-full bg-primary transition-[width] duration-500 ease-(--ease-apple)"
                      style={{ width: i <= counted ? "100%" : "0%" }}
                    />
                  </span>
                ))}
              </div>
            )}
            {counted < 0 && <span className="flex-1" />}

            {trialDaysLeft !== null && step !== "done" && (
              <span className="shrink-0 rounded-full bg-(--sys-green)/12 px-3 py-1 text-[12px] font-semibold text-[#248a3d] dark:text-(--sys-green)">
                {tr("{0} يوم مجانًا", nf.format(trialDaysLeft))}
              </span>
            )}
          </div>
        </header>

        <main className="flex flex-1 justify-center px-4 pt-4 pb-36 sm:px-8 sm:pt-8">
          <div
            key={step}
            className={cn(
              "w-full max-w-[560px] motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500 motion-safe:ease-(--ease-apple)",
              direction === 1 ? "motion-safe:slide-in-from-bottom-3" : "motion-safe:slide-in-from-top-3",
            )}
          >
            {step === "welcome" && <Welcome ownerName={ownerName} storeName={storeName} />}
            {step === "look" && (
              <LookStep
                theme={theme}
                setTheme={setTheme}
                suggested={suggestedTheme}
                logo={logo}
                setLogo={setLogo}
                storeName={storeName}
                language={language}
                setLanguage={setLanguage}
              />
            )}
            {step === "contact" && (
              <ContactStep
                values={{ whatsapp, instagram, facebook, tiktok }}
                setters={{ whatsapp: setWhatsapp, instagram: setInstagram, facebook: setFacebook, tiktok: setTiktok }}
                whatsappError={contactErrors.whatsapp}
              />
            )}
            {step === "checkout" && (
              <CheckoutStep
                cod={cod}
                setCod={setCod}
                vodafoneOn={vodafoneOn}
                setVodafoneOn={setVodafoneOn}
                vodafone={vodafone}
                setVodafone={setVodafone}
                instapayOn={instapayOn}
                setInstapayOn={setInstapayOn}
                instapay={instapay}
                setInstapay={setInstapay}
                shippingMode={shippingMode}
                setShippingMode={setShippingMode}
                shippingPrice={shippingPrice}
                setShippingPrice={setShippingPrice}
                errors={checkoutErrors}
              />
            )}
            {step === "start" && (isPending ? <Building start={start} /> : <StartStep start={start} setStart={setStart} demo={demo} businessType={businessType} />)}
            {step === "done" && result && (
              <Done
                storeName={storeName}
                storeUrl={result.storeUrl}
                seeded={result.seeded}
                start={start}
                trialDaysLeft={trialDaysLeft}
                onEnter={() => {
                  router.push(start === "import" ? "/integrations/shopify" : "/dashboard");
                  router.refresh();
                }}
              />
            )}
          </div>
        </main>

        {/* Floating action bar over a scroll-edge fade */}
        {step !== "done" && !isPending && (
          <div className="pointer-events-none fixed start-0 end-0 bottom-0 z-20 lg:end-auto lg:w-1/2">
            <div className="h-10 bg-linear-to-t from-background to-transparent" />
            <div className="pointer-events-auto bg-background px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8">
              <div className="mx-auto flex w-full max-w-[560px] flex-col gap-1">
                <button type="button" onClick={continueFrom} disabled={isPending} className={cn(appleButton.filled, "h-[52px] w-full text-[17px]")}>
                  {isPending ? <Loader2 className="size-5 animate-spin" /> : step === "start" ? <Rocket className="size-5" /> : null}
                  {ctaLabel}
                  {!isPending && step !== "start" && <ChevronLeft className="size-5 ltr:-scale-x-100" />}
                </button>
                {(step === "contact" || step === "look") && (
                  <button type="button" onClick={next} className={cn(appleButton.plain, "mx-auto h-10 text-[15px]")}>
                    {tr("هكمّلها بعدين")}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dark showcase with the live store */}
      <aside aria-hidden className="dark sticky top-0 hidden h-svh p-3 lg:block">
        <div className="apple-ui relative flex h-full items-center justify-center overflow-hidden rounded-[28px] bg-black text-foreground">
          <div className="pointer-events-none absolute -top-1/4 left-1/2 size-[640px] -translate-x-1/2 rounded-full bg-primary/35 blur-[120px]" />
          <div className="pointer-events-none absolute -bottom-1/3 -left-1/4 size-[420px] rounded-full bg-(--sys-indigo)/25 blur-[120px]" />
          <div className="relative w-full max-w-md px-8 py-10">
            <StorePreview
              caption={captions[step]}
              state={{
                storeName,
                slug,
                logo,
                theme,
                contact: {
                  whatsapp: Boolean(whatsapp.trim()),
                  instagram: Boolean(instagram.trim()),
                  facebook: Boolean(facebook.trim()),
                  tiktok: Boolean(tiktok.trim()),
                },
                payments: paymentLabels,
                shipping,
              }}
            />
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ── Shared bits ─────────────────────────────────────────────────────────── */

function StepTitle({ icon: Icon, tone, title, subtitle }: { icon: LucideIcon; tone: string; title: string; subtitle: string }) {
  return (
    <div className="mb-7 space-y-3">
      <span className={cn("grid size-12 place-items-center rounded-[14px] text-white shadow-sm", tone)}>
        <Icon className="size-6" strokeWidth={2} />
      </span>
      <h1 className="text-[30px] leading-[1.2] font-bold text-balance sm:text-[34px]">{title}</h1>
      <p className="text-[17px] leading-7 text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 px-4 text-[13px] font-semibold text-muted-foreground">{children}</h2>;
}

function Footnote({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 px-4 text-[13px] leading-[18px] text-muted-foreground">{children}</p>;
}

function IconTile({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={cn("grid size-[30px] shrink-0 place-items-center rounded-[8px] text-white", className)}>{children}</span>;
}

/* ── Welcome ─────────────────────────────────────────────────────────────── */

function Welcome({ ownerName, storeName }: { ownerName: string; storeName: string }) {
  const items: [LucideIcon, string, string, string][] = [
    [Palette, "bg-(--sys-indigo)", tr("شكل متجرك"), tr("ثيم يناسب نشاطك ولوجو براندك.")],
    [MessageCircle, "bg-[#25d366]", tr("التواصل"), tr("واتساب وحساباتك عشان العميل يوصلك.")],
    [CreditCard, "bg-(--sys-orange)", tr("الدفع والشحن"), tr("إزاي عميلك هيدفع، وبكام التوصيل.")],
    [Package, "bg-primary", tr("أول منتجاتك"), tr("ابدأ بمنتجات تجريبية أو انقل متجرك القديم.")],
  ];
  return (
    <div className="pt-4 sm:pt-10">
      <span className="mb-6 grid size-16 place-items-center rounded-[18px] bg-linear-to-b from-primary/80 to-primary text-primary-foreground shadow-[0_10px_30px_-8px] shadow-primary/50">
        <Sparkles className="size-8" />
      </span>
      <h1 className="text-[34px] leading-[1.15] font-bold text-balance sm:text-[40px]">
        {ownerName ? tr("أهلًا يا {0}،", ownerName) : tr("أهلًا بيك،")}
        <br />
        <span className="text-muted-foreground">{tr("يلا نجهّز {0}.", storeName || tr("متجرك"))}</span>
      </h1>
      <p className="mt-3 text-[17px] leading-7 text-muted-foreground">
        {tr("٤ خطوات سريعة، حوالي دقيقتين. كل حاجة هنا تقدر تغيّرها بعدين.")}
      </p>

      <ul className="mt-8 space-y-5">
        {items.map(([Icon, tone, title, text], i) => (
          <li
            key={title}
            className="flex items-start gap-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:fill-mode-both motion-safe:duration-500"
            style={{ animationDelay: `${120 + i * 80}ms` }}
          >
            <IconTile className={cn(tone, "size-10 rounded-[11px]")}>
              <Icon className="size-5" />
            </IconTile>
            <div>
              <p className="text-[17px] font-semibold">{title}</p>
              <p className="text-[15px] leading-6 text-muted-foreground">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Look ────────────────────────────────────────────────────────────────── */

function LookStep({
  theme,
  setTheme,
  suggested,
  logo,
  setLogo,
  storeName,
  language,
  setLanguage,
}: {
  theme: ThemePresetId;
  setTheme: (t: ThemePresetId) => void;
  suggested: ThemePresetId;
  logo: string | null;
  setLogo: (l: string | null) => void;
  storeName: string;
  language: "ar" | "en";
  setLanguage: (l: "ar" | "en") => void;
}) {
  const [uploading, setUploading] = useState(false);
  // Suggested theme first, the rest in registry order.
  const ids = [suggested, ...THEME_PRESET_IDS.filter((id) => id !== suggested)];

  async function upload(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error(tr("اختار صورة"));
    setUploading(true);
    try {
      const small = await compressImage(file, { maxBytes: ONE_MB, maxSide: 1024, format: "image/webp" });
      setLogo(await uploadImageToCloudinary(small, "casho/uploads/logos", 1));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tr("فشل رفع اللوجو"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <StepTitle icon={Palette} tone="bg-(--sys-indigo)" title={tr("شكل متجرك")} subtitle={tr("اختار ثيم ولوجو. اخترنالك ثيم يناسب نشاطك، وتقدر تغيّر أي حاجة بعدين من الاستوديو.")} />

      <SectionLabel>{tr("اللوجو")}</SectionLabel>
      <div className="apple-card flex items-center gap-4 p-4">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element -- merchant's uploaded logo
          <img src={logo} alt={tr("اللوجو")} className="size-16 shrink-0 rounded-[16px] bg-background object-contain p-1.5" />
        ) : (
          <span className="grid size-16 shrink-0 place-items-center rounded-[16px] bg-linear-to-b from-primary/80 to-primary text-2xl font-bold text-primary-foreground">
            {(storeName.trim() || "م").charAt(0)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold">{logo ? tr("اللوجو جاهز") : tr("ضيف لوجو براندك")}</p>
          <p className="text-[13px] leading-[18px] text-muted-foreground">{tr("صورة مربعة بخلفية شفافة أحسن. لو مفيش، هنستخدم أول حرف من الاسم.")}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {logo && (
            <button type="button" onClick={() => setLogo(null)} aria-label={tr("شيل اللوجو")} className={cn(appleButton.more, "text-(--sys-red)")}>
              <Trash2 className="size-4" />
            </button>
          )}
          <label className={cn(appleButton.tinted, "cursor-pointer focus-within:ring-2 focus-within:ring-ring", uploading && "pointer-events-none opacity-60")}>
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4 text-primary" />}
            {uploading ? tr("بيترفع…") : logo ? tr("غيّر") : tr("ارفع")}
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} />
          </label>
        </div>
      </div>

      <div className="mt-8 mb-2 flex items-center justify-between gap-3 px-4">
        <h2 className="text-[13px] font-semibold text-muted-foreground">{tr("الثيم")}</h2>
      </div>
      <div role="radiogroup" aria-label={tr("الثيم")} className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {ids.map((id) => {
          const t = STORE_THEMES[id];
          const Preview = THEME_PREVIEWS[id];
          const active = theme === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setTheme(id)}
              className={cn(
                "apple-press group relative overflow-hidden rounded-[20px] bg-card p-2.5 text-start transition-shadow duration-200 ease-(--ease-apple) focus-visible:outline-none",
                active ? "ring-[2.5px] ring-primary" : "ring-1 ring-transparent hover:ring-foreground/10 focus-visible:ring-primary/50",
              )}
            >
              <div className="pointer-events-none relative overflow-hidden rounded-[13px] [&>div]:rounded-[13px] [&>div]:border-0">
                <Preview />
                {id === suggested && (
                  <span className="apple-glass absolute top-2 start-2 rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-(--sys-indigo)">
                    {tr("مقترح لنشاطك")}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 px-1.5 pt-2.5 pb-0.5">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold">{t.name}</p>
                  <p className="line-clamp-1 text-[12px] text-muted-foreground">{t.description}</p>
                </div>
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full transition-colors",
                    active ? "bg-primary text-primary-foreground" : "ring-[1.5px] ring-(--label-3) ring-inset",
                  )}
                >
                  {active && <Check className="size-3.5" strokeWidth={3} />}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        <SectionLabel>{tr("لغة المتجر")}</SectionLabel>
        <div className="apple-card flex items-center justify-between gap-3 px-4 py-3">
          <span className="text-[15px]">{tr("اللغة اللي عملاءك هيشوفوا بيها المتجر")}</span>
          <SegmentedButtons
            label={tr("لغة المتجر")}
            value={language}
            onChange={setLanguage}
            options={[
              ["ar", "العربية"],
              ["en", "English"],
            ]}
          />
        </div>
      </div>
    </>
  );
}

/* ── Contact ─────────────────────────────────────────────────────────────── */

type ContactKey = "whatsapp" | "instagram" | "facebook" | "tiktok";

function ContactStep({
  values,
  setters,
  whatsappError,
}: {
  values: Record<ContactKey, string>;
  setters: Record<ContactKey, (v: string) => void>;
  whatsappError: string | null;
}) {
  const rows: { key: ContactKey; label: string; placeholder: string; tile: string; Icon: (p: { className?: string }) => React.ReactNode; inputMode?: "tel" }[] = [
    { key: "instagram", label: tr("إنستجرام"), placeholder: "@yourstore", tile: "bg-linear-to-tr from-[#f58529] via-[#dd2a7b] to-[#8134af]", Icon: InstagramIcon },
    { key: "facebook", label: tr("فيسبوك"), placeholder: "facebook.com/yourstore", tile: "bg-[#1877f2]", Icon: FacebookIcon },
    { key: "tiktok", label: tr("تيك توك"), placeholder: "@yourstore", tile: "bg-[#111]", Icon: TikTokIcon },
  ];

  return (
    <>
      <StepTitle
        icon={MessageCircle}
        tone="bg-[#25d366]"
        title={tr("عملاءك هيوصلولك إزاي؟")}
        subtitle={tr("بيظهروا في متجرك. زرار الواتساب لوحده بيزوّد الطلبات، لأن العميل بيسأل قبل ما يشتري.")}
      />

      <SectionLabel>{tr("واتساب")}</SectionLabel>
      <div className="apple-card apple-form p-4">
        <div className="flex items-center gap-3">
          <IconTile className="bg-[#25d366]">
            <WhatsAppIcon className="size-[18px]" />
          </IconTile>
          <Input
            value={values.whatsapp}
            onChange={(e) => setters.whatsapp(e.target.value)}
            placeholder="01012345678"
            inputMode="tel"
            dir="ltr"
            aria-label={tr("رقم الواتساب")}
            aria-invalid={Boolean(whatsappError)}
            className="flex-1 text-start tabular-nums"
          />
        </div>
      </div>
      <Footnote>{whatsappError ?? tr("ده الرقم اللي هيستقبل رسايل العملاء، وكمان رسايل تأكيد الطلبات.")}</Footnote>

      <div className="mt-8">
        <SectionLabel>{tr("السوشيال ميديا")}</SectionLabel>
        <div className="apple-card apple-rows overflow-hidden [--row-inset:58px]">
          {rows.map(({ key, label, placeholder, tile, Icon }) => (
            <label key={key} className="flex min-h-14 items-center gap-3 px-4">
              <IconTile className={tile}>
                <Icon className="size-4" />
              </IconTile>
              <span className="w-20 shrink-0 text-[15px]">{label}</span>
              <input
                value={values[key]}
                onChange={(e) => setters[key](e.target.value)}
                placeholder={placeholder}
                dir="ltr"
                className="h-14 min-w-0 flex-1 bg-transparent text-end text-[15px] outline-none placeholder:text-(--label-3) rtl:text-start"
              />
            </label>
          ))}
        </div>
        <Footnote>{tr("اكتب اليوزر بس أو اللينك كامل — الاتنين شغالين. سيب الفاضي للي معندكش.")}</Footnote>
      </div>
    </>
  );
}

/* ── Checkout ────────────────────────────────────────────────────────────── */

function PaymentRow({
  logo,
  title,
  subtitle,
  on,
  setOn,
  children,
}: {
  logo: string;
  title: string;
  subtitle: string;
  on: boolean;
  setOn: (v: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="px-4 py-3">
      <label className="flex cursor-pointer items-center gap-3">
        <span className="grid size-[38px] shrink-0 place-items-center overflow-hidden rounded-[10px] bg-white p-1 ring-1 ring-black/5">
          <Image src={logo} alt="" width={30} height={30} className="size-full object-contain" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-medium">{title}</span>
          <span className="block text-[13px] text-muted-foreground">{subtitle}</span>
        </span>
        <Switch checked={on} onCheckedChange={setOn} aria-label={title} />
      </label>
      {on && children && <div className="mt-3 ps-[50px] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1">{children}</div>}
    </div>
  );
}

function CheckoutStep(p: {
  cod: boolean;
  setCod: (v: boolean) => void;
  vodafoneOn: boolean;
  setVodafoneOn: (v: boolean) => void;
  vodafone: string;
  setVodafone: (v: string) => void;
  instapayOn: boolean;
  setInstapayOn: (v: boolean) => void;
  instapay: string;
  setInstapay: (v: string) => void;
  shippingMode: "flat" | "free";
  setShippingMode: (v: "flat" | "free") => void;
  shippingPrice: string;
  setShippingPrice: (v: string) => void;
  errors: { vodafone: string | null | false; instapay: string | null | false; none: string | null; shipping: string | null };
}) {
  return (
    <>
      <StepTitle
        icon={CreditCard}
        tone="bg-(--sys-orange)"
        title={tr("الدفع والتوصيل")}
        subtitle={tr("إزاي عملاءك هيدفعوا، وبكام هتوصّل لهم. ده اللي هيظهر في صفحة الدفع.")}
      />

      <SectionLabel>{tr("طرق الدفع")}</SectionLabel>
      <div className="apple-card apple-form apple-rows overflow-hidden [--row-inset:66px]">
        <PaymentRow logo="/payment-logos/cash-on-delivery.svg" title={tr("كاش عند الاستلام")} subtitle={tr("الأكتر استخدامًا في مصر")} on={p.cod} setOn={p.setCod} />
        <PaymentRow logo="/payment-logos/vodafone-cash.svg" title={tr("فودافون كاش")} subtitle={tr("العميل يحوّل على محفظتك")} on={p.vodafoneOn} setOn={p.setVodafoneOn}>
          <Input
            value={p.vodafone}
            onChange={(e) => p.setVodafone(e.target.value)}
            placeholder="01012345678"
            inputMode="tel"
            dir="ltr"
            aria-label={tr("رقم محفظة فودافون كاش")}
            aria-invalid={Boolean(p.errors.vodafone && p.vodafone)}
            className="tabular-nums"
          />
          {p.errors.vodafone && p.vodafone && <p className="mt-1.5 text-[13px] text-(--sys-red)">{p.errors.vodafone}</p>}
        </PaymentRow>
        <PaymentRow logo="/payment-logos/instapay.svg" title="InstaPay" subtitle={tr("تحويل لحظي من أي بنك")} on={p.instapayOn} setOn={p.setInstapayOn}>
          <Input
            value={p.instapay}
            onChange={(e) => p.setInstapay(e.target.value)}
            placeholder="yourname@instapay"
            dir="ltr"
            aria-label={tr("عنوان InstaPay")}
          />
        </PaymentRow>
      </div>
      <Footnote>{p.errors.none ?? tr("الدفع بالكارت والمحافظ عن طريق Kashier تقدر تفعّله بعدين من صفحة طرق الدفع.")}</Footnote>

      <div className="mt-8">
        <SectionLabel>{tr("الشحن")}</SectionLabel>
        <div className="apple-card apple-form space-y-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-3">
              <IconTile className="bg-(--sys-teal)">
                <Truck className="size-4" />
              </IconTile>
              <span className="text-[15px] font-medium">{tr("سعر التوصيل")}</span>
            </span>
            <SegmentedButtons
              label={tr("نوع الشحن")}
              value={p.shippingMode}
              onChange={p.setShippingMode}
              options={[
                ["flat", tr("سعر ثابت")],
                ["free", tr("مجاني")],
              ]}
            />
          </div>
          {p.shippingMode === "flat" ? (
            <div className="relative motion-safe:animate-in motion-safe:fade-in">
              <Input
                type="number"
                min={0}
                max={100000}
                inputMode="numeric"
                value={p.shippingPrice}
                onChange={(e) => p.setShippingPrice(e.target.value)}
                aria-label={tr("سعر الشحن بالجنيه")}
                aria-invalid={Boolean(p.errors.shipping)}
                className="pe-14 text-[17px] font-semibold tabular-nums"
              />
              <span className="pointer-events-none absolute inset-y-0 end-4 flex items-center text-[15px] text-muted-foreground">{tr("ج.م")}</span>
            </div>
          ) : (
            <p className="rounded-[12px] bg-(--sys-green)/10 px-4 py-3 text-[15px] text-[#248a3d] dark:text-(--sys-green)">
              {tr("هيظهر للعميل «شحن مجاني» — ميزة بتشجّع على الشراء.")}
            </p>
          )}
        </div>
        <Footnote>{tr("عايز سعر مختلف لكل محافظة؟ تقدر تظبطه بعدين من صفحة الشحن.")}</Footnote>
      </div>
    </>
  );
}

/* ── Start ───────────────────────────────────────────────────────────────── */

function StartStep({ start, setStart, demo, businessType }: { start: Start; setStart: (s: Start) => void; demo: Props["demo"]; businessType: string }) {
  const options: { id: Start; icon: LucideIcon; tone: string; title: string; text: string }[] = [
    {
      id: "demo",
      icon: Sparkles,
      tone: "bg-(--sys-indigo)",
      title: tr("جرّب بمنتجات تجريبية"),
      text: businessType
        ? tr("منتجات وطلبات وعملاء شبه نشاطك ({0})، عشان تشوف كل حاجة شغالة قبل ما تضيف بتاعتك.", businessType)
        : tr("منتجات وطلبات وعملاء نموذجيين، عشان تشوف كل حاجة شغالة قبل ما تضيف بتاعتك."),
    },
    { id: "empty", icon: Package, tone: "bg-primary", title: tr("هضيف منتجاتي بنفسي"), text: tr("متجر فاضي، وأول حاجة هتعملها تضيف منتجك الأول.") },
    { id: "import", icon: Download, tone: "bg-[#5e8e3e]", title: tr("عندي متجر على Shopify"), text: tr("انقل منتجاتك وعملاءك وطلباتك في دقايق، من غير ما تعيد حاجة.") },
  ];

  return (
    <>
      <StepTitle icon={Store} tone="bg-primary" title={tr("نبدأ بإيه؟")} subtitle={tr("اختار إزاي تحب تبدأ. البيانات التجريبية تتمسح بضغطة واحدة لما تكون جاهز.")} />

      <div role="radiogroup" aria-label={tr("طريقة البداية")} className="space-y-3">
        {options.map(({ id, icon: Icon, tone, title, text }) => {
          const active = start === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setStart(id)}
              className={cn(
                "apple-press apple-card block w-full p-4 text-start transition-shadow duration-200 ease-(--ease-apple) focus-visible:outline-none",
                active ? "ring-[2.5px] ring-primary" : "ring-1 ring-transparent hover:ring-foreground/10 focus-visible:ring-primary/50",
              )}
            >
              <div className="flex items-start gap-3.5">
                <IconTile className={cn(tone, "size-10 rounded-[11px]")}>
                  <Icon className="size-5" />
                </IconTile>
                <div className="min-w-0 flex-1">
                  <p className="text-[17px] font-semibold">{title}</p>
                  <p className="mt-0.5 text-[15px] leading-6 text-muted-foreground">{text}</p>
                </div>
                <span
                  className={cn(
                    "mt-1 grid size-6 shrink-0 place-items-center rounded-full transition-colors",
                    active ? "bg-primary text-primary-foreground" : "ring-[1.5px] ring-(--label-3) ring-inset",
                  )}
                >
                  {active && <Check className="size-3.5" strokeWidth={3} />}
                </span>
              </div>

              {id === "demo" && (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-4 gap-2">
                    {demo.preview.map((p) => (
                      <div key={p.name} className="min-w-0 space-y-1">
                        {/* eslint-disable-next-line @next/next/no-img-element -- remote sample image */}
                        <img src={p.image.replace("w=800", "w=240")} alt="" className="aspect-square w-full rounded-[12px] bg-muted object-cover" />
                        <p className="truncate text-[11px] text-muted-foreground">{p.name}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      tr("{0} منتجات", nf.format(demo.products)),
                      tr("{0} طلبات", nf.format(demo.orders)),
                      tr("{0} عملاء", nf.format(demo.customers)),
                    ].map((t) => (
                      <span key={t} className="rounded-full bg-(--sys-indigo)/10 px-2.5 py-0.5 text-[12px] font-medium text-(--sys-indigo)">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ── Building (while the action runs) ────────────────────────────────────── */

function Building({ start }: { start: Start }) {
  const tasks = [
    tr("بنطبّق الثيم واللوجو"),
    tr("بنظبط الدفع والشحن"),
    start === "demo" ? tr("بنضيف المنتجات والطلبات التجريبية") : tr("بنجهّز صفحات متجرك"),
    tr("بنفتحلك لوحة التحكم"),
  ];
  const [done, setDone] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setDone((d) => Math.min(d + 1, tasks.length - 1)), 900);
    return () => window.clearInterval(id);
  }, [tasks.length]);

  return (
    <div className="flex flex-col items-center pt-16 text-center" role="status" aria-live="polite">
      <span className="relative grid size-20 place-items-center">
        <span className="absolute inset-0 rounded-full bg-primary/15 motion-safe:animate-ping" />
        <span className="relative grid size-20 place-items-center rounded-full bg-primary text-primary-foreground">
          <Rocket className="size-9" />
        </span>
      </span>
      <h1 className="mt-8 text-[28px] font-bold">{tr("بنجهّز متجرك…")}</h1>
      <ul className="mt-8 w-full max-w-xs space-y-3 text-start">
        {tasks.map((task, i) => (
          <li key={task} className={cn("flex items-center gap-3 text-[15px] transition-opacity duration-300", i > done && "opacity-40")}>
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full transition-colors duration-300",
                i < done ? "bg-(--sys-green) text-white" : "bg-(--fill-3)",
              )}
            >
              {i < done ? <Check className="size-3.5" strokeWidth={3} /> : i === done ? <Loader2 className="size-3.5 animate-spin" /> : null}
            </span>
            {task}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Done ────────────────────────────────────────────────────────────────── */

function Done({
  storeName,
  storeUrl,
  seeded,
  start,
  trialDaysLeft,
  onEnter,
}: {
  storeName: string;
  storeUrl: string;
  seeded: { products: number; orders: number } | null;
  start: Start;
  trialDaysLeft: number | null;
  onEnter: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const display = storeUrl.replace(/^https?:\/\//, "");

  function copy() {
    navigator.clipboard?.writeText(storeUrl).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  const shareText = encodeURIComponent(tr("افتتحنا متجرنا الأونلاين 🎉 اطلب من هنا: {0}", storeUrl));

  const nextSteps: [string, string][] =
    start === "import"
      ? [
          [tr("اربط Shopify وابدأ النقل"), tr("منتجاتك وعملاءك هيتنقلوا في الخلفية.")],
          [tr("راجع الأسعار والصور"), tr("بعد النقل، اتأكد إن كل حاجة مظبوطة.")],
        ]
      : start === "demo"
        ? [
            [tr("اتفرج على الطلبات التجريبية"), tr("جرّب تأكّد طلب أو تشحنه وشوف بيحصل إيه.")],
            [tr("أضف أول منتج حقيقي"), tr("وامسح التجريبي من الرئيسية لما تخلص.")],
          ]
        : [
            [tr("أضف أول منتج"), tr("صورة وسعر ووصف — ومتجرك يبقى جاهز يبيع.")],
            [tr("شارك لينك متجرك"), tr("على الواتساب والإنستجرام وفي البايو.")],
          ];
  if (trialDaysLeft !== null) nextSteps.push([tr("فعّل اشتراكك"), tr("قدامك {0} يوم تجربة مجانية بكل المميزات.", nf.format(trialDaysLeft))]);

  return (
    <div className="pt-6 text-center sm:pt-12">
      <span className="mx-auto grid size-20 place-items-center rounded-full bg-(--sys-green) text-white shadow-[0_12px_32px_-8px] shadow-(--sys-green)/60 motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:duration-500">
        <Check className="size-10" strokeWidth={3} />
      </span>
      <h1 className="mt-6 text-[34px] leading-[1.15] font-bold text-balance">{tr("{0} جاهز 🎉", storeName || tr("متجرك"))}</h1>
      <p className="mx-auto mt-2 max-w-sm text-[17px] leading-7 text-muted-foreground">
        {seeded?.products
          ? tr("ضفنا {0} منتجات و{1} طلبات تجريبية. متجرك شغال على اللينك ده:", nf.format(seeded.products), nf.format(seeded.orders))
          : tr("متجرك شغال على اللينك ده — شاركه مع أول عملائك.")}
      </p>

      <div className="apple-card mx-auto mt-6 flex max-w-md items-center gap-2 p-2 ps-4" dir="ltr">
        <span className="min-w-0 flex-1 truncate text-start text-[15px] font-semibold">{display}</span>
        <button type="button" onClick={copy} className={cn(appleButton.tinted, "shrink-0")} aria-label={tr("انسخ اللينك")}>
          {copied ? <Check className="size-4 text-(--sys-green)" /> : <Copy className="size-4" />}
          {copied ? tr("اتنسخ") : tr("انسخ")}
        </button>
      </div>
      <div className="mx-auto mt-3 grid max-w-md grid-cols-2 gap-2">
        <a href={storeUrl} target="_blank" rel="noreferrer" className={cn(appleButton.gray, "w-full")}>
          <ArrowUpRight className="size-4" />
          {tr("افتح متجرك")}
        </a>
        <a href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noreferrer" className={cn(appleButton.gray, "w-full text-[#1da851]")}>
          <WhatsAppIcon className="size-4" />
          {tr("شارك")}
        </a>
      </div>

      <div className="mx-auto mt-10 max-w-md text-start">
        <SectionLabel>{tr("الخطوة الجاية")}</SectionLabel>
        <ol className="apple-card apple-rows overflow-hidden [--row-inset:56px]">
          {nextSteps.map(([title, text], i) => (
            <li key={title} className="flex items-start gap-3 px-4 py-3">
              <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-[13px] font-bold text-primary tabular-nums">
                {nf.format(i + 1)}
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold">{title}</p>
                <p className="text-[13px] leading-[18px] text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <button
        type="button"
        onClick={() => {
          setLeaving(true);
          onEnter();
        }}
        disabled={leaving}
        className={cn(appleButton.filled, "mx-auto mt-8 h-[52px] w-full max-w-md text-[17px]")}
      >
        {leaving && <Loader2 className="size-5 animate-spin" />}
        {start === "import" ? tr("ابدأ النقل من Shopify") : tr("ادخل لوحة التحكم")}
        {!leaving && <ChevronLeft className="size-5 ltr:-scale-x-100" />}
      </button>
    </div>
  );
}
