"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { BlockPhoneAction, UnblockPhoneAction } from "@/actions/store/fraud.actions";
import { cn } from "@/lib/utils";
import { appleButton } from "@/components/saas-page";
import { tr, trv } from "@/lib/i18n/dashboard";

/** Block / unblock the order's number for this store. */
export function BlockPhoneButton({ storeId, phone, blockedId }: { storeId: string; phone: string; blockedId: string | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function run() {
    start(async () => {
      const result = blockedId
        ? await UnblockPhoneAction(storeId, blockedId)
        : await BlockPhoneAction(storeId, { phone, reason: tr("من صفحة الطلب") });
      if (result.ok) {
        toast.success(trv(result.message));
        setConfirming(false);
        router.refresh();
      } else {
        toast.error(trv(result.message));
      }
    });
  }

  if (blockedId) {
    return (
      <button type="button" className={cn(appleButton.tinted, "w-full text-primary")} onClick={run} disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
        {tr("شيل الحظر عن الرقم")}
      </button>
    );
  }

  return confirming ? (
    <div className="grid grid-cols-2 gap-2">
      <button type="button" className={cn(appleButton.tinted, "text-primary")} onClick={() => setConfirming(false)} disabled={pending}>
        {tr("رجوع")}
      </button>
      <button
        type="button"
        className={cn(appleButton.destructive, "bg-(--sys-red) font-semibold text-white hover:bg-(--sys-red)/90")}
        onClick={run}
        disabled={pending}
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Ban className="size-4" />}
        {tr("أيوه احظره")}
      </button>
    </div>
  ) : (
    <button type="button" className={cn(appleButton.destructive, "w-full")} onClick={() => setConfirming(true)}>
      <Ban className="size-4" />
      {tr("احظر الرقم ده من متجرك")}
    </button>
  );
}
