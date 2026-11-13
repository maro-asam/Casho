"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Banknote, Gift, Loader2, Minus, MoreHorizontal, Pencil, Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { SalesCommissionStatus } from "@prisma/client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  assignCustomerToSalesRepAction,
  cancelRepAdjustmentAction,
  createCommissionAdjustmentAction,
  createRepAdjustmentAction,
  createSalesRepAction,
  recordSalesPayoutAction,
  setSalesRepStatusAction,
  updateCommissionStatusAction,
  updateSalesRepAction,
  type SalesActionResult,
} from "@/actions/admin/sales.actions";
import { appleButton, appleMenu } from "@/components/saas-page";
import { COMMISSION_ACTIONS, availableCommissionActions, type CommissionAction } from "@/lib/sales/workflow";
import { formatMoneyFromPiasters } from "@/lib/subscriptions";
import { cn } from "@/lib/utils";

/** Runs an admin sales action from a form: toast, refresh, field errors. */
export function useSalesForm(action: (input: unknown) => Promise<SalesActionResult>, onDone?: () => void) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(input: Record<string, unknown>) {
    startTransition(async () => {
      try {
        const res = await action(input);
        setErrors(res.fieldErrors ?? {});
        if (!res.success) {
          toast.error(res.message);
          return;
        }
        toast.success(res.message);
        onDone?.();
        router.refresh();
      } catch {
        toast.error("مش مسموح أو حصلت مشكلة — جرّب تاني");
      }
    });
  }
  return { submit, pending, errors };
}

export function formValues(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();
  return Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
}

/** Label above a filled field; the error sits at the field, in red. */
export function Field({ label, name, error, children }: { label: string; name: string; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="text-[13px] font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
      {error && <p className="text-[13px] text-(--sys-red)">{error}</p>}
    </div>
  );
}

/** Dialog footer: Cancel leading, the verb trailing. Destructive confirmations fill red. */
export function SubmitRow({ pending, label, destructive }: { pending: boolean; label: string; destructive?: boolean }) {
  return (
    <DialogFooter className="gap-2 pt-2">
      <DialogClose asChild>
        <button type="button" className={cn(appleButton.tinted, "h-11 px-5")}>
          إلغاء
        </button>
      </DialogClose>
      <button
        type="submit"
        disabled={pending}
        className={destructive ? cn(appleButton.destructiveFilled, "h-11 px-5 text-[15px]") : cn(appleButton.filled, "h-11")}
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        {pending ? `${label}…` : label}
      </button>
    </DialogFooter>
  );
}

// ─── Sales reps ─────────────────────────────────────────────────────────────

