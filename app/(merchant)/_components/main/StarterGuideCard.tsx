"use client";

import { useRef, useState, useSyncExternalStore, useTransition, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AtSign,
  Check,
  ChevronLeft,
  Copy,
  CreditCard,
  Globe,
  ImageIcon,
  Images,
  Loader2,
  MessageCircle,
  Package,
  ShoppingBag,
  Sparkles,
  Tag,
  Truck,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { ClearDemoDataAction } from "@/actions/onboarding/onboarding.actions";
import { SaveSetupLogoAction, SaveSetupWhatsappAction } from "@/actions/onboarding/setup-guide.actions";
import { appleButton } from "@/components/saas-page";
import { uploadImageToCloudinary } from "@/lib/cloudinary-upload";
import { compressImage, ONE_MB } from "@/lib/image-compress";
import { lazyIntl, tr, trv } from "@/lib/i18n/dashboard";
import type { SetupStep, SetupStepId } from "@/lib/store-setup/checklist";
import { cn } from "@/lib/utils";

/** Serializable form of SubscriptionSetup (dates as ISO strings). */
export type GuideSubscription = { state: "paid" } | { state: "trial"; endsAt: string; covered: boolean } | { state: "inactive" };

type Props = {
  steps: SetupStep[];
  subscription: GuideSubscription;
  logo: string | null;
  storeUrl: string;
  /** Shown instead of the guide once it's dismissed or everything is done (e.g. the sample-data banner). */
  fallback?: ReactNode;
};

// v2: the checklist was rebuilt (logo, WhatsApp, sample data…) — show it again to those who hid the old one.
const STORAGE_KEY = "casho-setup-guide-hidden-v2";
const HIDE_EVENT = "casho-setup-guide-hidden";

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

const trialEndFormat = lazyIntl.date({ weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Cairo" });
const nf = lazyIntl.number();

type Copy = { title: string; description: string; icon: LucideIcon; href?: string; cta?: string };

function stepCopy(id: SetupStepId, subscription: GuideSubscription): Copy {
  switch (id) {
    case "logo":
      return {
        title: tr("ارفع لوجو متجرك"),
        description: tr("بيظهر فوق متجرك وأول حاجة العميل بيشوفها — بيبني الثقة من أول نظرة."),
        icon: ImageIcon,
        href: "/builder?panel=identity",
      };
    case "whatsapp":
      return {
        title: tr("رقم واتساب للعملاء"),
        description: tr("العملاء بيسألوا ويأكدوا طلباتهم عليه، وبيظهر في متجرك."),
        icon: MessageCircle,
        href: "/settings#contact",
      };
    case "products":
      return {
        title: tr("أضف منتجاتك"),
        description: tr("منتج واحد على الأقل بصورة وسعر. المنتجات التجريبية مش محسوبة."),
        icon: Package,
        href: "/products/new",
        cta: tr("أضف منتج"),
      };
    case "demo":
      return {
        title: tr("امسح المنتجات التجريبية"),
        description: tr("ظاهرة لعملاءك على المتجر دلوقتي. منتجاتك وطلباتك الحقيقية مش هتتأثر."),
        icon: Sparkles,
      };
    case "payment":
      return {
        title: tr("جهّز طرق الدفع"),
        description: tr("كاش عند الاستلام، فودافون كاش، InstaPay، تحويل بنكي أو دفع بالكارت."),
        icon: CreditCard,
        href: "/payment-methods",
        cta: tr("طرق الدفع"),
      };
    case "shipping":
      return {
        title: tr("حدّد الشحن"),
        description: tr("سعر ثابت، سعر لكل محافظة أو شحن مجاني — عشان إجمالي الطلب يطلع مظبوط."),
        icon: Truck,
        href: "/shipping",
        cta: tr("الشحن"),
      };
    case "subscription":
      return {
        title: tr("فعّل اشتراكك"),
        description:
          subscription.state === "trial"
            ? subscription.covered
              ? tr("رصيدك هيدفع أول شهر لما التجربة تخلص.")
              : tr("التجربة المجانية بتخلص {0} — اشحن رصيد يغطي الباقة عشان المتجر ميقفلش.", trialEndFormat.format(new Date(subscription.endsAt)))
            : subscription.state === "inactive"
              ? tr("متجرك مقفول للعملاء لحد ما تشحن رصيد وتفعّل باقة.")
              : tr("اشتراكك شغال."),
        icon: Wallet,
        href: "/balance",
        cta: tr("اشحن رصيد"),
      };
    case "categories":
      return {
        title: tr("قسّم منتجاتك لتصنيفات"),
        description: tr("العملاء بيلاقوا اللي عايزينه أسرع."),
        icon: Tag,
        href: "/categories",
        cta: tr("التصنيفات"),
      };
    case "banner":
      return {
        title: tr("أضف بانر للرئيسية"),
        description: tr("اعرض عروضك ومنتجاتك المميزة أول ما العميل يدخل."),
        icon: Images,
        href: "/banners/new",
        cta: tr("أضف بانر"),
      };
    case "social":
      return {
        title: tr("روابط السوشيال"),
        description: tr("إنستجرام وفيسبوك وتيك توك في فوتر متجرك."),
        icon: AtSign,
        href: "/settings#contact",
        cta: tr("أضف الروابط"),
      };
    case "domain":
      return {
        title: tr("اربط دومين باسمك"),
        description: tr("زي yourstore.com بدل رابط كاشو."),
        icon: Globe,
        href: "/domain",
        cta: tr("الدومين"),
      };
    case "firstOrder":
      return {
        title: tr("شارك متجرك وجيب أول طلب"),
        description: tr("ابعت رابط متجرك لعملاءك وحطّه في البايو."),
        icon: ShoppingBag,
      };
  }
}

/** "جهّز متجرك للبيع": essentials before the first sale, then optional boosts. */
export default function StarterGuideBar({ steps, subscription, logo, storeUrl, fallback = null }: Props) {
  // null on the server: decide after hydration, so neither a dismissed guide nor the fallback flashes.
  const hidden = useSyncExternalStore<boolean | null>(subscribe, readHidden, () => null);

  const essentials = steps.filter((s) => s.group === "essential");
  const boosts = steps.filter((s) => s.group === "boost");
  const essentialsDone = essentials.filter((s) => s.done).length;
  const ready = essentialsDone === essentials.length;
  const next = essentials.find((s) => !s.done) ?? boosts.find((s) => !s.done) ?? null;

  if (hidden === null) return null;
  if (hidden || !next) return <>{fallback}</>;

  function hide() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Storage blocked — still hide for this session.
    }
    window.dispatchEvent(new Event(HIDE_EVENT));
  }

  const row = (step: SetupStep) => (
    <GuideRow key={step.id} step={step} isNext={step.id === next.id} subscription={subscription} logo={logo} storeUrl={storeUrl} />
  );
  const boostsDone = boosts.filter((s) => s.done).length;

  return (
    <section aria-labelledby="setup-guide-title" className="apple-card overflow-hidden">
      <header className="flex items-center gap-4 p-5 pb-3">
        <ProgressRing done={ready ? boostsDone : essentialsDone} total={ready ? boosts.length : essentials.length} ready={ready} />
        <div className="min-w-0 flex-1">
          <h2 id="setup-guide-title" className="text-[17px] leading-[22px] font-semibold">
            {ready ? tr("متجرك جاهز يبيع 🎉") : tr("جهّز متجرك للبيع")}
          </h2>
          <p className="text-[13px] leading-[18px] text-muted-foreground">
            {ready
              ? tr("الأساسيات كلها خلصت. الخطوات دي اختيارية بس بتزوّد مبيعاتك.")
              : tr("خلصت {0} من {1} خطوات أساسية — بعدها متجرك يبقى جاهز يستقبل طلبات.", nf.format(essentialsDone), nf.format(essentials.length))}
          </p>
        </div>
        <button
          type="button"
          onClick={hide}
          aria-label={tr("إخفاء دليل الإعداد")}
          className="grid size-8 shrink-0 place-items-center self-start rounded-full bg-muted text-muted-foreground hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" />
        </button>
      </header>

      {ready ? (
        <ol className="space-y-1 px-2 pb-2">{boosts.map(row)}</ol>
      ) : (
        <>
          <ol className="space-y-1 px-2 pb-2">{essentials.map(row)}</ol>
          <details className="group border-t-[0.5px] border-border">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3.5 text-[15px] hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
              <span>
                {tr("خطوات تقوّي متجرك")}
                <span className="ms-2 text-[13px] text-muted-foreground tabular-nums">{tr("{0} من {1}", nf.format(boostsDone), nf.format(boosts.length))}</span>
              </span>
              <ChevronLeft className="size-4 text-muted-foreground transition-transform group-open:-rotate-90 ltr:-scale-x-100" />
            </summary>
            <ol className="space-y-1 px-2 pb-2">{boosts.map(row)}</ol>
          </details>
        </>
      )}
    </section>
  );
}

function ProgressRing({ done, total, ready }: { done: number; total: number; ready: boolean }) {
  const r = 19;
  const c = 2 * Math.PI * r;
  const ratio = total ? done / total : 1;
  return (
    <div
      role="progressbar"
      aria-valuenow={done}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={tr("نسبة جاهزية المتجر")}
      className="relative grid size-12 shrink-0 place-items-center"
    >
      <svg viewBox="0 0 44 44" className="absolute inset-0 size-full -rotate-90" aria-hidden>
        <circle cx="22" cy="22" r={r} fill="none" strokeWidth="4" className="stroke-muted" />
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - ratio)}
          className={cn("transition-[stroke-dashoffset] duration-700", ready ? "stroke-(--sys-green)" : "stroke-primary")}
        />
      </svg>
      <span className="text-[13px] font-semibold tabular-nums">
        {nf.format(done)}/{nf.format(total)}
      </span>
    </div>
  );
}

