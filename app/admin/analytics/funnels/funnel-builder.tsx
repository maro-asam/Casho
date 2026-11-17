"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { appleButton } from "@/components/saas-page";
import { DeleteFunnelAction, SaveFunnelAction } from "@/actions/admin/analytics.actions";
import { KNOWN_EVENTS } from "@/lib/analytics/constants";
import { VERIFIED_STEPS, type FunnelScope, type FunnelStep, type VerifiedStep } from "@/lib/analytics/funnels";

type Editing = { id: string; name: string; description: string | null; scope: FunnelScope; windowDays: number; steps: FunnelStep[] } | null;

const BLANK: FunnelStep[] = [
  { type: "page", value: "*", label: "زار الموقع" },
  { type: "verified", value: "signup", label: "سجّل حساب" },
];

const field = "apple-field h-10 w-full px-3 text-[14px] text-foreground";

function StepRow({
  step,
  index,
  count,
  onChange,
  onMove,
  onRemove,
}: {
  step: FunnelStep;
  index: number;
  count: number;
  onChange: (s: FunnelStep) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <li className="space-y-2 rounded-[14px] bg-(--fill-3) p-3">
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-semibold text-muted-foreground tabular-nums">خطوة {index + 1}</span>
        <span className="ms-auto flex gap-1">
          <button type="button" aria-label="لفوق" disabled={index === 0} onClick={() => onMove(-1)} className="apple-press grid size-8 place-items-center rounded-full hover:bg-muted disabled:opacity-30">
            <ArrowUp className="size-4" />
          </button>
          <button type="button" aria-label="لتحت" disabled={index === count - 1} onClick={() => onMove(1)} className="apple-press grid size-8 place-items-center rounded-full hover:bg-muted disabled:opacity-30">
            <ArrowDown className="size-4" />
          </button>
          <button type="button" aria-label="شيل الخطوة" disabled={count <= 2} onClick={onRemove} className="apple-press grid size-8 place-items-center rounded-full text-(--sys-red) hover:bg-(--sys-red)/10 disabled:opacity-30">
            <Trash2 className="size-4" />
          </button>
        </span>
      </div>
      <select
        aria-label="نوع الخطوة"
        className={field}
        value={step.type}
        onChange={(e) => {
          const type = e.target.value as FunnelStep["type"];
          if (type === "page") onChange({ type, value: "/", label: step.label });
          else if (type === "event") onChange({ type, value: "cta_clicked", label: step.label });
          else onChange({ type, value: "signup", label: step.label });
        }}
      >
        <option value="page">فتح صفحة</option>
        <option value="event">حدث</option>
        <option value="verified">حاجة مؤكدة (من سجلات كاشو)</option>
      </select>
      {step.type === "page" && (
        <input
          className={field}
          dir="ltr"
          value={step.value}
          onChange={(e) => onChange({ ...step, value: e.target.value })}
          placeholder="/pricing أو /products/* أو * لأي صفحة"
          aria-label="المسار"
        />
      )}
      {step.type === "event" && (
        <>
          <input
            className={field}
            dir="ltr"
            list="analytics-event-names"
            value={step.value}
            onChange={(e) => onChange({ ...step, value: e.target.value.trim() })}
            placeholder="cta_clicked"
            aria-label="اسم الحدث"
          />
          <div className="grid grid-cols-2 gap-2">
            <input className={field} dir="ltr" value={step.propKey ?? ""} onChange={(e) => onChange({ ...step, propKey: e.target.value.trim() || undefined })} placeholder="خاصية (اختياري)" aria-label="اسم الخاصية" />
            <input className={field} dir="ltr" value={step.propValue ?? ""} onChange={(e) => onChange({ ...step, propValue: e.target.value || undefined })} placeholder="القيمة" aria-label="قيمة الخاصية" />
          </div>
        </>
      )}
      {step.type === "verified" && (
        <select className={field} value={step.value} onChange={(e) => onChange({ ...step, value: e.target.value as VerifiedStep })} aria-label="الحاجة المؤكدة">
          {(Object.keys(VERIFIED_STEPS) as VerifiedStep[]).map((k) => (
            <option key={k} value={k}>
              {VERIFIED_STEPS[k].label}
            </option>
          ))}
        </select>
      )}
      <input className={field} value={step.label} onChange={(e) => onChange({ ...step, label: e.target.value })} placeholder="اسم الخطوة اللي هيظهر" aria-label="اسم الخطوة" />
    </li>
  );
}

