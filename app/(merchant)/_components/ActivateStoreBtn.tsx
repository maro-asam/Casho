"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Rocket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ActivateStoreAction } from "@/actions/store/stores.actions";
import { tr } from "@/lib/i18n/dashboard";

export default function ActivateStoreButton() {
  const [isPending, startTransition] = useTransition();

  const handleActivate = () => {
    startTransition(async () => {
      try {
        const res = await ActivateStoreAction();

        if (res?.success) {
          toast.success(
            tr("🎉 ألف مبروك! تم تفعيل متجرك لمدة 30 يوم من دلوقتي")
          );
        } else {
          toast.error(tr("حصل مشكلة أثناء التفعيل"));
        }
      } catch (error) {
        toast.error(tr("حصل خطأ غير متوقع"));
        console.error(error);
      }
    });
  };

  return (
    <Button
      onClick={handleActivate}
      disabled={isPending}
      size="lg"
      className="h-11 rounded-xl px-6 shadow-sm"
    >
      <Rocket className="ms-2 size-4" />
      {isPending ? tr("جاري التفعيل...") : tr("تفعيل المتجر")}
    </Button>
  );
}