/** `campaign` = the running campaign when it still has seats — offers to seat the new rep. */
export function CreateRepDialog({ campaign }: { campaign?: { name: string; seatsLeft: number } | null }) {
  const [open, setOpen] = useState(false);
  const [join, setJoin] = useState(true);
  const { submit, pending, errors } = useSalesForm(createSalesRepAction, () => setOpen(false));
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className={cn(appleButton.filled, "h-9 px-4")}>
          <Plus className="size-4" strokeWidth={2.4} />
          إضافة مندوب
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>مندوب مبيعات جديد</DialogTitle>
          <DialogDescription>
            حساب مبيعات بس — مالوش متجر. بعد الإنشاء ابعتله <strong>رابط الدخول</strong> من صفحته مع البريد وكلمة المرور المؤقتة (يقدر يغيرها من &quot;نسيت كلمة المرور&quot;). رابط الإحالة ده للتجار مش ليه.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => submit(formValues(e))}>
          <Field label="الاسم" name="name" error={errors.name}>
            <Input id="name" name="name" required />
          </Field>
          <Field label="البريد الإلكتروني" name="email" error={errors.email}>
            <Input id="email" name="email" type="email" dir="ltr" required />
          </Field>
          <Field label="الموبايل (اختياري)" name="phone" error={errors.phone}>
            <Input id="phone" name="phone" dir="ltr" placeholder="01xxxxxxxxx" />
          </Field>
          <Field label="كلمة مرور مؤقتة" name="password" error={errors.password}>
            <Input id="password" name="password" type="text" dir="ltr" required minLength={8} autoComplete="new-password" />
          </Field>
          <Field label="ملاحظات داخلية (اختياري)" name="notes" error={errors.notes}>
            <Textarea id="notes" name="notes" rows={2} />
          </Field>
          {campaign && campaign.seatsLeft > 0 && (
            <label className="flex cursor-pointer items-center gap-3 rounded-[12px] bg-(--fill-3) px-3.5 py-3">
              <span className="min-w-0 flex-1 text-[15px]">
                <span className="block font-medium">ضمّه لـ{campaign.name}</span>
                <span className="text-[13px] text-muted-foreground">
                  فاضل {campaign.seatsLeft} {campaign.seatsLeft === 1 ? "مكان" : "أماكن"} في العرض.
                </span>
              </span>
              <Switch checked={join} onCheckedChange={setJoin} aria-label={`ضمّه لـ${campaign.name}`} className="apple-switch" />
              {join && <input type="hidden" name="joinCampaign" value="on" />}
            </label>
          )}
          <SubmitRow pending={pending} label="إنشاء الحساب" />
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditRepDialog({
  rep,
}: {
  rep: { id: string; name: string | null; email: string; phone: string | null; notes: string | null };
}) {
  const [open, setOpen] = useState(false);
  const { submit, pending, errors } = useSalesForm(updateSalesRepAction, () => setOpen(false));
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className={cn(appleButton.tinted, "text-primary")}>
          <Pencil className="size-4" />
          تعديل البيانات
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تعديل بيانات المندوب</DialogTitle>
          <DialogDescription>
            لو غيّرت البريد، المندوب هيدخل بالبريد الجديد بنفس كلمة المرور من دلوقتي. كود الإحالة ثابت ومبيتغيرش.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => submit({ ...formValues(e), salesRepId: rep.id })}>
          <Field label="الاسم" name="name" error={errors.name}>
            <Input id="name" name="name" defaultValue={rep.name ?? ""} required />
          </Field>
          <Field label="البريد الإلكتروني (بيدخل بيه)" name="email" error={errors.email}>
            <Input id="email" name="email" type="email" dir="ltr" defaultValue={rep.email} required autoComplete="off" />
          </Field>
          <Field label="الموبايل" name="phone" error={errors.phone}>
            <Input id="phone" name="phone" dir="ltr" defaultValue={rep.phone ?? ""} />
          </Field>
          <Field label="ملاحظات داخلية" name="notes" error={errors.notes}>
            <Textarea id="notes" name="notes" rows={3} defaultValue={rep.notes ?? ""} />
          </Field>
          <SubmitRow pending={pending} label="حفظ" />
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RepStatusDialog({ salesRepId, status }: { salesRepId: string; status: "ACTIVE" | "DISABLED" }) {
  const [open, setOpen] = useState(false);
  const next = status === "ACTIVE" ? "DISABLED" : "ACTIVE";
  const { submit, pending, errors } = useSalesForm(setSalesRepStatusAction, () => setOpen(false));
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className={next === "DISABLED" ? appleButton.destructive : cn(appleButton.tinted, "text-primary")}>
          {next === "DISABLED" ? "إيقاف الحساب" : "إعادة التفعيل"}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{next === "DISABLED" ? "إيقاف المندوب" : "إعادة تفعيل المندوب"}</DialogTitle>
          <DialogDescription>
            {next === "DISABLED"
              ? "هيتقفل دخوله فورًا ورابط الإحالة هيبطل ينسب تسجيلات جديدة. عملاؤه وعمولاته السابقة محفوظة، وأي عمولة جديدة هتتسجل معلّقة لحد ما تقرر."
              : "هيقدر يدخل تاني ورابطه هيرجع يشتغل."}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => submit({ ...formValues(e), salesRepId, status: next })}>
          <Field label="السبب" name="reason" error={errors.reason}>
            <Textarea id="reason" name="reason" rows={2} required minLength={5} />
          </Field>
          <SubmitRow pending={pending} label={next === "DISABLED" ? "إيقاف الحساب" : "إعادة التفعيل"} destructive={next === "DISABLED"} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Attribution ────────────────────────────────────────────────────────────

