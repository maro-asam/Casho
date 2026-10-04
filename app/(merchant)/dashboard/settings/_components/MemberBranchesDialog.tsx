"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { SetMemberBranchesAction } from "@/actions/inventory/branches.actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

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
        toast.success("تم تحديث فروع العضو");
        onOpenChange(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "حدث خطأ");
      }
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>فروع {memberName}</DialogTitle>
          <DialogDescription>الفروع اللي يقدر يفتح فيها وردية ويبيع من مخزونها.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <Label htmlFor="all-branches" className="text-sm font-medium">
              كل الفروع (والفروع الجديدة)
            </Label>
            <Switch id="all-branches" checked={allBranches} onCheckedChange={setAllBranches} />
          </div>

          {!allBranches && (
            <div className="space-y-2">
              {branches.map((b) => (
                <label
                  key={b.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-muted/40"
                >
                  <Checkbox checked={selected.includes(b.id)} onCheckedChange={(v) => toggle(b.id, v === true)} />
                  <span className="flex-1">{b.name}</span>
                  {b.isDefault && <span className="text-xs text-muted-foreground">رئيسي</span>}
                  {!b.isActive && <span className="text-xs text-muted-foreground">موقوف</span>}
                </label>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={save} disabled={pending || (!allBranches && selected.length === 0)}>
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
