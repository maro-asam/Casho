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
import { lazyIntl, tdir, tr, trv } from "@/lib/i18n/dashboard";

const df = lazyIntl.date({ timeZone: "Africa/Cairo", day: "numeric", month: "long", year: "numeric" });
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
      <DialogContent dir={tdir()} className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
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
      .catch(() => ({ success: false as const, message: tr("مقدرناش نجهّز تفاصيل التغيير. جرّب تاني.") }))
      .then((r) => alive && setResult(r));
    return () => {
      alive = false;
    };
  }, [plan.id, cycle]);

  const samePlan = currentPlan?.id === plan.id;
  const up = !currentPlan || plan.sortOrder > currentPlan.sortOrder;
  const cycleWord = cycle === "YEARLY" ? tr("سنوي") : tr("شهري");
  const title = samePlan && cycle === currentCycle
    ? tr("تفعيل باقة {0}", plan.name)
    : samePlan
    ? tr("تحويل {0} لاشتراك {1}", plan.name, cycleWord)
    : up
      ? tr("ترقية لباقة {0}", plan.name)
      : tr("النزول لباقة {0}", plan.name);

  const ok = result?.success ? result : null;
  const quote = ok?.quote;
  const preview = ok?.preview;

  function confirm() {
    startTransition(async () => {
      const res = await ConfirmPlanChangeAction(plan.id, cycle).catch(() => null);
      if (!res) {
        toast.error(tr("حصلت مشكلة في الاتصال. جرّب تاني."));
        return;
      }
      if (!res.success) {
        toast.error(trv(res.message));
        return;
      }
      toast.success(trv(res.message));
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
    ? tr("تأكيد")
    : quote.shortfall > 0 && quote.mode === "activate"
      ? tr("احفظ الاختيار واشحن")
      : quote.charge > 0
        ? tr("ادفع {0} وحوّل", formatMoney(quote.charge))
        : quote.mode === "trial"
          ? tr("اختار {0}", plan.name)
          : tr("تأكيد التحويل");

  return (
    <>
      <DialogHeader className="text-start">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {formatMoney(priceOf(plan, cycle))} / {cycle === "YEARLY" ? tr("سنة") : tr("شهر")}
          {currentPlan && !samePlan && currentPlan.sortOrder !== plan.sortOrder && (
            <>
              {" "}{tr("· بدل {0} ({1} /", currentPlan.name, formatMoney(priceOf(currentPlan, currentCycle)))}{" "}{currentCycle === "YEARLY" ? tr("سنة") : tr("شهر")})
            </>
          )}
        </DialogDescription>
      </DialogHeader>

      {!result ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : !ok ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{result.success ? "" : trv(result.message)}</p>
      ) : (
        <div className="space-y-4">
          {/* ── What changes ─────────────────────────────── */}
          {preview && (preview.featuresGained.length > 0 || preview.featuresLost.length > 0) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {preview.featuresGained.length > 0 && (
                <FeatureList title={tr("هتكسب")} items={preview.featuresGained.map((f) => trv(f.name))} kind="gain" />
              )}
              {preview.featuresLost.length > 0 && (
                <FeatureList title={tr("هتخسر")} items={preview.featuresLost.map((f) => trv(f.name))} kind="loss" />
              )}
            </div>
          )}

          {preview && preview.overages.length > 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-800 dark:text-amber-300">
              <p className="mb-1.5 flex items-center gap-1.5 font-medium">
                <AlertTriangle className="size-4 shrink-0" />
                {tr("إنت فوق حدود {0}", plan.name)}
              </p>
              <ul className="space-y-1 text-xs leading-5">
                {preview.overages.map((o) => (
                  <li key={o.key}>
                    {tr("عندك {0} {1} في «{2}» والحد", nf.format(o.current), trv(o.unit) ?? "", trv(o.name))}{" "}{o.newLimit === 0 ? tr("مش متاح") : nf.format(o.newLimit)}{tr(". مش هنمسح حاجة، بس مش هتقدر تضيف جديد غير لما تقل عن الحد.")}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Money ────────────────────────────────────── */}
          {quote && quote.mode === "trial" && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm leading-6">
              {tr("إنت لسه في التجربة المجانية —")}{" "}<span className="font-medium">{tr("مش هنخصم أي حاجة دلوقتي.")}</span>
              {quote.firstChargeAt && (
                <>
                  {" "}{tr("أول تجديد يوم")}{" "}<span className="font-medium">{df.format(new Date(quote.firstChargeAt))}</span>{" "}{tr("بـ")}{" "}
                  <span className="font-medium tabular-nums">{formatMoney(quote.price)}</span>{" "}{tr("من رصيدك.")}
                </>
              )}
            </div>
          )}

          {quote && (quote.mode === "prorate" || quote.mode === "activate") && (
            <dl className="divide-y divide-border rounded-lg border border-border text-sm">
              <Line label={tr("سعر {0} ({1})", plan.name, cycleWord)} value={formatMoney(quote.price)} />
              {quote.mode === "prorate" && (
                <Line label={tr("المتبقي من باقتك ({0} يوم)", nf.format(quote.remainingDays))} value={`− ${formatMoney(quote.credit)}`} muted />
              )}
              <Line
                label={quote.charge >= 0 ? tr("هيتخصم من رصيدك دلوقتي") : tr("هيرجعلك في الرصيد")}
                value={formatMoney(Math.abs(quote.charge))}
                strong
              />
              <Line label={tr("رصيدك بعد التغيير")} value={quote.shortfall > 0 ? "—" : formatMoney(quote.balanceAfter)} muted />
              {quote.periodEndsAt && <Line label={tr("الاشتراك شغال لحد")} value={df.format(new Date(quote.periodEndsAt))} muted />}
            </dl>
          )}

          {quote && quote.shortfall > 0 && (
            <div className="flex flex-col gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                {tr("رصيدك {0} —", formatMoney(ok.balance))}{" "}<span className="font-medium">{tr("ناقصك {0}", formatMoney(quote.shortfall))}</span>
                {quote.mode === "activate" && <span className="block text-xs">{tr("هنحفظ اختيارك، ولما تشحن الاشتراك هيتفعّل لوحده.")}</span>}
              </p>
              {quote.mode === "prorate" && (
                <Button asChild size="sm" className="shrink-0 gap-1.5">
                  <Link href={topupHref(quote.shortfall)}>
                    <Wallet className="size-4" />
                    {tr("اشحن {0}", formatMoney(quote.shortfall))}
                  </Link>
                </Button>
              )}
            </div>
          )}

          {quote?.mode === "same" && <p className="text-sm text-muted-foreground">{tr("إنت مشترك في الباقة دي بالفعل.")}</p>}
        </div>
      )}

      <DialogFooter className="gap-2 sm:justify-start">
        <Button onClick={confirm} disabled={blocked || pending} className="gap-1.5">
          {pending && <Loader2 className="size-4 animate-spin" />}
          {confirmLabel}
        </Button>
        <Button variant="ghost" onClick={onClose} disabled={pending}>
          {tr("إلغاء")}
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