type RepOption = { id: string; label: string };

export function AssignCustomerDialog({
  reps,
  customerUserId,
  currentRepId,
  triggerLabel,
  trigger = "inline",
}: {
  reps: RepOption[];
  customerUserId?: string;
  currentRepId?: string;
  triggerLabel: string;
  /** `page`: a gray capsule on the grouped background; `row`: a compact capsule in a list row; `inline`: inside a card. */
  trigger?: "page" | "row" | "inline";
}) {
  const [open, setOpen] = useState(false);
  const [repId, setRepId] = useState("");
  const { submit, pending, errors } = useSalesForm(assignCustomerToSalesRepAction, () => setOpen(false));
  const choices = reps.filter((r) => r.id !== currentRepId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={
            trigger === "page"
              ? cn(appleButton.gray, "text-primary")
              : trigger === "row"
                ? cn(appleButton.tinted, "h-8 px-3 text-[13px] text-primary")
                : cn(appleButton.tinted, "text-primary")
          }
        >
          {trigger === "page" ? <UserPlus className="size-4" /> : <ArrowLeftRight className="size-3.5" />}
          {triggerLabel}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{customerUserId ? "نقل العميل لمندوب تاني" : "نسب عميل لمندوب"}</DialogTitle>
          <DialogDescription>
            العمولات اللي اتسجلت قبل كده بتفضل مع المندوب اللي كسبها. الدفعات الجاية بس هي اللي هتتحسب للمندوب الجديد. القرار بيتسجل باسمك والسبب.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            const v = formValues(e);
            submit({ ...v, toSalesRepId: repId, ...(customerUserId ? { customerUserId } : { customerEmail: v.customerEmail }) });
          }}
        >
          {!customerUserId && (
            <Field label="بريد التاجر" name="customerEmail" error={errors.customerEmail}>
              <Input id="customerEmail" name="customerEmail" type="email" dir="ltr" required />
            </Field>
          )}
          <Field label="المندوب" name="toSalesRepId" error={errors.toSalesRepId}>
            <Select value={repId} onValueChange={setRepId} dir="rtl">
              <SelectTrigger id="toSalesRepId" className="w-full">
                <SelectValue placeholder="اختار مندوب نشط" />
              </SelectTrigger>
              <SelectContent>
                {choices.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="سبب القرار" name="reason" error={errors.reason}>
            <Textarea id="reason" name="reason" rows={3} required minLength={5} />
          </Field>
          <SubmitRow pending={pending} label={customerUserId ? "نقل العميل" : "نسب العميل"} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Commission review ──────────────────────────────────────────────────────

export function CommissionActions({ commissionId, status, net }: { commissionId: string; status: SalesCommissionStatus; net: number }) {
  const [dialog, setDialog] = useState<CommissionAction | "adjust" | null>(null);
  const close = () => setDialog(null);
  const statusForm = useSalesForm(updateCommissionStatusAction, close);
  const adjustForm = useSalesForm(createCommissionAdjustmentAction, close);
  const actions = availableCommissionActions(status);
  const isDestructive = (a: CommissionAction) => a === "reject" || a === "reverse";
  const destructive = actions.filter(isDestructive);
  const safe = actions.filter((a) => !isDestructive(a));
  const canAdjust = status !== "REJECTED" && status !== "REVERSED";
  if (!actions.length && !canAdjust) return null;

  const current = dialog && dialog !== "adjust" ? COMMISSION_ACTIONS[dialog] : null;

  return (
    <>
      <DropdownMenu dir="rtl">
        <DropdownMenuTrigger asChild>
          <button type="button" aria-label="إجراءات العمولة" className={appleButton.more}>
            <MoreHorizontal className="size-[18px]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={appleMenu}>
          {/* Safe changes first, then the adjustment, destructive ones last behind a separator. */}
          {safe.map((a) => (
            <DropdownMenuItem key={a} onSelect={() => setDialog(a)}>
              {COMMISSION_ACTIONS[a].label}
            </DropdownMenuItem>
          ))}
          {canAdjust && <DropdownMenuItem onSelect={() => setDialog("adjust")}>تسوية (+/−)</DropdownMenuItem>}
          {destructive.length > 0 && (safe.length > 0 || canAdjust) && <DropdownMenuSeparator />}
          {destructive.map((a) => (
            <DropdownMenuItem key={a} variant="destructive" onSelect={() => setDialog(a)}>
              {a === "reverse" ? "إلغاء العمولة" : COMMISSION_ACTIONS[a].label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={!!current} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog === "reverse" ? "إلغاء العمولة" : `${current?.label ?? ""} العمولة`}</DialogTitle>
            <DialogDescription>
              {dialog === "reverse"
                ? "العمولة هتتلغي وتفضل في السجل. العمولة المدفوعة مينفعش تتلغي — استخدم تسوية بالسالب وهتتخصم من الصرف الجاي."
                : "التغيير بيتسجل باسمك في سجل الإجراءات."}
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => statusForm.submit({ ...formValues(e), commissionId, action: dialog })}>
            <Field label={current?.reasonRequired ? "السبب" : "ملاحظة (اختياري)"} name="reason" error={statusForm.errors.reason}>
              <Textarea id="reason" name="reason" rows={2} required={current?.reasonRequired} minLength={current?.reasonRequired ? 5 : undefined} />
            </Field>
            <SubmitRow
              pending={statusForm.pending}
              label={dialog === "reverse" ? "إلغاء العمولة" : current ? `${current.label} العمولة` : "تأكيد"}
              destructive={dialog === "reject" || dialog === "reverse"}
            />
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "adjust"} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تسوية على العمولة</DialogTitle>
            <DialogDescription>
              الصافي الحالي {formatMoneyFromPiasters(net)}. اكتب مبلغ موجب للإضافة أو سالب للخصم — الصافي مينفعش يقل عن صفر. العمولة الأصلية بتفضل زي ما هي.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => adjustForm.submit({ ...formValues(e), commissionId })}>
            <Field label="المبلغ بالجنيه" name="amountEgp" error={adjustForm.errors.amountEgp}>
              <Input id="amountEgp" name="amountEgp" type="number" step="0.01" dir="ltr" required />
            </Field>
            <Field label="السبب" name="reason" error={adjustForm.errors.reason}>
              <Textarea id="reason" name="reason" rows={2} required minLength={5} />
            </Field>
            <SubmitRow pending={adjustForm.pending} label="تسجيل التسوية" />
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Bonuses & deductions ───────────────────────────────────────────────────

const REP_ADJUSTMENT_COPY = {
  BONUS: {
    trigger: "مكافأة",
    title: "مكافأة لـ",
    description: "هتتضاف على المستحق وتتصرف مع التحويل الجاي. المندوب هيشوفها في صفحة عمولاته بالسبب اللي هتكتبه.",
    submit: "إضافة المكافأة",
  },
  DEDUCTION: {
    trigger: "خصم",
    title: "خصم من ",
    description: "هيتخصم من المستحق في التحويل الجاي — ولو أكبر من المستحق دلوقتي، الباقي بيتخصم من اللي بعده. المندوب هيشوف الخصم والسبب.",
    submit: "تسجيل الخصم",
  },
} as const;

/** Adds a bonus or a deduction to the rep's account — one trigger per kind. */
export function RepAdjustmentDialog({ salesRepId, repName, kind }: { salesRepId: string; repName: string; kind: "BONUS" | "DEDUCTION" }) {
  const [open, setOpen] = useState(false);
  const { submit, pending, errors } = useSalesForm(createRepAdjustmentAction, () => setOpen(false));
  const copy = REP_ADJUSTMENT_COPY[kind];
  const bonus = kind === "BONUS";
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className={bonus ? cn(appleButton.tinted, "text-primary") : appleButton.destructive}>
          {bonus ? <Gift className="size-4" /> : <Minus className="size-4" strokeWidth={2.4} />}
          {copy.trigger}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {copy.title}
            {repName}
          </DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => submit({ ...formValues(e), salesRepId, kind })}>
          <Field label="المبلغ بالجنيه" name="amountEgp" error={errors.amountEgp}>
            <Input id="amountEgp" name="amountEgp" type="number" min="0.01" step="0.01" inputMode="decimal" dir="ltr" required />
          </Field>
          <Field label="السبب (المندوب هيشوفه)" name="reason" error={errors.reason}>
            <Textarea
              id="reason"
              name="reason"
              rows={2}
              required
              minLength={5}
              placeholder={bonus ? "مثلاً: أفضل مندوب في الشهر" : "مثلاً: سلفة اتصرفت مقدمًا"}
            />
          </Field>
          <SubmitRow pending={pending} label={copy.submit} destructive={!bonus} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Cancels a bonus/deduction no payout has settled yet. */
export function CancelRepAdjustmentButton({ adjustmentId, kind }: { adjustmentId: string; kind: "BONUS" | "DEDUCTION" }) {
  const [open, setOpen] = useState(false);
  const { submit, pending, errors } = useSalesForm(cancelRepAdjustmentAction, () => setOpen(false));
  const label = kind === "BONUS" ? "إلغاء المكافأة" : "إلغاء الخصم";
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className={cn(appleButton.tinted, "h-8 shrink-0 px-3 text-[13px]")}>
          إلغاء
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>هيطلع من المستحق ويفضل في السجل كملغي. المندوب هيشوفه ملغي بالسبب.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => submit({ ...formValues(e), adjustmentId })}>
          <Field label="السبب" name="reason" error={errors.reason}>
            <Textarea id="reason" name="reason" rows={2} required minLength={5} />
          </Field>
          <SubmitRow pending={pending} label={label} destructive />
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Payouts ────────────────────────────────────────────────────────────────

export function RecordPayoutDialog({ salesRepId, repName, payable }: { salesRepId: string; repName: string; payable: number }) {
  const [open, setOpen] = useState(false);
  const { submit, pending, errors } = useSalesForm(recordSalesPayoutAction, () => setOpen(false));
  const today = new Date().toISOString().slice(0, 10);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" disabled={payable <= 0} className={cn(appleButton.tinted, "text-primary")}>
          <Banknote className="size-4" />
          تسجيل صرف
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تسجيل صرف لـ {repName}</DialogTitle>
          <DialogDescription>
            سجّل التحويل بعد ما يتم فعلًا. هيتسوّى كل المستحق ({formatMoneyFromPiasters(payable)}) — العمولات المعتمدة هتتحول لـ &quot;مدفوعة&quot;، والمكافآت والخصومات المفتوحة هتتقفل معاه.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => submit({ ...formValues(e), salesRepId, expectedTotal: payable })}>
          <Field label="تاريخ التحويل" name="paidAt" error={errors.paidAt}>
            <Input id="paidAt" name="paidAt" type="date" dir="ltr" defaultValue={today} max={today} required />
          </Field>
          <Field label="طريقة الدفع" name="method" error={errors.method}>
            <Input id="method" name="method" placeholder="تحويل بنكي / فودافون كاش / إنستا باي" required />
          </Field>
          <Field label="رقم مرجعي للتحويل" name="reference" error={errors.reference}>
            <Input id="reference" name="reference" dir="ltr" />
          </Field>
          <Field label="ملاحظة" name="note" error={errors.note}>
            <Textarea id="note" name="note" rows={2} />
          </Field>
          <SubmitRow pending={pending} label={`تأكيد صرف ${formatMoneyFromPiasters(payable)}`} />
        </form>
      </DialogContent>
    </Dialog>
  );
}
