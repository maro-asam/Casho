import Link from "next/link";
import { AlertTriangle, Check, ChevronLeft, Info, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { lazyIntl, tr } from "@/lib/i18n/dashboard";

export type SeoCheck = {
  id: string;
  label: string;
  detail: string;
  /** critical blocks search entirely; warn costs ranking; tip is a nice-to-have. */
  severity: "critical" | "warn" | "tip";
  done: boolean;
  weight: number;
  href?: string;
};

const nf = lazyIntl.number();

/** Store-wide SEO audit: one score + the concrete fixes, worst first. */
export function SeoHealth({ checks }: { checks: SeoCheck[] }) {
  const total = checks.reduce((s, c) => s + c.weight, 0);
  const blocked = checks.some((c) => c.severity === "critical" && !c.done);
  const score = blocked ? 0 : Math.round((checks.filter((c) => c.done).reduce((s, c) => s + c.weight, 0) / total) * 100);
  const issues = checks
    .filter((c) => !c.done)
    .sort((a, b) => ({ critical: 0, warn: 1, tip: 2 })[a.severity] - ({ critical: 0, warn: 1, tip: 2 })[b.severity] || b.weight - a.weight);
  const passed = checks.filter((c) => c.done);
  const r = 52;
  const circ = 2 * Math.PI * r;
  const tone = blocked || score < 50 ? "red" : score >= 80 ? "green" : "orange";
  const ring = { red: "stroke-(--sys-red)", orange: "stroke-(--sys-orange)", green: "stroke-(--sys-green)" }[tone];
  const headline = blocked ? tr("متجرك مخفي عن جوجل") : score >= 80 ? tr("ممتاز — جاهز للبحث") : score >= 50 ? tr("كويس، وفي حاجات تفرق") : tr("محتاج شغل");

  return (
    <section aria-labelledby="seo-health" className="apple-card overflow-hidden">
      <div className="grid lg:grid-cols-[20rem_minmax(0,1fr)]">
        {/* Score */}
        <div className="flex items-center gap-5 p-6 lg:flex-col lg:items-start lg:justify-center lg:gap-4 lg:p-8">
          <div className="relative size-28 shrink-0 lg:size-32">
            <svg viewBox="0 0 120 120" className="size-full -rotate-90">
              <circle cx="60" cy="60" r={r} fill="none" strokeWidth="12" className="stroke-(--fill-3)" />
              <circle
                cx="60"
                cy="60"
                r={r}
                fill="none"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - Math.max(score, 1) / 100)}
                className={cn(ring, "transition-[stroke-dashoffset] duration-700 ease-(--ease-apple)")}
              />
            </svg>
            <span className="absolute inset-0 grid place-content-center text-center">
              <span className="text-[34px] leading-none font-bold tabular-nums">{nf.format(score)}</span>
              <span className="text-[12px] text-muted-foreground">/ {nf.format(100)}</span>
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-[13px] font-semibold text-muted-foreground">{tr("صحة الـ SEO")}</p>
            <h2 id="seo-health" className="text-[22px] leading-[28px] font-bold">
              {headline}
            </h2>
            <p className="text-[15px] text-muted-foreground">{tr("{0} من {1} تمام", nf.format(passed.length), nf.format(checks.length))}</p>
          </div>
        </div>

        {/* Fixes, worst first */}
        <div className="border-t-[0.5px] border-border lg:border-t-0 lg:border-s-[0.5px]">
          {issues.length > 0 ? (
            <ul className="apple-rows [--row-inset:60px]">
              {issues.map((c) => {
                const Icon = c.severity === "critical" ? AlertTriangle : c.severity === "warn" ? Info : Lightbulb;
                const body = (
                  <>
                    <span
                      className={cn(
                        "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-white",
                        c.severity === "critical" ? "bg-(--sys-red)" : c.severity === "warn" ? "bg-(--sys-orange)" : "bg-primary",
                      )}
                    >
                      <Icon className="size-3.5" strokeWidth={2.6} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-medium">{c.label}</span>
                      <span className="block text-[13px] leading-[18px] text-muted-foreground">{c.detail}</span>
                    </span>
                    {c.href && <ChevronLeft className="mt-1 size-[18px] shrink-0 text-(--label-3) ltr:-scale-x-100" strokeWidth={2.4} />}
                  </>
                );
                return (
                  <li key={c.id}>
                    {c.href ? (
                      <Link href={c.href} className="flex gap-3 px-5 py-3 transition-colors hover:bg-(--fill-3)/50">
                        {body}
                      </Link>
                    ) : (
                      <div className="flex gap-3 px-5 py-3">{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex h-full items-center gap-3 p-6 text-[15px] text-muted-foreground">
              <span className="grid size-7 place-items-center rounded-full bg-(--sys-green) text-white">
                <Check className="size-4" strokeWidth={3} />
              </span>
              {tr("مفيش أي مشاكل — كمّل ضيف منتجات بأوصاف كويسة.")}
            </div>
          )}

          {passed.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t-[0.5px] border-border px-5 py-3.5">
              {passed.map((c) => (
                <span key={c.id} className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
                  <Check className="size-3.5 text-(--sys-green)" strokeWidth={3} />
                  {c.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
