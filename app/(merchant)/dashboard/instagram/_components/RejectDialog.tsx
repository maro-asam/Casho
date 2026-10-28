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
import { appleButton } from "@/components/saas-page";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { XCircle } from "lucide-react";
import { toast } from "sonner";
import { RejectSuggestedOrderAction } from "@/actions/instagram/instagram.actions";
import { tdir, tr } from "@/lib/i18n/dashboard";

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
        toast.success(tr("تم رفض الطلب المقترح"));
        setOpen(false);
        onRejected?.();
        router.refresh();
      } else {
        toast.error(result.error ?? tr("فشل الرفض"));
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button type="button" className={cn(appleButton.destructive, "relative z-10")}>
          <XCircle className="size-4" />
          {tr("رفض")}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent dir={tdir()}>
        <AlertDialogHeader>
          <AlertDialogTitle>{tr("رفض الطلب المقترح؟")}</AlertDialogTitle>
          <AlertDialogDescription>
            {tr("سيتم تجاهل هذا الطلب ولن يظهر مجدداً. يمكنك إضافة سبب للرفض.")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label className="text-sm">{tr("سبب الرفض (اختياري)")}</Label>
          <Textarea
            placeholder={tr("مثال: مجرد استفسار، عميل غير جاد...")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="resize-none"
            rows={3}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>{tr("إلغاء")}</AlertDialogCancel>
          <button type="button" className={appleButton.destructiveFilled} onClick={handleReject} disabled={isPending}>
            {isPending ? tr("جاري الرفض...") : tr("تأكيد الرفض")}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
