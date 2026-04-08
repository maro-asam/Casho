"use client";

import { useTransition } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  ApproveRemovePoweredByRequestAction,
  RejectRemovePoweredByRequestAction,
} from "@/actions/admin/powered-by-casho.actions";

type PoweredByCashoRequestActionsProps = {
  requestId: string;
};

export default function PoweredByCashoRequestActions({
  requestId,
}: PoweredByCashoRequestActionsProps) {
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    startTransition(async () => {
      try {
        await ApproveRemovePoweredByRequestAction(requestId);
        toast.success("تمت الموافقة على الطلب");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "حدث خطأ");
      }
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      try {
        await RejectRemovePoweredByRequestAction(requestId);
        toast.success("تم رفض الطلب");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "حدث خطأ");
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button size="sm" onClick={handleApprove} disabled={isPending}>
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <CheckCircle2 className="size-4" />
        )}
        موافقة
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={handleReject}
        disabled={isPending}
      >
        <XCircle className="size-4" />
        رفض
      </Button>
    </div>
  );
}