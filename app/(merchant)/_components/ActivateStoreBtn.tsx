"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Rocket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ActivateStoreAction } from "@/actions/store/stores.actions";

export default function ActivateStoreButton() {
  const [isPending, startTransition] = useTransition();

  const handleActivate = () => {
    startTransition(async () => {
      try {
        const res = await ActivateStoreAction();

        if (res?.success) {
          toast.success(
            "🎉 ألف مبروك! تم تفعيل متجرك لمدة 30 يوم من دلوقتي"
          );
        } else {
          toast.error("حصل مشكلة أثناء التفعيل");
        }
      } catch (error) {
        toast.error("حصل خطأ غير متوقع");
        console.error(error);
      }
    });
  };

  return (
    <Button
      onClick={handleActivate}
      disabled={isPending}
      size="lg"
      className="h-11 rounded-lg px-6 shadow-sm"
    >
      <Rocket className="ms-2 size-4" />
      {isPending ? "جاري التفعيل..." : "تفعيل المتجر"}
    </Button>
  );
}