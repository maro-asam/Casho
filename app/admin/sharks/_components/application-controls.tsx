"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { SharksApplicationStatus } from "@prisma/client";

import {
  addSharksNoteAction,
  addSharksProgressNoteAction,
  createSharksStoryAction,
  recordSharksInterviewAction,
  saveSharksEvaluationAction,
  setSharksApplicationStatusAction,
} from "@/actions/admin/sharks.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { APPLICATION_STATUS, RUBRIC, type RubricKey } from "@/lib/sharks/catalog";
import { FieldError, useSharksAction } from "./use-sharks-action";

/* ── Status ──────────────────────────────────────────────────────────────── */

const DECISIONS: SharksApplicationStatus[] = ["ACCEPTED", "WAITLISTED", "REJECTED"];

/** One button per allowed next status; each opens a dialog with the applicant-visible message. */
export function StatusControls({ applicationId, next }: { applicationId: string; next: SharksApplicationStatus[] }) {
  const [target, setTarget] = useState<SharksApplicationStatus | null>(null);
  const [message, setMessage] = useState("");
  const { run, pending, errors } = useSharksAction(setSharksApplicationStatusAction, () => {
    setTarget(null);
    setMessage("");
  });

  if (next.length === 0) return <p className="text-sm text-muted-foreground">مفيش انتقالات متاحة من الحالة دي.</p>;
  const needsMessage = target === "INFO_REQUESTED";

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {next.map((s) => (
          <Button key={s} type="button" size="sm" variant={s === "ACCEPTED" ? "default" : s === "REJECTED" ? "outline" : "secondary"} onClick={() => setTarget(s)}>
            {s === "INFO_REQUESTED" ? "اطلب معلومات" : APPLICATION_STATUS[s].ar}
          </Button>
        ))}
      </div>
      <Dialog open={!!target} onOpenChange={(o) => !pending && !o && setTarget(null)}>
        <DialogContent dir="rtl">
          {target && (
            <>
              <DialogHeader>
                <DialogTitle>{needsMessage ? "اطلب معلومات من التاجر" : `تحويل الطلب لـ «${APPLICATION_STATUS[target].ar}»`}</DialogTitle>
                <DialogDescription>
                  {DECISIONS.includes(target)
                    ? "ده قرار — هيتسجل باسمك ووقته، والتاجر هيوصله إشعار. القبول مش بيعمل أي التزام مالي، ولا بينشر أي حاجة."
                    : "التاجر هيوصله إشعار بالحالة الجديدة."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="status-message">{needsMessage ? "السؤال (هيظهر للتاجر)" : "رسالة للتاجر (اختياري — هتظهر له)"}</Label>
                <Textarea id="status-message" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} />
                <FieldError message={errors.message} />
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setTarget(null)} disabled={pending}>
                  رجوع
                </Button>
                <Button onClick={() => run({ applicationId, status: target, message })} disabled={pending || (needsMessage && message.trim().length < 2)}>
                  {pending && <Loader2 className="size-4 animate-spin" />}
                  تأكيد
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ── Evaluation ──────────────────────────────────────────────────────────── */

export function EvaluationForm({ applicationId, initial }: { applicationId: string; initial: (Record<RubricKey, number> & { notes: string | null }) | null }) {
  const [scores, setScores] = useState<Record<string, string>>(() => Object.fromEntries(RUBRIC.map((c) => [c.key, initial ? String(initial[c.key]) : ""])));
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const { run, pending, errors } = useSharksAction(saveSharksEvaluationAction);
  const total = RUBRIC.reduce((s, c) => s + (Number(scores[c.key]) || 0), 0);

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        run({ applicationId, ...scores, notes });
      }}
    >
      {RUBRIC.map((c) => (
        <div key={c.key} className="grid grid-cols-[1fr_auto] items-center gap-3">
          <Label htmlFor={`score-${c.key}`} className="text-sm font-normal leading-snug">
            {c.ar}
          </Label>
          <div className="flex items-center gap-1.5">
            <Input
              id={`score-${c.key}`}
              type="number"
              inputMode="numeric"
              min={0}
              max={c.max}
              value={scores[c.key]}
              onChange={(e) => setScores((s) => ({ ...s, [c.key]: e.target.value }))}
              className="h-9 w-16 text-center tabular-nums"
              aria-invalid={errors[c.key] ? true : undefined}
            />
            <span className="w-8 text-xs text-muted-foreground tabular-nums">/ {c.max}</span>
          </div>
          {errors[c.key] && <FieldError message={errors[c.key]} />}
        </div>
      ))}
      <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
        <span className="text-muted-foreground">الإجمالي</span>
        <span className="text-lg font-bold tabular-nums">{total} / 100</span>
      </div>
      <Textarea placeholder="ملاحظات التقييم (داخلية)" aria-label="ملاحظات التقييم" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      <p className="text-xs text-muted-foreground">التقييم أداة مساعدة للفريق، مش قرار تلقائي. التاجر مش بيشوفه.</p>
      <Button type="submit" size="sm" disabled={pending} className="w-full">
        {pending && <Loader2 className="size-4 animate-spin" />}
        {initial ? "حدّث تقييمك" : "سجّل تقييمك"}
      </Button>
    </form>
  );
}

