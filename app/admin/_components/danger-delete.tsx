"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
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
  /** Why it can't be deleted; non-empty disables the action. */
  blockers: string[];
  /** Hint shown under the blockers (what to do instead). */
  alternative?: string;
  action: (typed: string) => Promise<{ success: boolean; message: string }>;
  /** Where to go after a successful delete. */
  redirectTo: string;
};

/** "Danger zone" block: explains blockers, or deletes after typing the record's name. */
export function DangerDelete({ noun, confirmValue, confirmLabel, consequences, blockers, alternative, action, redirectTo }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [pending, start] = useTransition();
  const matches = typed.trim().toLowerCase() === confirmValue.toLowerCase();

  const submit = () =>
    start(async () => {
      const result = await action(typed);
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
          {blockers.length ? (
            <>
              <p className="text-[13px] leading-[18px] text-muted-foreground">مينفعش يتحذف عشان سجل الإيرادات والعمولات يفضل صحيح:</p>
              <ul className="list-disc space-y-0.5 ps-5 text-[13px] leading-[18px]">
                {blockers.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              {alternative && <p className="pt-1 text-[13px] leading-[18px] text-muted-foreground">{alternative}</p>}
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
            <Button variant="destructive" size="sm" disabled={blockers.length > 0} className="shrink-0">
              <Trash2 className="size-3.5" />
              حذف {noun}
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
                <DialogTitle>حذف {noun} نهائيًا؟</DialogTitle>
                <DialogDescription>الحاجات دي هتتمسح ومينفعش ترجع:</DialogDescription>
              </DialogHeader>
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
                  احذف نهائيًا
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
