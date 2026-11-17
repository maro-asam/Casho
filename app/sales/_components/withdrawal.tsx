"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cancelWithdrawalAction, requestWithdrawalAction, type WithdrawalActionResult } from "@/actions/sales/withdrawal.actions";
import { appleButton } from "@/components/saas-page";
import { WITHDRAWAL_ACCOUNT_HINT, WITHDRAWAL_METHODS, type WithdrawalMethod } from "@/lib/sales/withdrawal";
import { formatMoneyFromPiasters } from "@/lib/subscriptions";
import { cn } from "@/lib/utils";

function useAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const run = (call: () => Promise<WithdrawalActionResult>, onDone?: () => void) =>
    start(async () => {
      try {
        const res = await call();
        setErrors(res.fieldErrors ?? {});
        if (!res.success) return void toast.error(res.message);
        toast.success(res.message);
        onDone?.();
        router.refresh();
      } catch {
        toast.error("حصلت مشكلة — جرّب تاني");
      }
    });
  return { run, pending, errors };
}

const isMethod = (m: string | undefined): m is WithdrawalMethod => WITHDRAWAL_METHODS.includes(m as WithdrawalMethod);

/**
 * "طلب سحب الأرباح": asks for the whole payable, to the method/account the rep
 * picks (prefilled from their last request). `onPrimary` = sits on a filled
 * primary surface.
 */
export function WithdrawButton({
  payable,
  last,
  onPrimary,
  className,
}: {
  payable: number;
  last?: { method: string; account: string } | null;
  onPrimary?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<WithdrawalMethod>(isMethod(last?.method) ? last.method : WITHDRAWAL_METHODS[0]);
  const { run, pending, errors } = useAction();
  const amount = formatMoneyFromPiasters(payable);
  const hint = WITHDRAWAL_ACCOUNT_HINT[method];

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    run(() => requestWithdrawalAction({ method, account: form.get("account"), note: form.get("note") }), () => setOpen(false));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
      <DialogTrigger asChild>
        <button
          type="button"
          disabled={payable <= 0}
          className={cn(
            onPrimary ? cn(appleButton.gray, "h-10 bg-primary-foreground text-primary hover:bg-primary-foreground/90") : appleButton.filled,
            "disabled:opacity-50",
            className,
          )}
        >
          <Banknote className="size-4" strokeWidth={2} />
          طلب سحب الأرباح
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>طلب سحب {amount}</DialogTitle>
          <DialogDescription>
            هتطلب كل المستحق ليك دلوقتي. الإدارة بتحوّله على الحساب اللي هتختاره وتسجّل التحويل، وهيوصلك إشعار. العمولات اللي لسه قيد المراجعة مش داخلة — بتنزل في الطلب الجاي.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <fieldset className="space-y-1.5">
            <legend className="mb-1.5 text-[13px] font-medium text-muted-foreground">تستلم إزاي</legend>
            <div className="grid grid-cols-2 gap-2">
              {WITHDRAWAL_METHODS.map((m) => (
                <label
                  key={m}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center justify-center rounded-[12px] px-3 text-center text-[14px] transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring",
                    method === m ? "bg-primary font-semibold text-primary-foreground" : "bg-(--fill-3) text-foreground hover:bg-(--fill-3)/70",
                  )}
                >
                  <input type="radio" name="method" value={m} checked={method === m} onChange={() => setMethod(m)} className="sr-only" />
                  {m}
                </label>
              ))}
            </div>
            {errors.method && <p className="text-[13px] text-(--sys-red)">{errors.method}</p>}
          </fieldset>

          <div className="space-y-1.5">
            <Label htmlFor="withdraw-account" className="text-[13px] font-medium text-muted-foreground">
              {hint.label}
            </Label>
            <Input
              id="withdraw-account"
              name="account"
              dir="auto"
              required
              placeholder={hint.placeholder}
              defaultValue={last?.method === method ? last.account : undefined}
              key={method}
            />
            {errors.account && <p className="text-[13px] text-(--sys-red)">{errors.account}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="withdraw-note" className="text-[13px] font-medium text-muted-foreground">
              ملاحظة للإدارة (اختياري)
            </Label>
            <Textarea id="withdraw-note" name="note" rows={2} maxLength={500} />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <DialogClose asChild>
              <button type="button" className={cn(appleButton.tinted, "h-11 px-5")}>
                إلغاء
              </button>
            </DialogClose>
            <button type="submit" disabled={pending} className={cn(appleButton.filled, "h-11")}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {pending ? "بيتبعت…" : `اطلب ${amount}`}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Withdraws the rep's own open request. Cheap to redo, so no confirmation. */
export function CancelWithdrawalButton({ requestId }: { requestId: string }) {
  const { run, pending } = useAction();
  return (
    <button type="button" disabled={pending} onClick={() => run(() => cancelWithdrawalAction(requestId))} className={cn(appleButton.destructive, "shrink-0")}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      إلغاء الطلب
    </button>
  );
}
