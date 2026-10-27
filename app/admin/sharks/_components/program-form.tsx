"use client";

import { useState } from "react";
import { Loader2, Lock } from "lucide-react";

import { updateSharksProgramAction } from "@/actions/admin/sharks.actions";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { ProgramSettings } from "@/lib/sharks/workflow";
import { useSharksAction } from "./use-sharks-action";

const ROWS: { key: keyof ProgramSettings; title: string; body: string }[] = [
  { key: "applicationsOpen", title: "استقبال طلبات جديدة", body: "لما يتقفل، زرار التقديم بيختفي من الموقع ولوحة التاجر. الطلبات الموجودة بتكمّل عادي." },
  { key: "benefitsAvailable", title: "Casho Benefits متاح", body: "بيظهر «متاح» على الموقع، والتاجر يقدر يطلبه، وتقدر تعمل خطط عليه." },
  { key: "growthAvailable", title: "Casho Growth متاح", body: "افتحه بس لو الفريق أو الشركاء يقدروا يقدّموه فعلًا دلوقتي." },
];

export function ProgramForm({ initial }: { initial: ProgramSettings }) {
  const [v, setV] = useState(initial);
  const { run, pending } = useSharksAction(updateSharksProgramAction);

  return (
    <div className="space-y-6">
      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        {ROWS.map((r) => (
          <li key={r.key} className="flex items-start justify-between gap-6 p-4">
            <div>
              <p className="text-sm font-medium" dir="auto">
                {r.title}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{r.body}</p>
            </div>
            <Switch aria-label={r.title} checked={v[r.key]} onCheckedChange={(on) => setV((s) => ({ ...s, [r.key]: on }))} />
          </li>
        ))}
        <li className="flex items-start justify-between gap-6 bg-muted/40 p-4">
          <div>
            <p className="text-sm font-medium">Casho Investment</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              مسار مستقبلي ومقفول. مفيش ميزانية تمويل أو استثمار، ومفيش أي مسار في النظام يقدر يعمل التزام مالي أو تحويل. تفعيله محتاج تنفيذ منفصل وموافقة صريحة على الميزانية والشروط — مش زرار هنا.
            </p>
          </div>
          <Lock className="mt-1 size-4 shrink-0 text-muted-foreground" aria-label="مقفول" />
        </li>
      </ul>
      <Button onClick={() => run(v)} disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        احفظ الإعدادات
      </Button>
    </div>
  );
}
