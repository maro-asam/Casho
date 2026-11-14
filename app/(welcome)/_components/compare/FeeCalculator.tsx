"use client";

import { useId, useState, type CSSProperties } from "react";
import Reveal from "../apple/Reveal";
import SectionHead from "../apple/SectionHead";
import { useCompareCopy } from "./copy";
import {
  DEFAULT_SALES_STEP,
  MONTHLY_SALES_STEPS,
  SHOPIFY_THIRD_PARTY_FEES,
  formatRate,
  shopifyFee,
  type ShopifyPlanKey,
} from "./fees";

// Latin digits with grouping, like every number on the landing.
const nf = new Intl.NumberFormat("en-US");

/**
 * What Shopify's third-party fee costs an Egyptian store a month, next to
 * Casho's zero. One slider (monthly online sales), one plan choice.
 */
export default function FeeCalculator() {
  const c = useCompareCopy().fee;
  const id = useId();
  const [step, setStep] = useState(DEFAULT_SALES_STEP);
  const [planKey, setPlanKey] = useState<ShopifyPlanKey>("basic");

  const sales = MONTHLY_SALES_STEPS[step];
  const plan = SHOPIFY_THIRD_PARTY_FEES.find((p) => p.key === planKey) ?? SHOPIFY_THIRD_PARTY_FEES[0];
  const monthly = shopifyFee(sales, plan.bp);
  const money = (amount: number) => c.money.replace("{amount}", nf.format(amount));
  const fill = (step / (MONTHLY_SALES_STEPS.length - 1)) * 100;

  return (
    <section id="fees" aria-labelledby="fees-title" className="al-section al-section-surface scroll-mt-16">
      <SectionHead id="fees-title" eyebrow={c.eyebrow} title={c.title} accent={c.accent} subtitle={c.subtitle} />

      <div className="al-container al-body">
        <Reveal className="al-tile cmp-calc mx-auto max-w-[880px] p-6 sm:p-8 md:p-12">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
            <label htmlFor={`${id}-sales`} className="text-[17px] font-semibold text-(--al-muted)">
              {c.salesLabel}
            </label>
            <output htmlFor={`${id}-sales`} className="text-[34px] font-bold leading-none tabular-nums md:text-[44px]">
              {money(sales)}
            </output>
          </div>
          <input
            id={`${id}-sales`}
            type="range"
            min={0}
            max={MONTHLY_SALES_STEPS.length - 1}
            step={1}
            value={step}
            onChange={(e) => setStep(Number(e.target.value))}
            aria-valuetext={money(sales)}
            className="cmp-range mt-7"
            style={{ "--p": `${fill}%` } as CSSProperties}
          />

          <div role="group" aria-labelledby={`${id}-plan`} className="mt-8 flex flex-wrap items-center gap-2.5">
            <span id={`${id}-plan`} className="me-1.5 text-[15px] text-(--al-muted)">
              {c.planLabel}
            </span>
            {SHOPIFY_THIRD_PARTY_FEES.map((p) => (
              <button
                key={p.key}
                type="button"
                aria-pressed={p.key === planKey}
                onClick={() => setPlanKey(p.key)}
                className="al-chip"
              >
                <span dir="ltr">
                  {p.name} · {formatRate(p.bp)}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="cmp-result p-6 md:p-8">
              <p className="text-[15px] font-semibold text-(--al-muted)">{c.shopifyTakes}</p>
              <p className="mt-2 text-[44px] font-bold leading-tight tabular-nums md:text-[52px]" aria-live="polite">
                {money(monthly)}
              </p>
              <p className="mt-1 text-[15px] text-(--al-muted) tabular-nums">
                {c.perMonth.replace("{amount}", money(monthly * 12))}
              </p>
            </div>
            <div className="cmp-result p-6 md:p-8">
              <p className="text-[15px] font-semibold text-(--al-muted)">{c.cashoTakes}</p>
              <p className="mt-2 text-[44px] font-bold leading-tight tabular-nums text-(--al-tint) md:text-[52px]">
                {money(0)}
              </p>
              <p className="mt-1 text-[15px] text-(--al-muted)">{c.cashoNote}</p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <p className="mx-auto mt-6 max-w-[720px] text-center text-[13px] leading-relaxed text-(--al-muted)">{c.note}</p>
        </Reveal>
      </div>
    </section>
  );
}