export function FunnelBuilder({ editing }: { editing: Editing }) {
  const router = useRouter();
  const [open, setOpen] = useState(!!editing);
  const [pending, start] = useTransition();
  const [name, setName] = useState(editing?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [scope, setScope] = useState<FunnelScope>(editing?.scope ?? "MARKETING");
  const [windowDays, setWindowDays] = useState(editing?.windowDays ?? 30);
  const [steps, setSteps] = useState<FunnelStep[]>(editing?.steps.length ? editing.steps : BLANK);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={`${appleButton.gray} w-full`}>
        <Plus className="size-4" />
        funnel جديد
      </button>
    );
  }

  const save = () =>
    start(async () => {
      const res = await SaveFunnelAction(editing?.id ?? null, { name, description, scope, windowDays, steps });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("اتحفظ");
      setOpen(false);
      router.push(`/admin/analytics/funnels?funnel=${res.id}`);
      router.refresh();
    });

  const remove = () => {
    if (!editing || !confirm("تمسح الـ funnel ده؟")) return;
    start(async () => {
      const res = await DeleteFunnelAction(editing.id);
      if (!res.ok) return void toast.error(res.error);
      toast.success("اتمسح");
      router.push("/admin/analytics/funnels");
      router.refresh();
    });
  };

  return (
    <section className="apple-card apple-form space-y-3 p-4">
      <h2 className="text-[15px] font-semibold">{editing ? "تعديل الـ funnel" : "funnel جديد"}</h2>
      <datalist id="analytics-event-names">
        {Object.keys(KNOWN_EVENTS).map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
      <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم" aria-label="اسم الـ funnel" />
      <input className={field} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="وصف قصير (اختياري)" aria-label="الوصف" />
      <div className="grid grid-cols-2 gap-2">
        <select className={field} value={scope} onChange={(e) => setScope(e.target.value as FunnelScope)} aria-label="النطاق">
          <option value="MARKETING">كاشو (الموقع + اللوحة)</option>
          <option value="STOREFRONT">المتاجر</option>
        </select>
        <label className="flex items-center gap-2 text-[13px] text-muted-foreground">
          خلال
          <input type="number" min={1} max={90} className={field} value={windowDays} onChange={(e) => setWindowDays(Number(e.target.value))} aria-label="عدد الأيام" />
          يوم
        </label>
      </div>
      <ol className="space-y-2">
        {steps.map((step, i) => (
          <StepRow
            key={i}
            step={step}
            index={i}
            count={steps.length}
            onChange={(s) => setSteps(steps.map((x, j) => (j === i ? s : x)))}
            onMove={(dir) => {
              const next = [...steps];
              [next[i], next[i + dir]] = [next[i + dir], next[i]];
              setSteps(next);
            }}
            onRemove={() => setSteps(steps.filter((_, j) => j !== i))}
          />
        ))}
      </ol>
      {steps.length < 10 && (
        <button type="button" onClick={() => setSteps([...steps, { type: "page", value: "/", label: "" }])} className={appleButton.plain}>
          <Plus className="size-4" />
          خطوة
        </button>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        <button type="button" disabled={pending} onClick={save} className={appleButton.filled}>
          حفظ
        </button>
        <button type="button" disabled={pending} onClick={() => setOpen(false)} className={appleButton.tinted}>
          إلغاء
        </button>
        {editing && (
          <button type="button" disabled={pending} onClick={remove} className={`${appleButton.destructive} ms-auto`}>
            مسح
          </button>
        )}
      </div>
    </section>
  );
}
