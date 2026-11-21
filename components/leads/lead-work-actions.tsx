"use client";

import { useState } from "react";
import type { LeadStatus } from "@prisma/client";
import { CalendarClock, CalendarPlus, Check, ChevronDown, Mail, MessageCircle, MoreHorizontal, NotebookPen, Phone, Presentation, Users, X, type LucideIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { appleButton, appleMenu } from "@/components/saas-page";
import {
  cancelLeadFollowUpAction,
  changeLeadStatusAction,
  completeLeadFollowUpAction,
  logLeadInteractionAction,
  rescheduleLeadFollowUpAction,
  scheduleLeadFollowUpAction,
} from "@/actions/leads/lead-work.actions";
import { ACTIVITY_LABELS, LOST_REASONS, REACHABLE_INTERACTIONS, STATUS_META, type InteractionType } from "@/lib/leads/constants";
import { cn } from "@/lib/utils";
import { DueAtInput, Field, SubmitRow, formValues, useLeadAction } from "./form-kit";

// ─── Status ─────────────────────────────────────────────────────────────────

export function LostReasonFields({ errors }: { errors: Record<string, string> }) {
  const [reason, setReason] = useState("");
  return (
    <>
      <Field label="ليه خسرناه؟" name="lostReason" error={errors.lostReason}>
        <Select name="lostReason" value={reason} onValueChange={setReason} dir="rtl">
          <SelectTrigger id="lostReason" className="h-11 w-full rounded-[10px]">
            <SelectValue placeholder="اختار السبب" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(LOST_REASONS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label={reason === "OTHER" ? "اكتب السبب" : "تفاصيل (اختياري)"} name="lostNote" error={errors.lostNote}>
        <Input id="lostNote" name="lostNote" maxLength={300} required={reason === "OTHER"} />
      </Field>
    </>
  );
}

/** Pick a status; LOST asks for the reason. `targets` = what this actor may choose. */
export function StatusChanger({ leadId, current, targets }: { leadId: string; current: LeadStatus; targets: LeadStatus[] }) {
  const [lostOpen, setLostOpen] = useState(false);
  const quick = useLeadAction(changeLeadStatusAction);
  const lost = useLeadAction(changeLeadStatusAction, () => setLostOpen(false));
  const options = targets.filter((s) => s !== current);
  if (options.length === 0) return null;

  return (
    <>
      <DropdownMenu dir="rtl" modal={false}>
        <DropdownMenuTrigger asChild>
          <button type="button" disabled={quick.pending} className={cn(appleButton.tinted, "text-primary")}>
            غيّر الحالة
            <ChevronDown className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={appleMenu}>
          {options.map((s) => (
            <DropdownMenuItem
              key={s}
              variant={s === "LOST" ? "destructive" : "default"}
              onSelect={() => (s === "LOST" ? setLostOpen(true) : quick.submit({ leadId, status: s }))}
            >
              {STATUS_META[s].label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={lostOpen} onOpenChange={setLostOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>خسرنا الليد ده؟</DialogTitle>
            <DialogDescription>السبب بيتسجل في تاريخ الليد وبيبان في التقارير. المتابعات المفتوحة بتتلغي.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => lost.submit({ ...formValues(e), leadId, status: "LOST" })}>
            <LostReasonFields errors={lost.errors} />
            <SubmitRow pending={lost.pending} label="سجّل الخسارة" destructive />
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Interactions ───────────────────────────────────────────────────────────

const INTERACTION_ICONS: Record<InteractionType, LucideIcon> = {
  CALL: Phone,
  WHATSAPP: MessageCircle,
  EMAIL: Mail,
  MEETING: Users,
  DEMO: Presentation,
  NOTE: NotebookPen,
};

const INTERACTION_TITLES: Record<InteractionType, string> = {
  CALL: "سجّل مكالمة",
  WHATSAPP: "سجّل رسالة واتساب",
  EMAIL: "سجّل إيميل",
  MEETING: "سجّل مقابلة",
  DEMO: "سجّل ديمو",
  NOTE: "ملاحظة جديدة",
};

function InteractionDialog({ leadId, type, open, onOpenChange }: { leadId: string; type: InteractionType; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [reached, setReached] = useState<"yes" | "no">("yes");
  const { submit, pending, errors } = useLeadAction(logLeadInteractionAction, () => onOpenChange(false));
  const reachable = REACHABLE_INTERACTIONS.includes(type);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{INTERACTION_TITLES[type]}</DialogTitle>
          <DialogDescription>
            {type === "NOTE" ? "الملاحظة بتظهر في تاريخ الليد لك وللإدارة." : "بيتسجل في تاريخ الليد بالوقت واسمك، وبيحرّك الحالة لقدام لو لسه في الأول."}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => submit({ ...formValues(e), leadId, type, reached: reachable ? reached : "" })}>
          {reachable && (
            <div role="radiogroup" aria-label="رد؟" className="grid grid-cols-2 gap-2">
              {(
                [
                  ["yes", type === "EMAIL" ? "ردّ" : "ردّ واتكلمنا"],
                  ["no", type === "CALL" ? "مردّش / مشغول" : "مردّش لسه"],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={reached === v}
                  onClick={() => setReached(v)}
                  className={cn(
                    "h-11 rounded-[12px] text-[15px] transition-colors",
                    reached === v ? "bg-primary text-primary-foreground font-semibold" : "bg-(--fill-3) text-foreground/80",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          <Field label={type === "NOTE" ? "الملاحظة" : "إيه اللي حصل؟ (اختياري)"} name="description" error={errors.description}>
            <Textarea id="description" name="description" rows={4} maxLength={1000} required={type === "NOTE"} />
          </Field>
          <SubmitRow pending={pending} label="سجّل" />
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** "Log" bar: one tap per interaction type. */
export function InteractionBar({ leadId }: { leadId: string }) {
  const [open, setOpen] = useState<InteractionType | null>(null);
  const types: InteractionType[] = ["CALL", "WHATSAPP", "EMAIL", "MEETING", "DEMO", "NOTE"];
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {types.map((t) => {
          const Icon = INTERACTION_ICONS[t];
          return (
            <button key={t} type="button" onClick={() => setOpen(t)} className={cn(appleButton.tinted, "gap-1.5")}>
              <Icon className="size-4 text-primary" strokeWidth={2} />
              {ACTIVITY_LABELS[t]}
            </button>
          );
        })}
      </div>
      {open && <InteractionDialog leadId={leadId} type={open} open onOpenChange={(o) => !o && setOpen(null)} />}
    </>
  );
}

// ─── Follow-ups ─────────────────────────────────────────────────────────────

export function ScheduleFollowUpDialog({ leadId, trigger = "button" }: { leadId: string; trigger?: "button" | "plain" }) {
  const [open, setOpen] = useState(false);
  const { submit, pending, errors } = useLeadAction(scheduleLeadFollowUpAction, () => setOpen(false));
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className={trigger === "plain" ? appleButton.plain : cn(appleButton.tinted, "text-primary")}>
          <CalendarPlus className="size-4" />
          حدّد متابعة
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>متابعة جديدة</DialogTitle>
          <DialogDescription>هيوصل تنبيه للمندوب قبل الميعاد بساعة (الجرس + الإيميل).</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            const v = formValues(e);
            submit({ leadId, dueAt: v.dueAtIso, note: v.note });
          }}
        >
          <DueAtInput name="dueAt" error={errors.dueAt} />
          <Field label="هتتكلموا في إيه؟ (اختياري)" name="note" error={errors.note}>
            <Textarea id="note" name="note" rows={3} maxLength={500} />
          </Field>
          <SubmitRow pending={pending} label="حدّد" />
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CompleteFollowUpDialog({ followUpId, compact = false }: { followUpId: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [scheduleNext, setScheduleNext] = useState(false);
  const { submit, pending, errors } = useLeadAction(completeLeadFollowUpAction, () => setOpen(false));
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" aria-label="خلصت المتابعة" className={compact ? cn(appleButton.tinted, "size-9 px-0 text-(--sys-green)") : cn(appleButton.tinted, "text-(--sys-green)")}>
          <Check className="size-4" strokeWidth={2.4} />
          {!compact && "خلصت"}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>المتابعة خلصت</DialogTitle>
          <DialogDescription>اكتب النتيجة باختصار — وتقدر تحدد اللي بعدها على طول.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            const v = formValues(e);
            submit({ followUpId, outcome: v.outcome, nextDueAt: scheduleNext ? v.nextDueAtIso : "", nextNote: v.nextNote });
          }}
        >
          <Field label="النتيجة (اختياري)" name="outcome" error={errors.outcome}>
            <Textarea id="outcome" name="outcome" rows={3} maxLength={500} />
          </Field>
          <label className="flex cursor-pointer items-center gap-3 rounded-[12px] bg-(--fill-3) px-3.5 py-3 text-[15px]">
            <input type="checkbox" checked={scheduleNext} onChange={(e) => setScheduleNext(e.target.checked)} className="size-4 accent-(--primary)" />
            حدّد المتابعة اللي بعدها
          </label>
          {scheduleNext && (
            <>
              <DueAtInput name="nextDueAt" error={errors.nextDueAt} label="ميعاد المتابعة الجاية" />
              <Field label="ملاحظة للمتابعة الجاية (اختياري)" name="nextNote">
                <Input id="nextNote" name="nextNote" maxLength={500} />
              </Field>
            </>
          )}
          <SubmitRow pending={pending} label="خلّصها" />
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** ⋯ on a pending follow-up: reschedule or cancel. */
export function FollowUpMenu({ followUpId, dueAt }: { followUpId: string; dueAt: Date }) {
  const [mode, setMode] = useState<"reschedule" | "cancel" | null>(null);
  const [defaultDue, setDefaultDue] = useState<Date | undefined>(undefined);
  const resched = useLeadAction(rescheduleLeadFollowUpAction, () => setMode(null));
  const cancel = useLeadAction(cancelLeadFollowUpAction, () => setMode(null));
  return (
    <>
      <DropdownMenu dir="rtl" modal={false}>
        <DropdownMenuTrigger asChild>
          <button type="button" aria-label="خيارات المتابعة" className={appleButton.more}>
            <MoreHorizontal className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={appleMenu}>
          <DropdownMenuItem
            onSelect={() => {
              // An overdue follow-up starts from the quick picks, not from its past time.
              setDefaultDue(dueAt.getTime() > Date.now() ? dueAt : undefined);
              setMode("reschedule");
            }}
          >
            <CalendarClock />
            أجّلها
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setMode("cancel")}>
            <X />
            الغيها
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={mode !== null} onOpenChange={(o) => !o && setMode(null)}>
        <DialogContent>
          {mode === "reschedule" ? (
            <>
              <DialogHeader>
                <DialogTitle>ميعاد جديد للمتابعة</DialogTitle>
                <DialogDescription>التنبيه بيتبعت تاني قبل الميعاد الجديد بساعة.</DialogDescription>
              </DialogHeader>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  const v = formValues(e);
                  resched.submit({ followUpId, dueAt: v.dueAtIso, reason: v.reason });
                }}
              >
                <DueAtInput name="dueAt" defaultValue={defaultDue} error={resched.errors.dueAt} />
                <Field label="السبب (اختياري)" name="reason">
                  <Input id="reason" name="reason" maxLength={300} />
                </Field>
                <SubmitRow pending={resched.pending} label="أجّل" />
              </form>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>تلغي المتابعة دي؟</DialogTitle>
                <DialogDescription>بتفضل في تاريخ الليد على إنها اتلغت.</DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={(e) => cancel.submit({ ...formValues(e), followUpId })}>
                <Field label="السبب (اختياري)" name="reason">
                  <Input id="reason" name="reason" maxLength={300} />
                </Field>
                <SubmitRow pending={cancel.pending} label="الغيها" destructive />
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
