"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { checkStoreSlugAvailability, type StoreSlugAvailabilityState } from "@/actions/auth/check-store-slug.actions";
import { cn } from "@/lib/utils";
import { useLang } from "../../_i18n/LanguageContext";
import { useLandingCopy } from "./copy";
import "./hero-claim.css";

/**
 * The headline is the drawing: "grow" has a chart climbing beside it, and the brand line carries the Casho mark. Under it, the call to action is a bar where the visitor types their
 * store's name, sees whether the address is free, and carries it to sign-up
 * (`/register?store=…`).
 *
 * No images: the headline is the largest paint, and its entrance is CSS that
 * starts before hydration.
 */

const BARS = [18, 27, 36, 50, 64, 81, 100];
const ROOT = "casho.store";

type Check = { state: "idle" } | { state: "checking" } | { state: "done"; result: StoreSlugAvailabilityState };

export default function HeroClaim() {
  const c = useLandingCopy().claim;
  const { lang } = useLang();
  const router = useRouter();
  const Chevron = lang === "ar" ? ChevronLeft : ChevronRight;
  const delay = (s: number) => ({ "--hc-d": `${s}s` }) as CSSProperties;

  const [name, setName] = useState("");
  const [check, setCheck] = useState<Check>({ state: "idle" });
  const [example, setExample] = useState(0);
  const request = useRef(0);
  const timer = useRef<number | undefined>(undefined);

  // Example names take turns in the empty field.
  useEffect(() => {
    if (name) return;
    const id = window.setInterval(() => setExample((i) => (i + 1) % c.examples.length), 2600);
    return () => window.clearInterval(id);
  }, [name, c.examples.length]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function onChange(value: string) {
    setName(value);
    window.clearTimeout(timer.current);
    const id = ++request.current;
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setCheck({ state: "idle" });
      return;
    }
    setCheck({ state: "checking" });
    timer.current = window.setTimeout(async () => {
      try {
        const result = await checkStoreSlugAvailability(trimmed);
        if (request.current === id) setCheck({ state: "done", result });
      } catch {
        if (request.current === id) setCheck({ state: "idle" });
      }
    }, 450);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    router.push(trimmed ? `/register?store=${encodeURIComponent(trimmed)}` : "/register");
  }

  const result = check.state === "done" ? check.result : null;

  return (
    <section aria-labelledby="hero-title" className="hc relative isolate overflow-hidden bg-(--al-bg)">
      <div aria-hidden className="hc-aurora">
        <i />
        <i />
        <i />
      </div>

      <div className="al-container-wide hc-inner">
        <p className="hc-in inline-flex items-center gap-2 text-[13px] text-(--al-muted)" style={delay(0)}>
          <span className="font-semibold text-(--al-new)">{c.badgeNew}</span>
          <span aria-hidden className="h-3 w-px bg-(--al-hair)" />
          {c.badge}
        </p>

        <h1 id="hero-title" className="hc-title text-(--al-text)">
          {c.title.map((line, i) => (
            <span key={line.a} className="hc-line hc-rise" style={{ animationDelay: `${0.05 + i * 0.09}s` }}>
              <span className={cn(i === 2 && "al-gradient-text hc-brand")}>{line.a}</span>
              {/* A plain space keeps the words apart for screen readers and copy-paste. */}{" "}
              {i === 0 ? null : i === 1 ? (
                <span aria-hidden className="hc-obj hc-chart">
                  {BARS.map((h, k) => (
                    <span key={h} style={{ height: `${h}%`, animationDelay: `${0.7 + k * 0.07}s` }} />
                  ))}
                </span>
              ) : (
                <span aria-hidden className="hc-obj hc-mark">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 17l6-6 4 4 8-8" />
                    <path d="M15 7h6v6" />
                  </svg>
                </span>
              )}
              <span className={cn(i === 2 && "al-gradient-text hc-brand")}>{line.b}</span>
            </span>
          ))}
        </h1>

        <p className="hc-in hc-sub text-(--al-muted) text-balance" style={delay(0.34)}>
          {c.subtitle}
        </p>

        <form className="hc-in hc-claim" style={delay(0.42)} onSubmit={onSubmit}>
          <label className="hc-field" dir="ltr">
            <span className="sr-only">{c.label}</span>
            <span className="hc-input-wrap">
              {/* Sizes the field to its text, so ".casho.store" follows the name. */}
              <span aria-hidden className="hc-ghost">
                {name}
              </span>
              <input
                className="hc-input"
                value={name}
                onChange={(e) => onChange(e.target.value)}
                maxLength={40}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                enterKeyHint="go"
                aria-describedby="hc-status"
              />
              {name ? null : (
                <span key={example} aria-hidden className="hc-example">
                  {c.examples[example]}
                </span>
              )}
            </span>
            <span aria-hidden className="hc-root">
              .{ROOT}
            </span>
          </label>
          <button type="submit" className="hc-submit">
            {c.cta}
          </button>
        </form>

        <p id="hc-status" role="status" className="hc-in hc-status" style={delay(0.5)}>
          {check.state === "checking" ? (
            <span className="text-(--al-muted)">{c.checking}</span>
          ) : result?.suggestedSlug ? (
            <span className={cn("hc-result", result.available && "is-free")}>
              <span className="hc-result-dot" />
              {result.available ? c.available : c.taken}
              <bdi dir="ltr" className="hc-address">
                {result.suggestedSlug}.{ROOT}
              </bdi>
            </span>
          ) : result ? (
            <span className="text-(--al-muted)">{c.invalid}</span>
          ) : (
            <span className="text-(--al-faint)">{c.note}</span>
          )}
          <Link href="#pricing" className="al-link hc-pricing">
            {c.secondary}
            <Chevron className="size-3.5" strokeWidth={2} />
          </Link>
        </p>

        <ul className="hc-in hc-facts" style={delay(0.6)}>
          {c.facts.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
