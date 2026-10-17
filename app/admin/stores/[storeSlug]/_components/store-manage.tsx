"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Layers, Loader2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  adminAdjustStoreBalanceAction,
  adminAssignStorePlanAction,
  adminExtendStoreSubscriptionAction,
  adminTopUpStoreBalanceAction,
} from "@/actions/admin/admin-store.actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fmtMoney } from "../../../_lib/format";

type Result = { success: boolean; message: string };

/** Shared submit plumbing: pending state, toast, refresh, optional reset. */
function useSubmit() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const submit = (fn: () => Promise<Result>, onSuccess?: () => void) =>
    start(async () => {
      try {
        const result = await fn();
        if (result.success) {
          toast.success(result.message);
          onSuccess?.();
          router.refresh();
        } else toast.error(result.message);
      } catch {
        toast.error("حصل خطأ، جرّب تاني");
      }
    });
  return { pending, submit };
}

/** "150.5" EGP → 15050 piasters; NaN when not a positive amount with ≤2 decimals. */
function toPiasters(value: string) {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) return NaN;
  return Math.round(Number(value) * 100);
}

export function BalanceForm({ storeId, balance }: { storeId: string; balance: number }) {
  const [mode, setMode] = useState<"topup" | "add" | "deduct">("topup");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const { pending, submit } = useSubmit();

  const piasters = toPiasters(amount);
  const valid = Number.isFinite(piasters) && piasters > 0 && (mode !== "deduct" || piasters <= balance);
  const after = valid ? balance + (mode === "deduct" ? -piasters : piasters) : null;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    submit(
      () =>
        mode === "topup"
          ? adminTopUpStoreBalanceAction({ storeId, amount: piasters, note })
          : adminAdjustStoreBalanceAction({ storeId, amount: mode === "deduct" ? -piasters : piasters, note }),
      () => {
        setAmount("");
        setNote("");
      },
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)} dir="rtl">
        <TabsList className="w-full">
          <TabsTrigger value="topup" className="flex-1 text-xs">
            شحن رصيد
          </TabsTrigger>
          <TabsTrigger value="add" className="flex-1 text-xs">
            إضافة تعويض
          </TabsTrigger>
          <TabsTrigger value="deduct" className="flex-1 text-xs">
            خصم
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <p className="text-xs leading-5 text-muted-foreground">
        {mode === "topup"
          ? "بيتسجّل كـ«شحن» وبيحاول يجدد الاشتراك لو منتهي. استخدمه للتحويلات اللي اتأكدت خارج النظام."
          : mode === "add"
            ? "تعديل يدوي بالزيادة (تعويض، تصحيح خطأ). مش بيتحسب كإيراد شحن."
            : "تعديل يدوي بالنقص. مينفعش الرصيد يبقى سالب."}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="balance-amount">المبلغ (جنيه)</Label>
          <Input
            id="balance-amount"
            inputMode="decimal"
            dir="ltr"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-invalid={amount !== "" && !valid}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="balance-note">ملاحظة (بتظهر في سجل التاجر)</Label>
          <Input id="balance-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="مثال: تحويل إنستا باي رقم ..." />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {amount !== "" && !valid
            ? mode === "deduct" && Number.isFinite(piasters) && piasters > balance
              ? "المبلغ أكبر من الرصيد الحالي."
              : "اكتب مبلغ صحيح (رقم موجب، لحد قرشين عشريين)."
            : after !== null
              ? `الرصيد بعد العملية: ${fmtMoney(after)}`
              : `الرصيد الحالي: ${fmtMoney(balance)}`}
        </p>
        <Button type="submit" size="sm" disabled={!valid || pending} variant={mode === "deduct" ? "destructive" : "default"}>
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : mode === "deduct" ? <Minus className="size-3.5" /> : <Plus className="size-3.5" />}
          {mode === "topup" ? "اشحن" : mode === "add" ? "أضف" : "اخصم"}
        </Button>
      </div>
    </form>
  );
}