/* ── Interview ───────────────────────────────────────────────────────────── */

function toLocalInput(d: Date | null) {
  if (!d) return "";
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

export function InterviewForm({ applicationId, at, location }: { applicationId: string; at: Date | null; location: string | null }) {
  const [when, setWhen] = useState(toLocalInput(at));
  const [where, setWhere] = useState(location ?? "");
  const [notes, setNotes] = useState("");
  const { run, pending, errors } = useSharksAction(recordSharksInterviewAction, () => setNotes(""));

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        run({ applicationId, interviewAt: when ? new Date(when).toISOString() : "", interviewLocation: where, notes });
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="iv-at">الميعاد</Label>
        <Input id="iv-at" type="datetime-local" dir="ltr" value={when} onChange={(e) => setWhen(e.target.value)} />
        <FieldError message={errors.interviewAt} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="iv-where">المكان أو الوسيلة</Label>
        <Input id="iv-where" placeholder="مكالمة واتساب، Google Meet…" value={where} onChange={(e) => setWhere(e.target.value)} />
      </div>
      <Textarea placeholder="ملاحظات المقابلة (داخلية)" aria-label="ملاحظات المقابلة" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      <Button type="submit" size="sm" variant="secondary" disabled={pending} className="w-full">
        {pending && <Loader2 className="size-4 animate-spin" />}
        سجّل المقابلة
      </Button>
    </form>
  );
}

/* ── Notes ───────────────────────────────────────────────────────────────── */

export function NoteForm({ applicationId, kind = "note" }: { applicationId: string; kind?: "note" | "progress" }) {
  const [message, setMessage] = useState("");
  const { run, pending, errors } = useSharksAction(kind === "note" ? addSharksNoteAction : addSharksProgressNoteAction, () => setMessage(""));
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        run({ applicationId, message });
      }}
    >
      <Textarea
        aria-label={kind === "note" ? "ملاحظة داخلية" : "تحديث على التنفيذ"}
        placeholder={kind === "note" ? "ملاحظة داخلية — التاجر مش بيشوفها" : "اتعمل إيه؟ إيه اللي جاي؟"}
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <FieldError message={errors.message} />
      <Button type="submit" size="sm" variant="secondary" disabled={pending || message.trim().length < 2}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {kind === "note" ? "أضف ملاحظة" : "سجّل التحديث"}
      </Button>
    </form>
  );
}

export function CreateStoryButton({ applicationId }: { applicationId: string }) {
  const { run, pending } = useSharksAction(createSharksStoryAction, (res) => {
    if (res.id) window.location.assign(`/admin/sharks/stories/${res.id}`);
  });
  return (
    <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={() => run({ applicationId })}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      اقترح قصة
    </Button>
  );
}
