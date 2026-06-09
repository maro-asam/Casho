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

type Branch = { id: string; name: string; isDefault: boolean; isActive: boolean };

export function BranchActions({ branch }: { branch: Branch }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<unknown>, msg: string) {
    startTransition(async () => {
      try {
        await action();
        toast.success(msg);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "حدث خطأ");
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
          <DropdownMenuItem onClick={() => run(() => SetDefaultBranchAction(branch.id), "تم التعيين كفرع افتراضي")}>
            <Star className="ml-2 size-4" />
            تعيين كافتراضي
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() =>
            run(
              () => UpdateBranchAction(branch.id, { isActive: !branch.isActive }),
              branch.isActive ? "تم تعطيل الفرع" : "تم تفعيل الفرع",
            )
          }
        >
          <ToggleLeft className="ml-2 size-4" />
          {branch.isActive ? "تعطيل" : "تفعيل"}
        </DropdownMenuItem>
        {!branch.isDefault && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => run(() => DeleteBranchAction(branch.id), "تم حذف الفرع")}
            >
              <Trash2 className="ml-2 size-4" />
              حذف
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
