"use client";

import Link from "next/link";
import { useId, useState } from "react";

import { cn } from "@/lib/utils";
import { Arrow, btn, num, Wrap } from "../ui";

// General sports-nutrition ranges for a healthy adult, grams of protein per
// kilo of body weight per day.
const GOALS = [
  { id: "cut", label: "تنشيف", min: 1.8, max: 2.4 },
  { id: "keep", label: "ثبات", min: 1.4, max: 1.8 },
  { id: "bulk", label: "تضخيم", min: 1.6, max: 2.2 },
] as const;

const MIN = 40;
const MAX = 150;

/** "How much protein do I need?": weight + goal → a daily range. A small real
 *  tool the shopper can use, ending on the store's protein shelf when it has one. */
export default function Calculator({ shopHref, shopLabel }: { shopHref: string; shopLabel: string }) {
  const id = useId();
  const [weight, setWeight] = useState(80);
  const [goal, setGoal] = useState<(typeof GOALS)[number]["id"]>("bulk");
  const g = GOALS.find((x) => x.id === goal)!;
  const pct = ((weight - MIN) / (MAX - MIN)) * 100;

  return (
    <Wrap className="gy-section">
      <section aria-labelledby={`${id}-t`} className="gy-calc gy-reveal">
        <div className="gy-knurl p-5 sm:p-8">
          <p className="gy-eyebrow mb-2">احسبها صح</p>
          <h2 id={`${id}-t`} className="gy-h2 text-balance">
            جسمك محتاج كام جرام بروتين؟
          </h2>

          <div className="mt-6">
            <label htmlFor={`${id}-w`} className="flex items-baseline justify-between text-sm font-extrabold text-(--gy-ink)">
              وزنك
              <span className="gy-num text-2xl font-black">{num(weight)} كجم</span>
            </label>
            <input id={`${id}-w`} type="range" min={MIN} max={MAX} value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="gy-range mt-1" style={{ ["--p" as string]: `${pct}%` }} />
          </div>

          <fieldset className="mt-3">
            <legend className="mb-2 text-sm font-extrabold text-(--gy-ink)">هدفك</legend>
            <div role="radiogroup" aria-label="هدفك" className="grid grid-cols-3 gap-2">
              {GOALS.map((x) => (
                <button key={x.id} type="button" role="radio" aria-checked={goal === x.id} onClick={() => setGoal(x.id)} className="gy-opt">
                  {x.label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <div className={cn("gy-calc-result flex flex-col justify-between gap-6 p-5 sm:p-8")}>
          <div aria-live="polite">
            <p className="text-sm font-extrabold opacity-90">بروتين في اليوم</p>
            <p className="gy-num mt-1 text-[clamp(3rem,8vw,6rem)] leading-none font-black">
              {num(Math.round(weight * g.min))}–{num(Math.round(weight * g.max))}
              <span className="ms-2 text-xl font-extrabold">جم</span>
            </p>
            <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-current/25 pt-4">
              <div>
                <dt className="text-sm opacity-90">كرياتين</dt>
                <dd className="gy-num text-2xl font-black">{num(3)}–{num(5)} جم</dd>
              </div>
              <div>
                <dt className="text-sm opacity-90">مية</dt>
                <dd className="gy-num text-2xl font-black">{new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 1 }).format(weight * 0.035)} لتر</dd>
              </div>
            </dl>
          </div>
          <div>
            <Link href={shopHref} className={btn({ variant: "white", size: "lg" })}>
              {shopLabel}
              <Arrow />
            </Link>
            <p className="mt-3 text-xs leading-5 opacity-85">أرقام تقديرية عامة لشخص سليم، مش بديل لاستشارة دكتور أو أخصائي تغذية.</p>
          </div>
        </div>
      </section>
    </Wrap>
  );
}
