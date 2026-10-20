"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OrderSource, OrderStatus } from "@prisma/client";
import { Check, ChevronsUpDown, CircleSlash, Loader2, PackageX, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { UpdateOrderStatusAction } from "@/actions/store/orders.actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ORDER_STATUSES, ORDER_STATUS_META } from "../../_components/order-meta";
import { Dot, appleButton } from "@/components/saas-page";
import { tdir, tr } from "@/lib/i18n/dashboard";

type Step = { status: OrderStatus; label: string };

const STEP_LABELS: Record<OrderStatus, string> = {
  get PENDING() { return tr("اتطلب"); },
  get PAID() { return tr("اتدفع"); },
  get SHIPPED() { return tr("اتشحن"); },
  get DELIVERED() { return tr("اتسلّم"); },
  get CANCELED() { return tr("اتلغى"); },
};

const NEXT_ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  get PAID() { return tr("تأكيد الدفع"); },
  get SHIPPED() { return tr("تحديد كمشحون"); },
  get DELIVERED() { return tr("تحديد كمتسلّم"); },
};

/** The stages that make sense for how this order is paid and fulfilled. */
function stepsFor(source: OrderSource, paymentMethod: string, status: OrderStatus): Step[] {
  let flow: OrderStatus[] = ["PENDING", "PAID", "SHIPPED", "DELIVERED"];
  if (source === "POS") flow = ["PENDING", "PAID", "DELIVERED"];
  else if (paymentMethod === "cash_on_delivery") flow = ["PENDING", "SHIPPED", "DELIVERED"];

  // A manual status outside the usual flow (e.g. a COD order marked paid) → show everything.
  if (status !== "CANCELED" && !flow.includes(status)) flow = ["PENDING", "PAID", "SHIPPED", "DELIVERED"];
  return flow.map((s) => ({ status: s, label: STEP_LABELS[s] }));
}

type Props = {
  orderId: string;
  storeId: string;
  status: OrderStatus;
  source: OrderSource;
  paymentMethod: string;
  createdAtLabel: string;
  paidAtLabel: string | null;
  /** Canceled because the customer refused the delivery. */
  returned: boolean;
};

