"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Star, Trash2, ToggleLeft } from "lucide-react";
import { DeleteBranchAction, SetDefaultBranchAction, UpdateBranchAction } from "@/actions/inventory/branches.actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { tr, trv } from "@/lib/i18n/dashboard";

type Branch = { id: string; name: string; isDefault: boolean; isActive: boolean };

export function BranchActions({ branch }: { branch: Branch }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<unknown>, msg: string) {
    startTransition(async () => {
      try {
        await action();
        toast.success(trv(msg));
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : tr("حدث خطأ"));
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8" disabled={isPending}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {!branch.isDefault && (
          <DropdownMenuItem onClick={() => run(() => SetDefaultBranchAction(branch.id), tr("تم التعيين كفرع افتراضي"))}>
            <Star className="me-2 size-4" />
            {tr("تعيين كافتراضي")}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() =>
            run(
              () => UpdateBranchAction(branch.id, { isActive: !branch.isActive }),
              branch.isActive ? tr("تم تعطيل الفرع") : tr("تم تفعيل الفرع"),
            )
          }
        >
          <ToggleLeft className="me-2 size-4" />
          {branch.isActive ? tr("تعطيل") : tr("تفعيل")}
        </DropdownMenuItem>
        {!branch.isDefault && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => run(() => DeleteBranchAction(branch.id), tr("تم حذف الفرع"))}
            >
              <Trash2 className="me-2 size-4" />
              {tr("حذف")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