function GuideRow({
  step,
  isNext,
  subscription,
  logo,
  storeUrl,
}: {
  step: SetupStep;
  isNext: boolean;
  subscription: GuideSubscription;
  logo: string | null;
  storeUrl: string;
}) {
  const copy = stepCopy(step.id, subscription);
  const Icon = copy.icon;

  return (
    <li className={cn("flex flex-col gap-3 rounded-[14px] p-3 sm:flex-row sm:items-center", isNext && "bg-primary/[0.06]")}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span
          className={cn(
            "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full",
            step.done ? "bg-(--sys-green) text-white" : isNext ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          {step.done ? <Check className="size-4" strokeWidth={3} /> : <Icon className="size-3.5" />}
          <span className="sr-only">{step.done ? tr("تم") : tr("لسه")}</span>
        </span>
        <div className="min-w-0">
          <p className={cn("text-[15px] leading-5", step.done ? "text-muted-foreground" : "font-semibold")}>{copy.title}</p>
          {!step.done && <p className="mt-0.5 text-[13px] leading-[18px] text-muted-foreground">{copy.description}</p>}
        </div>
      </div>

      {step.done ? (
        step.id === "logo" && logo ? (
          <Image src={logo} alt="" width={36} height={36} className="ms-10 size-9 shrink-0 rounded-[8px] bg-muted object-contain sm:ms-0" />
        ) : null
      ) : (
        <div className="ms-10 shrink-0 sm:ms-0">
          <StepAction id={step.id} copy={copy} primary={isNext} storeUrl={storeUrl} />
        </div>
      )}
    </li>
  );
}

const actionClass = (primary: boolean) =>
  primary ? cn(appleButton.filled, "h-9 px-4 text-[14px]") : cn(appleButton.tinted, "text-[14px] text-primary");

function StepAction({ id, copy, primary, storeUrl }: { id: SetupStepId; copy: Copy; primary: boolean; storeUrl: string }) {
  switch (id) {
    case "logo":
      return <LogoAction primary={primary} />;
    case "whatsapp":
      return <WhatsappAction primary={primary} />;
    case "demo":
      return <ClearDemoAction primary={primary} />;
    case "firstOrder":
      return <CopyLinkAction primary={primary} url={storeUrl} />;
    default:
      return copy.href ? (
        <Link href={copy.href} className={actionClass(primary)}>
          {copy.cta}
          <ChevronLeft className="size-4 ltr:-scale-x-100" />
        </Link>
      ) : null;
  }
}

/** Runs a server action from the guide: toast + refresh so the step ticks. */
function useStepAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (call: () => Promise<{ success: boolean; message: string }>, onFail?: () => void) =>
    start(async () => {
      try {
        const res = await call();
        if (!res.success) {
          toast.error(trv(res.message));
          onFail?.();
          return;
        }
        toast.success(trv(res.message));
        router.refresh();
      } catch {
        toast.error(tr("حصلت مشكلة — جرّب تاني"));
        onFail?.();
      }
    });
  return { run, pending };
}

function LogoAction({ primary }: { primary: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { run, pending } = useStepAction();
  const busy = uploading || pending;

  async function onFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const small = await compressImage(file, { maxBytes: ONE_MB, maxSide: 1024, format: "image/webp" });
      const url = await uploadImageToCloudinary(small, "casho/uploads/logos", 1);
      run(() => SaveSetupLogoAction(url));
    } catch (err) {
      toast.error(err instanceof Error ? trv(err.message) : tr("فشل رفع اللوجو"));
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" tabIndex={-1} onChange={(e) => onFile(e.target.files?.[0])} />
      <button type="button" disabled={busy} onClick={() => input.current?.click()} className={actionClass(primary)}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <ImageIcon className="size-4" />}
        {busy ? tr("بيترفع…") : tr("ارفع اللوجو")}
      </button>
    </>
  );
}

