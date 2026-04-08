"use client";

import { useTransition } from "react";
import { Sparkles, Send, CheckCircle2, Clock3 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { RequestRemovePoweredByAction } from "@/actions/services/request-remove-powered-by.actions";

type PoweredByCashoCardProps = {
  storeId: string;
  poweredByRemovalEnabled: boolean;
};

export default function PoweredByCashoCard({
  storeId,
  poweredByRemovalEnabled,
}: PoweredByCashoCardProps) {
  const [isPending, startTransition] = useTransition();

  const handleRequest = () => {
    startTransition(async () => {
      try {
        const result = await RequestRemovePoweredByAction(storeId);
        toast.success(result.message);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "حدث خطأ أثناء إرسال الطلب",
        );
      }
    });
  };

  return (
    <div className="rounded-3xl border bg-background p-5 shadow-sm">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
            <Sparkles className="size-4" />
            خدمة إضافية مدفوعة
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-semibold">إزالة Powered by Casho</h3>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              لو حابب تشيل عبارة &quot;يتم التشغيل بواسطة Casho&quot; من فوتر متجرك، ابعت
              طلب من هنا وهيظهر للإدارة للمراجعة والتفعيل.
            </p>
          </div>
        </div>

        {poweredByRemovalEnabled ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="size-4" />
            الخدمة مفعلة
          </div>
        ) : (
          <Button onClick={handleRequest} disabled={isPending}>
            {isPending ? (
              <>
                <Clock3 className="size-4" />
                جاري إرسال الطلب...
              </>
            ) : (
              <>
                <Send className="size-4" />
                اطلب إزالة Powered by
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
