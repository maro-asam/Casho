"use client";

import Link from "next/link";
import { useId, useState, type CSSProperties } from "react";
import { Check, ChevronDown, Minus } from "lucide-react";
import { TierGlyph } from "@/components/plans/tier-glyph";
import { cn } from "@/lib/utils";
import { useLang } from "../../_i18n/LanguageContext";
import { featureNameLabel, planNameLabel } from "../pricing-labels";
import type { WelcomePlan, WelcomePlanFeature } from "../Pricing";
import { useLandingCopy } from "./copy";
import { FeatureIcon } from "./feature-icons";
import { PlanCheckoutButton } from "./PlanCheckout";
import Reveal from "./Reveal";
import SectionHead from "./SectionHead";

type Cycle = "MONTHLY" | "YEARLY";
type Lang = "ar" | "en";
type PricingCopy = ReturnType<typeof useLandingCopy>["pricing"];

const HIGHLIGHTED_PLAN = "GOLD";
const MAX_SPECS = 4;

function formatPiasters(value: number) {
  return (value / 100).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function yearlySavingsPercent(plan: WelcomePlan) {
  const fullYear = plan.monthlyPrice * 12;
  if (fullYear <= 0 || plan.yearlyPrice >= fullYear) return 0;
  return Math.round((1 - plan.yearlyPrice / fullYear) * 100);
}

/** On/off features (custom domain, SEO…) — whatever their limit fields say. */
function isOnOff(f: WelcomePlanFeature) {
  return f.type === "BOOLEAN" || (f.limitValue === null && !f.isUnlimited);
}

/** What a limit reads as: "3 كود", "Unlimited" — or null for an on/off feature. */
function limitText(f: WelcomePlanFeature, c: PricingCopy, lang: Lang, withUnit = true) {
  if (isOnOff(f)) return null;
  if (f.isUnlimited) return c.unlimited;
  if (f.limitValue === null) return null;
  const n = f.limitValue.toLocaleString("en-US");
  // Units are Arabic-only in the DB.
  return withUnit && lang === "ar" && f.unit ? `${n} ${f.unit}` : n;
}

const find = (plan: WelcomePlan, key: string) => plan.features.find((f) => f.key === key);

/**
 * Everything the cards and the comparison need, from the live plans (never
 * hardcoded): every feature in admin order, and the numeric limits that differ
 * between plans — those become each card's headline specs.
 */
function planStructure(plans: WelcomePlan[]) {
  const byKey = new Map<string, WelcomePlanFeature>();
  for (const plan of plans) for (const f of plan.features) if (!byKey.has(f.key)) byKey.set(f.key, f);
  const rows = [...byKey.values()].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const specKeys = rows
    .filter((f) => !isOnOff(f))
    .filter((f) => {
      const values = plans.map((p) => {
        const pf = find(p, f.key);
        return pf ? (pf.isUnlimited ? "∞" : String(pf.limitValue)) : "–";
      });
      return new Set(values).size > 1;
    })
    .slice(0, MAX_SPECS)
    .map((f) => f.key);

  return { rows, specKeys };
}

/**
 * A plan lists only what's new against the plan before it ("Everything in
 * Starter, plus"), unless it doesn't include everything that plan has.
 */
function planList(plans: WelcomePlan[], index: number, specKeys: string[]) {
  const own = plans[index].features.filter((f) => !specKeys.includes(f.key));
  const prev = plans[index - 1];
  if (!prev) return { base: null, items: own };
  const prevKeys = prev.features.filter((f) => !specKeys.includes(f.key)).map((f) => f.key);
  const ownKeys = new Set(own.map((f) => f.key));
  if (!prevKeys.every((k) => ownKeys.has(k))) return { base: null, items: own };
  return { base: prev, items: own.filter((f) => !prevKeys.includes(f.key)) };
}

export default function ApplePricing({
  plans,
  checkoutEnabled = false,
}: {
  plans: WelcomePlan[];
  /** TEMP: cards pay straight on Paymob instead of going to /register (lib/payments/plan-checkout.ts). */
  checkoutEnabled?: boolean;
}) {
  const c = useLandingCopy().pricing;
  const [cycle, setCycle] = useState<Cycle>("MONTHLY");

  if (plans.length === 0) return null;
  const maxSavings = Math.max(...plans.map(yearlySavingsPercent));
  const { rows, specKeys } = planStructure(plans);

  return (
    <section id="pricing" aria-labelledby="pricing-title" className="al-section al-section-surface scroll-mt-16">
      <SectionHead id="pricing-title" eyebrow={c.eyebrow} title={c.title} accent={c.accent} subtitle={c.subtitle}>
        <div role="radiogroup" aria-label={c.eyebrow} className="mt-9 inline-flex rounded-full bg-black/[0.06] p-1 dark:bg-white/10">
          {(["MONTHLY", "YEARLY"] as const).map((value) => {
            const active = cycle === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setCycle(value)}
                className={cn(
                  "inline-flex min-h-9 items-center gap-2 rounded-full px-5 text-[15px] transition-[background-color,color,box-shadow] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--al-tint)",
                  active
                    ? "bg-(--al-card) font-semibold text-(--al-text) shadow-[0_3px_8px_rgba(0,0,0,0.12),0_1px_1px_rgba(0,0,0,0.04)]"
                    : "font-medium text-(--al-muted) hover:text-(--al-text)",
                )}
              >
                {value === "MONTHLY" ? c.monthly : c.yearly}
                {value === "YEARLY" && maxSavings > 0 ? (
                  <span className="text-[12px] font-semibold text-(--al-new)">
                    {c.save} {maxSavings}%
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </SectionHead>

      <div className="al-container-wide al-body">
        {/* The plans side by side (roomy: 3 across from 1080px), Enterprise
            as a wide card under them. */}
        <div className="plans" style={{ "--plans-n": Math.min(plans.length, 4) } as CSSProperties}>
          {plans.map((plan, i) => (
            <Reveal key={plan.id} delay={i * 70} className="h-full">
              <PlanCard
                plan={plan}
                cycle={cycle}
                checkoutEnabled={checkoutEnabled}
                specKeys={specKeys}
                list={planList(plans, i, specKeys)}
              />
            </Reveal>
          ))}
          <Reveal delay={plans.length * 70} className="plans-wide">
            <EnterpriseCard />
          </Reveal>
        </div>

        <Compare plans={plans} rows={rows} cycle={cycle} />

        <p className="mt-12 text-center text-[13px] text-(--al-faint)">{checkoutEnabled ? c.footnotePay : c.footnote}</p>
      </div>
    </section>
  );
}

/** One included feature, Apple One style: an app-icon glyph, the name, a detail line. */
function FeatureRow({ feature, detail }: { feature: WelcomePlanFeature; detail: string | null }) {
  const { lang } = useLang();
  return (
    <li className="plan-row">
      <FeatureIcon featureKey={feature.key} />
      <span className="min-w-0">
        <span className="plan-row-name">{featureNameLabel(feature.key, feature.name, lang)}</span>
        {detail ? <span className="plan-row-detail">{detail}</span> : null}
      </span>
    </li>
  );
}

function PlanCard({
  plan,
  cycle,
  checkoutEnabled,
  specKeys,
  list,
}: {
  plan: WelcomePlan;
  cycle: Cycle;
  checkoutEnabled: boolean;
  specKeys: string[];
  list: ReturnType<typeof planList>;
}) {
  const c = useLandingCopy().pricing;
  const { lang } = useLang();
  const highlighted = plan.key === HIGHLIGHTED_PLAN;
  const yearly = cycle === "YEARLY";
  const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
  const original = yearly ? null : plan.originalMonthlyPrice;
  const hasDiscount = original !== null && original > price;
  const name = planNameLabel(plan.key, plan.name, lang);
  const tagline = c.taglines[plan.key];
  const titleId = `plan-${plan.key.toLowerCase()}`;

  // "Up to 3" / "Unlimited" for a limit; nothing for an on/off feature.
  const detail = (f: WelcomePlanFeature) => {
    if (isOnOff(f)) return null;
    if (f.isUnlimited) return c.unlimited;
    return f.limitValue === null ? null : c.upTo.replace("{n}", f.limitValue.toLocaleString("en-US"));
  };
  const specs = specKeys.map((key) => find(plan, key)).filter((f): f is WelcomePlanFeature => Boolean(f));

  return (
    <article className="plan" aria-labelledby={titleId} data-highlight={highlighted || undefined}>
      {highlighted ? <span className="plan-flag">{c.popular}</span> : null}

      <div className="plan-head">
        <TierGlyph tier={plan.key} className="plan-tier size-[52px] rounded-[14px] [&_svg]:size-[26px]" />
        <h3 id={titleId} className="plan-name">
          {name}
        </h3>
        {tagline ? <p className="plan-tagline">{tagline}</p> : null}

        <p className="plan-price">
          <span className="plan-amount">{formatPiasters(price)}</span>
          <span className="plan-per">
            {c.currency} {yearly ? c.perYear : c.perMonth}
          </span>
        </p>
        <p className="plan-sub">
          {yearly ? (
            c.perMonthEquivalent.replace("{amount}", formatPiasters(Math.round(price / 12)))
          ) : hasDiscount && original !== null ? (
            <>
              <span className="tabular-nums">{c.was.replace("{amount}", formatPiasters(original))}</span>
              {plan.discountPercent ? (
                <span className="font-semibold text-(--al-new)">
                  {" · "}
                  {c.save} {plan.discountPercent}%
                </span>
              ) : null}
            </>
          ) : (
            c.billedMonthly
          )}
        </p>

        {checkoutEnabled && price > 0 ? (
          <PlanCheckoutButton
            planId={plan.id}
            planName={name}
            cycle={cycle}
            priceLabel={formatPiasters(price)}
            className={cn("al-btn plan-cta", highlighted ? "al-btn-filled" : "al-btn-gray")}
          />
        ) : (
          <Link href="/register" className={cn("al-btn plan-cta", highlighted ? "al-btn-filled" : "al-btn-gray")}>
            {c.cta}
          </Link>
        )}
      </div>

      <div className="plan-body">
        <ul className="plan-rows">
          {specs.map((f) => (
            <FeatureRow key={f.key} feature={f} detail={detail(f)} />
          ))}
          {list.base ? null : list.items.map((f) => <FeatureRow key={f.key} feature={f} detail={detail(f)} />)}
        </ul>
        {list.base ? (
          <>
            <p className="plan-plus">{c.plus.replace("{plan}", planNameLabel(list.base.key, list.base.name, lang))}</p>
            <ul className="plan-rows">
              {list.items.map((f) => (
                <FeatureRow key={f.key} feature={f} detail={detail(f)} />
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </article>
  );
}

/**
 * Enterprise isn't a plan yet (no DB row, nothing to buy): a frosted-glass card
 * with its name, a "soon" badge and one action — telling us you're
 * interested. No promised features.
 */
function EnterpriseCard() {
  const e = useLandingCopy().pricing.enterprise;
  return (
    <article className="plan-soon" aria-labelledby="plan-enterprise">
      <div className="plan-frost" aria-hidden>
        <i />
        <i />
        <i />
      </div>

      <div className="soon-id">
        <TierGlyph tier="ENTERPRISE" className="size-[52px] rounded-[14px] [&_svg]:size-[26px]" />
        <div>
          <div className="soon-name">
            <h3 id="plan-enterprise" className="plan-name">
              {e.name}
            </h3>
            <span className="soon-badge">{e.soon}</span>
          </div>
          <p className="plan-tagline">{e.tagline}</p>
        </div>
      </div>

      <p className="soon-body">{e.body}</p>

      <div className="soon-action">
        <p className="soon-price">
          {e.price} <span>· {e.priceNote}</span>
        </p>
        <Link href="/contact-us" className="al-btn al-btn-glass">
          {e.cta}
        </Link>
      </div>
    </article>
  );
}

/** Apple's "Compare all models": every feature, every plan, one table. */
function Compare({ plans, rows, cycle }: { plans: WelcomePlan[]; rows: WelcomePlanFeature[]; cycle: Cycle }) {
  const c = useLandingCopy().pricing;
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const yearly = cycle === "YEARLY";

  return (
    <div className="mt-14 text-center">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="al-link min-h-11 font-medium"
      >
        {open ? c.compareHide : c.compare}
        <ChevronDown className={cn("size-4 transition-transform duration-300", open && "rotate-180")} strokeWidth={2} />
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="pc mx-auto mt-8 max-w-[1024px] text-start"
        style={{ "--pc-n": plans.length } as CSSProperties}
      >
        <div role="table" aria-label={c.compareLabel}>
          <div role="rowgroup" className="pc-head">
            <div role="row" className="pc-row">
              <span role="columnheader" className="pc-name max-md:sr-only">
                {c.feature}
              </span>
              {plans.map((plan) => (
                <span key={plan.id} role="columnheader" className="pc-cell">
                  <span className="block text-[17px] font-bold">{planNameLabel(plan.key, plan.name, lang)}</span>
                  <span className="block text-[13px] text-(--al-muted) tabular-nums">
                    {formatPiasters(yearly ? plan.yearlyPrice : plan.monthlyPrice)} {c.currency} {yearly ? c.perYear : c.perMonth}
                  </span>
                </span>
              ))}
            </div>
          </div>
          <div role="rowgroup">
            {rows.map((row) => (
              <div key={row.key} role="row" className="pc-row">
                <span role="rowheader" className="pc-name">
                  {featureNameLabel(row.key, row.name, lang)}
                </span>
                {plans.map((plan) => (
                  <span key={plan.id} role="cell" className="pc-cell">
                    <CompareCell feature={find(plan, row.key)} />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CompareCell({ feature }: { feature?: WelcomePlanFeature }) {
  const c = useLandingCopy().pricing;
  const { lang } = useLang();
  if (!feature) {
    return (
      <>
        <Minus className="size-4 text-(--al-faint)" strokeWidth={2} aria-hidden />
        <span className="sr-only">{c.no}</span>
      </>
    );
  }
  const value = limitText(feature, c, lang);
  if (value) return <span className="tabular-nums">{value}</span>;
  return (
    <>
      <Check className="size-[18px]" strokeWidth={2.4} aria-hidden />
      <span className="sr-only">{c.yes}</span>
    </>
  );
}
