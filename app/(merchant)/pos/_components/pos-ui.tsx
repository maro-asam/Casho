import Link from "next/link";
import type { ReactNode } from "react";
import { Banknote, ChevronRight, CreditCard, Landmark, Smartphone, Split, Wallet, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { tr } from "@/lib/i18n/dashboard";

/** Payment methods: label, glyph and Settings-style tile tint (shared by payment, receipt and shift reports). */
export const PAYMENT_META: Record<string, { label: () => string; icon: LucideIcon; tint: string }> = {
  cash: { label: () => tr("كاش"), icon: Banknote, tint: "bg-(--sys-green)" },
  card: { label: () => tr("فيزا / بطاقة"), icon: CreditCard, tint: "bg-primary" },
  vodafone_cash: { label: () => tr("فودافون كاش"), icon: Smartphone, tint: "bg-(--sys-red)" },
  instapay: { label: () => tr("إنستاباي"), icon: Wallet, tint: "bg-(--sys-indigo)" },
  bank_transfer: { label: () => tr("تحويل بنكي"), icon: Landmark, tint: "bg-(--sys-gray)" },
  split: { label: () => tr("تقسيم الدفع"), icon: Split, tint: "bg-(--sys-orange)" },
};

export function paymentLabel(method: string) {
  return PAYMENT_META[method]?.label() ?? method;
}

/** White glyph on a colored squircle. */
export function Tile({ icon: Icon, tint, size = "sm" }: { icon: LucideIcon; tint: string; size?: "sm" | "md" | "lg" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center text-white",
        tint,
        size === "sm" && "size-[29px] rounded-[7px]",
        size === "md" && "size-10 rounded-[10px]",
        size === "lg" && "size-14 rounded-[15px]",
      )}
    >
      <Icon className={size === "sm" ? "size-[17px]" : size === "md" ? "size-5" : "size-7"} strokeWidth={2} />
    </span>
  );
}

/** Small section header above a grouped card. */
export function GroupTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 px-4 pb-2">
      <h2 className="text-[13px] font-semibold text-muted-foreground">{children}</h2>
      {action}
    </div>
  );
}

/**
 * POS secondary screens (shifts, returns): a floating glass bar with a back
 * button over a scrolling grouped background, then a large title.
 */
export function PosSubpage({
  back,
  backLabel,
  title,
  subtitle,
  actions,
  children,
}: {
  back: string;
  backLabel: string;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="sticky top-0 z-30 px-3 pt-3">
        <div className="apple-glass mx-auto flex h-12 max-w-4xl items-center gap-2 rounded-full ps-1.5 pe-3">
          <Link
            href={back}
            className="apple-press inline-flex h-9 items-center gap-0.5 rounded-full px-2.5 text-[15px] text-primary hover:bg-primary/8"
          >
            <ChevronRight className="size-5 ltr:-scale-x-100" />
            {backLabel}
          </Link>
        </div>
      </div>
      <main className="mx-auto max-w-4xl space-y-8 px-4 pt-6 pb-16 sm:px-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-1">
            <h1 className="text-[34px] leading-[41px] font-bold ltr:tracking-[-0.02em]">{title}</h1>
            {subtitle && <p className="text-[15px] text-muted-foreground">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
        {children}
      </main>
    </div>
  );
}

/** Capsule quantity stepper (− n +). */
export function Stepper({
  value,
  onDecrement,
  onIncrement,
  canIncrement = true,
  canDecrement = true,
  decLabel,
  incLabel,
}: {
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  canIncrement?: boolean;
  canDecrement?: boolean;
  decLabel: string;
  incLabel: string;
}) {
  return (
    <div className="inline-flex h-8 items-center rounded-full bg-(--fill-3)">
      <button
        type="button"
        onClick={onDecrement}
        disabled={!canDecrement}
        aria-label={decLabel}
        className="apple-press grid h-8 w-9 place-items-center rounded-full text-[18px] leading-none disabled:opacity-30"
      >
        −
      </button>
      <span className="min-w-6 text-center text-[15px] font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        disabled={!canIncrement}
        aria-label={incLabel}
        className="apple-press grid h-8 w-9 place-items-center rounded-full text-[18px] leading-none disabled:opacity-30"
      >
        +
      </button>
    </div>
  );
}
