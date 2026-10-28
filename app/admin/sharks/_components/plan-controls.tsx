"use client";

import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import type { SharksPlanStatus, SharksTaskStatus, SharksTrack } from "@prisma/client";

import { addSharksTaskAction, saveSharksPlanAction, setSharksTaskStatusAction } from "@/actions/admin/sharks.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BENEFITS, PLAN_STATUS, TASK_STATUS, TRACKS, benefitsForTrack, type BenefitKey } from "@/lib/sharks/catalog";
import { cn } from "@/lib/utils";
import { FieldError, useSharksAction } from "./use-sharks-action";

export type PlanValue = {
  track: SharksTrack;
  benefits: string[];
  scope: string;
  limitations: string | null;
  startsOn: Date | null;
  endsOn: Date | null;
  ownerId: string | null;
  status: SharksPlanStatus;
};

const dateInput = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");
const select = "h-9 w-full rounded-md border border-input bg-background px-2 text-sm";

/**
 * What Casho agrees to deliver. Tracks are Benefits / Growth only (open ones,
 * plus the plan's current track); nothing here creates a payment or grant.
 */
export function PlanForm({
  applicationId,
  plan,
  tracks,
  admins,
}: {
  applicationId: string;
  plan: PlanValue | null;
  tracks: SharksTrack[];
  admins: { id: string; label: string }[];
}) {
  const options = plan && !tracks.includes(plan.track) ? [plan.track, ...tracks] : tracks;
  const [track, setTrack] = useState<SharksTrack | "">(plan?.track ?? options[0] ?? "");
  const [benefits, setBenefits] = useState<string[]>(plan?.benefits ?? []);
  const [scope, setScope] = useState(plan?.scope ?? "");
  const [limitations, setLimitations] = useState(plan?.limitations ?? "");
  const [startsOn, setStartsOn] = useState(dateInput(plan?.startsOn ?? null));
  const [endsOn, setEndsOn] = useState(dateInput(plan?.endsOn ?? null));
  const [ownerId, setOwnerId] = useState(plan?.ownerId ?? "");
  const [status, setStatus] = useState<SharksPlanStatus>(plan?.status ?? "PLANNED");
  const { run, pending, errors } = useSharksAction(saveSharksPlanAction);

  if (options.length === 0) return <p className="text-sm text-muted-foreground">المسارين مقفولين من إعدادات البرنامج — افتح مسار الأول عشان تعمل خطة.</p>;

  const available = track ? benefitsForTrack(track) : [];

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        run({ applicationId, track, benefits: benefits.filter((b) => available.includes(b as BenefitKey)), scope, limitations, startsOn, endsOn, ownerId, status });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="plan-track">المسار</Label>
          <select id="plan-track" className={select} value={track} onChange={(e) => setTrack(e.target.value as SharksTrack)}>
            {options.map((t) => (
              <option key={t} value={t}>
                {TRACKS[t].name.en} — {TRACKS[t].short.ar}
              </option>
            ))}
          </select>
          <FieldError message={errors.track} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="plan-status">حالة التنفيذ</Label>
          <select id="plan-status" className={select} value={status} onChange={(e) => setStatus(e.target.value as SharksPlanStatus)}>
            {(Object.keys(PLAN_STATUS) as SharksPlanStatus[]).map((s) => (
              <option key={s} value={s}>
                {PLAN_STATUS[s].ar}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">المزايا المعتمدة للبيزنس ده</legend>
        {available.map((k) => (
          <label key={k} className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1 size-4 accent-primary"
              checked={benefits.includes(k)}
              onChange={(e) => setBenefits((b) => (e.target.checked ? [...b, k] : b.filter((x) => x !== k)))}
            />
            {BENEFITS[k].ar}
          </label>
        ))}
        <FieldError message={errors.benefits} />
        {benefits.includes("free_subscription") && (
          <p className="rounded-md bg-muted px-3 py-2 text-xs leading-5 text-muted-foreground">
            الخطة بتسجّل الاتفاق بس — مش بتعدّل اشتراك المتجر تلقائيًا. فعّل المدة المجانية يدويًا من صفحة المتجر واكتبها في النطاق.
          </p>
        )}
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="plan-scope">النطاق المتفق عليه</Label>
        <Textarea id="plan-scope" rows={4} value={scope} onChange={(e) => setScope(e.target.value)} placeholder="بالظبط هنعمل إيه، وإزاي، ومين من الفريق" />
        <FieldError message={errors.scope} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="plan-limits">الحدود (اختياري)</Label>
        <Textarea id="plan-limits" rows={2} value={limitations} onChange={(e) => setLimitations(e.target.value)} placeholder="اللي مش داخل في الخطة" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="plan-start">البداية</Label>
          <Input id="plan-start" type="date" dir="ltr" value={startsOn} onChange={(e) => setStartsOn(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="plan-end">النهاية</Label>
          <Input id="plan-end" type="date" dir="ltr" value={endsOn} onChange={(e) => setEndsOn(e.target.value)} />
          <FieldError message={errors.endsOn} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="plan-owner">المسؤول</Label>
          <select id="plan-owner" className={select} value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
            <option value="">—</option>
            {admins.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
          <FieldError message={errors.ownerId} />
        </div>
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {plan ? "احفظ الخطة" : "اعتمد خطة الدعم"}
      </Button>
    </form>
  );
}

export type TaskRow = { id: string; title: string; isMilestone: boolean; dueOn: Date | null; status: SharksTaskStatus };

export function TaskList({ planId, tasks }: { planId: string; tasks: TaskRow[] }) {
  const [title, setTitle] = useState("");
  const [isMilestone, setIsMilestone] = useState(false);
  const [dueOn, setDueOn] = useState("");
  const add = useSharksAction(addSharksTaskAction, () => {
    setTitle("");
    setDueOn("");
    setIsMilestone(false);
  });
  const setStatus = useSharksAction(setSharksTaskStatusAction);

  return (
    <div className="space-y-4">
      {tasks.length > 0 ? (
        <ul className="apple-rows overflow-hidden rounded-[12px] bg-(--fill-3)">
          {tasks.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5 text-sm">
              {t.isMilestone && <Flag className="size-3.5 text-primary" aria-label="مرحلة" />}
              <span className={cn("min-w-0 flex-1", (t.status === "DONE" || t.status === "CANCELED") && "text-muted-foreground line-through")}>{t.title}</span>
              {t.dueOn && <span className="text-xs text-muted-foreground tabular-nums">{dateInput(t.dueOn)}</span>}
              <select
                aria-label={`حالة: ${t.title}`}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                value={t.status}
                disabled={setStatus.pending}
                onChange={(e) => setStatus.run({ taskId: t.id, status: e.target.value })}
              >
                {(Object.keys(TASK_STATUS) as SharksTaskStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {TASK_STATUS[s].ar}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">مفيش مهام لسه.</p>
      )}
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add.run({ planId, title, isMilestone, dueOn });
        }}
      >
        <div className="min-w-48 flex-1 space-y-1">
          <Label htmlFor="task-title" className="text-xs">
            مهمة أو مرحلة جديدة
          </Label>
          <Input id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} className="h-9" />
        </div>
        <Input aria-label="تاريخ الاستحقاق" type="date" dir="ltr" value={dueOn} onChange={(e) => setDueOn(e.target.value)} className="h-9 w-40" />
        <label className="flex h-9 items-center gap-1.5 text-xs">
          <input type="checkbox" className="size-4 accent-primary" checked={isMilestone} onChange={(e) => setIsMilestone(e.target.checked)} />
          مرحلة
        </label>
        <Button type="submit" size="sm" variant="secondary" disabled={add.pending || title.trim().length < 2}>
          {add.pending && <Loader2 className="size-4 animate-spin" />}
          أضف
        </Button>
      </form>
      <FieldError message={add.errors.title} />
    </div>
  );
}
