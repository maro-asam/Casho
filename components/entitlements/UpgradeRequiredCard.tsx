import Link from "next/link";
import { cache } from "react";
import { Check, Lock, type LucideIcon } from "lucide-react";
import { appleButton } from "@/components/saas-page/apple-kit";
import { TierGlyph } from "@/components/plans/tier-glyph";
import { formatMoney } from "@/lib/balance-ui/meta";
import { prisma } from "@/lib/prisma";
import { tr } from "@/lib/i18n/dashboard";
import { cn } from "@/lib/utils";

const PLAN_DISPLAY_NAMES: Record<string, string> = {
  // Plan names are English in both languages (Starter / Growth / Scale);
  // the old slugs stay mapped for links made before the rename.
  starter: "Starter",
  growth: "Growth",
  scale: "Scale",
  silver: "Starter",
  gold: "Growth",
  platinum: "Scale",
};

const getPlanForUpsell = cache(async (slug: string) => {
  try {
    return await prisma.plan.findUnique({
      where: { slug },
      select: { key: true, monthlyPrice: true, isActive: true },
    });
  } catch {
    return null;
  }
});

/**
 * "Locked on your plan" panel for a plan-gated feature (server component).
 * Works inline under a page header and centered on a full-screen surface.
 * Team members can't change the plan, so pass `canUpgrade={false}` for them.
 */
export async function UpgradeRequiredCard({
  title,
  description,
  requiredPlanSlug,
  icon: Icon = Lock,
  highlights,
  canUpgrade = true,
  className,
}: {
  title: string;
  description?: string;
  requiredPlanSlug: string | null;
  /** The feature's own glyph; a lock badge is added on top. */
  icon?: LucideIcon;
  /** Up to ~4 short lines of what the feature unlocks. */
  highlights?: string[];
  canUpgrade?: boolean;
  className?: string;
}) {
  const planLabel = requiredPlanSlug ? PLAN_DISPLAY_NAMES[requiredPlanSlug] ?? requiredPlanSlug : null;
  const plan = requiredPlanSlug ? await getPlanForUpsell(requiredPlanSlug) : null;
  const showPrice = !!plan?.isActive && plan.monthlyPrice > 0;
  const upgradeHref = requiredPlanSlug ? `/change-plan?plan=${requiredPlanSlug}` : "/change-plan";

  return (
    <section
      aria-labelledby="upgrade-required-title"
      className={cn("apple-card relative mx-auto w-full max-w-[560px] overflow-hidden text-center", className)}
    >
      {/* Soft brand glow behind the glyph. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(55%_100%_at_50%_0%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent)]"
      />

      <div className="relative px-6 pt-10 pb-8 sm:px-10">
        <div className="relative mx-auto size-[76px]">
          <span className="grid size-full place-items-center rounded-[22px] bg-card text-primary shadow-[0_14px_34px_-10px_color-mix(in_oklab,var(--primary)_45%,transparent),0_0_0_0.5px_rgba(0,0,0,0.08)]">
            <Icon className="size-8" strokeWidth={1.7} />
          </span>
          <span className="absolute -end-2 -bottom-2 grid size-8 place-items-center rounded-full bg-foreground text-background ring-4 ring-card">
            <Lock className="size-3.5" strokeWidth={2.4} />
          </span>
        </div>

        {planLabel ? (
          <p className="mt-7 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[13px] font-semibold text-primary">
            {tr("متاحة من باقة {0} وما فوق", planLabel)}
          </p>
        ) : (
          <p className="mt-7 inline-flex items-center rounded-full bg-muted px-3 py-1 text-[13px] font-semibold text-muted-foreground">
            {tr("مش ضمن باقتك الحالية")}
          </p>
        )}

        <h2 id="upgrade-required-title" className="mt-3 text-[26px] leading-[32px] font-bold text-balance ltr:tracking-[-0.02em]">
          {title}
        </h2>
        <p className="mx-auto mt-2 max-w-[40ch] text-[15px] leading-[22px] text-pretty text-muted-foreground">
          {description ?? tr("هذه الميزة غير متاحة في باقتك الحالية.")}
        </p>

        {highlights && highlights.length > 0 && (
          <ul className="mx-auto mt-7 grid max-w-[420px] gap-3 text-start">
            {highlights.map((line) => (
              <li key={line} className="flex items-start gap-3 text-[15px] leading-[21px]">
                <span className="mt-px grid size-5 shrink-0 place-items-center rounded-full bg-(--sys-green) text-white">
                  <Check className="size-3" strokeWidth={3} />
                </span>
                {line}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="relative border-t-[0.5px] border-border px-6 py-5 sm:px-10">
        {canUpgrade ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {planLabel ? (
              <div className="flex items-center gap-3 text-start">
                <TierGlyph tier={plan?.key} size="md" />
                <div className="min-w-0">
                  <p className="text-[15px] leading-5 font-semibold">
                    {tr("باقة {0}", planLabel)}
                  </p>
                  <p className="text-[13px] leading-[18px] whitespace-nowrap text-muted-foreground">
                    {showPrice ? (
                      <>
                        <span className="tabular-nums">{formatMoney(plan!.monthlyPrice)}</span> / {tr("شهر")}
                      </>
                    ) : (
                      tr("بتتخصم من رصيدك")
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <Link href="/change-plan" className={cn(appleButton.plain, "self-center")}>
                {tr("قارن الباقات")}
              </Link>
            )}
            <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center">
              {planLabel && (
                <Link href="/change-plan" className={cn(appleButton.plain, "mx-0 justify-center")}>
                  {tr("قارن الباقات")}
                </Link>
              )}
              <Link href={upgradeHref} className={cn(appleButton.filled, "justify-center px-6")}>
                {planLabel ? tr("الترقية لـ {0}", planLabel) : tr("ترقية الباقة")}
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-[15px] leading-[21px] text-muted-foreground">
            {tr("صاحب المتجر بس هو اللي يقدر يرقّي الباقة — كلّمه عشان يفعّل الميزة دي.")}
          </p>
        )}
      </div>
    </section>
  );
}