export function OrderProgress({
  orderId,
  storeId,
  status: initial,
  source,
  paymentMethod,
  createdAtLabel,
  paidAtLabel,
  returned: initialReturned,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(initial);
  const [returned, setReturned] = useState(initialReturned);
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<null | "cancel" | "return">(null);

  const steps = stepsFor(source, paymentMethod, status);
  const currentIndex = steps.findIndex((s) => s.status === status);
  const next = status === "CANCELED" ? undefined : steps[currentIndex + 1];
  const canceled = status === "CANCELED";

  function change(to: OrderStatus, opts: { returned?: boolean } = {}) {
    const toReturned = to === "CANCELED" && Boolean(opts.returned);
    if (to === status && toReturned === returned) return;
    const previous = { status, returned };
    setStatus(to);
    setReturned(toReturned);
    startTransition(async () => {
      try {
        await UpdateOrderStatusAction(orderId, storeId, to, { returned: toReturned });
        toast.success(toReturned ? tr("اتسجّل إن العميل رفض الاستلام") : tr("الطلب بقى \"{0}\"", ORDER_STATUS_META[to].label));
        router.refresh();
      } catch {
        setStatus(previous.status);
        setReturned(previous.returned);
        toast.error(tr("مقدرناش نغيّر حالة الطلب، جرّب تاني."));
      }
    });
  }

  return (
    <section aria-labelledby="order-progress-title" className="apple-card overflow-hidden">
      <div className="flex flex-col gap-4 px-5 pt-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-0.5">
          <h2 id="order-progress-title" className="text-[17px] leading-[22px] font-semibold ltr:tracking-[-0.01em]">
            {tr("حالة الطلب")}
          </h2>
          <p className="text-[13px] leading-[18px] text-muted-foreground">
            {canceled && returned
              ? tr("العميل رفض استلام الطلب ده (مرتجع) — اتحسب في سمعة الرقم.")
              : canceled
              ? tr("الطلب ده اتلغى. تقدر ترجّعه من قايمة الحالة لو اتلغى بالغلط.")
              : next
                ? tr("الخطوة الجاية: {0}", NEXT_ACTION_LABELS[next.status] ?? next.label)
                : tr("الطلب خلص واتسلّم للعميل.")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu dir={tdir()} modal={false}>
            <DropdownMenuTrigger asChild>
              <button type="button" className={appleButton.tinted} disabled={pending}>
                <Dot tone={canceled && returned ? "danger" : ORDER_STATUS_META[status].tone} />
                {canceled && returned ? tr("مرتجع") : ORDER_STATUS_META[status].label}
                <ChevronsUpDown className="size-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 rounded-xl p-1.5">
              <DropdownMenuLabel className="text-[12px] font-normal text-muted-foreground">{tr("غيّر الحالة يدوي")}</DropdownMenuLabel>
              {ORDER_STATUSES.filter((s) => s.value !== "CANCELED").map((s) => (
                <DropdownMenuItem key={s.value} onSelect={() => change(s.value)} className="h-9 gap-2.5 rounded-lg text-[15px]">
                  <Check className={cn("size-4 text-primary", s.value !== status && "invisible")} strokeWidth={2.4} />
                  <span className="flex-1">{s.label}</span>
                  <Dot tone={s.tone} />
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              {canceled && (
                <DropdownMenuItem onSelect={() => change("PENDING")} className="h-9 gap-2.5 rounded-lg text-[15px]">
                  <RotateCcw className="size-4" />
                  {tr("رجّع الطلب لقيد المراجعة")}
                </DropdownMenuItem>
              )}
              {!canceled && (
                <DropdownMenuItem variant="destructive" onSelect={() => setConfirm("cancel")} className="h-9 gap-2.5 rounded-lg text-[15px]">
                  <CircleSlash className="size-4" />
                  {tr("إلغاء الطلب")}
                </DropdownMenuItem>
              )}
              {!(canceled && returned) && source !== "POS" && (
                <DropdownMenuItem variant="destructive" onSelect={() => setConfirm("return")} className="h-9 gap-2.5 rounded-lg text-[15px]">
                  <PackageX className="size-4" />
                  {tr("العميل رفض الاستلام (مرتجع)")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {next && (
            <button type="button" className={cn(appleButton.filled, "h-9 px-4")} onClick={() => change(next.status)} disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" strokeWidth={2.4} />}
              {NEXT_ACTION_LABELS[next.status] ?? next.label}
            </button>
          )}
        </div>
      </div>

      {/* Stepper */}
      <ol className={cn("flex items-start px-5 pt-6 pb-5", canceled && "opacity-45")} aria-label={tr("مراحل الطلب")}>
        {steps.map((step, i) => {
          const done = !canceled && i <= currentIndex;
          const isCurrent = !canceled && i === currentIndex;
          const hint = step.status === "PENDING" ? createdAtLabel : step.status === "PAID" && done ? paidAtLabel : null;

          return (
            <li key={step.status} className="flex min-w-0 flex-1 flex-col gap-2.5 last:flex-none" aria-current={isCurrent ? "step" : undefined}>
              <div className="flex items-center">
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full text-[13px] font-semibold transition-colors duration-300 ease-(--ease-apple)",
                    done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    isCurrent && "ring-4 ring-primary/15",
                  )}
                >
                  {done ? <Check className="size-4" strokeWidth={3} /> : i + 1}
                </span>
                {i < steps.length - 1 && (
                  <span
                    aria-hidden
                    className={cn(
                      "mx-2 h-[3px] flex-1 rounded-full transition-colors duration-300 ease-(--ease-apple)",
                      !canceled && i < currentIndex ? "bg-primary" : "bg-muted",
                    )}
                  />
                )}
              </div>
              <div className="min-w-0 pe-2">
                <p className={cn("text-[15px] leading-5", isCurrent ? "font-semibold" : done ? "" : "text-muted-foreground")}>
                  {step.label}
                </p>
                {hint && <p className="truncate text-[12px] text-muted-foreground">{hint}</p>}
              </div>
            </li>
          );
        })}
      </ol>

      <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent dir={tdir()} className="rounded-[22px]">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm === "return" ? tr("العميل رفض يستلم الطلب؟") : tr("تلغي الطلب ده؟")}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "return"
                ? tr("الطلب هيتلغى والمنتجات ترجع للمخزون، والرفض هيتحسب في سمعة الرقم — عشان المرة الجاية تعرف قبل ما تشحن، وكمان باقي متاجر كاشو.")
                : tr("الطلب هيتحوّل لـ \"ملغي\" ومش هيتحسب في الإيرادات. تقدر ترجّعه بعدين من قايمة الحالة.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">{tr("رجوع")}</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-(--sys-red) text-white hover:bg-(--sys-red)/90"
              onClick={() => change("CANCELED", { returned: confirm === "return" })}
            >
              {confirm === "return" ? tr("تسجيل كمرتجع") : tr("إلغاء الطلب")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
