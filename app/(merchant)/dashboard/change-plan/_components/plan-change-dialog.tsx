"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Minus, Plus, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { appleButton } from "@/components/saas-page";

import { ConfirmPlanChangeAction, PreviewPlanChangeAction, type PreviewPlanChangeResult } from "@/actions/subscription/change-plan.actions";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatMoney } from "@/lib/balance-ui/meta";
import { cn } from "@/lib/utils";
import { nf, priceOf, type Cycle, type PlanForUI } from "./plan-types";
import { TierGlyph } from "./tier-glyph";
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
      <DialogContent dir={tdir()} className="max-h-[92vh] gap-0 overflow-y-auto p-0 sm:max-w-md">
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
      <DialogHeader className="items-center px-6 pt-8 pb-5 text-center sm:text-center">
        <TierGlyph tier={plan.key} size="lg" className="mb-2" />
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription className="text-[15px]">
          <span className="font-semibold text-foreground tabular-nums">{formatMoney(priceOf(plan, cycle))}</span> / {cycle === "YEARLY" ? tr("سنة") : tr("شهر")}
          {currentPlan && !samePlan && currentPlan.sortOrder !== plan.sortOrder && (
            <>
              {" "}{tr("· بدل {0} ({1} /", currentPlan.name, formatMoney(priceOf(currentPlan, currentCycle)))}{" "}{currentCycle === "YEARLY" ? tr("سنة") : tr("شهر")})
            </>
          )}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 px-5 pb-5">
        {!result ? (
          <div className="space-y-2" aria-busy="true">
            <Skeleton className="h-24 rounded-[14px]" />
            <Skeleton className="h-36 rounded-[14px]" />
          </div>
        ) : !ok ? (
          <p role="alert" className="rounded-[14px] bg-(--sys-red)/10 px-4 py-3 text-[15px] text-(--sys-red)">
            {result.success ? "" : trv(result.message)}
          </p>
        ) : (
          <>
            {/* ── What changes ─────────────────────────────── */}
            {preview && (preview.featuresGained.length > 0 || preview.featuresLost.length > 0) && (
              <div className="grid gap-2 sm:grid-cols-2">
                {preview.featuresGained.length > 0 && <FeatureList title={tr("هتكسب")} items={preview.featuresGained.map((f) => trv(f.name))} kind="gain" />}
                {preview.featuresLost.length > 0 && <FeatureList title={tr("هتخسر")} items={preview.featuresLost.map((f) => trv(f.name))} kind="loss" />}
              </div>
            )}

            {preview && preview.overages.length > 0 && (
              <div className="rounded-[14px] bg-(--sys-orange)/10 p-4">
                <p className="mb-1.5 flex items-center gap-2 text-[15px] font-semibold">
                  <AlertTriangle className="size-[18px] shrink-0 text-(--sys-orange)" />
                  {tr("إنت فوق حدود {0}", plan.name)}
                </p>
                <ul className="space-y-1 text-[13px] leading-5 text-foreground/80">
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
              <p className="rounded-[14px] bg-(--fill-3) p-4 text-[15px] leading-6">
                {tr("إنت لسه في التجربة المجانية —")}{" "}<span className="font-semibold">{tr("مش هنخصم أي حاجة دلوقتي.")}</span>
                {quote.firstChargeAt && (
                  <>
                    {" "}{tr("أول تجديد يوم")}{" "}<span className="font-semibold">{df.format(new Date(quote.firstChargeAt))}</span>{" "}{tr("بـ")}{" "}
                    <span className="font-semibold tabular-nums">{formatMoney(quote.price)}</span>{" "}{tr("من رصيدك.")}
                  </>
                )}
              </p>
            )}

            {quote && (quote.mode === "prorate" || quote.mode === "activate") && (
              <dl className="apple-rows overflow-hidden rounded-[14px] bg-(--fill-3) [--row-inset:16px]">
                <Line label={tr("سعر {0} ({1})", plan.name, cycleWord)} value={formatMoney(quote.price)} />
                {quote.mode === "prorate" && (
                  <Line label={tr("المتبقي من باقتك ({0} يوم)", nf.format(quote.remainingDays))} value={`− ${formatMoney(quote.credit)}`} muted />
                )}
                <Line label={tr("رصيدك بعد التغيير")} value={quote.shortfall > 0 ? "—" : formatMoney(quote.balanceAfter)} muted />
                {quote.periodEndsAt && <Line label={tr("الاشتراك شغال لحد")} value={df.format(new Date(quote.periodEndsAt))} muted />}
                <Line
                  label={quote.charge >= 0 ? tr("هيتخصم من رصيدك دلوقتي") : tr("هيرجعلك في الرصيد")}
                  value={formatMoney(Math.abs(quote.charge))}
                  strong
                  credit={quote.charge < 0}
                />
              </dl>
            )}

            {quote && quote.shortfall > 0 && (
              <div className="flex flex-col gap-3 rounded-[14px] bg-(--sys-orange)/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[15px] leading-6">
                  {tr("رصيدك {0} —", formatMoney(ok.balance))}{" "}<span className="font-semibold">{tr("ناقصك {0}", formatMoney(quote.shortfall))}</span>
                  {quote.mode === "activate" && <span className="block text-[13px] text-muted-foreground">{tr("هنحفظ اختيارك، ولما تشحن الاشتراك هيتفعّل لوحده.")}</span>}
                </p>
                {quote.mode === "prorate" && (
                  <Link href={topupHref(quote.shortfall)} className={cn(appleButton.filled, "h-9 px-4")}>
                    <Wallet className="size-4" />
                    {tr("اشحن {0}", formatMoney(quote.shortfall))}
                  </Link>
                )}
              </div>
            )}

            {quote?.mode === "same" && <p className="text-center text-[15px] text-muted-foreground">{tr("إنت مشترك في الباقة دي بالفعل.")}</p>}
          </>
        )}
      </div>

      <DialogFooter className="flex-col gap-2 px-5 pb-5 sm:flex-col">
        <button type="button" onClick={confirm} disabled={blocked || pending} className={cn(appleButton.filled, "h-[50px] w-full text-[17px]")}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {confirmLabel}
        </button>
        <button type="button" onClick={onClose} disabled={pending} className={cn(appleButton.plain, "mx-0 h-11 w-full")}>
          {tr("إلغاء")}
        </button>
      </DialogFooter>
    </>
  );
}

function FeatureList({ title, items, kind }: { title: string; items: string[]; kind: "gain" | "loss" }) {
  const Icon = kind === "gain" ? Plus : Minus;
  return (
    <div className="rounded-[14px] bg-(--fill-3) p-4">
      <p className="mb-2 text-[13px] font-semibold text-muted-foreground">{title}</p>
      <ul className="space-y-1.5">
        {items.map((name) => (
          <li key={name} className={cn("flex items-center gap-2 text-[15px]", kind === "loss" && "text-muted-foreground")}>
            <span className={cn("grid size-4 shrink-0 place-items-center rounded-full text-white", kind === "gain" ? "bg-(--sys-green)" : "bg-(--sys-red)")}>
              <Icon className="size-2.5" strokeWidth={3.5} />
            </span>
            {name}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Line({ label, value, strong, muted, credit }: { label: string; value: string; strong?: boolean; muted?: boolean; credit?: boolean }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 px-4 py-2.5 text-[15px]">
      <dt className={cn(strong && "font-semibold")}>{label}</dt>
      <dd
        className={cn(
          "shrink-0 tabular-nums",
          strong ? "text-[17px] font-bold" : "",
          muted && "text-muted-foreground",
          credit && "text-(--sys-green)",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
