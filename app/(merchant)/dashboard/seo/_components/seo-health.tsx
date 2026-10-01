import Link from "next/link";
import { AlertTriangle, ArrowLeft, Check, CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

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

const nf = new Intl.NumberFormat("ar-EG");

/** Store-wide SEO audit: one score + the concrete fixes, worst first. */
export function SeoHealth({ checks }: { checks: SeoCheck[] }) {
  const total = checks.reduce((s, c) => s + c.weight, 0);
  const blocked = checks.some((c) => c.severity === "critical" && !c.done);
  const score = blocked ? 0 : Math.round((checks.filter((c) => c.done).reduce((s, c) => s + c.weight, 0) / total) * 100);
  const issues = checks
    .filter((c) => !c.done)
    .sort((a, b) => ({ critical: 0, warn: 1, tip: 2 })[a.severity] - ({ critical: 0, warn: 1, tip: 2 })[b.severity] || b.weight - a.weight);
  const passed = checks.filter((c) => c.done);
  const r = 30;
  const circ = 2 * Math.PI * r;

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex items-center gap-4 border-b border-border p-4">
        <div className="relative size-[4.5rem] shrink-0">
          <svg viewBox="0 0 72 72" className="size-full -rotate-90">
            <circle cx="36" cy="36" r={r} className="fill-none stroke-muted" strokeWidth="6" />
            <circle
              cx="36"
              cy="36"
              r={r}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - score / 100)}
              className={cn("fill-none", score >= 80 ? "stroke-emerald-500" : score >= 50 ? "stroke-amber-500" : "stroke-rose-500")}
            />
          </svg>
          <span className="absolute inset-0 grid place-items-center text-base font-bold tabular-nums">{nf.format(score)}</span>
        </div>
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">صحة الـ SEO</p>
          <p className="font-semibold">
            {blocked ? "متجرك مخفي عن جوجل" : score >= 80 ? "ممتاز — جاهز للبحث" : score >= 50 ? "كويس، وفي حاجات تفرق" : "محتاج شغل"}
          </p>
          <p className="text-xs text-muted-foreground">
            {nf.format(passed.length)} من {nf.format(checks.length)} تمام
          </p>
        </div>
      </div>

      {issues.length > 0 ? (
        <ul className="divide-y divide-border">
          {issues.map((c) => {
            const Icon = c.severity === "critical" ? AlertTriangle : CircleAlert;
            const body = (
              <>
                <Icon
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    c.severity === "critical" ? "text-rose-600" : c.severity === "warn" ? "text-amber-600" : "text-muted-foreground",
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{c.label}</span>
                  <span className="block text-xs leading-5 text-muted-foreground">{c.detail}</span>
                </span>
                {c.href && <ArrowLeft className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />}
              </>
            );
            return (
              <li key={c.id}>
                {c.href ? (
                  <Link href={c.href} className="group flex gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
                    {body}
                  </Link>
                ) : (
                  <div className="flex gap-3 px-4 py-3">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="p-4 text-sm text-muted-foreground">مفيش أي مشاكل — كمّل ضيف منتجات بأوصاف كويسة.</p>
      )}

      {passed.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-border p-3">
          {passed.map((c) => (
            <span key={c.id} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              <Check className="size-3 text-emerald-600" />
              {c.label}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
