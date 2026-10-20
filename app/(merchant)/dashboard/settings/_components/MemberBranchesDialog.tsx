"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { SetMemberBranchesAction } from "@/actions/inventory/branches.actions";
import { Check } from "lucide-react";
import { appleButton } from "@/components/saas-page";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { tdir, tr } from "@/lib/i18n/dashboard";

export type BranchOption = { id: string; name: string; isActive: boolean; isDefault: boolean };
export type MemberBranchAccess = { allBranches: boolean; branchIds: string[] };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  memberName: string;
  branches: BranchOption[];
  access: MemberBranchAccess;
  onSaved: (access: MemberBranchAccess) => void;
};

/** Which branches a team member can open shifts and sell in. */
export function MemberBranchesDialog({ open, onOpenChange, memberId, memberName, branches, access, onSaved }: Props) {
  const [allBranches, setAllBranches] = useState(access.allBranches);
  const [selected, setSelected] = useState<string[]>(access.branchIds);
  const [pending, startTransition] = useTransition();

  const toggle = (id: string, on: boolean) =>
    setSelected((prev) => (on ? [...new Set([...prev, id])] : prev.filter((x) => x !== id)));

  const save = () =>
    startTransition(async () => {
      try {
        await SetMemberBranchesAction({ memberId, allBranches, branchIds: selected });
        onSaved({ allBranches, branchIds: allBranches ? [] : selected });
        toast.success(tr("تم تحديث فروع العضو"));
        onOpenChange(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : tr("حدث خطأ"));
      }
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={tdir()} className="gap-0 p-0 sm:max-w-md">
        <DialogHeader className="px-6 pt-7 pb-5 text-center sm:text-center">
          <DialogTitle className="text-[20px] font-bold">{tr("فروع {0}", memberName)}</DialogTitle>
          <DialogDescription className="text-[15px]">{tr("الفروع اللي يقدر يفتح فيها وردية ويبيع من مخزونها.")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-5 pb-5">
          <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-[14px] bg-(--fill-3) px-4 py-2.5">
            <span className="text-[15px]">{tr("كل الفروع (والفروع الجديدة)")}</span>
            <Switch id="all-branches" className="apple-switch" checked={allBranches} onCheckedChange={setAllBranches} />
          </label>

          {!allBranches && (
            <div className="apple-rows overflow-hidden rounded-[14px] bg-(--fill-3) [--row-inset:16px]">
              {branches.map((b) => {
                const on = selected.includes(b.id);
                return (
                  <button
                    key={b.id}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => toggle(b.id, !on)}
                    className="flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-start text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  >
                    <span className="flex-1">{b.name}</span>
                    {b.isDefault && <span className="text-[13px] text-muted-foreground">{tr("رئيسي")}</span>}
                    {!b.isActive && <span className="text-[13px] text-muted-foreground">{tr("موقوف")}</span>}
                    <Check className={cn("size-5 shrink-0 text-primary", on ? "opacity-100" : "opacity-0")} strokeWidth={2.6} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="px-5 pb-5">
          <button type="button" className={cn(appleButton.filled, "h-[50px] w-full text-[17px]")} onClick={save} disabled={pending || (!allBranches && selected.length === 0)}>
            {tr("حفظ")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