function FormDialog({
  trigger,
  title,
  description,
  children,
  submitLabel,
  canSubmit,
  pending,
  onSubmit,
  open,
  onOpenChange,
}: {
  trigger: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
  submitLabel: string;
  canSubmit: boolean;
  pending: boolean;
  onSubmit: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) onSubmit();
          }}
          className="space-y-4"
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {children}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              رجوع
            </Button>
            <Button type="submit" disabled={!canSubmit || pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ExtendSubscriptionDialog({ storeId }: { storeId: string }) {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState("30");
  const [note, setNote] = useState("");
  const { pending, submit } = useSubmit();
  const n = Number(days);
  const valid = Number.isInteger(n) && n >= 1 && n <= 366;

  return (
    <FormDialog
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button variant="outline" size="sm">
          <CalendarPlus className="size-3.5" />
          مد مجاني
        </Button>
      }
      title="مد الاشتراك مجانًا"
      description="الأيام بتتضاف على نهاية الفترة الحالية (أو من النهارده لو منتهية) والمتجر بيتفعل. مفيش خصم من الرصيد."
      submitLabel="مد الاشتراك"
      canSubmit={valid}
      pending={pending}
      onSubmit={() => submit(() => adminExtendStoreSubscriptionAction({ storeId, days: n, note }), () => setOpen(false))}
    >
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {[7, 14, 30, 90].map((d) => (
            <Button key={d} type="button" size="sm" variant={days === String(d) ? "default" : "outline"} onClick={() => setDays(String(d))}>
              {d} يوم
            </Button>
          ))}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="extend-days">عدد الأيام</Label>
          <Input id="extend-days" inputMode="numeric" dir="ltr" value={days} onChange={(e) => setDays(e.target.value)} aria-invalid={!valid} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="extend-note">السبب (للسجل الداخلي)</Label>
          <Input id="extend-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="تعويض عن عطل، عرض خاص…" />
        </div>
      </div>
    </FormDialog>
  );
}

export function AssignPlanDialog({
  storeId,
  plans,
  currentPlanId,
  currentCycle,
}: {
  storeId: string;
  plans: { id: string; name: string; monthlyPrice: number; yearlyPrice: number; isActive: boolean }[];
  currentPlanId: string | null;
  currentCycle: "MONTHLY" | "YEARLY";
}) {
  const [open, setOpen] = useState(false);
  const [planId, setPlanId] = useState(currentPlanId ?? plans[0]?.id ?? "");
  const [cycle, setCycle] = useState<"MONTHLY" | "YEARLY">(currentCycle);
  const { pending, submit } = useSubmit();
  const plan = plans.find((p) => p.id === planId);
  const unchanged = planId === currentPlanId && cycle === currentCycle;

  return (
    <FormDialog
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button variant="outline" size="sm">
          <Layers className="size-3.5" />
          تغيير الباقة
        </Button>
      }
      title="تغيير باقة المتجر"
      description="التغيير بيسري فورًا على المميزات، والسعر الجديد بيتخصم من التجديد الجاي. مفيش خصم دلوقتي."
      submitLabel="حفظ الباقة"
      canSubmit={!!plan && !unchanged}
      pending={pending}
      onSubmit={() => submit(() => adminAssignStorePlanAction({ storeId, planId, billingCycle: cycle }), () => setOpen(false))}
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>الباقة</Label>
          <Select value={planId} onValueChange={setPlanId} dir="rtl">
            <SelectTrigger className="w-full">
              <SelectValue placeholder="اختار باقة" />
            </SelectTrigger>
            <SelectContent>
              {plans.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                  {!p.isActive && " (معطّلة)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>دورة الدفع</Label>
          <Tabs value={cycle} onValueChange={(v) => setCycle(v as typeof cycle)} dir="rtl">
            <TabsList className="w-full">
              <TabsTrigger value="MONTHLY" className="flex-1">
                شهري {plan && `· ${fmtMoney(plan.monthlyPrice)}`}
              </TabsTrigger>
              <TabsTrigger value="YEARLY" className="flex-1">
                سنوي {plan && `· ${fmtMoney(plan.yearlyPrice)}`}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    </FormDialog>
  );
}
