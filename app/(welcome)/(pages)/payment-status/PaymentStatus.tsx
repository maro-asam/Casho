"use client";

import Link from "next/link";
import { CircleAlert, CircleCheck, CircleX, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "../../_i18n/LanguageContext";
import { planNameLabel } from "../../_components/pricing-labels";

export type PaymentStatusValue = "success" | "pending" | "failed" | "invalid";

type Action = { label: string; href: string };
type Content = { title: string; body: string; primary: Action; secondary: Action };

const copy: Record<"ar" | "en", (plan: string) => Record<PaymentStatusValue, Content>> = {
  ar: (plan) => ({
    success: {
      title: "تم الدفع بنجاح",
      body: `استلمنا اشتراكك${plan ? ` في باقة ${plan}` : ""}. هنكلّمك على رقمك خلال ٢٤ ساعة عشان نفعّل باقتك. لو لسه معملتش حساب، سجّل بنفس الإيميل اللي دفعت بيه.`,
      primary: { label: "أنشئ متجرك", href: "/register" },
      secondary: { label: "الرئيسية", href: "/" },
    },
    pending: {
      title: "الدفع قيد التأكيد",
      body: "عملية الدفع لسه بتتأكد من Paymob. أول ما تتأكد هنتواصل معاك على رقمك.",
      primary: { label: "الرئيسية", href: "/" },
      secondary: { label: "كلّمنا", href: "/contact-us" },
    },
    failed: {
      title: "الدفع ماتمش",
      body: "العملية اتلغت أو اترفضت. تقدر تجرّب تاني بكارت أو محفظة تانية.",
      primary: { label: "جرّب تاني", href: "/#pricing" },
      secondary: { label: "كلّمنا", href: "/contact-us" },
    },
    invalid: {
      title: "مقدرناش نتأكد من الدفع",
      body: "لو المبلغ اتخصم من حسابك، كلّمنا وهنراجع العملية فورًا.",
      primary: { label: "كلّمنا", href: "/contact-us" },
      secondary: { label: "الرئيسية", href: "/" },
    },
  }),
  en: (plan) => ({
    success: {
      title: "Payment successful",
      body: `We've received your${plan ? ` ${plan}` : ""} subscription. We'll call you within 24 hours to activate your plan. If you don't have an account yet, sign up with the email you paid with.`,
      primary: { label: "Create your store", href: "/register" },
      secondary: { label: "Home", href: "/" },
    },
    pending: {
      title: "Payment being confirmed",
      body: "Paymob is still confirming your payment. We'll contact you as soon as it's through.",
      primary: { label: "Home", href: "/" },
      secondary: { label: "Contact us", href: "/contact-us" },
    },
    failed: {
      title: "Payment didn't go through",
      body: "The payment was cancelled or declined. You can try again with another card or wallet.",
      primary: { label: "Try again", href: "/#pricing" },
      secondary: { label: "Contact us", href: "/contact-us" },
    },
    invalid: {
      title: "We couldn't confirm the payment",
      body: "If you were charged, contact us and we'll check the payment right away.",
      primary: { label: "Contact us", href: "/contact-us" },
      secondary: { label: "Home", href: "/" },
    },
  }),
};

const ICON = {
  success: { Icon: CircleCheck, tone: "text-[#1a8a3e] dark:text-[#30d158]" },
  pending: { Icon: Clock, tone: "text-[#b64400] dark:text-[#ff9f45]" },
  failed: { Icon: CircleX, tone: "text-[#d70015] dark:text-[#ff6961]" },
  invalid: { Icon: CircleAlert, tone: "text-[#6e6e73] dark:text-[#a1a1a6]" },
} as const;

export default function PaymentStatus({ status, planKey }: { status: PaymentStatusValue; planKey: string | null }) {
  const { lang } = useLang();
  const plan = planKey ? planNameLabel(planKey, "", lang) : "";
  const content = copy[lang](plan)[status];
  const { Icon, tone } = ICON[status];

  return (
    <div className="al flex min-h-[60vh] items-center justify-center py-16">
      <div className="w-full max-w-[520px] text-center">
        <Icon className={cn("mx-auto size-14", tone)} strokeWidth={1.6} aria-hidden />
        <h1 className="mt-6 text-[32px] font-bold leading-tight md:text-[40px]">{content.title}</h1>
        <p className="mx-auto mt-4 max-w-[440px] text-pretty text-[17px] leading-relaxed text-(--al-muted)">
          {content.body}
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={content.primary.href} className="al-btn al-btn-filled w-full sm:w-auto">
            {content.primary.label}
          </Link>
          <Link href={content.secondary.href} className="al-btn al-btn-gray w-full sm:w-auto">
            {content.secondary.label}
          </Link>
        </div>
      </div>
    </div>
  );
}
