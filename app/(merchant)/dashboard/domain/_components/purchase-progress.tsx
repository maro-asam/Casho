"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { checkDomainPurchaseAction } from "@/actions/store/domain-purchase.actions";
import { tr } from "@/lib/i18n/dashboard";

const POLL_MS = 5_000;

/** A purchase the registrar is still working on: follows it until it's done or refunded. */
export function PurchaseProgress({ id, domain }: { id: string; domain: string }) {
  const router = useRouter();

  useEffect(() => {
    let stopped = false;
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      const res = await checkDomainPurchaseAction(id).catch(() => null);
      if (stopped || !res || res.status === "PENDING") return;
      stopped = true;
      if (res.status === "ACTIVE") toast.success(tr("{0} بقى بتاعك 🎉", domain));
      else toast.error(tr("تسجيل {0} ماكملش ورجّعنا المبلغ لرصيدك.", domain));
      router.refresh();
    };
    const t = setInterval(tick, POLL_MS);
    return () => {
      stopped = true;
      clearInterval(t);
    };
  }, [id, domain, router]);

  return (
    <section className="apple-card flex items-center gap-4 p-5" aria-live="polite">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
        <Loader2 className="size-5 animate-spin" />
      </span>
      <div className="min-w-0 space-y-0.5">
        <p className="text-[17px] font-semibold">{tr("بنسجّل {0}…", domain)}</p>
        <p className="text-[13px] leading-[18px] text-muted-foreground">
          {tr("عادةً بياخد أقل من دقيقة. تقدر تقفل الصفحة — هنبعتلك إشعار أول ما يخلص.")}
        </p>
      </div>
    </section>
  );
}
