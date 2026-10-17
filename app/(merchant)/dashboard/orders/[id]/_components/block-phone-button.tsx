"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { BlockPhoneAction, UnblockPhoneAction } from "@/actions/store/fraud.actions";
import { Button } from "@/components/ui/button";

/** Block / unblock the order's number for this store. */
export function BlockPhoneButton({ storeId, phone, blockedId }: { storeId: string; phone: string; blockedId: string | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function run() {
    start(async () => {
      const result = blockedId
        ? await UnblockPhoneAction(storeId, blockedId)
        : await BlockPhoneAction(storeId, { phone, reason: "من صفحة الطلب" });
      if (result.ok) {
        toast.success(result.message);
        setConfirming(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  if (blockedId) {
    return (
      <Button type="button" variant="outline" size="sm" className="h-9 w-full gap-1.5" onClick={run} disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
        شيل الحظر عن الرقم
      </Button>
    );
  }

  return confirming ? (
    <div className="grid grid-cols-2 gap-2">
      <Button type="button" variant="destructive" size="sm" className="h-9 gap-1.5" onClick={run} disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Ban className="size-4" />}
        أيوه احظره
      </Button>
      <Button type="button" variant="outline" size="sm" className="h-9" onClick={() => setConfirming(false)} disabled={pending}>
        رجوع
      </Button>
    </div>
  ) : (
    <Button type="button" variant="outline" size="sm" className="h-9 w-full gap-1.5 text-destructive" onClick={() => setConfirming(true)}>
      <Ban className="size-4" />
      احظر الرقم ده من متجرك
    </Button>
  );
}
