"use client";

// Last line of defense: replaces the root layout when it (or a page without its
// own error boundary) crashes — instead of Next's bare "Application error".
// Must render its own <html>/<body> and can't rely on the app's providers.

import { useEffect } from "react";
import { errorSummary, reloadOnceForStaleDeploy } from "@/components/common/error-recovery";
import "./globals.css";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[global-error]", error);
    // An old tab after a deploy: the reload replaces this screen right away.
    reloadOnceForStaleDeploy(error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body className="grid min-h-screen place-items-center bg-[#f2f2f7] p-6 font-sans text-[#1c1c1e] antialiased">
        <main className="w-full max-w-md space-y-4 rounded-[22px] bg-white p-7 text-center shadow-sm">
          <h1 className="text-[22px] font-bold">حصلت مشكلة في الصفحة</h1>
          <p className="text-[15px] leading-6 text-[#6e6e73]">جرّب تاني. لو المشكلة فضلت، ابعت الرسالة اللي تحت لفريق الدعم.</p>
          <p dir="ltr" className="rounded-[12px] bg-[#f2f2f7] px-3 py-2 text-start font-mono text-[12px] break-all text-[#6e6e73]">
            {errorSummary(error)}
          </p>
          <div className="flex justify-center gap-2">
            <button type="button" onClick={() => reset()} className="h-11 rounded-full bg-[#0a66ff] px-5 text-[15px] font-semibold text-white">
              حاول تاني
            </button>
            <button type="button" onClick={() => window.location.reload()} className="h-11 rounded-full bg-[#f2f2f7] px-5 text-[15px]">
              تحديث الصفحة
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
