import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type ReadinessItem = {
  id: string;
  label: string;
  /** Why it matters, shown for missing items. */
  hint: string;
  done: boolean;
  href: string;
  weight: number;
};

/**
 * "How ready is my store to sell?" — a weighted checklist that always points
 * at the single next thing worth doing.
 */
export function ReadinessCard({ items }: { items: ReadinessItem[] }) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  const score = Math.round((items.filter((i) => i.done).reduce((s, i) => s + i.weight, 0) / total) * 100);
  const missing = items.filter((i) => !i.done).sort((a, b) => b.weight - a.weight);
  const doneCount = items.length - missing.length;
  const verdict = score >= 90 ? "متجرك جاهز يبيع 🎉" : score >= 60 ? "قربت — كام خطوة كمان" : "لسه في حاجات مهمة ناقصة";
  const r = 34;
  const c = 2 * Math.PI * r;

  return (
    <section className="flex h-full flex-col rounded-xl border border-border bg-card">
      <div className="flex items-center gap-4 border-b border-border p-4">
        <div className="relative size-20 shrink-0">
          <svg viewBox="0 0 80 80" className="size-20 -rotate-90">
            <circle cx="40" cy="40" r={r} className="fill-none stroke-muted" strokeWidth="7" />
            <circle
              cx="40"
              cy="40"
              r={r}
              className={cn(
                "fill-none transition-[stroke-dashoffset] duration-700",
                score >= 90 ? "stroke-emerald-500" : score >= 60 ? "stroke-amber-500" : "stroke-rose-500",
              )}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c * (1 - score / 100)}
            />
          </svg>
          <span className="absolute inset-0 grid place-items-center text-lg font-bold tabular-nums">{score}٪</span>
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-xs text-muted-foreground">جاهزية المتجر</p>
          <p className="font-semibold">{verdict}</p>
          <p className="text-xs text-muted-foreground">
            {doneCount} من {items.length} خطوات خلصت
          </p>
        </div>
      </div>

      {missing.length > 0 ? (
        <ul className="flex-1 divide-y divide-border">
          {missing.slice(0, 4).map((item, i) => (
            <li key={item.id}>
              <Link href={item.href} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full border text-[11px] font-medium tabular-nums",
                    i === 0 ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground",
                  )}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{item.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{item.hint}</span>
                </span>
                <ArrowLeft className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
          <span className="grid size-10 place-items-center rounded-full bg-emerald-500/10 text-emerald-600">
            <Check className="size-5" />
          </span>
          <p className="text-sm text-muted-foreground">كل الأساسيات متظبطة. ركّز على المنتجات والعروض.</p>
        </div>
      )}

      {missing.length > 0 && doneCount > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-border p-3">
          {items
            .filter((i) => i.done)
            .map((i) => (
              <span key={i.id} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                <Check className="size-3 text-emerald-600" />
                {i.label}
              </span>
            ))}
        </div>
      )}
    </section>
  );
}
