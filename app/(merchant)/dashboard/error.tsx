"use client";

// A crashing dashboard page keeps the sidebar and topbar — only the content
// area shows this, with the real message and a way out.

import { useEffect } from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";

import { appleButton } from "@/components/saas-page";
import { errorSummary, reloadOnceForStaleDeploy } from "@/components/common/error-recovery";
import { tdir, tr } from "@/lib/i18n/dashboard";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[dashboard error]", error);
    // An old tab after a deploy: the reload replaces this screen right away.
    reloadOnceForStaleDeploy(error);
  }, [error]);

  return (
    <div dir={tdir()} className="apple-card mx-auto mt-6 max-w-lg space-y-4 p-7 text-center">
      <TriangleAlert className="mx-auto size-10 text-(--sys-orange)" strokeWidth={1.8} />
      <h1 className="text-[22px] font-bold">{tr("الصفحة دي واجهت مشكلة")}</h1>
      <p className="text-[15px] leading-6 text-muted-foreground">
        {tr("باقي لوحة التحكم شغالة عادي. جرّب تاني، ولو المشكلة فضلت ابعت الرسالة اللي تحت للدعم.")}
      </p>
      <p dir="ltr" className="rounded-[12px] bg-(--fill-3) px-3 py-2 text-start font-mono text-[12px] break-all text-muted-foreground">
        {errorSummary(error)}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" onClick={() => reset()} className={appleButton.filled}>
          {tr("حاول تاني")}
        </button>
        <Link href="/support" className={appleButton.gray}>
          {tr("مركز المساعدة")}
        </Link>
      </div>
    </div>
  );
}
