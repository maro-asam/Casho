"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { XCircle } from "lucide-react";
import { toast } from "sonner";
import { RejectSuggestedOrderAction } from "@/actions/instagram/reject-suggested-order.actions";

type Props = {
  suggestedOrderId: string;
  onRejected?: () => void;
};

export function RejectDialog({ suggestedOrderId, onRejected }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleReject() {
    startTransition(async () => {
      const result = await RejectSuggestedOrderAction(suggestedOrderId, reason || undefined);
      if (result.success) {
        toast.success("تم رفض الطلب المقترح");
        setOpen(false);
        onRejected?.();
        router.refresh();
      } else {
        toast.error(result.error ?? "فشل الرفض");
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
        >
          <XCircle className="mr-1.5 size-4" />
          رفض
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>رفض الطلب المقترح؟</AlertDialogTitle>
          <AlertDialogDescription>
            سيتم تجاهل هذا الطلب ولن يظهر مجدداً. يمكنك إضافة سبب للرفض.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label className="text-sm">سبب الرفض (اختياري)</Label>
          <Textarea
            placeholder="مثال: مجرد استفسار، عميل غير جاد..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="resize-none rounded-xl"
            rows={3}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <Button
            className="rounded-xl bg-rose-600 hover:bg-rose-700"
            onClick={handleReject}
            disabled={isPending}
          >
            {isPending ? "جاري الرفض..." : "تأكيد الرفض"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
