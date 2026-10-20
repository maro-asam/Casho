import { ArrowLeft, Check, FolderTree, Package, ShoppingBag, ShoppingCart, Store, Users, type LucideIcon } from "lucide-react";
import type { ImportableEntity } from "@/lib/integrations/import/types";
import { cn } from "@/lib/utils";
import { tr } from "@/lib/i18n/dashboard";
import { nf } from "./import-meta";

/** App-icon tile per importable entity (Settings-style colored squircle). */
export const ENTITY_TILE: Record<ImportableEntity, { icon: LucideIcon; tint: string }> = {
  COLLECTION: { icon: FolderTree, tint: "bg-(--sys-indigo)" },
  PRODUCT: { icon: Package, tint: "bg-(--sys-orange)" },
  CUSTOMER: { icon: Users, tint: "bg-primary" },
  ORDER: { icon: ShoppingCart, tint: "bg-(--sys-green)" },
};

/** Shopify's brand green squircle — the source of the migration. */
export function ShopifyMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center bg-linear-to-br from-[#95bf47] to-[#5e8e3e] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]",
        size === "sm" && "size-[29px] rounded-[7px]",
        size === "md" && "size-11 rounded-[12px]",
        size === "lg" && "size-16 rounded-[18px]",
      )}
    >
      <ShoppingBag className={size === "sm" ? "size-[17px]" : size === "md" ? "size-5.5" : "size-8"} strokeWidth={2} />
    </span>
  );
}

/** Shopify → your store, the page's hero glyph. */
export function MigrationGlyph({ done }: { done?: boolean }) {
  return (
    <div aria-hidden className="flex items-center justify-center gap-3">
      <ShopifyMark size="lg" />
      <span className="flex items-center gap-1 text-(--label-3)">
        <span className="size-1 rounded-full bg-current" />
        <span className="size-1 rounded-full bg-current" />
        {done ? (
          <span className="grid size-6 place-items-center rounded-full bg-(--sys-green) text-white">
            <Check className="size-3.5" strokeWidth={3} />
          </span>
        ) : (
          <ArrowLeft className="size-5 ltr:-scale-x-100" strokeWidth={2.4} />
        )}
        <span className="size-1 rounded-full bg-current" />
        <span className="size-1 rounded-full bg-current" />
      </span>
      <span className="grid size-16 shrink-0 place-items-center rounded-[18px] bg-linear-to-br from-primary/80 to-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
        <Store className="size-8" strokeWidth={2} />
      </span>
    </div>
  );
}

/** Thin capsule progress track. */
export function Bar({ value, tone = "primary", label }: { value: number; tone?: "primary" | "warning" | "success"; label?: string }) {
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-(--fill-3)"
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 ease-(--ease-apple)",
          tone === "warning" ? "bg-(--sys-orange)" : tone === "success" ? "bg-(--sys-green)" : "bg-primary",
        )}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

/** Activity-ring style overall progress. */
export function Ring({ value, warn }: { value: number; warn?: boolean }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-32 shrink-0" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={tr("الإجمالي")}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="9" className="stroke-(--fill-3)" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${c * Math.max(0.01, value / 100)} ${c}`}
          className={cn("transition-[stroke-dasharray] duration-700 ease-(--ease-apple)", warn ? "stroke-(--sys-orange)" : "stroke-primary")}
        />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <span className="text-[28px] leading-none font-bold tabular-nums">{tr("{0}٪", nf.format(value))}</span>
      </div>
    </div>
  );
}

export type StepId = "connect" | "preview" | "import" | "done";

const STEPS: { id: StepId; label: () => string; hint: () => string }[] = [
  { id: "connect", label: () => tr("اربط متجرك"), hint: () => tr("من صفحة Shopify الرسمية") },
  { id: "preview", label: () => tr("راجع البيانات"), hint: () => tr("واختار هتنقل إيه") },
  { id: "import", label: () => tr("الاستيراد"), hint: () => tr("بيشتغل في الخلفية") },
  { id: "done", label: () => tr("راجع النتيجة"), hint: () => tr("وكمّل شغلك على متجرك") },
];

/** Vertical stepper: where the merchant is in the migration. */
export function Steps({ current }: { current: StepId }) {
  const index = STEPS.findIndex((s) => s.id === current);
  return (
    <ol className="apple-card space-y-0 px-5 py-4">
      {STEPS.map((step, i) => {
        const done = i < index || (current === "done" && i === index);
        const active = i === index && !done;
        return (
          <li key={step.id} className="relative flex gap-3 pb-4 last:pb-0" aria-current={active ? "step" : undefined}>
            {i < STEPS.length - 1 && (
              <span aria-hidden className={cn("absolute start-[13px] top-8 bottom-1 w-0.5 rounded-full", i < index ? "bg-(--sys-green)" : "bg-(--fill-3)")} />
            )}
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full text-[13px] font-semibold tabular-nums",
                done ? "bg-(--sys-green) text-white" : active ? "bg-primary text-primary-foreground" : "bg-(--fill-3) text-muted-foreground",
              )}
            >
              {done ? <Check className="size-4" strokeWidth={3} /> : nf.format(i + 1)}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className={cn("text-[15px] leading-5", active ? "font-semibold" : done ? "font-medium" : "text-muted-foreground")}>{step.label()}</p>
              <p className="text-[13px] leading-[18px] text-muted-foreground">{step.hint()}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
