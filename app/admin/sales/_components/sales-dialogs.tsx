"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import type { SalesCommissionStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
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
  createCommissionAdjustmentAction,
  createSalesRepAction,
  recordSalesPayoutAction,
  setSalesRepStatusAction,
  updateCommissionStatusAction,
  updateSalesRepAction,
  type SalesActionResult,
} from "@/actions/admin/sales.actions";
import { COMMISSION_ACTIONS, availableCommissionActions, type CommissionAction } from "@/lib/sales/workflow";
import { formatMoneyFromPiasters } from "@/lib/subscriptions";

/** Runs an admin sales action from a form: toast, refresh, field errors. */
function useSalesForm(action: (input: unknown) => Promise<SalesActionResult>, onDone?: () => void) {
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

function formValues(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();
  return Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
}

function Field({ label, name, error, children }: { label: string; name: string; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function SubmitRow({ pending, label, destructive }: { pending: boolean; label: string; destructive?: boolean }) {
  return (
    <DialogFooter>
      <Button type="submit" disabled={pending} variant={destructive ? "destructive" : "default"}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {label}
      </Button>
    </DialogFooter>
  );
}

// ─── Sales reps ─────────────────────────────────────────────────────────────

export function CreateRepDialog() {
  const [open, setOpen] = useState(false);
  const { submit, pending, errors } = useSalesForm(createSalesRepAction, () => setOpen(false));
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>إضافة مندوب</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>مندوب مبيعات جديد</DialogTitle>
          <DialogDescription>حساب جديد بصلاحية مبيعات بس — مالوش متجر. ابعتله البريد وكلمة المرور المؤقتة وهو يغيرها من &quot;نسيت كلمة المرور&quot;.</DialogDescription>
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
          <SubmitRow pending={pending} label="إنشاء الحساب" />
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditRepDialog({ rep }: { rep: { id: string; name: string | null; phone: string | null; notes: string | null } }) {
  const [open, setOpen] = useState(false);
  const { submit, pending, errors } = useSalesForm(updateSalesRepAction, () => setOpen(false));
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          تعديل البيانات
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تعديل بيانات المندوب</DialogTitle>
          <DialogDescription>البريد وكود الإحالة ثابتين ومينفعش يتغيروا.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => submit({ ...formValues(e), salesRepId: rep.id })}>
          <Field label="الاسم" name="name" error={errors.name}>
            <Input id="name" name="name" defaultValue={rep.name ?? ""} required />
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
        <Button variant={next === "DISABLED" ? "destructive" : "outline"} size="sm">
          {next === "DISABLED" ? "إيقاف الحساب" : "إعادة التفعيل"}
        </Button>
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
          <SubmitRow pending={pending} label="تأكيد" destructive={next === "DISABLED"} />
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
}: {
  reps: RepOption[];
  customerUserId?: string;
  currentRepId?: string;
  triggerLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [repId, setRepId] = useState("");
  const { submit, pending, errors } = useSalesForm(assignCustomerToSalesRepAction, () => setOpen(false));
  const choices = reps.filter((r) => r.id !== currentRepId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {triggerLabel}
        </Button>
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
          <SubmitRow pending={pending} label="تأكيد" />
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
  const canAdjust = status !== "REJECTED" && status !== "REVERSED";
  if (!actions.length && !canAdjust) return null;

  const current = dialog && dialog !== "adjust" ? COMMISSION_ACTIONS[dialog] : null;

  return (
    <>
      <DropdownMenu dir="rtl">
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="إجراءات العمولة">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {actions.map((a) => (
            <DropdownMenuItem key={a} onSelect={() => setDialog(a)}>
              {COMMISSION_ACTIONS[a].label}
            </DropdownMenuItem>
          ))}
          {canAdjust && (
            <>
              {actions.length > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem onSelect={() => setDialog("adjust")}>تسوية (+/−)</DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={!!current} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{current?.label} العمولة</DialogTitle>
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
            <SubmitRow pending={statusForm.pending} label="تأكيد" destructive={dialog === "reject" || dialog === "reverse"} />
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

// ─── Payouts ────────────────────────────────────────────────────────────────

export function RecordPayoutDialog({ salesRepId, repName, payable }: { salesRepId: string; repName: string; payable: number }) {
  const [open, setOpen] = useState(false);
  const { submit, pending, errors } = useSalesForm(recordSalesPayoutAction, () => setOpen(false));
  const today = new Date().toISOString().slice(0, 10);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={payable <= 0}>
          تسجيل صرف
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تسجيل صرف لـ {repName}</DialogTitle>
          <DialogDescription>
            سجّل التحويل بعد ما يتم فعلًا. هيتسوّى كل المستحق ({formatMoneyFromPiasters(payable)}) وكل العمولات المعتمدة هتتحول لـ &quot;مدفوعة&quot;.
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
