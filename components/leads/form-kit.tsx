"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import { appleButton } from "@/components/saas-page";
import type { LeadActionResult } from "@/lib/leads/service";
import { cn } from "@/lib/utils";

/** Runs a lead action from a form: toast, refresh, field errors. Duplicates come back for the caller to show. */
export function useLeadAction(action: (input: unknown) => Promise<LeadActionResult>, onDone?: (result: LeadActionResult) => void) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [last, setLast] = useState<LeadActionResult | null>(null);

  function submit(input: Record<string, unknown>) {
    startTransition(async () => {
      try {
        const res = await action(input);
        setLast(res);
        setErrors(res.fieldErrors ?? {});
        if (!res.success) {
          toast.error(res.message);
          return;
        }
        toast.success(res.message);
        onDone?.(res);
        router.refresh();
      } catch {
        toast.error("مش مسموح أو حصلت مشكلة — جرّب تاني");
      }
    });
  }
  return { submit, pending, errors, last, reset: () => setLast(null) };
}

export function formValues(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();
  return Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
}

export function Field({ label, name, error, hint, children }: { label: string; name: string; error?: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="text-[13px] font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
      {error ? <p className="text-[13px] text-(--sys-red)">{error}</p> : hint ? <p className="text-[12px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

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

const pad = (n: number) => String(n).padStart(2, "0");
/** A Date → the value a datetime-local input shows (the browser's local time). */
export const toLocalInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** datetime-local value → ISO (interpreted in the browser's time zone — the rep's). */
export const localInputToIso = (v: string) => (v ? new Date(v).toISOString() : "");

/** Due date field with quick picks (tomorrow 11:00, in 3 days, next week). */
export function DueAtInput({ name, defaultValue, error, label = "الميعاد" }: { name: string; defaultValue?: Date; error?: string; label?: string }) {
  const [value, setValue] = useState(() => toLocalInput(defaultValue ?? nextMorning(1)));
  const picks: [string, () => Date][] = [
    ["بعد ساعتين", () => new Date(Date.now() + 2 * 3_600_000)],
    ["بكرة ١١ص", () => nextMorning(1)],
    ["بعد ٣ أيام", () => nextMorning(3)],
    ["الأسبوع الجاي", () => nextMorning(7)],
  ];
  return (
    <Field label={label} name={name} error={error}>
      <input
        id={name}
        type="datetime-local"
        dir="ltr"
        required
        value={value}
        min={toLocalInput(new Date())}
        onChange={(e) => setValue(e.target.value)}
        className="h-11 w-full rounded-[10px] border-0 bg-(--fill-3) px-3 text-end text-[15px] tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <input type="hidden" name={`${name}Iso`} value={localInputToIso(value)} />
      <div className="flex flex-wrap gap-1.5 pt-1">
        {picks.map(([label, at]) => (
          <button key={label} type="button" onClick={() => setValue(toLocalInput(at()))} className="h-7 rounded-full bg-(--fill-3) px-3 text-[12px] text-foreground/80 hover:bg-muted">
            {label}
          </button>
        ))}
      </div>
    </Field>
  );
}

function nextMorning(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(11, 0, 0, 0);
  return d;
}
