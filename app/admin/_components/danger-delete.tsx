"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  /** What gets deleted, e.g. "المتجر" / "الحساب". */
  noun: string;
  /** Value the admin must type to confirm (slug / email). */
  confirmValue: string;
  confirmLabel: string;
  /** What else disappears with it, listed in the dialog. */
  consequences: string[];
  /** Money / work history that blocks a normal delete; non-empty disables it unless `canForce`. */
  blockers: string[];
  /** Reasons nobody can override (yourself, an admin, a sales rep). */
  hardBlockers?: string[];
  /** The viewer is a super admin: the server deletes past `blockers` for them, so they're listed as what's lost. */
  canForce?: boolean;
  /** Extra lines the dialog shows for a forced delete. */
  forceConsequences?: string[];
  /** Hint shown under the blockers (what to do instead). */
  alternative?: string;
  action: (typed: string, force: boolean) => Promise<{ success: boolean; message: string }>;
  /** Where to go after a successful delete. */
  redirectTo: string;
};

/**
 * "Danger zone" block: explains blockers, or deletes after typing the record's
 * name. A super admin (`canForce`) can delete past money blockers ("forced").
 */
export function DangerDelete({
  noun,
  confirmValue,
  confirmLabel,
  consequences,
  blockers,
  hardBlockers = [],
  canForce = false,
  forceConsequences = [],
  alternative,
  action,
  redirectTo,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [pending, start] = useTransition();
  const matches = typed.trim().toLowerCase() === confirmValue.toLowerCase();
  const forcing = canForce && hardBlockers.length === 0 && blockers.length > 0;
  const disabled = hardBlockers.length > 0 || (blockers.length > 0 && !forcing);

  const submit = () =>
    start(async () => {
      const result = await action(typed, forcing);
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        router.replace(redirectTo);
        router.refresh();
      } else toast.error(result.message);
    });

  return (
    <section className="apple-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h2 className="text-[17px] leading-[22px] font-semibold text-(--sys-red)">حذف {noun} نهائيًا</h2>
          {hardBlockers.length ? (
            <>
              <p className="text-[13px] leading-[18px] text-muted-foreground">مينفعش يتحذف:</p>
              <ReasonList items={[...hardBlockers, ...blockers]} />
              {alternative && <p className="pt-1 text-[13px] leading-[18px] text-muted-foreground">{alternative}</p>}
            </>
          ) : forcing ? (
            <>
              <p className="text-[13px] leading-[18px] text-muted-foreground">عليه سجل مالي — كسوبر أدمن تقدر تحذفه إجباري، والسجل ده هيتمسح معاه:</p>
              <ReasonList items={blockers} />
              {alternative && <p className="pt-1 text-[13px] leading-[18px] text-muted-foreground">{alternative}</p>}
            </>
          ) : blockers.length ? (
            <>
              <p className="text-[13px] leading-[18px] text-muted-foreground">مينفعش يتحذف عشان سجل الإيرادات والعمولات يفضل صحيح:</p>
              <ReasonList items={blockers} />
              {alternative && <p className="pt-1 text-[13px] leading-[18px] text-muted-foreground">{alternative}</p>}
              <p className="text-[13px] leading-[18px] text-muted-foreground">الحذف الإجباري متاح للسوبر أدمن بس.</p>
            </>
          ) : (
            <p className="text-[13px] leading-[18px] text-muted-foreground">بيمسح {noun} وكل بياناته من قاعدة البيانات. مفيش رجوع.</p>
          )}
        </div>

        <Dialog
          open={open}
          onOpenChange={(o) => {
            if (pending) return;
            setOpen(o);
            if (!o) setTyped("");
          }}
        >
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={disabled} className="shrink-0">
              <Trash2 className="size-3.5" />
              {forcing ? `حذف إجباري` : `حذف ${noun}`}
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl" className="sm:max-w-md">
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (matches) submit();
              }}
            >
              <DialogHeader>
                <DialogTitle>{forcing ? `حذف ${noun} إجباري؟` : `حذف ${noun} نهائيًا؟`}</DialogTitle>
                <DialogDescription>الحاجات دي هتتمسح ومينفعش ترجع:</DialogDescription>
              </DialogHeader>
              {forcing && (
                <div className="space-y-1.5 rounded-[12px] border border-destructive/30 bg-destructive/10 p-3 text-sm leading-6">
                  <p className="flex items-center gap-1.5 font-semibold text-destructive">
                    <AlertTriangle className="size-4 shrink-0" />
                    السجل المالي هيتمسح كمان
                  </p>
                  <ul className="list-disc space-y-0.5 ps-5">
                    {[...blockers, ...forceConsequences].map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
              <ul className="list-disc space-y-1 ps-5 text-sm leading-6">
                {consequences.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <div className="space-y-1.5">
                <Label htmlFor="danger-confirm">
                  للتأكيد اكتب {confirmLabel}: <span className="font-mono font-semibold" dir="ltr">{confirmValue}</span>
                </Label>
                <Input id="danger-confirm" dir="ltr" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
                  رجوع
                </Button>
                <Button type="submit" variant="destructive" disabled={!matches || pending}>
                  {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  {forcing ? "احذف إجباري" : "احذف نهائيًا"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}

function ReasonList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-0.5 ps-5 text-[13px] leading-[18px]">
      {items.map((b) => (
        <li key={b}>{b}</li>
      ))}
    </ul>
  );
}
