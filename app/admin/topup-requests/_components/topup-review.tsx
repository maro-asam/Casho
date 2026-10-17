"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { approveTopupRequestAction, rejectTopupRequestAction } from "@/actions/admin/admin-topup.actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const REASONS = ["مبلغ التحويل مش مطابق", "مفيش تحويل بالرقم ده", "الإيصال مش واضح", "طلب مكرر"];

/** Approve (with confirm) / reject (with a reason the merchant sees). */
export function TopupReview({ id, amountLabel, storeName }: { id: string; amountLabel: string; storeName: string }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<"approve" | "reject" | null>(null);
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ success: boolean; message: string }>) =>
    start(async () => {
      const result = await fn();
      if (result.success) {
        toast.success(result.message);
        setDialog(null);
        setReason("");
        router.refresh();
      } else {
        toast.error(result.message);
        router.refresh(); // e.g. already handled elsewhere — show the real state
      }
    });

  return (
    <div className="relative z-10 flex items-center justify-end gap-1.5">
      <Button size="sm" onClick={() => setDialog("approve")} className="h-8 bg-emerald-600 text-white hover:bg-emerald-700">
        <Check className="size-3.5" />
        اعتماد
      </Button>
      <Button size="sm" variant="outline" onClick={() => setDialog("reject")} className="h-8">
        <X className="size-3.5" />
        رفض
      </Button>

      <Dialog open={dialog !== null} onOpenChange={(open) => !pending && !open && setDialog(null)}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          {dialog === "approve" ? (
            <>
              <DialogHeader>
                <DialogTitle>اعتماد شحن {amountLabel}؟</DialogTitle>
                <DialogDescription>
                  المبلغ هيتضاف لرصيد «{storeName}» فورًا، والاشتراك هيتجدد لو كان مستحق. اتأكد إن التحويل وصل فعلًا.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialog(null)} disabled={pending}>
                  رجوع
                </Button>
                <Button onClick={() => run(() => approveTopupRequestAction(id))} disabled={pending} className="bg-emerald-600 text-white hover:bg-emerald-700">
                  {pending && <Loader2 className="size-4 animate-spin" />}
                  اعتمد وأضف الرصيد
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>رفض طلب شحن {amountLabel}</DialogTitle>
                <DialogDescription>السبب بيوصل للتاجر في إشعار عشان يعرف يصلّح إيه.</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {REASONS.map((r) => (
                    <Button key={r} type="button" size="sm" variant={reason === r ? "default" : "outline"} className="h-7 text-xs" onClick={() => setReason(r)}>
                      {r}
                    </Button>
                  ))}
                </div>
                <Label htmlFor={`reason-${id}`} className="sr-only">
                  سبب الرفض
                </Label>
                <Textarea id={`reason-${id}`} rows={3} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="أو اكتب السبب…" />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialog(null)} disabled={pending}>
                  رجوع
                </Button>
                <Button variant="destructive" onClick={() => run(() => rejectTopupRequestAction(id, reason))} disabled={pending}>
                  {pending && <Loader2 className="size-4 animate-spin" />}
                  ارفض الطلب
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
