import Link from "next/link";
import { ChevronLeft, Video } from "lucide-react";
import DeltaBadge from "./DeltaBadge";
import { formatMoney, formatNumber, percentChange } from "./format";
import { tr } from "@/lib/i18n/dashboard";

type DayTotals = { revenue: number; orders: number; visits: number };

type Props = {
  greeting: string;
  storeName: string;
  quote: string;
  today: DayTotals;
  yesterday: DayTotals;
  /** Set for merchants in their first days — swaps today's numbers for an onboarding call offer. */
  onboarding: { href: string; external: boolean } | null;
};

/** Change vs yesterday; two empty days read as "flat" rather than "new". */
function dayDelta(today: number, yesterday: number) {
  if (today === 0 && yesterday === 0) return 0;
  return percentChange(today, yesterday);
}

export default function WelcomeBanner({ greeting, storeName, quote, today, yesterday, onboarding }: Props) {
  const stats = [
    { label: tr("إيرادات النهارده"), value: formatMoney(today.revenue), delta: dayDelta(today.revenue, yesterday.revenue) },
    { label: tr("طلبات النهارده"), value: formatNumber(today.orders), delta: dayDelta(today.orders, yesterday.orders) },
    { label: tr("زيارات النهارده"), value: formatNumber(today.visits), delta: dayDelta(today.visits, yesterday.visits) },
  ];

  return (
    <section
      aria-label={tr("رسالة ترحيب")}
      className="apple-card relative isolate flex flex-col gap-5 overflow-hidden px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8"
    >
      {/* Ambient brand glow behind the greeting — depth from light, not borders. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -start-20 -z-10 size-72 rounded-full bg-primary/10 blur-3xl dark:bg-primary/15"
      />

      <div className="min-w-0">
        <h2 className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-[15px] font-semibold text-muted-foreground">{tr("{0}،", greeting)}</span>
          <span
            // pb + generous leading keep Arabic descenders inside the clipped gradient.
            className="apple-gradient-text min-w-0 truncate pb-1 text-[26px] leading-[1.3] font-bold ltr:tracking-[-0.02em]"
          >
            {storeName}
          </span>
        </h2>
        <p className="mt-0.5 line-clamp-2 max-w-xl text-[14px] leading-6 text-muted-foreground lg:line-clamp-1">
          <span className="sr-only">{tr("جملة النهارده")}: </span>
          {quote}
        </p>
      </div>

      {onboarding ? (
        <div className="flex shrink-0 items-center gap-3 rounded-2xl bg-background p-2 ps-3">
          <span className="grid size-[29px] shrink-0 place-items-center rounded-[7px] bg-(--sys-indigo) text-white">
            <Video className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold">{tr("أول مرة معانا؟")}</p>
            <p className="text-[12px] text-muted-foreground">{tr("احجز مكالمة زووم مجانية مع فريق كاشو")}</p>
          </div>
          <Link
            href={onboarding.href}
            {...(onboarding.external ? { target: "_blank", rel: "noreferrer" } : {})}
            className="apple-press flex h-9 shrink-0 items-center gap-0.5 rounded-full bg-primary/10 px-4 text-[14px] font-semibold text-primary hover:bg-primary/15"
          >
            {tr("احجز ميعادك")}
            <ChevronLeft className="size-4 ltr:-scale-x-100" />
          </Link>
        </div>
      ) : (
        <dl className="grid shrink-0 grid-cols-3 rounded-2xl bg-background py-3 lg:min-w-[27rem]">
          {stats.map((stat, i) => (
            <div key={stat.label} className={i > 0 ? "min-w-0 border-s border-border px-4" : "min-w-0 px-4"}>
              <dt className="truncate text-[12px] text-muted-foreground">{stat.label}</dt>
              <dd className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <span className="truncate text-[19px] leading-6 font-bold tabular-nums">{stat.value}</span>
                <DeltaBadge value={stat.delta} className="px-1.5 text-[11px]" />
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