function WhatsappAction({ primary }: { primary: boolean }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const { run, pending } = useStepAction();

  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)} className={actionClass(primary)}>
        <MessageCircle className="size-4" />
        {tr("أضف الرقم")}
      </button>
    );
  }
  return (
    <form
      className="flex w-full items-center gap-2 sm:w-72"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => SaveSetupWhatsappAction(value));
      }}
    >
      <input
        autoFocus
        dir="ltr"
        inputMode="tel"
        autoComplete="tel"
        aria-label={tr("رقم واتساب للعملاء")}
        placeholder="01012345678"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-9 min-w-0 flex-1 rounded-full bg-(--fill-3) px-3.5 text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      />
      <button type="submit" disabled={pending || !value.trim()} className={cn(appleButton.filled, "h-9 px-4 text-[14px]")}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {tr("حفظ")}
      </button>
      <button type="button" onClick={() => setEditing(false)} aria-label={tr("إلغاء")} className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
        <X className="size-4" />
      </button>
    </form>
  );
}

function ClearDemoAction({ primary }: { primary: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const { run, pending } = useStepAction();

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className={actionClass(primary)}>
        <Sparkles className="size-4" />
        {tr("امسحها")}
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => setConfirming(false)} disabled={pending} className={appleButton.tinted}>
        {tr("إلغاء")}
      </button>
      <button type="button" onClick={() => run(ClearDemoDataAction, () => setConfirming(false))} disabled={pending} className={appleButton.destructiveFilled}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {tr("امسح التجريبي")}
      </button>
    </div>
  );
}

function CopyLinkAction({ primary, url }: { primary: boolean; url: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(tr("اتنسخ رابط متجرك"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(tr("مقدرناش ننسخ — انسخه من شريط المتصفح"));
    }
  }
  return (
    <button type="button" onClick={copy} className={actionClass(primary)}>
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? tr("اتنسخ") : tr("انسخ رابط المتجر")}
    </button>
  );
}
