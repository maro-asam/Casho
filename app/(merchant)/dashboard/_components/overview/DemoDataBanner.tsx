"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { ClearDemoDataAction } from "@/actions/onboarding/onboarding.actions";
import { appleButton } from "@/components/saas-page";
import { cn } from "@/lib/utils";
import { tr, trv } from "@/lib/i18n/dashboard";

/** Shown while the onboarding sample catalog is still in the store. */
export default function DemoDataBanner() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function clear() {
    startTransition(async () => {
      const result = await ClearDemoDataAction();
      if (result.success) {
        toast.success(trv(result.message));
        router.refresh();
      } else {
        toast.error(trv(result.message));
        setConfirming(false);
      }
    });
  }

  return (
    <section
      aria-label={tr("بيانات تجريبية")}
      className="apple-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-[29px] shrink-0 place-items-center rounded-[7px] bg-(--sys-indigo) text-white">
          <Sparkles className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold">
            {confirming ? tr("نمسح البيانات التجريبية؟") : tr("متجرك فيه بيانات تجريبية")}
          </p>
          <p className="text-[13px] leading-[18px] text-muted-foreground">
            {confirming
              ? tr("المنتجات والطلبات والعملاء التجريبيين هيتمسحوا. منتجاتك وطلباتك الحقيقية مش هتتأثر.")
              : tr("منتجات وطلبات عشان تجرّب بيها. لما تكون جاهز تبيع، امسحها بضغطة.")}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 gap-2">
        {confirming ? (
          <>
            <button type="button" onClick={() => setConfirming(false)} disabled={pending} className={appleButton.tinted}>
              {tr("إلغاء")}
            </button>
            <button type="button" onClick={clear} disabled={pending} className={appleButton.destructiveFilled}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {tr("امسحها")}
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className={cn(appleButton.destructive)}>
            {tr("امسح البيانات التجريبية")}
          </button>
        )}
      </div>
    </section>
  );
}
