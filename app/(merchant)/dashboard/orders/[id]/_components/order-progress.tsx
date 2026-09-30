"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OrderSource, OrderStatus } from "@prisma/client";
import { Check, ChevronDown, CircleSlash, Loader2, RotateCcw } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toneDot } from "@/components/saas-page";
import { cn } from "@/lib/utils";
import { ORDER_STATUSES, ORDER_STATUS_META } from "../../_components/order-meta";

type Step = { status: OrderStatus; label: string };

const STEP_LABELS: Record<OrderStatus, string> = {
  PENDING: "اتطلب",
  PAID: "اتدفع",
  SHIPPED: "اتشحن",
  DELIVERED: "اتسلّم",
  CANCELED: "اتلغى",
};

const NEXT_ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  PAID: "تأكيد الدفع",
  SHIPPED: "تحديد كمشحون",
  DELIVERED: "تحديد كمتسلّم",
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
};

export function OrderProgress({ orderId, storeId, status: initial, source, paymentMethod, createdAtLabel, paidAtLabel }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(initial);
  const [pending, startTransition] = useTransition();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const steps = stepsFor(source, paymentMethod, status);
  const currentIndex = steps.findIndex((s) => s.status === status);
  const next = status === "CANCELED" ? undefined : steps[currentIndex + 1];
  const canceled = status === "CANCELED";

  function change(to: OrderStatus) {
    if (to === status) return;
    const previous = status;
    setStatus(to);
    startTransition(async () => {
      try {
        await UpdateOrderStatusAction(orderId, storeId, to);
        toast.success(`الطلب بقى "${ORDER_STATUS_META[to].label}"`);
        router.refresh();
      } catch {
        setStatus(previous);
        toast.error("مقدرناش نغيّر حالة الطلب، جرّب تاني.");
      }
    });
  }

  return (
    <section aria-labelledby="order-progress-title" className="rounded-xl border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="order-progress-title" className="text-base font-semibold">
            حالة الطلب
          </h2>
          <p className="text-sm text-muted-foreground">
            {canceled
              ? "الطلب ده اتلغى. تقدر ترجّعه من قايمة الحالة لو اتلغى بالغلط."
              : next
                ? `الخطوة الجاية: ${NEXT_ACTION_LABELS[next.status] ?? next.label}`
                : "الطلب خلص واتسلّم للعميل."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu dir="rtl" modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5" disabled={pending}>
                <span aria-hidden className={cn("size-1.5 rounded-full", toneDot(ORDER_STATUS_META[status].tone))} />
                {ORDER_STATUS_META[status].label}
                <ChevronDown className="size-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">غيّر الحالة يدوي</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ORDER_STATUSES.filter((s) => s.value !== "CANCELED").map((s) => (
                <DropdownMenuItem key={s.value} onSelect={() => change(s.value)} className="gap-2">
                  <span aria-hidden className={cn("size-1.5 rounded-full", toneDot(s.tone))} />
                  <span className="flex-1">{s.label}</span>
                  {s.value === status && <Check className="size-3.5 text-primary" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              {canceled ? (
                <DropdownMenuItem onSelect={() => change("PENDING")} className="gap-2">
                  <RotateCcw className="size-3.5" />
                  رجّع الطلب لقيد المراجعة
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem variant="destructive" onSelect={() => setConfirmCancel(true)} className="gap-2">
                  <CircleSlash className="size-3.5" />
                  إلغاء الطلب
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {next && (
            <Button size="sm" className="h-9 gap-1.5" onClick={() => change(next.status)} disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              {NEXT_ACTION_LABELS[next.status] ?? next.label}
            </Button>
          )}
        </div>
      </div>

      {/* Stepper */}
      <ol className={cn("flex items-start gap-2 p-5", canceled && "opacity-50")} aria-label="مراحل الطلب">
        {steps.map((step, i) => {
          const done = !canceled && i <= currentIndex;
          const isCurrent = !canceled && i === currentIndex;
          const hint = step.status === "PENDING" ? createdAtLabel : step.status === "PAID" && done ? paidAtLabel : null;

          return (
            <li key={step.status} className="flex min-w-0 flex-1 flex-col gap-2" aria-current={isCurrent ? "step" : undefined}>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full border text-xs font-semibold",
                    done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground",
                  )}
                >
                  {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                </span>
                {i < steps.length - 1 && (
                  <span
                    aria-hidden
                    className={cn("h-0.5 flex-1 rounded-full", !canceled && i < currentIndex ? "bg-primary" : "bg-border")}
                  />
                )}
              </div>
              <div className="min-w-0">
                <p className={cn("text-sm", isCurrent ? "font-semibold" : done ? "font-medium" : "text-muted-foreground")}>
                  {step.label}
                </p>
                {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
              </div>
            </li>
          );
        })}
      </ol>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تلغي الطلب ده؟</AlertDialogTitle>
            <AlertDialogDescription>
              الطلب هيتحوّل لـ &quot;ملغي&quot; ومش هيتحسب في الإيرادات. تقدر ترجّعه بعدين من قايمة الحالة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>رجوع</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => change("CANCELED")}
            >
              إلغاء الطلب
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
