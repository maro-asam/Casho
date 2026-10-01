"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Minus, Plus, Wallet } from "lucide-react";

import { ConfirmPlanChangeAction, PreviewPlanChangeAction, type PreviewPlanChangeResult } from "@/actions/subscription/change-plan.actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatMoney } from "@/lib/balance-ui/meta";
import { cn } from "@/lib/utils";
import { nf, priceOf, type Cycle, type PlanForUI } from "./plan-types";

const df = new Intl.DateTimeFormat("ar-EG", { timeZone: "Africa/Cairo", day: "numeric", month: "long", year: "numeric" });
const topupHref = (piasters: number) => `/balance/topup?amount=${Math.ceil(piasters / 100)}`;

type Props = {
  plan: PlanForUI;
  cycle: Cycle;
  currentPlan: PlanForUI | null;
  currentCycle: Cycle;
  onClose: () => void;
};

export function PlanChangeDialog(props: Props) {
  return (
    <Dialog open onOpenChange={(open) => !open && props.onClose()}>
      <DialogContent dir="rtl" className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        {/* keyed so every plan/cycle combination fetches a fresh quote */}
        <PlanChangeBody key={`${props.plan.id}-${props.cycle}`} {...props} />
      </DialogContent>
    </Dialog>
  );
}

function PlanChangeBody({ plan, cycle, currentPlan, currentCycle, onClose }: Props) {
  const router = useRouter();
  const [result, setResult] = useState<PreviewPlanChangeResult | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let alive = true;
    PreviewPlanChangeAction(plan.id, cycle)
      .catch(() => ({ success: false as const, message: "مقدرناش نجهّز تفاصيل التغيير. جرّب تاني." }))
      .then((r) => alive && setResult(r));
    return () => {
      alive = false;
    };
  }, [plan.id, cycle]);

  const samePlan = currentPlan?.id === plan.id;
  const up = !currentPlan || plan.sortOrder > currentPlan.sortOrder;
  const cycleWord = cycle === "YEARLY" ? "سنوي" : "شهري";
  const title = samePlan && cycle === currentCycle
    ? `تفعيل باقة ${plan.name}`
    : samePlan
    ? `تحويل ${plan.name} لاشتراك ${cycleWord}`
    : up
      ? `ترقية لباقة ${plan.name}`
      : `النزول لباقة ${plan.name}`;

  const ok = result?.success ? result : null;
  const quote = ok?.quote;
  const preview = ok?.preview;

  function confirm() {
    startTransition(async () => {
      const res = await ConfirmPlanChangeAction(plan.id, cycle).catch(() => null);
      if (!res) {
        toast.error("حصلت مشكلة في الاتصال. جرّب تاني.");
        return;
      }
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
      if (res.shortfall) {
        router.push(topupHref(res.shortfall));
        return;
      }
      onClose();
      router.refresh();
    });
  }

  const blocked = !quote || quote.mode === "same" || (quote.shortfall > 0 && quote.mode === "prorate");
  const confirmLabel = !quote
    ? "تأكيد"
    : quote.shortfall > 0 && quote.mode === "activate"
      ? "احفظ الاختيار واشحن"
      : quote.charge > 0
        ? `ادفع ${formatMoney(quote.charge)} وحوّل`
        : quote.mode === "trial"
          ? `اختار ${plan.name}`
          : "تأكيد التحويل";

  return (
    <>
      <DialogHeader className="text-start">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {formatMoney(priceOf(plan, cycle))} / {cycle === "YEARLY" ? "سنة" : "شهر"}
          {currentPlan && !samePlan && currentPlan.sortOrder !== plan.sortOrder && (
            <>
              {" "}
              · بدل {currentPlan.name} ({formatMoney(priceOf(currentPlan, currentCycle))} / {currentCycle === "YEARLY" ? "سنة" : "شهر"})
            </>
          )}
        </DialogDescription>
      </DialogHeader>

      {!result ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : !ok ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{result.success ? "" : result.message}</p>
      ) : (
        <div className="space-y-4">
          {/* ── What changes ─────────────────────────────── */}
          {preview && (preview.featuresGained.length > 0 || preview.featuresLost.length > 0) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {preview.featuresGained.length > 0 && (
                <FeatureList title="هتكسب" items={preview.featuresGained.map((f) => f.name)} kind="gain" />
              )}
              {preview.featuresLost.length > 0 && (
                <FeatureList title="هتخسر" items={preview.featuresLost.map((f) => f.name)} kind="loss" />
              )}
            </div>
          )}

          {preview && preview.overages.length > 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-800 dark:text-amber-300">
              <p className="mb-1.5 flex items-center gap-1.5 font-medium">
                <AlertTriangle className="size-4 shrink-0" />
                إنت فوق حدود {plan.name}
              </p>
              <ul className="space-y-1 text-xs leading-5">
                {preview.overages.map((o) => (
                  <li key={o.key}>
                    عندك {nf.format(o.current)} {o.unit ?? ""} في «{o.name}» والحد {o.newLimit === 0 ? "مش متاح" : nf.format(o.newLimit)}. مش هنمسح
                    حاجة، بس مش هتقدر تضيف جديد غير لما تقل عن الحد.
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Money ────────────────────────────────────── */}
          {quote && quote.mode === "trial" && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm leading-6">
              إنت لسه في التجربة المجانية — <span className="font-medium">مش هنخصم أي حاجة دلوقتي.</span>
              {quote.firstChargeAt && (
                <>
                  {" "}
                  أول تجديد يوم <span className="font-medium">{df.format(new Date(quote.firstChargeAt))}</span> بـ{" "}
                  <span className="font-medium tabular-nums">{formatMoney(quote.price)}</span> من رصيدك.
                </>
              )}
            </div>
          )}

          {quote && (quote.mode === "prorate" || quote.mode === "activate") && (
            <dl className="divide-y divide-border rounded-lg border border-border text-sm">
              <Line label={`سعر ${plan.name} (${cycleWord})`} value={formatMoney(quote.price)} />
              {quote.mode === "prorate" && (
                <Line label={`المتبقي من باقتك (${nf.format(quote.remainingDays)} يوم)`} value={`− ${formatMoney(quote.credit)}`} muted />
              )}
              <Line
                label={quote.charge >= 0 ? "هيتخصم من رصيدك دلوقتي" : "هيرجعلك في الرصيد"}
                value={formatMoney(Math.abs(quote.charge))}
                strong
              />
              <Line label="رصيدك بعد التغيير" value={quote.shortfall > 0 ? "—" : formatMoney(quote.balanceAfter)} muted />
              {quote.periodEndsAt && <Line label="الاشتراك شغال لحد" value={df.format(new Date(quote.periodEndsAt))} muted />}
            </dl>
          )}

          {quote && quote.shortfall > 0 && (
            <div className="flex flex-col gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                رصيدك {formatMoney(ok.balance)} — <span className="font-medium">ناقصك {formatMoney(quote.shortfall)}</span>
                {quote.mode === "activate" && <span className="block text-xs">هنحفظ اختيارك، ولما تشحن الاشتراك هيتفعّل لوحده.</span>}
              </p>
              {quote.mode === "prorate" && (
                <Button asChild size="sm" className="shrink-0 gap-1.5">
                  <Link href={topupHref(quote.shortfall)}>
                    <Wallet className="size-4" />
                    اشحن {formatMoney(quote.shortfall)}
                  </Link>
                </Button>
              )}
            </div>
          )}

          {quote?.mode === "same" && <p className="text-sm text-muted-foreground">إنت مشترك في الباقة دي بالفعل.</p>}
        </div>
      )}

      <DialogFooter className="gap-2 sm:justify-start">
        <Button onClick={confirm} disabled={blocked || pending} className="gap-1.5">
          {pending && <Loader2 className="size-4 animate-spin" />}
          {confirmLabel}
        </Button>
        <Button variant="ghost" onClick={onClose} disabled={pending}>
          إلغاء
        </Button>
      </DialogFooter>
    </>
  );
}

function FeatureList({ title, items, kind }: { title: string; items: string[]; kind: "gain" | "loss" }) {
  const Icon = kind === "gain" ? Plus : Minus;
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">{title}</p>
      <ul className="space-y-1.5">
        {items.map((name) => (
          <li key={name} className={cn("flex items-center gap-2 text-sm", kind === "loss" && "text-muted-foreground")}>
            <Icon className={cn("size-3.5 shrink-0", kind === "gain" ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")} />
            {name}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Line({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between gap-3 px-3 py-2", strong && "bg-muted/40")}>
      <dt className={cn(muted ? "text-muted-foreground" : "text-foreground", strong && "font-medium")}>{label}</dt>
      <dd className={cn("tabular-nums", strong ? "text-base font-semibold" : "font-medium", muted && "text-muted-foreground")}>{value}</dd>
    </div>
  );
}

