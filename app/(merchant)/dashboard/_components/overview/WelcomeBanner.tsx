import Link from "next/link";
import { ArrowLeft, Quote, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney, formatNumber } from "./format";
import { tr } from "@/lib/i18n/dashboard";

type Props = {
  greeting: string;
  storeName: string;
  quote: string;
  today: { revenue: number; orders: number; visits: number };
  /** Set for merchants in their first days — swaps today's numbers for an onboarding call offer. */
  onboarding: { href: string; external: boolean } | null;
};

export default function WelcomeBanner({ greeting, storeName, quote, today, onboarding }: Props) {
  return (
    <section
      aria-label={tr("رسالة ترحيب")}
      className="grid gap-6 rounded-xl bg-primary p-6 text-primary-foreground sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center"
    >
      <div className="min-w-0 space-y-4">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {tr("{0}،", greeting)}{" "}<span className="font-bold">{storeName}</span>
        </h2>

        <figure className="flex max-w-2xl items-start gap-3">
          <Quote className="mt-1 size-5 shrink-0 -scale-x-100 text-primary-foreground/60" aria-hidden />
          <div>
            <figcaption className="text-xs font-medium text-primary-foreground/70">{tr("جملة النهارده")}</figcaption>
            <blockquote className="mt-1 text-base font-medium leading-8 sm:text-lg">{quote}</blockquote>
          </div>
        </figure>
      </div>

      {onboarding ? (
        <div className="rounded-lg bg-primary-foreground/10 p-5 lg:w-80">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Video className="size-4" />
            {tr("أول مرة معانا؟")}
          </div>
          <p className="mt-2 text-sm leading-6 text-primary-foreground/85">
            {tr("احجز مكالمة زووم مجانية مع فريق كاشو — هنشرحلك المنصة خطوة بخطوة ونجهّز متجرك سوا.")}
          </p>
          <Button
            asChild
            className="mt-4 h-10 w-full gap-1.5 bg-primary-foreground font-semibold text-primary hover:bg-primary-foreground/90"
          >
            <Link
              href={onboarding.href}
              {...(onboarding.external ? { target: "_blank", rel: "noreferrer" } : {})}
            >
              {tr("احجز ميعادك")}
              <ArrowLeft className="size-4 ltr:-scale-x-100" />
            </Link>
          </Button>
        </div>
      ) : (
        <dl className="grid grid-cols-3 divide-x divide-primary-foreground/15 rounded-lg bg-primary-foreground/10 py-4 rtl:divide-x-reverse lg:w-96">
          {[
            { label: tr("إيرادات النهارده"), value: formatMoney(today.revenue) },
            { label: tr("طلبات النهارده"), value: formatNumber(today.orders) },
            { label: tr("زيارات النهارده"), value: formatNumber(today.visits) },
          ].map((stat) => (
            <div key={stat.label} className="px-4 text-center">
              <dt className="text-xs text-primary-foreground/70">{stat.label}</dt>
              <dd className="mt-1 text-lg font-bold tabular-nums">{stat.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
